import { Hono } from 'hono'
import { HonoEnv, PLAN_LIMITS } from '../types'
import { authMiddleware } from '../middleware/auth'
import { getMonthYear, hashPassword, verifyPassword } from '../lib/auth'

const userRoutes = new Hono<HonoEnv>()
userRoutes.use('*', authMiddleware)

// Get user profile and stats
userRoutes.get('/profile', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  
  const monthYear = getMonthYear()
  
  const [chatUsage, docUsage, imgUsage, lpUsage, projectCount] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'chat', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'document', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'image', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'landing_page', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?').bind(userId).first(),
  ])
  
  const limits = PLAN_LIMITS[user.plan || 'free']
  
  return c.json({
    user,
    usage: {
      month_year: monthYear,
      chat: { used: (chatUsage as any)?.cnt || 0, limit: limits.chat_messages },
      documents: { used: (docUsage as any)?.cnt || 0, limit: limits.documents },
      images: { used: (imgUsage as any)?.cnt || 0, limit: limits.images },
      landing_pages: { used: (lpUsage as any)?.cnt || 0, limit: limits.landing_pages },
      projects: { used: (projectCount as any)?.cnt || 0, limit: limits.projects },
    },
    plan: user.plan,
    limits
  })
})

// Get account page data (profile + subscription + usage + limits)
userRoutes.get('/account', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  const monthYear = getMonthYear()
  
  const [chatUsage, docUsage, imgUsage, lpUsage, subscription] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'chat', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'document', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'image', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'landing_page', monthYear).first(),
    c.env.DB.prepare('SELECT * FROM subscriptions WHERE user_id = ?').bind(userId).first(),
  ])
  
  const limits = PLAN_LIMITS[user.plan || 'free']
  
  return c.json({
    user,
    subscription: subscription || { plan: user.plan, status: 'active' },
    usage: {
      chat: (chatUsage as any)?.cnt || 0,
      documents: (docUsage as any)?.cnt || 0,
      images: (imgUsage as any)?.cnt || 0,
      landing_pages: (lpUsage as any)?.cnt || 0,
    },
    limits: {
      chat: limits.chat_messages,
      documents: limits.documents,
      images: limits.images,
      landing_pages: limits.landing_pages,
      projects: limits.projects,
    },
    plan: user.plan
  })
})

// Get dashboard stats
userRoutes.get('/dashboard', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  const monthYear = getMonthYear()
  
  const [recentProjects, recentDocs, recentImages, recentPages, recentChats,
         chatUsage, docUsage, imgUsage] = await Promise.all([
    c.env.DB.prepare('SELECT id, name, color, description, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 4').bind(userId).all(),
    c.env.DB.prepare('SELECT id, title, template_type, status, created_at FROM documents WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').bind(userId).all(),
    c.env.DB.prepare('SELECT id, title, image_url, image_type, created_at FROM images WHERE user_id = ? ORDER BY created_at DESC LIMIT 4').bind(userId).all(),
    c.env.DB.prepare('SELECT id, title, business_name, status, created_at FROM landing_pages WHERE user_id = ? ORDER BY created_at DESC LIMIT 3').bind(userId).all(),
    c.env.DB.prepare('SELECT id, title, updated_at FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 3').bind(userId).all(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'chat', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'document', monthYear).first(),
    c.env.DB.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?').bind(userId, 'image', monthYear).first(),
  ])
  
  const limits = PLAN_LIMITS[user.plan || 'free']
  
  return c.json({
    user,
    recentProjects: recentProjects.results,
    recentDocs: recentDocs.results,
    recentImages: recentImages.results,
    recentPages: recentPages.results,
    recentChats: recentChats.results,
    usage: {
      chat: { used: (chatUsage as any)?.cnt || 0, limit: limits.chat_messages },
      documents: { used: (docUsage as any)?.cnt || 0, limit: limits.documents },
      images: { used: (imgUsage as any)?.cnt || 0, limit: limits.images },
    },
    plan: user.plan
  })
})

// Update user profile (name)
userRoutes.put('/profile', async (c) => {
  const userId = c.get('userId')
  const { name, avatar } = await c.req.json()
  
  if (!name || name.trim().length < 2) {
    return c.json({ error: 'Nome deve ter pelo menos 2 caracteres' }, 400)
  }
  
  await c.env.DB.prepare('UPDATE users SET name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(name.trim(), avatar || null, userId).run()
  
  return c.json({ success: true, name: name.trim() })
})

// Change password
userRoutes.put('/password', async (c) => {
  const userId = c.get('userId')
  const { old_password, new_password } = await c.req.json()
  
  if (!old_password || !new_password) {
    return c.json({ error: 'Senha atual e nova senha são obrigatórias' }, 400)
  }
  
  if (new_password.length < 6) {
    return c.json({ error: 'Nova senha deve ter pelo menos 6 caracteres' }, 400)
  }
  
  const user = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(userId).first() as any
  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404)
  
  const valid = await verifyPassword(old_password, user.password_hash)
  if (!valid) return c.json({ error: 'Senha atual incorreta' }, 401)
  
  const newHash = await hashPassword(new_password)
  await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(newHash, userId).run()
  
  return c.json({ success: true })
})

// Upgrade plan (mock/demo without Stripe)
userRoutes.post('/upgrade', async (c) => {
  const userId = c.get('userId')
  
  await c.env.DB.prepare('UPDATE users SET plan = ? WHERE id = ?').bind('pro', userId).run()
  
  // Upsert subscription
  const existing = await c.env.DB.prepare('SELECT id FROM subscriptions WHERE user_id = ?').bind(userId).first()
  if (existing) {
    await c.env.DB.prepare('UPDATE subscriptions SET plan = ?, status = ? WHERE user_id = ?').bind('pro', 'active', userId).run()
  } else {
    const { generateId } = await import('../lib/auth')
    await c.env.DB.prepare('INSERT INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, ?, ?)').bind(generateId(), userId, 'pro', 'active').run()
  }
  
  return c.json({ success: true, message: 'Plano atualizado para Pro! (Demo)', plan: 'pro' })
})

export default userRoutes
