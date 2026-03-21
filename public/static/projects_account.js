
// ============================================================
// PROJECTS MODULE
// ============================================================
async function renderProjects(container) {
  setBreadcrumb('Projetos')
  showLoader(container, 'Carregando projetos...')
  
  try {
    const data = await api('GET', '/projects')
    const projects = data.projects || []
    
    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900">Projetos</h1>
          <p class="text-gray-500 text-sm mt-1">Organize seus documentos, imagens e páginas</p>
        </div>
        <button onclick="showCreateProject()" class="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
          <i class="fas fa-plus"></i> Novo Projeto
        </button>
      </div>

      ${projects.length > 0 ? `
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${projects.map(p => `
        <div onclick="navigate('/projetos/${p.id}')" class="card p-5 cursor-pointer group hover:border-indigo-200 border border-transparent transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background: ${p.color}20">
              <i class="fas fa-folder text-xl" style="color: ${p.color}"></i>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="event.stopPropagation();showEditProject('${p.id}','${p.name}','${p.description || ''}','${p.color}')" 
                class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center text-gray-500 transition-all text-xs">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="event.stopPropagation();deleteProject('${p.id}')" 
                class="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-gray-500 transition-all text-xs">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <h3 class="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">${p.name}</h3>
          <p class="text-gray-400 text-xs mb-3 line-clamp-2">${p.description || 'Sem descrição'}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">${timeAgo(p.updated_at)}</span>
            <i class="fas fa-chevron-right text-gray-300 text-xs group-hover:text-indigo-400 transition-colors"></i>
          </div>
        </div>`).join('')}
        
        <!-- Add project card -->
        <button onclick="showCreateProject()" class="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group">
          <div class="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center mx-auto mb-3 transition-colors">
            <i class="fas fa-plus text-gray-400 group-hover:text-indigo-500 transition-colors"></i>
          </div>
          <p class="text-sm font-semibold text-gray-500 group-hover:text-indigo-600 transition-colors">Novo Projeto</p>
        </button>
      </div>` : `
      <div class="text-center py-20">
        <div class="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <i class="fas fa-folder text-gray-400 text-4xl"></i>
        </div>
        <h3 class="font-bold text-gray-700 text-xl mb-2">Nenhum projeto ainda</h3>
        <p class="text-gray-400 mb-6 max-w-sm mx-auto">Crie projetos para organizar seus documentos, imagens e landing pages em um só lugar.</p>
        <button onclick="showCreateProject()" class="btn-primary px-8 py-3 rounded-xl font-semibold">
          <i class="fas fa-plus mr-2"></i>Criar primeiro projeto
        </button>
      </div>`}
    </div>

    <!-- Modal -->
    <div id="proj-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="modal-overlay absolute inset-0" onclick="closeProjModal()"></div>
      <div class="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10">
        <div id="proj-modal-content"></div>
      </div>
    </div>`
    
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><p class="text-red-500">${err.message}</p></div>`
  }
}

function showCreateProject() {
  const modal = document.getElementById('proj-modal')
  const content = document.getElementById('proj-modal-content')
  modal.classList.remove('hidden')
  
  content.innerHTML = `
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-black text-gray-900">Novo Projeto</h2>
      <button onclick="closeProjModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
    </div>
    <form id="proj-form" onsubmit="createProject(event)" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Nome do projeto <span class="text-red-500">*</span></label>
        <input type="text" name="name" class="input-field w-full" placeholder="Ex: Campanha de Marketing" required autofocus>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Descrição <span class="text-gray-400 text-xs">(opcional)</span></label>
        <textarea name="description" class="input-field w-full" rows="2" placeholder="Breve descrição do projeto"></textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Cor do projeto</label>
        <div class="flex gap-2 flex-wrap">
          ${['#6366f1','#8b5cf6','#ec4899','#3b82f6','#22c55e','#f59e0b','#ef4444','#14b8a6'].map(c => `
          <label class="cursor-pointer">
            <input type="radio" name="color" value="${c}" class="sr-only" ${c === '#6366f1' ? 'checked' : ''}>
            <div class="w-8 h-8 rounded-xl transition-all hover:scale-110 color-pick" style="background: ${c}" data-color="${c}" onclick="selectColor('${c}')"></div>
          </label>`).join('')}
        </div>
      </div>
      <button type="submit" class="w-full btn-primary py-3 rounded-xl font-bold text-sm mt-2">
        <i class="fas fa-folder-plus mr-2"></i>Criar Projeto
      </button>
    </form>
  </div>`
  
  // Mark first color as selected
  setTimeout(() => selectColor('#6366f1'), 50)
}

function showEditProject(id, name, description, color) {
  const modal = document.getElementById('proj-modal')
  const content = document.getElementById('proj-modal-content')
  modal.classList.remove('hidden')
  
  content.innerHTML = `
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-black text-gray-900">Editar Projeto</h2>
      <button onclick="closeProjModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
    </div>
    <form id="proj-edit-form" onsubmit="updateProject(event, '${id}')" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Nome do projeto</label>
        <input type="text" name="name" value="${name}" class="input-field w-full" required>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
        <textarea name="description" class="input-field w-full" rows="2">${description}</textarea>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Cor</label>
        <div class="flex gap-2 flex-wrap">
          ${['#6366f1','#8b5cf6','#ec4899','#3b82f6','#22c55e','#f59e0b','#ef4444','#14b8a6'].map(c => `
          <div class="w-8 h-8 rounded-xl cursor-pointer transition-all hover:scale-110 color-pick ${c === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}" 
            style="background: ${c}" data-color="${c}" onclick="selectColor('${c}')"></div>`).join('')}
        </div>
        <input type="hidden" name="color" value="${color}" id="color-input-edit">
      </div>
      <button type="submit" class="w-full btn-primary py-3 rounded-xl font-bold text-sm mt-2">
        <i class="fas fa-save mr-2"></i>Salvar Alterações
      </button>
    </form>
  </div>`
}

function selectColor(color) {
  document.querySelectorAll('.color-pick').forEach(el => {
    el.style.outline = ''
    el.style.boxShadow = ''
  })
  const selected = document.querySelector(`.color-pick[data-color="${color}"]`)
  if (selected) {
    selected.style.boxShadow = '0 0 0 3px white, 0 0 0 5px ' + color
  }
  const colorInput = document.querySelector('input[name="color"]') || document.getElementById('color-input-edit')
  if (colorInput) colorInput.value = color
}

async function createProject(e) {
  e.preventDefault()
  const form = document.getElementById('proj-form')
  const formData = new FormData(form)
  const body = {}
  formData.forEach((v, k) => body[k] = v)
  
  try {
    await api('POST', '/projects', body)
    closeProjModal()
    showToast('Projeto criado!', 'success')
    renderProjects(document.getElementById('main-content'))
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function updateProject(e, projectId) {
  e.preventDefault()
  const form = document.getElementById('proj-edit-form')
  const formData = new FormData(form)
  const body = {}
  formData.forEach((v, k) => body[k] = v)
  const colorEl = document.getElementById('color-input-edit')
  if (colorEl) body.color = colorEl.value
  
  try {
    await api('PUT', `/projects/${projectId}`, body)
    closeProjModal()
    showToast('Projeto atualizado!', 'success')
    renderProjects(document.getElementById('main-content'))
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function deleteProject(projectId) {
  if (!confirm('Excluir este projeto? Os conteúdos não serão excluídos.')) return
  try {
    await api('DELETE', `/projects/${projectId}`)
    showToast('Projeto excluído', 'info')
    renderProjects(document.getElementById('main-content'))
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function renderProjectDetail(container, projectId) {
  setBreadcrumb('Projetos → Detalhe')
  showLoader(container, 'Carregando projeto...')
  
  try {
    const data = await api('GET', `/projects/${projectId}`)
    const { project, documents, images, landingPages, chats } = data
    
    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <div class="flex items-center gap-4">
        <button onclick="navigate('/projetos')" class="btn-secondary px-3 py-2 rounded-xl text-sm font-medium">
          <i class="fas fa-arrow-left mr-1"></i>Projetos
        </button>
        <div class="flex items-center gap-3 flex-1">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background: ${project.color}20">
            <i class="fas fa-folder text-2xl" style="color: ${project.color}"></i>
          </div>
          <div>
            <h1 class="text-2xl font-black text-gray-900">${project.name}</h1>
            <p class="text-gray-500 text-sm">${project.description || 'Sem descrição'}</p>
          </div>
        </div>
        <button onclick="showEditProject('${project.id}','${project.name}','${project.description || ''}','${project.color}')" class="btn-secondary px-4 py-2 rounded-xl text-sm font-medium">
          <i class="fas fa-edit mr-1"></i>Editar
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${[
          { label: 'Documentos', count: documents.length, icon: 'fa-file-lines', color: 'purple' },
          { label: 'Imagens', count: images.length, icon: 'fa-image', color: 'pink' },
          { label: 'Landing Pages', count: landingPages.length, icon: 'fa-globe', color: 'blue' },
          { label: 'Conversas', count: chats.length, icon: 'fa-comments', color: 'indigo' },
        ].map(s => `
        <div class="card p-4 text-center">
          <div class="w-10 h-10 rounded-xl bg-${s.color}-100 flex items-center justify-center mx-auto mb-2">
            <i class="fas ${s.icon} text-${s.color}-600"></i>
          </div>
          <p class="text-2xl font-black text-gray-900">${s.count}</p>
          <p class="text-xs text-gray-500">${s.label}</p>
        </div>`).join('')}
      </div>

      ${documents.length > 0 ? `
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fas fa-file-lines text-purple-500"></i>Documentos
        </h2>
        <div class="space-y-2">
          ${documents.map(d => `
          <div onclick="navigate('/documentos/${d.id}')" class="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer group">
            <i class="fas fa-file-lines text-purple-400 text-sm"></i>
            <p class="text-sm font-medium text-gray-700 flex-1 group-hover:text-indigo-600">${d.title}</p>
            <span class="text-xs text-gray-400">${formatDate(d.created_at)}</span>
          </div>`).join('')}
        </div>
      </div>` : ''}

      ${images.length > 0 ? `
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fas fa-image text-pink-500"></i>Imagens
        </h2>
        <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
          ${images.map(img => `
          <div class="aspect-square rounded-xl overflow-hidden group relative cursor-pointer">
            <img src="${img.image_url}" alt="${img.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
          </div>`).join('')}
        </div>
      </div>` : ''}

      ${landingPages.length > 0 ? `
      <div class="card p-5">
        <h2 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <i class="fas fa-globe text-blue-500"></i>Landing Pages
        </h2>
        <div class="space-y-2">
          ${landingPages.map(lp => `
          <div onclick="navigate('/landing-pages/${lp.id}')" class="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer group">
            <i class="fas fa-globe text-blue-400 text-sm"></i>
            <p class="text-sm font-medium text-gray-700 flex-1 group-hover:text-indigo-600">${lp.title}</p>
            <span class="tag ${lp.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}">${lp.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
          </div>`).join('')}
        </div>
      </div>` : ''}
    </div>

    <!-- Modal para edit -->
    <div id="proj-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="modal-overlay absolute inset-0" onclick="closeProjModal()"></div>
      <div class="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10">
        <div id="proj-modal-content"></div>
      </div>
    </div>`
    
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><p class="text-red-500">${err.message}</p></div>`
  }
}

function closeProjModal() {
  document.getElementById('proj-modal')?.classList.add('hidden')
}

// ============================================================
// ACCOUNT MODULE
// ============================================================
async function renderAccount(container) {
  setBreadcrumb('Minha Conta')
  showLoader(container, 'Carregando conta...')
  
  try {
    const data = await api('GET', '/users/profile')
    const { user, usage, plan, limits } = data
    const isPro = plan === 'pro'
    
    container.innerHTML = `
    <div class="space-y-6 animate-fade max-w-4xl">
      <div>
        <h1 class="text-2xl font-black text-gray-900">Minha Conta</h1>
        <p class="text-gray-500 text-sm mt-1">Gerencie seu perfil e assinatura</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Profile -->
        <div class="lg:col-span-2 space-y-5">
          <div class="card p-6">
            <h2 class="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i class="fas fa-user-circle text-indigo-500"></i>Perfil
            </h2>
            <div class="flex items-center gap-4 mb-6">
              <div class="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl font-black">
                ${user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <p class="text-xl font-black text-gray-900">${user.name}</p>
                <p class="text-gray-500 text-sm">${user.email}</p>
                <p class="text-xs text-gray-400 mt-0.5">Membro desde ${formatDate(user.created_at)}</p>
              </div>
            </div>
            <form id="profile-form" onsubmit="updateProfile(event)" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
                <input type="text" name="name" value="${user.name}" class="input-field w-full" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input type="email" value="${user.email}" class="input-field w-full bg-gray-50" disabled>
                <p class="text-xs text-gray-400 mt-1">E-mail não pode ser alterado</p>
              </div>
              <button type="submit" class="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm">
                <i class="fas fa-save mr-2"></i>Salvar alterações
              </button>
            </form>
          </div>

          <!-- Usage this month -->
          <div class="card p-6">
            <h2 class="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <i class="fas fa-chart-bar text-indigo-500"></i>Uso do Mês Atual
            </h2>
            <div class="space-y-4">
              ${[
                { label: 'Mensagens de Chat', used: usage.chat.used, limit: usage.chat.limit, icon: 'fa-comments', color: 'indigo' },
                { label: 'Documentos', used: usage.documents.used, limit: usage.documents.limit, icon: 'fa-file-lines', color: 'purple' },
                { label: 'Imagens', used: usage.images.used, limit: usage.images.limit, icon: 'fa-image', color: 'pink' },
                { label: 'Landing Pages', used: usage.landing_pages.used, limit: usage.landing_pages.limit, icon: 'fa-globe', color: 'blue' },
                { label: 'Projetos', used: usage.projects.used, limit: usage.projects.limit, icon: 'fa-folder', color: 'green' },
              ].map(u => {
                const pct = Math.min(Math.round((u.used / u.limit) * 100), 100)
                const barClass = pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-yellow-500' : `bg-${u.color}-500`
                return `
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <i class="fas ${u.icon} text-${u.color}-500 w-4 text-center"></i>${u.label}
                    </div>
                    <span class="text-sm font-semibold ${pct > 85 ? 'text-red-600' : 'text-gray-600'}">${u.used}<span class="text-gray-400 font-normal">/${u.limit}</span></span>
                  </div>
                  <div class="bg-gray-100 rounded-full h-2">
                    <div class="${barClass} h-2 rounded-full transition-all" style="width: ${pct}%"></div>
                  </div>
                  <p class="text-xs text-gray-400 mt-1">${pct}% utilizado</p>
                </div>`
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Plan sidebar -->
        <div class="space-y-4">
          <div class="card p-5 ${isPro ? 'border-2 border-indigo-200' : ''}">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg ${isPro ? 'gradient-bg' : 'bg-gray-100'} flex items-center justify-center">
                <i class="fas ${isPro ? 'fa-star' : 'fa-user'} text-sm ${isPro ? 'text-yellow-300' : 'text-gray-500'}"></i>
              </div>
              <div>
                <p class="font-bold text-gray-900 text-sm">${isPro ? 'Plano Pro' : 'Plano Grátis'}</p>
                <p class="text-xs text-gray-400">${isPro ? 'Recursos completos' : 'Recursos limitados'}</p>
              </div>
            </div>
            ${isPro ? `
            <p class="text-xs text-green-600 bg-green-50 rounded-lg p-2 mb-3">✅ Você está no plano Pro!</p>` : `
            <p class="text-xs text-gray-500 mb-3">Faça upgrade para desbloquear todos os recursos.</p>
            <button onclick="upgradePlan()" class="w-full btn-primary py-2.5 rounded-xl text-sm font-bold">
              <i class="fas fa-star mr-1"></i>Fazer Upgrade
            </button>`}
          </div>

          <!-- Plan comparison -->
          <div class="card p-5">
            <h3 class="font-bold text-gray-900 text-sm mb-4">Comparativo de Planos</h3>
            <div class="space-y-3">
              ${[
                { feature: 'Mensagens Chat', free: '30/mês', pro: '500/mês' },
                { feature: 'Documentos', free: '5/mês', pro: '100/mês' },
                { feature: 'Imagens', free: '5/mês', pro: '50/mês' },
                { feature: 'Landing Pages', free: '2/mês', pro: '20/mês' },
                { feature: 'Projetos', free: '3', pro: '50' },
                { feature: 'Todos os templates', free: '❌', pro: '✅' },
                { feature: 'Suporte prioritário', free: '❌', pro: '✅' },
              ].map(f => `
              <div class="flex items-center gap-2 text-xs">
                <span class="text-gray-600 flex-1">${f.feature}</span>
                <span class="text-gray-400 w-14 text-right">${f.free}</span>
                <span class="text-indigo-600 font-semibold w-14 text-right">${f.pro}</span>
              </div>`).join('')}
              <div class="flex items-center gap-2 text-xs border-t border-gray-100 pt-2">
                <span class="text-gray-600 flex-1 font-semibold">Preço</span>
                <span class="text-gray-400 w-14 text-right">Grátis</span>
                <span class="text-indigo-600 font-bold w-14 text-right">R$97/mês</span>
              </div>
            </div>
            ${!isPro ? `
            <button onclick="upgradePlan()" class="w-full btn-primary py-2.5 rounded-xl text-sm font-bold mt-4">
              Assinar Pro →
            </button>` : ''}
          </div>

          <!-- Danger zone -->
          <div class="card p-5 border border-red-100">
            <h3 class="font-bold text-red-600 text-sm mb-3">Zona de Perigo</h3>
            <button onclick="logout()" class="w-full text-red-600 border border-red-200 hover:bg-red-50 py-2.5 rounded-xl text-sm font-semibold transition-all">
              <i class="fas fa-sign-out-alt mr-2"></i>Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>`
    
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><p class="text-red-500">${err.message}</p></div>`
  }
}

async function updateProfile(e) {
  e.preventDefault()
  const form = document.getElementById('profile-form')
  const name = form.querySelector('[name="name"]').value
  
  try {
    await api('PUT', '/users/profile', { name })
    currentUser = { ...currentUser, name }
    localStorage.setItem('studio_user', JSON.stringify(currentUser))
    showToast('Perfil atualizado!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function upgradePlan() {
  if (!confirm('Ativar o Plano Pro? (demonstração - sem cobrança real)')) return
  try {
    const data = await api('POST', '/users/upgrade')
    showToast(data.message || 'Upgrade realizado!', 'success')
    currentUser = { ...currentUser, plan: 'pro' }
    localStorage.setItem('studio_user', JSON.stringify(currentUser))
    renderAccount(document.getElementById('main-content'))
  } catch (err) {
    showToast(err.message, 'error')
  }
}

// ============================================================
// INIT
// ============================================================
currentRoute = window.location.pathname || '/'
render()
