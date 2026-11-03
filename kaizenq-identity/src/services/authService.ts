import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthResponse<T = unknown> {
  data: T | null
  error: AuthError | Error | null
}

export const authService = {
  /**
   * Register a new student account using email and password.
   */
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResponse<{ user: User | null; session: Session | null }>> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
      }
    }

    const redirectUrl =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : (import.meta.env.VITE_APP_URL || 'https://prbuilder.xyz')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    })

    return { data, error }
  },

  /**
   * Authenticate student with email and password.
   */
  async signIn(email: string, password: string): Promise<AuthResponse<{ user: User; session: Session }>> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data: data.session ? { user: data.user, session: data.session } : null, error }
  },

  /**
   * Sign out current student session.
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    if (!isSupabaseConfigured()) {
      return { error: null }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  /**
   * Request password reset email.
   */
  async resetPassword(email: string, redirectTo?: string): Promise<{ error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase is not configured. Password reset is not available in local mode.'),
      }
    }

    // Security: Restrict redirectTo to trusted same-origin URL to prevent open redirect
    let safeRedirectUrl: string | undefined = undefined
    if (typeof window !== 'undefined' && window.location?.origin) {
      if (redirectTo) {
        try {
          const parsed = new URL(redirectTo, window.location.origin)
          safeRedirectUrl = parsed.origin === window.location.origin
            ? parsed.toString()
            : `${window.location.origin}/?route=settings`
        } catch {
          safeRedirectUrl = `${window.location.origin}/?route=settings`
        }
      } else {
        safeRedirectUrl = `${window.location.origin}/?route=settings`
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: safeRedirectUrl,
    })
    return { error }
  },

  /**
   * Update current user's password (used during password recovery or in account settings).
   */
  async updatePassword(password: string): Promise<AuthResponse<{ user: User | null }>> {
    if (!isSupabaseConfigured()) {
      return {
        data: null,
        error: new Error('Supabase is not configured.'),
      }
    }

    const { data, error } = await supabase.auth.updateUser({ password })
    return { data: data.user ? { user: data.user } : null, error }
  },

  /**
   * Resend signup verification confirmation email.
   */
  async resendVerificationEmail(email: string): Promise<{ error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase is not configured.'),
      }
    }

    const redirectUrl =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : (import.meta.env.VITE_APP_URL || 'https://prbuilder.xyz')

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })
    return { error }
  },

  /**
   * Authenticate student with Google OAuth if configured in Supabase.
   */
  async signInWithGoogle(): Promise<{ error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase is not configured.'),
      }
    }

    const redirectUrl =
      typeof window !== 'undefined' && window.location.origin
        ? `${window.location.origin}/?route=dashboard`
        : (import.meta.env.VITE_APP_URL || 'https://prbuilder.xyz')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })
    return { error }
  },

  /**
   * Fetch current active session.
   */
  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    if (!isSupabaseConfigured()) {
      return { session: null, error: null }
    }
    const { data, error } = await supabase.auth.getSession()
    return { session: data.session, error }
  },

  /**
   * Fetch current user details.
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return null
    }
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  /**
   * Subscribe to auth state transitions.
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured()) {
      return { unsubscribe: () => {} }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
    return subscription
  },
}
