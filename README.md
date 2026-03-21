# Studio IA para Negócios

## Visão Geral
SaaS all-in-one com Inteligência Artificial para pequenos negócios, autônomos, consultores, advogados, clínicas e agências.

## 🔗 URLs
- **App (sandbox):** https://3000-injnaik7uiovasl1labk9-b9b802c4.sandbox.novita.ai
- **Login demo:** ana@exemplo.com / demo123
- **Segundo usuário:** carlos@exemplo.com / demo123

## ✅ Funcionalidades Implementadas

### Módulos Públicos
- **Landing Page** — Hero, benefícios, casos de uso, planos, depoimentos, CTA, rodapé
- **Autenticação** — Login, cadastro, JWT, recuperação, Google OAuth (mock), dados demo

### Módulos Privados (pós-login)
- **Dashboard** — Boas-vindas, ações rápidas, barras de uso, itens recentes
- **Chat IA** — Múltiplas sessões, histórico, Markdown, sugestões rápidas, exportar, salvar como doc
- **Gerador de Documentos** — 8 templates com wizard, editor em tela cheia, preview Markdown, export PDF/print, melhoria com IA
- **Gerador de Imagens** — 6 tipos + 6 estilos, galeria grid/lista, preview modal, download, integração DALL-E 3
- **Gerador de Landing Pages** — Wizard completo, editor HTML ao vivo, preview iframe, modo desktop/tablet/mobile, melhoria com IA
- **Sistema de Projetos** — Criar/editar/excluir, cores, view grid/lista, detalhe do projeto com todos os assets
- **Conta & Assinatura** — Perfil, alterar senha, uso do plano, comparativo grátis vs Pro, configurações de integrações
- **Analytics** — Gráfico de uso 6 meses, totais, templates mais usados, atividade recente
- **Configurações** — Chave OpenAI (Chat + DALL-E), Stripe (pagamentos reais)

## 🤖 Integrações com IA

### OpenAI (configurar em Conta > Configurações)
- **Chat IA:** usa GPT-4o-mini (sem chave usa respostas de fallback profissionais)
- **Melhorar documentos:** reescrita via GPT-4o-mini
- **Geração de imagens:** usa DALL-E 3 (sem chave usa imagens Unsplash por categoria)
- **Melhorar landing pages:** reescrita via GPT-4o-mini

### Stripe (configurar em Conta > Configurações)
- Checkout real para assinatura Pro
- Portal do cliente para gerenciar assinatura
- Sem chave: modo demo (upgrade gratuito)

## 📊 Estrutura de Dados
| Tabela | Descrição |
|--------|-----------|
| users | Usuários + plano (free/pro) |
| subscriptions | Assinaturas e status |
| projects | Projetos com cor e descrição |
| chat_sessions | Sessões de chat |
| chat_messages | Mensagens (user/assistant) |
| documents | Documentos com content Markdown |
| images | Imagens com URL e metadados |
| landing_pages | Páginas com HTML completo |
| usage_logs | Logs de uso mensal |
| user_settings | Chaves OpenAI e Stripe por usuário |

## 🎯 Planos
| Recurso | Grátis | Pro |
|---------|--------|-----|
| Chat/mês | 30 | 500 |
| Documentos/mês | 5 | 100 |
| Imagens/mês | 5 | 50 |
| Landing Pages/mês | 2 | 20 |
| Projetos | 3 | 50 |
| Templates | 4 básicos | Todos |

## 🛠️ Tech Stack
- **Backend:** Hono (TypeScript) + Cloudflare Workers
- **Banco de dados:** Cloudflare D1 (SQLite distribuído)
- **Autenticação:** JWT com jose (HS256, 7 dias)
- **Senhas:** SHA-256 + salt
- **Frontend:** Vanilla JS SPA + Tailwind CSS CDN + Font Awesome
- **Deploy:** Cloudflare Pages

## 🚀 API Endpoints (30+)

### Auth (`/api/auth`)
- POST `/login` — Login com e-mail/senha
- POST `/register` — Cadastro
- GET `/me` — Usuário atual

### Users (`/api/users`)
- GET `/dashboard` — Dados do dashboard
- GET `/account` — Dados da conta (perfil + uso + limites)
- GET `/profile` — Perfil + uso detalhado
- PUT `/profile` — Atualizar nome
- PUT `/password` — Alterar senha
- POST `/upgrade` — Upgrade para Pro (demo)

### Chat (`/api/chat`)
- GET/POST `/sessions` — Listar/criar sessões
- GET `/sessions/:id` — Sessão com mensagens
- POST `/sessions/:id/messages` — Enviar mensagem (OpenAI ou fallback)
- PUT/DELETE `/sessions/:id` — Renomear/excluir

### Documents (`/api/documents`)
- GET `/` — Listar documentos
- GET `/templates` — Templates disponíveis
- POST `/generate` — Gerar documento
- GET/PUT/DELETE `/:id` — CRUD documento

### Images (`/api/images`)
- GET `/` + GET `/types` — Listar + tipos
- POST `/generate` — Gerar imagem (DALL-E ou Unsplash)
- GET/PUT/DELETE `/:id` — CRUD imagem

### Landing Pages (`/api/landing-pages`)
- GET `/` — Listar
- POST `/generate` — Gerar landing page
- GET/PUT/DELETE `/:id` — CRUD

### Projects (`/api/projects`)
- GET/POST `/` — Listar/criar
- GET/PUT/DELETE `/:id` — CRUD

### Settings (`/api/settings`)
- GET `/` — Obter configurações (chaves mascaradas)
- POST `/` — Salvar chaves OpenAI/Stripe

### Analytics (`/api/analytics`)
- GET `/` — Totais + gráfico 6 meses + atividade recente

### Stripe (`/api/stripe`)
- POST `/checkout` — Criar sessão de pagamento
- POST `/webhook` — Webhook Stripe

## 📱 Responsividade
- Sidebar colapsável em mobile
- Layout responsivo em todos os módulos
- Touch-friendly

## 🔒 Segurança
- JWT com expiração de 7 dias
- Senhas com SHA-256 + salt
- Chaves de API mascaradas no retorno
- Middleware de autenticação em todas as rotas privadas
- Limites de uso por plano

## Deployment
- **Plataforma:** Cloudflare Pages
- **Status:** ✅ Desenvolvimento ativo
- **Última atualização:** Março 2026

## Como Usar (Demo)
1. Acesse o app e clique em "Entrar"
2. Use: **ana@exemplo.com** / **demo123**
3. Explore Dashboard, Chat, Documentos, Imagens e Landing Pages
4. Para IA real, vá em **Conta > Configurações** e insira sua chave OpenAI
5. Para pagamentos reais, configure o Stripe nas mesmas configurações
