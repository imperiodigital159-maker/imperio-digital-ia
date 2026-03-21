// ============================================================
// STUDIO IA PARA NEGÓCIOS - Frontend App
// ============================================================

const API = '/api'
let currentUser = null
let authToken = null
let currentRoute = '/'

// ============================================================
// UTILITIES
// ============================================================
function $(id) { return document.getElementById(id) }
function qs(sel, ctx = document) { return ctx.querySelector(sel) }
function qsa(sel, ctx = document) { return [...ctx.querySelectorAll(sel)] }

function getToken() {
  return localStorage.getItem('studio_token') || getCookie('auth_token')
}

function setToken(token) {
  localStorage.setItem('studio_token', token)
  document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 3600}`
}

function clearToken() {
  localStorage.removeItem('studio_token')
  localStorage.removeItem('studio_user')
  document.cookie = 'auth_token=; path=/; max-age=0'
}

function getCookie(name) {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)')
  return v ? v[2] : null
}

async function api(method, path, body) {
  const token = getToken()
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(API + path, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Erro na requisição')
  return data
}

function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function timeAgo(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return `${Math.floor(diff / 86400)}d atrás`
}

function renderMD(text) {
  if (typeof marked !== 'undefined') {
    try { return marked.parse(text) } catch { return text }
  }
  return text.replace(/\n/g, '<br>')
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div')
  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-yellow-500', warning: 'bg-yellow-500' }
  t.className = `fixed bottom-6 right-6 z-[9999] ${colors[type] || colors.success} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade flex items-center gap-2`
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3500)
}

function showLoader(container, msg = 'Carregando...') {
  if (container) container.innerHTML = `<div class="flex flex-col items-center justify-center py-16 text-gray-400"><div class="w-10 h-10 border-3 border-yellow-800 border-t-yellow-500 rounded-full spinner mb-4" style="border-width:3px"></div><p class="text-sm">${msg}</p></div>`
}

function truncate(str, n = 50) {
  return str && str.length > n ? str.substring(0, n) + '...' : str || ''
}

// ============================================================
// ROUTER
// ============================================================
function navigate(route) {
  currentRoute = route
  window.history.pushState({}, '', route)
  render()
}

window.addEventListener('popstate', () => {
  currentRoute = window.location.pathname
  render()
})

// ============================================================
// AUTH CHECK
// ============================================================
async function checkAuth() {
  const token = getToken()
  if (!token) return false
  try {
    const cached = localStorage.getItem('studio_user')
    if (cached) {
      currentUser = JSON.parse(cached)
    }
    const data = await api('GET', '/auth/me')
    currentUser = data.user
    localStorage.setItem('studio_user', JSON.stringify(currentUser))
    return true
  } catch {
    clearToken()
    return false
  }
}

// ============================================================
// MAIN RENDER
// ============================================================
async function render() {
  const app = document.getElementById('app')
  const route = currentRoute

  // Public routes
  if (route === '/' || route === '') {
    app.innerHTML = renderLandingPage()
    initLandingPage()
    return
  }
  if (route === '/login') {
    app.innerHTML = renderAuthPage('login')
    initAuthPage()
    return
  }
  if (route === '/cadastro') {
    app.innerHTML = renderAuthPage('register')
    initAuthPage()
    return
  }

  // Protected routes
  const authed = await checkAuth()
  if (!authed) {
    navigate('/login')
    return
  }

  app.innerHTML = renderAppShell()
  initSidebar()

  const main = document.getElementById('main-content')

  if (route === '/dashboard') renderDashboard(main)
  else if (route === '/chat') renderChat(main)
  else if (route.startsWith('/chat/')) renderChat(main, route.split('/')[2])
  else if (route === '/documentos') renderDocuments(main)
  else if (route.startsWith('/documentos/')) renderDocumentEditor(main, route.split('/')[2])
  else if (route === '/imagens') renderImages(main)
  else if (route === '/landing-pages') renderLandingPages(main)
  else if (route.startsWith('/landing-pages/')) renderLandingPageEditor(main, route.split('/')[2])
  else if (route === '/projetos') renderProjects(main)
  else if (route.startsWith('/projetos/')) renderProjectDetail(main, route.split('/')[2])
  else if (route === '/conta') renderAccount(main)
  else if (route === '/analytics') renderAnalytics(main)
  else renderDashboard(main)
}

// ============================================================
// APP SHELL
// ============================================================
function renderAppShell() {
  return `
  <div class="flex h-screen overflow-hidden" style="background:#0A0A0A">
    <!-- Sidebar -->
    <aside id="sidebar" class="sidebar w-64 flex flex-col h-screen fixed left-0 top-0 z-40 -translate-x-full lg:translate-x-0 transition-transform duration-300">
      <div class="p-5" style="border-bottom:1px solid rgba(212,175,55,0.15)">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <i class="fas fa-brain text-black text-sm"></i>
          </div>
          <div>
            <h1 class="font-bold text-sm leading-tight" style="color:#F5F0E8">Studio IA</h1>
            <p class="text-xs" style="color:#6B6355">para Negócios</p>
          </div>
        </div>
      </div>
      
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <p class="text-xs font-semibold uppercase tracking-wider px-2 mb-3" style="color:#6B6355">Workspace</p>
        ${[
          { icon: 'fa-house', label: 'Dashboard', route: '/dashboard' },
          { icon: 'fa-comments', label: 'Chat IA', route: '/chat' },
          { icon: 'fa-file-lines', label: 'Documentos', route: '/documentos' },
          { icon: 'fa-image', label: 'Imagens', route: '/imagens' },
          { icon: 'fa-globe', label: 'Landing Pages', route: '/landing-pages' },
          { icon: 'fa-folder', label: 'Projetos', route: '/projetos' },
          { icon: 'fa-chart-bar', label: 'Analytics', route: '/analytics' },
        ].map(item => `
          <button onclick="navigate('${item.route}'); closeSidebar()" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 ${currentRoute === item.route || currentRoute.startsWith(item.route + '/') ? 'active' : ''}" id="nav-${item.route.replace(/\//g, '').replace(/-/g, '')}">
            <i class="fas ${item.icon} w-4 text-center"></i>
            <span>${item.label}</span>
          </button>
        `).join('')}
        
        <div class="pt-4 mt-4" style="border-top:1px solid rgba(212,175,55,0.15)">
          <p class="text-xs font-semibold uppercase tracking-wider px-2 mb-3" style="color:#6B6355">Conta</p>
          <button onclick="navigate('/conta'); closeSidebar()" class="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 ${currentRoute === '/conta' ? 'active' : ''}">
            <i class="fas fa-user-circle w-4 text-center"></i>
            <span>Minha Conta</span>
          </button>
        </div>
      </nav>
      
      <!-- User info -->
      <div class="p-4" style="border-top:1px solid rgba(212,175,55,0.15)">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            ${currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate" style="color:#F5F0E8">${currentUser?.name || 'Usuário'}</p>
            <p class="text-xs" style="color:#6B6355">${currentUser?.plan === 'pro' ? '⭐ Plano Pro' : 'Plano Grátis'}</p>
          </div>
          <button onclick="logout()" class="transition-colors" style="color:#6B6355" onmouseover="this.style.color='#F87171'" onmouseout="this.style.color='#6B6355'" title="Sair">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-30 hidden lg:hidden" onclick="toggleSidebar()"></div>

    <!-- Main content -->
    <div class="flex-1 flex flex-col ml-64">
      <!-- Top bar -->
      <header class="px-6 py-4 flex items-center justify-between sticky top-0 z-20" style="background:#111111; border-bottom:1px solid rgba(212,175,55,0.15)">
        <div class="flex items-center gap-3">
          <button onclick="toggleSidebar()" class="lg:hidden" style="color:#A09880">
            <i class="fas fa-bars text-lg"></i>
          </button>
          <div id="breadcrumb" class="text-sm text-gray-500"></div>
        </div>
        <div class="flex items-center gap-3">
          <span class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${currentUser?.plan === 'pro' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gray-100 text-gray-600'}">
            ${currentUser?.plan === 'pro' ? '<i class="fas fa-star text-yellow-500"></i> Pro' : '<i class="fas fa-user"></i> Grátis'}
          </span>
          <button onclick="navigate('/conta')" class="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm">
            ${currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main id="main-content" class="flex-1 overflow-y-auto p-6" style="background:#0A0A0A">
        <div class="flex items-center justify-center h-full">
          <div class="w-8 h-8 border-2 border-yellow-800 border-t-yellow-500 rounded-full spinner"></div>
        </div>
      </main>
    </div>
  </div>`
}

function initSidebar() {
  // Update active states
  qsa('[id^="nav-"]').forEach(el => {
    el.classList.remove('active')
  })
  // On mobile, hide sidebar by default
  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById('sidebar')
    if (sidebar) sidebar.classList.add('-translate-x-full')
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebar-overlay')
  if (!sidebar) return
  sidebar.classList.toggle('-translate-x-full')
  if (overlay) overlay.classList.toggle('hidden')
}

function closeSidebar() {
  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById('sidebar')
    const overlay = document.getElementById('sidebar-overlay')
    if (sidebar) sidebar.classList.add('-translate-x-full')
    if (overlay) overlay.classList.add('hidden')
  }
}

function logout() {
  clearToken()
  currentUser = null
  navigate('/')
  showToast('Você saiu da conta', 'info')
}

// ============================================================
// LANDING PAGE
// ============================================================
function renderLandingPage() {
  return `
  <div class="min-h-screen font-sans" style="background-color: #0A0A0A; color: #F5F0E8">
    <!-- Navbar -->
    <nav class="fixed top-0 w-full backdrop-blur-xl z-50" style="background: rgba(10,10,10,0.9); border-bottom: 1px solid rgba(212,175,55,0.2)">
      <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <i class="fas fa-brain text-black text-sm"></i>
          </div>
          <span class="font-bold" style="color:#F5F0E8">Studio IA</span>
        </div>
        <div class="hidden md:flex items-center gap-8 text-sm" style="color:#A09880">
          <a href="#funcionalidades" class="hover:text-yellow-400 transition-colors">Funcionalidades</a>
          <a href="#como-funciona" class="hover:text-yellow-400 transition-colors">Como Funciona</a>
          <a href="#planos" class="hover:text-yellow-400 transition-colors">Planos</a>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="navigate('/login')" class="text-sm font-medium transition-colors" style="color:#A09880">Entrar</button>
          <button onclick="navigate('/cadastro')" class="btn-primary px-5 py-2 rounded-xl text-sm font-semibold">Começar grátis</button>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <section class="pt-32 pb-24 px-6 relative overflow-hidden" style="background: linear-gradient(135deg, #0A0A0A 0%, #111111 50%, #0A0A0A 100%)">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl" style="background:radial-gradient(circle, rgba(212,175,55,0.15), transparent); opacity:0.8"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl" style="background:radial-gradient(circle, rgba(168,137,26,0.12), transparent); opacity:0.8"></div>
      </div>
      <div class="max-w-5xl mx-auto text-center relative">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-8" style="background:rgba(212,175,55,0.1); border:1px solid rgba(212,175,55,0.35); color:#D4AF37">
          <span class="w-2 h-2 rounded-full animate-pulse" style="background:#D4AF37"></span>
          Plataforma de IA para Pequenos Negócios
        </div>
        <h1 class="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight" style="color:#F5F0E8">
          Crie, organize e <br><span class="gradient-text">cresça com IA</span>
        </h1>
        <p class="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed" style="color:#A09880">
          Uma central de criação com IA para pequenos negócios criarem documentos, imagens e páginas — em um só lugar.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button onclick="navigate('/cadastro')" class="btn-primary px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-yellow-900/30">
            Começar gratuitamente <i class="fas fa-arrow-right ml-2"></i>
          </button>
          <button onclick="navigate('/login')" class="btn-secondary px-8 py-4 rounded-2xl text-lg font-semibold">
            <i class="fas fa-play mr-2"></i> Ver demonstração
          </button>
        </div>
        <p class="text-sm" style="color:#6B6355">Sem cartão de crédito • Começa em 30 segundos • Cancele quando quiser</p>
      </div>
      
      <!-- App preview -->
      <div class="max-w-5xl mx-auto mt-16 relative">
        <!-- Glow effect behind preview -->
        <div class="absolute inset-0 rounded-3xl blur-2xl opacity-20" style="background: radial-gradient(ellipse, #D4AF37, transparent 70%); transform: scale(0.9) translateY(20px)"></div>
        <div class="relative rounded-3xl overflow-hidden" style="background:#111111; border:1px solid rgba(212,175,55,0.35); box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.1)">
          <!-- Browser chrome -->
          <div class="px-4 py-3 flex items-center gap-2" style="background:#0D0D0D; border-bottom:1px solid rgba(212,175,55,0.2)">
            <div class="w-3 h-3 rounded-full" style="background:#FF5F57"></div>
            <div class="w-3 h-3 rounded-full" style="background:#FFBD2E"></div>
            <div class="w-3 h-3 rounded-full" style="background:#28C840"></div>
            <div class="flex-1 rounded-lg mx-4 py-1 px-3 text-xs text-center" style="background:#1A1A1A; color:#6B6355; border:1px solid rgba(212,175,55,0.1)">studio-ia.negócios.app</div>
          </div>
          <!-- App content -->
          <div class="flex" style="height: 340px">
            <!-- Sidebar preview -->
            <div class="w-44 p-4 flex-shrink-0" style="background:#111111; border-right:1px solid rgba(212,175,55,0.15)">
              <div class="flex items-center gap-2 mb-5">
                <div class="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                  <i class="fas fa-brain text-black" style="font-size:10px"></i>
                </div>
                <span class="text-xs font-bold" style="color:#D4AF37">Studio IA</span>
              </div>
              ${['Dashboard','Chat IA','Documentos','Imagens','Landing Pages','Projetos'].map((item, i) => `
              <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs font-medium" style="${i === 0 ? 'background:rgba(212,175,55,0.15); color:#D4AF37; border-left:2px solid #D4AF37; padding-left:8px' : 'color:#6B6355'}">
                <div class="w-2.5 h-2.5 rounded flex-shrink-0" style="background:${i === 0 ? '#D4AF37' : '#2A2A2A'}"></div>${item}
              </div>`).join('')}
            </div>
            <!-- Main content preview -->
            <div class="flex-1 p-5" style="background:#0A0A0A">
              <!-- Welcome bar -->
              <div class="rounded-xl p-3 mb-3 flex items-center justify-between" style="background:#111111; border:1px solid rgba(212,175,55,0.15)">
                <div>
                  <div class="h-3 rounded mb-1" style="background:#2A2A2A; width:120px"></div>
                  <div class="h-2 rounded" style="background:#1A1A1A; width:160px"></div>
                </div>
                <div class="h-7 w-20 rounded-lg gradient-bg" style="opacity:0.9"></div>
              </div>
              <!-- Stats cards -->
              <div class="grid grid-cols-3 gap-2 mb-3">
                ${[
                  { label: 'Chat', val: '12/30' },
                  { label: 'Docs', val: '3/5' },
                  { label: 'Imgs', val: '2/5' }
                ].map(s => `
                <div class="rounded-lg p-2" style="background:#111111; border:1px solid rgba(212,175,55,0.12)">
                  <div class="text-xs mb-1" style="color:#6B6355">${s.label}</div>
                  <div class="text-sm font-bold" style="color:#D4AF37">${s.val}</div>
                  <div class="h-1 rounded-full mt-1" style="background:#1A1A1A">
                    <div class="h-1 rounded-full gradient-bg" style="width:40%"></div>
                  </div>
                </div>`).join('')}
              </div>
              <!-- Recent items -->
              <div class="grid grid-cols-2 gap-2">
                ${['Proposta Cliente A','Landing Page Promo'].map(title => `
                <div class="rounded-lg p-2" style="background:#111111; border:1px solid rgba(212,175,55,0.1)">
                  <div class="flex items-center gap-2 mb-1">
                    <div class="w-5 h-5 rounded flex items-center justify-center" style="background:rgba(212,175,55,0.15)">
                      <i class="fas fa-file-lines" style="color:#D4AF37; font-size:8px"></i>
                    </div>
                    <span class="text-xs truncate" style="color:#A09880">${title}</span>
                  </div>
                  <div class="h-8 rounded" style="background:#0A0A0A"></div>
                </div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Social proof -->
    <div class="py-10" style="background:#0A0A0A; border-top:1px solid rgba(212,175,55,0.15); border-bottom:1px solid rgba(212,175,55,0.15)">
      <div class="max-w-5xl mx-auto px-6">
        <p class="text-center text-sm mb-6 uppercase tracking-wider font-medium" style="color:#6B6355">Ideal para profissionais de</p>
        <div class="flex flex-wrap justify-center gap-8">
          ${['Consultorias', 'Clínicas', 'Agências', 'Advogados', 'Corretores', 'Freelancers', 'Coaches', 'E-commerce'].map(item => `
          <span class="font-semibold" style="color:#A09880">${item}</span>`).join('')}
        </div>
      </div>
    </div>

    <!-- Features -->
    <section id="funcionalidades" class="py-24 px-6" style="background:#111111">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-black mb-4" style="color:#F5F0E8">Tudo que você precisa <br><span class="gradient-text">em um só lugar</span></h2>
          <p class="text-xl max-w-2xl mx-auto" style="color:#A09880">Substitua dezenas de ferramentas por uma plataforma completa e inteligente.</p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${[
            { icon: 'fa-comments', color: 'indigo', title: 'Chat com IA', desc: 'Converse com uma IA especializada em negócios. Tire dúvidas, peça estratégias, gere ideias e muito mais com histórico completo.' },
            { icon: 'fa-file-contract', color: 'purple', title: 'Gerador de Documentos', desc: 'Propostas, contratos, e-mails e copies gerados em segundos com templates profissionais para cada necessidade.' },
            { icon: 'fa-image', color: 'pink', title: 'Criador de Imagens', desc: 'Posts, banners e criativos para anúncios criados com IA. Visual profissional sem precisar de designer.' },
            { icon: 'fa-globe', color: 'blue', title: 'Landing Pages', desc: 'Crie páginas de vendas completas em minutos. Design bonito, copy persuasivo e formulário de captura prontos.' },
            { icon: 'fa-folder-open', color: 'green', title: 'Sistema de Projetos', desc: 'Organize todos os seus materiais em projetos. Acesse documentos, imagens e páginas em um clique.' },
            { icon: 'fa-chart-bar', color: 'orange', title: 'Painel de Controle', desc: 'Acompanhe seu uso, histórico de criações e métricas do plano com um dashboard profissional e intuitivo.' },
          ].map(f => `
          <div class="card p-6 group">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style="background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.2)">
              <i class="fas ${f.icon}" style="color:#D4AF37"></i>
            </div>
            <h3 class="font-bold text-lg mb-2" style="color:#F5F0E8">${f.title}</h3>
            <p class="text-sm leading-relaxed" style="color:#A09880">${f.desc}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="como-funciona" class="py-24 px-6" style="background:#0A0A0A">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-black mb-4" style="color:#F5F0E8">Como funciona?</h2>
          <p class="text-xl" style="color:#A09880">Simples, rápido e intuitivo.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          ${[
            { n: '01', icon: 'fa-user-plus', title: 'Crie sua conta', desc: 'Cadastre-se gratuitamente em menos de 30 segundos. Sem cartão de crédito necessário.' },
            { n: '02', icon: 'fa-wand-magic-sparkles', title: 'Use os módulos', desc: 'Escolha o que deseja criar: documento, imagem, página ou converse com a IA.' },
            { n: '03', icon: 'fa-rocket', title: 'Salve e use', desc: 'Organize tudo em projetos e use os materiais criados no seu negócio imediatamente.' },
          ].map(s => `
          <div class="text-center">
            <div class="w-16 h-16 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-900/30">
              <i class="fas ${s.icon} text-xl" style="color:#0A0A0A"></i>
            </div>
            <div class="text-xs font-bold mb-2" style="color:#D4AF37">PASSO ${s.n}</div>
            <h3 class="font-bold text-xl mb-2" style="color:#F5F0E8">${s.title}</h3>
            <p style="color:#A09880">${s.desc}</p>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Use cases -->
    <section class="py-24 px-6" style="background:#111111">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-black mb-4" style="color:#F5F0E8">Veja na prática</h2>
          <p class="text-xl" style="color:#A09880">Exemplos reais de como nossos usuários usam o Studio IA</p>
        </div>
        <div class="grid md:grid-cols-2 gap-6">
          ${[
            { tag: 'Consultora de RH', title: 'Proposta comercial em 3 minutos', desc: 'Ana gera propostas profissionais para novos clientes usando o template de proposta comercial. O que levava 2 horas agora leva minutos.', icon: 'fa-briefcase' },
            { tag: 'Clínica Odontológica', title: 'Posts diários para Instagram', desc: 'A clínica do Dr. Carlos cria 30 posts mensais para redes sociais com a IA. Engajamento aumentou 140% em 2 meses.', icon: 'fa-tooth' },
            { tag: 'Corretor de Imóveis', title: 'Landing pages para cada imóvel', desc: 'Pedro cria uma landing page personalizada para cada imóvel que vai vender. Conversão aumentou significativamente.', icon: 'fa-house', color: 'green' },
            { tag: 'Agência de Marketing', title: 'Criativos para anúncios rápidos', desc: 'A equipe da Marina gera criativos para anúncios dos clientes em minutos, acelerando as entregas e satisfação.', icon: 'fa-bullhorn', color: 'purple' },
          ].map(u => `
          <div class="card p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style="background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.2)">
                <i class="fas ${u.icon}" style="color:#D4AF37"></i>
              </div>
              <div>
                <span class="tag mb-2 inline-block">${u.tag}</span>
                <h3 class="font-bold mb-2" style="color:#F5F0E8">${u.title}</h3>
                <p class="text-sm leading-relaxed" style="color:#A09880">${u.desc}</p>
              </div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-24 px-6" style="background:#0A0A0A">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl font-black text-center mb-12" style="color:#F5F0E8">O que dizem nossos usuários</h2>
        <div class="grid md:grid-cols-3 gap-6">
          ${[
            { name: 'Mariana Costa', role: 'Consultora de Negócios', text: 'Economizo pelo menos 10 horas por semana em criação de conteúdo. O retorno sobre o investimento é absurdo!' },
            { name: 'Rafael Almeida', role: 'Dono de Agência', text: 'Minha equipe entrega 3x mais para os clientes usando o Studio IA. É um diferencial competitivo enorme.' },
            { name: 'Juliana Santos', role: 'Advogada Autônoma', text: 'Criar contratos e propostas ficou muito mais rápido. Profissionalismo que antes eu não conseguia sozinha.' },
          ].map(t => `
          <div class="card p-6">
            <div class="flex gap-1 mb-3">${[1,2,3,4,5].map(() => '<i class="fas fa-star text-sm" style="color:#D4AF37"></i>').join('')}</div>
            <p class="mb-4 italic leading-relaxed" style="color:#D0C8B8">"${t.text}"</p>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center font-bold" style="color:#0A0A0A">${t.name[0]}</div>
              <div><p class="font-bold text-sm" style="color:#F5F0E8">${t.name}</p><p class="text-xs" style="color:#6B6355">${t.role}</p></div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="planos" class="py-24 px-6" style="background:#111111">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-black mb-4" style="color:#F5F0E8">Planos simples e transparentes</h2>
          <p class="text-xl" style="color:#A09880">Comece grátis, escale quando precisar.</p>
        </div>
        <div class="grid md:grid-cols-2 gap-8">
          <div class="card p-8 border-2 border-gray-100">
            <div class="text-sm font-semibold uppercase tracking-wider mb-2" style="color:#6B6355">GRÁTIS</div>
            <div class="text-4xl font-black mb-1" style="color:#F5F0E8">R$ 0</div>
            <div class="text-sm mb-6" style="color:#6B6355">para sempre</div>
            <ul class="space-y-3 mb-8 text-sm" style="color:#A09880">
              ${['30 mensagens de chat/mês','5 documentos/mês','5 imagens/mês','2 landing pages/mês','3 projetos','Templates básicos'].map(f => `<li class="flex items-center gap-2"><i class="fas fa-check" style="color:#D4AF37"></i>${f}</li>`).join('')}
            </ul>
            <button onclick="navigate('/cadastro')" class="w-full btn-secondary py-3 rounded-xl font-semibold">Começar grátis</button>
          </div>
          <div class="card p-8 border-2 border-yellow-500 relative overflow-hidden">
            <div class="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">POPULAR</div>
            <div class="text-yellow-500 text-sm font-semibold uppercase tracking-wider mb-2">PRO</div>
            <div class="text-4xl font-black mb-1" style="color:#F5F0E8">R$ 97</div>
            <div class="text-sm mb-6" style="color:#6B6355">por mês</div>
            <ul class="space-y-3 mb-8 text-sm" style="color:#A09880">
              ${['500 mensagens de chat/mês','100 documentos/mês','50 imagens/mês','20 landing pages/mês','50 projetos','Todos os templates','Prioridade no suporte','Exportação avançada'].map(f => `<li class="flex items-center gap-2"><i class="fas fa-check text-yellow-500"></i>${f}</li>`).join('')}
            </ul>
            <button onclick="navigate('/cadastro')" class="w-full btn-primary py-3 rounded-xl font-semibold">Assinar Pro</button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Final -->
    <section class="py-24 px-6" style="background:linear-gradient(135deg,#0A0A0A,#1A1500,#0A0A0A); border-top:1px solid rgba(212,175,55,0.2)">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-4xl md:text-5xl font-black mb-4" style="color:#F5F0E8">Pronto para começar?</h2>
        <p class="text-xl mb-8" style="color:#A09880">Junte-se a centenas de profissionais que já usam o Studio IA para crescer.</p>
        <button onclick="navigate('/cadastro')" class="bg-white text-yellow-400 px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-xl transition-all hover:scale-105">
          Criar conta gratuita <i class="fas fa-arrow-right ml-2"></i>
        </button>
        <p class="text-sm mt-4" style="color:#6B6355">Sem cartão de crédito • Setup em 30 segundos</p>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-6" style="background:#0A0A0A; border-top:1px solid rgba(212,175,55,0.15)">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <i class="fas fa-brain text-black text-sm"></i>
          </div>
          <span class="font-bold" style="color:#F5F0E8">Studio IA para Negócios</span>
        </div>
        <p class="text-sm" style="color:#6B6355">&copy; ${new Date().getFullYear()} Studio IA. Todos os direitos reservados.</p>
        <div class="flex gap-6 text-sm text-gray-500">
          <a href="#" class="hover:text-white transition-colors">Privacidade</a>
          <a href="#" class="hover:text-white transition-colors">Termos</a>
          <a href="#" class="hover:text-white transition-colors">Contato</a>
        </div>
      </div>
    </footer>
  </div>`
}

function initLandingPage() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault()
      const el = document.querySelector(a.getAttribute('href'))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    })
  })
}

// ============================================================
// AUTH PAGE
// ============================================================
function renderAuthPage(mode) {
  const isLogin = mode === 'login'
  return `
  <div class="min-h-screen flex" style="background: #0A0A0A">
    <!-- Left panel — hidden on mobile -->
    <div class="hidden lg:flex flex-col justify-between w-1/2 p-12" style="background:linear-gradient(135deg,#111111 0%,#1A1500 100%); border-right:1px solid rgba(212,175,55,0.2)">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:rgba(212,175,55,0.15)">
          <i class="fas fa-brain text-white"></i>
        </div>
        <span class="font-bold text-lg" style="color:#F5F0E8">Studio IA para Negócios</span>
      </div>
      <div>
        <h2 class="text-4xl font-black mb-4 leading-tight" style="color:#F5F0E8">Sua central de criação<br>com Inteligência Artificial</h2>
        <p class="text-lg mb-8" style="color:#A09880">Documentos, imagens, páginas e muito mais para o seu negócio crescer.</p>
        <div class="space-y-4">
          ${[
            { icon: 'fa-comments', text: 'Chat com IA real (OpenAI GPT-4o-mini)' },
            { icon: 'fa-file-lines', text: 'Propostas, contratos e e-mails em minutos' },
            { icon: 'fa-image', text: 'Imagens e criativos profissionais' },
            { icon: 'fa-globe', text: 'Landing pages que convertem' },
            { icon: 'fa-chart-bar', text: 'Analytics e métricas de uso' },
          ].map(f => `
          <div class="flex items-center gap-3" style="color:#A09880">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style="background:rgba(212,175,55,0.15); border:1px solid rgba(212,175,55,0.3)">
              <i class="fas ${f.icon} text-sm"></i>
            </div>
            <span class="text-sm">${f.text}</span>
          </div>`).join('')}
        </div>
      </div>
      <p class="text-sm" style="color:#6B6355">© ${new Date().getFullYear()} Studio IA para Negócios</p>
    </div>

    <!-- Right panel -->
    <div class="flex-1 flex items-center justify-center p-6 sm:p-8" style="background:#0A0A0A">
      <div class="w-full max-w-md">
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-3 mb-8">
          <div class="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <i class="fas fa-brain text-black text-sm"></i>
          </div>
          <span class="font-bold text-gray-900">Studio IA para Negócios</span>
        </div>

        <h1 class="text-3xl font-black mb-2" style="color:#F5F0E8">${isLogin ? 'Bem-vindo de volta!' : 'Criar conta grátis'}</h1>
        <p class="mb-6" style="color:#A09880">${isLogin ? 'Entre para acessar seu workspace.' : 'Comece a criar com IA em segundos.'}</p>

        <!-- Google OAuth button -->
        <a href="/api/oauth/google" class="flex items-center justify-center gap-3 w-full font-semibold py-3 rounded-xl transition-all mb-4" style="background:#111111; border:1px solid rgba(212,175,55,0.2); color:#D0C8B8">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continuar com Google
        </a>

        <div class="flex items-center gap-3 mb-4">
          <div class="flex-1 h-px" style="background:rgba(212,175,55,0.15)"></div>
          <span class="text-xs font-medium" style="color:#6B6355">ou com e-mail</span>
          <div class="flex-1 h-px" style="background:rgba(212,175,55,0.15)"></div>
        </div>

        <!-- Demo hint -->
        ${isLogin ? `<div class="bg-yellow-900/20 border border-yellow-900/40 rounded-xl p-3 mb-4 text-sm text-yellow-400">
          <p class="font-semibold mb-1">🎯 Conta demo:</p>
          <p>E-mail: <strong>ana@exemplo.com</strong> · Senha: <strong>demo123</strong></p>
        </div>` : ''}

        <form id="auth-form" class="space-y-4">
          ${!isLogin ? `<div>
            <label class="block text-sm font-medium mb-1.5" style="color:#A09880">Nome completo</label>
            <input id="auth-name" type="text" class="input-field w-full" placeholder="Seu nome completo" required autocomplete="name">
          </div>` : ''}
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:#A09880">E-mail</label>
            <input id="auth-email" type="email" class="input-field w-full" placeholder="seu@email.com" required autocomplete="email" value="${isLogin ? 'ana@exemplo.com' : ''}">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1.5" style="color:#A09880">Senha</label>
            <div class="relative">
              <input id="auth-password" type="password" class="input-field w-full pr-10" placeholder="${isLogin ? 'Sua senha' : 'Mínimo 6 caracteres'}" required autocomplete="${isLogin ? 'current-password' : 'new-password'}" value="${isLogin ? 'demo123' : ''}">
              <button type="button" onclick="togglePassword()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i id="eye-icon" class="fas fa-eye text-sm"></i>
              </button>
            </div>
          </div>

          <button type="submit" id="auth-btn" class="w-full btn-primary py-3.5 rounded-xl font-bold text-base mt-1">
            ${isLogin ? '<i class="fas fa-sign-in-alt mr-2"></i>Entrar na conta' : '<i class="fas fa-user-plus mr-2"></i>Criar conta gratuita'}
          </button>

          <div id="auth-error" class="hidden bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl p-3 text-center"></div>
        </form>

        <p class="text-center text-gray-500 text-sm mt-5">
          ${isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          <button onclick="navigate('${isLogin ? '/cadastro' : '/login'}')" class="text-yellow-500 font-semibold hover:underline ml-1">
            ${isLogin ? 'Criar agora' : 'Fazer login'}
          </button>
        </p>
        <div class="text-center mt-3">
          <button onclick="navigate('/')" class="text-gray-400 text-sm hover:text-gray-600 transition-colors">
            <i class="fas fa-arrow-left mr-1"></i>Voltar ao início
          </button>
        </div>
      </div>
    </div>
  </div>`
}

function initAuthPage() {
  const form = document.getElementById('auth-form')
  form.addEventListener('submit', async e => {
    e.preventDefault()
    const btn = document.getElementById('auth-btn')
    const errEl = document.getElementById('auth-error')
    
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>Aguarde...'
    errEl.classList.add('hidden')

    const email = document.getElementById('auth-email').value
    const password = document.getElementById('auth-password').value
    const name = document.getElementById('auth-name')?.value

    try {
      let data
      if (name) {
        data = await api('POST', '/auth/register', { name, email, password })
      } else {
        data = await api('POST', '/auth/login', { email, password })
      }
      setToken(data.token)
      currentUser = data.user
      localStorage.setItem('studio_user', JSON.stringify(currentUser))
      showToast(`Bem-vindo, ${data.user.name}!`, 'success')
      navigate('/dashboard')
    } catch (err) {
      errEl.textContent = err.message
      errEl.classList.remove('hidden')
      btn.disabled = false
      btn.innerHTML = name ? '<i class="fas fa-user-plus mr-2"></i>Criar conta gratuita' : '<i class="fas fa-sign-in-alt mr-2"></i>Entrar na conta'
    }
  })
}

function togglePassword() {
  const input = document.getElementById('auth-password')
  const icon = document.getElementById('eye-icon')
  if (input.type === 'password') {
    input.type = 'text'
    icon.className = 'fas fa-eye-slash text-sm'
  } else {
    input.type = 'password'
    icon.className = 'fas fa-eye text-sm'
  }
}

// ============================================================
// DASHBOARD
// ============================================================
async function renderDashboard(container) {
  setBreadcrumb('Dashboard')
  showLoader(container, 'Carregando dashboard...')
  try {
    const data = await api('GET', '/users/dashboard')
    const { user, recentProjects, recentDocs, recentImages, recentPages, recentChats, usage, plan } = data
    const isProPlan = plan === 'pro'

    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <!-- Welcome -->
      <div class="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style="background:#111111; border:1px solid rgba(212,175,55,0.15)">
        <div>
          <h1 class="text-2xl font-black" style="color:#F5F0E8">Olá, ${user.name.split(' ')[0]}! 👋</h1>
          <p class="mt-1" style="color:#A09880">Bem-vindo ao seu workspace. O que vamos criar hoje?</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${isProPlan ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gray-100 text-gray-600'}">
            ${isProPlan ? '<i class="fas fa-star" style="color:#D4AF37"></i> Plano Pro' : '<i class="fas fa-user"></i> Plano Grátis'}
          </span>
          ${!isProPlan ? `<button onclick="navigate('/conta')" class="btn-primary px-4 py-1.5 rounded-xl text-sm font-semibold">Fazer upgrade</button>` : ''}
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${[
          { icon: 'fa-comments', label: 'Chat com IA', route: '/chat', color: 'indigo' },
          { icon: 'fa-file-lines', label: 'Novo Documento', route: '/documentos', color: 'purple' },
          { icon: 'fa-image', label: 'Nova Imagem', route: '/imagens', color: 'pink' },
          { icon: 'fa-globe', label: 'Nova Landing Page', route: '/landing-pages', color: 'blue' },
        ].map(a => `
        <button onclick="navigate('${a.route}')" class="card p-4 text-center group" style="cursor:pointer">
          <div class="w-12 h-12 rounded-2xl bg-${a.color}-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <i class="fas ${a.icon} text-${a.color}-600"></i>
          </div>
          <span class="text-sm font-semibold" style="color:#D0C8B8">${a.label}</span>
        </button>`).join('')}
      </div>

      <!-- Usage -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold" style="color:#F5F0E8">Uso do Plano — ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
          <button onclick="navigate('/conta')" class="text-yellow-500 text-sm font-medium hover:underline">Ver detalhes →</button>
        </div>
        <div class="grid sm:grid-cols-3 gap-4">
          ${[
            { label: 'Mensagens de Chat', used: usage.chat.used, limit: usage.chat.limit, icon: 'fa-comments', color: 'indigo' },
            { label: 'Documentos', used: usage.documents.used, limit: usage.documents.limit, icon: 'fa-file-lines', color: 'purple' },
            { label: 'Imagens', used: usage.images.used, limit: usage.images.limit, icon: 'fa-image', color: 'pink' },
          ].map(u => {
            const pct = Math.min(Math.round((u.used / u.limit) * 100), 100)
            const barColor = pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : `bg-${u.color}-500`
            return `
            <div class="rounded-xl p-4" style="background:#1A1A1A">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <i class="fas ${u.icon}" style="color:#D4AF37"></i><span style="color:#D0C8B8">${u.label}</span>
                </div>
                <span class="text-xs" style="color:#6B6355">${u.used}/${u.limit}</span>
              </div>
              <div class="rounded-full h-1.5 mb-1" style="background:#2A2A2A">
                <div class="${barColor} h-1.5 rounded-full transition-all" style="width: ${pct}%"></div>
              </div>
              <p class="text-xs" style="color:#6B6355">${pct}% utilizado</p>
            </div>`
          }).join('')}
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Recent Projects -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold" style="color:#F5F0E8">Projetos Recentes</h2>
            <button onclick="navigate('/projetos')" class="text-yellow-500 text-sm font-medium hover:underline">Ver todos →</button>
          </div>
          ${recentProjects.length > 0 ? `
          <div class="space-y-3">
            ${recentProjects.map(p => `
            <div onclick="navigate('/projetos/${p.id}')" class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group" onmouseover="this.style.background='rgba(212,175,55,0.05)'" onmouseout="this.style.background='transparent'">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style="background: ${p.color}20">
                <i class="fas fa-folder text-sm" style="color: ${p.color}"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm truncate group-hover:text-yellow-500 transition-colors">${p.name}</p>
                <p class="text-xs text-gray-400">${timeAgo(p.updated_at)}</p>
              </div>
              <i class="fas fa-chevron-right text-gray-300 text-xs group-hover:text-yellow-600"></i>
            </div>`).join('')}
          </div>` : `
          <div class="text-center py-8" style="color:#A09880">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:#1A1A1A"><i class="fas fa-folder text-gray-400"></i></div>
            <p class="text-sm mb-3" style="color:#6B6355">Nenhum projeto ainda</p>
            <button onclick="navigate('/projetos')" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">Criar projeto</button>
          </div>`}
        </div>

        <!-- Recent Documents -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold" style="color:#F5F0E8">Documentos Recentes</h2>
            <button onclick="navigate('/documentos')" class="text-yellow-500 text-sm font-medium hover:underline">Ver todos →</button>
          </div>
          ${recentDocs.length > 0 ? `
          <div class="space-y-3">
            ${recentDocs.map(d => `
            <div onclick="navigate('/documentos/${d.id}')" class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group" onmouseover="this.style.background='rgba(212,175,55,0.05)'" onmouseout="this.style.background='transparent'">
              <div class="w-9 h-9 rounded-xl bg-yellow-900/20 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-file-lines text-yellow-400 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm truncate group-hover:text-yellow-500 transition-colors">${d.title}</p>
                <p class="text-xs" style="color:#6B6355">${d.template_type?.replace(/_/g, ' ')} • ${formatDate(d.created_at)}</p>
              </div>
              <span class="tag" style="${d.status === 'draft' ? 'color:#FBBF24; background:rgba(234,179,8,0.1); border-color:rgba(234,179,8,0.3)' : 'color:#4ADE80; background:rgba(74,222,128,0.1); border-color:rgba(74,222,128,0.3)'}">${d.status === 'draft' ? 'Rascunho' : 'Finalizado'}</span>
            </div>`).join('')}
          </div>` : `
          <div class="text-center py-8" style="color:#A09880">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:#1A1A1A"><i class="fas fa-file-lines text-gray-400"></i></div>
            <p class="text-sm mb-3" style="color:#6B6355">Nenhum documento ainda</p>
            <button onclick="navigate('/documentos')" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">Criar documento</button>
          </div>`}
        </div>
      </div>

      <!-- Recent Images & Chat -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Recent Images -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold" style="color:#F5F0E8">Imagens Recentes</h2>
            <button onclick="navigate('/imagens')" class="text-yellow-500 text-sm font-medium hover:underline">Ver todas →</button>
          </div>
          ${recentImages.length > 0 ? `
          <div class="grid grid-cols-2 gap-3">
            ${recentImages.map(img => `
            <div onclick="navigate('/imagens')" class="aspect-square rounded-xl overflow-hidden cursor-pointer group relative">
              <img src="${img.image_url}" alt="${img.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <i class="fas fa-expand text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
            </div>`).join('')}
          </div>` : `
          <div class="text-center py-8" style="color:#A09880">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:#1A1A1A"><i class="fas fa-image text-gray-400"></i></div>
            <p class="text-sm mb-3" style="color:#6B6355">Nenhuma imagem ainda</p>
            <button onclick="navigate('/imagens')" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">Gerar imagem</button>
          </div>`}
        </div>

        <!-- Recent Chats -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-bold" style="color:#F5F0E8">Conversas Recentes</h2>
            <button onclick="navigate('/chat')" class="text-yellow-500 text-sm font-medium hover:underline">Ver todas →</button>
          </div>
          ${recentChats.length > 0 ? `
          <div class="space-y-3">
            ${recentChats.map(s => `
            <div onclick="navigate('/chat/${s.id}')" class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group" onmouseover="this.style.background='rgba(212,175,55,0.05)'" onmouseout="this.style.background='transparent'">
              <div class="w-9 h-9 rounded-xl bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                <i class="fas fa-comments text-yellow-500 text-sm"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 text-sm truncate group-hover:text-yellow-500 transition-colors">${s.title}</p>
                <p class="text-xs text-gray-400">${timeAgo(s.updated_at)}</p>
              </div>
            </div>`).join('')}
          </div>` : `
          <div class="text-center py-8" style="color:#A09880">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:#1A1A1A"><i class="fas fa-comments text-gray-400"></i></div>
            <p class="text-sm mb-3" style="color:#6B6355">Nenhuma conversa ainda</p>
            <button onclick="navigate('/chat')" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">Iniciar chat</button>
          </div>`}
        </div>
      </div>
    </div>`
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function setBreadcrumb(text) {
  const bc = document.getElementById('breadcrumb')
  if (bc) bc.innerHTML = `<span class="text-gray-800 font-semibold">${text}</span>`
}

// ============================================================
// OAUTH - Handle Google callback token in hash
// ============================================================
function checkOAuthHash() {
  const hash = window.location.hash
  if (hash.includes('oauth_token=')) {
    const params = new URLSearchParams(hash.slice(1))
    const token = params.get('oauth_token')
    const name = params.get('user_name')
    const plan = params.get('user_plan')
    if (token) {
      setToken(token)
      currentUser = { name: decodeURIComponent(name || 'Usuário'), plan: plan || 'free' }
      localStorage.setItem('studio_user', JSON.stringify(currentUser))
      window.history.replaceState({}, '', '/dashboard')
      currentRoute = '/dashboard'
      showToast(`Bem-vindo, ${decodeURIComponent(name || 'Usuário')}! Login com Google realizado.`, 'success')
      render()
    }
  }
}

// Call on init
checkOAuthHash()

// ============================================================
// INIT
// ============================================================
currentRoute = window.location.pathname || '/'
render()
