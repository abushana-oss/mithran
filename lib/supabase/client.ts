/**
 * Supabase Client
 *
 * Initializes and exports the Supabase client for browser usage
 */

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only create client if credentials are provided
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseClient!

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseClient !== null
}
