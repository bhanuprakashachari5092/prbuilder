import React, { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AlertCircle, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react'
import { authService } from '../../../services/authService.ts'
import { profileService } from '../../../services/profileService.ts'
import { useAuth } from '../../../app/providers/AuthContext.tsx'
import { useApp } from '../../../app/providers/AppContext.ts'
import { sanitizeRoute } from '../../../app/providers/AppProviders.tsx'
import { supabase } from '../../../lib/supabase.ts'

export interface AuthCallbackViewProps {
  onSuccess?: (targetRoute: string) => void
  onCancel?: () => void
}

export const AuthCallbackView: React.FC<AuthCallbackViewProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { refreshProfile } = useAuth()
  const { setCurrentRoute } = useApp()

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [destination, setDestination] = useState<string>('dashboard')

  useEffect(() => {
    let isMounted = true

    const processOAuthCallback = async () => {
      const parsed = authService.parseOAuthCallback()
      const target = sanitizeRoute(parsed.targetRoute || 'dashboard')
      setDestination(target)

      // Handle provider cancellation or error
      if (parsed.hasError) {
        if (!isMounted) return
        setStatus('error')
        setErrorMessage(
          parsed.errorMessage || 'Google sign-in was cancelled or encountered an error.',
        )
        try {
          localStorage.removeItem('prbuilder_auth_redirect')
        } catch {}
        return
      }

      try {
        // 1. Fetch active session established by Supabase's URL fragment listener
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        let activeSession = data.session

        // If not immediately ready, wait up to 2.5 seconds for Supabase onAuthStateChange
        if (!activeSession) {
          const sessionPromise = new Promise<Session | null>((resolve) => {
            const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
              if (session) {
                sub.subscription.unsubscribe()
                resolve(session)
              }
            })
            setTimeout(() => {
              sub.subscription.unsubscribe()
              resolve(null)
            }, 3000)
          })

          activeSession = await sessionPromise
        }

        if (!activeSession?.user) {
          throw new Error(
            'Authentication session could not be established. Please try signing in again.',
          )
        }

        // 2. Synchronize user profile with Google metadata without overwriting user-edited fields
        await profileService.syncProfileWithAuthUser(activeSession.user)
        await refreshProfile()

        // 3. Clear temporary storage
        try {
          localStorage.removeItem('prbuilder_auth_redirect')
        } catch {}

        // 4. Clean sensitive OAuth parameters from browser address bar
        if (typeof window !== 'undefined') {
          const cleanUrl = window.location.pathname.replace(/\/callback\/?$/, '') || '/'
          window.history.replaceState({}, document.title, cleanUrl)
        }

        if (!isMounted) return
        setStatus('success')

        // 5. Navigate to intended destination
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(target)
          } else {
            setCurrentRoute(target)
          }
        }, 600)
      } catch (err: unknown) {
        if (!isMounted) return
        setStatus('error')
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred while verifying your Google session.',
        )
      }
    }

    processOAuthCallback()

    return () => {
      isMounted = false
    }
  }, [onSuccess, refreshProfile, setCurrentRoute])

  const handleRetryGoogle = async () => {
    setStatus('verifying')
    setErrorMessage(null)
    const { error } = await authService.signInWithGoogle({ targetRoute: destination })
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
    }
  }

  const handleReturnToSignIn = () => {
    if (onCancel) {
      onCancel()
    } else {
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/auth')
      }
      setCurrentRoute('auth')
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
      {status === 'verifying' && (
        <div className="space-y-4 py-6">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            {/* Google Logo */}
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 p-2 shadow-md flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <RefreshCw className="w-16 h-16 text-blue-600 animate-spin absolute inset-0 opacity-40" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Signing in with Google
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Verifying your Google session and synchronizing student profile...
            </p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 py-6 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Authentication Verified
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Welcome back! Redirecting you to your workspace...
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-5 animate-fade-in text-left">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="text-xs">
              <strong className="block font-semibold mb-0.5">Google Authentication Incomplete</strong>
              <span>{errorMessage}</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleRetryGoogle}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Continue with Google Again
            </button>
            <button
              type="button"
              onClick={handleReturnToSignIn}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Sign In with Email &amp; Password
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
