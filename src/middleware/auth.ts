import { Context, Next } from 'hono'
import { verifyToken } from '../lib/auth'
import { HonoEnv } from '../types'

export async function authMiddleware(c: Context<HonoEnv>, next: Next) {
  const authHeader = c.req.header('Authorization')
  const cookieToken = getCookieToken(c.req.header('Cookie') || '')
  
  const token = authHeader?.replace('Bearer ', '') || cookieToken

  if (!token) {
    return c.json({ error: 'Não autorizado' }, 401)
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return c.json({ error: 'Token inválido ou expirado' }, 401)
  }

  // Fetch user from DB
  const db = c.env.DB
  const user = await db.prepare('SELECT id, name, email, plan, avatar, created_at FROM users WHERE id = ?')
    .bind(payload.userId)
    .first()

  if (!user) {
    return c.json({ error: 'Usuário não encontrado' }, 401)
  }

  c.set('userId', payload.userId)
  c.set('user', user as any)

  await next()
}

function getCookieToken(cookieHeader: string): string | null {
  const match = cookieHeader.match(/auth_token=([^;]+)/)
  return match ? match[1] : null
}
