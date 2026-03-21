import { Hono } from 'hono'
import { HonoEnv, PLAN_LIMITS } from '../types'
import { authMiddleware } from '../middleware/auth'
import { generateId, getMonthYear } from '../lib/auth'

const documentRoutes = new Hono<HonoEnv>()
documentRoutes.use('*', authMiddleware)

const TEMPLATES: Record<string, { name: string; description: string; fields: string[] }> = {
  proposta_comercial: {
    name: 'Proposta Comercial',
    description: 'Proposta profissional para clientes',
    fields: ['empresa', 'cliente', 'servico', 'valor', 'prazo']
  },
  orcamento: {
    name: 'Orçamento Detalhado',
    description: 'Orçamento com itens e valores',
    fields: ['empresa', 'cliente', 'itens', 'validade']
  },
  contrato_simples: {
    name: 'Contrato Simples',
    description: 'Contrato de prestação de serviços',
    fields: ['prestador', 'contratante', 'servico', 'valor', 'prazo']
  },
  apresentacao_servicos: {
    name: 'Apresentação de Serviços',
    description: 'Apresentação profissional dos seus serviços',
    fields: ['empresa', 'servicos', 'diferenciais', 'cta']
  },
  email_comercial: {
    name: 'E-mail Comercial',
    description: 'E-mail de prospecção ou follow-up',
    fields: ['remetente', 'destinatario', 'objetivo', 'servico']
  },
  copy_anuncio: {
    name: 'Copy para Anúncio',
    description: 'Texto persuasivo para anúncios',
    fields: ['produto', 'publico', 'beneficio', 'cta']
  },
  post_redes_sociais: {
    name: 'Posts para Redes Sociais',
    description: 'Conteúdo engajante para social media',
    fields: ['negocio', 'tema', 'tom', 'plataforma']
  },
  descricao_produto: {
    name: 'Descrição de Produto/Serviço',
    description: 'Descrição persuasiva e completa',
    fields: ['produto', 'beneficios', 'publico', 'preco']
  }
}

// List templates
documentRoutes.get('/templates', async (c) => {
  return c.json({ templates: Object.entries(TEMPLATES).map(([id, t]) => ({ id, ...t })) })
})

// List documents
documentRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const { project_id, template_type } = c.req.query()
  
  let query = 'SELECT id, title, template_type, status, project_id, created_at FROM documents WHERE user_id = ?'
  const params: any[] = [userId]
  
  if (project_id) { query += ' AND project_id = ?'; params.push(project_id) }
  if (template_type) { query += ' AND template_type = ?'; params.push(template_type) }
  
  query += ' ORDER BY created_at DESC LIMIT 50'
  
  const docs = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ documents: docs.results })
})

// Create/generate document
documentRoutes.post('/generate', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  
  const limits = PLAN_LIMITS[user.plan || 'free']
  const monthYear = getMonthYear()
  const usageCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?'
  ).bind(userId, 'document', monthYear).first() as any
  
  if (usageCount.cnt >= limits.documents) {
    return c.json({ error: `Limite de documentos atingido (${limits.documents}/mês no plano ${user.plan})` }, 403)
  }
  
  const { template_type, fields, project_id, title } = await c.req.json()
  
  if (!template_type || !TEMPLATES[template_type]) {
    return c.json({ error: 'Template inválido' }, 400)
  }
  
  const content = generateDocument(template_type, fields || {})
  const docTitle = title || `${TEMPLATES[template_type].name} - ${new Date().toLocaleDateString('pt-BR')}`
  
  const id = generateId()
  await c.env.DB.prepare(
    'INSERT INTO documents (id, user_id, project_id, title, template_type, content, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, project_id || null, docTitle, template_type, content, 'draft').run()
  
  // Log usage
  await c.env.DB.prepare('INSERT INTO usage_logs (id, user_id, action_type, resource_type, resource_id, month_year) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(generateId(), userId, 'create', 'document', id, monthYear).run()
  
  const doc = await c.env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(id).first()
  return c.json({ document: doc })
})

// Get document
documentRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const doc = await c.env.DB.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first()
  if (!doc) return c.json({ error: 'Documento não encontrado' }, 404)
  return c.json({ document: doc })
})

// Update document
documentRoutes.put('/:id', async (c) => {
  const userId = c.get('userId')
  const { title, content, status, project_id } = await c.req.json()
  
  const doc = await c.env.DB.prepare('SELECT id FROM documents WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first()
  if (!doc) return c.json({ error: 'Documento não encontrado' }, 404)
  
  await c.env.DB.prepare(
    'UPDATE documents SET title = ?, content = ?, status = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(title, content, status, project_id || null, c.req.param('id')).run()
  
  const updated = await c.env.DB.prepare('SELECT * FROM documents WHERE id = ?').bind(c.req.param('id')).first()
  return c.json({ document: updated })
})

// Delete document
documentRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  await c.env.DB.prepare('DELETE FROM documents WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).run()
  return c.json({ success: true })
})

function generateDocument(templateType: string, fields: Record<string, string>): string {
  const f = fields
  const date = new Date().toLocaleDateString('pt-BR')

  switch (templateType) {
    case 'proposta_comercial':
      return `# PROPOSTA COMERCIAL

**Empresa:** ${f.empresa || 'Sua Empresa'}
**Cliente:** ${f.cliente || 'Nome do Cliente'}
**Data:** ${date}
**Validade:** 15 dias

---

## 1. Apresentação

Prezado(a) ${f.cliente || 'Cliente'},

É com grande satisfação que apresentamos esta proposta comercial. Nossa empresa ${f.empresa || ''} tem o compromisso de oferecer soluções de alta qualidade que atendam às suas necessidades.

## 2. Entendimento do Projeto

Baseando-nos em nossa conversa, entendemos que você precisa de ${f.servico || 'serviços especializados'} que tragam resultados mensuráveis e impacto positivo no seu negócio.

## 3. Nossa Solução

### Serviços Incluídos:
${f.servico || '• Consultoria especializada\n• Implementação e suporte\n• Treinamento da equipe'}

### Metodologia:
- **Fase 1:** Diagnóstico e planejamento (semana 1-2)
- **Fase 2:** Execução e implementação (semana 3-8)
- **Fase 3:** Entrega e ajustes (semana 9-10)

## 4. Investimento

| Descrição | Valor |
|-----------|-------|
| ${f.servico || 'Serviços'} | ${f.valor || 'A definir'} |
| **Total** | **${f.valor || 'Sob consulta'}** |

**Condições de pagamento:**
- 50% na assinatura do contrato
- 50% na entrega final

## 5. Prazo de Execução

Estimamos ${f.prazo || '30 dias úteis'} para conclusão do projeto, contados a partir da aprovação desta proposta e assinatura do contrato.

## 6. Próximos Passos

Para prosseguirmos, precisamos:
1. Aprovação desta proposta
2. Assinatura do contrato
3. Pagamento da entrada
4. Kickoff do projeto

---

Estamos à disposição para esclarecer qualquer dúvida.

**${f.empresa || 'Sua Empresa'}**
${date}`

    case 'orcamento':
      return `# ORÇAMENTO

**Empresa:** ${f.empresa || 'Sua Empresa'}
**Cliente:** ${f.cliente || 'Nome do Cliente'}
**Data:** ${date}
**Validade:** ${f.validade || '10 dias'}
**Nº do Orçamento:** ORC-${Date.now().toString().slice(-6)}

---

## Itens do Orçamento

${f.itens || `| # | Descrição | Qtd | Valor Unit. | Total |
|---|-----------|-----|-------------|-------|
| 1 | Item/Serviço 1 | 1 | R$ 0,00 | R$ 0,00 |
| 2 | Item/Serviço 2 | 1 | R$ 0,00 | R$ 0,00 |`}

---

**Subtotal:** R$ 0,00
**Desconto:** R$ 0,00
**Total Geral:** R$ 0,00

## Observações

- Preços sujeitos a alteração após o prazo de validade
- Não inclui impostos adicionais
- Frete não incluso (quando aplicável)

## Condições Comerciais

- **Forma de pagamento:** A combinar
- **Prazo de entrega:** A combinar
- **Garantia:** Conforme política da empresa

---

Para aceitar este orçamento, entre em contato conosco.
**${f.empresa || 'Sua Empresa'}** | ${date}`

    case 'email_comercial':
      return `Assunto: ${f.objetivo || 'Uma proposta especial para você'} | ${f.remetente || 'Sua Empresa'}

Olá ${f.destinatario || '[Nome]'},

Espero que este e-mail o encontre bem!

Sou ${f.remetente || '[Seu Nome]'} e venho acompanhando o crescimento do seu negócio com muito interesse.

**Por que estou entrando em contato:**

Identificamos que empresas como a sua frequentemente enfrentam desafios com ${f.objetivo || 'eficiência operacional e crescimento'}. É exatamente isso que nossa solução resolve.

**O que oferecemos:**
✓ ${f.servico || 'Serviço especializado e personalizado'}
✓ Resultados mensuráveis e transparentes
✓ Suporte dedicado durante todo o processo
✓ ROI comprovado em empresas similares

**Por que nos escolher:**
Nossa metodologia já ajudou dezenas de empresas a crescerem mais rapidamente com menos esforço.

Gostaria de agendar uma conversa de 15 minutos para mostrar como podemos ajudar especificamente o seu negócio.

📅 **Quando seria um bom momento para conversarmos?**

Atenciosamente,

${f.remetente || '[Seu Nome]'}
${f.empresa || '[Empresa]'}
[Telefone] | [E-mail] | [Site]

---
*Para cancelar o recebimento de e-mails, responda com "Remover"*`

    case 'copy_anuncio':
      return `# COPY PARA ANÚNCIO

## Versão Curta (para stories/feed)

🎯 **${f.beneficio || 'Transforme seu negócio hoje'}!**

${f.produto || 'Nosso produto/serviço'} é para quem quer ${f.beneficio || 'resultados reais'} sem complicação.

✅ Simples de usar
✅ Resultados comprovados
✅ Suporte dedicado

👇 **${f.cta || 'Saiba mais no link da bio!'}**

---

## Versão Longa (para feed/blog)

**${f.publico || 'Você'} que busca ${f.beneficio || 'crescer seu negócio'}...**

Já imaginou conseguir ${f.beneficio || 'mais clientes e vendas'} de forma consistente?

É exatamente isso que ${f.produto || 'nossa solução'} proporciona para ${f.publico || 'pequenos negócios'} como o seu.

🔥 **O que você vai ter:**
• Resultado 1 comprovado
• Resultado 2 garantido  
• Resultado 3 mensurável

💬 Veja o que nossos clientes dizem:
*"Consegui [resultado específico] em apenas [tempo]" - Cliente Satisfeito*

⏰ Oferta por tempo limitado!

**${f.cta || 'Clique aqui e comece agora!'}** ➡️

---

*Publicidade*`

    case 'post_redes_sociais':
      return `# PACK DE POSTS - ${f.negocio || 'Seu Negócio'}

## Post 1 - Educativo

**Título:** ${f.tema || 'Dica importante'} que todo ${f.publico || 'empreendedor'} precisa saber

**Texto:**
Você sabia que [fato surpreendente sobre ${f.tema || 'o seu nicho'}]?

Aqui vão 3 dicas essenciais:

1️⃣ **Dica 1:** [Conteúdo relevante]
2️⃣ **Dica 2:** [Conteúdo relevante]
3️⃣ **Dica 3:** [Conteúdo relevante]

Salva esse post para não esquecer! 💡

#${(f.negocio || 'negocio').replace(/\s/g, '')} #dicas #empreendedorismo

---

## Post 2 - Engajamento

**Texto:**
Qual é a sua maior dificuldade com ${f.tema || 'o seu negócio'} hoje?

A: Encontrar clientes
B: Organizar processos
C: Aumentar faturamento
D: Outra (comente!)

Conta pra gente nos comentários! 👇

---

## Post 3 - Institucional/Venda

**Texto:**
✨ ${f.negocio || 'Nosso negócio'} existe para ${f.tema || 'transformar sua realidade'}!

Já somos [número] clientes satisfeitos que escolheram nossa solução.

Quer fazer parte? 
👉 Link na bio ou manda uma DM!

#${(f.negocio || 'negocio').replace(/\s/g, '')} #${f.plataforma || 'instagram'}`

    default:
      return `# ${TEMPLATES[templateType]?.name || 'Documento'}

Gerado em ${date}

---

[Conteúdo gerado para ${TEMPLATES[templateType]?.name || templateType}]

Este documento foi criado com Studio IA para Negócios.`
  }
}

export default documentRoutes
