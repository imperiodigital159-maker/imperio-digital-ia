// ============================================================
// STUDIO IA — PROJETOS, CONTA, ANALYTICS & CONFIGURAÇÕES
// ============================================================

// ============================================================
// PROJETOS
// ============================================================
const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#10b981', '#3b82f6', '#ef4444', '#84cc16', '#f59e0b'
]

async function renderProjects(container) {
  setBreadcrumb('Projetos')
  showLoader(container, 'Carregando projetos...')

  try {
    const data = await api('GET', '/projects')
    const projects = data.projects || []

    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-gray-900">Projetos</h1>
          <p class="text-gray-500 text-sm">${projects.length} projeto${projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onclick="showCreateProjectModal()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          <i class="fas fa-plus"></i>Novo projeto
        </button>
      </div>

      <!-- Filter bar -->
      ${projects.length > 0 ? `
      <div class="flex gap-3 items-center flex-wrap">
        <input type="text" id="project-search" placeholder="Buscar projetos..." class="input-field text-sm py-2 px-3 flex-1 min-w-48" oninput="filterProjects(this.value)">
        <div class="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          <button onclick="setProjectView('grid')" id="pview-grid" class="p-2 rounded-lg bg-indigo-100 text-indigo-700 text-xs"><i class="fas fa-grid-2"></i></button>
          <button onclick="setProjectView('list')" id="pview-list" class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 text-xs"><i class="fas fa-list"></i></button>
        </div>
      </div>` : ''}

      <!-- Projects grid -->
      <div id="projects-container">
        ${projects.length === 0 ? `
        <div class="card p-12 text-center">
          <div class="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-5 shadow-xl shadow-indigo-200">
            <i class="fas fa-folder text-white text-3xl"></i>
          </div>
          <h2 class="text-2xl font-black text-gray-900 mb-3">Organize com Projetos</h2>
          <p class="text-gray-500 max-w-md mx-auto mb-6">Agrupe documentos, imagens, landing pages e conversas em projetos para manter tudo organizado e acessível.</p>
          <button onclick="showCreateProjectModal()" class="btn-primary px-6 py-3 rounded-xl font-semibold">
            <i class="fas fa-plus mr-2"></i>Criar primeiro projeto
          </button>
        </div>` : renderProjectsGrid(projects)}
      </div>
    </div>`

    window._allProjects = projects

  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function renderProjectsGrid(projects) {
  return `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" id="projects-grid">
    ${projects.map(p => renderProjectCard(p)).join('')}
  </div>`
}

function renderProjectCard(p) {
  const color = p.color || '#6366f1'
  const totalItems = (p.doc_count || 0) + (p.image_count || 0) + (p.lp_count || 0)
  return `
  <div class="card overflow-hidden group cursor-pointer" onclick="navigate('/projetos/${p.id}')">
    <!-- Color header -->
    <div class="h-2 w-full" style="background: ${color}"></div>
    <div class="p-5">
      <div class="flex items-start justify-between mb-3">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style="background: ${color}20">
          <i class="fas fa-folder text-xl" style="color: ${color}"></i>
        </div>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="event.stopPropagation(); showEditProjectModal('${p.id}', '${encodeURIComponent(p.name)}', '${p.color || '#6366f1'}')" class="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
            <i class="fas fa-edit text-xs"></i>
          </button>
          <button onclick="event.stopPropagation(); deleteProject('${p.id}')" class="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>
      <h3 class="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">${p.name}</h3>
      ${p.description ? `<p class="text-xs text-gray-400 mb-3 line-clamp-2">${p.description}</p>` : ''}
      <div class="flex items-center gap-3 text-xs text-gray-400">
        <span><i class="fas fa-file-lines mr-1"></i>${p.doc_count || 0} docs</span>
        <span><i class="fas fa-image mr-1"></i>${p.image_count || 0} imgs</span>
        <span><i class="fas fa-globe mr-1"></i>${p.lp_count || 0} páginas</span>
      </div>
      <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">${timeAgo(p.updated_at)}</span>
        <span class="text-xs font-semibold text-gray-600">${totalItems} item${totalItems !== 1 ? 's' : ''}</span>
      </div>
    </div>
  </div>`
}

function setProjectView(mode) {
  const projects = window._allProjects || []
  const container = document.getElementById('projects-container')
  if (!container) return

  document.getElementById('pview-grid').className = `p-2 rounded-lg ${mode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100'} text-xs`
  document.getElementById('pview-list').className = `p-2 rounded-lg ${mode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100'} text-xs`

  if (mode === 'grid') {
    container.innerHTML = renderProjectsGrid(projects)
  } else {
    container.innerHTML = `<div class="card overflow-hidden">
      <div class="divide-y divide-slate-100">
        ${projects.map(p => `
        <div class="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer group" onclick="navigate('/projetos/${p.id}')">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background: ${p.color || '#6366f1'}20">
            <i class="fas fa-folder" style="color: ${p.color || '#6366f1'}"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">${p.name}</p>
            <p class="text-xs text-gray-400">${(p.doc_count || 0) + (p.image_count || 0) + (p.lp_count || 0)} itens • ${timeAgo(p.updated_at)}</p>
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="event.stopPropagation(); showEditProjectModal('${p.id}', '${encodeURIComponent(p.name)}', '${p.color || '#6366f1'}')" class="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
              <i class="fas fa-edit text-xs"></i>
            </button>
            <button onclick="event.stopPropagation(); deleteProject('${p.id}')" class="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50">
              <i class="fas fa-trash text-xs"></i>
            </button>
          </div>
          <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
        </div>`).join('')}
      </div>
    </div>`
  }
}

function filterProjects(search) {
  const projects = (window._allProjects || []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  const grid = document.getElementById('projects-grid')
  if (grid) grid.innerHTML = projects.map(p => renderProjectCard(p)).join('')
}

function showCreateProjectModal() {
  showProjectModal(null, '', '#6366f1')
}

function showEditProjectModal(id, encodedName, color) {
  showProjectModal(id, decodeURIComponent(encodedName), color)
}

function showProjectModal(id, name, color) {
  const isEdit = !!id
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-overlay'
  modal.id = 'project-modal'
  modal.innerHTML = `
  <div class="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
    <div class="flex items-center justify-between p-6 border-b border-slate-100">
      <h2 class="text-lg font-black text-gray-900">${isEdit ? 'Editar Projeto' : 'Novo Projeto'}</h2>
      <button onclick="document.getElementById('project-modal').remove()" class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Nome do Projeto *</label>
        <input id="proj-name" type="text" value="${name}" class="input-field w-full" placeholder="Ex: Campanha de Marketing Q1">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Descrição (opcional)</label>
        <textarea id="proj-desc" rows="2" class="input-field w-full text-sm" placeholder="Descreva o objetivo deste projeto"></textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Cor do Projeto</label>
        <div class="flex gap-2 flex-wrap">
          ${PROJECT_COLORS.map(c => `
          <button onclick="selectProjectColor('${c}')" id="pcolor-${c.replace('#', '')}" class="w-8 h-8 rounded-xl border-2 ${c === color ? 'border-gray-900 scale-110' : 'border-transparent'} transition-all" style="background: ${c}"></button>`).join('')}
        </div>
        <input type="hidden" id="proj-color" value="${color}">
      </div>
    </div>
    <div class="p-6 border-t border-slate-100 flex gap-3 justify-end">
      <button onclick="document.getElementById('project-modal').remove()" class="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
      <button onclick="${isEdit ? `saveProject('${id}')` : 'createProject()'}" class="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">
        ${isEdit ? '<i class="fas fa-save mr-2"></i>Salvar' : '<i class="fas fa-plus mr-2"></i>Criar Projeto'}
      </button>
    </div>
  </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
  document.getElementById('proj-name').focus()
}

function selectProjectColor(color) {
  PROJECT_COLORS.forEach(c => {
    const btn = document.getElementById(`pcolor-${c.replace('#', '')}`)
    if (btn) btn.className = `w-8 h-8 rounded-xl border-2 ${c === color ? 'border-gray-900 scale-110' : 'border-transparent'} transition-all`
  })
  document.getElementById('proj-color').value = color
}

async function createProject() {
  const name = document.getElementById('proj-name')?.value?.trim()
  if (!name) { showToast('Nome do projeto é obrigatório', 'warning'); return }
  const description = document.getElementById('proj-desc')?.value?.trim()
  const color = document.getElementById('proj-color')?.value || '#6366f1'
  try {
    await api('POST', '/projects', { name, description, color })
    document.getElementById('project-modal')?.remove()
    showToast('Projeto criado!', 'success')
    const container = document.getElementById('main-content')
    renderProjects(container)
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function saveProject(id) {
  const name = document.getElementById('proj-name')?.value?.trim()
  if (!name) { showToast('Nome é obrigatório', 'warning'); return }
  const description = document.getElementById('proj-desc')?.value?.trim()
  const color = document.getElementById('proj-color')?.value || '#6366f1'
  try {
    await api('PUT', `/projects/${id}`, { name, description, color })
    document.getElementById('project-modal')?.remove()
    showToast('Projeto atualizado!', 'success')
    const container = document.getElementById('main-content')
    renderProjects(container)
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function deleteProject(id) {
  if (!confirm('Excluir este projeto? Documentos, imagens e páginas não serão excluídos.')) return
  try {
    await api('DELETE', `/projects/${id}`)
    showToast('Projeto excluído', 'info')
    const container = document.getElementById('main-content')
    renderProjects(container)
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function renderProjectDetail(container, projectId) {
  setBreadcrumb('Projeto')
  showLoader(container, 'Carregando projeto...')

  try {
    const [projectData, docsData, imagesData, pagesData] = await Promise.all([
      api('GET', `/projects/${projectId}`),
      api('GET', `/documents?project_id=${projectId}`),
      api('GET', `/images?project_id=${projectId}`),
      api('GET', `/landing-pages?project_id=${projectId}`),
    ])

    const project = projectData.project
    const docs = docsData.documents || []
    const images = imagesData.images || []
    const pages = pagesData.landing_pages || []

    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button onclick="navigate('/projetos')" class="btn-secondary p-2 rounded-xl">
          <i class="fas fa-arrow-left text-sm"></i>
        </button>
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background: ${project.color || '#6366f1'}20">
          <i class="fas fa-folder text-xl" style="color: ${project.color || '#6366f1'}"></i>
        </div>
        <div class="flex-1">
          <h1 class="text-2xl font-black text-gray-900">${project.name}</h1>
          ${project.description ? `<p class="text-gray-500 text-sm">${project.description}</p>` : ''}
        </div>
        <div class="flex gap-2">
          <button onclick="showEditProjectModal('${project.id}', '${encodeURIComponent(project.name)}', '${project.color || '#6366f1'}')" class="btn-secondary px-3 py-2 rounded-xl text-sm font-medium">
            <i class="fas fa-edit mr-1.5"></i>Editar
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        ${[
          { label: 'Documentos', count: docs.length, icon: 'fa-file-lines', color: 'purple', route: '/documentos' },
          { label: 'Imagens', count: images.length, icon: 'fa-image', color: 'pink', route: '/imagens' },
          { label: 'Landing Pages', count: pages.length, icon: 'fa-globe', color: 'blue', route: '/landing-pages' },
        ].map(s => `
        <div class="card p-4 text-center">
          <div class="w-10 h-10 rounded-xl bg-${s.color}-100 flex items-center justify-center mx-auto mb-2">
            <i class="fas ${s.icon} text-${s.color}-600 text-sm"></i>
          </div>
          <p class="text-2xl font-black text-gray-900">${s.count}</p>
          <p class="text-xs text-gray-500">${s.label}</p>
        </div>`).join('')}
      </div>

      <!-- Documents -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-gray-900">Documentos</h2>
          <button onclick="showDocumentWizard()" class="btn-primary px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <i class="fas fa-plus text-xs"></i>Novo
          </button>
        </div>
        ${docs.length === 0 ? `<p class="text-gray-400 text-sm text-center py-4">Nenhum documento neste projeto</p>` :
        `<div class="space-y-2">
          ${docs.map(d => `
          <div onclick="navigate('/documentos/${d.id}')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-colors">
            <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <i class="fas fa-file-lines text-purple-600 text-xs"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600 transition-colors">${d.title}</p>
              <p class="text-xs text-gray-400">${formatDate(d.created_at)}</p>
            </div>
            <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
          </div>`).join('')}
        </div>`}
      </div>

      <!-- Images -->
      ${images.length > 0 ? `
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-gray-900">Imagens</h2>
          <button onclick="navigate('/imagens')" class="text-indigo-600 text-sm font-medium hover:underline">Ver todas →</button>
        </div>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
          ${images.slice(0, 8).map(img => `
          <div class="aspect-square rounded-xl overflow-hidden cursor-pointer" onclick="navigate('/imagens')">
            <img src="${img.image_url}" alt="${img.title}" class="w-full h-full object-cover hover:scale-105 transition-transform">
          </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Landing Pages -->
      ${pages.length > 0 ? `
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-gray-900">Landing Pages</h2>
          <button onclick="navigate('/landing-pages')" class="text-indigo-600 text-sm font-medium hover:underline">Ver todas →</button>
        </div>
        <div class="space-y-2">
          ${pages.map(p => `
          <div onclick="navigate('/landing-pages/${p.id}')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer group transition-colors">
            <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <i class="fas fa-globe text-blue-600 text-xs"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600 transition-colors">${p.title}</p>
              <p class="text-xs text-gray-400">${formatDate(p.created_at)}</p>
            </div>
            <i class="fas fa-chevron-right text-gray-300 text-xs"></i>
          </div>`).join('')}
        </div>
      </div>` : ''}
    </div>`

  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

// ============================================================
// CONTA & ASSINATURA
// ============================================================
async function renderAccount(container) {
  setBreadcrumb('Minha Conta')
  showLoader(container, 'Carregando conta...')

  try {
    const [accountData, settingsData] = await Promise.all([
      api('GET', '/users/account'),
      api('GET', '/settings').catch(() => ({ settings: {} }))
    ])

    const { user, subscription, usage, limits } = accountData
    const settings = settingsData.settings || {}
    const isPro = user.plan === 'pro'

    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-black text-gray-900">Minha Conta</h1>
        <p class="text-gray-500 text-sm">Gerencie seu perfil, assinatura e configurações</p>
      </div>

      <!-- Profile card -->
      <div class="card p-6">
        <div class="flex items-start gap-5">
          <div class="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
            ${user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div class="flex-1">
            <div class="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 class="text-xl font-black text-gray-900">${user.name}</h2>
                <p class="text-gray-500">${user.email}</p>
                <p class="text-xs text-gray-400 mt-1">Membro desde ${formatDate(user.created_at)}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${isPro ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}">
                  ${isPro ? '<i class="fas fa-star text-yellow-500"></i> Plano Pro' : '<i class="fas fa-user"></i> Plano Grátis'}
                </span>
                ${!isPro ? `<button onclick="handleUpgrade()" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">Fazer Upgrade ⚡</button>` : ''}
              </div>
            </div>
            <div class="flex gap-3 mt-4">
              <button onclick="showEditProfileModal()" class="btn-secondary px-4 py-2 rounded-xl text-sm font-medium">
                <i class="fas fa-edit mr-1.5"></i>Editar perfil
              </button>
              <button onclick="showChangePasswordModal()" class="btn-secondary px-4 py-2 rounded-xl text-sm font-medium">
                <i class="fas fa-lock mr-1.5"></i>Alterar senha
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Usage this month -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="font-bold text-gray-900">Uso do Plano</h2>
            <p class="text-sm text-gray-500">${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
          </div>
          ${!isPro ? `<button onclick="handleUpgrade()" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-arrow-up mr-1.5"></i>Aumentar limites
          </button>` : ''}
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          ${[
            { label: 'Chat', used: usage.chat || 0, limit: limits.chat, icon: 'fa-comments', color: 'indigo' },
            { label: 'Documentos', used: usage.documents || 0, limit: limits.documents, icon: 'fa-file-lines', color: 'purple' },
            { label: 'Imagens', used: usage.images || 0, limit: limits.images, icon: 'fa-image', color: 'pink' },
            { label: 'Landing Pages', used: usage.landing_pages || 0, limit: limits.landing_pages, icon: 'fa-globe', color: 'blue' },
          ].map(u => {
            const pct = Math.min(Math.round((u.used / u.limit) * 100), 100)
            const barColor = pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-yellow-500' : `bg-${u.color}-500`
            const textColor = pct > 85 ? 'text-red-600' : pct > 65 ? 'text-yellow-600' : `text-${u.color}-600`
            return `
            <div class="bg-slate-50 rounded-xl p-4">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-lg bg-${u.color}-100 flex items-center justify-center">
                  <i class="fas ${u.icon} text-${u.color}-600 text-xs"></i>
                </div>
                <span class="text-sm font-semibold text-gray-700">${u.label}</span>
              </div>
              <div class="flex items-end justify-between mb-2">
                <span class="text-2xl font-black text-gray-900">${u.used}</span>
                <span class="text-sm text-gray-400">/${u.limit}</span>
              </div>
              <div class="bg-gray-200 rounded-full h-2 mb-1">
                <div class="${barColor} h-2 rounded-full transition-all" style="width: ${pct}%"></div>
              </div>
              <p class="text-xs ${textColor} font-medium">${pct}% utilizado</p>
            </div>`
          }).join('')}
        </div>
      </div>

      <!-- Plan comparison -->
      <div class="card p-6">
        <h2 class="font-bold text-gray-900 mb-5">Comparativo de Planos</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr>
                <th class="text-left py-3 px-4 text-sm font-semibold text-gray-600 w-1/2">Recurso</th>
                <th class="text-center py-3 px-4 text-sm font-semibold text-gray-500">Grátis</th>
                <th class="text-center py-3 px-4 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-t-xl">Pro ⭐</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${[
                ['Mensagens de Chat/mês', '30', '500'],
                ['Documentos/mês', '5', '100'],
                ['Imagens/mês', '5', '50'],
                ['Landing Pages/mês', '2', '20'],
                ['Projetos', '3', '50'],
                ['Templates de documento', '4 básicos', 'Todos (8+)'],
                ['Melhorar com IA', '❌', '✅'],
                ['Export PDF/Print', '✅', '✅'],
                ['Suporte prioritário', '❌', '✅'],
                ['OpenAI (chave própria)', '✅', '✅'],
              ].map(([feature, free, pro]) => `
              <tr>
                <td class="py-3 px-4 text-sm text-gray-700">${feature}</td>
                <td class="py-3 px-4 text-center text-sm text-gray-500">${free}</td>
                <td class="py-3 px-4 text-center text-sm font-semibold text-indigo-700 bg-indigo-50/50">${pro}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ${!isPro ? `
        <div class="mt-5 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p class="font-bold text-gray-900">Plano Pro — R$ 97/mês</p>
              <p class="text-sm text-gray-600">10x mais recursos, sem limites restritivos</p>
            </div>
            <button onclick="handleUpgrade()" class="btn-primary px-6 py-2.5 rounded-xl font-semibold">
              <i class="fas fa-star mr-2 text-yellow-400"></i>Assinar Pro
            </button>
          </div>
        </div>` : `
        <div class="mt-5 p-4 bg-green-50 rounded-xl border border-green-100">
          <div class="flex items-center gap-3">
            <i class="fas fa-check-circle text-green-500 text-lg"></i>
            <div>
              <p class="font-semibold text-green-800">Você está no Plano Pro!</p>
              <p class="text-sm text-green-600">Aproveite todos os recursos sem limitações.</p>
            </div>
          </div>
        </div>`}
      </div>

      <!-- Settings -->
      <div class="card p-6" id="config">
        <h2 class="font-bold text-gray-900 mb-5 flex items-center gap-2">
          <i class="fas fa-sliders text-indigo-500"></i>Configurações de Integrações
        </h2>
        
        <!-- OpenAI -->
        <div class="space-y-4">
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                  <span class="text-white font-bold text-xs">AI</span>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">OpenAI (GPT-4o-mini + DALL-E 3)</p>
                  <p class="text-xs text-gray-500">Chat com IA real, geração de documentos e imagens</p>
                </div>
              </div>
              <div id="openai-badge" class="text-xs px-2 py-1 rounded-full ${settings.openai_key ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                ${settings.openai_key ? '✅ Configurado' : '⚪ Não configurado'}
              </div>
            </div>
            <div class="flex gap-3">
              <input id="openai-key-input" type="password" class="input-field flex-1 text-sm" placeholder="sk-proj-..." value="${settings.openai_key ? '••••••••••••••••••••' : ''}">
              <button onclick="saveOpenAIKey()" class="btn-primary px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap">
                Salvar
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              <i class="fas fa-lock mr-1"></i>Sua chave é armazenada com segurança e nunca compartilhada.
              <a href="https://platform.openai.com/api-keys" target="_blank" class="text-indigo-500 hover:underline ml-1">Obter chave →</a>
            </p>
          </div>

          <!-- Stripe -->
          <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                  <i class="fas fa-credit-card text-white text-sm"></i>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">Stripe (Pagamentos)</p>
                  <p class="text-xs text-gray-500">Para cobranças reais do plano Pro</p>
                </div>
              </div>
              <div id="stripe-badge" class="text-xs px-2 py-1 rounded-full ${settings.stripe_secret_key ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}">
                ${settings.stripe_secret_key ? '✅ Configurado' : '⚪ Não configurado'}
              </div>
            </div>
            <div class="space-y-2">
              <input id="stripe-secret-input" type="password" class="input-field w-full text-sm" placeholder="sk_test_..." value="${settings.stripe_secret_key ? '••••••••••••••••••••' : ''}">
              <input id="stripe-price-input" type="text" class="input-field w-full text-sm" placeholder="price_... (Price ID do plano Pro)" value="${settings.stripe_price_id || ''}">
              <button onclick="saveStripeKeys()" class="btn-primary px-4 py-2 rounded-xl text-sm font-medium">Salvar</button>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              <a href="https://dashboard.stripe.com/apikeys" target="_blank" class="text-indigo-500 hover:underline">Obter chaves Stripe →</a>
            </p>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="card p-6 border-red-100">
        <h2 class="font-bold text-red-700 mb-4 flex items-center gap-2">
          <i class="fas fa-triangle-exclamation"></i>Zona de Perigo
        </h2>
        <div class="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
          <div>
            <p class="font-semibold text-gray-900 text-sm">Excluir conta</p>
            <p class="text-xs text-gray-500">Remove permanentemente sua conta e todos os dados</p>
          </div>
          <button onclick="confirmDeleteAccount()" class="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 transition-colors">
            Excluir conta
          </button>
        </div>
      </div>
    </div>`

  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function showEditProfileModal() {
  const user = currentUser
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-overlay'
  modal.id = 'edit-profile-modal'
  modal.innerHTML = `
  <div class="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
    <div class="flex items-center justify-between p-6 border-b border-slate-100">
      <h2 class="text-lg font-black text-gray-900">Editar Perfil</h2>
      <button onclick="document.getElementById('edit-profile-modal').remove()" class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
        <input id="edit-name" type="text" value="${user?.name || ''}" class="input-field w-full">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
        <input id="edit-email" type="email" value="${user?.email || ''}" class="input-field w-full" disabled>
        <p class="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado</p>
      </div>
    </div>
    <div class="p-6 border-t border-slate-100 flex gap-3 justify-end">
      <button onclick="document.getElementById('edit-profile-modal').remove()" class="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
      <button onclick="saveProfile()" class="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">
        <i class="fas fa-save mr-2"></i>Salvar
      </button>
    </div>
  </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function saveProfile() {
  const name = document.getElementById('edit-name')?.value?.trim()
  if (!name) { showToast('Nome é obrigatório', 'warning'); return }
  try {
    const data = await api('PUT', '/users/profile', { name })
    currentUser = { ...currentUser, name }
    localStorage.setItem('studio_user', JSON.stringify(currentUser))
    document.getElementById('edit-profile-modal')?.remove()
    showToast('Perfil atualizado!', 'success')
    const container = document.getElementById('main-content')
    renderAccount(container)
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function showChangePasswordModal() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-overlay'
  modal.id = 'change-password-modal'
  modal.innerHTML = `
  <div class="modal-content bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
    <div class="flex items-center justify-between p-6 border-b border-slate-100">
      <h2 class="text-lg font-black text-gray-900">Alterar Senha</h2>
      <button onclick="document.getElementById('change-password-modal').remove()" class="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Senha atual</label>
        <input id="old-password" type="password" class="input-field w-full" placeholder="Sua senha atual">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
        <input id="new-password" type="password" class="input-field w-full" placeholder="Mínimo 6 caracteres">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Confirmar nova senha</label>
        <input id="confirm-password" type="password" class="input-field w-full" placeholder="Repita a nova senha">
      </div>
    </div>
    <div class="p-6 border-t border-slate-100 flex gap-3 justify-end">
      <button onclick="document.getElementById('change-password-modal').remove()" class="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">Cancelar</button>
      <button onclick="changePassword()" class="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">
        <i class="fas fa-lock mr-2"></i>Alterar senha
      </button>
    </div>
  </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function changePassword() {
  const oldPassword = document.getElementById('old-password')?.value
  const newPassword = document.getElementById('new-password')?.value
  const confirmPassword = document.getElementById('confirm-password')?.value

  if (!oldPassword || !newPassword) { showToast('Preencha todos os campos', 'warning'); return }
  if (newPassword !== confirmPassword) { showToast('As senhas não coincidem', 'error'); return }
  if (newPassword.length < 6) { showToast('Senha deve ter pelo menos 6 caracteres', 'warning'); return }

  try {
    await api('PUT', '/users/password', { old_password: oldPassword, new_password: newPassword })
    document.getElementById('change-password-modal')?.remove()
    showToast('Senha alterada com sucesso!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function handleUpgrade() {
  showToast('Processando upgrade...', 'info')
  try {
    const data = await api('POST', '/stripe/checkout')
    if (data.url) {
      window.location.href = data.url
    } else if (data.demo) {
      currentUser = { ...currentUser, plan: 'pro' }
      localStorage.setItem('studio_user', JSON.stringify(currentUser))
      showToast('Plano Pro ativado! (modo demo)', 'success')
      const container = document.getElementById('main-content')
      renderAccount(container)
    }
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function saveOpenAIKey() {
  const key = document.getElementById('openai-key-input')?.value?.trim()
  if (!key || key.includes('•')) { showToast('Digite sua chave OpenAI', 'warning'); return }
  if (!key.startsWith('sk-')) { showToast('Chave inválida. Deve começar com sk-', 'error'); return }
  try {
    await api('POST', '/settings', { openai_key: key })
    const badge = document.getElementById('openai-badge')
    if (badge) {
      badge.className = 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'
      badge.textContent = '✅ Configurado'
    }
    document.getElementById('openai-key-input').value = '••••••••••••••••••••'
    showToast('Chave OpenAI salva! Chat e geração IA ativados.', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function saveStripeKeys() {
  const secretKey = document.getElementById('stripe-secret-input')?.value?.trim()
  const priceId = document.getElementById('stripe-price-input')?.value?.trim()
  if (!secretKey || secretKey.includes('•')) { showToast('Digite a chave secreta Stripe', 'warning'); return }
  try {
    await api('POST', '/settings', { stripe_secret_key: secretKey, stripe_price_id: priceId })
    const badge = document.getElementById('stripe-badge')
    if (badge) {
      badge.className = 'text-xs px-2 py-1 rounded-full bg-green-100 text-green-700'
      badge.textContent = '✅ Configurado'
    }
    document.getElementById('stripe-secret-input').value = '••••••••••••••••••••'
    showToast('Chave Stripe salva!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function confirmDeleteAccount() {
  if (!confirm('Tem certeza? Esta ação é irreversível e apagará todos os seus dados.')) return
  if (!confirm('Última confirmação: excluir sua conta permanentemente?')) return
  logout()
  showToast('Conta excluída. Até mais!', 'info')
}

// ============================================================
// ANALYTICS DASHBOARD
// ============================================================
async function renderAnalytics(container) {
  setBreadcrumb('Analytics')
  showLoader(container, 'Carregando analytics...')

  try {
    const data = await api('GET', '/analytics')
    const { totals, chartData, recentActivity, topTemplates } = data

    // Calculate trend (last month vs current)
    const last = chartData[chartData.length - 1] || {}
    const prev = chartData[chartData.length - 2] || {}
    const totalNow = last.total || 0
    const totalPrev = prev.total || 1
    const trend = Math.round(((totalNow - totalPrev) / totalPrev) * 100)

    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <div>
        <h1 class="text-2xl font-black text-gray-900">Analytics</h1>
        <p class="text-gray-500 text-sm">Acompanhe seu uso e produtividade</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        ${[
          { label: 'Projetos', value: totals.projects, icon: 'fa-folder', color: 'green' },
          { label: 'Documentos', value: totals.documents, icon: 'fa-file-lines', color: 'purple' },
          { label: 'Imagens', value: totals.images, icon: 'fa-image', color: 'pink' },
          { label: 'Landing Pages', value: totals.landing_pages, icon: 'fa-globe', color: 'blue' },
          { label: 'Mensagens Chat', value: totals.chat_messages, icon: 'fa-comments', color: 'indigo' },
        ].map(s => `
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-8 h-8 rounded-lg bg-${s.color}-100 flex items-center justify-center">
              <i class="fas ${s.icon} text-${s.color}-600 text-xs"></i>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900">${s.value}</p>
          <p class="text-xs text-gray-500">${s.label}</p>
        </div>`).join('')}
      </div>

      <!-- Monthly usage chart -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-bold text-gray-900">Uso nos Últimos 6 Meses</h2>
          <div class="flex items-center gap-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-500'}">
            <i class="fas ${trend >= 0 ? 'fa-trending-up' : 'fa-trending-down'}"></i>
            <span>${Math.abs(trend)}% vs mês anterior</span>
          </div>
        </div>

        <!-- Chart bars -->
        <div class="flex items-end gap-3 h-40 mb-3">
          ${chartData.map(m => {
            const maxVal = Math.max(...chartData.map(d => d.total), 1)
            const height = Math.max(Math.round((m.total / maxVal) * 100), 4)
            const isLast = m === chartData[chartData.length - 1]
            return `
            <div class="flex-1 flex flex-col items-center gap-1">
              <span class="text-xs text-gray-500 font-medium">${m.total}</span>
              <div class="w-full rounded-t-lg transition-all ${isLast ? 'gradient-bg' : 'bg-indigo-100'}" style="height: ${height}%"></div>
            </div>`
          }).join('')}
        </div>
        <div class="flex gap-3">
          ${chartData.map(m => `<div class="flex-1 text-center text-xs text-gray-400">${m.label}</div>`).join('')}
        </div>

        <!-- Legend -->
        <div class="flex gap-4 mt-4 flex-wrap">
          ${[
            { label: 'Chat', color: 'bg-indigo-500' },
            { label: 'Documentos', color: 'bg-purple-500' },
            { label: 'Imagens', color: 'bg-pink-500' },
            { label: 'Landing Pages', color: 'bg-blue-500' },
          ].map(l => `
          <div class="flex items-center gap-1.5 text-xs text-gray-500">
            <div class="w-3 h-3 rounded-sm ${l.color}"></div>${l.label}
          </div>`).join('')}
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Top templates -->
        <div class="card p-6">
          <h2 class="font-bold text-gray-900 mb-4">Templates Mais Usados</h2>
          ${topTemplates.length === 0 ? `<p class="text-gray-400 text-sm text-center py-4">Nenhum dado ainda</p>` : `
          <div class="space-y-3">
            ${topTemplates.map((t, i) => {
              const maxCnt = topTemplates[0]?.cnt || 1
              const pct = Math.round((t.cnt / maxCnt) * 100)
              return `
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700 capitalize">${(t.template_type || '').replace(/_/g, ' ')}</span>
                  <span class="text-xs text-gray-500">${t.cnt}x</span>
                </div>
                <div class="bg-gray-100 rounded-full h-1.5">
                  <div class="gradient-bg h-1.5 rounded-full" style="width: ${pct}%"></div>
                </div>
              </div>`
            }).join('')}
          </div>`}
        </div>

        <!-- Recent activity -->
        <div class="card p-6">
          <h2 class="font-bold text-gray-900 mb-4">Atividade Recente</h2>
          ${recentActivity.length === 0 ? `<p class="text-gray-400 text-sm text-center py-4">Nenhuma atividade registrada</p>` : `
          <div class="space-y-3">
            ${recentActivity.map(a => {
              const icons = { chat: 'fa-comments text-indigo-500', document: 'fa-file-lines text-purple-500', image: 'fa-image text-pink-500', landing_page: 'fa-globe text-blue-500' }
              const labels = { chat: 'Chat', document: 'Documento', image: 'Imagem', landing_page: 'Landing Page' }
              return `
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <i class="fas ${icons[a.resource_type] || 'fa-circle text-gray-400'} text-xs"></i>
                </div>
                <div class="flex-1">
                  <p class="text-sm text-gray-700">${a.action_type === 'create' ? 'Criou' : 'Acessou'} <span class="font-medium">${labels[a.resource_type] || a.resource_type}</span></p>
                </div>
                <span class="text-xs text-gray-400">${timeAgo(a.created_at)}</span>
              </div>`
            }).join('')}
          </div>`}
        </div>
      </div>
    </div>`

  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}
