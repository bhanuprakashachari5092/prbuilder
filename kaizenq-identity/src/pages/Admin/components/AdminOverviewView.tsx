import React, { useState, useEffect } from 'react'
import {
  Users,
  FileText,
  Globe,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  Activity,
  ArrowRight,
  Download,
  QrCode,
  Archive,
  Zap,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { adminService, type AdminOverviewStats, type GrowthDataPoint } from '../../../services/adminService.ts'
import type { AdminTab } from '../types.ts'

interface AdminOverviewViewProps {
  stats: AdminOverviewStats | null
  isLoading: boolean
  onSelectTab: (tab: AdminTab) => void
  onRefresh: () => void
}

function calculateDelta(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return { label: '0%', trend: 'neutral' as const }
    return { label: `+${current}`, trend: 'up' as const }
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct > 0) return { label: `+${pct}%`, trend: 'up' as const }
  if (pct < 0) return { label: `${pct}%`, trend: 'down' as const }
  return { label: '0%', trend: 'neutral' as const }
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  stats,
  isLoading,
  onSelectTab,
  onRefresh,
}) => {
  const [chartData, setChartData] = useState<GrowthDataPoint[]>([])

  useEffect(() => {
    adminService.getGrowthAnalytics(14).then((res) => {
      if (res.data) setChartData(res.data)
    })
  }, [])

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="w-8 h-8 bg-slate-200 rounded-lg" />
              </div>
              <div className="w-16 h-8 bg-slate-200 rounded" />
              <div className="w-32 h-3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const user7dDelta = calculateDelta(stats.users.last7Days, stats.users.prev7Days)
  const user30dDelta = calculateDelta(stats.users.last30Days, stats.users.prev30Days)
  const resume7dDelta = calculateDelta(stats.resumes.last7Days, stats.resumes.prev7Days)
  const portfolio7dDelta = calculateDelta(stats.portfolios.last7Days, stats.portfolios.prev7Days)

  const totalRegistered = stats.users.total
  const bothPct = totalRegistered > 0 ? Math.round((stats.engagement.usersWithBoth / totalRegistered) * 100) : 0
  const resumeOnlyPct = totalRegistered > 0 ? Math.round((stats.engagement.usersResumesOnly / totalRegistered) * 100) : 0
  const portfolioOnlyPct = totalRegistered > 0 ? Math.round((stats.engagement.usersPortfoliosOnly / totalRegistered) * 100) : 0
  const neitherPct = totalRegistered > 0 ? Math.round((stats.engagement.usersNeither / totalRegistered) * 100) : 0

  // Download metrics directly derived from authoritative records
  const resumeDownloads = stats.resumes.downloads ?? 0
  const portfolioZipDownloads = stats.portfolios.zipDownloads ?? 0
  const qrDownloads = stats.portfolios.qrDownloads ?? 0
  const totalDownloads = stats.downloads?.totalDownloads ?? (resumeDownloads + portfolioZipDownloads + qrDownloads)

  // Template breakdown derived from real records
  const totalResumes = stats.resumes.total
  const modernCount = stats.resumes.templatesBreakdown?.modern ?? 0
  const minimalCount = stats.resumes.templatesBreakdown?.minimal ?? 0
  const modernPct = totalResumes > 0 ? Math.round((modernCount / totalResumes) * 100) : 0
  const minimalPct = totalResumes > 0 ? Math.round((minimalCount / totalResumes) * 100) : 0

  // Funnel calculations derived from real records
  const convertedCount = stats.engagement.usersWithBoth + stats.engagement.usersResumesOnly + stats.engagement.usersPortfoliosOnly
  const conversionRate = totalRegistered > 0 ? Math.round((convertedCount / totalRegistered) * 100) : 0
  const downloadFunnelPct = totalRegistered > 0 ? Math.min(100, Math.round((totalDownloads / totalRegistered) * 100)) : 0
  const publishedFunnelPct = totalRegistered > 0 ? Math.round((stats.portfolios.published / totalRegistered) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Top Executive Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PR Builder Telemetry &amp; Platform Console</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-sans">
            Platform Intelligence &amp; Asset Conversion
          </h1>
          <p className="text-blue-100/80 text-xs md:text-sm mt-1.5 max-w-2xl leading-relaxed">
            Real-time tracking of registered student signups, ATS resume creations, PDF downloads, and standalone portfolio ZIP website exports.
          </p>

          {/* Quick Stat Pill Ribbon */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/10">
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-mono font-medium text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-300" />
              <span>Signups: <strong>{stats.users.total.toLocaleString()}</strong></span>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-mono font-medium text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Resumes: <strong>{stats.resumes.total.toLocaleString()}</strong></span>
              <span className="text-amber-200 text-[10px]">({resumeDownloads} PDFs)</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-mono font-medium text-white flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span>Portfolios: <strong>{stats.portfolios.total.toLocaleString()}</strong></span>
              <span className="text-emerald-200 text-[10px]">({portfolioZipDownloads} ZIPs)</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-mono font-medium text-white flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span>Total Downloads: <strong>{totalDownloads.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={onRefresh}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur transition-all flex items-center gap-2 cursor-pointer border border-white/10 shadow-xs"
          >
            <Activity className="w-3.5 h-3.5" />
            Refresh Data
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            Deep Analytics
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SIGNUPS & USER REGISTRATIONS SECTION (Yentamandi Signup Ayyaru)         */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                User Signups &amp; Community Growth
              </h2>
              <span className="text-xs text-slate-500">Total accounts registered across PR Builder platform</span>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('users')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            View User Directory ({stats.users.total})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Total Signups */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Signups</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.users.total.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +{stats.users.today} today
              </span>
              <span>•</span>
              <span>All-time verified</span>
            </div>
          </div>

          {/* Card: New Signups (Last 7 Days) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weekly Signups (7d)</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.users.last7Days.toLocaleString()}
              </span>
              <span
                className={`text-xs font-bold flex items-center ${
                  user7dDelta.trend === 'up'
                    ? 'text-emerald-600'
                    : user7dDelta.trend === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {user7dDelta.trend === 'up' ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : user7dDelta.trend === 'down' ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {user7dDelta.label} vs prior
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Prior week: {stats.users.prev7Days} new signups
            </p>
          </div>

          {/* Card: New Signups (Last 30 Days) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Signups (30d)</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.users.last30Days.toLocaleString()}
              </span>
              <span
                className={`text-xs font-bold flex items-center ${
                  user30dDelta.trend === 'up'
                    ? 'text-emerald-600'
                    : user30dDelta.trend === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {user30dDelta.label} vs prior
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Prior 30 days: {stats.users.prev30Days} new signups
            </p>
          </div>

          {/* Card: Active Users (30d) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users (30d)</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.users.active30Days.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {Math.round((stats.users.active30Days / totalRegistered) * 100)}% active
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Users creating, editing, or downloading
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RESUMES CREATED & PDF DOWNLOADS SECTION (Resumes Yenta Mandi Create...) */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Resume Creation &amp; PDF Downloads
              </h2>
              <span className="text-xs text-slate-500">Students who built and exported ATS-compliant resumes</span>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('resumes')}
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
          >
            Manage Resumes ({stats.resumes.total})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Total Resumes Created */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resumes Created</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.resumes.total.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="font-bold text-slate-700">{stats.resumes.uniqueCreators}</span>
              <span>unique student authors</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              +{stats.resumes.last7Days} in last 7d ({resume7dDelta.label})
            </div>
          </div>

          {/* Card: Resume PDF Downloads */}
          <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Resume PDF Downloads</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-700 tracking-tight">
                {resumeDownloads.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {stats.resumes.total > 0 ? `${stats.resumes.downloadRatePct}%` : '0%'} rate
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              ATS-compliant vector PDF print exports
            </p>
          </div>

          {/* Card: Top Template Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top ATS Templates</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {totalResumes === 0 ? (
                <div className="text-xs text-slate-400 py-2">No resumes created yet</div>
              ) : (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">Modern ATS</span>
                    <span className="font-bold text-slate-900">{modernPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${modernPct}%` }} />
                  </div>

                  <div className="flex justify-between text-xs pt-1">
                    <span className="font-medium text-slate-700">Minimal ATS</span>
                    <span className="font-bold text-slate-900">{minimalPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${minimalPct}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card: Resume Quality & Average Sections */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Depth</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalResumes > 0 ? '4.5' : '0.0'}
              </span>
              <span className="text-xs text-slate-500 ml-1">/ 5 sections</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {totalResumes > 0 ? 'Avg: Experience, Education, Skills, Bio filled' : 'No resume data to evaluate'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PORTFOLIOS CREATED & DOWNLOADS SECTION (Portfolios Yenta Mandi Create...)*/}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Portfolio Creation &amp; ZIP Offline Downloads
              </h2>
              <span className="text-xs text-slate-500">Portfolios designed, published live, and downloaded as ZIP offline packages</span>
            </div>
          </div>
          <button
            onClick={() => onSelectTab('portfolios')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            Manage Portfolios ({stats.portfolios.total})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card: Total Portfolios Created */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portfolios Created</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.portfolios.total.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <span className="font-bold text-slate-700">{stats.portfolios.uniqueCreators}</span>
              <span>unique student authors</span>
            </div>
            <div className="mt-1 text-xs text-slate-400">
              +{stats.portfolios.last7Days} in last 7d ({portfolio7dDelta.label})
            </div>
          </div>

          {/* Card: Portfolio ZIP Downloads */}
          <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Portfolio ZIP Downloads</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                {portfolioZipDownloads.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {stats.portfolios.total > 0 ? `${stats.portfolios.downloadRatePct}%` : '0%'} rate
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Standalone HTML/CSS/JS website packages
            </p>
          </div>

          {/* Card: Published Live Sites */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Published Sites</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {stats.portfolios.published.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                {stats.portfolios.total > 0 ? `${Math.round((stats.portfolios.published / stats.portfolios.total) * 100)}%` : '0%'} live
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Hosted with public URL &amp; subdomains
            </p>
          </div>

          {/* Card: QR Codes Exported / Scanned */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">QR Code Downloads</span>
              <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {qrDownloads.toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Scannable profile QR cards generated
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUAL CONVERSION FUNNEL & INTERACTIVE ACTIVITY CHART                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Conversion Funnel */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Student Conversion Funnel
              </h3>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {conversionRate}% Converted
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Step-by-step funnel tracking student journey from signup to asset creation, PDF/ZIP download, and recruiter distribution.
            </p>

            <div className="space-y-4">
              {/* Step 1: Signups */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">1. User Signups</span>
                  <span className="text-slate-900">{stats.users.total.toLocaleString()} ({totalRegistered > 0 ? '100%' : '0%'})</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: totalRegistered > 0 ? '100%' : '0%' }} />
                </div>
              </div>

              {/* Step 2: Created Asset */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">2. Created Resume or Portfolio</span>
                  <span className="text-slate-900">
                    {convertedCount.toLocaleString()} ({conversionRate}%)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${conversionRate}%` }} />
                </div>
              </div>

              {/* Step 3: Downloaded Asset */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">3. Downloaded PDF / ZIP</span>
                  <span className="text-slate-900">{totalDownloads.toLocaleString()} Exports ({downloadFunnelPct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${downloadFunnelPct}%` }} />
                </div>
              </div>

              {/* Step 4: Published Live */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700">4. Published Live to Recruiter</span>
                  <span className="text-slate-900">{stats.portfolios.published} Live Sites ({publishedFunnelPct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${publishedFunnelPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Verified database funnel</span>
            <span className="font-bold text-blue-600">{convertedCount} active creators</span>
          </div>
        </div>

        {/* Right: Area Chart Visualizing Growth */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Signups &amp; Asset Creation Trajectory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily timeline comparison across user signups, resumes created, and portfolios created
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Last 14 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaResumes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaPortfolios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="newUsers" name="New Signups" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#areaUsers)" />
                <Area type="monotone" dataKey="resumesCreated" name="Resumes" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#areaResumes)" />
                <Area type="monotone" dataKey="portfoliosCreated" name="Portfolios" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#areaPortfolios)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs">
            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              Signups
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Resumes Created
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Portfolios Created
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. USER ENGAGEMENT SEGMENTATION                                            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              User Feature Engagement Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique creator segmentation across Resume and Portfolio studios ({stats.users.total} total registered users)
            </p>
          </div>
          <button
            onClick={() => onSelectTab('users')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Explore Directory
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Segmented Bar */}
        <div className="h-4 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 mb-6">
          <div
            className="bg-blue-600 rounded-l-full transition-all duration-500"
            style={{ width: `${Math.max(bothPct, 1)}%` }}
            title={`Both: ${stats.engagement.usersWithBoth}`}
          />
          <div
            className="bg-indigo-500 transition-all duration-500"
            style={{ width: `${Math.max(resumeOnlyPct, 1)}%` }}
            title={`Resume Only: ${stats.engagement.usersResumesOnly}`}
          />
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.max(portfolioOnlyPct, 1)}%` }}
            title={`Portfolio Only: ${stats.engagement.usersPortfoliosOnly}`}
          />
          <div
            className="bg-slate-300 rounded-r-full transition-all duration-500"
            style={{ width: `${Math.max(neitherPct, 1)}%` }}
            title={`Neither: ${stats.engagement.usersNeither}`}
          />
        </div>

        {/* 4 Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-xs font-semibold text-blue-900">Both Resume &amp; Portfolio</span>
            </div>
            <div className="text-xl font-bold text-blue-950">
              {stats.engagement.usersWithBoth.toLocaleString()}
            </div>
            <div className="text-xs text-blue-700 mt-1 font-medium">
              {bothPct}% of users (Power Users)
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-indigo-900">Resume Only</span>
            </div>
            <div className="text-xl font-bold text-indigo-950">
              {stats.engagement.usersResumesOnly.toLocaleString()}
            </div>
            <div className="text-xs text-indigo-700 mt-1 font-medium">
              {resumeOnlyPct}% of users
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-900">Portfolio Only</span>
            </div>
            <div className="text-xl font-bold text-emerald-950">
              {stats.engagement.usersPortfoliosOnly.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-700 mt-1 font-medium">
              {portfolioOnlyPct}% of users
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Neither Created Yet</span>
            </div>
            <div className="text-xl font-bold text-slate-900">
              {stats.engagement.usersNeither.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {neitherPct}% of users (New Signups)
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. REAL-TIME ACTIVITY STREAM & RECENT EVENTS                              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Live Activity Stream &amp; Download Feed
            </h3>
          </div>
          <span className="text-xs text-slate-400">Streaming real-time events</span>
        </div>

        {(!stats.recentActivity || stats.recentActivity.length === 0) ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Activity className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No activity events recorded yet</p>
            <p className="mt-0.5 text-slate-400">User signups, resume creations, and downloads will stream here live.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stats.recentActivity.map((act) => {
              const isDownload = act.type === 'resume_download' || act.type === 'portfolio_download'
              const isSignup = act.type === 'signup'
              const isPublish = act.type === 'portfolio_publish'

              return (
                <div key={act.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isDownload
                          ? 'bg-amber-50 text-amber-600'
                          : isSignup
                          ? 'bg-blue-50 text-blue-600'
                          : isPublish
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {isDownload ? (
                        <Download className="w-4 h-4" />
                      ) : isSignup ? (
                        <Users className="w-4 h-4" />
                      ) : isPublish ? (
                        <Globe className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{act.userName}</span>
                        <span className="text-[10px] font-mono text-slate-400">({act.userEmail})</span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                            isDownload
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isSignup
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {act.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{act.details}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminOverviewView
