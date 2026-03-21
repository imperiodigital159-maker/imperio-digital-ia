// ============================================================
// STUDIO IA — IMAGENS & LANDING PAGES
// ============================================================

// ============================================================
// IMAGENS
// ============================================================
const IMAGE_TYPES_UI = {
  post_social: { icon: 'fa-instagram', label: 'Post Social Media', desc: 'Feed, stories, reels', color: 'pink' },
  banner: { icon: 'fa-rectangle-wide', label: 'Banner Promocional', desc: 'Promoções e ofertas', color: 'orange' },
  capa: { icon: 'fa-image', label: 'Capa / Cover', desc: 'Capa de perfil e grupos', color: 'blue' },
  criativo_anuncio: { icon: 'fa-bullhorn', label: 'Criativo de Anúncio', desc: 'Facebook, Instagram Ads', color: 'red' },
  thumbnail: { icon: 'fa-film', label: 'Thumbnail', desc: 'YouTube, blog, apresentações', color: 'green' },
  logo_concept: { icon: 'fa-star', label: 'Conceito de Logo', desc: 'Ideia de identidade visual', color: 'purple' }
}

const IMAGE_STYLES_UI = {
  minimalista: { label: 'Minimalista', icon: '⬜', desc: 'Clean e moderno' },
  moderno: { label: 'Moderno', icon: '🔷', desc: 'Tecnológico e atual' },
  elegante: { label: 'Elegante', icon: '✨', desc: 'Premium e sofisticado' },
  vibrante: { label: 'Vibrante', icon: '🌈', desc: 'Colorido e chamativo' },
  corporativo: { label: 'Corporativo', icon: '💼', desc: 'Profissional e sério' },
  casual: { label: 'Casual', icon: '😊', desc: 'Descontraído e simpático' }
}

async function renderImages(container) {
  setBreadcrumb('Imagens')
  showLoader(container, 'Carregando imagens...')

  try {
    const data = await api('GET', '/images')
    const images = data.images || []

    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-cream">Imagens & Criativos</h1>
          <p class="text-warm-gray text-sm">${images.length} imagem${images.length !== 1 ? 'ns' : ''} criada${images.length !== 1 ? 's' : ''}</p>
        </div>
        <button onclick="showImageWizard()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          <i class="fas fa-plus"></i> Gerar imagem
        </button>
      </div>

      <!-- Generator Card -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="font-bold text-cream">Gerador de Imagens IA</h2>
            <p class="text-sm text-warm-gray">Descreva sua imagem e a IA criará algo único</p>
          </div>
          <div id="dalle-status" class="flex items-center gap-2 text-xs text-dim">
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            Verificando...
          </div>
        </div>

        <!-- Type selection -->
        <div class="mb-5">
          <label class="block text-sm font-medium text-cream-3 mb-3">Tipo de Peça</label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            ${Object.entries(IMAGE_TYPES_UI).map(([id, t], i) => `
            <button onclick="selectImageType('${id}')" id="itype-${id}" class="p-3 rounded-xl border-2 ${i === 0 ? 'border-yellow-500 bg-yellow-900/20' : 'border-gold-faint hover:border-yellow-900/40'} transition-all text-left">
              <div class="w-8 h-8 rounded-lg bg-${t.color}-100 flex items-center justify-center mb-2">
                <i class="fas ${t.icon} text-${t.color}-500 text-xs"></i>
              </div>
              <p class="font-semibold text-cream-2 text-xs">${t.label}</p>
              <p class="text-xs text-dim">${t.desc}</p>
            </button>`).join('')}
          </div>
        </div>

        <!-- Description -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-cream-3 mb-1.5">Descrição da Imagem</label>
          <textarea id="img-prompt" rows="3" class="input-field w-full text-sm" placeholder="Descreva o que você quer na imagem. Ex: Logo minimalista para clínica odontológica, cores azul e branco, estilo moderno..."></textarea>
        </div>

        <!-- Style & Colors row -->
        <div class="grid sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label class="block text-sm font-medium text-cream-3 mb-2">Estilo Visual</label>
            <div class="grid grid-cols-3 gap-2">
              ${Object.entries(IMAGE_STYLES_UI).map(([id, s], i) => `
              <button onclick="selectImageStyle('${id}')" id="istyle-${id}" class="p-2 rounded-lg border-2 ${i === 0 ? 'border-yellow-500 bg-yellow-900/20' : 'border-gold-faint hover:border-yellow-900/40'} transition-all text-center text-xs">
                <div class="text-lg mb-1">${s.icon}</div>
                <div class="font-medium text-cream-3 text-xs">${s.label}</div>
              </button>`).join('')}
            </div>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-cream-3 mb-1.5">Cores Principais</label>
              <input id="img-colors" type="text" class="input-field w-full text-sm" placeholder="Ex: azul, branco e dourado">
            </div>
            <div>
              <label class="block text-sm font-medium text-cream-3 mb-1.5">CTA (opcional)</label>
              <input id="img-cta" type="text" class="input-field w-full text-sm" placeholder="Ex: Ligue agora, Saiba mais">
            </div>
          </div>
        </div>

        <button onclick="generateImage()" id="img-gen-btn" class="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          <i class="fas fa-wand-magic-sparkles"></i>Gerar Imagem com IA
        </button>
      </div>

      <!-- Gallery -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-cream">Galeria de Imagens</h2>
          <div class="flex gap-2">
            <button onclick="renderImagesGallery('grid')" id="view-grid" class="p-2 rounded-lg bg-yellow-900/30 text-yellow-400">
              <i class="fas fa-grid-2 text-sm"></i>
            </button>
            <button onclick="renderImagesGallery('list')" id="view-list" class="p-2 rounded-lg text-dim hover:bg-dark-4">
              <i class="fas fa-list text-sm"></i>
            </button>
          </div>
        </div>
        <div id="images-gallery">
          ${images.length === 0 ? `
          <div class="text-center py-12">
            <div class="w-16 h-16 rounded-2xl bg-dark-4 flex items-center justify-center mx-auto mb-4"><i class="fas fa-image text-dim text-2xl"></i></div>
            <p class="font-semibold text-cream-3 mb-2">Nenhuma imagem ainda</p>
            <p class="text-dim text-sm">Gere sua primeira imagem usando o formulário acima</p>
          </div>` : renderImageGalleryGrid(images)}
        </div>
      </div>
    </div>`

    window._allImages = images
    window._selectedImageType = 'post_social'
    window._selectedImageStyle = 'minimalista'

    checkDALLEStatus()
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function renderImageGalleryGrid(images) {
  return `<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
    ${images.map(img => `
    <div class="group relative rounded-xl overflow-hidden aspect-square cursor-pointer bg-dark-4" onclick="openImageModal('${img.id}', '${encodeURIComponent(img.image_url)}', '${encodeURIComponent(img.title || '')}')">
      <img src="${img.image_url}" alt="${img.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'">
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div class="absolute bottom-0 left-0 right-0 p-3">
          <p class="text-white text-xs font-medium truncate">${img.title}</p>
          <p class="text-white/60 text-xs">${formatDate(img.created_at)}</p>
        </div>
        <div class="absolute top-2 right-2 flex gap-1">
          <button onclick="event.stopPropagation(); downloadImage('${encodeURIComponent(img.image_url)}', '${encodeURIComponent(img.title)}')" class="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/40 transition-colors">
            <i class="fas fa-download text-xs"></i>
          </button>
          <button onclick="event.stopPropagation(); deleteImage('${img.id}')" class="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-red-500/80 transition-colors">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>
    </div>`).join('')}
  </div>`
}

function renderImagesGallery(mode) {
  const images = window._allImages || []
  const gallery = document.getElementById('images-gallery')
  if (!gallery) return

  document.getElementById('view-grid').className = `p-2 rounded-lg ${mode === 'grid' ? 'bg-yellow-900/30 text-yellow-400' : 'text-dim hover:bg-dark-4'}`
  document.getElementById('view-list').className = `p-2 rounded-lg ${mode === 'list' ? 'bg-yellow-900/30 text-yellow-400' : 'text-dim hover:bg-dark-4'}`

  if (mode === 'grid') {
    gallery.innerHTML = renderImageGalleryGrid(images)
  } else {
    gallery.innerHTML = `<div class="space-y-3">
      ${images.map(img => `
      <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-2 transition-colors group">
        <img src="${img.image_url}" alt="${img.title}" class="w-16 h-16 rounded-xl object-cover flex-shrink-0">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-cream-2 text-sm truncate">${img.title}</p>
          <p class="text-xs text-dim">${img.image_type?.replace(/_/g, ' ')} • ${img.style || ''} • ${formatDate(img.created_at)}</p>
        </div>
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onclick="downloadImage('${encodeURIComponent(img.image_url)}', '${encodeURIComponent(img.title)}')" class="p-2 rounded-lg text-dim hover:text-yellow-500 hover:bg-yellow-900/20" title="Download">
            <i class="fas fa-download text-xs"></i>
          </button>
          <button onclick="deleteImage('${img.id}')" class="p-2 rounded-lg text-dim hover:text-red-500 hover:bg-red-50" title="Excluir">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>`).join('')}
    </div>`
  }
}

function selectImageType(id) {
  window._selectedImageType = id
  document.querySelectorAll('[id^="itype-"]').forEach(el => {
    el.classList.remove('border-yellow-500', 'bg-yellow-900/20')
    el.classList.add('border-gold-faint')
  })
  const el = document.getElementById(`itype-${id}`)
  if (el) {
    el.classList.add('border-yellow-500', 'bg-yellow-900/20')
    el.classList.remove('border-gold-faint')
  }
}

function selectImageStyle(id) {
  window._selectedImageStyle = id
  document.querySelectorAll('[id^="istyle-"]').forEach(el => {
    el.classList.remove('border-yellow-500', 'bg-yellow-900/20')
    el.classList.add('border-gold-faint')
  })
  const el = document.getElementById(`istyle-${id}`)
  if (el) {
    el.classList.add('border-yellow-500', 'bg-yellow-900/20')
    el.classList.remove('border-gold-faint')
  }
}

async function generateImage() {
  const prompt = document.getElementById('img-prompt')?.value?.trim()
  if (!prompt) { showToast('Descreva a imagem desejada', 'warning'); return }

  const btn = document.getElementById('img-gen-btn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>Gerando com IA...'

  try {
    const data = await api('POST', '/images/generate', {
      prompt,
      image_type: window._selectedImageType || 'post_social',
      style: window._selectedImageStyle || 'minimalista',
      colors: document.getElementById('img-colors')?.value,
      cta: document.getElementById('img-cta')?.value,
    })

    const img = data.image
    window._allImages = [img, ...(window._allImages || [])]

    // Show result
    const gallery = document.getElementById('images-gallery')
    if (gallery) gallery.innerHTML = renderImageGalleryGrid(window._allImages)

    showToast('Imagem gerada com sucesso!', 'success')
    openImageModal(img.id, encodeURIComponent(img.image_url), encodeURIComponent(img.title))

    // Reset form
    document.getElementById('img-prompt').value = ''
    document.getElementById('img-colors').value = ''
    document.getElementById('img-cta').value = ''

  } catch (err) {
    showToast(err.message, 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-2"></i>Gerar Imagem com IA'
  }
}

function showImageWizard() {
  document.getElementById('img-prompt')?.focus()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openImageModal(id, encodedUrl, encodedTitle) {
  const url = decodeURIComponent(encodedUrl)
  const title = decodeURIComponent(encodedTitle)

  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-overlay'
  modal.id = 'img-modal'
  modal.innerHTML = `
  <div class="modal-content rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden">
    <div class="flex items-center justify-between p-4 border-b border-gold-faint">
      <h3 class="font-bold text-cream">${title}</h3>
      <button onclick="document.getElementById('img-modal').remove()" class="text-dim hover:text-gold-muted w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dark-4">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="relative">
      <img src="${url}" alt="${title}" class="w-full max-h-[60vh] object-contain bg-dark-2">
    </div>
    <div class="p-4 flex gap-3 justify-end">
      <button onclick="downloadImage('${encodeURIComponent(url)}', '${encodeURIComponent(title)}')" class="btn-secondary px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
        <i class="fas fa-download"></i>Download
      </button>
      <button onclick="copyImageUrl('${url}')" class="btn-secondary px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2">
        <i class="fas fa-link"></i>Copiar URL
      </button>
      <button onclick="deleteImage('${id}', true)" class="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-2">
        <i class="fas fa-trash"></i>Excluir
      </button>
    </div>
  </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

function downloadImage(encodedUrl, encodedTitle) {
  const url = decodeURIComponent(encodedUrl)
  const title = decodeURIComponent(encodedTitle)
  const a = document.createElement('a')
  a.href = url
  a.download = (title || 'studio-ia-image') + '.jpg'
  a.target = '_blank'
  a.click()
  showToast('Download iniciado!', 'success')
}

function copyImageUrl(url) {
  navigator.clipboard.writeText(url).then(() => showToast('URL copiada!', 'success'))
}

async function deleteImage(id, closeModal = false) {
  if (!confirm('Excluir esta imagem?')) return
  try {
    await api('DELETE', `/images/${id}`)
    if (closeModal) document.getElementById('img-modal')?.remove()
    window._allImages = (window._allImages || []).filter(i => i.id !== id)
    const gallery = document.getElementById('images-gallery')
    if (gallery) gallery.innerHTML = renderImageGalleryGrid(window._allImages)
    showToast('Imagem excluída', 'info')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function checkDALLEStatus() {
  try {
    const data = await api('GET', '/settings')
    const statusEl = document.getElementById('dalle-status')
    if (statusEl) {
      if (data.settings?.openai_key) {
        statusEl.innerHTML = '<div class="w-2 h-2 bg-green-500 rounded-full"></div><span class="text-green-600">DALL-E 3 ativo</span>'
      } else {
        statusEl.innerHTML = '<div class="w-2 h-2 bg-yellow-400 rounded-full"></div><span>Modo demo (sem DALL-E)</span>'
      }
    }
  } catch {}
}

// ============================================================
// LANDING PAGES
// ============================================================
async function renderLandingPages(container) {
  setBreadcrumb('Landing Pages')
  showLoader(container, 'Carregando landing pages...')

  try {
    const data = await api('GET', '/landing-pages')
    const pages = data.landing_pages || []

    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-cream">Landing Pages</h1>
          <p class="text-warm-gray text-sm">${pages.length} página${pages.length !== 1 ? 's' : ''} criada${pages.length !== 1 ? 's' : ''}</p>
        </div>
        <button onclick="showLPWizard()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          <i class="fas fa-plus"></i>Nova landing page
        </button>
      </div>

      <!-- Pages list -->
      <div id="lp-list-section">
        ${pages.length === 0 ? `
        <div class="card p-12 text-center">
          <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-5">
            <i class="fas fa-globe text-yellow-500 text-3xl"></i>
          </div>
          <h2 class="text-2xl font-black text-cream mb-3">Crie sua primeira Landing Page</h2>
          <p class="text-warm-gray max-w-md mx-auto mb-6">Gere páginas de vendas completas em minutos com IA. Copy persuasivo, design profissional e formulário de captura prontos.</p>
          <div class="flex gap-3 justify-center flex-wrap">
            <button onclick="showLPWizard()" class="btn-primary px-6 py-3 rounded-xl font-semibold">
              <i class="fas fa-wand-magic-sparkles mr-2"></i>Criar com IA
            </button>
          </div>
        </div>` : `
        <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          ${pages.map(p => renderLPCard(p)).join('')}
        </div>`}
      </div>
    </div>`
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function renderLPCard(page) {
  return `
  <div class="card overflow-hidden group">
    <!-- Preview -->
    <div class="relative h-40 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center text-white p-4">
          <i class="fas fa-globe text-4xl opacity-30 mb-2 block"></i>
          <p class="font-bold text-sm opacity-80">${page.business_name || page.title}</p>
          <p class="text-xs opacity-60">${page.offer || 'Landing Page'}</p>
        </div>
      </div>
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button onclick="openLPPreview('${page.id}')" class="bg-white text-cream px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-dark-4 transition-colors">
          <i class="fas fa-eye mr-1"></i>Preview
        </button>
        <button onclick="navigate('/landing-pages/${page.id}')" class="bg-white text-cream px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-dark-4 transition-colors">
          <i class="fas fa-edit mr-1"></i>Editar
        </button>
      </div>
    </div>

    <div class="p-4">
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-cream text-sm truncate">${page.title}</h3>
          <p class="text-xs text-warm-gray truncate">${page.business_name || ''} ${page.offer ? '• ' + page.offer : ''}</p>
        </div>
        <span class="tag ${page.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'} ml-2 flex-shrink-0">${page.status === 'published' ? 'Publicada' : 'Rascunho'}</span>
      </div>
      <p class="text-xs text-dim mb-3">${formatDate(page.created_at)}</p>

      <div class="flex gap-2">
        <button onclick="navigate('/landing-pages/${page.id}')" class="flex-1 btn-secondary py-2 rounded-xl text-xs font-medium">
          <i class="fas fa-edit mr-1"></i>Editar
        </button>
        <button onclick="openLPPreview('${page.id}')" class="flex-1 btn-secondary py-2 rounded-xl text-xs font-medium">
          <i class="fas fa-eye mr-1"></i>Preview
        </button>
        <button onclick="deleteLandingPage('${page.id}')" class="p-2 rounded-xl text-dim hover:text-red-500 hover:bg-red-50 transition-colors">
          <i class="fas fa-trash text-xs"></i>
        </button>
      </div>
    </div>
  </div>`
}

function showLPWizard() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-overlay'
  modal.id = 'lp-wizard-modal'
  modal.innerHTML = `
  <div class="modal-content rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
    <div class="flex items-center justify-between p-6 border-b border-gold-faint">
      <div>
        <h2 class="text-xl font-black text-cream">Nova Landing Page</h2>
        <p class="text-warm-gray text-sm">A IA vai criar uma página completa para você</p>
      </div>
      <button onclick="document.getElementById('lp-wizard-modal').remove()" class="text-dim hover:text-gold-muted w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dark-4">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="space-y-4">
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-cream-3 mb-1.5">Nome do Negócio *</label>
            <input id="lp-business" type="text" class="input-field w-full text-sm" placeholder="Ex: Clínica Saúde Total">
          </div>
          <div>
            <label class="block text-sm font-medium text-cream-3 mb-1.5">Título da Página *</label>
            <input id="lp-title" type="text" class="input-field w-full text-sm" placeholder="Ex: Consulta Gratuita de Nutrição">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-cream-3 mb-1.5">Oferta Principal *</label>
          <input id="lp-offer" type="text" class="input-field w-full text-sm" placeholder="Ex: Consultoria gratuita de 30 minutos">
        </div>

        <div>
          <label class="block text-sm font-medium text-cream-3 mb-1.5">Público-alvo</label>
          <input id="lp-audience" type="text" class="input-field w-full text-sm" placeholder="Ex: Profissionais 35-50 anos que querem melhorar a saúde">
        </div>

        <div>
          <label class="block text-sm font-medium text-cream-3 mb-1.5">Principais Benefícios</label>
          <textarea id="lp-benefits" rows="3" class="input-field w-full text-sm" placeholder="Ex: Atendimento personalizado&#10;Resultados em 30 dias&#10;Sem contratos de longo prazo"></textarea>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-cream-3 mb-1.5">Call to Action (CTA)</label>
            <input id="lp-cta" type="text" class="input-field w-full text-sm" placeholder="Ex: Agendar consulta grátis">
          </div>
          <div>
            <label class="block text-sm font-medium text-cream-3 mb-1.5">Tom de Comunicação</label>
            <select id="lp-tone" class="input-field w-full text-sm">
              <option value="profissional">Profissional e confiável</option>
              <option value="amigavel">Amigável e próximo</option>
              <option value="urgente">Urgente e persuasivo</option>
              <option value="premium">Premium e exclusivo</option>
              <option value="descontraido">Descontraído e moderno</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-cream-3 mb-1.5">Prova Social (depoimentos, números)</label>
          <textarea id="lp-social-proof" rows="2" class="input-field w-full text-sm" placeholder="Ex: +500 clientes atendidos, 4.9/5 de avaliação"></textarea>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-cream-3 mb-1.5">Cor Principal</label>
            <input id="lp-color" type="text" class="input-field w-full text-sm" placeholder="Ex: azul escuro, verde, roxo">
          </div>
          <div>
            <label class="block text-sm font-medium text-cream-3 mb-1.5">Setor / Nicho</label>
            <input id="lp-sector" type="text" class="input-field w-full text-sm" placeholder="Ex: saúde, consultoria, beleza">
          </div>
        </div>

        <div class="bg-yellow-900/20 border border-yellow-900/40 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <i class="fas fa-brain text-yellow-500 mt-0.5"></i>
            <div>
              <p class="text-sm font-semibold text-indigo-800">Geração Inteligente com IA</p>
              <p class="text-xs text-yellow-500 mt-1">Com OpenAI configurado, a página será gerada com copy personalizado e persuasivo. Sem IA, usamos templates otimizados de alta conversão.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-gold-faint flex gap-3 justify-end">
      <button onclick="document.getElementById('lp-wizard-modal').remove()" class="btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">
        Cancelar
      </button>
      <button onclick="generateLandingPage()" id="lp-gen-btn" class="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
        <i class="fas fa-wand-magic-sparkles"></i>Gerar Landing Page
      </button>
    </div>
  </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function generateLandingPage() {
  const title = document.getElementById('lp-title')?.value?.trim()
  const business = document.getElementById('lp-business')?.value?.trim()
  const offer = document.getElementById('lp-offer')?.value?.trim()

  if (!title || !business || !offer) {
    showToast('Preencha nome do negócio, título e oferta', 'warning')
    return
  }

  const btn = document.getElementById('lp-gen-btn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>Gerando...'

  try {
    const data = await api('POST', '/landing-pages/generate', {
      title,
      business_name: business,
      offer,
      target_audience: document.getElementById('lp-audience')?.value,
      benefits: document.getElementById('lp-benefits')?.value,
      cta: document.getElementById('lp-cta')?.value || 'Quero saber mais',
      tone: document.getElementById('lp-tone')?.value || 'profissional',
      social_proof: document.getElementById('lp-social-proof')?.value,
      primary_color: document.getElementById('lp-color')?.value || 'indigo',
      sector: document.getElementById('lp-sector')?.value,
    })

    document.getElementById('lp-wizard-modal')?.remove()
    showToast('Landing page gerada!', 'success')
    navigate('/landing-pages/' + data.landing_page.id)
  } catch (err) {
    showToast(err.message, 'error')
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-2"></i>Gerar Landing Page'
  }
}

async function renderLandingPageEditor(container, pageId) {
  setBreadcrumb('Editor de Landing Page')
  showLoader(container, 'Carregando landing page...')

  try {
    const data = await api('GET', `/landing-pages/${pageId}`)
    const page = data.landing_page

    container.innerHTML = `
    <div class="space-y-4 animate-fade">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button onclick="navigate('/landing-pages')" class="btn-secondary p-2 rounded-xl">
          <i class="fas fa-arrow-left text-sm"></i>
        </button>
        <div class="flex-1">
          <input id="lp-edit-title" type="text" value="${page.title}" class="text-xl font-black text-cream bg-transparent border-none outline-none w-full focus:bg-white focus:border focus:border-yellow-800 focus:rounded-lg focus:px-2 transition-all">
        </div>
        <div class="flex items-center gap-2">
          <button onclick="openLPPreview('${page.id}')" class="btn-secondary px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <i class="fas fa-eye"></i><span class="hidden sm:inline">Preview</span>
          </button>
          <button onclick="saveLandingPage('${page.id}')" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <i class="fas fa-save"></i><span class="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </div>

      <!-- Status & info -->
      <div class="flex items-center gap-3 flex-wrap">
        <select id="lp-edit-status" class="input-field text-sm py-1.5 px-3 w-auto">
          <option value="draft" ${page.status === 'draft' ? 'selected' : ''}>Rascunho</option>
          <option value="published" ${page.status === 'published' ? 'selected' : ''}>Publicada</option>
        </select>
        <span class="text-xs text-dim">Criada em ${formatDate(page.created_at)}</span>
      </div>

      <!-- Tabs -->
      <div class="card overflow-hidden">
        <div class="flex border-b border-gold-faint">
          <button onclick="switchLPTab('html')" id="tab-html" class="flex-1 py-3 text-sm font-semibold text-yellow-500 border-b-2 border-yellow-500 bg-yellow-900/20/50">
            <i class="fas fa-code mr-2"></i>HTML
          </button>
          <button onclick="switchLPTab('preview')" id="tab-preview" class="flex-1 py-3 text-sm font-semibold text-warm-gray hover:text-cream-3 border-b-2 border-transparent">
            <i class="fas fa-eye mr-2"></i>Preview ao Vivo
          </button>
          <button onclick="switchLPTab('config')" id="tab-config" class="flex-1 py-3 text-sm font-semibold text-warm-gray hover:text-cream-3 border-b-2 border-transparent">
            <i class="fas fa-sliders mr-2"></i>Configurações
          </button>
        </div>

        <!-- HTML Tab -->
        <div id="tab-content-html">
          <div class="flex items-center justify-between px-4 py-2 bg-dark-2 border-b border-gold-faint">
            <span class="text-xs text-warm-gray font-mono">index.html</span>
            <div class="flex gap-2">
              <button onclick="copyLPHtml()" class="text-xs text-warm-gray hover:text-yellow-500 transition-colors px-2 py-1 rounded">
                <i class="fas fa-copy mr-1"></i>Copiar
              </button>
              <button onclick="improveLP('${page.id}')" class="text-xs text-yellow-500 hover:text-indigo-800 transition-colors px-2 py-1 rounded bg-yellow-900/20 hover:bg-yellow-900/30">
                <i class="fas fa-brain mr-1"></i>Melhorar com IA
              </button>
            </div>
          </div>
          <textarea id="lp-html-editor" class="w-full p-4 font-mono text-xs text-cream-2 outline-none resize-none border-none bg-white" rows="20" style="min-height: 400px; tab-size: 2">${escapeHtml(page.html_content || '')}</textarea>
        </div>

        <!-- Preview Tab -->
        <div id="tab-content-preview" class="hidden">
          <div class="flex items-center justify-between px-4 py-2 bg-dark-2 border-b border-gold-faint">
            <span class="text-xs text-warm-gray">Preview ao vivo da sua landing page</span>
            <button onclick="refreshLPPreview()" class="text-xs text-warm-gray hover:text-yellow-500 transition-colors px-2 py-1 rounded">
              <i class="fas fa-refresh mr-1"></i>Atualizar
            </button>
          </div>
          <div class="relative" style="height: 600px; overflow: hidden">
            <iframe id="lp-preview-frame" class="w-full h-full border-none" sandbox="allow-same-origin allow-scripts"></iframe>
          </div>
        </div>

        <!-- Config Tab -->
        <div id="tab-content-config" class="hidden p-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-cream-3 mb-1.5">Nome do Negócio</label>
              <input id="lp-cfg-business" type="text" value="${page.business_name || ''}" class="input-field w-full text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-cream-3 mb-1.5">Oferta Principal</label>
              <input id="lp-cfg-offer" type="text" value="${page.offer || ''}" class="input-field w-full text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-cream-3 mb-1.5">CTA Principal</label>
              <input id="lp-cfg-cta" type="text" value="${page.cta_text || ''}" class="input-field w-full text-sm">
            </div>
            <div>
              <label class="block text-sm font-medium text-cream-3 mb-1.5">Status</label>
              <select id="lp-cfg-status" class="input-field w-full text-sm">
                <option value="draft" ${page.status === 'draft' ? 'selected' : ''}>Rascunho</option>
                <option value="published" ${page.status === 'published' ? 'selected' : ''}>Publicada</option>
              </select>
            </div>
            <button onclick="saveLandingPageConfig('${page.id}')" class="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">
              <i class="fas fa-save mr-2"></i>Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>`

    // Auto-save
    const editor = document.getElementById('lp-html-editor')
    if (editor) {
      let saveTimeout
      editor.addEventListener('input', () => {
        clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => saveLandingPageSilent(pageId), 2000)
      })
    }

  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function switchLPTab(tab) {
  const tabs = ['html', 'preview', 'config']
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}`)
    const content = document.getElementById(`tab-content-${t}`)
    if (t === tab) {
      if (btn) btn.className = 'flex-1 py-3 text-sm font-semibold text-yellow-500 border-b-2 border-yellow-500 bg-yellow-900/20/50'
      if (content) content.classList.remove('hidden')
    } else {
      if (btn) btn.className = 'flex-1 py-3 text-sm font-semibold text-warm-gray hover:text-cream-3 border-b-2 border-transparent'
      if (content) content.classList.add('hidden')
    }
  })

  if (tab === 'preview') refreshLPPreview()
}

function refreshLPPreview() {
  const editor = document.getElementById('lp-html-editor')
  const frame = document.getElementById('lp-preview-frame')
  if (editor && frame) {
    const content = editor.value
    frame.srcdoc = content
  }
}

async function saveLandingPage(pageId) {
  const title = document.getElementById('lp-edit-title')?.value
  const html_content = document.getElementById('lp-html-editor')?.value
  const status = document.getElementById('lp-edit-status')?.value
  try {
    await api('PUT', `/landing-pages/${pageId}`, { title, html_content, status })
    showToast('Landing page salva!', 'success')
  } catch (err) {
    showToast('Erro ao salvar: ' + err.message, 'error')
  }
}

async function saveLandingPageSilent(pageId) {
  const html_content = document.getElementById('lp-html-editor')?.value
  try {
    await api('PUT', `/landing-pages/${pageId}`, { html_content, status: 'draft' })
  } catch {}
}

async function saveLandingPageConfig(pageId) {
  const business_name = document.getElementById('lp-cfg-business')?.value
  const offer = document.getElementById('lp-cfg-offer')?.value
  const cta_text = document.getElementById('lp-cfg-cta')?.value
  const status = document.getElementById('lp-cfg-status')?.value
  try {
    await api('PUT', `/landing-pages/${pageId}`, { business_name, offer, cta_text, status })
    showToast('Configurações salvas!', 'success')
  } catch (err) {
    showToast('Erro: ' + err.message, 'error')
  }
}

function copyLPHtml() {
  const content = document.getElementById('lp-html-editor')?.value
  if (!content) return
  navigator.clipboard.writeText(content).then(() => showToast('HTML copiado!', 'success'))
}

async function openLPPreview(pageId) {
  try {
    const data = await api('GET', `/landing-pages/${pageId}`)
    const page = data.landing_page

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 z-50 flex flex-col bg-white'
    modal.id = 'lp-full-preview'
    modal.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
      <div class="flex items-center gap-3">
        <div class="flex gap-1.5">
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span class="text-sm font-medium">${page.title}</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="hidden md:flex border border-gray-700 rounded-lg overflow-hidden text-xs">
          <button onclick="setPreviewDevice('desktop')" id="prev-desktop" class="px-3 py-1.5 bg-gray-700 text-white">
            <i class="fas fa-desktop"></i>
          </button>
          <button onclick="setPreviewDevice('tablet')" id="prev-tablet" class="px-3 py-1.5 text-dim hover:bg-gray-700 transition-colors">
            <i class="fas fa-tablet-screen-button"></i>
          </button>
          <button onclick="setPreviewDevice('mobile')" id="prev-mobile" class="px-3 py-1.5 text-dim hover:bg-gray-700 transition-colors">
            <i class="fas fa-mobile-screen-button"></i>
          </button>
        </div>
        <button onclick="document.getElementById('lp-full-preview').remove()" class="text-dim hover:text-white transition-colors px-3 py-1.5">
          <i class="fas fa-times mr-1"></i>Fechar
        </button>
      </div>
    </div>
    <div class="flex-1 bg-dark-5 flex items-start justify-center py-4 overflow-auto">
      <div id="preview-container" class="w-full max-w-none bg-white shadow-xl transition-all duration-300" style="min-height: 100%">
        <iframe id="lp-full-frame" class="w-full border-none" style="height: 100vh" sandbox="allow-scripts allow-same-origin"></iframe>
      </div>
    </div>`
    document.body.appendChild(modal)

    const frame = document.getElementById('lp-full-frame')
    if (frame) frame.srcdoc = page.html_content || '<p>Sem conteúdo</p>'

    window._lpPreviewMode = 'desktop'
  } catch (err) {
    showToast('Erro ao abrir preview: ' + err.message, 'error')
  }
}

function setPreviewDevice(device) {
  const container = document.getElementById('preview-container')
  const frame = document.getElementById('lp-full-frame')
  const btns = { desktop: 'prev-desktop', tablet: 'prev-tablet', mobile: 'prev-mobile' }

  Object.entries(btns).forEach(([d, id]) => {
    const btn = document.getElementById(id)
    if (btn) btn.className = `px-3 py-1.5 ${d === device ? 'bg-gray-700 text-white' : 'text-dim hover:bg-gray-700'} transition-colors`
  })

  if (device === 'desktop') {
    container.style.maxWidth = '100%'
    frame.style.height = '100vh'
  } else if (device === 'tablet') {
    container.style.maxWidth = '768px'
    frame.style.height = '1024px'
  } else {
    container.style.maxWidth = '390px'
    frame.style.height = '844px'
  }
}

async function deleteLandingPage(id) {
  if (!confirm('Excluir esta landing page?')) return
  try {
    await api('DELETE', `/landing-pages/${id}`)
    showToast('Landing page excluída', 'info')
    navigate('/landing-pages')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function improveLP(pageId) {
  showToast('Melhorando com IA...', 'info')
  try {
    const html = document.getElementById('lp-html-editor')?.value
    if (!html) return

    const sessionData = await api('POST', '/chat/sessions', { title: 'Melhoria LP' })
    const prompt = `Melhore esta landing page HTML para torná-la mais persuasiva e com melhor conversão. Mantenha o mesmo design mas melhore os textos, CTAs e estrutura. Retorne apenas o HTML completo:\n\n${html.substring(0, 3000)}`
    const response = await api('POST', `/chat/sessions/${sessionData.session.id}/messages`, { content: prompt })

    const editor = document.getElementById('lp-html-editor')
    if (editor && response.assistantMessage?.content) {
      // Extract HTML from response
      const htmlMatch = response.assistantMessage.content.match(/```html\n?([\s\S]*?)\n?```/) ||
                        response.assistantMessage.content.match(/<!DOCTYPE[\s\S]*/)
      if (htmlMatch) {
        editor.value = htmlMatch[1] || htmlMatch[0]
        showToast('Landing page melhorada!', 'success')
      } else {
        showToast('IA não retornou HTML. Configure OpenAI para esta funcionalidade.', 'warning')
      }
    }

    await api('DELETE', `/chat/sessions/${sessionData.session.id}`)
  } catch (err) {
    showToast('Configure OpenAI em Configurações para usar IA real: ' + err.message, 'error')
  }
}
