import React from 'react'
import {
  Users,
  FileText,
  Globe,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  Activity,
  ArrowRight,
} from 'lucide-react'
import type { AdminOverviewStats } from '../../../services/adminService.ts'
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
  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-3"
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
  const active30dDelta = calculateDelta(stats.users.active30Days, stats.users.prevActive30Days)
  const resume7dDelta = calculateDelta(stats.resumes.last7Days, stats.resumes.prev7Days)
  const portfolio7dDelta = calculateDelta(stats.portfolios.last7Days, stats.portfolios.prev7Days)

  const totalRegistered = stats.users.total || 1
  const bothPct = Math.round((stats.engagement.usersWithBoth / totalRegistered) * 100)
  const resumeOnlyPct = Math.round((stats.engagement.usersResumesOnly / totalRegistered) * 100)
  const portfolioOnlyPct = Math.round((stats.engagement.usersPortfoliosOnly / totalRegistered) * 100)
  const neitherPct = Math.round((stats.engagement.usersNeither / totalRegistered) * 100)

  return (
    <div className="space-y-8">
      {/* Top Welcome / Platform Status Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-6 text-white shadow-md shadow-blue-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Real-Time Platform Pulse
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            PR Builder Executive Summary
          </h2>
          <p className="text-blue-100/90 text-sm mt-1 max-w-xl">
            Live metrics aggregated directly from PostgreSQL database tables. Zero synthetic data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur transition-all flex items-center gap-2 cursor-pointer border border-white/10"
          >
            <Activity className="w-3.5 h-3.5" />
            Refresh Aggregates
          </button>
          <button
            onClick={() => onSelectTab('analytics')}
            className="px-4 py-2 rounded-xl bg-white text-blue-700 font-semibold text-xs hover:bg-blue-50 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            Deep Analytics
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            User Registration &amp; Activity
          </h3>
          <span className="text-xs text-slate-400">Activity Window: 30 days</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Users</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.users.total.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600 flex items-center">
                +{stats.users.today} today
              </span>
              <span>•</span>
              <span>All-time verified</span>
            </div>
          </div>

          {/* Card 2: New Users (7 Days) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">New (Last 7 Days)</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.users.last7Days.toLocaleString()}
              </span>
              <span
                className={`text-xs font-medium flex items-center ${
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
              Prior 7 days: {stats.users.prev7Days} registrations
            </p>
          </div>

          {/* Card 3: New Users (30 Days) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">New (Last 30 Days)</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.users.last30Days.toLocaleString()}
              </span>
              <span
                className={`text-xs font-medium flex items-center ${
                  user30dDelta.trend === 'up'
                    ? 'text-emerald-600'
                    : user30dDelta.trend === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {user30dDelta.trend === 'up' ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : user30dDelta.trend === 'down' ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {user30dDelta.label}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Prior 30 days: {stats.users.prev30Days} registrations
            </p>
          </div>

          {/* Card 4: Active Users (30 Days Window) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Users (30d)</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.users.active30Days.toLocaleString()}
              </span>
              <span
                className={`text-xs font-medium flex items-center ${
                  active30dDelta.trend === 'up'
                    ? 'text-emerald-600'
                    : active30dDelta.trend === 'down'
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                {active30dDelta.label}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Users with updates or actions in last 30d
            </p>
          </div>
        </div>
      </div>

      {/* Assets & Creations Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Resume &amp; Portfolio Creation Breakdown
          </h3>
          <span className="text-xs text-slate-400">Total vs Unique Creators</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 5: Total Resumes */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Resumes</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.resumes.total.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{stats.resumes.uniqueCreators}</span>
              <span>unique student creators</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              +{stats.resumes.last7Days} in last 7d ({resume7dDelta.label})
            </div>
          </div>

          {/* Card 6: Total Portfolios */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Portfolios</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.portfolios.total.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{stats.portfolios.uniqueCreators}</span>
              <span>unique student creators</span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              +{stats.portfolios.last7Days} in last 7d ({portfolio7dDelta.label})
            </div>
          </div>

          {/* Card 7: Published Portfolios */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Published Sites</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600 tracking-tight">
                {stats.portfolios.published.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Live with public URLs &amp; subdomains
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {stats.portfolios.total > 0
                ? `${Math.round((stats.portfolios.published / stats.portfolios.total) * 100)}% of total portfolios`
                : '0% published'}
            </div>
          </div>

          {/* Card 8: Draft Portfolios */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Draft Portfolios</span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-700 tracking-tight">
                {stats.portfolios.draft.toLocaleString()}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Private student workspaces in progress
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Strictly non-public drafts
            </div>
          </div>
        </div>
      </div>

      {/* User Engagement Distribution Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
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
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
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

          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40">
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

          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40">
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

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
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

      {/* Quick Administration Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onSelectTab('users')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm">User Directory</h4>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, view profiles, and manage administrator roles for all registered members.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('resumes')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm">Resume Management</h4>
          <p className="text-xs text-slate-500 mt-1">
            Browse created ATS resumes, inspect template distribution, and manage assets safely.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('portfolios')}
          className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h4 className="font-semibold text-slate-900 text-sm">Portfolio Management</h4>
          <p className="text-xs text-slate-500 mt-1">
            Inspect live published handles, review custom domains, and safely unpublish or audit sites.
          </p>
        </div>
      </div>
    </div>
  )
}
