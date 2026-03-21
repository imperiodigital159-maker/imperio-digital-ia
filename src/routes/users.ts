import { Hono } from 'hono'
import { HonoEnv, PLAN_LIMITS } from '../types'
import { authMiddleware } from '../middleware/auth'
import { getMonthYear } from '../lib/auth'

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

// Update user profile
userRoutes.put('/profile', async (c) => {
  const userId = c.get('userId')
  const { name, avatar } = await c.req.json()
  
  await c.env.DB.prepare('UPDATE users SET name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(name, avatar || null, userId).run()
  
  return c.json({ success: true })
})

// Upgrade plan (mock)
userRoutes.post('/upgrade', async (c) => {
  const userId = c.get('userId')
  
  // In production, this would integrate with Stripe/payment gateway
  await c.env.DB.prepare('UPDATE users SET plan = ? WHERE id = ?').bind('pro', userId).run()
  await c.env.DB.prepare('UPDATE subscriptions SET plan = ? WHERE user_id = ?').bind('pro', userId).run()
  
  return c.json({ success: true, message: 'Plano atualizado para Pro! (Demo)' })
})

export default userRoutes
