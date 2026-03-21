import { Hono } from 'hono'
import { HonoEnv } from '../types'
import { generateId, signToken } from '../lib/auth'

const oauthRoutes = new Hono<HonoEnv>()

// Redirect to Google OAuth
oauthRoutes.get('/google', async (c) => {
  try {
    // Get google config from any admin user settings
    const settings = await c.env.DB.prepare(
      'SELECT google_client_id FROM user_settings WHERE google_client_id IS NOT NULL LIMIT 1'
    ).first() as any

    if (!settings?.google_client_id) {
      return c.redirect('/#google-not-configured')
    }

    const origin = c.req.header('origin') || new URL(c.req.url).origin
    const redirectUri = `${origin}/api/oauth/google/callback`

    const params = new URLSearchParams({
      client_id: settings.google_client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    })

    return c.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  } catch (err: any) {
    return c.redirect('/login?error=oauth_config')
  }
})

// Google OAuth callback
oauthRoutes.get('/google/callback', async (c) => {
  const code = c.req.query('code')
  const error = c.req.query('error')

  if (error || !code) {
    return c.redirect('/login?error=oauth_denied')
  }

  try {
    const settings = await c.env.DB.prepare(
      'SELECT google_client_id, google_client_secret FROM user_settings WHERE google_client_id IS NOT NULL LIMIT 1'
    ).first() as any

    if (!settings) return c.redirect('/login?error=oauth_config')

    const origin = new URL(c.req.url).origin
    const redirectUri = `${origin}/api/oauth/google/callback`

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: settings.google_client_id,
        client_secret: settings.google_client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    const tokens = await tokenRes.json() as any
    if (!tokenRes.ok) return c.redirect('/login?error=oauth_token')

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    const googleUser = await userRes.json() as any

    if (!googleUser.email) return c.redirect('/login?error=oauth_userinfo')

    // Find or create user
    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(googleUser.email).first() as any

    if (!user) {
      const userId = generateId()
      await c.env.DB.prepare(
        'INSERT INTO users (id, name, email, password_hash, plan, avatar) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userId, googleUser.name, googleUser.email, 'google-oauth', 'free', googleUser.picture || null).run()

      await c.env.DB.prepare(
        'INSERT INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, ?, ?)'
      ).bind(generateId(), userId, 'free', 'active').run()

      user = { id: userId, name: googleUser.name, email: googleUser.email, plan: 'free' }
    } else {
      // Update avatar if from google
      if (googleUser.picture) {
        await c.env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(googleUser.picture, user.id).run()
      }
    }

    const token = await signToken({ userId: user.id, email: user.email })

    // Redirect with token in URL fragment (client-side picks it up)
    return c.redirect(`/dashboard#oauth_token=${token}&user_name=${encodeURIComponent(user.name)}&user_plan=${user.plan}`)
  } catch (err: any) {
    console.error('OAuth error:', err)
    return c.redirect('/login?error=oauth_failed')
  }
})

export default oauthRoutes
