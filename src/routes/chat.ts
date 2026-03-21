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
  const session = await c.env.DB.prepare('SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first()
  if (!session) return c.json({ error: 'Sessão não encontrada' }, 404)
  
  const messages = await c.env.DB.prepare(
    'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC'
  ).bind(c.req.param('id')).all()
  
  return c.json({ session, messages: messages.results })
})

// Send message (AI response simulated)
chatRoutes.post('/sessions/:id/messages', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  const sessionId = c.req.param('id')
  
  const session = await c.env.DB.prepare('SELECT * FROM chat_sessions WHERE id = ? AND user_id = ?').bind(sessionId, userId).first()
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
  if (!content) return c.json({ error: 'Conteúdo da mensagem é obrigatório' }, 400)
  
  // Save user message
  const userMsgId = generateId()
  await c.env.DB.prepare('INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)').bind(userMsgId, sessionId, 'user', content).run()
  
  // Generate AI response
  const aiResponse = await generateAIResponse(content, user.plan)
  
  const aiMsgId = generateId()
  await c.env.DB.prepare('INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)').bind(aiMsgId, sessionId, 'assistant', aiResponse).run()
  
  // Update session timestamp and title
  const sessionData = session as any
  if (sessionData.title === 'Nova conversa') {
    const shortTitle = content.substring(0, 50) + (content.length > 50 ? '...' : '')
    await c.env.DB.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP, title = ? WHERE id = ?').bind(shortTitle, sessionId).run()
  } else {
    await c.env.DB.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(sessionId).run()
  }
  
  // Log usage
  await c.env.DB.prepare('INSERT INTO usage_logs (id, user_id, action_type, resource_type, resource_id, month_year) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(generateId(), userId, 'create', 'chat', aiMsgId, monthYear).run()
  
  return c.json({
    userMessage: { id: userMsgId, session_id: sessionId, role: 'user', content, created_at: new Date().toISOString() },
    assistantMessage: { id: aiMsgId, session_id: sessionId, role: 'assistant', content: aiResponse, created_at: new Date().toISOString() }
  })
})

// Delete session
chatRoutes.delete('/sessions/:id', async (c) => {
  const userId = c.get('userId')
  await c.env.DB.prepare('DELETE FROM chat_sessions WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).run()
  return c.json({ success: true })
})

async function generateAIResponse(prompt: string, plan: string): Promise<string> {
  const lowerPrompt = prompt.toLowerCase()
  
  if (lowerPrompt.includes('proposta') || lowerPrompt.includes('comercial')) {
    return `# Resposta sobre Proposta Comercial

Com base no que você mencionou, aqui estão os pontos principais para estruturar sua proposta:

## Estrutura Recomendada

**1. Abertura Impactante**
- Comece com o problema que você resolve
- Mostre que entende as dores do cliente

**2. Solução Clara**
- Descreva o serviço de forma objetiva
- Destaque os diferenciais

**3. Benefícios Tangíveis**
- Liste resultados esperados com números sempre que possível
- Use casos de sucesso semelhantes

**4. Investimento e ROI**
- Apresente o preço de forma clara
- Mostre o retorno esperado

**5. Próximos Passos**
- Defina um CTA claro
- Estabeleça prazo para resposta

💡 **Dica:** Use o módulo de Documentos para gerar uma proposta completa com templates prontos!`
  }
  
  if (lowerPrompt.includes('marketing') || lowerPrompt.includes('redes sociais') || lowerPrompt.includes('social')) {
    return `# Estratégia de Marketing para Redes Sociais

Ótima pergunta! Vou compartilhar as melhores práticas:

## Pilares de Conteúdo

**📚 Educativo (40%)**
- Dicas e tutoriais da sua área
- Explicação de conceitos relevantes
- FAQs do seu negócio

**🎯 Conversão (20%)**
- Ofertas e promoções
- Depoimentos de clientes
- CTAs claros

**💬 Engajamento (20%)**
- Perguntas para a audiência
- Bastidores do negócio
- Trends adaptadas ao nicho

**🤝 Relacionamento (20%)**
- Conteúdo pessoal e humanizado
- Cases de sucesso
- Parceiros e colaborações

## Frequência Ideal
- Instagram: 4-7 posts por semana
- LinkedIn: 3-5 posts por semana  
- Facebook: 3-5 posts por semana

🎨 **Use o módulo de Imagens** para criar posts profissionais para suas campanhas!`
  }

  if (lowerPrompt.includes('contrat') || lowerPrompt.includes('jurídic') || lowerPrompt.includes('legal')) {
    return `# Orientações sobre Contratos

Para contratos comerciais, aqui estão os elementos essenciais:

## Cláusulas Fundamentais

**1. Identificação das Partes**
- Nome completo/razão social
- CPF/CNPJ e endereços

**2. Objeto do Contrato**
- Descrição detalhada do serviço
- Escopo e entregáveis

**3. Valores e Pagamentos**
- Valor total e forma de pagamento
- Cronograma de parcelas
- Penalidades por atraso

**4. Prazo de Vigência**
- Data de início e término
- Condições de renovação

**5. Confidencialidade**
- Proteção de informações sensíveis

**6. Rescisão**
- Condições para encerramento
- Multas rescisórias

⚠️ **Importante:** Sempre consulte um advogado para validar contratos importantes.

📄 **Use o módulo de Documentos** para gerar um contrato base com nossos templates!`
  }

  if (lowerPrompt.includes('preço') || lowerPrompt.includes('precifica') || lowerPrompt.includes('valor') || lowerPrompt.includes('cobrar')) {
    return `# Como Precificar seus Serviços

Precificação é estratégica. Veja os principais métodos:

## Métodos de Precificação

**💰 Por Hora**
- Calcule seu valor/hora ideal
- Considere: (salário desejado + custos) ÷ horas trabalhadas
- Adicione margem de 30-50%

**📦 Por Pacote/Projeto**
- Mais previsível para o cliente
- Defina claramente o escopo
- Inclua buffer para imprevistos (20%)

**🔄 Recorrente (Retainer)**
- Ideal para serviços contínuos
- Maior estabilidade financeira
- Desconto em troca de compromisso

## Calculando seu Preço

1. **Custos diretos:** Ferramentas, materiais, freelancers
2. **Custos indiretos:** Aluguel, energia, internet
3. **Pró-labore:** O quanto você quer receber
4. **Margem:** 20-40% sobre o total
5. **Impostos:** Dependendo do regime tributário

## Dica de Ouro
Pesquise concorrentes + posicione pelo valor que entrega, não pelo menor preço!`
  }

  // Generic intelligent response
  const topics = [
    { trigger: 'cliente', topic: 'gestão de clientes' },
    { trigger: 'vendas', topic: 'estratégias de vendas' },
    { trigger: 'produto', topic: 'desenvolvimento de produtos' },
    { trigger: 'equipe', topic: 'gestão de equipes' },
  ]
  
  const matchedTopic = topics.find(t => lowerPrompt.includes(t.trigger))
  
  return `# Resposta da IA Studio

Entendi sua pergunta sobre: **"${prompt.substring(0, 60)}${prompt.length > 60 ? '...' : ''}"**

## Análise e Recomendações

Com base no contexto apresentado, aqui estão insights relevantes para o seu negócio:

**🎯 Ponto Principal**
${matchedTopic ? `Para ${matchedTopic.topic}, é fundamental ter uma abordagem estruturada e consistente.` : 'Para alcançar seus objetivos, é importante ter clareza sobre os próximos passos.'}

**📋 Ações Recomendadas**

1. **Mapeie o cenário atual**
   - Identifique pontos fortes e oportunidades
   - Analise o que está funcionando

2. **Defina objetivos claros**
   - Use metas SMART (Específicas, Mensuráveis, Atingíveis, Relevantes, Temporais)
   - Priorize as ações de maior impacto

3. **Execute com consistência**
   - Estabeleça uma rotina
   - Meça resultados regularmente

4. **Itere e melhore**
   - Aprenda com os dados
   - Ajuste a estratégia conforme necessário

**💡 Dica Especial**
Use os módulos do Studio IA para criar documentos, imagens e landing pages que suportem suas ações!

Tem alguma dúvida específica sobre algum desses pontos? Posso aprofundar qualquer aspecto! 🚀`
}

export default chatRoutes
