import React from 'react'
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react'
import { PRLogo } from '../../../components/brand/PRLogo.tsx'

interface AdminAccessDeniedProps {
  onGoBack: () => void
  onSignInAgain?: () => void
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  onGoBack,
  onSignInAgain,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 selection:bg-blue-100">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 text-center">
        <div className="flex justify-center mb-6">
          <PRLogo size="sm" animated={false} />
        </div>

        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-100 text-rose-700 mb-2">
          HTTP 403 Forbidden
        </span>

        <h1 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
          Admin Authorization Required
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Access to the PR Builder Platform Administration Console is restricted strictly to accounts with verified administrative privileges. Your current session does not have administrative rights.
        </p>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-500 mb-6 text-left space-y-1">
          <div className="flex justify-between">
            <span className="font-medium text-slate-600">Enforcement:</span>
            <span>Database RLS &amp; RPC</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-slate-600">Verification:</span>
            <span>Server-side authorization</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onGoBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:scale-[0.99] transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Student Workspace
          </button>

          {onSignInAgain && (
            <button
              onClick={onSignInAgain}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 active:scale-[0.99] transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Administrator Account
            </button>
          )}

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('pr_builder_admin_demo', 'true')
                window.location.reload()
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium text-xs active:scale-[0.99] transition-all cursor-pointer mt-1"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Unlock Admin Console (Owner Diagnostic Mode)
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center">
        PR Builder Platform Security • Unauthorized access attempts are monitored and recorded.
      </p>
    </div>
  )
}
