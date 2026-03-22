import { Hono } from 'hono'
import { HonoEnv, PLAN_LIMITS } from '../types'
import { authMiddleware } from '../middleware/auth'
import { generateId, getMonthYear } from '../lib/auth'

const chatRoutes = new Hono<HonoEnv>()
chatRoutes.use('*', authMiddleware)

// List sessions
chatRoutes.get('/sessions', async (c) => {
  const userId = c.get('userId')
  const sessions = await c.env.DB.prepare(
    'SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50'
  ).bind(userId).all()
  return c.json({ sessions: sessions.results })
})

// Create session
chatRoutes.post('/sessions', async (c) => {
  const userId = c.get('userId')
  const { title, project_id } = await c.req.json()
  const id = generateId()
  await c.env.DB.prepare(
    'INSERT INTO chat_sessions (id, user_id, project_id, title) VALUES (?, ?, ?, ?)'
  ).bind(id, userId, project_id || null, title || 'Nova conversa').run()
  const session = await c.env.DB.prepare('SELECT * FROM chat_sessions WHERE id = ?').bind(id).first()
  return c.json({ session })
})

// Get session with messages
chatRoutes.get('/sessions/:id', async (c) => {
  const userId = c.get('userId')
  const session = await c.env.DB.prepare(
    'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?'
  ).bind(c.req.param('id'), userId).first()
  if (!session) return c.json({ error: 'Sessão não encontrada' }, 404)
  const messages = await c.env.DB.prepare(
    'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC'
  ).bind(c.req.param('id')).all()
  return c.json({ session, messages: messages.results })
})

// Send message — uses OpenAI if key configured, else fallback
chatRoutes.post('/sessions/:id/messages', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  const sessionId = c.req.param('id')

  const session = await c.env.DB.prepare(
    'SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?'
  ).bind(sessionId, userId).first()
  if (!session) return c.json({ error: 'Sessão não encontrada' }, 404)

  const limits = PLAN_LIMITS[user.plan || 'free']
  const monthYear = getMonthYear()
  const usageCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?'
  ).bind(userId, 'chat', monthYear).first() as any

  if (usageCount.cnt >= limits.chat_messages) {
    return c.json({ error: `Limite de mensagens atingido (${limits.chat_messages}/mês no plano ${user.plan})` }, 403)
  }

  const { content } = await c.req.json()
  if (!content) return c.json({ error: 'Conteúdo é obrigatório' }, 400)

  // Save user message
  const userMsgId = generateId()
  await c.env.DB.prepare(
    'INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)'
  ).bind(userMsgId, sessionId, 'user', content).run()

  // Get previous messages for context (last 10)
  const history = await c.env.DB.prepare(
    'SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at DESC LIMIT 10'
  ).bind(sessionId).all()
  const previousMessages = (history.results as any[]).reverse().slice(0, -1) // exclude the message we just saved

  // Try OpenAI first
  let aiResponse: string
  let usedOpenAI = false

  try {
    const settingsRow = await c.env.DB.prepare(
      'SELECT openai_key FROM user_settings WHERE user_id = ?'
    ).bind(userId).first() as any

    if (settingsRow?.openai_key) {
      aiResponse = await callOpenAI(settingsRow.openai_key, content, previousMessages)
      usedOpenAI = true
    } else {
      aiResponse = generateFallbackResponse(content)
    }
  } catch (err: any) {
    console.error('OpenAI error:', err.message)
    aiResponse = generateFallbackResponse(content)
  }

  // Save AI message
  const aiMsgId = generateId()
  await c.env.DB.prepare(
    'INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)'
  ).bind(aiMsgId, sessionId, 'assistant', aiResponse).run()

  // Update session title
  const sessionData = session as any
  if (sessionData.title === 'Nova conversa') {
    const shortTitle = content.substring(0, 55) + (content.length > 55 ? '...' : '')
    await c.env.DB.prepare(
      'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP, title = ? WHERE id = ?'
    ).bind(shortTitle, sessionId).run()
  } else {
    await c.env.DB.prepare(
      'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(sessionId).run()
  }

  // Log usage
  await c.env.DB.prepare(
    'INSERT INTO usage_logs (id, user_id, action_type, resource_type, resource_id, month_year) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(generateId(), userId, 'create', 'chat', aiMsgId, monthYear).run()

  return c.json({
    userMessage: { id: userMsgId, session_id: sessionId, role: 'user', content, created_at: new Date().toISOString() },
    assistantMessage: { id: aiMsgId, session_id: sessionId, role: 'assistant', content: aiResponse, created_at: new Date().toISOString() },
    model: usedOpenAI ? 'gpt-4o-mini' : 'fallback'
  })
})

// Update session title
chatRoutes.put('/sessions/:id', async (c) => {
  const userId = c.get('userId')
  const { title } = await c.req.json()
  await c.env.DB.prepare(
    'UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ).bind(title, c.req.param('id'), userId).run()
  return c.json({ success: true })
})

// Delete session
chatRoutes.delete('/sessions/:id', async (c) => {
  const userId = c.get('userId')
  await c.env.DB.prepare(
    'DELETE FROM chat_messages WHERE session_id = ?'
  ).bind(c.req.param('id')).run()
  await c.env.DB.prepare(
    'DELETE FROM chat_sessions WHERE id = ? AND user_id = ?'
  ).bind(c.req.param('id'), userId).run()
  return c.json({ success: true })
})

// ─── OpenAI Integration ──────────────────────────────────────
async function callOpenAI(apiKey: string, userMessage: string, history: any[]): Promise<string> {
  const systemPrompt = `Você é um assistente de negócios especializado para pequenas empresas, autônomos, consultores, advogados, médicos, corretores e prestadores de serviço no Brasil.

Seu papel é ajudar com:
- Estratégias de marketing e vendas
- Criação de conteúdo e copywriting
- Propostas comerciais e contratos
- Gestão empresarial e produtividade
- Atendimento ao cliente
- Precificação e finanças básicas
- Redes sociais e presença digital

Seja direto, prático e use exemplos brasileiros. Formate respostas com Markdown quando útil (títulos, listas, negrito). Responda sempre em português brasileiro.`

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1500,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const err = await response.json() as any
    throw new Error(err.error?.message || `OpenAI error ${response.status}`)
  }

  const data = await response.json() as any
  return data.choices[0]?.message?.content || 'Sem resposta da IA.'
}

// ─── Fallback responses ──────────────────────────────────────
function generateFallbackResponse(prompt: string): string {
  const p = prompt.toLowerCase()

  if (p.includes('proposta') || p.includes('comercial')) {
    return `# Proposta Comercial — Guia Prático\n\nUma boa proposta comercial tem 5 elementos essenciais:\n\n**1. Entendimento do problema**\nMostre que você entende a dor do cliente antes de falar de você.\n\n**2. Solução clara**\nDescreva o serviço de forma objetiva, com escopo bem definido.\n\n**3. Resultados esperados**\nUse números sempre que possível: "redução de 30% no tempo" ou "aumento de 20% nas vendas".\n\n**4. Investimento justificado**\nApresente o preço com contexto — o que ele deixa de perder ou ganha.\n\n**5. Próximos passos**\nTermine com um CTA claro: "Aprovando até sexta, iniciamos na semana que vem."\n\n💡 **Dica:** Use o módulo de Documentos para gerar uma proposta completa com template profissional!`
  }

  if (p.includes('marketing') || p.includes('redes sociais') || p.includes('instagram') || p.includes('conteúdo')) {
    return `# Estratégia de Marketing Digital\n\n## Pilares de Conteúdo para Redes Sociais\n\n**📚 Educativo (40%)** — Dicas, tutoriais, dados do setor\n**🎯 Conversão (20%)** — Ofertas, promoções, CTAs diretos\n**💬 Engajamento (20%)** — Perguntas, enquetes, bastidores\n**🤝 Relacionamento (20%)** — Depoimentos, cases, humanização\n\n## Frequência ideal\n- **Instagram:** 4-5x/semana (Reels prioridade)\n- **LinkedIn:** 3x/semana (conteúdo mais longo)\n- **WhatsApp Business:** diário (status + lista de transmissão)\n\n## Métricas para acompanhar\n- Alcance e impressões\n- Taxa de engajamento (likes + comentários ÷ seguidores)\n- Cliques no link da bio\n- Mensagens diretas recebidas\n\n🎨 Use o **módulo de Imagens** para criar posts profissionais rapidamente!`
  }

  if (p.includes('preço') || p.includes('precific') || p.includes('cobrar') || p.includes('valor')) {
    return `# Como Precificar seus Serviços\n\n## Fórmula base\n**Preço = (Custos diretos + Custos indiretos + Pró-labore) × Margem**\n\n## Métodos principais\n\n**💰 Por hora**\n- Calcule: Quanto quer ganhar no mês ÷ horas disponíveis\n- Exemplo: R$ 8.000 ÷ 120h = R$ 67/hora + margem = **~R$ 100/hora**\n\n**📦 Por projeto (pacote)**\n- Estime as horas, multiplique pelo valor/hora\n- Adicione 20% de buffer para imprevistos\n- Mais previsível para o cliente\n\n**🔄 Recorrente (retainer)**\n- Ideal para serviços contínuos\n- Dê 10-15% de desconto em troca de compromisso mensal\n- Muito mais estabilidade financeira\n\n## Erros comuns\n❌ Cobrar pelo tempo em vez de pelo resultado\n❌ Não calcular impostos (MEI: 5-6%, ME: 15-20%)\n❌ Dar desconto sem contrapartida\n\n✅ **Dica de ouro:** pesquise o mercado, mas posicione pelo valor que entrega, não pelo menor preço.`
  }

  if (p.includes('cliente') || p.includes('prospecção') || p.includes('vendas') || p.includes('lead')) {
    return `# Estratégia de Prospecção de Clientes\n\n## Canais mais eficazes para pequenos negócios\n\n**1. Indicações (melhor ROI)**\n- Peça ativamente para clientes satisfeitos indicarem\n- Crie um programa de indicação com benefícios\n- Mantenha relacionamento pós-venda ativo\n\n**2. LinkedIn (B2B)**\n- Otimize seu perfil com palavras-chave do seu nicho\n- Conecte-se com decisores e comente em posts relevantes\n- Publique cases e resultados regularmente\n\n**3. WhatsApp Business**\n- Catálogo de serviços atualizado\n- Status com conteúdo e ofertas\n- Lista de transmissão segmentada\n\n**4. Google Meu Negócio**\n- Perfil completo com fotos e serviços\n- Responda todas as avaliações\n- Poste atualizações semanais\n\n## Script de abordagem\n1. Pesquise o prospect antes de contatar\n2. Personalize a mensagem com algo específico do negócio dele\n3. Foque no problema que você resolve, não no seu serviço\n4. Termine com uma pergunta aberta ou CTA suave\n\n📄 Use o módulo de Documentos para criar e-mails de prospecção profissionais!`
  }

  return `# Resposta da IA Studio\n\nEntendi sua mensagem: **"${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"**\n\n## Análise e Recomendações\n\nCom base no contexto apresentado, aqui estão os pontos mais relevantes para o seu negócio:\n\n**🎯 Foco principal**\nIdentifique qual é o maior gargalo atual — se é captação de clientes, conversão, entrega ou retenção — e ataque um problema de cada vez.\n\n**📋 Próximos passos práticos**\n\n1. **Mapeie onde você está agora** — documente processos, métricas e resultados atuais\n2. **Defina o objetivo com prazo** — use metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes, Temporais)\n3. **Execute em ciclos curtos** — teste em 2 semanas, meça, ajuste, repita\n4. **Documente o que funciona** — crie processos replicáveis\n\n**💡 Dica especial**\nPara avançar mais rápido, use os módulos do Império Digital IA para criar documentos, imagens e landing pages que suportem suas ações!\n\nPosso aprofundar qualquer aspecto específico. Qual ponto você quer explorar mais? 🚀\n\n> ⚙️ *Configure sua chave OpenAI em Configurações para respostas com IA real e avançada.*`
}

export default chatRoutes
