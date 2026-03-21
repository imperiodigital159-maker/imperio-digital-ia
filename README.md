# 🧠 Studio IA para Negócios

> **Uma central de criação com IA para pequenos negócios criarem documentos, imagens e páginas em um só lugar.**

## 🌐 URL do App

- **Aplicação:** https://3000-injnaik7uiovasl1labk9-b9b802c4.sandbox.novita.ai
- **Conta Demo:** `ana@exemplo.com` / `demo123` (Plano Pro)

---

## ✅ Funcionalidades Implementadas

### 🌍 Landing Page Pública
- Headline e proposta de valor impactante
- Seção de funcionalidades com 6 cards
- Seção "Como Funciona" em 3 passos
- Casos de uso reais por segmento
- Depoimentos de clientes
- Tabela comparativa de planos (Grátis vs Pro)
- CTA duplo para conversão
- Design premium e moderno

### 🔐 Autenticação
- Login com e-mail e senha
- Cadastro de nova conta
- JWT com expiração de 7 dias
- Proteção de rotas (middleware)
- Conta demo pré-configurada

### 📊 Dashboard Principal
- Boas-vindas personalizadas
- Ações rápidas (Chat, Documentos, Imagens, Landing Pages)
- Barras de uso do plano mensal
- Projetos recentes
- Documentos recentes
- Imagens recentes (galeria)
- Conversas recentes
- Indicador de plano e botão de upgrade

### 💬 Chat com IA
- Criação de múltiplas sessões
- Histórico completo de conversas
- Respostas em Markdown renderizado
- Indicador de digitação animado
- Sugestões de prompts iniciais
- Renomeação automática por prompt
- Excluir sessões

### 📄 Módulo de Documentos
- **8 templates disponíveis:**
  - Proposta Comercial
  - Orçamento
  - Contrato Simples
  - Apresentação de Serviços
  - E-mail Comercial
  - Copy para Anúncio
  - Posts para Redes Sociais
  - Descrição de Produto/Serviço
- Formulário guiado por template
- Geração com IA (conteúdo contextual)
- Editor inline de texto
- Status de rascunho/finalizado
- Histórico de documentos

### 🖼️ Módulo de Imagens
- 6 tipos de peça: Post Social, Banner, Capa, Criativo de Anúncio, Thumbnail, Logo
- 6 estilos visuais: Minimalista, Moderno, Elegante, Vibrante, Corporativo, Casual
- Seleção de formato (quadrado, horizontal, vertical)
- Galeria com hover effects
- Download e preview
- Detecção de categoria por palavras-chave

### 🌐 Módulo de Landing Pages
- Formulário guiado completo
- Geração de HTML completo com IA
- Preview em iframe escalado
- Preview em nova aba
- Editor de título
- Status de publicação

### 📁 Sistema de Projetos
- Criar projetos com nome, descrição e cor
- 8 cores disponíveis
- Editar e excluir projetos
- Detalhe do projeto com todos os recursos associados
- Contador por tipo de recurso

### 👤 Conta & Assinatura
- Visualização de perfil
- Edição de nome
- Barras de uso mensal detalhadas
- Comparativo Grátis vs Pro
- Botão de upgrade (demo)
- Botão de sair

---

## 🗄️ Banco de Dados (Cloudflare D1)

### Tabelas
| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários cadastrados |
| `subscriptions` | Assinaturas dos usuários |
| `projects` | Projetos organizacionais |
| `chat_sessions` | Sessões de chat |
| `chat_messages` | Mensagens individuais |
| `documents` | Documentos gerados |
| `images` | Imagens geradas |
| `landing_pages` | Landing pages criadas |
| `usage_logs` | Histórico de uso por mês |
| `auth_sessions` | Sessões de autenticação |

---

## 📋 Limites por Plano

| Recurso | Grátis | Pro |
|---------|--------|-----|
| Mensagens Chat/mês | 30 | 500 |
| Documentos/mês | 5 | 100 |
| Imagens/mês | 5 | 50 |
| Landing Pages/mês | 2 | 20 |
| Projetos | 3 | 50 |

---

## 🏗️ Arquitetura

```
webapp/
├── src/
│   ├── index.ts              # App principal Hono
│   ├── types.ts              # TypeScript types
│   ├── lib/
│   │   └── auth.ts           # JWT + hashing
│   ├── middleware/
│   │   └── auth.ts           # Auth middleware
│   └── routes/
│       ├── auth.ts           # /api/auth/*
│       ├── users.ts          # /api/users/*
│       ├── projects.ts       # /api/projects/*
│       ├── chat.ts           # /api/chat/*
│       ├── documents.ts      # /api/documents/*
│       ├── images.ts         # /api/images/*
│       └── landingPages.ts   # /api/landing-pages/*
├── public/static/
│   ├── app.js               # Landing + Auth + Utilities
│   ├── chat_docs.js         # Chat + Documents modules
│   ├── images_lp.js         # Images + Landing Pages modules
│   └── projects_account.js  # Projects + Account modules
├── migrations/
│   ├── 0001_initial.sql     # Schema
│   └── 0002_seed_data.sql   # Dados demo
└── ecosystem.config.cjs     # PM2 config
```

---

## 🚀 Stack Técnica

- **Backend:** Hono Framework (Edge-native)
- **Runtime:** Cloudflare Workers / Pages
- **Banco:** Cloudflare D1 (SQLite)
- **Auth:** JWT com jose
- **Frontend:** Vanilla JS + Tailwind CSS CDN
- **Markdown:** marked.js
- **Icons:** Font Awesome 6
- **Build:** Vite + @hono/vite-build

---

## 🔑 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Usuário atual |
| GET | `/api/users/dashboard` | Dashboard data |
| GET | `/api/users/profile` | Perfil + uso |
| PUT | `/api/users/profile` | Atualizar perfil |
| POST | `/api/users/upgrade` | Upgrade plano |
| GET | `/api/projects` | Listar projetos |
| POST | `/api/projects` | Criar projeto |
| GET | `/api/projects/:id` | Detalhe projeto |
| PUT | `/api/projects/:id` | Editar projeto |
| DELETE | `/api/projects/:id` | Excluir projeto |
| GET | `/api/chat/sessions` | Listar sessões |
| POST | `/api/chat/sessions` | Nova sessão |
| GET | `/api/chat/sessions/:id` | Sessão + mensagens |
| POST | `/api/chat/sessions/:id/messages` | Enviar mensagem |
| GET | `/api/documents` | Listar documentos |
| GET | `/api/documents/templates` | Templates |
| POST | `/api/documents/generate` | Gerar documento |
| GET | `/api/documents/:id` | Ver documento |
| PUT | `/api/documents/:id` | Editar documento |
| GET | `/api/images` | Listar imagens |
| POST | `/api/images/generate` | Gerar imagem |
| GET | `/api/landing-pages` | Listar LPs |
| POST | `/api/landing-pages/generate` | Gerar LP |
| GET | `/api/landing-pages/:id/preview` | Preview HTML |

---

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Build
npm run build

# Aplicar migrations
npm run db:migrate:local

# Iniciar servidor
pm2 start ecosystem.config.cjs

# Ou desenvolvimento
npm run dev:sandbox
```

---

## 📈 Próximos Passos (Roadmap)

- [ ] Integração com OpenAI/Anthropic para respostas reais
- [ ] Upload de arquivos no chat
- [ ] Exportação de documentos em PDF
- [ ] Editor visual de landing pages (drag & drop)
- [ ] Integração com Stripe para pagamentos
- [ ] Autenticação com Google OAuth
- [ ] Compartilhamento de projetos em equipe
- [ ] Webhooks e integrações (Zapier, Make)
- [ ] Dashboard de analytics avançado
- [ ] PWA (app instalável)

---

*Criado com Studio IA para Negócios | © 2024*
