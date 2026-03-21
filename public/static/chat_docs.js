// ============================================================
// STUDIO IA — CHAT & DOCUMENTOS
// ============================================================

let chatSessionId = null
let chatMessages = []
let isChatLoading = false

// ============================================================
// CHAT IA
// ============================================================
async function renderChat(container, sessionId = null) {
  setBreadcrumb('Chat IA')
  showLoader(container, 'Carregando chat...')

  try {
    const [sessionsData] = await Promise.all([
      api('GET', '/chat/sessions')
    ])
    const sessions = sessionsData.sessions || []

    // If sessionId provided, open that session
    if (sessionId) {
      chatSessionId = sessionId
    } else if (!chatSessionId && sessions.length > 0) {
      chatSessionId = sessions[0].id
    }

    let currentSession = null
    let currentMessages = []

    if (chatSessionId) {
      try {
        const sd = await api('GET', `/chat/sessions/${chatSessionId}`)
        currentSession = sd.session
        currentMessages = sd.messages || []
      } catch {
        chatSessionId = null
      }
    }

    container.innerHTML = `
    <div class="flex h-full gap-0 -m-6 animate-fade" style="height: calc(100vh - 73px)">
      <!-- Sessions Sidebar -->
      <div id="chat-sidebar" class="w-72 border-r border-gold-faint flex flex-col flex-shrink-0">
        <div class="p-4 border-b border-gold-faint">
          <button onclick="createNewChatSession()" class="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
            <i class="fas fa-plus"></i> Nova conversa
          </button>
        </div>
        <div id="sessions-list" class="flex-1 overflow-y-auto p-3 space-y-1">
          ${sessions.length === 0 ? `
          <div class="text-center py-8 text-dim">
            <i class="fas fa-comments text-3xl mb-3 block opacity-30"></i>
            <p class="text-sm">Nenhuma conversa ainda</p>
          </div>` : sessions.map(s => `
          <div onclick="loadChatSession('${s.id}')" id="session-${s.id}" class="session-item flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-dark-2 group ${s.id === chatSessionId ? 'bg-yellow-900/20 text-yellow-400' : 'text-cream-3'}">
            <div class="w-8 h-8 rounded-lg ${s.id === chatSessionId ? 'bg-yellow-900/30' : 'bg-dark-4'} flex items-center justify-center flex-shrink-0">
              <i class="fas fa-comments text-xs ${s.id === chatSessionId ? 'text-yellow-500' : 'text-warm-gray'}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">${s.title || 'Nova conversa'}</p>
              <p class="text-xs text-dim">${timeAgo(s.updated_at)}</p>
            </div>
            <button onclick="event.stopPropagation(); deleteChatSession('${s.id}')" class="opacity-0 group-hover:opacity-100 text-dim hover:text-red-500 transition-all p-1">
              <i class="fas fa-trash text-xs"></i>
            </button>
          </div>`).join('')}
        </div>
      </div>

      <!-- Chat Main -->
      <div class="flex-1 flex flex-col bg-dark-2 min-w-0">
        ${currentSession ? `
        <!-- Chat Header -->
        <div class="border-b border-gold-faint px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
              <i class="fas fa-brain text-white text-sm"></i>
            </div>
            <div>
              <h2 class="font-bold text-cream text-sm" id="chat-title">${currentSession.title || 'Nova conversa'}</h2>
              <p class="text-xs text-dim" id="chat-model-badge">Assistente de Negócios IA</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="clearChatHistory()" title="Limpar conversa" class="p-2 rounded-lg text-dim hover:text-red-500 hover:bg-red-50 transition-all">
              <i class="fas fa-broom text-sm"></i>
            </button>
            <button onclick="exportChat()" title="Exportar conversa" class="p-2 rounded-lg text-dim hover:text-yellow-500 hover:bg-yellow-900/20 transition-all">
              <i class="fas fa-download text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div id="chat-messages" class="flex-1 overflow-y-auto p-6 space-y-4">
          ${currentMessages.length === 0 ? renderChatWelcome() : currentMessages.map(m => renderMessage(m)).join('')}
        </div>

        <!-- Input -->
        <div class="border-t border-gold-faint p-4">
          <!-- Quick actions -->
          <div id="quick-actions" class="flex gap-2 mb-3 flex-wrap">
            ${[
              { label: '💡 Ideia de negócio', msg: 'Me dê uma ideia criativa de negócio para o setor de serviços' },
              { label: '📄 Proposta comercial', msg: 'Como criar uma proposta comercial que converte?' },
              { label: '📱 Post Instagram', msg: 'Crie um post para Instagram sobre os benefícios do meu serviço' },
              { label: '💰 Estratégia de preço', msg: 'Como definir o preço ideal para meu serviço?' },
            ].map(a => `
            <button onclick="sendQuickMessage('${a.msg.replace(/'/g, "\\'")}')" class="text-xs bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-400 px-3 py-1.5 rounded-lg transition-colors font-medium">
              ${a.label}
            </button>`).join('')}
          </div>
          <div class="flex gap-3 items-end">
            <div class="flex-1 relative">
              <textarea id="chat-input" rows="1" placeholder="Mensagem para o assistente de negócios..."
                class="input-field w-full resize-none pr-4 text-sm"
                style="max-height: 160px; min-height: 44px"
                onkeydown="handleChatKeydown(event)"
                oninput="autoResizeTextarea(this)"></textarea>
            </div>
            <button id="chat-send-btn" onclick="sendChatMessage()" class="btn-primary w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0">
              <i class="fas fa-paper-plane text-sm"></i>
            </button>
          </div>
          <p class="text-xs text-dim mt-2 text-center" id="ai-status">
            Configure sua chave OpenAI em <button onclick="navigate('/conta#config')" class="text-yellow-500 hover:underline">Configurações</button> para IA real
          </p>
        </div>` : `
        <!-- No session selected -->
        <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div class="w-20 h-20 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-900/30">
            <i class="fas fa-brain text-white text-3xl"></i>
          </div>
          <h2 class="text-2xl font-black text-cream mb-3">Assistente de Negócios IA</h2>
          <p class="text-warm-gray max-w-md mb-8">Tire dúvidas, peça estratégias, crie conteúdo e muito mais com sua IA especializada em pequenos negócios.</p>
          <button onclick="createNewChatSession()" class="btn-primary px-8 py-3 rounded-xl font-semibold">
            <i class="fas fa-plus mr-2"></i>Iniciar nova conversa
          </button>
        </div>`}
      </div>
    </div>`

    chatMessages = currentMessages
    if (currentSession) {
      scrollChatToBottom()
      document.getElementById('chat-input')?.focus()
    }

    // Check if OpenAI is configured
    checkOpenAIStatus()

  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function renderChatWelcome() {
  return `
  <div class="flex flex-col items-center justify-center py-12 text-center animate-fade">
    <div class="w-16 h-16 rounded-3xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-900/30">
      <i class="fas fa-brain text-white text-2xl"></i>
    </div>
    <h3 class="text-xl font-bold text-cream mb-2">Como posso ajudar?</h3>
    <p class="text-warm-gray text-sm mb-6 max-w-sm">Sou seu assistente especializado em negócios. Posso ajudar com estratégias, conteúdo, documentos e muito mais.</p>
    <div class="grid grid-cols-2 gap-3 w-full max-w-lg">
      ${[
        { icon: 'fa-lightbulb', title: 'Estratégias', desc: 'Marketing, vendas e crescimento' },
        { icon: 'fa-file-lines', title: 'Conteúdo', desc: 'Textos, e-mails e propostas' },
        { icon: 'fa-chart-line', title: 'Análises', desc: 'Diagnósticos e métricas' },
        { icon: 'fa-users', title: 'Clientes', desc: 'Prospecção e atendimento' },
      ].map(s => `
      <div class="border border-gold-faint rounded-xl p-4 text-left hover:border-yellow-800 transition-colors cursor-pointer" onclick="document.getElementById('chat-input').focus()">
        <i class="fas ${s.icon} text-yellow-500 mb-2 block"></i>
        <p class="font-semibold text-cream-2 text-sm">${s.title}</p>
        <p class="text-xs text-dim">${s.desc}</p>
      </div>`).join('')}
    </div>
  </div>`
}

function renderMessage(msg) {
  const isUser = msg.role === 'user'
  return `
  <div class="flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade">
    <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isUser ? 'gradient-bg' : 'border border-slate-200'}">
      ${isUser ? `<span class="text-white text-xs font-bold">${currentUser?.name?.charAt(0) || 'U'}</span>` : '<i class="fas fa-brain text-yellow-500 text-xs"></i>'}
    </div>
    <div class="max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1">
      <div class="${isUser ? 'message-user' : 'message-ai'} px-4 py-3 text-sm leading-relaxed">
        ${isUser ? `<p>${msg.content.replace(/\n/g, '<br>')}</p>` : `<div class="prose text-sm">${renderMD(msg.content)}</div>`}
      </div>
      <div class="flex items-center gap-2 px-1">
        <span class="text-xs text-dim">${timeAgo(msg.created_at)}</span>
        ${!isUser ? `
        <button onclick="copyToClipboard('${encodeURIComponent(msg.content)}')" class="text-xs text-dim hover:text-yellow-500 transition-colors" title="Copiar">
          <i class="fas fa-copy"></i>
        </button>
        <button onclick="saveMessageAsDocument('${encodeURIComponent(msg.content)}')" class="text-xs text-dim hover:text-yellow-500 transition-colors" title="Salvar como documento">
          <i class="fas fa-save"></i>
        </button>` : ''}
      </div>
    </div>
  </div>`
}

function renderTypingIndicator() {
  return `
  <div id="typing-indicator" class="flex gap-3 animate-fade">
    <div class="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center flex-shrink-0">
      <i class="fas fa-brain text-yellow-500 text-xs"></i>
    </div>
    <div class="message-ai px-4 py-3">
      <div class="flex gap-1 items-center">
        <div class="w-2 h-2 bg-indigo-400 rounded-full" style="animation: pulse 1s ease infinite 0s"></div>
        <div class="w-2 h-2 bg-indigo-400 rounded-full" style="animation: pulse 1s ease infinite 0.2s"></div>
        <div class="w-2 h-2 bg-indigo-400 rounded-full" style="animation: pulse 1s ease infinite 0.4s"></div>
      </div>
    </div>
  </div>`
}

async function createNewChatSession() {
  try {
    const data = await api('POST', '/chat/sessions', { title: 'Nova conversa' })
    chatSessionId = data.session.id
    chatMessages = []
    navigate('/chat/' + chatSessionId)
    showToast('Nova conversa criada!', 'success')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function loadChatSession(id) {
  chatSessionId = id
  navigate('/chat/' + id)
}

async function deleteChatSession(id) {
  if (!confirm('Excluir esta conversa?')) return
  try {
    await api('DELETE', `/chat/sessions/${id}`)
    if (chatSessionId === id) {
      chatSessionId = null
      navigate('/chat')
    } else {
      // Just refresh sessions
      const container = document.getElementById('main-content')
      renderChat(container, chatSessionId)
    }
    showToast('Conversa excluída', 'info')
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function sendChatMessage() {
  if (isChatLoading) return
  const input = document.getElementById('chat-input')
  const content = input?.value?.trim()
  if (!content) return

  input.value = ''
  autoResizeTextarea(input)

  await sendMessageContent(content)
}

async function sendQuickMessage(msg) {
  await sendMessageContent(msg)
}

async function sendMessageContent(content) {
  if (!chatSessionId) {
    await createNewChatSession()
    await new Promise(r => setTimeout(r, 500))
  }

  isChatLoading = true
  const sendBtn = document.getElementById('chat-send-btn')
  if (sendBtn) sendBtn.innerHTML = '<i class="fas fa-spinner spinner text-sm"></i>'

  // Add user message immediately
  const messagesDiv = document.getElementById('chat-messages')
  if (messagesDiv) {
    // Remove welcome screen if present
    const welcome = messagesDiv.querySelector('.animate-fade:first-child')
    if (chatMessages.length === 0 && welcome) messagesDiv.innerHTML = ''

    messagesDiv.insertAdjacentHTML('beforeend', renderMessage({
      role: 'user', content, created_at: new Date().toISOString()
    }))
    messagesDiv.insertAdjacentHTML('beforeend', renderTypingIndicator())
    scrollChatToBottom()
  }

  // Hide quick actions
  const qa = document.getElementById('quick-actions')
  if (qa) qa.style.display = 'none'

  try {
    const data = await api('POST', `/chat/sessions/${chatSessionId}/messages`, { content })
    
    // Update model badge
    const badge = document.getElementById('chat-model-badge')
    if (badge) {
      badge.textContent = data.model === 'gpt-4o-mini' ? '✨ GPT-4o mini • OpenAI' : '🤖 Assistente IA'
    }

    // Remove typing indicator
    const typing = document.getElementById('typing-indicator')
    if (typing) typing.remove()

    // Add AI response
    if (messagesDiv) {
      messagesDiv.insertAdjacentHTML('beforeend', renderMessage(data.assistantMessage))
      scrollChatToBottom()
    }

    chatMessages.push(data.userMessage, data.assistantMessage)

    // Update session title in sidebar
    if (data.userMessage) {
      const sessionEl = document.getElementById(`session-${chatSessionId}`)
      if (sessionEl) {
        const titleEl = sessionEl.querySelector('p')
        if (titleEl && chatMessages.length <= 2) {
          titleEl.textContent = content.substring(0, 40) + (content.length > 40 ? '...' : '')
        }
      }
    }

  } catch (err) {
    const typing = document.getElementById('typing-indicator')
    if (typing) typing.remove()
    
    if (messagesDiv) {
      messagesDiv.insertAdjacentHTML('beforeend', `
      <div class="flex gap-3 animate-fade">
        <div class="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <i class="fas fa-exclamation-circle text-red-500 text-xs"></i>
        </div>
        <div class="message-ai px-4 py-3 border-red-100 bg-red-50 text-red-600 text-sm">
          ${err.message}
        </div>
      </div>`)
      scrollChatToBottom()
    }
    showToast(err.message, 'error')
  } finally {
    isChatLoading = false
    if (sendBtn) sendBtn.innerHTML = '<i class="fas fa-paper-plane text-sm"></i>'
    document.getElementById('chat-input')?.focus()
  }
}

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendChatMessage()
  }
}

function autoResizeTextarea(el) {
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

function scrollChatToBottom() {
  const div = document.getElementById('chat-messages')
  if (div) setTimeout(() => { div.scrollTop = div.scrollHeight }, 100)
}

function copyToClipboard(encoded) {
  const text = decodeURIComponent(encoded)
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copiado para a área de transferência!', 'success')
  }).catch(() => {
    showToast('Não foi possível copiar', 'error')
  })
}

async function saveMessageAsDocument(encoded) {
  const content = decodeURIComponent(encoded)
  const title = `Chat salvo - ${new Date().toLocaleDateString('pt-BR')}`
  try {
    await api('POST', '/documents/generate', {
      template_type: 'post_redes_sociais',
      title,
      fields: { conteudo: content }
    })
    showToast('Salvo como documento!', 'success')
  } catch (err) {
    showToast('Erro ao salvar: ' + err.message, 'error')
  }
}

async function clearChatHistory() {
  if (!confirm('Limpar o histórico desta conversa? As mensagens serão excluídas.')) return
  try {
    await api('DELETE', `/chat/sessions/${chatSessionId}`)
    chatSessionId = null
    chatMessages = []
    await createNewChatSession()
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function exportChat() {
  if (!chatMessages.length) { showToast('Nenhuma mensagem para exportar', 'info'); return }
  let text = `# Conversa - Studio IA para Negócios\n\n`
  text += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n---\n\n`
  chatMessages.forEach(m => {
    text += `**${m.role === 'user' ? '👤 Você' : '🤖 Assistente IA'}**\n${m.content}\n\n---\n\n`
  })
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `chat-studio-ia-${Date.now()}.md`
  a.click()
  showToast('Chat exportado!', 'success')
}

async function checkOpenAIStatus() {
  try {
    const data = await api('GET', '/settings')
    const statusEl = document.getElementById('ai-status')
    if (statusEl) {
      if (data.settings?.openai_key) {
        statusEl.innerHTML = '<i class="fas fa-circle text-green-500 text-xs mr-1"></i>OpenAI configurado • Usando GPT-4o-mini'
        statusEl.className = 'text-xs text-green-600 mt-2 text-center'
      } else {
        statusEl.innerHTML = `Configure sua chave OpenAI em <button onclick="navigate('/conta')" class="text-yellow-500 hover:underline">Configurações</button> para IA real`
        statusEl.className = 'text-xs text-dim mt-2 text-center'
      }
    }
  } catch {}
}

// ============================================================
// DOCUMENTOS
// ============================================================
const DOC_TEMPLATES = {
  proposta_comercial: { icon: 'fa-handshake', color: 'indigo', name: 'Proposta Comercial', desc: 'Proposta profissional para fechar negócios' },
  orcamento: { icon: 'fa-receipt', color: 'blue', name: 'Orçamento Detalhado', desc: 'Orçamento com itens e valores' },
  contrato_simples: { icon: 'fa-file-contract', color: 'purple', name: 'Contrato Simples', desc: 'Contrato de prestação de serviços' },
  apresentacao_servicos: { icon: 'fa-presentation-screen', color: 'pink', name: 'Apresentação de Serviços', desc: 'Apresente seus serviços profissionalmente' },
  email_comercial: { icon: 'fa-envelope', color: 'orange', name: 'E-mail Comercial', desc: 'E-mail de prospecção ou follow-up' },
  copy_anuncio: { icon: 'fa-bullhorn', color: 'red', name: 'Copy para Anúncio', desc: 'Texto persuasivo para anúncios' },
  post_redes_sociais: { icon: 'fa-hashtag', color: 'green', name: 'Posts para Redes Sociais', desc: 'Conteúdo engajante para social media' },
  descricao_produto: { icon: 'fa-tag', color: 'teal', name: 'Descrição de Produto/Serviço', desc: 'Descrição persuasiva e completa' }
}

async function renderDocuments(container) {
  setBreadcrumb('Documentos')
  showLoader(container, 'Carregando documentos...')

  try {
    const data = await api('GET', '/documents')
    const docs = data.documents || []

    container.innerHTML = `
    <div class="space-y-6 animate-fade">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-cream">Documentos</h1>
          <p class="text-warm-gray text-sm">${docs.length} documento${docs.length !== 1 ? 's' : ''} criado${docs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onclick="showDocumentWizard()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
          <i class="fas fa-plus"></i> Novo documento
        </button>
      </div>

      <!-- Templates grid -->
      <div class="card p-6">
        <h2 class="font-bold text-cream mb-4">Templates Disponíveis</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          ${Object.entries(DOC_TEMPLATES).map(([id, t]) => `
          <button onclick="showDocumentWizard('${id}')" class="p-4 rounded-xl border-2 border-transparent hover:border-yellow-800 hover:bg-yellow-900/20 transition-all text-left group">
            <div class="w-10 h-10 rounded-xl bg-${t.color}-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <i class="fas ${t.icon} text-${t.color}-600 text-sm"></i>
            </div>
            <p class="font-semibold text-cream-2 text-xs leading-tight">${t.name}</p>
          </button>`).join('')}
        </div>
      </div>

      <!-- Documents list -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-cream">Meus Documentos</h2>
          <div class="flex gap-2">
            <input type="text" id="doc-search" placeholder="Buscar..." class="input-field text-sm py-2 px-3 w-40" oninput="filterDocs(this.value)">
          </div>
        </div>
        <div id="docs-list">
          ${docs.length === 0 ? `
          <div class="text-center py-12">
            <div class="w-16 h-16 rounded-2xl bg-dark-4 flex items-center justify-center mx-auto mb-4"><i class="fas fa-file-lines text-dim text-2xl"></i></div>
            <p class="font-semibold text-cream-3 mb-2">Nenhum documento ainda</p>
            <p class="text-dim text-sm mb-4">Crie seu primeiro documento usando um template</p>
            <button onclick="showDocumentWizard()" class="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold">
              <i class="fas fa-plus mr-2"></i>Criar documento
            </button>
          </div>` : `
          <div class="space-y-3" id="docs-items">
            ${docs.map(d => renderDocumentItem(d)).join('')}
          </div>`}
        </div>
      </div>
    </div>`

    window._allDocs = docs
  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function renderDocumentItem(d) {
  const t = DOC_TEMPLATES[d.template_type] || { icon: 'fa-file', color: 'gray', name: d.template_type }
  return `
  <div class="doc-item flex items-center gap-4 p-4 rounded-xl hover:bg-dark-2 transition-colors group cursor-pointer" onclick="navigate('/documentos/${d.id}')">
    <div class="w-10 h-10 rounded-xl bg-${t.color}-100 flex items-center justify-center flex-shrink-0">
      <i class="fas ${t.icon} text-${t.color}-600 text-sm"></i>
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-cream-2 text-sm truncate group-hover:text-yellow-500 transition-colors">${d.title}</p>
      <p class="text-xs text-dim">${t.name} • ${formatDate(d.created_at)}</p>
    </div>
    <div class="flex items-center gap-2 flex-shrink-0">
      <span class="tag ${d.status === 'draft' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' : 'bg-green-50 text-green-600 border border-green-100'}">${d.status === 'draft' ? 'Rascunho' : 'Finalizado'}</span>
      <button onclick="event.stopPropagation(); printDocument('${d.id}')" class="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-dim hover:text-yellow-500 hover:bg-yellow-900/20 transition-all" title="Imprimir/PDF">
        <i class="fas fa-print text-xs"></i>
      </button>
      <button onclick="event.stopPropagation(); deleteDocument('${d.id}')" class="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-dim hover:text-red-500 hover:bg-red-50 transition-all" title="Excluir">
        <i class="fas fa-trash text-xs"></i>
      </button>
    </div>
  </div>`
}

function filterDocs(search) {
  const docs = window._allDocs || []
  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
  const list = document.getElementById('docs-items')
  if (list) list.innerHTML = filtered.map(d => renderDocumentItem(d)).join('')
}

function showDocumentWizard(preselectedTemplate = null) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center modal-overlay'
  modal.id = 'doc-wizard-modal'
  modal.innerHTML = `
  <div class="modal-content rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
    <div class="flex items-center justify-between p-6 border-b border-gold-faint">
      <div>
        <h2 class="text-xl font-black text-cream">Novo Documento</h2>
        <p class="text-warm-gray text-sm">Escolha um template e preencha os dados</p>
      </div>
      <button onclick="document.getElementById('doc-wizard-modal').remove()" class="text-dim hover:text-gold-muted w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dark-4">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <!-- Step 1: Template Selection -->
      <div id="wizard-step-1" class="p-6">
        <p class="text-sm font-semibold text-cream-3 mb-4">Selecione o tipo de documento:</p>
        <div class="grid grid-cols-2 gap-3">
          ${Object.entries(DOC_TEMPLATES).map(([id, t]) => `
          <button onclick="selectDocTemplate('${id}')" id="tmpl-${id}" class="p-4 rounded-xl border-2 ${id === preselectedTemplate ? 'border-yellow-500 bg-yellow-900/20' : 'border-gold-faint hover:border-yellow-800'} transition-all text-left group">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-${t.color}-100 flex items-center justify-center flex-shrink-0">
                <i class="fas ${t.icon} text-${t.color}-600 text-sm"></i>
              </div>
              <div>
                <p class="font-semibold text-cream-2 text-sm">${t.name}</p>
                <p class="text-xs text-dim">${t.desc}</p>
              </div>
            </div>
          </button>`).join('')}
        </div>
      </div>

      <!-- Step 2: Fill fields -->
      <div id="wizard-step-2" class="p-6 hidden">
        <div id="wizard-fields"></div>
        <div class="bg-yellow-900/20 border border-yellow-900/40 rounded-xl p-4 mb-4">
          <div class="flex items-start gap-3">
            <i class="fas fa-brain text-yellow-500 mt-0.5"></i>
            <div>
              <p class="text-sm font-semibold text-indigo-800">Geração com IA</p>
              <p class="text-xs text-yellow-500 mt-1">Com OpenAI configurado, seu documento será gerado com IA real e personalizado. Sem IA, usamos templates profissionais.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-6 border-t border-gold-faint flex gap-3">
      <button id="wizard-back-btn" onclick="wizardBack()" class="hidden btn-secondary px-5 py-2.5 rounded-xl text-sm font-semibold">
        <i class="fas fa-arrow-left mr-2"></i>Voltar
      </button>
      <div class="flex-1"></div>
      <button id="wizard-next-btn" onclick="wizardNext()" class="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold">
        Próximo <i class="fas fa-arrow-right ml-2"></i>
      </button>
    </div>
  </div>`
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })

  if (preselectedTemplate) {
    window._selectedDocTemplate = preselectedTemplate
    setTimeout(() => selectDocTemplate(preselectedTemplate), 0)
  }
}

let _selectedDocTemplate = null

function selectDocTemplate(id) {
  _selectedDocTemplate = id
  document.querySelectorAll('[id^="tmpl-"]').forEach(el => {
    el.classList.remove('border-yellow-500', 'bg-yellow-900/20')
    el.classList.add('border-gold-faint')
  })
  const el = document.getElementById(`tmpl-${id}`)
  if (el) {
    el.classList.add('border-yellow-500', 'bg-yellow-900/20')
    el.classList.remove('border-gold-faint')
  }
}

function wizardNext() {
  const step1 = document.getElementById('wizard-step-1')
  const step2 = document.getElementById('wizard-step-2')

  if (!step2.classList.contains('hidden')) {
    // Generate document
    generateDocumentFromWizard()
    return
  }

  if (!_selectedDocTemplate) {
    showToast('Selecione um template para continuar', 'warning')
    return
  }

  // Show step 2
  step1.classList.add('hidden')
  step2.classList.remove('hidden')

  const backBtn = document.getElementById('wizard-back-btn')
  const nextBtn = document.getElementById('wizard-next-btn')
  if (backBtn) backBtn.classList.remove('hidden')
  if (nextBtn) nextBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-2"></i>Gerar com IA'

  const t = DOC_TEMPLATES[_selectedDocTemplate]
  const fieldsMap = {
    proposta_comercial: [
      { id: 'empresa', label: 'Nome da Empresa', placeholder: 'Ex: Consultoria Silva' },
      { id: 'cliente', label: 'Nome do Cliente', placeholder: 'Ex: João da Silva' },
      { id: 'servico', label: 'Serviço Oferecido', placeholder: 'Ex: Consultoria financeira mensal' },
      { id: 'valor', label: 'Valor/Investimento', placeholder: 'Ex: R$ 2.500,00' },
      { id: 'prazo', label: 'Prazo de Execução', placeholder: 'Ex: 30 dias' },
    ],
    orcamento: [
      { id: 'empresa', label: 'Sua Empresa', placeholder: 'Nome da empresa' },
      { id: 'cliente', label: 'Cliente', placeholder: 'Nome do cliente' },
      { id: 'itens', label: 'Itens/Serviços', placeholder: 'Descreva os itens ou serviços', textarea: true },
      { id: 'validade', label: 'Validade do Orçamento', placeholder: 'Ex: 10 dias' },
    ],
    contrato_simples: [
      { id: 'prestador', label: 'Prestador (você)', placeholder: 'Seu nome ou empresa' },
      { id: 'contratante', label: 'Contratante (cliente)', placeholder: 'Nome do cliente' },
      { id: 'servico', label: 'Serviço Contratado', placeholder: 'Descrição do serviço' },
      { id: 'valor', label: 'Valor Total', placeholder: 'Ex: R$ 5.000,00' },
      { id: 'prazo', label: 'Prazo', placeholder: 'Ex: 60 dias' },
    ],
    apresentacao_servicos: [
      { id: 'empresa', label: 'Nome da Empresa', placeholder: 'Sua empresa' },
      { id: 'servicos', label: 'Principais Serviços', placeholder: 'Liste seus serviços', textarea: true },
      { id: 'diferenciais', label: 'Seus Diferenciais', placeholder: 'O que te diferencia da concorrência', textarea: true },
      { id: 'cta', label: 'Call to Action', placeholder: 'Ex: Agende uma reunião gratuita' },
    ],
    email_comercial: [
      { id: 'remetente', label: 'Seu Nome/Empresa', placeholder: 'Seu nome' },
      { id: 'destinatario', label: 'Nome do Destinatário', placeholder: 'Nome do lead/cliente' },
      { id: 'objetivo', label: 'Objetivo do E-mail', placeholder: 'Ex: prospecção, follow-up, proposta' },
      { id: 'servico', label: 'Serviço/Produto', placeholder: 'O que você oferece' },
    ],
    copy_anuncio: [
      { id: 'produto', label: 'Produto/Serviço', placeholder: 'O que você vende' },
      { id: 'publico', label: 'Público-alvo', placeholder: 'Ex: Empreendedores iniciantes' },
      { id: 'beneficio', label: 'Principal Benefício', placeholder: 'O que o cliente ganha' },
      { id: 'cta', label: 'CTA (Chamada para Ação)', placeholder: 'Ex: Compre agora com desconto' },
    ],
    post_redes_sociais: [
      { id: 'negocio', label: 'Nome do Negócio', placeholder: 'Sua marca ou empresa' },
      { id: 'tema', label: 'Tema do Post', placeholder: 'Ex: dica, produto, bastidores' },
      { id: 'tom', label: 'Tom da Comunicação', placeholder: 'Ex: informal, profissional, motivacional' },
      { id: 'plataforma', label: 'Plataforma', placeholder: 'Instagram, LinkedIn, Facebook' },
    ],
    descricao_produto: [
      { id: 'produto', label: 'Nome do Produto/Serviço', placeholder: 'Ex: Consultoria de Marketing Digital' },
      { id: 'beneficios', label: 'Principais Benefícios', placeholder: 'Liste os benefícios', textarea: true },
      { id: 'publico', label: 'Público-alvo', placeholder: 'Para quem é?' },
      { id: 'preco', label: 'Preço/Investimento', placeholder: 'Ex: A partir de R$ 997' },
    ],
  }

  const fields = fieldsMap[_selectedDocTemplate] || []
  const fieldsDiv = document.getElementById('wizard-fields')
  if (fieldsDiv) {
    fieldsDiv.innerHTML = `
    <div class="flex items-center gap-3 mb-5">
      <div class="w-10 h-10 rounded-xl bg-${t.color}-100 flex items-center justify-center">
        <i class="fas ${t.icon} text-${t.color}-600"></i>
      </div>
      <div>
        <h3 class="font-bold text-cream">${t.name}</h3>
        <p class="text-xs text-warm-gray">${t.desc}</p>
      </div>
    </div>
    <div class="space-y-4">
      ${fields.map(f => `
      <div>
        <label class="block text-sm font-medium text-cream-3 mb-1.5">${f.label}</label>
        ${f.textarea
          ? `<textarea id="wf-${f.id}" class="input-field w-full text-sm" rows="3" placeholder="${f.placeholder}"></textarea>`
          : `<input id="wf-${f.id}" type="text" class="input-field w-full text-sm" placeholder="${f.placeholder}">`
        }
      </div>`).join('')}
    </div>`
  }
}

function wizardBack() {
  const step1 = document.getElementById('wizard-step-1')
  const step2 = document.getElementById('wizard-step-2')
  step1.classList.remove('hidden')
  step2.classList.add('hidden')
  const backBtn = document.getElementById('wizard-back-btn')
  const nextBtn = document.getElementById('wizard-next-btn')
  if (backBtn) backBtn.classList.add('hidden')
  if (nextBtn) nextBtn.innerHTML = 'Próximo <i class="fas fa-arrow-right ml-2"></i>'
}

async function generateDocumentFromWizard() {
  if (!_selectedDocTemplate) return

  const fieldsMap = {
    proposta_comercial: ['empresa','cliente','servico','valor','prazo'],
    orcamento: ['empresa','cliente','itens','validade'],
    contrato_simples: ['prestador','contratante','servico','valor','prazo'],
    apresentacao_servicos: ['empresa','servicos','diferenciais','cta'],
    email_comercial: ['remetente','destinatario','objetivo','servico'],
    copy_anuncio: ['produto','publico','beneficio','cta'],
    post_redes_sociais: ['negocio','tema','tom','plataforma'],
    descricao_produto: ['produto','beneficios','publico','preco'],
  }

  const fieldIds = fieldsMap[_selectedDocTemplate] || []
  const fields = {}
  fieldIds.forEach(id => {
    const el = document.getElementById(`wf-${id}`)
    if (el) fields[id] = el.value
  })

  const nextBtn = document.getElementById('wizard-next-btn')
  if (nextBtn) {
    nextBtn.disabled = true
    nextBtn.innerHTML = '<i class="fas fa-spinner spinner mr-2"></i>Gerando...'
  }

  try {
    const data = await api('POST', '/documents/generate', {
      template_type: _selectedDocTemplate,
      fields
    })

    document.getElementById('doc-wizard-modal')?.remove()
    showToast('Documento gerado com sucesso!', 'success')
    navigate('/documentos/' + data.document.id)
  } catch (err) {
    showToast(err.message, 'error')
    if (nextBtn) {
      nextBtn.disabled = false
      nextBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-2"></i>Gerar com IA'
    }
  }
}

async function renderDocumentEditor(container, docId) {
  setBreadcrumb('Editor de Documento')
  showLoader(container, 'Carregando documento...')

  try {
    const data = await api('GET', `/documents/${docId}`)
    const doc = data.document
    const t = DOC_TEMPLATES[doc.template_type] || { icon: 'fa-file', color: 'gray', name: 'Documento' }

    container.innerHTML = `
    <div class="space-y-4 animate-fade">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button onclick="navigate('/documentos')" class="btn-secondary p-2 rounded-xl">
          <i class="fas fa-arrow-left text-sm"></i>
        </button>
        <div class="flex-1">
          <input id="doc-title" type="text" value="${doc.title}" class="text-xl font-black text-cream bg-transparent border-none outline-none w-full focus:bg-white focus:border focus:border-yellow-800 focus:rounded-lg focus:px-2 transition-all">
        </div>
        <div class="flex items-center gap-2">
          <button onclick="printDocument('${doc.id}')" class="btn-secondary px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <i class="fas fa-print"></i><span class="hidden sm:inline">Imprimir/PDF</span>
          </button>
          <button onclick="saveDocument('${doc.id}')" class="btn-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
            <i class="fas fa-save"></i><span class="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </div>

      <!-- Doc info -->
      <div class="flex items-center gap-3 flex-wrap">
        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-${t.color}-100 text-${t.color}-700 text-sm font-medium">
          <i class="fas ${t.icon} text-xs"></i>${t.name}
        </span>
        <select id="doc-status" class="input-field text-sm py-1.5 px-3 w-auto">
          <option value="draft" ${doc.status === 'draft' ? 'selected' : ''}>Rascunho</option>
          <option value="final" ${doc.status === 'final' ? 'selected' : ''}>Finalizado</option>
        </select>
        <span class="text-xs text-dim">Criado em ${formatDate(doc.created_at)}</span>
      </div>

      <!-- Main content area -->
      <div class="grid lg:grid-cols-4 gap-4">
        <!-- Editor -->
        <div class="lg:col-span-3 card overflow-hidden">
          <div class="flex items-center gap-2 px-4 py-3 border-b border-gold-faint bg-dark-2">
            <span class="text-xs font-semibold text-warm-gray uppercase tracking-wider">Editor</span>
            <div class="flex-1"></div>
            <div class="flex gap-1">
              <button onclick="toggleEditorMode()" id="editor-mode-btn" class="text-xs px-3 py-1.5 rounded-lg bg-yellow-900/30 text-yellow-400 font-medium">
                <i class="fas fa-edit mr-1"></i>Editar
              </button>
              <button onclick="togglePreviewMode()" id="preview-mode-btn" class="text-xs px-3 py-1.5 rounded-lg text-gold-muted hover:bg-dark-4 font-medium">
                <i class="fas fa-eye mr-1"></i>Preview
              </button>
            </div>
          </div>
          <div id="editor-wrapper" class="relative">
            <textarea id="doc-content" class="w-full p-6 text-sm leading-relaxed font-mono text-cream-2 outline-none resize-none border-none bg-white" rows="25" style="min-height: 500px">${doc.content || ''}</textarea>
            <div id="doc-preview" class="hidden p-6 prose text-sm" style="min-height: 500px"></div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- AI Improve -->
          <div class="card p-4">
            <h3 class="font-bold text-cream text-sm mb-3 flex items-center gap-2">
              <i class="fas fa-brain text-yellow-500"></i>Melhorar com IA
            </h3>
            <div class="space-y-2">
              ${[
                { label: 'Tornar mais formal', prompt: 'Reescreva este documento com tom mais formal e profissional' },
                { label: 'Tornar mais persuasivo', prompt: 'Torne este documento mais persuasivo, focando nos benefícios' },
                { label: 'Resumir', prompt: 'Crie uma versão mais curta e direta deste documento' },
                { label: 'Adicionar CTA', prompt: 'Adicione uma chamada para ação mais forte no final' },
              ].map(a => `
              <button onclick="improveDocWithAI('${a.prompt}')" class="w-full text-left text-xs px-3 py-2 rounded-lg bg-dark-2 hover:bg-yellow-900/20 hover:text-yellow-400 transition-colors font-medium">
                <i class="fas fa-wand-magic-sparkles text-yellow-600 mr-2"></i>${a.label}
              </button>`).join('')}
            </div>
          </div>

          <!-- Actions -->
          <div class="card p-4">
            <h3 class="font-bold text-cream text-sm mb-3">Ações</h3>
            <div class="space-y-2">
              <button onclick="duplicateDocument('${doc.id}')" class="w-full text-left text-xs px-3 py-2 rounded-lg bg-dark-2 hover:bg-dark-3 transition-colors font-medium text-cream-3">
                <i class="fas fa-copy text-dim mr-2"></i>Duplicar documento
              </button>
              <button onclick="printDocument('${doc.id}')" class="w-full text-left text-xs px-3 py-2 rounded-lg bg-dark-2 hover:bg-dark-3 transition-colors font-medium text-cream-3">
                <i class="fas fa-print text-dim mr-2"></i>Imprimir / Salvar PDF
              </button>
              <button onclick="copyDocContent()" class="w-full text-left text-xs px-3 py-2 rounded-lg bg-dark-2 hover:bg-dark-3 transition-colors font-medium text-cream-3">
                <i class="fas fa-clipboard text-dim mr-2"></i>Copiar conteúdo
              </button>
              <button onclick="deleteDocument('${doc.id}', true)" class="w-full text-left text-xs px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors font-medium text-red-600">
                <i class="fas fa-trash text-red-400 mr-2"></i>Excluir documento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>`

    // Auto-save on typing
    const contentEl = document.getElementById('doc-content')
    if (contentEl) {
      let saveTimeout
      contentEl.addEventListener('input', () => {
        clearTimeout(saveTimeout)
        saveTimeout = setTimeout(() => saveDocumentSilent(docId), 2000)
      })
    }

  } catch (err) {
    container.innerHTML = `<div class="card p-8 text-center"><i class="fas fa-exclamation-circle text-red-400 text-2xl mb-3"></i><p class="text-red-500">${err.message}</p></div>`
  }
}

function toggleEditorMode() {
  document.getElementById('doc-content').classList.remove('hidden')
  document.getElementById('doc-preview').classList.add('hidden')
  document.getElementById('editor-mode-btn').className = 'text-xs px-3 py-1.5 rounded-lg bg-yellow-900/30 text-yellow-400 font-medium'
  document.getElementById('preview-mode-btn').className = 'text-xs px-3 py-1.5 rounded-lg text-gold-muted hover:bg-dark-4 font-medium'
}

function togglePreviewMode() {
  const content = document.getElementById('doc-content').value
  document.getElementById('doc-content').classList.add('hidden')
  const preview = document.getElementById('doc-preview')
  preview.classList.remove('hidden')
  preview.innerHTML = renderMD(content)
  document.getElementById('preview-mode-btn').className = 'text-xs px-3 py-1.5 rounded-lg bg-yellow-900/30 text-yellow-400 font-medium'
  document.getElementById('editor-mode-btn').className = 'text-xs px-3 py-1.5 rounded-lg text-gold-muted hover:bg-dark-4 font-medium'
}

async function saveDocument(docId) {
  const title = document.getElementById('doc-title')?.value
  const content = document.getElementById('doc-content')?.value
  const status = document.getElementById('doc-status')?.value
  try {
    await api('PUT', `/documents/${docId}`, { title, content, status })
    showToast('Documento salvo!', 'success')
  } catch (err) {
    showToast('Erro ao salvar: ' + err.message, 'error')
  }
}

async function saveDocumentSilent(docId) {
  const title = document.getElementById('doc-title')?.value
  const content = document.getElementById('doc-content')?.value
  try {
    await api('PUT', `/documents/${docId}`, { title, content, status: 'draft' })
  } catch {}
}

async function deleteDocument(docId, redirect = false) {
  if (!confirm('Excluir este documento permanentemente?')) return
  try {
    await api('DELETE', `/documents/${docId}`)
    showToast('Documento excluído', 'info')
    if (redirect) navigate('/documentos')
    else {
      const container = document.getElementById('main-content')
      renderDocuments(container)
    }
  } catch (err) {
    showToast(err.message, 'error')
  }
}

async function duplicateDocument(docId) {
  try {
    const data = await api('GET', `/documents/${docId}`)
    const doc = data.document
    const newData = await api('POST', '/documents/generate', {
      template_type: doc.template_type,
      title: `Cópia de ${doc.title}`,
      fields: {}
    })
    // Copy content
    await api('PUT', `/documents/${newData.document.id}`, {
      title: `Cópia de ${doc.title}`,
      content: doc.content,
      status: 'draft'
    })
    showToast('Documento duplicado!', 'success')
    navigate('/documentos/' + newData.document.id)
  } catch (err) {
    showToast(err.message, 'error')
  }
}

function copyDocContent() {
  const content = document.getElementById('doc-content')?.value
  if (!content) return
  navigator.clipboard.writeText(content).then(() => {
    showToast('Conteúdo copiado!', 'success')
  })
}

function printDocument(docId) {
  api('GET', `/documents/${docId}`).then(data => {
    const doc = data.document
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${doc.title}</title>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 40px; color: #1a1a1a; line-height: 1.7; }
  h1,h2,h3 { font-weight: 700; margin: 1.5rem 0 0.75rem; }
  h1 { font-size: 1.8rem; border-bottom: 2px solid #6366f1; padding-bottom: 0.5rem; color: #1e1b4b; }
  h2 { font-size: 1.4rem; color: #312e81; }
  h3 { font-size: 1.1rem; }
  p { margin-bottom: 1rem; }
  ul,ol { margin-left: 1.5rem; margin-bottom: 1rem; }
  li { margin-bottom: 0.3rem; }
  strong { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th,td { border: 1px solid #ddd; padding: 8px 12px; }
  th { background: #f5f5f5; font-weight: 700; }
  blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; color: #555; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #eee; }
  .footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 0.85rem; }
  @media print { body { margin: 0; padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div><strong>Studio IA para Negócios</strong></div>
  <div style="color:#888;font-size:0.85rem">${new Date().toLocaleDateString('pt-BR')}</div>
</div>
<div id="content"></div>
<div class="footer">Gerado com Studio IA para Negócios</div>
<script>
  document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(doc.content || '')})
  window.onload = () => setTimeout(() => window.print(), 300)
<\/script>
</body></html>`)
    w.document.close()
  }).catch(err => showToast('Erro: ' + err.message, 'error'))
}

async function improveDocWithAI(prompt) {
  const content = document.getElementById('doc-content')?.value
  if (!content) { showToast('Nenhum conteúdo para melhorar', 'warning'); return }

  showToast('Melhorando com IA...', 'info')

  try {
    // Use chat API for improvement
    const sessionData = await api('POST', '/chat/sessions', { title: 'Melhoria de documento' })
    const fullPrompt = `${prompt}:\n\n${content}\n\nRetorne apenas o documento melhorado, sem explicações adicionais.`
    const response = await api('POST', `/chat/sessions/${sessionData.session.id}/messages`, { content: fullPrompt })

    const textarea = document.getElementById('doc-content')
    if (textarea) {
      textarea.value = response.assistantMessage.content
    }
    
    showToast('Documento melhorado com IA!', 'success')
    
    // Clean up session
    await api('DELETE', `/chat/sessions/${sessionData.session.id}`)
  } catch (err) {
    showToast('Erro: ' + err.message + '. Configure OpenAI para usar esta funcionalidade.', 'error')
  }
}
