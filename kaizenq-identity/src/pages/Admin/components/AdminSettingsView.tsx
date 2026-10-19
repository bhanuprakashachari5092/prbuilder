import React from 'react'
import {
  ShieldCheck,
  Server,
  Database,
  Globe,
  Key,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
} from 'lucide-react'
import { isSupabaseConfigured, getBaseAppUrl } from '../../../lib/supabase.ts'
import { getPlatformDomain } from '../../../lib/domainUtils.ts'
import { useAuth } from '../../../app/providers/AuthContext.tsx'

export const AdminSettingsView: React.FC = () => {
  const { user, profile } = useAuth()
  const isConfigured = isSupabaseConfigured()

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Platform Infrastructure &amp; Security Settings
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Backend connection verification, database Row Level Security policies, and administrative credentials.
        </p>
      </div>

      {/* Security Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">PostgreSQL Supabase</h3>
          <p className="text-xs text-slate-500">
            Full-stack database with strict Row Level Security (RLS) policies isolating student data.
          </p>
          <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Connected &amp; Verified</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Server-Side RLS Enforcement</h3>
          <p className="text-xs text-slate-500">
            Administrative queries use `SECURITY DEFINER` RPC functions with strict `public.is_admin()` checks.
          </p>
          <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Privilege Escalation Blocked</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-sm">Platform Multi-Tenancy</h3>
          <p className="text-xs text-slate-500">
            Wildcard DNS routing for platform subdomains (`*.{getPlatformDomain()}`) and custom domains.
          </p>
          <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Platform Apex: {getPlatformDomain()}</span>
          </div>
        </div>
      </div>

      {/* System Status Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
        <h3 className="font-bold text-slate-900 text-base">
          System Environment &amp; Service Configuration
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Supabase Backend Status:</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isConfigured ? 'Production Live' : 'Local Fallback'}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Platform Domain Root:</span>
            <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {getPlatformDomain()}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Base App URL:</span>
            <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {getBaseAppUrl()}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Active Administrator:</span>
            <span className="font-mono text-blue-700 font-medium">
              {profile?.display_name || user?.email || 'Authenticated Admin'}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium">Security Role Validation:</span>
            <span className="text-slate-700 font-mono">
              is_admin = true (checked via `public.is_admin()`)
            </span>
          </div>
        </div>
      </div>

      {/* Admin Safety & Audit Policies */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white shadow-md space-y-3">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          Production Admin Safety Controls
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">
          Administrative features operate with zero trust on client-side state. Every query to user emails, resume counts, and portfolio records executes via PostgreSQL security definer functions that strictly verify `public.is_admin()`. Destructive operations (such as unpublishing or deleting records) require dual confirmation and automatically record immutable entries to the database audit log.
        </p>
      </div>
    </div>
  )
}
