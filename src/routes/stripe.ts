import { Hono } from 'hono'
import { HonoEnv } from '../types'
import { authMiddleware } from '../middleware/auth'
import { generateId } from '../lib/auth'

const stripeRoutes = new Hono<HonoEnv>()

// Public webhook (no auth)
stripeRoutes.post('/webhook', async (c) => {
  const body = await c.req.text()
  const sig = c.req.header('stripe-signature') || ''

  try {
    const event = JSON.parse(body)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.user_id
      if (userId) {
        await c.env.DB.prepare('UPDATE users SET plan = ? WHERE id = ?').bind('pro', userId).run()
        await c.env.DB.prepare(
          'INSERT OR REPLACE INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, ?, ?)'
        ).bind(generateId(), userId, 'pro', 'active').run()
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const userId = sub.metadata?.user_id
      if (userId) {
        await c.env.DB.prepare('UPDATE users SET plan = ? WHERE id = ?').bind('free', userId).run()
        await c.env.DB.prepare(
          'UPDATE subscriptions SET plan = ?, status = ? WHERE user_id = ?'
        ).bind('free', 'cancelled', userId).run()
      }
    }

    return c.json({ received: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 400)
  }
})

// Protected routes
stripeRoutes.use('/checkout', authMiddleware)
stripeRoutes.use('/portal', authMiddleware)

// Create checkout session
stripeRoutes.post('/checkout', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any

  try {
    const settings = await c.env.DB.prepare(
      'SELECT stripe_secret_key, stripe_price_id FROM user_settings WHERE user_id = ?'
    ).bind(userId).first() as any

    if (!settings?.stripe_secret_key) {
      // Demo mode — just upgrade
      await c.env.DB.prepare('UPDATE users SET plan = ? WHERE id = ?').bind('pro', userId).run()
      return c.json({
        demo: true,
        message: 'Plano Pro ativado (modo demo)! Configure o Stripe para pagamentos reais.',
        url: null
      })
    }

    const origin = c.req.header('origin') || 'http://localhost:3000'
    const priceId = settings.stripe_price_id || 'price_demo'

    const formData = new URLSearchParams()
    formData.append('mode', 'subscription')
    formData.append('line_items[0][price]', priceId)
    formData.append('line_items[0][quantity]', '1')
    formData.append('success_url', `${origin}/conta?success=1`)
    formData.append('cancel_url', `${origin}/conta?cancelled=1`)
    formData.append('customer_email', user.email)
    formData.append('metadata[user_id]', userId)
    formData.append('allow_promotion_codes', 'true')

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.stripe_secret_key}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const session = await response.json() as any
    if (!response.ok) throw new Error(session.error?.message || 'Erro ao criar sessão Stripe')

    return c.json({ url: session.url })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Create portal session
stripeRoutes.post('/portal', async (c) => {
  const userId = c.get('userId')

  try {
    const settings = await c.env.DB.prepare(
      'SELECT stripe_secret_key FROM user_settings WHERE user_id = ?'
    ).bind(userId).first() as any

    if (!settings?.stripe_secret_key) {
      return c.json({ error: 'Stripe não configurado' }, 400)
    }

    const sub = await c.env.DB.prepare(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = ?'
    ).bind(userId).first() as any

    if (!sub?.stripe_customer_id) {
      return c.json({ error: 'Sem assinatura ativa' }, 400)
    }

    const origin = c.req.header('origin') || 'http://localhost:3000'
    const formData = new URLSearchParams()
    formData.append('customer', sub.stripe_customer_id)
    formData.append('return_url', `${origin}/conta`)

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.stripe_secret_key}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const portal = await response.json() as any
    if (!response.ok) throw new Error(portal.error?.message)

    return c.json({ url: portal.url })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default stripeRoutes
