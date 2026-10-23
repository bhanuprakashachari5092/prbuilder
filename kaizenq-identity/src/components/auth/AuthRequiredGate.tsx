import React from 'react'
import { Lock, FileText, Globe, ArrowRight, ShieldCheck, CheckCircle2, Home } from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import { PRLogo } from '../brand/PRLogo.tsx'

export interface AuthRequiredGateProps {
  targetRouteName: string
  onOpenSignup: () => void
  onOpenSignin: () => void
  onGoHome: () => void
}

export const AuthRequiredGate: React.FC<AuthRequiredGateProps> = ({
  targetRouteName,
  onOpenSignup,
  onOpenSignin,
  onGoHome,
}) => {
  const isResume = targetRouteName.toLowerCase().includes('resume')

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Top Brand Logo */}
      <div className="mb-8">
        <button
          onClick={onGoHome}
          className="cursor-pointer focus:outline-none"
          aria-label="Return home"
        >
          <PRLogo size="lg" theme="light" />
        </button>
      </div>

      {/* Main Authentication Barrier Card */}
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E2E8F0] shadow-md p-7 sm:p-10 text-center space-y-6">
        {/* Icon Header */}
        <div className="relative inline-flex items-center justify-center mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-xs">
            {isResume ? <FileText className="w-8 h-8" /> : <Globe className="w-8 h-8" />}
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white border border-[#E2E8F0] text-[#2563EB] shadow-xs">
            <Lock className="w-4 h-4" />
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold border border-[#BFDBFE]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authentication Required</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Sign in to open {targetRouteName}
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
            To build, customize, and save your work in the {targetRouteName}, you must have an active account. Your drafts will automatically sync with your private cloud database.
          </p>
        </div>

        {/* Value Checklist */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left text-xs space-y-2.5">
          <div className="flex items-center gap-2.5 text-[#111827]">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>Secure cloud draft persistence with Row-Level Security</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#111827]">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>ATS-calibrated resume export and template switching</span>
          </div>
          <div className="flex items-center gap-2.5 text-[#111827]">
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>Live portfolio publishing with personal .xyz domain routing</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={onOpenSignup}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="text-sm font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm"
          >
            Create Free Account to Build
          </Button>

          <Button
            variant="outline"
            fullWidth
            size="md"
            onClick={onOpenSignin}
            className="text-sm font-medium border-[#E2E8F0] text-[#111827] hover:bg-[#F8FAFC]"
          >
            Already have an account? Sign In
          </Button>

          {targetRouteName.toLowerCase().includes('admin') && (
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('pr_builder_admin_demo', 'true')
                  window.location.reload()
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Unlock Admin Console (Owner Diagnostic Mode)</span>
            </button>
          )}

          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#111827] transition-colors pt-1 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthRequiredGate
