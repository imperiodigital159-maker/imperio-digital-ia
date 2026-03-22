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
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'Império Digital IA' }))

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
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Império Digital IA</title>
  <meta name="description" content="Uma central de criação com IA para pequenos negócios criarem documentos, imagens e páginas em um só lugar.">
  <!-- Tailwind config MUST come before CDN script -->
  <script>
    window.tailwind = window.tailwind || {};
    window.tailwindConfig = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            gold: { DEFAULT: '#D4AF37', light: '#F0D060', dark: '#A8891A' }
          }
        }
      }
    };
  </script>
  <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
  <script>
    if (window.tailwind && window.tailwind.config) {
      tailwind.config = { darkMode: 'class', theme: { extend: { colors: { gold: '#D4AF37' } } } }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body { background-color: #0A0A0A !important; color: #F5F0E8 !important; }
    body { font-family: 'Inter', sans-serif; }

    /* ===== RESET ANTI-AZUL: Tailwind preflight override ===== */
    /* Remove qualquer azul residual do Tailwind */
    *, *::before, *::after { --tw-ring-color: rgba(212,175,55,0.5); }

    /* ===== TEMA PRETO & DOURADO ===== */
    :root {
      --gold: #D4AF37;
      --gold-light: #F0D060;
      --gold-dark: #A8891A;
      --gold-muted: rgba(212,175,55,0.15);
      --black: #0A0A0A;
      --black-2: #111111;
      --black-3: #1A1A1A;
      --black-4: #222222;
      --black-5: #2A2A2A;
      --border: rgba(212,175,55,0.2);
      --border-hover: rgba(212,175,55,0.5);
      --text-primary: #F5F0E8;
      --text-secondary: #A09880;
      --text-muted: #6B6355;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--black-3); }
    ::-webkit-scrollbar-thumb { background: var(--gold-dark); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--gold); }

    /* Animations */
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes glow { 0%, 100% { box-shadow: 0 0 10px rgba(212,175,55,0.3); } 50% { box-shadow: 0 0 25px rgba(212,175,55,0.6); } }

    .animate-fade { animation: fadeIn 0.3s ease; }
    .animate-slide { animation: slideIn 0.3s ease; }
    .loading { animation: pulse 1.5s ease infinite; }
    .spinner { animation: spin 1s linear infinite; }

    /* Gradient text */
    .gradient-text {
      background: linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark));
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }
    .gradient-bg { background: linear-gradient(135deg, var(--gold-dark), var(--gold)); }
    .gradient-hero { background: linear-gradient(135deg, var(--black) 0%, var(--black-3) 100%); }

    /* Sidebar */
    .sidebar { transition: all 0.3s ease; background: var(--black-2); border-right: 1px solid var(--border); }
    .sidebar-item { transition: all 0.2s ease; border-radius: 10px; color: var(--text-secondary); }
    .sidebar-item:hover { background: var(--gold-muted); color: var(--gold-light); }
    .sidebar-item.active { background: var(--gold-muted); color: var(--gold); border-left: 3px solid var(--gold); }

    /* Cards */
    .card { background: var(--black-3); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.4); transition: all 0.2s; }
    .card:hover { box-shadow: 0 4px 20px rgba(212,175,55,0.15); transform: translateY(-1px); border-color: var(--border-hover); }

    /* Buttons */
    .btn-primary { background: linear-gradient(135deg, var(--gold-dark), var(--gold)); color: var(--black); border: none; font-weight: 700; transition: all 0.2s; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(212,175,55,0.4); }
    .btn-secondary { background: transparent; border: 1.5px solid var(--border); color: var(--text-secondary); transition: all 0.2s; }
    .btn-secondary:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-muted); }

    /* Input */
    .input-field { background: var(--black-4); border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; transition: all 0.2s; outline: none; color: var(--text-primary); }
    .input-field::placeholder { color: var(--text-muted); }
    .input-field:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(212,175,55,0.12); }

    /* Modal */
    .modal-overlay { background: rgba(0,0,0,0.8); backdrop-filter: blur(6px); }
    .modal-content { animation: fadeIn 0.2s ease; background: var(--black-3); border: 1px solid var(--border); }

    /* Chat */
    .message-user { background: linear-gradient(135deg, var(--gold-dark), var(--gold)); color: var(--black); border-radius: 18px 18px 4px 18px; font-weight: 500; }
    .message-ai { background: var(--black-4); border: 1px solid var(--border); color: var(--text-primary); border-radius: 18px 18px 18px 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }

    /* Prose */
    .prose { color: var(--text-primary); }
    .prose h1, .prose h2, .prose h3 { font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: var(--gold-light); }
    .prose h1 { font-size: 1.4rem; }
    .prose h2 { font-size: 1.2rem; }
    .prose h3 { font-size: 1rem; }
    .prose p { margin-bottom: 0.75rem; line-height: 1.7; }
    .prose ul, .prose ol { margin-left: 1.25rem; margin-bottom: 0.75rem; }
    .prose li { margin-bottom: 0.25rem; }
    .prose strong { font-weight: 600; color: var(--gold); }
    .prose code { background: var(--black-5); color: var(--gold-light); padding: 2px 6px; border-radius: 4px; font-size: 0.85em; border: 1px solid var(--border); }
    .prose blockquote { border-left: 3px solid var(--gold); padding-left: 1rem; color: var(--text-secondary); }
    .prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    .prose th, .prose td { border: 1px solid var(--border); padding: 8px 12px; }
    .prose th { background: var(--black-4); font-weight: 600; color: var(--gold); }

    /* Progress bar */
    .progress-bar { background: linear-gradient(90deg, var(--gold-dark), var(--gold)); height: 6px; border-radius: 3px; transition: width 0.5s; }

    /* Tags */
    .tag { background: var(--gold-muted); color: var(--gold); border: 1px solid var(--border); border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; font-weight: 500; }

    /* Toggle */
    .plan-toggle-active { background: linear-gradient(135deg, var(--gold-dark), var(--gold)); color: var(--black); }

    /* Landing page preview */
    .lp-preview { transform-origin: top left; }

    /* Gold divider */
    .gold-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--gold), transparent); }

    /* Glow button */
    .btn-glow { animation: glow 2s ease-in-out infinite; }

    /* Select & textarea dark */
    select, textarea { background: var(--black-4) !important; color: var(--text-primary) !important; border-color: var(--border) !important; }
    select:focus, textarea:focus { border-color: var(--gold) !important; outline: none; }
    option { background: var(--black-3); color: var(--text-primary); }

    /* Text adjustments */
    .text-gray-900 { color: var(--text-primary) !important; }
    .text-gray-800 { color: #E8E0D0 !important; }
    .text-gray-700 { color: #D0C8B8 !important; }
    .text-gray-600 { color: #B8B0A0 !important; }
    .text-gray-500 { color: var(--text-secondary) !important; }
    .text-gray-400 { color: var(--text-muted) !important; }

    /* Background overrides */
    .bg-white { background-color: var(--black-3) !important; }
    .bg-slate-50 { background-color: var(--black-2) !important; }
    .bg-slate-100 { background-color: var(--black-3) !important; }
    .bg-gray-50 { background-color: var(--black-4) !important; }
    .bg-gray-100 { background-color: var(--black-4) !important; }
    .bg-gray-200 { background-color: var(--black-5) !important; }

    /* Border overrides */
    .border-slate-100, .border-gray-100, .border-gray-200 { border-color: var(--border) !important; }
    .border-b.border-slate-100, .border-t.border-slate-100 { border-color: var(--border) !important; }

    /* Indigo/Purple → Gold replacements */
    .text-indigo-600, .text-indigo-700 { color: var(--gold) !important; }
    .text-indigo-500 { color: var(--gold) !important; }
    .text-purple-600 { color: var(--gold-light) !important; }
    .bg-indigo-50, .bg-indigo-100 { background-color: var(--gold-muted) !important; }
    .bg-purple-50, .bg-purple-100 { background-color: rgba(212,175,55,0.1) !important; }
    .border-indigo-100, .border-indigo-500 { border-color: var(--gold) !important; }
    .text-indigo-700 { color: var(--gold) !important; }

    /* Spinner gold */
    .border-indigo-200 { border-color: rgba(212,175,55,0.2) !important; }
    .border-t-indigo-600 { border-top-color: var(--gold) !important; }

    /* Header */
    header.bg-white { background-color: var(--black-2) !important; border-color: var(--border) !important; }

    /* Nav Plan badge */
    .bg-indigo-100.text-indigo-700 { background-color: var(--gold-muted) !important; color: var(--gold) !important; }

    /* ===== NUCLEAR ANTI-BLUE OVERRIDE ===== */
    /* Tailwind slate colors → pure black */
    .bg-slate-900 { background-color: #0A0A0A !important; }
    .bg-slate-800 { background-color: #111111 !important; }
    .bg-slate-700 { background-color: #1A1A1A !important; }
    .bg-slate-600 { background-color: #222222 !important; }
    .bg-slate-500 { background-color: #2A2A2A !important; }
    .bg-slate-400 { background-color: #333333 !important; }
    .bg-slate-300 { background-color: #2A2A2A !important; }
    .bg-slate-200 { background-color: #222222 !important; }
    .bg-slate-50  { background-color: #111111 !important; }
    /* Blue/Indigo completely removed */
    [class*="bg-blue-"]   { background-color: rgba(212,175,55,0.1) !important; }
    [class*="bg-indigo-"] { background-color: rgba(212,175,55,0.1) !important; }
    [class*="bg-violet-"] { background-color: rgba(212,175,55,0.1) !important; }
    /* Ensure all white backgrounds are dark */
    .bg-white  { background-color: #1A1A1A !important; }
    .bg-gray-50  { background-color: #111111 !important; }
    .bg-gray-100 { background-color: #1A1A1A !important; }
    .bg-gray-200 { background-color: #222222 !important; }
    .bg-gray-300 { background-color: #2A2A2A !important; }
    /* Borders dark */
    [class*="border-slate-"] { border-color: rgba(212,175,55,0.15) !important; }
    [class*="border-gray-"]  { border-color: rgba(212,175,55,0.15) !important; }
    /* All text-gray stay warm */
    [class*="text-slate-"] { color: #A09880 !important; }
    /* Fix: black text on dark background */
    .text-black { color: #0A0A0A !important; }

    /* ===== CUSTOM UTILITY CLASSES (used in JS-generated HTML) ===== */
    /* Background utilities */
    .bg-dark-2 { background-color: var(--black-2) !important; }
    .bg-dark-3 { background-color: var(--black-3) !important; }
    .bg-dark-4 { background-color: var(--black-4) !important; }
    .bg-dark-5 { background-color: var(--black-5) !important; }

    /* Text utilities */
    .text-cream   { color: var(--text-primary) !important; }
    .text-cream-2 { color: #E8E0D0 !important; }
    .text-cream-3 { color: #D0C8B8 !important; }
    .text-gold-muted { color: #B8B0A0 !important; }
    .text-warm-gray { color: var(--text-secondary) !important; }
    .text-dim { color: var(--text-muted) !important; }

    /* Border utilities */
    .border-gold-faint { border-color: var(--border) !important; }

    /* Yellow → Gold mapping (from sed replacements) */
    .text-yellow-400, .text-yellow-500, .text-yellow-600 { color: var(--gold) !important; }
    .bg-yellow-900\/30 { background-color: rgba(212,175,55,0.12) !important; }
    .bg-yellow-900\/20 { background-color: rgba(212,175,55,0.08) !important; }
    .bg-yellow-900\/10 { background-color: rgba(212,175,55,0.04) !important; }
    .border-yellow-500 { border-color: var(--gold) !important; }
    .border-yellow-800 { border-color: var(--gold-dark) !important; }
    .border-yellow-900\/40 { border-color: rgba(212,175,55,0.4) !important; }
    .border-t-yellow-500 { border-top-color: var(--gold) !important; }
    .bg-yellow-700, .bg-yellow-600, .bg-yellow-500 { background-color: var(--gold-dark) !important; }

    /* Green/Pink/Blue feature icons keep accent colors */
    .text-green-500, .text-green-600 { color: #4ADE80 !important; }
    .text-pink-500, .text-pink-600 { color: #F472B6 !important; }
    .text-blue-500, .text-blue-600 { color: #60A5FA !important; }
    .bg-green-50, .bg-green-100 { background-color: rgba(74,222,128,0.08) !important; }
    .bg-pink-50, .bg-pink-100 { background-color: rgba(244,114,182,0.08) !important; }
    .bg-blue-50, .bg-blue-100 { background-color: rgba(96,165,250,0.08) !important; }
    .text-red-500, .text-red-400 { color: #F87171 !important; }
    .bg-red-50 { background-color: rgba(248,113,113,0.08) !important; }
    .border-red-100 { border-color: rgba(248,113,113,0.25) !important; }
    .text-red-600 { color: #F87171 !important; }
    .tag { background: var(--gold-muted) !important; color: var(--gold) !important; border: 1px solid var(--border) !important; }

    /* Status badges */
    .bg-yellow-50.text-yellow-600 { background: rgba(234,179,8,0.1) !important; color: #FBBF24 !important; }
    .bg-green-50.text-green-600 { background: rgba(74,222,128,0.1) !important; color: #4ADE80 !important; }

    /* Loading spinner */
    .border-2.border-yellow-800 { border-color: rgba(212,175,55,0.2) !important; }
    .border-t-yellow-500 { border-top-color: var(--gold) !important; }
  </style>
</head>
<body class="dark" style="background-color:#0A0A0A; color:#F5F0E8; font-family:'Inter',sans-serif">
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <!-- Override Tailwind after it loads -->
  <style id="gold-override">
    /* Applied AFTER Tailwind CDN to ensure black/gold theme wins */
    .bg-white, [class~="bg-white"] { background-color: #1A1A1A !important; }
    .bg-slate-50, [class~="bg-slate-50"] { background-color: #111111 !important; }
    .bg-slate-100, [class~="bg-slate-100"] { background-color: #1A1A1A !important; }
    .bg-gray-50, [class~="bg-gray-50"] { background-color: #111111 !important; }
    .bg-gray-100, [class~="bg-gray-100"] { background-color: #1A1A1A !important; }
    .bg-gray-200, [class~="bg-gray-200"] { background-color: #222222 !important; }
    .text-gray-900 { color: #F5F0E8 !important; }
    .text-gray-800 { color: #E8E0D0 !important; }
    .text-gray-700 { color: #D0C8B8 !important; }
    .text-gray-600 { color: #B8B0A0 !important; }
    .text-gray-500 { color: #A09880 !important; }
    .text-gray-400 { color: #6B6355 !important; }
    .border-gray-100, .border-gray-200, .border-slate-100 { border-color: rgba(212,175,55,0.15) !important; }
    .text-indigo-600, .text-indigo-700, .text-indigo-500 { color: #D4AF37 !important; }
    .bg-indigo-50, .bg-indigo-100 { background-color: rgba(212,175,55,0.1) !important; }
    .bg-indigo-500, .bg-indigo-600 { background: linear-gradient(135deg, #A8891A, #D4AF37) !important; }
    [class*="bg-blue-"], [class*="bg-indigo-"], [class*="bg-violet-"] { background-color: rgba(212,175,55,0.08) !important; }
    [class*="text-blue-"], [class*="text-violet-"] { color: #D4AF37 !important; }
    .text-yellow-400, .text-yellow-500 { color: #D4AF37 !important; }
    .bg-yellow-900\/30, .bg-yellow-900\/20, .bg-yellow-900\/10 { background-color: rgba(212,175,55,0.1) !important; }
  </style>
  <script src="/static/app.js"></script>
  <script src="/static/chat_docs.js"></script>
  <script src="/static/images_lp.js"></script>
  <script src="/static/projects_account.js"></script>
</body>
</html>`
}

export default app
