import { Hono } from 'hono'
import { HonoEnv, PLAN_LIMITS } from '../types'
import { authMiddleware } from '../middleware/auth'
import { generateId, getMonthYear } from '../lib/auth'

const imageRoutes = new Hono<HonoEnv>()
imageRoutes.use('*', authMiddleware)

const IMAGE_TYPES = {
  post_social: 'Post para Social Media',
  banner: 'Banner Promocional',
  capa: 'Capa / Cover',
  criativo_anuncio: 'Criativo de Anúncio',
  thumbnail: 'Thumbnail / Miniatura',
  logo_concept: 'Conceito de Logo'
}

const STYLES = {
  minimalista: 'Minimalista e clean',
  moderno: 'Moderno e tecnológico',
  elegante: 'Elegante e premium',
  vibrante: 'Vibrante e colorido',
  corporativo: 'Corporativo e profissional',
  casual: 'Casual e descontraído'
}

// Get image types and styles
imageRoutes.get('/types', async (c) => {
  return c.json({ types: IMAGE_TYPES, styles: STYLES })
})

// List images
imageRoutes.get('/', async (c) => {
  const userId = c.get('userId')
  const { project_id } = c.req.query()
  
  let query = 'SELECT * FROM images WHERE user_id = ?'
  const params: any[] = [userId]
  
  if (project_id) { query += ' AND project_id = ?'; params.push(project_id) }
  query += ' ORDER BY created_at DESC LIMIT 50'
  
  const images = await c.env.DB.prepare(query).bind(...params).all()
  return c.json({ images: images.results })
})

// Generate image
imageRoutes.post('/generate', async (c) => {
  const userId = c.get('userId')
  const user = c.get('user') as any
  
  const limits = PLAN_LIMITS[user.plan || 'free']
  const monthYear = getMonthYear()
  const usageCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ? AND resource_type = ? AND month_year = ?'
  ).bind(userId, 'image', monthYear).first() as any
  
  if (usageCount.cnt >= limits.images) {
    return c.json({ error: `Limite de imagens atingido (${limits.images}/mês no plano ${user.plan})` }, 403)
  }
  
  const { prompt, image_type, style, format, colors, cta, project_id, title } = await c.req.json()
  
  if (!prompt || !image_type) {
    return c.json({ error: 'Prompt e tipo de imagem são obrigatórios' }, 400)
  }
  
  // Use Unsplash for demo images based on prompt keywords
  const imageUrl = getStockImage(prompt, image_type, style)
  const imageTitle = title || `${IMAGE_TYPES[image_type as keyof typeof IMAGE_TYPES] || image_type} - ${new Date().toLocaleDateString('pt-BR')}`
  
  const id = generateId()
  await c.env.DB.prepare(
    'INSERT INTO images (id, user_id, project_id, title, prompt, image_url, image_type, style, format, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, project_id || null, imageTitle, prompt, imageUrl, image_type, style || null, format || 'quadrado', 'completed').run()
  
  // Log usage
  await c.env.DB.prepare('INSERT INTO usage_logs (id, user_id, action_type, resource_type, resource_id, month_year) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(generateId(), userId, 'create', 'image', id, monthYear).run()
  
  const image = await c.env.DB.prepare('SELECT * FROM images WHERE id = ?').bind(id).first()
  return c.json({ image })
})

// Get image
imageRoutes.get('/:id', async (c) => {
  const userId = c.get('userId')
  const image = await c.env.DB.prepare('SELECT * FROM images WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).first()
  if (!image) return c.json({ error: 'Imagem não encontrada' }, 404)
  return c.json({ image })
})

// Update image
imageRoutes.put('/:id', async (c) => {
  const userId = c.get('userId')
  const { title, project_id } = await c.req.json()
  
  await c.env.DB.prepare('UPDATE images SET title = ?, project_id = ? WHERE id = ? AND user_id = ?')
    .bind(title, project_id || null, c.req.param('id'), userId).run()
  
  return c.json({ success: true })
})

// Delete image
imageRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId')
  await c.env.DB.prepare('DELETE FROM images WHERE id = ? AND user_id = ?').bind(c.req.param('id'), userId).run()
  return c.json({ success: true })
})

function getStockImage(prompt: string, imageType: string, style?: string): string {
  const lowerPrompt = prompt.toLowerCase()
  const seed = Math.abs(prompt.split('').reduce((a, b) => a + b.charCodeAt(0), 0))
  
  // Curated images based on context
  const imageCategories: Record<string, string[]> = {
    beleza: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1596704017256-9903d6aa3d59?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=800&fit=crop',
    ],
    tecnologia: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=800&fit=crop',
    ],
    comida: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&h=800&fit=crop',
    ],
    moda: [
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&h=800&fit=crop',
    ],
    negocio: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=800&fit=crop',
    ],
    saude: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=800&fit=crop',
    ],
    default: [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=800&fit=crop',
    ]
  }
  
  let category = 'default'
  if (lowerPrompt.includes('beleza') || lowerPrompt.includes('cosmet') || lowerPrompt.includes('maquiagem')) category = 'beleza'
  else if (lowerPrompt.includes('tech') || lowerPrompt.includes('digital') || lowerPrompt.includes('app')) category = 'tecnologia'
  else if (lowerPrompt.includes('comida') || lowerPrompt.includes('aliment') || lowerPrompt.includes('restau')) category = 'comida'
  else if (lowerPrompt.includes('moda') || lowerPrompt.includes('roupa') || lowerPrompt.includes('fashion')) category = 'moda'
  else if (lowerPrompt.includes('saúde') || lowerPrompt.includes('saude') || lowerPrompt.includes('clínica') || lowerPrompt.includes('clinica')) category = 'saude'
  else if (lowerPrompt.includes('negócio') || lowerPrompt.includes('empresa') || lowerPrompt.includes('corporat')) category = 'negocio'
  
  const images = imageCategories[category]
  return images[seed % images.length]
}

export default imageRoutes
