import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Lock,
  User,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import { PRLogo } from '../../components/brand/PRLogo.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { authService } from '../../services/authService.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { ThreeDPreviewFrames } from './components/ThreeDPreviewFrames.tsx'
import { AuthCallbackView } from './components/AuthCallbackView.tsx'
import { useApp } from '../../app/providers/AppContext.ts'
import { useAuth } from '../../app/providers/AuthContext.tsx'

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  onSuccess?: () => void
}

interface AuthCardContentProps {
  mode: 'signin' | 'signup' | 'forgot' | 'recovery'
  setMode: (mode: 'signin' | 'signup' | 'forgot' | 'recovery') => void
  onSuccess?: () => void
  onClose?: () => void
  isModal?: boolean
}

export const AuthCardContent: React.FC<AuthCardContentProps> = ({
  mode,
  setMode,
  onSuccess,
  onClose,
  isModal: _isModal = true,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { targetRouteAfterAuth } = useApp()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isVerificationPending, setIsVerificationPending] = useState(false)
  const [isExpiredLink, setIsExpiredLink] = useState(false)

  const isConfigured = isSupabaseConfigured()

  // Detect recovery mode or expired links from URL hash/params or persistent session flag
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parsedAuth = authService.parseAuthUrl()
      const isRecoverySession = sessionStorage.getItem('prbuilder_auth_mode') === 'recovery'
      if (parsedAuth.isExpiredOtp) {
        setIsExpiredLink(true)
        setErrorMsg('This verification or password reset link has expired or has already been used. Please request a new one below.')
      } else if (parsedAuth.isRecovery || isRecoverySession) {
        setMode('recovery')
      } else if (parsedAuth.isSignupConfirmation) {
        setSuccessMsg('Your email has been confirmed successfully! You can now sign in to your workspace.')
        setMode('signin')
      }
    }
  }, [setMode])

  // Calculate Password Strength for profile creation and recovery
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' }
    let score = 0
    if (password.length >= 6) score += 1
    if (password.length >= 8) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[A-Z]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1

    if (score <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' }
    if (score === 2) return { score: 50, label: 'Fair', color: 'bg-amber-500' }
    if (score === 3) return { score: 75, label: 'Good', color: 'bg-blue-500' }
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' }
  }, [password])

  const handleContinueLocal = () => {
    onSuccess?.()
    onClose?.()
  }

  const handleResendVerification = async () => {
    if (!email) {
      setErrorMsg('Please provide your email to resend verification.')
      return
    }
    setLoading(true)
    setErrorMsg(null)
    try {
      const { error } = await authService.resendVerificationEmail(email)
      if (error) throw error
      setSuccessMsg('A new verification email has been sent. Please check your inbox.')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to resend verification email.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setErrorMsg(null)
    setGoogleLoading(true)
    try {
      const target = targetRouteAfterAuth || 'dashboard'
      const { error } = await authService.signInWithGoogle({ targetRoute: target })
      if (error) throw error
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Google sign-in is not configured on this Supabase project.',
      )
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || googleLoading) return

    setErrorMsg(null)
    setSuccessMsg(null)
    setIsExpiredLink(false)

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (mode !== 'recovery') {
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setErrorMsg('Please enter a valid email address (e.g. name@university.edu).')
        return
      }
    }

    // Handle local offline mode
    if (!isConfigured) {
      setSuccessMsg('Local sandbox session activated.')
      setTimeout(() => {
        onSuccess?.()
        onClose?.()
      }, 800)
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your full name or display identity.')
          setLoading(false)
          return
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match. Please verify your password.')
          setLoading(false)
          return
        }

        const { data, error } = await authService.signUp(email.trim(), password, displayName.trim())
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }

        if (data?.session) {
          setSuccessMsg('Student identity account created successfully!')
          setTimeout(() => {
            onSuccess?.()
            onClose?.()
          }, 1000)
        } else {
          setIsVerificationPending(true)
          setSuccessMsg('Account created! Please check your email for the confirmation link.')
        }
      } else if (mode === 'signin') {
        if (!password) {
          setErrorMsg('Please enter your account password.')
          setLoading(false)
          return
        }

        const { error } = await authService.signIn(email.trim(), password)
        if (error) {
          if (
            error.message.toLowerCase().includes('not confirmed') ||
            error.message.toLowerCase().includes('email not confirmed')
          ) {
            setIsVerificationPending(true)
            setErrorMsg('Your email address has not been verified yet. Check your inbox or click below to resend confirmation.')
          } else if (
            error.message.toLowerCase().includes('invalid login credentials') ||
            error.message.toLowerCase().includes('invalid credentials')
          ) {
            setErrorMsg('Invalid email or password. Please verify your credentials and try again.')
          } else {
            setErrorMsg(error.message)
          }
          setLoading(false)
          return
        }

        const isAdminEmail =
          email.trim().toLowerCase() === 'admin@gmail.com' ||
          email.trim().toLowerCase() === 'bhanuprakashachari5092@gmail.com'

        setSuccessMsg(
          isAdminEmail
            ? 'Signed in as Administrator! Routing to Admin Console...'
            : 'Signed in successfully!',
        )
        setTimeout(() => {
          onSuccess?.()
          onClose?.()
        }, 800)
      } else if (mode === 'forgot') {
        const { error } = await authService.resetPassword(email.trim())
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }
        setSuccessMsg('Password reset link sent! Check your inbox.')
      } else if (mode === 'recovery') {
        if (password.length < 6) {
          setErrorMsg('New password must be at least 6 characters long.')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match. Please verify your password.')
          setLoading(false)
          return
        }

        const { error } = await authService.updatePassword(password)
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }

        try {
          sessionStorage.removeItem('prbuilder_auth_mode')
        } catch {
          // ignore
        }

        setSuccessMsg('Password updated successfully! Routing to your workspace...')
        setTimeout(() => {
          onSuccess?.()
          onClose?.()
        }, 900)
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected authentication error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
      {/* LEFT COLUMN: 3D Perspective Browser Iframes & Live Mockups (Visible on Desktop) */}
      <div className="hidden lg:block lg:col-span-6 p-6 xl:p-8 bg-gradient-to-b from-slate-950 to-slate-900 border-r border-slate-800/80">
        <ThreeDPreviewFrames />
      </div>

      {/* RIGHT COLUMN: Full Animated Login / Profile Creation Card */}
      <div className="col-span-1 lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between">
        <div>
          {/* Brand Header */}
          <div className="text-center sm:text-left mb-6">
            <div className="flex items-center justify-between mb-3">
              <PRLogo size="md" />
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Identity &amp; Auth
              </span>
            </div>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null)
                  setSuccessMsg(null)
                  setMode('signin')
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-3 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            )}

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {mode === 'signup'
                ? 'Create Your Student Identity'
                : mode === 'signin'
                ? 'Welcome Back, Builder'
                : mode === 'recovery'
                ? 'Set New Account Password'
                : 'Reset Account Password'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {mode === 'signup'
                ? 'Build an ATS-optimized resume, interactive portfolio, and personal domain.'
                : mode === 'signin'
                ? 'Sign in to access your cloud workspace, personal domain, and telemetry.'
                : mode === 'recovery'
                ? `Choose a strong new password for ${user?.email || 'your PR Builder account'}.`
                : 'Enter your account email to receive secure recovery instructions.'}
            </p>
          </div>

          {/* Animated Tab Switcher between Sign In & Sign Up */}
          {mode !== 'forgot' && mode !== 'recovery' && (
            <div className="relative p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700 flex mb-5">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null)
                  setMode('signin')
                }}
                className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-colors duration-200 z-10 ${
                  mode === 'signin'
                    ? 'text-blue-600 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {mode === 'signin' && (
                  <motion.div
                    layoutId="activeAuthTab"
                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null)
                  setMode('signup')
                }}
                className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-colors duration-200 z-10 ${
                  mode === 'signup'
                    ? 'text-blue-600 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {mode === 'signup' && (
                  <motion.div
                    layoutId="activeAuthTab"
                    className="absolute inset-0 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">Create Profile</span>
              </button>
            </div>
          )}

          {/* Google OAuth Quick Button (Sign In & Sign Up only) */}
          {(mode === 'signin' || mode === 'signup') && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                aria-label="Continue with Google"
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {googleLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  or with email
                </span>
              </div>
            </div>
          )}

          {/* Sandbox notice when Supabase is offline */}
          {!isConfigured && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                <Info className="w-4 h-4 shrink-0" />
                <span>Local Sandbox Mode Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Cloud database is unconfigured. All portfolio and ATS resume builders work offline with instant local storage.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleContinueLocal}
                className="w-full text-xs"
              >
                Continue in Sandbox
              </Button>
            </div>
          )}

          {/* Error Alert */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="leading-relaxed font-medium">{errorMsg}</div>
                </div>

                {/* Instant Recovery Actions for Expired Links */}
                {isExpiredLink && (
                  <div className="pt-1 flex flex-wrap gap-2 border-t border-rose-200/60 dark:border-rose-900/60">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null)
                        setIsExpiredLink(false)
                        setMode('forgot')
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 text-rose-800 dark:text-rose-200 font-semibold text-[11px] transition cursor-pointer"
                    >
                      Request Password Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null)
                        setIsExpiredLink(false)
                        handleResendVerification()
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 font-semibold text-[11px] transition cursor-pointer"
                    >
                      Resend Verification Email
                    </button>
                  </div>
                )}

                {/* Action to Resend Verification Email when unconfirmed in Sign In */}
                {isVerificationPending && mode === 'signin' && !isExpiredLink && (
                  <div className="pt-1 border-t border-rose-200/60 dark:border-rose-900/60">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                      <span>Resend Verification Email</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message Banner */}
          {successMsg ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-md">
                <Check className="w-6 h-6" />
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{successMsg}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'forgot'
                  ? 'Follow the instructions in the email to set a new password.'
                  : mode === 'signup' && isVerificationPending
                  ? 'Did not receive the email? Check spam or click resend below.'
                  : 'Routing to your student workspace...'}
              </p>

              {isVerificationPending && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    isLoading={loading}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    className="text-xs mx-auto"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              )}

              {mode === 'forgot' && (
                <div className="space-y-3 pt-2 text-center max-w-sm mx-auto">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed text-left">
                    <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Didn't see the email?</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                      <li>Check your <strong>Spam</strong> or <strong>Promotions</strong> folder.</li>
                      <li>Allow 1-2 minutes for email dispatch.</li>
                      <li>Make sure the email address is spelled correctly.</li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSuccessMsg(null)
                      setMode('signin')
                    }}
                    className="text-xs"
                  >
                    Return to Sign In
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            /* Animated Interactive Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name / Display Name when creating profile */}
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name / Display Identity
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alexander Vance"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email Address (Hidden in Recovery mode) */}
              {mode !== 'recovery' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@university.edu"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Password Field (Hidden in Forgot Password mode) */}
              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {mode === 'recovery' ? 'New Password' : 'Password'}
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null)
                          setMode('forgot')
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'recovery' ? 'Enter new password (min 6 characters)' : 'Enter password (min 6 characters)'}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors focus:outline-none"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator (Signup & Recovery) */}
                  {(mode === 'signup' || mode === 'recovery') && password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>Password Strength:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${passwordStrength.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${passwordStrength.score}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password (Signup & Recovery) */}
              {(mode === 'signup' || mode === 'recovery') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Confirm {mode === 'recovery' ? 'New Password' : 'Password'}
                    </label>
                    {confirmPassword.length > 0 && (
                      <span
                        className={`text-[10px] font-semibold flex items-center gap-1 ${
                          password === confirmPassword ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {password === confirmPassword ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Passwords match
                          </>
                        ) : (
                          'Passwords do not match'
                        )}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors focus:outline-none"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Primary Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="py-2.5 font-semibold text-sm shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {mode === 'signup'
                    ? 'Create Student Identity'
                    : mode === 'signin'
                    ? 'Sign In to Workspace'
                    : mode === 'recovery'
                    ? 'Update Password & Enter Workspace'
                    : 'Send Password Reset Link'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Card Footer: Mode Switcher */}
        <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-center">
          <div className="text-xs text-slate-500">
            {mode === 'recovery' ? (
              <span>
                Want to cancel password reset?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null)
                    setSuccessMsg(null)
                    try {
                      sessionStorage.removeItem('prbuilder_auth_mode')
                    } catch {
                      // ignore
                    }
                    setMode('signin')
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                >
                  Back to Sign In
                </button>
              </span>
            ) : mode === 'forgot' ? (
              <span>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null)
                    setSuccessMsg(null)
                    setMode('signin')
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                >
                  Back to Sign In
                </button>
              </span>
            ) : mode === 'signup' ? (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null)
                    setMode('signin')
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to PR Builder?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null)
                    setMode('signup')
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                >
                  Create Account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'recovery'>(() => {
    if (typeof window !== 'undefined') {
      const parsed = authService.parseAuthUrl()
      const isRecoverySession = sessionStorage.getItem('prbuilder_auth_mode') === 'recovery'
      if (parsed.isRecovery || isRecoverySession) {
        return 'recovery'
      }
    }
    return initialMode
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xl overflow-y-auto">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
        className="w-full max-w-5xl rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-2xl relative overflow-hidden my-auto"
      >
        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <AuthCardContent
          mode={mode}
          setMode={setMode}
          onSuccess={onSuccess}
          onClose={onClose}
          isModal={true}
        />
      </motion.div>
    </div>
  )
}

export const AuthPage: React.FC<{
  initialMode?: 'signin' | 'signup'
  onSuccess?: (targetRoute?: string) => void
  onBackHome?: () => void
}> = ({ initialMode = 'signin', onSuccess, onBackHome }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'recovery'>(() => {
    if (typeof window !== 'undefined') {
      const parsed = authService.parseAuthUrl()
      const isRecoverySession = sessionStorage.getItem('prbuilder_auth_mode') === 'recovery'
      if (parsed.isRecovery || isRecoverySession) {
        return 'recovery'
      }
      if (parsed.isExpiredOtp) {
        return 'forgot'
      }
    }
    return initialMode
  })
  const { setCurrentRoute, targetRouteAfterAuth, setTargetRouteAfterAuth } = useApp()
  const { user, isLoading } = useAuth()

  const isOAuthCallback = typeof window !== 'undefined' && authService.parseOAuthCallback().isCallback

  // Ensure recovery mode stays active if URL or persistent session flag indicates it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const parsed = authService.parseAuthUrl()
      const isRecoverySession = sessionStorage.getItem('prbuilder_auth_mode') === 'recovery'
      if (parsed.isRecovery || isRecoverySession) {
        setMode('recovery')
      }
    }
  }, [])

  // If user is already authenticated and not in password recovery, redirect to destination
  useEffect(() => {
    const isRecoveryMode =
      mode === 'recovery' ||
      (typeof window !== 'undefined' && (
        authService.parseAuthUrl().isRecovery ||
        sessionStorage.getItem('prbuilder_auth_mode') === 'recovery'
      ))

    if (!isLoading && user && !isOAuthCallback && !isRecoveryMode) {
      const dest = targetRouteAfterAuth || 'dashboard'
      setTargetRouteAfterAuth(null)
      setCurrentRoute(dest)
    }
  }, [user, isLoading, isOAuthCallback, mode, targetRouteAfterAuth, setTargetRouteAfterAuth, setCurrentRoute])

  const handleSuccess = (targetRoute?: string) => {
    const destination = targetRoute || targetRouteAfterAuth || 'dashboard'
    if (onSuccess) {
      onSuccess(destination)
    } else {
      setCurrentRoute(destination)
    }
  }

  const handleBack = () => {
    if (onBackHome) {
      onBackHome()
    } else {
      setCurrentRoute('home')
    }
  }

  if (isOAuthCallback) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <AuthCallbackView
            onSuccess={handleSuccess}
            onCancel={() => {
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, document.title, '/auth')
              }
              setMode('signin')
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Platform
          </button>
        </div>

        <div className="rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-2xl backdrop-blur-2xl overflow-hidden">
          <AuthCardContent
            mode={mode}
            setMode={setMode}
            onSuccess={handleSuccess}
            onClose={handleSuccess}
            isModal={false}
          />
        </div>
      </div>
    </div>
  )
}

export default AuthModal
