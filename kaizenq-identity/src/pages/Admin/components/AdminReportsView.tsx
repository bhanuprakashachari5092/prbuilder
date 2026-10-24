import React, { useState } from 'react'
import {
  FileSpreadsheet,
  Download,
  Users,
  FileText,
  Globe,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { adminService, type AdminOverviewStats } from '../../../services/adminService.ts'

interface AdminReportsViewProps {
  stats: AdminOverviewStats | null
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({ stats }) => {
  const [isExportingUsers, setIsExportingUsers] = useState(false)
  const [isExportingResumes, setIsExportingResumes] = useState(false)
  const [isExportingPortfolios, setIsExportingPortfolios] = useState(false)
  const [isExportingSummary, setIsExportingSummary] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleExportUsers = async () => {
    setIsExportingUsers(true)
    setStatusMessage(null)
    try {
      const res = await adminService.getUsers({ page: 1, pageSize: 500 })
      if (res.data?.items && res.data.items.length > 0) {
        adminService.exportUsersCsv(res.data.items)
        setStatusMessage(`Successfully generated Users CSV (${res.data.items.length} records).`)
      } else {
        setStatusMessage('No user records currently exist in the database (0 records found).')
      }
    } catch (err) {
      setStatusMessage(`Export failed: ${(err as Error).message}`)
    } finally {
      setIsExportingUsers(false)
    }
  }

  const handleExportResumes = async () => {
    setIsExportingResumes(true)
    setStatusMessage(null)
    try {
      const res = await adminService.getResumes({ page: 1, pageSize: 500 })
      if (res.data?.items && res.data.items.length > 0) {
        adminService.exportResumesCsv(res.data.items)
        setStatusMessage(`Successfully generated Resumes Metadata CSV (${res.data.items.length} records).`)
      } else {
        setStatusMessage('No resume records currently exist in the database (0 records found).')
      }
    } catch (err) {
      setStatusMessage(`Export failed: ${(err as Error).message}`)
    } finally {
      setIsExportingResumes(false)
    }
  }

  const handleExportPortfolios = async () => {
    setIsExportingPortfolios(true)
    setStatusMessage(null)
    try {
      const res = await adminService.getPortfolios({ page: 1, pageSize: 500 })
      if (res.data?.items && res.data.items.length > 0) {
        adminService.exportPortfoliosCsv(res.data.items)
        setStatusMessage(`Successfully generated Portfolios Metadata CSV (${res.data.items.length} records).`)
      } else {
        setStatusMessage('No portfolio records currently exist in the database (0 records found).')
      }
    } catch (err) {
      setStatusMessage(`Export failed: ${(err as Error).message}`)
    } finally {
      setIsExportingPortfolios(false)
    }
  }

  const handleExportSummary = () => {
    if (!stats) {
      alert('Stats are still loading. Please try again.')
      return
    }
    setIsExportingSummary(true)
    try {
      adminService.exportSummaryReportCsv(stats)
      setStatusMessage('Executive Platform Summary CSV generated successfully.')
    } finally {
      setIsExportingSummary(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Executive Reports &amp; Verified Data Export
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate production audit CSV exports directly from real PostgreSQL database records. All exports adhere to strict security and tenant privacy policies.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Executive Platform Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Executive Platform Summary Report
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolidated snapshot containing all primary platform metrics: total users, 7-day and 30-day registration deltas, active user windows, resume volume, portfolio publication ratios, and power-user segmentation.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="font-mono font-medium text-slate-700">CSV (.csv)</span>
              </div>
              <div className="flex justify-between">
                <span>Included Fields:</span>
                <span>Category, Metric Name, Current Value, Historical Delta</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Timestamped export</span>
            <button
              onClick={handleExportSummary}
              disabled={isExportingSummary || !stats}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExportingSummary ? 'Generating...' : 'Download Summary CSV'}
            </button>
          </div>
        </div>

        {/* Card 2: Registered Users Directory */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Registered Users Directory Export
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export verified registered student profiles, roles, registration dates, creation counts, and last activity timestamps. Passwords, session tokens, and secrets are strictly excluded.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Security Gate:</span>
                <span className="text-emerald-700 font-medium">Zero Secret Leakage</span>
              </div>
              <div className="flex justify-between">
                <span>Fields:</span>
                <span>User ID, Name, Email, Role, Assets, Timeline</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Up to 100 recent entries</span>
            <button
              onClick={handleExportUsers}
              disabled={isExportingUsers}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExportingUsers ? 'Exporting...' : 'Export Users CSV'}
            </button>
          </div>
        </div>

        {/* Card 3: Resume Metadata Export */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Resume Studio Metadata Export
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Comprehensive report of created resumes, associated student owners, selected ATS templates, section completeness counts, and creation timelines.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Privacy:</span>
                <span className="text-slate-600">Metadata Only (No private body text)</span>
              </div>
              <div className="flex justify-between">
                <span>Fields:</span>
                <span>Resume ID, Title, Template, Owner, Section Count, Dates</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Metadata inventory</span>
            <button
              onClick={handleExportResumes}
              disabled={isExportingResumes}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExportingResumes ? 'Exporting...' : 'Export Resumes CSV'}
            </button>
          </div>
        </div>

        {/* Card 4: Portfolio Studio Metadata Export */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Portfolio Studio Metadata Export
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete inventory of created portfolios, publication states (published live vs private draft), public subdomains, custom hostnames, theme choices, and project counts.
            </p>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Domains Included:</span>
                <span className="text-emerald-700 font-medium">Subdomains &amp; Custom Domains</span>
              </div>
              <div className="flex justify-between">
                <span>Fields:</span>
                <span>Portfolio ID, Title, Slug, Theme, Status, Projects, Timestamps</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Web asset inventory</span>
            <button
              onClick={handleExportPortfolios}
              disabled={isExportingPortfolios}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExportingPortfolios ? 'Exporting...' : 'Export Portfolios CSV'}
            </button>
          </div>
        </div>
      </div>

      {/* Compliance & Export Security Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block">Data Governance &amp; Security Guarantee</span>
          <p className="text-blue-800 text-[11px] leading-relaxed">
            All data exports are generated client-side from authenticated Supabase RPC queries strictly constrained by PostgreSQL Row Level Security. Passwords, auth tokens, session cookies, and Supabase service-role keys are never included in exported files.
          </p>
        </div>
      </div>
    </div>
  )
}
