import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { HonoEnv } from './types'
import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import chatRoutes from './routes/chat'
import documentRoutes from './routes/documents'
import imageRoutes from './routes/images'
import landingPageRoutes from './routes/landingPages'
import userRoutes from './routes/users'
import settingsRoutes from './routes/settings'
import stripeRoutes from './routes/stripe'
import oauthRoutes from './routes/oauth'
import analyticsRoutes from './routes/analytics'

const app = new Hono<HonoEnv>()

// CORS
app.use('/api/*', cors({
  origin: '*',
  credentials: false,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/projects', projectRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/documents', documentRoutes)
app.route('/api/images', imageRoutes)
app.route('/api/landing-pages', landingPageRoutes)
app.route('/api/users', userRoutes)
app.route('/api/settings', settingsRoutes)
app.route('/api/stripe', stripeRoutes)
app.route('/api/oauth', oauthRoutes)
app.route('/api/analytics', analyticsRoutes)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'Studio IA para Negócios' }))

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))

// SPA fallback - serve index.html for all non-API routes
app.get('*', async (c) => {
  const path = c.req.path
  
  // Don't serve HTML for API routes
  if (path.startsWith('/api/')) {
    return c.json({ error: 'Not found' }, 404)
  }
  
  return c.html(getAppHTML())
})

function getAppHTML(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Studio IA para Negócios</title>
  <meta name="description" content="Uma central de criação com IA para pequenos negócios criarem documentos, imagens e páginas em um só lugar.">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    
    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
    
    /* Animations */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    
    .animate-fade { animation: fadeIn 0.3s ease; }
    .animate-slide { animation: slideIn 0.3s ease; }
    .loading { animation: pulse 1.5s ease infinite; }
    .spinner { animation: spin 1s linear infinite; }
    
    /* Gradient text */
    .gradient-text { background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .gradient-bg { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    .gradient-hero { background: linear-gradient(135deg, #0f0f1a 0%, #1a1040 50%, #0f1a2e 100%); }
    
    /* Sidebar */
    .sidebar { transition: all 0.3s ease; }
    .sidebar-item { transition: all 0.2s ease; border-radius: 10px; }
    .sidebar-item:hover { background: rgba(99, 102, 241, 0.1); }
    .sidebar-item.active { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
    
    /* Cards */
    .card { background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04); transition: all 0.2s; }
    .card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); }
    
    /* Buttons */
    .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; transition: all 0.2s; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
    .btn-secondary { background: white; border: 1.5px solid #e2e8f0; color: #475569; transition: all 0.2s; }
    .btn-secondary:hover { border-color: #6366f1; color: #6366f1; background: #f5f3ff; }
    
    /* Input */
    .input-field { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; transition: all 0.2s; outline: none; }
    .input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    
    /* Modal */
    .modal-overlay { background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); }
    .modal-content { animation: fadeIn 0.2s ease; }
    
    /* Chat */
    .message-user { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 18px 18px 4px 18px; }
    .message-ai { background: white; border: 1px solid #f1f5f9; border-radius: 18px 18px 18px 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    
    /* Prose */
    .prose h1, .prose h2, .prose h3 { font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
    .prose h1 { font-size: 1.4rem; }
    .prose h2 { font-size: 1.2rem; }
    .prose h3 { font-size: 1rem; }
    .prose p { margin-bottom: 0.75rem; line-height: 1.7; }
    .prose ul, .prose ol { margin-left: 1.25rem; margin-bottom: 0.75rem; }
    .prose li { margin-bottom: 0.25rem; }
    .prose strong { font-weight: 600; }
    .prose code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; }
    .prose blockquote { border-left: 3px solid #6366f1; padding-left: 1rem; color: #64748b; }
    .prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    .prose th, .prose td { border: 1px solid #e2e8f0; padding: 8px 12px; }
    .prose th { background: #f8fafc; font-weight: 600; }
    
    /* Progress bar */
    .progress-bar { background: linear-gradient(90deg, #6366f1, #8b5cf6); height: 6px; border-radius: 3px; transition: width 0.5s; }
    
    /* Tags */
    .tag { background: #f1f5f9; color: #475569; border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; font-weight: 500; }
    
    /* Toggle */
    .plan-toggle-active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
    
    /* Landing page preview */
    .lp-preview { transform-origin: top left; }
  </style>
</head>
<body class="bg-slate-50 text-gray-900">
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="/static/app.js"></script>
  <script src="/static/chat_docs.js"></script>
  <script src="/static/images_lp.js"></script>
  <script src="/static/projects_account.js"></script>
</body>
</html>`
}

export default app
