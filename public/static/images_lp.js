
// ============================================================
// IMAGES MODULE
// ============================================================
async function renderImages(container) {
  setBreadcrumb('Imagens')
  showLoader(container, 'Carregando imagens...')
  
  try {
    const [imagesData, typesData] = await Promise.all([
      api('GET', '/images'),
      api('GET', '/images/types'),
    ])
    const images = imagesData.images || []
    const { types, styles } = typesData
    
    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900">Imagens</h1>
          <p class="text-gray-500 text-sm mt-1">Crie imagens de marketing com IA</p>
        </div>
        <button onclick="showImageGenerator()" class="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
          <i class="fas fa-wand-magic-sparkles"></i> Gerar Imagem
        </button>
      </div>

      <!-- Image types quick access -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${Object.entries(types).map(([id, name]) => `
        <button onclick="showImageGenerator('${id}')" class="card p-4 text-center group hover:border-pink-300 hover:bg-pink-50 border border-transparent transition-all">
          <div class="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
            <i class="fas fa-image text-pink-600 text-sm"></i>
          </div>
          <p class="text-xs font-semibold text-gray-700">${name}</p>
        </button>`).join('')}
      </div>

      <!-- Images gallery -->
      <div class="card p-6">
        <h2 class="font-bold text-gray-900 mb-4">Galeria (${images.length})</h2>
        ${images.length > 0 ? `
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          ${images.map(img => `
          <div class="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square">
            <img src="${img.image_url}" alt="${img.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="absolute bottom-3 left-3 right-3">
                <p class="text-white text-xs font-semibold truncate">${img.title}</p>
                <p class="text-white/70 text-xs capitalize">${img.image_type?.replace(/_/g, ' ')}</p>
              </div>
              <div class="absolute top-3 right-3 flex gap-2">
                <a href="${img.image_url}" target="_blank" class="w-7 h-7 bg-white/20 hover:bg-white/40 rounded-lg flex items-center justify-center text-white text-xs backdrop-blur-sm" title="Ver original">
                  <i class="fas fa-expand"></i>
                </a>
                <button onclick="deleteImage('${img.id}')" class="w-7 h-7 bg-red-500/80 hover:bg-red-600 rounded-lg flex items-center justify-center text-white text-xs" title="Excluir">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>`).join('')}
        </div>` : `
        <div class="text-center py-16">
          <div class="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-image text-gray-400 text-3xl"></i>
          </div>
          <p class="text-gray-500 mb-4 font-medium">Nenhuma imagem gerada ainda</p>
          <button onclick="showImageGenerator()" class="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm">
            <i class="fas fa-wand-magic-sparkles mr-2"></i>Gerar primeira imagem
          </button>
        </div>`}
      </div>
    </div>

    <!-- Generator Modal -->
    <div id="img-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="modal-overlay absolute inset-0" onclick="closeImgModal()"></div>
      <div class="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div id="img-modal-content"></div>
      </div>
    </div>`
    
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><p class="text-red-500">${err.message}</p></div>`
  }
}

function showImageGenerator(preselectedType = '') {
  const modal = document.getElementById('img-modal')
  const content = document.getElementById('img-modal-content')
  modal.classList.remove('hidden')
  
  content.innerHTML = `
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-black text-gray-900">Gerar Imagem com IA</h2>
        <p class="text-gray-400 text-sm">Descreva o que deseja criar</p>
      </div>
      <button onclick="closeImgModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
    </div>
    <form id="img-form" onsubmit="generateImage(event)" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Tipo de peça <span class="text-red-500">*</span></label>
        <select name="image_type" class="input-field w-full text-sm" required>
          <option value="">Selecione o tipo</option>
          <option value="post_social" ${preselectedType === 'post_social' ? 'selected' : ''}>Post para Social Media</option>
          <option value="banner" ${preselectedType === 'banner' ? 'selected' : ''}>Banner Promocional</option>
          <option value="capa" ${preselectedType === 'capa' ? 'selected' : ''}>Capa / Cover</option>
          <option value="criativo_anuncio" ${preselectedType === 'criativo_anuncio' ? 'selected' : ''}>Criativo de Anúncio</option>
          <option value="thumbnail" ${preselectedType === 'thumbnail' ? 'selected' : ''}>Thumbnail</option>
          <option value="logo_concept" ${preselectedType === 'logo_concept' ? 'selected' : ''}>Conceito de Logo</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Descrição da imagem <span class="text-red-500">*</span></label>
        <textarea name="prompt" class="input-field w-full text-sm" rows="3" required
          placeholder="Ex: Post elegante para lançamento de produto de beleza, fundo clean, tons rosé e dourado, texto 'Novidade!' em destaque"></textarea>
        <p class="text-xs text-gray-400 mt-1">Quanto mais detalhes, melhor o resultado!</p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Estilo visual</label>
          <select name="style" class="input-field w-full text-sm">
            <option value="minimalista">Minimalista e clean</option>
            <option value="moderno">Moderno e tecnológico</option>
            <option value="elegante">Elegante e premium</option>
            <option value="vibrante">Vibrante e colorido</option>
            <option value="corporativo">Corporativo</option>
            <option value="casual">Casual e descontraído</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Formato</label>
          <select name="format" class="input-field w-full text-sm">
            <option value="quadrado">Quadrado (1:1)</option>
            <option value="horizontal">Horizontal (16:9)</option>
            <option value="vertical">Vertical (9:16)</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Cores predominantes <span class="text-gray-400 text-xs">(opcional)</span></label>
        <input type="text" name="colors" class="input-field w-full text-sm" placeholder="Ex: azul e branco, tons terrosos, preto e dourado">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Call to action <span class="text-gray-400 text-xs">(opcional)</span></label>
        <input type="text" name="cta" class="input-field w-full text-sm" placeholder="Ex: Compre agora! ou 50% OFF">
      </div>
      <button type="submit" id="gen-img-btn" class="w-full btn-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2">
        <i class="fas fa-wand-magic-sparkles"></i> Gerar Imagem
      </button>
    </form>
  </div>`
}

async function generateImage(e) {
  e.preventDefault()
  const btn = document.getElementById('gen-img-btn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>Gerando imagem...'
  
  const form = document.getElementById('img-form')
  const formData = new FormData(form)
  const body = {}
  formData.forEach((v, k) => body[k] = v)
  
  try {
    const data = await api('POST', '/images/generate', body)
    closeImgModal()
    showToast('Imagem gerada com sucesso!', 'success')
    renderImages(document.getElementById('main-content'))
  } catch (err) {
    showToast(err.message, 'error')
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Gerar Imagem'
  }
}

async function deleteImage(imgId) {
  if (!confirm('Excluir esta imagem?')) return
  try {
    await api('DELETE', `/images/${imgId}`)
    showToast('Imagem excluída', 'info')
    renderImages(document.getElementById('main-content'))
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function closeImgModal() {
  document.getElementById('img-modal')?.classList.add('hidden')
}

// ============================================================
// LANDING PAGES MODULE
// ============================================================
async function renderLandingPages(container) {
  setBreadcrumb('Landing Pages')
  showLoader(container, 'Carregando landing pages...')
  
  try {
    const data = await api('GET', '/landing-pages')
    const pages = data.landing_pages || []
    
    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900">Landing Pages</h1>
          <p class="text-gray-500 text-sm mt-1">Crie páginas de vendas profissionais com IA</p>
        </div>
        <button onclick="showLPGenerator()" class="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
          <i class="fas fa-plus"></i> Nova Landing Page
        </button>
      </div>

      <!-- How it works banner -->
      <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-globe text-white text-xl"></i>
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg mb-1">Crie sua landing page em minutos</h3>
            <p class="text-white/80 text-sm">A IA gera o design, o texto e o formulário de captura. Você só precisa responder algumas perguntas!</p>
          </div>
          <button onclick="showLPGenerator()" class="bg-white text-indigo-700 px-5 py-2 rounded-xl font-bold text-sm flex-shrink-0 hover:shadow-lg transition-all">
            Criar agora
          </button>
        </div>
      </div>

      <!-- Pages list -->
      <div class="card p-6">
        <h2 class="font-bold text-gray-900 mb-4">Minhas Landing Pages (${pages.length})</h2>
        ${pages.length > 0 ? `
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${pages.map(p => `
          <div class="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all group">
            <div class="bg-gradient-to-br from-indigo-500 to-purple-600 h-28 flex items-center justify-center">
              <i class="fas fa-globe text-white text-3xl opacity-60"></i>
            </div>
            <div class="p-4">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-bold text-gray-900 text-sm leading-tight flex-1">${p.title}</h3>
                <span class="tag ml-2 flex-shrink-0 ${p.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}">${p.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
              </div>
              <p class="text-xs text-gray-500 mb-3">${p.business_name} • ${formatDate(p.created_at)}</p>
              <div class="flex gap-2">
                <button onclick="navigate('/landing-pages/${p.id}')" class="btn-primary flex-1 py-1.5 rounded-lg text-xs font-semibold">
                  <i class="fas fa-edit mr-1"></i>Editar
                </button>
                <button onclick="previewLP('${p.id}')" class="btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold" title="Preview">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteLP('${p.id}')" class="text-gray-400 hover:text-red-500 px-2 transition-colors" title="Excluir">
                  <i class="fas fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          </div>`).join('')}
        </div>` : `
        <div class="text-center py-16">
          <div class="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-globe text-gray-400 text-3xl"></i>
          </div>
          <p class="text-gray-500 mb-4 font-medium">Nenhuma landing page ainda</p>
          <button onclick="showLPGenerator()" class="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm">
            <i class="fas fa-plus mr-2"></i>Criar primeira landing page
          </button>
        </div>`}
      </div>
    </div>

    <!-- Generator Modal -->
    <div id="lp-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="modal-overlay absolute inset-0" onclick="closeLPModal()"></div>
      <div class="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div id="lp-modal-content"></div>
      </div>
    </div>`
    
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><p class="text-red-500">${err.message}</p></div>`
  }
}

function showLPGenerator() {
  const modal = document.getElementById('lp-modal')
  const content = document.getElementById('lp-modal-content')
  modal.classList.remove('hidden')
  
  content.innerHTML = `
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-black text-gray-900">Criar Landing Page com IA</h2>
        <p class="text-gray-400 text-sm">Responda as perguntas e a IA cria sua página</p>
      </div>
      <button onclick="closeLPModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
    </div>
    <form id="lp-form" onsubmit="generateLP(event)" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Nome do negócio <span class="text-red-500">*</span></label>
          <input type="text" name="business_name" class="input-field w-full text-sm" placeholder="Ex: Consultoria Silva" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Tom da comunicação</label>
          <select name="tone" class="input-field w-full text-sm">
            <option value="profissional">Profissional</option>
            <option value="descontraido">Descontraído</option>
            <option value="urgente">Urgente / Impactante</option>
            <option value="elegante">Elegante / Premium</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Oferta principal <span class="text-red-500">*</span></label>
        <input type="text" name="offer" class="input-field w-full text-sm" required
          placeholder="Ex: Consultoria gratuita de 30 minutos para pequenos negócios">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Público-alvo</label>
        <input type="text" name="target_audience" class="input-field w-full text-sm"
          placeholder="Ex: Pequenos empreendedores do setor de serviços">
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Principais benefícios (um por linha)</label>
        <textarea name="benefits" class="input-field w-full text-sm" rows="4"
          placeholder="Aumento de vendas em até 40%&#10;Metodologia comprovada&#10;Suporte dedicado&#10;Resultados em 30 dias"></textarea>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Call to action (CTA)</label>
          <input type="text" name="cta" class="input-field w-full text-sm" placeholder="Ex: Quero minha consultoria gratuita!">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1.5">Cores do site</label>
          <select name="colors" class="input-field w-full text-sm">
            <option value="roxo">Roxo/Indigo (Moderno)</option>
            <option value="azul">Azul (Corporativo)</option>
            <option value="verde">Verde (Saúde/Natural)</option>
            <option value="vermelho">Vermelho (Urgência)</option>
            <option value="laranja">Laranja (Energia)</option>
          </select>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">Prova social (depoimento) <span class="text-gray-400 text-xs">(opcional)</span></label>
        <input type="text" name="social_proof" class="input-field w-full text-sm"
          placeholder="Ex: Aumentei meu faturamento em 60% em apenas 2 meses!">
      </div>
      <button type="submit" id="gen-lp-btn" class="w-full btn-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-2">
        <i class="fas fa-wand-magic-sparkles"></i> Gerar Landing Page
      </button>
    </form>
  </div>`
}

async function generateLP(e) {
  e.preventDefault()
  const btn = document.getElementById('gen-lp-btn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>Criando sua página...'
  
  const form = document.getElementById('lp-form')
  const formData = new FormData(form)
  const body = {}
  formData.forEach((v, k) => body[k] = v)
  
  try {
    const data = await api('POST', '/landing-pages/generate', body)
    closeLPModal()
    showToast('Landing page criada com sucesso!', 'success')
    navigate(`/landing-pages/${data.landing_page.id}`)
  } catch (err) {
    showToast(err.message, 'error')
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Gerar Landing Page'
  }
}

async function renderLandingPageEditor(container, lpId) {
  setBreadcrumb('Landing Pages → Editor')
  showLoader(container, 'Carregando landing page...')
  
  try {
    const data = await api('GET', `/landing-pages/${lpId}`)
    const page = data.landing_page
    let contentData = {}
    try { contentData = JSON.parse(page.content) } catch {}
    
    container.innerHTML = `
    <div class="space-y-4 animate-fade">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="navigate('/landing-pages')" class="btn-secondary px-3 py-2 rounded-xl text-sm font-medium">
            <i class="fas fa-arrow-left mr-1"></i>Voltar
          </button>
          <input id="lp-title" value="${page.title}" class="input-field text-lg font-bold" style="min-width: 300px">
        </div>
        <div class="flex items-center gap-2">
          <button onclick="previewLPById('${lpId}')" class="btn-secondary px-4 py-2 rounded-xl text-sm font-medium">
            <i class="fas fa-eye mr-1"></i>Preview
          </button>
          <button onclick="saveLandingPage('${lpId}')" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-save mr-1"></i>Salvar
          </button>
        </div>
      </div>
      
      <div class="card p-4 flex items-center gap-3 text-sm">
        <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-globe text-blue-600 text-xs"></i>
        </div>
        <span class="text-gray-600">Negócio: <strong>${page.business_name}</strong></span>
        <span class="text-gray-400">•</span>
        <span class="text-gray-600">Oferta: <strong>${truncate(page.offer, 50)}</strong></span>
        <span class="ml-auto tag ${page.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}">${page.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
      </div>
      
      <!-- Preview iframe -->
      <div class="card overflow-hidden">
        <div class="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <div class="flex gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-green-400"></div>
          </div>
          <p class="text-xs text-gray-400 flex-1 text-center">Preview da Landing Page</p>
          <button onclick="previewLPById('${lpId}')" class="text-xs text-indigo-600 hover:underline">Abrir em nova aba</button>
        </div>
        <div style="height: 500px; overflow: hidden;">
          <iframe id="lp-preview-frame" src="/api/landing-pages/${lpId}/preview" style="width: 200%; height: 200%; transform: scale(0.5); transform-origin: top left; border: none;"></iframe>
        </div>
      </div>
    </div>`
    
    window._currentLP = page
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><p class="text-red-500">${err.message}</p></div>`
  }
}

async function saveLandingPage(lpId) {
  const title = document.getElementById('lp-title')?.value
  try {
    await api('PUT', `/landing-pages/${lpId}`, { 
      title, 
      content: window._currentLP?.content,
      status: window._currentLP?.status || 'draft'
    })
    showToast('Landing page salva!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function previewLP(lpId) {
  window.open(`/api/landing-pages/${lpId}/preview`, '_blank')
}

function previewLPById(lpId) {
  window.open(`/api/landing-pages/${lpId}/preview`, '_blank')
}

async function deleteLP(lpId) {
  if (!confirm('Excluir esta landing page?')) return
  try {
    await api('DELETE', `/landing-pages/${lpId}`)
    showToast('Landing page excluída', 'info')
    renderLandingPages(document.getElementById('main-content'))
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function closeLPModal() {
  document.getElementById('lp-modal')?.classList.add('hidden')
}
