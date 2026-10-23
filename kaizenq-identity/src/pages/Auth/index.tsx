import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Mail, ArrowRight, X, Sparkles, Check, Lock, User, AlertCircle, Info } from 'lucide-react'
import { PRLogo } from '../../components/brand/PRLogo.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { authService } from '../../services/authService.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'

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
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isConfigured = isSupabaseConfigured()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    // Handle local mode
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
        const { data, error } = await authService.signUp(email, password, displayName)
        if (error) {
          setErrorMsg(error.message)
          setLoading(false)
          return
        }

        if (data?.session) {
          setSuccessMsg('Identity account created successfully!')
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

        setSuccessMsg('Signed in successfully!')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-8 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <PRLogo size="lg" className="justify-center mb-3" />
          <h3 className="text-xl font-bold text-[#111827]">
            {mode === 'signup'
              ? 'Create Your Student Identity'
              : mode === 'signin'
              ? 'Welcome Back'
              : 'Reset Your Password'}
          </h3>
          <p className="text-xs text-[#64748B] mt-1">
            {mode === 'signup'
              ? 'Join student builders with verified portfolios & ATS resumes'
              : mode === 'signin'
              ? 'Sign in to access your cloud identity, portfolio, and domain'
              : 'Enter your registered email to receive recovery instructions'}
          </p>
        </div>

        {/* Notice when Supabase is not configured */}
        {!isConfigured && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#64748B] space-y-2">
            <div className="flex items-center gap-2 text-[#2563EB] font-semibold">
              <Info className="w-4 h-4 shrink-0" />
              <span>Local Sandbox Mode</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Supabase environment variables (<code className="text-[#2563EB] font-semibold">VITE_SUPABASE_URL</code>) are not yet configured. You can explore all builder and local preview features offline.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleContinueLocal}
              className="w-full text-xs"
            >
              Continue in Local Sandbox
            </Button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {successMsg ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#111827]">{successMsg}</p>
            <p className="text-xs text-[#64748B]">
              {mode === 'forgot' ? 'You may close this window or return to login.' : 'Directing you to your Identity workspace...'}
            </p>
            {mode === 'forgot' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccessMsg(null)
                  setMode('signin')
                }}
                className="text-xs mt-2"
              >
                Back to Sign In
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Alexander Vance"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1.5">
                  Student / University Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#64748B]">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null)
                          setMode('forgot')
                        }}
                        className="text-[11px] text-[#2563EB] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {mode === 'signin' && (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-medium text-slate-700">Admin Credentials</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@gmail.com')
                      setPassword('googlemanoj')
                    }}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-xs hover:underline cursor-pointer"
                  >
                    Auto-fill admin@gmail.com
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {mode === 'signup'
                  ? 'Create Identity Account'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Send Reset Link'}
              </Button>
            </form>

            <div className="text-center pt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
              {mode === 'signup' ? (
                <span>
                  Already have an identity?{' '}
                  <button
                    onClick={() => {
                      setErrorMsg(null)
                      setMode('signin')
                    }}
                    className="text-[#2563EB] hover:underline font-semibold"
                  >
                    Sign in
                  </button>
                </span>
              ) : (
                <span>
                  New to KaizenQ?{' '}
                  <button
                    onClick={() => {
                      setErrorMsg(null)
                      setMode('signup')
                    }}
                    className="text-[#2563EB] hover:underline font-semibold"
                  >
                    Create account
                  </button>
                </span>
              )}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] pt-1">
              <Sparkles className="w-3 h-3 text-[#2563EB]" />
              <span>Includes ATS Resume Engine & Live Portfolio Studio</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default AuthModal
