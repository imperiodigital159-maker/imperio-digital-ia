-- Seed data for demo/development
-- Demo user (password: demo123)
INSERT OR IGNORE INTO users (id, name, email, password_hash, plan) VALUES 
  ('user-demo-001', 'Ana Costa', 'ana@exemplo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi', 'pro'),
  ('user-demo-002', 'João Silva', 'joao@exemplo.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi', 'free');

-- Demo subscriptions
INSERT OR IGNORE INTO subscriptions (id, user_id, plan, status) VALUES 
  ('sub-001', 'user-demo-001', 'pro', 'active'),
  ('sub-002', 'user-demo-002', 'free', 'active');

-- Demo projects
INSERT OR IGNORE INTO projects (id, user_id, name, description, color) VALUES 
  ('proj-001', 'user-demo-001', 'Campanha de Marketing', 'Materiais para campanha Q1 2024', '#6366f1'),
  ('proj-002', 'user-demo-001', 'Proposta Cliente ABC', 'Documentos para proposta comercial', '#22c55e'),
  ('proj-003', 'user-demo-001', 'Site Nova Empresa', 'Landing page e materiais visuais', '#f59e0b');

-- Demo chat sessions
INSERT OR IGNORE INTO chat_sessions (id, user_id, project_id, title) VALUES 
  ('chat-001', 'user-demo-001', 'proj-001', 'Ideias para campanha de lançamento'),
  ('chat-002', 'user-demo-001', NULL, 'Estratégia de vendas 2024'),
  ('chat-003', 'user-demo-001', 'proj-002', 'Estrutura da proposta comercial');

-- Demo messages
INSERT OR IGNORE INTO chat_messages (id, session_id, role, content) VALUES 
  ('msg-001', 'chat-001', 'user', 'Preciso de ideias criativas para lançar um produto de beleza nas redes sociais'),
  ('msg-002', 'chat-001', 'assistant', 'Ótima pergunta! Para o lançamento do seu produto de beleza, aqui estão algumas ideias criativas:

**1. Campanha "Antes e Depois"**
- Crie uma série de posts mostrando transformações reais
- Use depoimentos autênticos de clientes beta

**2. Desafio Viral**
- Lance um hashtag específico do produto
- Convide influenciadoras a participar

**3. Conteúdo Educativo**
- Tutoriais de aplicação em Reels/TikTok
- Dicas de skincare relacionadas ao produto

**4. Bastidores do Produto**
- Mostre o processo de criação
- Humanize a marca com histórias reais

Qual dessas estratégias mais se alinha com seu público-alvo?');

-- Demo documents
INSERT OR IGNORE INTO documents (id, user_id, project_id, title, template_type, content, status) VALUES 
  ('doc-001', 'user-demo-001', 'proj-002', 'Proposta Comercial - Cliente ABC', 'proposta_comercial', '# PROPOSTA COMERCIAL

**Empresa:** Studio Digital Pro
**Cliente:** ABC Serviços Ltda
**Data:** Março 2024

## Apresentação

É com prazer que apresentamos esta proposta para transformar a presença digital da ABC Serviços.

## Serviços Propostos

### 1. Gestão de Redes Sociais
- Criação de 20 posts mensais
- Gerenciamento das principais plataformas
- Relatório mensal de desempenho

### 2. Criação de Conteúdo
- Copywriting profissional
- Design de materiais visuais
- Edição de vídeos curtos

## Investimento

| Serviço | Valor Mensal |
|---------|-------------|
| Gestão Social | R$ 1.500,00 |
| Criação de Conteúdo | R$ 1.000,00 |
| **Total** | **R$ 2.500,00** |

## Próximos Passos

1. Aprovação da proposta
2. Contrato e NF
3. Onboarding e kickoff', 'draft'),
  ('doc-002', 'user-demo-001', NULL, 'E-mail Comercial - Prospecção', 'email_comercial', 'Assunto: Uma proposta especial para [Nome da Empresa]

Olá [Nome],

Espero que este e-mail o encontre bem!

Sou [Seu Nome] da [Sua Empresa] e venho acompanhando o crescimento da [Nome da Empresa] com muito interesse.

**Por que estou entrando em contato:**

Identificamos uma oportunidade de ajudar sua empresa a [benefício principal] através de [solução].

**O que oferecemos:**
✓ [Benefício 1]
✓ [Benefício 2]  
✓ [Benefício 3]

Gostaria de agendar uma conversa de 15 minutos para mostrar como podemos ajudar. Qual seria o melhor horário para você?

Atenciosamente,
[Seu Nome]', 'draft');

-- Demo images
INSERT OR IGNORE INTO images (id, user_id, project_id, title, prompt, image_url, image_type, style, format, status) VALUES 
  ('img-001', 'user-demo-001', 'proj-001', 'Post Lançamento Produto', 'Post elegante para lançamento de produto de beleza com fundo clean, tons rosé e dourado', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=600&fit=crop', 'post_social', 'minimalista', 'quadrado', 'completed'),
  ('img-002', 'user-demo-001', 'proj-001', 'Banner Promocional Black Friday', 'Banner black friday com fundo escuro, texto impactante, elementos dourados e modernos', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop', 'banner', 'moderno', 'horizontal', 'completed');

-- Demo landing pages
INSERT OR IGNORE INTO landing_pages (id, user_id, project_id, title, business_name, offer, content, status) VALUES 
  ('lp-001', 'user-demo-001', 'proj-003', 'Landing Page - Consultoria', 'Studio Digital Pro', 'Consultoria de Marketing Digital para PMEs', '{"hero": {"title": "Transforme seu negócio com Marketing Digital", "subtitle": "Estratégias comprovadas para pequenas e médias empresas crescerem online"}, "benefits": ["Mais visibilidade nas redes sociais", "Geração de leads qualificados", "ROI mensurável e transparente"], "cta": "Quero uma consultoria gratuita"}', 'published');
