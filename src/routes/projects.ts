import { Hono } from 'hono'
import { HonoEnv, PLAN_LIMITS } from '../types'
import { authMiddleware } from '../middleware/auth'
import { generateId, getMonthYear } from '../lib/auth'

const projectRoutes = new Hono<HonoEnv>()
projectRoutes.use('*', authMiddleware)

// List projects
projectRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const projects = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all()
  return c.json({ projects: projects.results })
})

// Create project
projectRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  const { name, description, color } = await c.req.json()

  if (!name) return c.json({ error: 'Nome é obrigatório' }, 400)

  const limits = PLAN_LIMITS[user.plan || 'free']
  const count = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?').bind(userId).first() as any
  if (count.cnt >= limits.projects) {
    return c.json({ error: `Limite de projetos atingido (${limits.projects} no plano ${user.plan})` }, 403)
  }

  const id = generateId()
  await c.env.DB.prepare(
    'INSERT INTO projects (id, user_id, name, description, color) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, userId, name, description || null, color || '#6366f1').run()

  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first()
  return c.json({ project })
})

// Get project
projectRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const project = await c.env.DB.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first()
  if (!project) return c.json({ error: 'Projeto não encontrado' }, 404)

  const [documents, images, landingPages, chats] = await Promise.all([
    c.env.DB.prepare('SELECT id, title, template_type, status, created_at FROM documents WHERE project_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all(),
    c.env.DB.prepare('SELECT id, title, image_type, image_url, created_at FROM images WHERE project_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all(),
    c.env.DB.prepare('SELECT id, title, business_name, status, created_at FROM landing_pages WHERE project_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all(),
    c.env.DB.prepare('SELECT id, title, created_at FROM chat_sessions WHERE project_id = ? ORDER BY created_at DESC').bind(c.req.param('id')).all(),
  ])

  return c.json({ project, documents: documents.results, images: images.results, landingPages: landingPages.results, chats: chats.results })
})

// Update project
projectRoutes.put('/:id', async (c) => {
  const userId = c.get('userId')
  const { name, description, color } = await c.req.json()
  
  const project = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first()
  if (!project) return c.json({ error: 'Projeto não encontrado' }, 404)

  await c.env.DB.prepare(
    'UPDATE projects SET name = ?, description = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(name, description, color, c.req.param('id')).run()

  return c.json({ success: true })
})

// Delete project
projectRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const project = await c.env.DB.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first()
  if (!project) return c.json({ error: 'Projeto não encontrado' }, 404)

  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(c.req.param('id')).run()
  return c.json({ success: true })
})

export default projectRoutes
