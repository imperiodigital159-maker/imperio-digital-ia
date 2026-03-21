import { Hono } from 'hono'
import { HonoEnv } from '../types'
import { authMiddleware } from '../middleware/auth'

const analyticsRoutes = new Hono<HonoEnv>()
analyticsRoutes.use('*', authMiddleware)

analyticsRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB

  // Last 6 months activity
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [
    totalDocs, totalImages, totalLPs, totalProjects, totalChats,
    monthlyUsage, recentActivity, topTemplates, chatActivity
  ] = await Promise.all([
    db.prepare('SELECT COUNT(*) as cnt FROM documents WHERE user_id = ?').bind(userId).first(),
    db.prepare('SELECT COUNT(*) as cnt FROM images WHERE user_id = ?').bind(userId).first(),
    db.prepare('SELECT COUNT(*) as cnt FROM landing_pages WHERE user_id = ?').bind(userId).first(),
    db.prepare('SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?').bind(userId).first(),
    db.prepare('SELECT COUNT(*) as cnt FROM chat_sessions WHERE user_id = ?').bind(userId).first(),
    // Monthly usage last 6 months
    db.prepare(`
      SELECT month_year, resource_type, COUNT(*) as cnt
      FROM usage_logs
      WHERE user_id = ?
      GROUP BY month_year, resource_type
      ORDER BY month_year DESC
      LIMIT 60
    `).bind(userId).all(),
    // Recent activity (last 10 actions)
    db.prepare(`
      SELECT action_type, resource_type, resource_id, created_at
      FROM usage_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(userId).all(),
    // Top document templates
    db.prepare(`
      SELECT template_type, COUNT(*) as cnt
      FROM documents
      WHERE user_id = ?
      GROUP BY template_type
      ORDER BY cnt DESC
      LIMIT 5
    `).bind(userId).all(),
    // Chat messages count
    db.prepare(`
      SELECT COUNT(*) as cnt FROM chat_messages
      WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = ?)
    `).bind(userId).first(),
  ])

  // Build monthly chart data (last 6 months)
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const usageByMonth: Record<string, Record<string, number>> = {}
  months.forEach(m => { usageByMonth[m] = { chat: 0, document: 0, image: 0, landing_page: 0 } })

  ;(monthlyUsage.results as any[]).forEach(row => {
    if (usageByMonth[row.month_year]) {
      usageByMonth[row.month_year][row.resource_type] = row.cnt
    }
  })

  const chartData = months.map(m => ({
    month: m,
    label: new Date(m + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    chat: usageByMonth[m]?.chat || 0,
    documents: usageByMonth[m]?.document || 0,
    images: usageByMonth[m]?.image || 0,
    landing_pages: usageByMonth[m]?.landing_page || 0,
    total: Object.values(usageByMonth[m] || {}).reduce((a, b) => a + b, 0)
  }))

  return c.json({
    totals: {
      documents: (totalDocs as any)?.cnt || 0,
      images: (totalImages as any)?.cnt || 0,
      landing_pages: (totalLPs as any)?.cnt || 0,
      projects: (totalProjects as any)?.cnt || 0,
      chat_sessions: (totalChats as any)?.cnt || 0,
      chat_messages: (chatActivity as any)?.cnt || 0,
    },
    chartData,
    recentActivity: recentActivity.results,
    topTemplates: topTemplates.results,
  })
})

export default analyticsRoutes
