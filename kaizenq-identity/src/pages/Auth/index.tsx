import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Mail,
  ArrowRight,
  X,
  Sparkles,
  Check,
  Lock,
  User,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { PRLogo } from '../../components/brand/PRLogo.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { authService } from '../../services/authService.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { ThreeDPreviewFrames } from './components/ThreeDPreviewFrames.tsx'

export interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
  onSuccess?: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onSuccess,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isConfigured = isSupabaseConfigured()

  // Calculate Password Strength for profile creation
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

  // Quick Demo Account Auto-Fill for Testing
  const handleFillDemo = (type: 'student' | 'admin') => {
    if (type === 'student') {
      setEmail('student.demo@university.edu')
      setPassword('StudentPass123!')
      setDisplayName('Kavya Sharma')
      setMode('signin')
    } else {
      setEmail('admin@gmail.com')
      setPassword('AdminMaster2026!')
      setDisplayName('Platform Administrator')
      setMode('signin')
    }
    setErrorMsg(null)
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    // Handle local offline mode
    if (!isConfigured) {
      setSuccessMsg('Local sandbox session activated.')
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 800)
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.')
          setLoading(false)
          return
        }
        if (confirmPassword && password !== confirmPassword) {
          setErrorMsg('Passwords do not match. Please verify.')
          setLoading(false)
          return
        }

        const { data, error } = await authService.signUp(email, password, displayName)
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }

        if (data?.session) {
          setSuccessMsg('Student identity account created successfully!')
          setTimeout(() => {
            onSuccess?.()
            onClose()
          }, 1000)
        } else {
          setSuccessMsg('Account created! Please check your email for the confirmation link.')
        }
      } else if (mode === 'signin') {
        const { error } = await authService.signIn(email, password)
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }

        const isAdminEmail =
          email.trim().toLowerCase() === 'admin@gmail.com' ||
          email.trim().toLowerCase() === 'bhanuprakashachari5092@gmail.com'

        setSuccessMsg(
          isAdminEmail
            ? 'Signed in as Administrator! Routing to Admin Console...'
            : 'Signed in successfully!'
        )
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 800)
      } else if (mode === 'forgot') {
        const { error } = await authService.resetPassword(email)
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }
        setSuccessMsg('Password reset link sent! Check your inbox.')
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueLocal = () => {
    onSuccess?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xl overflow-y-auto">
      {/* Background Animated Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
        className="w-full max-w-5xl rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 shadow-[0_25px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl relative overflow-hidden my-auto"
      >
        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Two-Column Grid: 3D Animated Showcase Left & Animated Login Card Right */}
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
                    <ShieldCheck className="w-3.5 h-3.5" /> Identity v2.6
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {mode === 'signup'
                    ? 'Create Your Student Identity'
                    : mode === 'signin'
                    ? 'Welcome Back, Builder'
                    : 'Reset Account Password'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {mode === 'signup'
                    ? 'Build a high-impact portfolio, ATS resume, and custom domain.'
                    : mode === 'signin'
                    ? 'Sign in to access your cloud identity, custom domain, and analytics.'
                    : 'Enter your university email to receive recovery instructions.'}
                </p>
              </div>

              {/* Animated Tab Switcher between Sign In & Sign Up */}
              {mode !== 'forgot' && (
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
                    className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <div className="leading-relaxed font-medium">{errorMsg}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message Banner */}
              {successMsg ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-8 text-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                    <Check className="w-7 h-7" />
                  </div>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{successMsg}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mode === 'forgot'
                      ? 'You may return to sign in or close this window.'
                      : 'Connecting you to your live student workspace...'}
                  </p>
                  {mode === 'forgot' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSuccessMsg(null)
                        setMode('signin')
                      }}
                      className="text-xs mt-3"
                    >
                      Return to Sign In
                    </Button>
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
                        Full Name / Profile Identity
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

                  {/* Student / University Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Student / University Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@university.edu"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password with Eye / EyeOff Visibility Option */}
                  {mode !== 'forgot' && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Password
                        </label>
                        {mode === 'signin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setErrorMsg(null)
                              setMode('forgot')
                            }}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        {/* Eye / EyeOff Toggle Button */}
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

                      {/* Password Strength Visual Meter (During Profile Creation) */}
                      {mode === 'signup' && password.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500">Password Strength:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
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

                  {/* Confirm Password with Visibility Toggle (During Profile Creation) */}
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Confirm Password
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

                  {/* Primary Animated Submit Button */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      size="md"
                      isLoading={loading}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      className="py-3 shadow-lg shadow-blue-500/20 font-bold"
                    >
                      {mode === 'signup'
                        ? 'Create Student Identity'
                        : mode === 'signin'
                        ? 'Sign In to Workspace'
                        : 'Send Recovery Link'}
                    </Button>
                  </motion.div>
                </form>
              )}
            </div>

            {/* Quick Demo Credentials for Rapid Testing */}
            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Test Credentials:</span>
                <button
                  type="button"
                  onClick={() => handleFillDemo('student')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold transition-colors"
                >
                  Student Demo
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => handleFillDemo('admin')}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold transition-colors"
                >
                  Admin Console
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="text-xs text-slate-500">
                {mode === 'signup' ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        setErrorMsg(null)
                        setMode('signin')
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      Sign In
                    </button>
                  </span>
                ) : (
                  <span>
                    New to PR Builder?{' '}
                    <button
                      onClick={() => {
                        setErrorMsg(null)
                        setMode('signup')
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      Create Profile
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Sparkles className="w-3 h-3 text-blue-500" />
                <span>Includes ATS Resume Engine, Portfolio Studio & Custom Domain</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AuthModal
