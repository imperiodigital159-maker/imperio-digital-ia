import { Hono } from 'hono'
import { HonoEnv } from '../types'
import { authMiddleware } from '../middleware/auth'
import { generateId } from '../lib/auth'

const settingsRoutes = new Hono<HonoEnv>()
settingsRoutes.use('*', authMiddleware)

// Get settings for current user
settingsRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB

  // Ensure settings table exists
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      openai_key TEXT,
      stripe_secret_key TEXT,
      stripe_pub_key TEXT,
      stripe_price_id TEXT,
      google_client_id TEXT,
      google_client_secret TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run()

  const settings = await db.prepare(
    'SELECT * FROM user_settings WHERE user_id = ?'
  ).bind(userId).first() as any

  // Mask keys for security
  const mask = (v: string | null) => v ? v.slice(0, 8) + '••••••••••••' : ''

  return c.json({
    settings: {
      openai_key: mask(settings?.openai_key),
      openai_configured: !!settings?.openai_key,
      stripe_secret_key: mask(settings?.stripe_secret_key),
      stripe_pub_key: settings?.stripe_pub_key || '',
      stripe_price_id: settings?.stripe_price_id || '',
      stripe_configured: !!settings?.stripe_secret_key,
      google_client_id: settings?.google_client_id || '',
      google_client_secret: mask(settings?.google_client_secret),
      google_configured: !!settings?.google_client_id,
    }
  })
})

// Save settings
settingsRoutes.post('/', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB
  const body = await c.req.json()

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      openai_key TEXT,
      stripe_secret_key TEXT,
      stripe_pub_key TEXT,
      stripe_price_id TEXT,
      google_client_id TEXT,
      google_client_secret TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run()

  const existing = await db.prepare('SELECT id FROM user_settings WHERE user_id = ?').bind(userId).first()

  if (existing) {
    // Only update fields that are provided and not masked
    const updates: string[] = []
    const values: any[] = []

    if (body.openai_key && !body.openai_key.includes('••')) {
      updates.push('openai_key = ?'); values.push(body.openai_key)
    }
    if (body.stripe_secret_key && !body.stripe_secret_key.includes('••')) {
      updates.push('stripe_secret_key = ?'); values.push(body.stripe_secret_key)
    }
    if (body.stripe_pub_key !== undefined) {
      updates.push('stripe_pub_key = ?'); values.push(body.stripe_pub_key)
    }
    if (body.stripe_price_id !== undefined) {
      updates.push('stripe_price_id = ?'); values.push(body.stripe_price_id)
    }
    if (body.google_client_id !== undefined) {
      updates.push('google_client_id = ?'); values.push(body.google_client_id)
    }
    if (body.google_client_secret && !body.google_client_secret.includes('••')) {
      updates.push('google_client_secret = ?'); values.push(body.google_client_secret)
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(userId)
      await db.prepare(`UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = ?`).bind(...values).run()
    }
  } else {
    const id = generateId()
    await db.prepare(`
      INSERT INTO user_settings (id, user_id, openai_key, stripe_secret_key, stripe_pub_key, stripe_price_id, google_client_id, google_client_secret)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, userId,
      body.openai_key || null,
      body.stripe_secret_key || null,
      body.stripe_pub_key || null,
      body.stripe_price_id || null,
      body.google_client_id || null,
      body.google_client_secret || null
    ).run()
  }

  return c.json({ success: true, message: 'Configurações salvas com sucesso!' })
})

// Get raw openai key (internal use only)
settingsRoutes.get('/openai-key', async (c) => {
  const userId = c.get('userId')
  const db = c.env.DB

  try {
    const settings = await db.prepare('SELECT openai_key FROM user_settings WHERE user_id = ?').bind(userId).first() as any
    return c.json({ key: settings?.openai_key || null })
  } catch {
    return c.json({ key: null })
  }
})

export default settingsRoutes
