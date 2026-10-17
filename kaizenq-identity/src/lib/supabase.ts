import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types.ts'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

/**
 * Checks whether valid Supabase configuration is present in the environment.
 * Ensures the app gracefully falls back to local storage mode when unconfigured.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (
    supabaseUrl.includes('your-project-id') ||
    supabaseAnonKey.includes('your-supabase-anon-key') ||
    supabaseUrl === '' ||
    supabaseAnonKey === ''
  ) {
    return false
  }
  try {
    const parsed = new URL(supabaseUrl)
    return Boolean(parsed.protocol && parsed.host)
  } catch {
    return false
  }
}

// Fallback dummy URL and anon key to prevent createClient initialization errors in local-only dev
const effectiveUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co'
const effectiveKey = isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key'

export const supabase: SupabaseClient<Database> = createClient<Database>(
  effectiveUrl,
  effectiveKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'kaizenq_auth_token_v1',
    },
  },
)

/**
 * Returns the verified base public application URL.
 */
export function getBaseAppUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL
  if (envUrl && !envUrl.includes('example.com')) {
    return envUrl.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'http://localhost:5174'
}

/**
 * Generates public storage URL for avatars or project images
 */
export function getPublicStorageUrl(
  bucket: 'avatars' | 'project-images',
  path: string | null,
): string | null {
  if (!path || !isSupabaseConfigured()) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data?.publicUrl || null
}
