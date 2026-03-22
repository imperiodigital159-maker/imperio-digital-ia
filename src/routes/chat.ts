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

  // Proposta / comercial
  if (p.includes('proposta') || p.includes('comercial') || p.includes('orçamento')) {
    return `# Proposta Comercial — Guia Prático\n\nUma boa proposta comercial tem 5 elementos essenciais:\n\n**1. Entendimento do problema**\nMostre que você entende a dor do cliente antes de falar de você.\n\n**2. Solução clara**\nDescreva o serviço de forma objetiva, com escopo bem definido.\n\n**3. Resultados esperados**\nUse números sempre que possível: "redução de 30% no tempo" ou "aumento de 20% nas vendas".\n\n**4. Investimento justificado**\nApresente o preço com contexto — o que ele deixa de perder ou ganha.\n\n**5. Próximos passos**\nTermine com um CTA claro: "Aprovando até sexta, iniciamos na semana que vem."\n\n💡 **Dica:** Use o módulo de Documentos para gerar uma proposta completa com template profissional!`
  }

  // Marketing / redes sociais
  if (p.includes('marketing') || p.includes('redes sociais') || p.includes('instagram') || p.includes('tiktok') || p.includes('conteúdo') || p.includes('post')) {
    return `# Estratégia de Marketing Digital\n\n## Pilares de Conteúdo para Redes Sociais\n\n**📚 Educativo (40%)** — Dicas, tutoriais, dados do setor\n**🎯 Conversão (20%)** — Ofertas, promoções, CTAs diretos\n**💬 Engajamento (20%)** — Perguntas, enquetes, bastidores\n**🤝 Relacionamento (20%)** — Depoimentos, cases, humanização\n\n## Frequência ideal\n- **Instagram:** 4-5x/semana (Reels prioridade)\n- **TikTok:** 1x/dia (consistência é chave)\n- **LinkedIn:** 3x/semana (conteúdo mais longo)\n- **WhatsApp Business:** diário (status + lista de transmissão)\n\n## Métricas para acompanhar\n- Alcance e impressões\n- Taxa de engajamento (likes + comentários ÷ seguidores)\n- Cliques no link da bio\n- Mensagens diretas recebidas\n\n🎨 Use o **módulo de Imagens** para criar posts profissionais rapidamente!`
  }

  // Precificação
  if (p.includes('preço') || p.includes('precific') || p.includes('cobrar') || p.includes('valor') || p.includes('quanto cobr')) {
    return `# Como Precificar seus Serviços\n\n## Fórmula base\n**Preço = (Custos diretos + Custos indiretos + Pró-labore) × Margem**\n\n## Métodos principais\n\n**💰 Por hora**\n- Calcule: Quanto quer ganhar no mês ÷ horas disponíveis\n- Exemplo: R$ 8.000 ÷ 120h = R$ 67/hora + margem = **~R$ 100/hora**\n\n**📦 Por projeto (pacote)**\n- Estime as horas, multiplique pelo valor/hora\n- Adicione 20% de buffer para imprevistos\n\n**🔄 Recorrente (retainer)**\n- Ideal para serviços contínuos\n- Dê 10-15% de desconto em troca de compromisso mensal\n\n## Erros comuns\n❌ Cobrar pelo tempo em vez de pelo resultado\n❌ Não calcular impostos (MEI: 5-6%, ME: 15-20%)\n❌ Dar desconto sem contrapartida\n\n✅ **Dica de ouro:** pesquise o mercado, mas posicione pelo valor que entrega!`
  }

  // Vendas / clientes / leads
  if (p.includes('cliente') || p.includes('prospecção') || p.includes('vendas') || p.includes('lead') || p.includes('captar')) {
    return `# Estratégia de Prospecção de Clientes\n\n## Canais mais eficazes para pequenos negócios\n\n**1. Indicações (melhor ROI)**\n- Peça ativamente para clientes satisfeitos indicarem\n- Crie um programa de indicação com benefícios\n\n**2. LinkedIn (B2B)**\n- Otimize seu perfil com palavras-chave do seu nicho\n- Conecte-se com decisores e comente em posts relevantes\n\n**3. WhatsApp Business**\n- Catálogo de serviços atualizado\n- Status com conteúdo e ofertas\n- Lista de transmissão segmentada\n\n**4. Google Meu Negócio**\n- Perfil completo com fotos e serviços\n- Responda todas as avaliações\n\n## Script de abordagem\n1. Pesquise o prospect antes de contatar\n2. Personalize a mensagem\n3. Foque no problema que você resolve\n4. Termine com uma pergunta aberta\n\n📄 Use o módulo de Documentos para criar e-mails de prospecção profissionais!`
  }

  // Finanças / fluxo de caixa
  if (p.includes('financ') || p.includes('caixa') || p.includes('dinheiro') || p.includes('lucro') || p.includes('despesa') || p.includes('receita')) {
    return `# Gestão Financeira para Pequenos Negócios\n\n## Fundamentos essenciais\n\n**💳 Separação de contas**\nJamais misture pessoa física e jurídica. Abra uma conta PJ (Nubank PJ, Inter PJ — ambas gratuitas).\n\n**📊 Fluxo de caixa**\nRegistre todas as entradas e saídas diariamente. Use uma planilha simples ou app como Organizze ou Conta Azul.\n\n**📈 Indicadores básicos**\n- **Margem de contribuição** = Receita − Custos variáveis\n- **Ponto de equilíbrio** = Custos fixos ÷ Margem de contribuição (%)\n- **Lucratividade** = Lucro líquido ÷ Receita × 100\n\n## Dicas práticas\n✅ Guarde 20-30% de cada recebimento para impostos\n✅ Tenha reserva de 3 meses de custos fixos\n✅ Revise preços a cada 6 meses\n✅ Emita nota fiscal sempre (protege você e o cliente)\n\n🧾 Use o módulo de Documentos para criar relatórios financeiros profissionais!`
  }

  // Atendimento / suporte
  if (p.includes('atendimento') || p.includes('suporte') || p.includes('reclamação') || p.includes('satisfação') || p.includes('fideliz')) {
    return `# Excelência no Atendimento ao Cliente\n\n## Os 5 pilares do atendimento que fideliza\n\n**1. Velocidade de resposta**\n- WhatsApp: responder em até 1 hora (horário comercial)\n- E-mail: até 4 horas\n- Redes sociais: até 2 horas\n\n**2. Personalização**\n- Use o nome do cliente sempre\n- Lembre de preferências e histórico\n- Antecipar necessidades impressiona\n\n**3. Resolução no primeiro contato**\n- 70% dos problemas devem ser resolvidos sem transferência\n- Tenha FAQ interno para sua equipe\n\n**4. Acompanhamento pós-venda**\n- Mensagem 7 dias após a entrega perguntando sobre o resultado\n- Isso gera indicações espontâneas\n\n**5. Tratamento de reclamações**\n- Nunca discuta, apenas ouça e resolva\n- Transforme insatisfeitos em promotores\n\n💡 Clientes satisfeitos gastam **67% mais** do que novos clientes!`
  }

  // Produtividade / gestão de tempo
  if (p.includes('produtividade') || p.includes('tempo') || p.includes('organiz') || p.includes('rotina') || p.includes('planejamento')) {
    return `# Produtividade para Empreendedores\n\n## Método das 3 prioridades\nTodos os dias, antes de começar, defina as **3 tarefas mais importantes**. Só avance para outras depois de concluí-las.\n\n## Blocos de tempo (Time Blocking)\n- **8h-10h:** Trabalho profundo (sem interrupções)\n- **10h-12h:** Reuniões e atendimentos\n- **14h-16h:** Trabalho operacional\n- **16h-17h:** E-mails e mensagens\n\n## Ferramentas gratuitas\n- **Trello ou Notion** — gestão de projetos\n- **Google Calendar** — blocos de tempo\n- **Toggl** — controle de horas por projeto\n\n## Ladrões de tempo para eliminar\n❌ Verificar WhatsApp a cada 5 minutos\n❌ Reuniões sem pauta e sem horário definido\n❌ Multitarefa (reduz produtividade em 40%)\n\n✅ **Regra 80/20:** 20% das suas atividades geram 80% dos resultados. Descubra quais são essas atividades!`
  }

  // Landing page / site
  if (p.includes('landing page') || p.includes('site') || p.includes('página') || p.includes('conversão') || p.includes('funil')) {
    return `# Landing Page que Converte\n\n## Estrutura campeã\n\n**1. Headline impactante** (acima da dobra)\n- Deixe claro o benefício principal em menos de 10 palavras\n- Exemplo: "Dobre suas vendas em 90 dias com gestão inteligente"\n\n**2. Subheadline**\n- Complementa a headline com mais contexto\n- Quem é para, o que entrega, como funciona\n\n**3. Prova social**\n- 3 depoimentos com foto, nome e resultado concreto\n- Logos de clientes conhecidos se tiver\n\n**4. Benefícios (não features)**\n- Foque no resultado, não na funcionalidade\n- ❌ "Sistema com 50 funcionalidades"\n- ✅ "Economize 3h por dia na gestão"\n\n**5. CTA claro e único**\n- Um único botão de ação\n- Cor que contrasta (verde, laranja, dourado)\n- Texto de ação: "Quero começar agora"\n\n**Taxa de conversão média:** 2-5% (boa), 8%+ (excelente)\n\n🌐 Use o módulo de **Landing Pages** do Império Digital IA para criar a sua agora!`
  }

  // Email marketing
  if (p.includes('email') || p.includes('e-mail') || p.includes('newsletter') || p.includes('lista')) {
    return `# Email Marketing que Funciona\n\n## Por que email ainda é o rei?\n- ROI médio de **R$ 42 para cada R$ 1 investido**\n- Você possui sua lista (diferente de redes sociais)\n- Taxa de abertura média: 20-30%\n\n## Estrutura de email eficaz\n\n**Assunto** (70% do sucesso)\n- Use números: "3 erros que estão sabotando suas vendas"\n- Gere curiosidade: "Você está cometendo esse erro?"\n- Personalize: "João, isso é para você"\n\n**Corpo do email**\n- Parágrafo 1: Contexto / problema\n- Parágrafo 2: Solução / benefício\n- Parágrafo 3: Prova social\n- CTA: Um único link de ação\n\n## Frequência ideal\n- Nutrição: 2-3x/semana\n- Promoções: máximo 1x/semana\n- Newsletter: 1x/semana\n\n## Ferramentas gratuitas\n- **Mailchimp** — até 500 contatos grátis\n- **Brevo (ex-Sendinblue)** — até 300 emails/dia grátis`
  }

  // MEI / CNPJ / juridico
  if (p.includes('mei') || p.includes('cnpj') || p.includes('jurídico') || p.includes('contrato') || p.includes('formaliz')) {
    return `# Formalização do seu Negócio\n\n## MEI — Microempreendedor Individual\n\n**Limite:** Faturamento até R$ 81.000/ano (R$ 6.750/mês)\n\n**Vantagens:**\n✅ Abertura gratuita em minutos (gov.br/mei)\n✅ CNPJ para emitir nota fiscal\n✅ Previdência social incluída\n✅ Taxa mensal fixa: ~R$ 70/mês\n✅ Acesso a crédito empresarial\n\n**Impostos (DAS mensal):**\n- Comércio: R$ 67,60\n- Serviços: R$ 71,60\n- Comércio + Serviços: R$ 72,60\n\n## Contrato de Prestação de Serviços\n\n**Cláusulas essenciais:**\n1. Descrição detalhada do serviço\n2. Prazo de entrega e marcos\n3. Valor e forma de pagamento\n4. Política de revisões (quantas inclui)\n5. Penalidades por atraso (ambos os lados)\n6. Confidencialidade\n7. Rescisão\n\n📄 Use o módulo de Documentos para gerar contratos profissionais em minutos!`
  }

  // Resposta genérica melhorada
  return `# Império Digital IA — Assistente de Negócios\n\nOlá! Recebi sua mensagem: **"${prompt.substring(0, 80)}${prompt.length > 80 ? '...' : ''}"**\n\n## Como posso te ajudar\n\nSou especialista em apoiar pequenos negócios brasileiros. Posso te ajudar com:\n\n**📈 Crescimento**\n- Estratégias de marketing digital\n- Captação e conversão de clientes\n- Posicionamento de marca\n\n**💼 Operação**\n- Propostas e contratos profissionais\n- Precificação e gestão financeira\n- Produtividade e processos\n\n**🎨 Conteúdo**\n- Posts para redes sociais\n- Textos de vendas (copywriting)\n- Scripts de apresentação\n\n**🌐 Digital**\n- Landing pages que convertem\n- Email marketing\n- Funis de vendas\n\n## Próximos passos\n\nMe conte mais sobre o seu negócio e o desafio específico que está enfrentando. Quanto mais contexto você der, mais precisa será minha orientação!\n\n💡 *Dica: Use os módulos de Documentos, Imagens e Landing Pages para colocar as estratégias em prática rapidamente.*\n\n> ⚙️ *Configure sua chave OpenAI em Configurações para respostas com IA generativa avançada e personalizada.*`
}

export default chatRoutes
