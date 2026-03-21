import { Context } from 'hono'

export type Bindings = {
  DB: D1Database
  JWT_SECRET?: string
}

export type Variables = {
  userId?: string
  user?: User
}

export type HonoEnv = {
  Bindings: Bindings
  Variables: Variables
}

export type User = {
  id: string
  name: string
  email: string
  plan: string
  avatar?: string
  created_at: string
}

export type Project = {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  created_at: string
  updated_at: string
}

export type ChatSession = {
  id: string
  user_id: string
  project_id?: string
  title: string
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type Document = {
  id: string
  user_id: string
  project_id?: string
  title: string
  template_type: string
  content: string
  status: string
  created_at: string
  updated_at: string
}

export type Image = {
  id: string
  user_id: string
  project_id?: string
  title: string
  prompt: string
  image_url?: string
  image_type: string
  style?: string
  format?: string
  status: string
  created_at: string
}

export type LandingPage = {
  id: string
  user_id: string
  project_id?: string
  title: string
  business_name: string
  offer: string
  content: string
  status: string
  published_url?: string
  created_at: string
  updated_at: string
}

export type PlanLimits = {
  chat_messages: number
  documents: number
  images: number
  landing_pages: number
  projects: number
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    chat_messages: 30,
    documents: 5,
    images: 5,
    landing_pages: 2,
    projects: 3,
  },
  pro: {
    chat_messages: 500,
    documents: 100,
    images: 50,
    landing_pages: 20,
    projects: 50,
  }
}
