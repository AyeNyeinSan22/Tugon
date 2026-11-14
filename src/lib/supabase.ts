import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

export type ReportRow = {
  id: string
  tracking_code: string
  problem: string
  address: string
  landmark: string
  description: string
  timing: string
  phone: string
  risk_questions: string[]
  status: 'new' | 'in_progress' | 'resolved'
  created_at: string
}
