
// ============================================================
// CHAT MODULE
// ============================================================
let activeChatSession = null
let chatSessions = []

async function renderChat(container, sessionId = null) {
  setBreadcrumb('Chat IA')
  
  container.innerHTML = `
  <div class="flex gap-6 h-full" style="height: calc(100vh - 130px)">
    <!-- Sessions sidebar -->
    <div class="w-72 flex-shrink-0 flex flex-col hidden lg:flex">
      <div class="card p-4 flex-shrink-0 mb-3">
        <button onclick="createNewChatSession()" class="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
          <i class="fas fa-plus"></i> Nova conversa
        </button>
      </div>
      <div class="card flex-1 overflow-hidden flex flex-col">
        <div class="p-3 border-b border-slate-100">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Conversas</p>
        </div>
        <div id="sessions-list" class="flex-1 overflow-y-auto p-2">
          <div class="flex items-center justify-center py-8 text-gray-400 text-sm">
            <i class="fas fa-spinner spinner mr-2"></i>Carregando...
          </div>
        </div>
      </div>
    </div>

    <!-- Chat area -->
    <div class="flex-1 card flex flex-col overflow-hidden">
      <div id="chat-header" class="p-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
            <i class="fas fa-brain text-white text-sm"></i>
          </div>
          <div>
            <p class="font-bold text-gray-900 text-sm" id="chat-title">Selecione ou inicie uma conversa</p>
            <p class="text-xs text-green-500 flex items-center gap-1"><span class="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>IA Disponível</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="createNewChatSession()" class="btn-secondary px-3 py-1.5 rounded-lg text-xs lg:hidden">
            <i class="fas fa-plus mr-1"></i>Nova
          </button>
        </div>
      </div>
      
      <div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div class="text-center py-12">
          <div class="w-16 h-16 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-brain text-white text-2xl"></i>
          </div>
          <h3 class="font-bold text-gray-900 mb-2">Studio IA está pronto para ajudar!</h3>
          <p class="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Pergunte sobre estratégias de negócio, marketing, vendas, documentos e muito mais.</p>
          <div class="grid grid-cols-2 gap-2 max-w-md mx-auto text-left">
            ${[
              '💡 Como criar uma proposta comercial?',
              '📱 Estratégia de redes sociais',
              '💰 Como precificar meus serviços?',
              '📧 Como escrever e-mails de prospecção?',
            ].map(s => `<button onclick="useSuggestion('${s.substring(3)}')" class="p-3 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent rounded-xl text-xs text-gray-600 text-left transition-all">${s}</button>`).join('')}
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-slate-100 flex-shrink-0">
        <div class="flex gap-3 items-end">
          <div class="flex-1 relative">
            <textarea id="chat-input" 
              class="input-field w-full resize-none text-sm pr-12" 
              placeholder="Digite sua mensagem... (Enter para enviar)" 
              rows="1"
              style="min-height: 44px; max-height: 120px"
              onkeydown="handleChatKeydown(event)"
              oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
          </div>
          <button id="send-btn" onclick="sendChatMessage()" class="btn-primary w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0">
            <i class="fas fa-paper-plane text-sm"></i>
          </button>
        </div>
        <p class="text-xs text-gray-400 mt-2">Dica: Use o Chat para gerar ideias e depois crie documentos, imagens ou landing pages!</p>
      </div>
    </div>
  </div>`

  await loadChatSessions(sessionId)
}

async function loadChatSessions(selectId = null) {
  try {
    const data = await api('GET', '/chat/sessions')
    chatSessions = data.sessions || []
    renderSessionsList()
    
    if (selectId) {
      await openChatSession(selectId)
    } else if (chatSessions.length > 0) {
      await openChatSession(chatSessions[0].id)
    }
  } catch (err) {
    console.error('Error loading sessions:', err)
  }
}

function renderSessionsList() {
  const list = document.getElementById('sessions-list')
  if (!list) return
  
  if (chatSessions.length === 0) {
    list.innerHTML = `<div class="text-center py-8 text-gray-400 text-xs"><p>Nenhuma conversa ainda</p><p class="mt-1">Clique em "Nova conversa"</p></div>`
    return
  }
  
  list.innerHTML = chatSessions.map(s => `
  <div onclick="openChatSession('${s.id}')" id="session-item-${s.id}"
    class="flex items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors group ${activeChatSession?.id === s.id ? 'bg-indigo-50' : ''}">
    <div class="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
      <i class="fas fa-comments text-indigo-500 text-xs"></i>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-xs font-semibold text-gray-800 truncate ${activeChatSession?.id === s.id ? 'text-indigo-700' : ''}">${truncate(s.title, 35)}</p>
      <p class="text-xs text-gray-400">${timeAgo(s.updated_at)}</p>
    </div>
    <button onclick="event.stopPropagation();deleteChatSession('${s.id}')" class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-xs">
      <i class="fas fa-trash"></i>
    </button>
  </div>`).join('')
}

async function openChatSession(sessionId) {
  try {
    const data = await api('GET', `/chat/sessions/${sessionId}`)
    activeChatSession = data.session
    
    document.getElementById('chat-title').textContent = truncate(data.session.title, 40)
    
    // Update active state
    document.querySelectorAll('[id^="session-item-"]').forEach(el => el.classList.remove('bg-indigo-50'))
    const activeItem = document.getElementById(`session-item-${sessionId}`)
    if (activeItem) activeItem.classList.add('bg-indigo-50')
    
    renderMessages(data.messages || [])
    window.history.replaceState({}, '', `/chat/${sessionId}`)
  } catch (err) {
    console.error('Error opening session:', err)
  }
}

function renderMessages(messages) {
  const container = document.getElementById('chat-messages')
  if (!container) return
  
  if (messages.length === 0) {
    container.innerHTML = `<div class="text-center py-8 text-gray-400 text-sm"><p>Inicie a conversa abaixo!</p></div>`
    return
  }
  
  container.innerHTML = messages.map(m => renderMessage(m)).join('')
  container.scrollTop = container.scrollHeight
}

function renderMessage(msg) {
  const isUser = msg.role === 'user'
  return `
  <div class="flex ${isUser ? 'justify-end' : 'justify-start'} gap-3 animate-fade">
    ${!isUser ? `<div class="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 mt-1"><i class="fas fa-brain text-white text-xs"></i></div>` : ''}
    <div class="max-w-[85%]">
      <div class="${isUser ? 'message-user px-4 py-3 text-sm' : 'message-ai px-4 py-3 text-sm text-gray-800'}">
        ${isUser ? `<p>${msg.content}</p>` : `<div class="prose text-sm">${renderMD(msg.content)}</div>`}
      </div>
      <div class="flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}">
        <p class="text-xs text-gray-400">${timeAgo(msg.created_at)}</p>
        ${!isUser ? `
        <button onclick="copyToClipboard('${encodeURIComponent(msg.content)}')" class="text-xs text-gray-400 hover:text-indigo-600 transition-colors" title="Copiar">
          <i class="fas fa-copy"></i>
        </button>` : ''}
      </div>
    </div>
    ${isUser ? `<div class="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-1 text-white font-bold text-xs">${currentUser?.name?.charAt(0) || 'U'}</div>` : ''}
  </div>`
}

function copyToClipboard(encoded) {
  const text = decodeURIComponent(encoded)
  navigator.clipboard.writeText(text).then(() => showToast('Copiado!', 'success'))
}

async function createNewChatSession() {
  try {
    const data = await api('POST', '/chat/sessions', { title: 'Nova conversa' })
    chatSessions.unshift(data.session)
    activeChatSession = data.session
    renderSessionsList()
    
    document.getElementById('chat-title').textContent = 'Nova conversa'
    document.getElementById('chat-messages').innerHTML = `<div class="text-center py-8 text-gray-400 text-sm"><p>Inicie a conversa abaixo!</p></div>`
    window.history.replaceState({}, '', `/chat/${data.session.id}`)
    
    document.getElementById('chat-input')?.focus()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function deleteChatSession(sessionId) {
  if (!confirm('Excluir esta conversa?')) return
  try {
    await api('DELETE', `/chat/sessions/${sessionId}`)
    chatSessions = chatSessions.filter(s => s.id !== sessionId)
    if (activeChatSession?.id === sessionId) {
      activeChatSession = null
    }
    renderSessionsList()
    showToast('Conversa excluída', 'info')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input')
  const content = input?.value?.trim()
  if (!content) return
  
  if (!activeChatSession) {
    await createNewChatSession()
  }
  
  const sendBtn = document.getElementById('send-btn')
  sendBtn.disabled = true
  sendBtn.innerHTML = '<i class="fas fa-spinner spinner text-sm"></i>'
  input.value = ''
  input.style.height = '44px'
  
  const messagesContainer = document.getElementById('chat-messages')
  
  // Add user message immediately
  const tempUserMsg = { role: 'user', content, created_at: new Date().toISOString() }
  messagesContainer.innerHTML += renderMessage(tempUserMsg)
  
  // Add typing indicator
  const typingId = 'typing-' + Date.now()
  messagesContainer.innerHTML += `
  <div id="${typingId}" class="flex justify-start gap-3 animate-fade">
    <div class="w-8 h-8 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0 mt-1"><i class="fas fa-brain text-white text-xs"></i></div>
    <div class="message-ai px-4 py-3">
      <div class="flex items-center gap-1">
        <span class="w-2 h-2 bg-gray-400 rounded-full loading"></span>
        <span class="w-2 h-2 bg-gray-400 rounded-full loading" style="animation-delay:0.2s"></span>
        <span class="w-2 h-2 bg-gray-400 rounded-full loading" style="animation-delay:0.4s"></span>
      </div>
    </div>
  </div>`
  messagesContainer.scrollTop = messagesContainer.scrollHeight
  
  try {
    const data = await api('POST', `/chat/sessions/${activeChatSession.id}/messages`, { content })
    
    document.getElementById(typingId)?.remove()
    messagesContainer.innerHTML += renderMessage(data.assistantMessage)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
    
    // Update session title in sidebar
    const sessionItem = document.getElementById(`session-item-${activeChatSession.id}`)
    if (sessionItem) {
      const titleEl = sessionItem.querySelector('p')
      if (titleEl && content.length > 0) titleEl.textContent = truncate(content, 35)
    }
  } catch (err) {
    document.getElementById(typingId)?.remove()
    showToast(err.message, 'error')
  }
  
  sendBtn.disabled = false
  sendBtn.innerHTML = '<i class="fas fa-paper-plane text-sm"></i>'
  input.focus()
}

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendChatMessage()
  }
}

function useSuggestion(text) {
  const input = document.getElementById('chat-input')
  if (input) {
    input.value = text
    input.focus()
    if (!activeChatSession) createNewChatSession()
  }
}

// ============================================================
// DOCUMENTS MODULE
// ============================================================
const DOC_TEMPLATES = [
  { id: 'proposta_comercial', icon: 'fa-handshake', color: 'indigo', name: 'Proposta Comercial', desc: 'Proposta profissional para novos clientes' },
  { id: 'orcamento', icon: 'fa-calculator', color: 'blue', name: 'Orçamento', desc: 'Orçamento detalhado com itens e valores' },
  { id: 'contrato_simples', icon: 'fa-file-contract', color: 'purple', name: 'Contrato Simples', desc: 'Contrato de prestação de serviços' },
  { id: 'apresentacao_servicos', icon: 'fa-presentation-screen', color: 'pink', name: 'Apresentação de Serviços', desc: 'Apresentação profissional dos seus serviços' },
  { id: 'email_comercial', icon: 'fa-envelope', color: 'green', name: 'E-mail Comercial', desc: 'E-mail de prospecção ou follow-up' },
  { id: 'copy_anuncio', icon: 'fa-bullhorn', color: 'orange', name: 'Copy para Anúncio', desc: 'Texto persuasivo para anúncios' },
  { id: 'post_redes_sociais', icon: 'fa-share-nodes', color: 'sky', name: 'Posts para Redes Sociais', desc: 'Pack de posts para social media' },
  { id: 'descricao_produto', icon: 'fa-tag', color: 'teal', name: 'Descrição de Produto', desc: 'Descrição persuasiva e completa' },
]

async function renderDocuments(container) {
  setBreadcrumb('Documentos')
  showLoader(container, 'Carregando documentos...')
  
  try {
    const data = await api('GET', '/documents')
    const docs = data.documents || []
    
    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900">Documentos</h1>
          <p class="text-gray-500 text-sm mt-1">Gere documentos profissionais com IA em segundos</p>
        </div>
        <button onclick="showDocTemplates()" class="btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
          <i class="fas fa-plus"></i> Novo Documento
        </button>
      </div>

      <!-- Templates section -->
      <div class="card p-6">
        <h2 class="font-bold text-gray-900 mb-4 flex items-center gap-2"><i class="fas fa-th-large text-indigo-500"></i> Templates Disponíveis</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${DOC_TEMPLATES.map(t => `
          <button onclick="showDocGenerator('${t.id}')" class="p-4 border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group">
            <div class="w-9 h-9 rounded-xl bg-${t.color}-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i class="fas ${t.icon} text-${t.color}-600 text-sm"></i>
            </div>
            <p class="text-xs font-semibold text-gray-800 mb-0.5">${t.name}</p>
            <p class="text-xs text-gray-400 leading-tight">${t.desc}</p>
          </button>`).join('')}
        </div>
      </div>

      <!-- Documents list -->
      <div class="card p-6">
        <h2 class="font-bold text-gray-900 mb-4">Meus Documentos (${docs.length})</h2>
        ${docs.length > 0 ? `
        <div class="space-y-2">
          ${docs.map(d => `
          <div class="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer" onclick="navigate('/documentos/${d.id}')">
            <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <i class="fas fa-file-lines text-purple-600"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">${d.title}</p>
              <p class="text-xs text-gray-400 capitalize">${d.template_type?.replace(/_/g, ' ')} • ${formatDate(d.created_at)}</p>
            </div>
            <span class="tag hidden sm:inline ${d.status === 'draft' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}">${d.status === 'draft' ? 'Rascunho' : 'Finalizado'}</span>
            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onclick="event.stopPropagation();deleteDocument('${d.id}')" class="text-gray-400 hover:text-red-500 transition-colors text-sm"><i class="fas fa-trash"></i></button>
            </div>
          </div>`).join('')}
        </div>` : `
        <div class="text-center py-12">
          <div class="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4"><i class="fas fa-file-lines text-gray-400 text-2xl"></i></div>
          <p class="text-gray-500 mb-4">Nenhum documento ainda</p>
          <button onclick="showDocTemplates()" class="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm">Criar primeiro documento</button>
        </div>`}
      </div>
    </div>

    <!-- Generator Modal -->
    <div id="doc-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="modal-overlay absolute inset-0" onclick="closeDocModal()"></div>
      <div class="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div id="doc-modal-content"></div>
      </div>
    </div>`
    
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><p class="text-red-500">${err.message}</p></div>`
  }
}

function showDocTemplates() {
  const modal = document.getElementById('doc-modal')
  const content = document.getElementById('doc-modal-content')
  modal.classList.remove('hidden')
  
  content.innerHTML = `
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-black text-gray-900">Escolha um Template</h2>
      <button onclick="closeDocModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
    </div>
    <div class="grid grid-cols-2 gap-3">
      ${DOC_TEMPLATES.map(t => `
      <button onclick="showDocGenerator('${t.id}')" class="p-4 border border-gray-100 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group">
        <div class="w-10 h-10 rounded-xl bg-${t.color}-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <i class="fas ${t.icon} text-${t.color}-600"></i>
        </div>
        <p class="text-sm font-semibold text-gray-800 mb-1">${t.name}</p>
        <p class="text-xs text-gray-400">${t.desc}</p>
      </button>`).join('')}
    </div>
  </div>`
}

function showDocGenerator(templateId) {
  const template = DOC_TEMPLATES.find(t => t.id === templateId)
  if (!template) return
  
  const modal = document.getElementById('doc-modal')
  const content = document.getElementById('doc-modal-content')
  modal.classList.remove('hidden')
  
  const fields = getDocFields(templateId)
  
  content.innerHTML = `
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-${template.color}-100 flex items-center justify-center">
          <i class="fas ${template.icon} text-${template.color}-600"></i>
        </div>
        <div>
          <h2 class="text-lg font-black text-gray-900">${template.name}</h2>
          <p class="text-xs text-gray-400">${template.desc}</p>
        </div>
      </div>
      <button onclick="closeDocModal()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times text-xl"></i></button>
    </div>
    <form id="doc-gen-form" class="space-y-4" onsubmit="generateDocument(event, '${templateId}')">
      ${fields.map(f => `
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1.5">${f.label} ${f.required ? '<span class="text-red-500">*</span>' : '<span class="text-gray-400 text-xs">(opcional)</span>'}</label>
        ${f.type === 'textarea' ? 
          `<textarea name="${f.name}" class="input-field w-full text-sm" rows="3" placeholder="${f.placeholder}" ${f.required ? 'required' : ''}></textarea>` :
          `<input type="text" name="${f.name}" class="input-field w-full text-sm" placeholder="${f.placeholder}" ${f.required ? 'required' : ''}>`
        }
      </div>`).join('')}
      <div class="flex gap-3 pt-2">
        <button type="button" onclick="showDocTemplates()" class="btn-secondary flex-1 py-2.5 rounded-xl text-sm font-semibold">← Voltar</button>
        <button type="submit" id="gen-doc-btn" class="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
          <i class="fas fa-wand-magic-sparkles"></i>Gerar com IA
        </button>
      </div>
    </form>
  </div>`
}

function getDocFields(templateId) {
  const fieldsMap = {
    proposta_comercial: [
      { name: 'empresa', label: 'Nome da sua empresa', placeholder: 'Ex: Studio Digital Pro', required: true },
      { name: 'cliente', label: 'Nome do cliente', placeholder: 'Ex: ABC Serviços Ltda', required: true },
      { name: 'servico', label: 'Serviço oferecido', placeholder: 'Ex: Gestão de redes sociais + criação de conteúdo', required: true, type: 'textarea' },
      { name: 'valor', label: 'Valor da proposta', placeholder: 'Ex: R$ 2.500,00/mês', required: false },
      { name: 'prazo', label: 'Prazo de entrega', placeholder: 'Ex: 30 dias úteis', required: false },
    ],
    orcamento: [
      { name: 'empresa', label: 'Sua empresa', placeholder: 'Ex: Sua Empresa LTDA', required: true },
      { name: 'cliente', label: 'Nome do cliente', placeholder: 'Ex: Cliente Exemplo', required: true },
      { name: 'itens', label: 'Itens do orçamento', placeholder: 'Descreva os itens, quantidades e valores', required: true, type: 'textarea' },
      { name: 'validade', label: 'Validade do orçamento', placeholder: 'Ex: 10 dias', required: false },
    ],
    contrato_simples: [
      { name: 'prestador', label: 'Prestador de serviço', placeholder: 'Seu nome ou empresa', required: true },
      { name: 'contratante', label: 'Contratante', placeholder: 'Nome do cliente/empresa', required: true },
      { name: 'servico', label: 'Serviço contratado', placeholder: 'Descreva detalhadamente o serviço', required: true, type: 'textarea' },
      { name: 'valor', label: 'Valor do contrato', placeholder: 'Ex: R$ 3.000,00', required: true },
      { name: 'prazo', label: 'Prazo do contrato', placeholder: 'Ex: 3 meses a partir da assinatura', required: false },
    ],
    email_comercial: [
      { name: 'remetente', label: 'Seu nome/empresa', placeholder: 'Ex: João Silva - Consultoria', required: true },
      { name: 'destinatario', label: 'Nome do destinatário', placeholder: 'Ex: Sr. Carlos', required: true },
      { name: 'objetivo', label: 'Objetivo do e-mail', placeholder: 'Ex: Oferecer serviço de consultoria', required: true },
      { name: 'servico', label: 'Serviço/produto oferecido', placeholder: 'Ex: Consultoria de marketing digital', required: true },
    ],
    copy_anuncio: [
      { name: 'produto', label: 'Produto/Serviço', placeholder: 'Ex: Curso de Marketing Digital', required: true },
      { name: 'publico', label: 'Público-alvo', placeholder: 'Ex: Empreendedores iniciantes', required: true },
      { name: 'beneficio', label: 'Principal benefício', placeholder: 'Ex: Dobrar o faturamento em 3 meses', required: true },
      { name: 'cta', label: 'Call to action', placeholder: 'Ex: Compre agora com 50% off!', required: false },
    ],
    post_redes_sociais: [
      { name: 'negocio', label: 'Seu negócio', placeholder: 'Ex: Barbearia do João', required: true },
      { name: 'tema', label: 'Tema dos posts', placeholder: 'Ex: Promoção de aniversário', required: true },
      { name: 'tom', label: 'Tom da comunicação', placeholder: 'Ex: Descontraído e próximo', required: false },
      { name: 'plataforma', label: 'Plataforma', placeholder: 'Ex: Instagram, LinkedIn', required: false },
    ],
    apresentacao_servicos: [
      { name: 'empresa', label: 'Nome da empresa', placeholder: 'Ex: Consultoria XYZ', required: true },
      { name: 'servicos', label: 'Serviços oferecidos', placeholder: 'Liste os principais serviços', required: true, type: 'textarea' },
      { name: 'diferenciais', label: 'Diferenciais', placeholder: 'O que te diferencia da concorrência?', required: false, type: 'textarea' },
      { name: 'cta', label: 'Como contratar', placeholder: 'Ex: Entre em contato pelo WhatsApp', required: false },
    ],
    descricao_produto: [
      { name: 'produto', label: 'Nome do produto/serviço', placeholder: 'Ex: Plano Premium de Gestão', required: true },
      { name: 'beneficios', label: 'Principais benefícios', placeholder: 'Liste os benefícios e funcionalidades', required: true, type: 'textarea' },
      { name: 'publico', label: 'Público-alvo', placeholder: 'Ex: Pequenas empresas do segmento de saúde', required: false },
      { name: 'preco', label: 'Preço/Investimento', placeholder: 'Ex: A partir de R$ 299/mês', required: false },
    ],
  }
  return fieldsMap[templateId] || [
    { name: 'descricao', label: 'Descrição', placeholder: 'Descreva o que precisa', required: true, type: 'textarea' }
  ]
}

async function generateDocument(e, templateId) {
  e.preventDefault()
  const btn = document.getElementById('gen-doc-btn')
  btn.disabled = true
  btn.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>Gerando...'
  
  const form = document.getElementById('doc-gen-form')
  const fields = {}
  new FormData(form).forEach((v, k) => fields[k] = v)
  
  try {
    const data = await api('POST', '/documents/generate', { template_type: templateId, fields })
    closeDocModal()
    showToast('Documento gerado com sucesso!', 'success')
    navigate(`/documentos/${data.document.id}`)
  } catch (err) {
    showToast(err.message, 'error')
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>Gerar com IA'
  }
}

async function renderDocumentEditor(container, docId) {
  setBreadcrumb('Documentos → Editor')
  showLoader(container, 'Carregando documento...')
  
  try {
    const data = await api('GET', `/documents/${docId}`)
    const doc = data.document
    
    container.innerHTML = `
    <div class="space-y-4 animate-fade">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="navigate('/documentos')" class="btn-secondary px-3 py-2 rounded-xl text-sm font-medium">
            <i class="fas fa-arrow-left mr-1"></i>Voltar
          </button>
          <input id="doc-title" value="${doc.title}" class="input-field text-lg font-bold" style="min-width: 300px">
        </div>
        <div class="flex items-center gap-2">
          <button onclick="copyDocContent()" class="btn-secondary px-4 py-2 rounded-xl text-sm font-medium">
            <i class="fas fa-copy mr-1"></i>Copiar
          </button>
          <button onclick="saveDocument('${docId}')" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold">
            <i class="fas fa-save mr-1"></i>Salvar
          </button>
        </div>
      </div>
      
      <div class="card overflow-hidden">
        <div class="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50">
          <span class="tag">${doc.template_type?.replace(/_/g, ' ')}</span>
          <span class="tag ${doc.status === 'draft' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}">${doc.status === 'draft' ? 'Rascunho' : 'Finalizado'}</span>
          <span class="text-xs text-gray-400 ml-auto">Criado em ${formatDate(doc.created_at)}</span>
        </div>
        <textarea id="doc-content" class="w-full p-6 text-sm text-gray-700 font-mono leading-relaxed outline-none resize-none" 
          style="min-height: 500px; background: white">${doc.content}</textarea>
      </div>
    </div>`
    
    window._currentDoc = doc
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><p class="text-red-500">${err.message}</p></div>`
  }
}

async function saveDocument(docId) {
  const title = document.getElementById('doc-title')?.value
  const content = document.getElementById('doc-content')?.value
  
  try {
    await api('PUT', `/documents/${docId}`, { title, content, status: window._currentDoc?.status || 'draft' })
    showToast('Documento salvo!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function copyDocContent() {
  const content = document.getElementById('doc-content')?.value
  if (content) {
    navigator.clipboard.writeText(content).then(() => showToast('Conteúdo copiado!', 'success'))
  }
}

async function deleteDocument(docId) {
  if (!confirm('Excluir este documento?')) return
  try {
    await api('DELETE', `/documents/${docId}`)
    showToast('Documento excluído', 'info')
    renderDocuments(document.getElementById('main-content'))
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function closeDocModal() {
  document.getElementById('doc-modal')?.classList.add('hidden')
}
