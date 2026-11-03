import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface AuthResponse<T = unknown> {
  data: T | null
  error: AuthError | Error | null
}

export const VALID_APPLICATION_ROUTES = [
  'home',
  'dashboard',
  'builder',
  'resume',
  'portfolio',
  'publish',
  'portfolio-preview',
  'settings',
  'admin',
] as const

export type ValidApplicationRoute = (typeof VALID_APPLICATION_ROUTES)[number]

/**
 * Validates a redirect destination route, strictly mitigating open-redirect vulnerabilities.
 * Only permits known, safe internal application paths. Defaults to 'dashboard'.
 */
export function validateRedirectRoute(route: string | null | undefined): string {
  if (!route || typeof route !== 'string') return 'dashboard'
  const trimmed = route.trim()

  // Reject external protocol schemes, relative URL escapes, and script schemes
  if (
    trimmed.includes('://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('\\\\') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.includes('/') ||
    trimmed.includes('\\')
  ) {
    return 'dashboard'
  }

  const isKnown = VALID_APPLICATION_ROUTES.includes(trimmed as ValidApplicationRoute)
  if (!isKnown) return 'dashboard'

  // Post-auth destination defaults to 'dashboard' if pointing to public landing or auth page
  if (trimmed === 'home') return 'dashboard'

  return trimmed
}

/**
 * Returns the authoritative origin for authentication callbacks and redirects.
 * Prioritizes window.location.origin during browser runtime,
 * falling back to VITE_APP_URL or the production site https://www.prbuilder.xyz.
 */
export const getAuthRedirectBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return import.meta.env.VITE_APP_URL || 'https://www.prbuilder.xyz'
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

    const redirectUrl = `${getAuthRedirectBaseUrl()}/auth?type=signup`

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

    const baseUrl = getAuthRedirectBaseUrl()
    let safeRedirectUrl = `${baseUrl}/auth?type=recovery`

    if (redirectTo) {
      try {
        const parsed = new URL(redirectTo, baseUrl)
        if (parsed.origin === baseUrl) {
          safeRedirectUrl = parsed.toString()
        }
      } catch {
        // Fall back to standard recovery endpoint
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

    const redirectUrl = `${getAuthRedirectBaseUrl()}/auth?type=signup`

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
  async signInWithGoogle(options?: { targetRoute?: string }): Promise<{ error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
      }
    }

    const origin = getAuthRedirectBaseUrl()
    const targetRoute = validateRedirectRoute(options?.targetRoute)

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('prbuilder_auth_redirect', targetRoute)
      } catch {}
    }

    const redirectUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(targetRoute)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })
    return { error }
  },

  /**
   * Inspects current window URL to parse OAuth callback parameters,
   * detecting cancelled flows, provider errors, or established authorization codes.
   */
  parseOAuthCallback(): {
    isCallback: boolean
    hasError: boolean
    errorMessage: string | null
    targetRoute: string
  } {
    if (typeof window === 'undefined') {
      return { isCallback: false, hasError: false, errorMessage: null, targetRoute: 'dashboard' }
    }

    const pathname = window.location.pathname
    const search = window.location.search
    const hash = window.location.hash

    const searchParams = new URLSearchParams(search)
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''))

    const isCallbackPath = pathname === '/auth/callback' || pathname.startsWith('/auth/callback')
    const typeParam = searchParams.get('type') || hashParams.get('type')

    // If explicitly a recovery flow and not on the OAuth callback path, let recovery handler process it
    if (typeParam === 'recovery' && !isCallbackPath) {
      return { isCallback: false, hasError: false, errorMessage: null, targetRoute: 'dashboard' }
    }

    const hasOAuthParams =
      searchParams.has('code') ||
      searchParams.has('error') ||
      hashParams.has('access_token') ||
      hashParams.has('error')

    if (!isCallbackPath && !hasOAuthParams) {
      return { isCallback: false, hasError: false, errorMessage: null, targetRoute: 'dashboard' }
    }

    // Check for provider error (e.g. user cancelled or denied consent)
    const errorParam = searchParams.get('error') || hashParams.get('error')
    const errorCode = searchParams.get('error_code') || hashParams.get('error_code')
    const errorDesc =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('message') ||
      hashParams.get('message')

    let errorMessage: string | null = null
    if (errorParam) {
      if (errorCode === 'otp_expired' || errorDesc?.toLowerCase().includes('expired') || errorDesc?.toLowerCase().includes('invalid')) {
        errorMessage = 'This verification or password reset link has expired or has already been used. Please request a new one.'
      } else if (errorParam === 'access_denied') {
        errorMessage = 'Google sign-in was cancelled or access was denied.'
      } else {
        errorMessage = errorDesc || `Authentication error: ${errorParam}`
      }
    }

    // Determine target route with strict open-redirect sanitization
    let rawTarget = searchParams.get('redirect') || ''
    if (!rawTarget) {
      try {
        rawTarget = localStorage.getItem('prbuilder_auth_redirect') || 'dashboard'
      } catch {
        rawTarget = 'dashboard'
      }
    }
    const targetRoute = validateRedirectRoute(rawTarget)

    return {
      isCallback: true,
      hasError: Boolean(errorMessage),
      errorMessage,
      targetRoute,
    }
  },

  /**
   * Detailed URL inspector for authentication events, password recoveries,
   * signup confirmations, and expired links.
   */
  parseAuthUrl(): {
    isOAuthCallback: boolean
    isRecovery: boolean
    isSignupConfirmation: boolean
    isExpiredOtp: boolean
    hasError: boolean
    errorMessage: string | null
    errorCode: string | null
    targetRoute: string
  } {
    if (typeof window === 'undefined') {
      return {
        isOAuthCallback: false,
        isRecovery: false,
        isSignupConfirmation: false,
        isExpiredOtp: false,
        hasError: false,
        errorMessage: null,
        errorCode: null,
        targetRoute: 'dashboard',
      }
    }

    const pathname = window.location.pathname
    const search = window.location.search
    const hash = window.location.hash

    const searchParams = new URLSearchParams(search)
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''))

    const isCallbackPath = pathname === '/auth/callback' || pathname.startsWith('/auth/callback')
    const typeParam = searchParams.get('type') || hashParams.get('type')
    const errorCode = searchParams.get('error_code') || hashParams.get('error_code')
    const errorParam = searchParams.get('error') || hashParams.get('error')
    const errorDesc =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('message') ||
      hashParams.get('message')

    const isExpiredOtp = Boolean(
      errorCode === 'otp_expired' ||
      errorDesc?.toLowerCase().includes('expired') ||
      errorDesc?.toLowerCase().includes('invalid')
    )

    const isRecovery = typeParam === 'recovery' || hash.includes('type=recovery') || search.includes('type=recovery')
    const isSignupConfirmation = typeParam === 'signup' || hash.includes('type=signup') || search.includes('type=signup')
    const isOAuthCallback =
      isCallbackPath ||
      searchParams.has('code') ||
      (!isRecovery && !isSignupConfirmation && (hashParams.has('access_token') || errorParam === 'access_denied'))

    let errorMessage: string | null = null
    if (isExpiredOtp) {
      errorMessage = 'This verification or password reset link has expired or has already been used. Please request a new one.'
    } else if (errorParam === 'access_denied') {
      errorMessage = 'Google sign-in was cancelled or access was denied.'
    } else if (errorParam) {
      errorMessage = errorDesc || `Authentication error: ${errorParam}`
    }

    let rawTarget = searchParams.get('redirect') || ''
    if (!rawTarget) {
      try {
        rawTarget = localStorage.getItem('prbuilder_auth_redirect') || 'dashboard'
      } catch {
        rawTarget = 'dashboard'
      }
    }
    const targetRoute = validateRedirectRoute(rawTarget)

    return {
      isOAuthCallback,
      isRecovery,
      isSignupConfirmation,
      isExpiredOtp,
      hasError: Boolean(errorMessage),
      errorMessage,
      errorCode,
      targetRoute: targetRoute || 'dashboard',
    }
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
