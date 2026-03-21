import { Hono } from 'hono'
import { HonoEnv, PLAN_LIMITS } from '../types'
import { authMiddleware } from '../middleware/auth'
import { generateId, getMonthYear } from '../lib/auth'

const landingPageRoutes = new Hono<HonoEnv>()
landingPageRoutes.use('*', authMiddleware)

// List landing pages
landingPageRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const { project_id } = c.req.query()
  
  let query = 'SELECT id, title, business_name, offer, status, published_url, project_id, created_at FROM landing_pages WHERE user_id = ?'
  const params: any[] = [userId]
  
  if (project_id) { query += ' AND project_id = ?'; params.push(project_id) }
  query += ' ORDER BY created_at DESC LIMIT 50'
  
  const pages = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ landing_pages: pages.results })
})

// Generate landing page
landingPageRoutes.post('/generate', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  
  const limits = PLAN_LIMITS[user.plan || 'free']
  const monthYear = getMonthYear()
  const usageCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?'
  ).bind(userId, 'landing_page', monthYear).first() as any
  
  if (usageCount.cnt >= limits.landing_pages) {
    return c.json({ error: `Limite de landing pages atingido (${limits.landing_pages}/mês no plano ${user.plan})` }, 403)
  }
  
  const { business_name, offer, target_audience, benefits, cta, social_proof, colors, tone, project_id } = await c.req.json()
  
  if (!business_name || !offer) {
    return c.json({ error: 'Nome do negócio e oferta são obrigatórios' }, 400)
  }
  
  const htmlContent = generateLandingPageHTML({
    business_name, offer, target_audience, benefits, cta, social_proof, colors, tone
  })
  
  const id = generateId()
  const pageTitle = `${business_name} - ${offer.substring(0, 40)}`
  
  const contentData = JSON.stringify({ business_name, offer, target_audience, benefits, cta, social_proof, colors, tone, html: htmlContent })
  
  await c.env.DB.prepare(
    'INSERT INTO landing_pages (id, user_id, project_id, title, business_name, offer, content, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, project_id || null, pageTitle, business_name, offer, contentData, 'draft').run()
  
  // Log usage
  await c.env.DB.prepare('INSERT INTO usage_logs (id, user_id, action_type, resource_type, resource_id, month_year) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(generateId(), userId, 'create', 'landing_page', id, monthYear).run()
  
  const page = await c.env.DB.prepare('SELECT * FROM landing_pages WHERE id = ?').bind(id).first()
  return c.json({ landing_page: page, html: htmlContent })
})

// Get landing page
landingPageRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const page = await c.env.DB.prepare('SELECT * FROM landing_pages WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first()
  if (!page) return c.json({ error: 'Landing page não encontrada' }, 404)
  return c.json({ landing_page: page })
})

// Update landing page
landingPageRoutes.put('/:id', async (c) => {
  const userId = c.get('userId')
  const { title, content, status, project_id } = await c.req.json()
  
  await c.env.DB.prepare(
    'UPDATE landing_pages SET title = ?, content = ?, status = ?, project_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
  ).bind(title, content, status, project_id || null, c.req.param('id'), userId).run()
  
  return c.json({ success: true })
})

// Delete landing page
landingPageRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  await c.env.DB.prepare('DELETE FROM landing_pages WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).run()
  return c.json({ success: true })
})

// Preview landing page HTML
landingPageRoutes.get('/:id/preview', async (c) => {
  const userId = c.get('userId')
  const page = await c.env.DB.prepare('SELECT * FROM landing_pages WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first() as any
  if (!page) return c.json({ error: 'Landing page não encontrada' }, 404)
  
  try {
    const contentData = JSON.parse(page.content)
    return c.html(contentData.html || '<p>Sem conteúdo</p>')
  } catch {
    return c.html(page.content)
  }
})

function generateLandingPageHTML(data: {
  business_name: string
  offer: string
  target_audience?: string
  benefits?: string | string[]
  cta?: string
  social_proof?: string
  colors?: string
  tone?: string
}): string {
  const { business_name, offer, target_audience, benefits, cta, social_proof, colors, tone } = data
  
  const primaryColor = colors === 'azul' ? '#3b82f6' : 
                       colors === 'verde' ? '#22c55e' :
                       colors === 'vermelho' ? '#ef4444' :
                       colors === 'roxo' ? '#a855f7' :
                       colors === 'laranja' ? '#f97316' : '#6366f1'
  
  const benefitsList = Array.isArray(benefits) ? benefits : 
    (benefits ? benefits.split('\n').filter(b => b.trim()) : ['Resultados comprovados', 'Suporte especializado', 'Metodologia exclusiva'])
  
  const ctaText = cta || 'Quero começar agora!'
  const audience = target_audience || 'empreendedores e profissionais'
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${business_name} - ${offer}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root { --primary: ${primaryColor}; }
    .btn-primary { background-color: ${primaryColor}; }
    .btn-primary:hover { opacity: 0.9; }
    .text-primary { color: ${primaryColor}; }
    .border-primary { border-color: ${primaryColor}; }
    .bg-hero { background: linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05); }
  </style>
</head>
<body class="font-sans bg-white text-gray-800">

  <!-- Navbar -->
  <nav class="fixed top-0 w-full bg-white/90 backdrop-blur-sm shadow-sm z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <span class="font-bold text-xl text-primary">${business_name}</span>
      <a href="#contato" class="btn-primary text-white px-5 py-2 rounded-full text-sm font-semibold transition-all">${ctaText}</a>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="bg-hero pt-32 pb-20 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <div class="inline-block bg-${primaryColor.includes('6366f1') ? 'indigo' : 'blue'}-100 text-primary px-4 py-1 rounded-full text-sm font-medium mb-6">
        ✨ Para ${audience}
      </div>
      <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
        ${offer}
      </h1>
      <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Descubra como ${business_name} pode transformar os resultados do seu negócio com uma abordagem única e comprovada.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="#contato" class="btn-primary text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg transition-all">
          ${ctaText} →
        </a>
        <a href="#como-funciona" class="border-2 border-primary text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all">
          Como funciona
        </a>
      </div>
    </div>
  </section>

  <!-- Benefits Section -->
  <section class="py-20 px-6 bg-white">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
        Por que escolher <span class="text-primary">${business_name}?</span>
      </h2>
      <p class="text-center text-gray-500 mb-12 text-lg">Tudo que você precisa em um só lugar</p>
      <div class="grid md:grid-cols-3 gap-8">
        ${benefitsList.slice(0, 6).map((b, i) => `
        <div class="bg-gray-50 rounded-2xl p-6 hover:shadow-md transition-all">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4" style="background-color: ${primaryColor}20">
            ${['🎯', '⚡', '🔥', '💎', '🚀', '✅'][i % 6]}
          </div>
          <h3 class="font-bold text-gray-900 mb-2 text-lg">${b.trim()}</h3>
          <p class="text-gray-500 text-sm">Solução completa e personalizada para as suas necessidades específicas.</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section id="como-funciona" class="py-20 px-6 bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
        Como funciona?
      </h2>
      <div class="space-y-8">
        ${[
          { step: '01', title: 'Entre em contato', desc: 'Preencha o formulário abaixo e nossa equipe entrará em contato em menos de 24h.' },
          { step: '02', title: 'Diagnóstico gratuito', desc: 'Fazemos uma análise completa da sua situação atual e identificamos oportunidades.' },
          { step: '03', title: 'Implementação', desc: 'Nossa equipe especializada coloca tudo em prática com acompanhamento próximo.' },
          { step: '04', title: 'Resultados', desc: 'Acompanhe o crescimento e os resultados em tempo real com relatórios claros.' }
        ].map(item => `
        <div class="flex gap-6 items-start">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-xl flex-shrink-0" style="background-color: ${primaryColor}">
            ${item.step}
          </div>
          <div>
            <h3 class="font-bold text-gray-900 text-xl mb-2">${item.title}</h3>
            <p class="text-gray-600">${item.desc}</p>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Social Proof -->
  ${social_proof ? `
  <section class="py-20 px-6 bg-white">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">O que nossos clientes dizem</h2>
      <div class="grid md:grid-cols-3 gap-6">
        ${[social_proof, 'Excelente atendimento e resultados acima do esperado!', 'Recomendo de olhos fechados para qualquer empresário!'].map((testimonial, i) => `
        <div class="bg-gray-50 rounded-2xl p-6">
          <div class="flex items-center gap-1 mb-3">
            ${[1,2,3,4,5].map(() => '<span class="text-yellow-400">★</span>').join('')}
          </div>
          <p class="text-gray-700 mb-4 italic">"${testimonial}"</p>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style="background-color: ${primaryColor}">
              ${['A', 'B', 'C'][i]}
            </div>
            <div>
              <p class="font-semibold text-gray-900">${['Ana Silva', 'Bruno Costa', 'Carla Mendes'][i]}</p>
              <p class="text-sm text-gray-500">${['Empreendedora', 'Consultor', 'CEO - Startup'][i]}</p>
            </div>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </section>` : ''}

  <!-- CTA Section -->
  <section class="py-20 px-6" style="background-color: ${primaryColor}">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
        Pronto para transformar seu negócio?
      </h2>
      <p class="text-white/80 text-xl mb-8">
        Junte-se a centenas de ${audience} que já estão crescendo com ${business_name}
      </p>
      <a href="#contato" class="bg-white text-gray-900 px-10 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all inline-block">
        ${ctaText}
      </a>
    </div>
  </section>

  <!-- Contact Form -->
  <section id="contato" class="py-20 px-6 bg-white">
    <div class="max-w-xl mx-auto">
      <h2 class="text-3xl font-bold text-center text-gray-900 mb-4">Entre em contato</h2>
      <p class="text-center text-gray-500 mb-8">Preencha o formulário e retornaremos em até 24h</p>
      <form class="space-y-4" onsubmit="handleSubmit(event)">
        <input type="text" placeholder="Seu nome completo" required
          class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent text-gray-800" 
          style="focus:ring-color: ${primaryColor}">
        <input type="email" placeholder="Seu melhor e-mail" required
          class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent text-gray-800">
        <input type="tel" placeholder="Seu telefone / WhatsApp"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent text-gray-800">
        <textarea placeholder="Fale um pouco sobre seu negócio..." rows="4"
          class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent text-gray-800 resize-none"></textarea>
        <button type="submit" class="w-full btn-primary text-white py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg">
          ${ctaText} →
        </button>
        <p class="text-center text-xs text-gray-400">Ao enviar, você concorda com nossa política de privacidade</p>
      </form>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-8 px-6 bg-gray-900 text-center">
    <p class="text-gray-400">&copy; ${new Date().getFullYear()} ${business_name}. Todos os direitos reservados.</p>
    <p class="text-gray-600 text-sm mt-2">Criado com Studio IA para Negócios</p>
  </footer>

  <script>
    function handleSubmit(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.textContent = '✅ Mensagem enviada! Entraremos em contato em breve.';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    }
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  </script>
</body>
</html>`
}

export default landingPageRoutes
