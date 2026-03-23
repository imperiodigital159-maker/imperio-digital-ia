import { Hono } from 'hono'
import { HonoEnv } from '../types'
import { hashPassword, verifyPassword, signToken, generateId } from '../lib/auth'

const authRoutes = new Hono<HonoEnv>()

// Register
authRoutes.post('/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json()

    if (!name || !email || !password) {
      return c.json({ error: 'Campos obrigatórios: nome, email e senha' }, 400)
    }

    if (password.length < 6) {
      return c.json({ error: 'Senha deve ter ao menos 6 caracteres' }, 400)
    }

    const db = c.env.DB

    // Check if user exists
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
    if (existing) {
      return c.json({ error: 'E-mail já cadastrado' }, 409)
    }

    const userId = generateId()
    const passwordHash = await hashPassword(password)

    await db.prepare(
      'INSERT INTO users (id, name, email, password_hash, plan) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, name, email, passwordHash, 'free').run()

    // Create free subscription
    const subId = generateId()
    await db.prepare(
      'INSERT INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, ?, ?)'
    ).bind(subId, userId, 'free', 'active').run()

    const token = await signToken({ userId, email })

    return c.json({
      success: true,
      token,
      user: { id: userId, name, email, plan: 'free' }
    })
  } catch (error: any) {
    console.error('Register error:', error)
    return c.json({ error: 'Erro ao criar conta' }, 500)
  }
})

// Login
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'E-mail e senha são obrigatórios' }, 400)
    }

    const db = c.env.DB
    const user = await db.prepare(
      'SELECT id, name, email, password_hash, plan FROM users WHERE email = ?'
    ).bind(email).first() as any

    if (!user) {
      return c.json({ error: 'Credenciais inválidas' }, 401)
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      // Also try bcrypt hash for demo data
      const bcryptValid = user.password_hash === '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi' && password === 'demo123'
      if (!bcryptValid) {
        return c.json({ error: 'Credenciais inválidas' }, 401)
      }
    }

    const token = await signToken({ userId: user.id, email: user.email })

    return c.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({ error: 'Erro ao fazer login' }, 500)
  }
})

// Get current user
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  const cookieToken = c.req.header('Cookie')?.match(/auth_token=([^;]+)/)?.[1]
  const token = authHeader?.replace('Bearer ', '') || cookieToken

  if (!token) return c.json({ error: 'Não autorizado' }, 401)

  const { verifyToken } = await import('../lib/auth')
  const payload = await verifyToken(token)
  if (!payload) return c.json({ error: 'Token inválido' }, 401)

  const user = await c.env.DB.prepare(
    'SELECT id, name, email, plan, avatar, created_at FROM users WHERE id = ?'
  ).bind(payload.userId).first()

  if (!user) return c.json({ error: 'Usuário não encontrado' }, 404)
  return c.json({ user })
})

// Forgot password — send reset link
authRoutes.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email) return c.json({ error: 'Email obrigatório' }, 400)

    const db = c.env.DB
    const user = await db.prepare('SELECT id, name FROM users WHERE email = ?').bind(email).first() as any

    // Always return success (don't reveal if email exists)
    if (!user) return c.json({ success: true, message: 'Se o email existir, você receberá as instruções.' })

    // Generate reset token (valid 1h)
    const resetToken = generateId() + generateId()
    const expiresAt = new Date(Date.now() + 3600000).toISOString()

    await db.prepare(
      'INSERT OR REPLACE INTO auth_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(generateId(), user.id, 'reset_' + resetToken, expiresAt).run()

    // In production: send email via Resend/SendGrid
    // For now: log the reset link
    console.log(`[RESET] Link para ${email}: /redefinir-senha?token=${resetToken}`)

    return c.json({ success: true, message: 'Se o email existir, você receberá as instruções.' })
  } catch (err: any) {
    return c.json({ error: 'Erro interno' }, 500)
  }
})

export default authRoutes
