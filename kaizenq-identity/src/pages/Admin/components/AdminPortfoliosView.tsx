import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  Download,
  Globe,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Eye,
  ExternalLink,
  EyeOff,
  User,
  X,
  CheckCircle2,
  FolderGit2,
  LayoutGrid,
  List,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  Check,
  Palette,
  ArrowUpRight,
} from 'lucide-react'
import { adminService, type AdminPortfolioItem, type PaginatedResult } from '../../../services/adminService.ts'
import { buildSubdomainUrl } from '../../../lib/domainUtils.ts'
import { supabase, isSupabaseConfigured, getBaseAppUrl } from '../../../lib/supabase.ts'
import type { AdminConfirmationModalState } from '../types.ts'

interface AdminPortfoliosViewProps {
  onOpenConfirmation: (state: AdminConfirmationModalState) => void
  onNavigateToUser?: (userId: string) => void
  globalSearch?: string
  initialPortfolioId?: string | null
}

type ViewMode = 'grid' | 'table'
type DeviceMode = 'desktop' | 'tablet' | 'mobile'
type ModalTab = 'preview' | 'appearance'

interface ThemeConfig {
  name: string
  label: string
  primaryColor: string
  accentColor: string
  bgColor: string
  textColor: string
  fontFamily: string
  bannerGradient: string
  badgeClass: string
  dotColor: string
  description: string
}

const THEME_CONFIGS: Record<string, ThemeConfig> = {
  midnight: {
    name: 'midnight',
    label: 'Midnight Cosmic',
    primaryColor: '#6366F1',
    accentColor: '#818CF8',
    bgColor: '#0B0F19',
    textColor: '#F8FAFC',
    fontFamily: 'Inter, sans-serif',
    bannerGradient: 'from-slate-950 via-indigo-950 to-slate-900',
    badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
    dotColor: '#6366F1',
    description: 'Celestial dark theme with glowing indigo gradients and glassmorphism',
  },
  minimal: {
    name: 'minimal',
    label: 'Minimalist Clean',
    primaryColor: '#18181B',
    accentColor: '#71717A',
    bgColor: '#FFFFFF',
    textColor: '#18181B',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    bannerGradient: 'from-zinc-100 via-slate-100 to-zinc-200',
    badgeClass: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    dotColor: '#71717A',
    description: 'Crisp Swiss monochrome with clean typography and whitespace',
  },
  developer: {
    name: 'developer',
    label: 'Developer Terminal',
    primaryColor: '#10B981',
    accentColor: '#06B6D4',
    bgColor: '#0D1117',
    textColor: '#E6EDF3',
    fontFamily: 'JetBrains Mono, monospace',
    bannerGradient: 'from-slate-950 via-emerald-950 to-slate-900',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
    dotColor: '#10B981',
    description: 'Hacker terminal dark theme with matrix emerald code highlights',
  },
  creative: {
    name: 'creative',
    label: 'Creative Studio',
    primaryColor: '#8B5CF6',
    accentColor: '#EC4899',
    bgColor: '#0F172A',
    textColor: '#FDF4FF',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    bannerGradient: 'from-purple-950 via-pink-950 to-amber-950',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-800/60',
    dotColor: '#8B5CF6',
    description: 'Bold expressive portfolio with vivid mesh gradients and creative flare',
  },
  modern: {
    name: 'modern',
    label: 'Modern Tech SaaS',
    primaryColor: '#2563EB',
    accentColor: '#38BDF8',
    bgColor: '#F8FAFC',
    textColor: '#0F172A',
    fontFamily: 'Inter, sans-serif',
    bannerGradient: 'from-blue-900 via-indigo-900 to-sky-900',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: '#2563EB',
    description: 'High-end tech portfolio with electric blue accents and subtle cards',
  },
}

export const AdminPortfoliosView: React.FC<AdminPortfoliosViewProps> = ({
  onOpenConfirmation,
  onNavigateToUser,
  globalSearch,
  initialPortfolioId,
}) => {
  const [data, setData] = useState<PaginatedResult<AdminPortfolioItem> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtering, search, and sort states
  const [searchTerm, setSearchTerm] = useState(globalSearch || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [themeFilter, setThemeFilter] = useState('all')
  const [domainFilter, setDomainFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12

  // Visual appearance options
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop')
  const [modalTab, setModalTab] = useState<ModalTab>('preview')

  // Selected portfolio for preview/appearance inspection
  const [selectedPortfolio, setSelectedPortfolio] = useState<AdminPortfolioItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Real-time last refresh timestamp
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  // Sync global search from top header
  useEffect(() => {
    if (globalSearch !== undefined && globalSearch !== searchTerm) {
      setSearchTerm(globalSearch)
      setCurrentPage(1)
    }
  }, [globalSearch])

  // Query real portfolio data
  const fetchPortfolios = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await adminService.getPortfolios({
      search: searchTerm,
      statusFilter: statusFilter === 'all' ? undefined : statusFilter,
      themeFilter: themeFilter === 'all' ? undefined : themeFilter,
      sortBy,
      sortDir,
      page: currentPage,
      pageSize,
    })

    if (res.error) {
      setError(res.error.message || 'Failed to fetch portfolios directory')
    } else {
      setData(res.data)
      setLastRefreshed(new Date())
      if (initialPortfolioId && res.data?.items) {
        const found = res.data.items.find((item) => item.id === initialPortfolioId)
        if (found) setSelectedPortfolio(found)
      }
    }
    setIsLoading(false)
  }, [searchTerm, statusFilter, themeFilter, sortBy, sortDir, currentPage, initialPortfolioId])

  useEffect(() => {
    fetchPortfolios()
  }, [fetchPortfolios])

  // Real-time Supabase subscription: dynamically update when any student creates/publishes a portfolio
  useEffect(() => {
    if (!isSupabaseConfigured()) return

    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const triggerDebouncedRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        fetchPortfolios()
      }, 1200)
    }

    const channel = supabase
      .channel('pr-admin-portfolios-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolios' }, triggerDebouncedRefresh)
      .subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [fetchPortfolios])

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPortfolios()
  }

  // Copy public URL to clipboard
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle Unpublish
  const handleUnpublish = (portfolio: AdminPortfolioItem) => {
    onOpenConfirmation({
      isOpen: true,
      title: 'Unpublish Portfolio?',
      message: `Are you sure you want to unpublish "${portfolio.title || 'Untitled'}" (slug: ${portfolio.slug})? The portfolio will immediately be converted to a private draft and revoked from public access. The student's projects and content will NOT be deleted.`,
      confirmLabel: 'Unpublish Portfolio',
      confirmVariant: 'warning',
      onConfirm: async () => {
        const res = await adminService.unpublishPortfolio(
          portfolio.id,
          `Administrative unpublish of portfolio ${portfolio.id} (${portfolio.slug})`,
        )
        if (res.error) {
          alert(`Failed to unpublish: ${res.error.message}`)
        } else {
          await fetchPortfolios()
          if (selectedPortfolio?.id === portfolio.id) {
            setSelectedPortfolio({ ...portfolio, publicationStatus: 'draft' })
          }
        }
      },
    })
  }

  // Handle Delete Portfolio
  const handleDeletePortfolio = (portfolio: AdminPortfolioItem) => {
    onOpenConfirmation({
      isOpen: true,
      title: 'Permanently Delete Portfolio?',
      message: `Are you sure you want to permanently delete "${portfolio.title || 'Untitled'}" belonging to ${portfolio.ownerName}? All associated cloud portfolio data and project associations will be completely removed. This cannot be undone.`,
      confirmLabel: 'Delete Portfolio',
      confirmVariant: 'danger',
      onConfirm: async () => {
        const res = await adminService.deletePortfolio(
          portfolio.id,
          `Administrative deletion of portfolio ${portfolio.id} (${portfolio.title})`,
        )
        if (res.error) {
          alert(`Failed to delete portfolio: ${res.error.message}`)
        } else {
          await fetchPortfolios()
          if (selectedPortfolio?.id === portfolio.id) {
            setSelectedPortfolio(null)
          }
        }
      },
    })
  }

  // Export CSV
  const handleExportCsv = () => {
    if (data?.items && data.items.length > 0) {
      adminService.exportPortfoliosCsv(data.items)
    }
  }

  // Resolve authentic public URL
  const getPublicUrl = (portfolio: AdminPortfolioItem) => {
    if (portfolio.customHostname) return `https://${portfolio.customHostname}`
    if (portfolio.slug) return buildSubdomainUrl(portfolio.slug)
    return `${getBaseAppUrl()}/p/${portfolio.id}`
  }

  const getInternalPath = (portfolio: AdminPortfolioItem) => {
    if (portfolio.slug) return `/p/${portfolio.slug}`
    return `/p/${portfolio.id}`
  }

  // Filtered items (client-side domain filter if requested)
  const displayItems = useMemo(() => {
    if (!data?.items) return []
    if (domainFilter === 'custom') {
      return data.items.filter((p) => Boolean(p.customHostname))
    }
    if (domainFilter === 'subdomain') {
      return data.items.filter((p) => Boolean(p.slug && !p.customHostname))
    }
    return data.items
  }, [data?.items, domainFilter])

  // Summary Metrics derived from loaded authentic data
  const metrics = useMemo(() => {
    const total = data?.total || 0
    const items = data?.items || []
    const published = items.filter((p) => p.publicationStatus === 'published').length
    const drafts = items.filter((p) => p.publicationStatus === 'draft').length
    const customDomains = items.filter((p) => Boolean(p.customHostname)).length

    // Theme frequency
    const themeCounts: Record<string, number> = {}
    items.forEach((p) => {
      const t = p.theme || 'midnight'
      themeCounts[t] = (themeCounts[t] || 0) + 1
    })
    let topTheme = 'midnight'
    let maxThemeCount = 0
    Object.entries(themeCounts).forEach(([t, count]) => {
      if (count > maxThemeCount) {
        maxThemeCount = count
        topTheme = t
      }
    })

    return {
      total,
      published,
      drafts,
      customDomains,
      topTheme,
    }
  }, [data])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Dynamic Telemetry Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Portfolio Studio &amp; Domain Management
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-Time Dynamic Data
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real database portfolios, verified public links, custom domain claims, and interactive device appearance inspector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Grid Cards vs Data Table */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Visual Cards Appearance"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact Table Mode"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={!data?.items.length}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={fetchPortfolios}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-xs cursor-pointer"
            title={`Last refreshed at ${lastRefreshed.toLocaleTimeString()}`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dynamic Platform Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Portfolios</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics.total.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">All student portfolios created</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Published Live</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-700">
              {metrics.published.toLocaleString()}
            </span>
            {metrics.total > 0 && (
              <span className="text-xs font-medium text-emerald-600">
                ({Math.round((metrics.published / Math.max(1, metrics.total)) * 100)}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active sites publicly accessible</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Private Drafts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">
            {metrics.drafts.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Unpublished student work-in-progress</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Leading Appearance</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: THEME_CONFIGS[metrics.topTheme]?.dotColor || '#2563EB' }}
            />
            <span className="text-base font-bold text-slate-900 capitalize">
              {THEME_CONFIGS[metrics.topTheme]?.label || 'Midnight'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Most selected student theme</p>
        </div>
      </div>

      {/* Interactive Filters & Appearance Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, public slug, student name, or email..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </form>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Live</option>
              <option value="draft">Private Drafts</option>
            </select>

            {/* Domain Dropdown */}
            <select
              value={domainFilter}
              onChange={(e) => {
                setDomainFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Domains</option>
              <option value="custom">Custom Hostnames</option>
              <option value="subdomain">Standard Subdomains</option>
            </select>

            {/* Sorting Dropdown */}
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split(':')
                setSortBy(sb)
                setSortDir(sd as 'asc' | 'desc')
                setCurrentPage(1)
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="created_at:desc">Newest First</option>
              <option value="created_at:asc">Oldest First</option>
              <option value="title:asc">Title (A-Z)</option>
              <option value="owner:asc">Owner (A-Z)</option>
              <option value="published_at:desc">Recently Published</option>
            </select>
          </div>
        </div>

        {/* Visual Theme Pills Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Themes:
          </span>
          <button
            onClick={() => {
              setThemeFilter('all')
              setCurrentPage(1)
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              themeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            All Themes
          </button>
          {Object.entries(THEME_CONFIGS).map(([key, cfg]) => {
            const isSelected = themeFilter === key
            return (
              <button
                key={key}
                onClick={() => {
                  setThemeFilter(key)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.dotColor }}
                />
                <span>{cfg.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Unable to query portfolios:</span> {error}
          </div>
          <button
            onClick={fetchPortfolios}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-medium text-xs hover:bg-rose-100/50 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content Area: Visual Cards (Grid) Mode or High-Density Table Mode */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="space-y-2">
                <div className="w-3/4 h-4 bg-slate-200 rounded" />
                <div className="w-1/2 h-3 bg-slate-100 rounded" />
              </div>
              <div className="h-9 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
          <Globe className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Portfolios Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' || themeFilter !== 'all'
              ? 'No student portfolios matched your active filter or search criteria.'
              : 'No portfolio records currently exist in the database. New creations will appear here in real-time.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Visual Cards Grid Mode (Stunning Appearance) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((portfolio) => {
            const isPublished = portfolio.publicationStatus === 'published'
            const publicUrl = getPublicUrl(portfolio)
            const themeCfg = THEME_CONFIGS[portfolio.theme] || THEME_CONFIGS.midnight
            const rawData = portfolio.portfolioData || {}
            const projects = Array.isArray((rawData as any)?.projects) ? (rawData as any).projects : []

            return (
              <div
                key={portfolio.id}
                onClick={() => setSelectedPortfolio(portfolio)}
                className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400/80 transition-all overflow-hidden flex flex-col cursor-pointer"
              >
                {/* Theme Header Banner with Appearance Gradient */}
                <div className={`p-4 bg-gradient-to-r ${themeCfg.bannerGradient} relative text-white flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-white/30"
                      style={{ backgroundColor: themeCfg.dotColor }}
                    />
                    <span className="text-xs font-semibold tracking-wide capitalize">
                      {themeCfg.label}
                    </span>
                  </div>

                  {isPublished ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live Web Site
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-300">
                      Private Draft
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                      {portfolio.title || (rawData as any)?.profile?.title || 'Personal Portfolio'}
                    </h3>

                    {/* Owner & Student ID */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {portfolio.ownerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs font-medium text-slate-800 truncate">{portfolio.ownerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{portfolio.ownerEmail}</p>
                      </div>
                    </div>

                    {/* Public Slug & Domain Address */}
                    <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2 font-mono text-[11px] text-slate-600">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{portfolio.customHostname || (portfolio.slug ? `/${portfolio.slug}` : `ID: ${portfolio.id.slice(0, 8)}`)}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopyLink(publicUrl, portfolio.id)
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white transition-all shrink-0 cursor-pointer"
                        title="Copy Public Link"
                      >
                        {copiedId === portfolio.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Showcased Projects & Tech Stack Chips */}
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                      <FolderGit2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{portfolio.projectCount || projects.length} Showcase Projects</span>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPortfolio(portfolio)
                        setModalTab('preview')
                      }}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      Inspect &amp; Preview
                    </button>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {isPublished && (
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Open Live Site in New Window"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {isPublished && (
                        <button
                          onClick={() => handleUnpublish(portfolio)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          title="Unpublish to Draft"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePortfolio(portfolio)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Portfolio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* High-Density Table Mode */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Portfolio Title</th>
                  <th className="py-3 px-4">Owner / Student</th>
                  <th className="py-3 px-4">Status &amp; Slug</th>
                  <th className="py-3 px-4">Theme &amp; Appearance</th>
                  <th className="py-3 px-4">Projects</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayItems.map((portfolio) => {
                  const isPublished = portfolio.publicationStatus === 'published'
                  const publicUrl = isPublished ? getPublicUrl(portfolio) : null
                  const themeCfg = THEME_CONFIGS[portfolio.theme] || THEME_CONFIGS.midnight

                  return (
                    <tr
                      key={portfolio.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPortfolio(portfolio)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                          <Globe className={`w-4 h-4 shrink-0 ${isPublished ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span>{portfolio.title || 'Untitled Portfolio'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{portfolio.ownerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{portfolio.ownerEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Live Site
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                              Draft
                            </span>
                          )}
                          {portfolio.slug && (
                            <div className="text-[11px] font-mono text-slate-500">
                              /{portfolio.slug}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${themeCfg.badgeClass}`}>
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: themeCfg.dotColor }}
                          />
                          <span className="capitalize">{themeCfg.label.split(' ')[0]}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{portfolio.projectCount}</span>
                        <span className="text-[10px] text-slate-400 ml-1">projects</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {portfolio.createdAt ? new Date(portfolio.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPortfolio(portfolio)
                              setModalTab('preview')
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Inspect Appearance & Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isPublished && publicUrl && (
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Preview Live Site in New Window"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          {isPublished && (
                            <button
                              onClick={() => handleUnpublish(portfolio)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                              title="Revoke Public Link (Unpublish)"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeletePortfolio(portfolio)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Portfolio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-500 shadow-xs">
          <div>
            Showing <span className="font-semibold text-slate-800">{(data.page - 1) * data.pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(data.page * data.pageSize, data.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-800">{data.total}</span> portfolios
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={data.page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-slate-700">
              Page {data.page} of {data.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={data.page >= data.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Appearance & Live Device Preview Modal */}
      {selectedPortfolio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  selectedPortfolio.publicationStatus === 'published'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedPortfolio.title || 'Untitled Portfolio'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      selectedPortfolio.publicationStatus === 'published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedPortfolio.publicationStatus === 'published' ? 'Live on Web' : 'Private Draft'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Owner: {selectedPortfolio.ownerName} ({selectedPortfolio.ownerEmail})
                  </span>
                </div>
              </div>

              {/* View Selector & Device Switcher */}
              <div className="flex items-center gap-3">
                {/* Modal Tab Switcher */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs">
                  <button
                    onClick={() => setModalTab('preview')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      modalTab === 'preview'
                        ? 'bg-white text-blue-600 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Live Preview
                  </button>
                  <button
                    onClick={() => setModalTab('appearance')}
                    className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      modalTab === 'appearance'
                        ? 'bg-white text-blue-600 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Appearance &amp; Specs
                  </button>
                </div>

                {/* Device Viewport Selector (Available in Preview Tab) */}
                {modalTab === 'preview' && (
                  <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-xl text-xs">
                    <button
                      onClick={() => setDeviceMode('desktop')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        deviceMode === 'desktop' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                      }`}
                      title="Desktop (Full Width)"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeviceMode('tablet')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        deviceMode === 'tablet' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                      }`}
                      title="Tablet Viewport (768px)"
                    >
                      <Tablet className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeviceMode('mobile')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        deviceMode === 'mobile' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                      }`}
                      title="Mobile Viewport (390px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setSelectedPortfolio(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4">
              {modalTab === 'preview' ? (
                /* Live Interactive Preview Screen */
                <div className="h-full flex flex-col items-center justify-center">
                  <div
                    className={`h-full bg-white rounded-xl shadow-lg border border-slate-300/80 overflow-hidden transition-all duration-300 flex flex-col ${
                      deviceMode === 'mobile'
                        ? 'w-[390px] max-w-full rounded-[32px] border-[6px] border-slate-800'
                        : deviceMode === 'tablet'
                        ? 'w-[768px] max-w-full rounded-[24px] border-[6px] border-slate-700'
                        : 'w-full'
                    }`}
                  >
                    {/* Simulated Browser URL bar */}
                    <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="flex-1 text-center font-mono text-[11px] bg-white py-1 px-3 rounded-lg border border-slate-200 text-slate-700 truncate">
                        {getPublicUrl(selectedPortfolio)}
                      </div>
                      <button
                        onClick={() => handleCopyLink(getPublicUrl(selectedPortfolio), selectedPortfolio.id)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-200 cursor-pointer"
                        title="Copy Public URL"
                      >
                        {copiedId === selectedPortfolio.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Iframe rendering the real public / preview portfolio page */}
                    <div className="flex-1 w-full h-full bg-white relative">
                      <iframe
                        src={getInternalPath(selectedPortfolio)}
                        title={`Preview of ${selectedPortfolio.title}`}
                        className="w-full h-full border-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Appearance & Design System Inspector */
                <div className="max-w-3xl mx-auto space-y-4">
                  {/* Theme Design System Card */}
                  {(() => {
                    const themeCfg = THEME_CONFIGS[selectedPortfolio.theme] || THEME_CONFIGS.midnight
                    return (
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-blue-600" />
                            <h4 className="font-bold text-slate-900 text-sm">Theme &amp; Appearance Specs</h4>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${themeCfg.badgeClass}`}>
                            {themeCfg.label}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">
                          {themeCfg.description}
                        </p>

                        {/* Palette Swatches */}
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                            Color Palette Swatches
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                              <div
                                className="w-full h-6 rounded-lg shadow-inner"
                                style={{ backgroundColor: themeCfg.primaryColor }}
                              />
                              <span className="text-[10px] text-slate-400 block">Primary Accent</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{themeCfg.primaryColor}</span>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                              <div
                                className="w-full h-6 rounded-lg shadow-inner"
                                style={{ backgroundColor: themeCfg.accentColor }}
                              />
                              <span className="text-[10px] text-slate-400 block">Secondary Accent</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{themeCfg.accentColor}</span>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                              <div
                                className="w-full h-6 rounded-lg shadow-inner border border-slate-300"
                                style={{ backgroundColor: themeCfg.bgColor }}
                              />
                              <span className="text-[10px] text-slate-400 block">Canvas Background</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{themeCfg.bgColor}</span>
                            </div>

                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                              <div
                                className="w-full h-6 rounded-lg shadow-inner"
                                style={{ backgroundColor: themeCfg.textColor }}
                              />
                              <span className="text-[10px] text-slate-400 block">Main Typography</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{themeCfg.textColor}</span>
                            </div>
                          </div>
                        </div>

                        {/* Font Specification */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Font Family:</span>
                          <span className="font-mono font-semibold text-slate-800">{themeCfg.fontFamily}</span>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Showcased Projects Breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FolderGit2 className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-slate-900 text-sm">
                          Showcased Projects ({selectedPortfolio.projectCount || 0})
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Real Dynamic Content</span>
                    </div>

                    {(() => {
                      const rawData = selectedPortfolio.portfolioData || {}
                      const projects = Array.isArray((rawData as any)?.projects) ? (rawData as any).projects : []
                      if (projects.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 py-3 text-center">
                            No projects currently populated in this portfolio record.
                          </p>
                        )
                      }
                      return (
                        <div className="space-y-2.5">
                          {projects.map((proj: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 text-xs">{proj.title || `Project #${idx + 1}`}</span>
                                <div className="flex items-center gap-2">
                                  {proj.liveUrl && (
                                    <a
                                      href={proj.liveUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-[11px] flex items-center gap-0.5"
                                    >
                                      Live Demo <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                  {proj.githubUrl && (
                                    <a
                                      href={proj.githubUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-slate-600 hover:underline text-[11px] flex items-center gap-0.5"
                                    >
                                      GitHub <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                              {proj.description && (
                                <p className="text-xs text-slate-600 line-clamp-2">{proj.description}</p>
                              )}
                              {Array.isArray(proj.technologies) && proj.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {proj.technologies.map((t: string, ti: number) => (
                                    <span key={ti} className="px-2 py-0.5 rounded-md text-[10px] bg-white border border-slate-200 text-slate-700 font-medium">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Student Owner & Identity Data */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-slate-900 text-sm">Author Profile &amp; Contact</h4>
                      </div>
                      {onNavigateToUser && (
                        <button
                          onClick={() => {
                            setSelectedPortfolio(null)
                            onNavigateToUser(selectedPortfolio.userId)
                          }}
                          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View Full User Profile <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block mb-0.5 text-[11px]">Display Name</span>
                        <span className="font-bold text-slate-800">{selectedPortfolio.ownerName}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block mb-0.5 text-[11px]">Registered Email</span>
                        <span className="font-mono text-slate-800">{selectedPortfolio.ownerEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata & Timestamps */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-xs space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Created Timestamp:</span>
                      <span className="font-mono font-medium">{new Date(selectedPortfolio.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedPortfolio.publishedAt && (
                      <div className="flex justify-between text-slate-600">
                        <span>Published Timestamp:</span>
                        <span className="font-mono font-medium">{new Date(selectedPortfolio.publishedAt).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Last Updated:</span>
                      <span className="font-mono font-medium">{new Date(selectedPortfolio.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={getPublicUrl(selectedPortfolio)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-medium text-xs hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Live in New Tab
                </a>
                <button
                  onClick={() => handleCopyLink(getPublicUrl(selectedPortfolio), selectedPortfolio.id)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  {copiedId === selectedPortfolio.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Public URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedPortfolio.publicationStatus === 'published' && (
                  <button
                    onClick={() => handleUnpublish(selectedPortfolio)}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-medium text-xs hover:bg-amber-100 transition-all cursor-pointer"
                  >
                    Unpublish to Draft
                  </button>
                )}
                <button
                  onClick={() => handleDeletePortfolio(selectedPortfolio)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-all shadow-xs cursor-pointer"
                >
                  Delete Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminPortfoliosView
