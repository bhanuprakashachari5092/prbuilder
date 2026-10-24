import React, { useState, useEffect, useCallback } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  FileText,
  Globe,
  PieChart as PieIcon,
  Activity,
  Calendar,
  AlertCircle,
  RefreshCw,
  Download,
} from 'lucide-react'
import {
  adminService,
  type GrowthDataPoint,
  type AdminOverviewStats,
} from '../../../services/adminService.ts'

interface AdminAnalyticsViewProps {
  stats: AdminOverviewStats | null
}

const ENGAGEMENT_COLORS = ['#2563EB', '#6366F1', '#10B981', '#94A3B8']

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ stats }) => {
  const [daysWindow, setDaysWindow] = useState<number>(30)
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await adminService.getGrowthAnalytics(daysWindow)
    if (res.error) {
      setError(res.error.message || 'Failed to query growth analytics')
    } else {
      setGrowthData(res.data)
    }
    setIsLoading(false)
  }, [daysWindow])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Prepare engagement data for Pie Chart
  const engagementData = stats
    ? [
        { name: 'Both Resume & Portfolio', value: stats.engagement.usersWithBoth },
        { name: 'Resume Only', value: stats.engagement.usersResumesOnly },
        { name: 'Portfolio Only', value: stats.engagement.usersPortfoliosOnly },
        { name: 'Neither Created Yet', value: stats.engagement.usersNeither },
      ].filter((item) => item.value > 0)
    : []

  return (
    <div className="space-y-8">
      {/* View Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Platform Analytics &amp; Time-Series Intelligence
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Authentic database aggregation tracking signups, creations, and feature engagement over time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setDaysWindow(7)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                daysWindow === 7 ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDaysWindow(30)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                daysWindow === 30 ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDaysWindow(90)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                daysWindow === 90 ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              90 Days
            </button>
            <button
              onClick={() => setDaysWindow(365)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                daysWindow === 365 ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Months
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-sm cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Unable to generate analytics:</span> {error}
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-medium text-xs hover:bg-rose-100/50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Chart A: User Registration Growth */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              User Registration Growth
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily authentic member signups across the selected {daysWindow}-day window
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {growthData.reduce((acc, curr) => acc + curr.newUsers, 0)} new registrations
          </span>
        </div>

        <div className="h-64 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
              <span className="text-xs text-slate-400">Loading registration metrics...</span>
            </div>
          ) : !growthData.length ? (
            <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl text-slate-400 text-xs">
              No historical registration records available for this window
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#0F172A' }}
                />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  name="New Users"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#userGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Two Column Grid for Charts B & C */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart B: Resume Creations */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Resume Creations Trend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ATS resume drafts generated per day
              </p>
            </div>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              {growthData.reduce((acc, curr) => acc + curr.resumesCreated, 0)} resumes
            </span>
          </div>

          <div className="h-60 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
                <span className="text-xs text-slate-400">Loading resume metrics...</span>
              </div>
            ) : !growthData.length ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl text-slate-400 text-xs">
                No resume creation data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Bar dataKey="resumesCreated" name="Resumes Created" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart C: Portfolio Creations (Published vs Draft) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                Portfolio Creations &amp; Publishing
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Published sites vs draft sites over time
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              {growthData.reduce((acc, curr) => acc + curr.portfoliosCreated, 0)} total
            </span>
          </div>

          <div className="h-60 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
                <span className="text-xs text-slate-400">Loading portfolio metrics...</span>
              </div>
            ) : !growthData.length ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl text-slate-400 text-xs">
                No portfolio creation data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="publishedPortfolios" name="Published" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="draftPortfolios" name="Draft" fill="#94A3B8" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid for Charts D & E */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart D: Platform Activity Combined Trends */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-600" />
                Cross-Studio Creation Trends
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparative volume trajectory of resumes vs portfolios
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
                <span className="text-xs text-slate-400">Loading activity metrics...</span>
              </div>
            ) : !growthData.length ? (
              <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl text-slate-400 text-xs">
                No activity trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="resumesCreated"
                    name="Resumes"
                    stroke="#6366F1"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="portfoliosCreated"
                    name="Portfolios"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart E: User Engagement Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-purple-600" />
                  User Feature Engagement Distribution
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proportion of registered students adopting one or both core features
                </p>
              </div>
            </div>

            <div className="h-52 w-full flex items-center justify-center">
              {!engagementData.length ? (
                <div className="text-slate-400 text-xs">No registered user data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {engagementData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={ENGAGEMENT_COLORS[index % ENGAGEMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-[11px]">
            {engagementData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: ENGAGEMENT_COLORS[idx % ENGAGEMENT_COLORS.length] }}
                />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-semibold text-slate-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart F: Download Volume & Export Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-600" />
              Asset Download &amp; Export Volume Trends
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily comparison of ATS Resume PDF downloads vs Standalone Portfolio ZIP website exports
            </p>
          </div>
          <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">
            {growthData.reduce((acc, curr) => acc + (curr.totalDownloads || ((curr.resumeDownloads || 0) + (curr.portfolioDownloads || 0))), 0)} total exports
          </span>
        </div>

        <div className="h-64 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl animate-pulse">
              <span className="text-xs text-slate-400">Loading download analytics...</span>
            </div>
          ) : !growthData.length ? (
            <div className="h-full flex items-center justify-center bg-slate-50/50 rounded-xl text-slate-400 text-xs">
              No download export records available for this window
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(d) => d.slice(5)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="resumeDownloads" name="Resume PDFs Downloaded" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="portfolioDownloads" name="Portfolio ZIPs Downloaded" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
