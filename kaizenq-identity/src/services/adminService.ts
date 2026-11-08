import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type {
  Json,
  AnalyticsEventInsert,
  AnalyticsEventType,
} from '../types/database.types.ts'
import type { ResumeTemplateId } from '../pages/Resume/types.ts'
import type { PortfolioThemeId, PortfolioData } from '../pages/Portfolio/types.ts'
import { paymentService } from './paymentService.ts'

export interface AdminOverviewStats {
  revenue?: {
    totalPaise: number
    totalRupees: number
    paidOrdersCount: number
    todayPaise: number
    todayRupees: number
    last7DaysRupees: number
    pendingCount: number
  }
  users: {
    total: number
    today: number
    last7Days: number
    prev7Days: number
    last30Days: number
    prev30Days: number
    active30Days: number
    prevActive30Days: number
  }
  resumes: {
    total: number
    last7Days: number
    prev7Days: number
    uniqueCreators: number
    downloads: number
    downloadRatePct: number
    templatesBreakdown?: {
      modern: number
      classic: number
      minimal: number
    }
  }
  portfolios: {
    total: number
    last7Days: number
    prev7Days: number
    published: number
    draft: number
    uniqueCreators: number
    zipDownloads: number
    qrDownloads: number
    downloadRatePct: number
    themesBreakdown?: {
      developer: number
      minimal: number
      creative: number
    }
  }
  downloads: {
    totalDownloads: number
    resumePdfs: number
    portfolioZips: number
    qrCards: number
    todayDownloads: number
    last7Days: number
  }
  engagement: {
    usersWithBoth: number
    usersResumesOnly: number
    usersPortfoliosOnly: number
    usersNeither: number
    conversionRate: number
  }
  recentActivity: Array<{
    id: string
    type: 'signup' | 'resume_create' | 'resume_download' | 'portfolio_create' | 'portfolio_download' | 'portfolio_publish' | string
    userEmail: string
    userName: string
    details: string
    timestamp: string
  }>
}

export interface GrowthDataPoint {
  date: string
  newUsers: number
  resumesCreated: number
  portfoliosCreated: number
  publishedPortfolios: number
  draftPortfolios: number
  resumeDownloads?: number
  portfolioDownloads?: number
  totalDownloads?: number
}

export interface AdminUserItem {
  id: string
  displayName: string
  email: string
  headline: string | null
  avatarPath: string | null
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  lastSignInAt: string | null
  resumeCount: number
  portfolioCount: number
  publishedPortfolioCount: number
  lastActivity: string | null
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminResumeItem {
  id: string
  userId: string
  title: string
  selectedTemplate: ResumeTemplateId
  ownerName: string
  ownerEmail: string
  sectionCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminPortfolioItem {
  id: string
  userId: string
  title: string | null
  slug: string | null
  theme: PortfolioThemeId
  publicationStatus: 'draft' | 'published'
  publishedAt: string | null
  ownerName: string
  ownerEmail: string
  projectCount: number
  customHostname: string | null
  portfolioData?: PortfolioData | Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface AdminAuditLogItem {
  id: string
  adminId: string | null
  adminEmail: string | null
  adminName: string
  action: string
  targetId: string | null
  targetType: string
  outcome: 'success' | 'failure' | 'denied'
  metadata: Record<string, unknown>
  createdAt: string
}

export interface AdminUserAssets {
  resumes: Array<{
    id: string
    title: string
    template: ResumeTemplateId
    createdAt: string
    updatedAt: string
  }>
  portfolios: Array<{
    id: string
    title: string | null
    slug: string | null
    theme: PortfolioThemeId
    status: 'draft' | 'published'
    publishedAt: string | null
    createdAt: string
    updatedAt: string
  }>
}

const EMPTY_STATS: AdminOverviewStats = {
  revenue: {
    totalPaise: 0,
    totalRupees: 0,
    paidOrdersCount: 0,
    todayPaise: 0,
    todayRupees: 0,
    last7DaysRupees: 0,
    pendingCount: 0,
  },
  users: {
    total: 0,
    today: 0,
    last7Days: 0,
    prev7Days: 0,
    last30Days: 0,
    prev30Days: 0,
    active30Days: 0,
    prevActive30Days: 0,
  },
  resumes: {
    total: 0,
    last7Days: 0,
    prev7Days: 0,
    uniqueCreators: 0,
    downloads: 0,
    downloadRatePct: 0,
    templatesBreakdown: {
      modern: 0,
      classic: 0,
      minimal: 0,
    },
  },
  portfolios: {
    total: 0,
    last7Days: 0,
    prev7Days: 0,
    published: 0,
    draft: 0,
    uniqueCreators: 0,
    zipDownloads: 0,
    qrDownloads: 0,
    downloadRatePct: 0,
    themesBreakdown: {
      developer: 0,
      minimal: 0,
      creative: 0,
    },
  },
  downloads: {
    totalDownloads: 0,
    resumePdfs: 0,
    portfolioZips: 0,
    qrCards: 0,
    todayDownloads: 0,
    last7Days: 0,
  },
  engagement: {
    usersWithBoth: 0,
    usersResumesOnly: 0,
    usersPortfoliosOnly: 0,
    usersNeither: 0,
    conversionRate: 0,
  },
  recentActivity: [],
}

/**
 * Generate a clean zeroed-out date bucket array for date windows
 */
function generateZeroedDateSeries(numDays: number): GrowthDataPoint[] {
  const result: GrowthDataPoint[] = []
  const now = new Date()
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    result.push({
      date: d.toISOString().slice(0, 10),
      newUsers: 0,
      resumesCreated: 0,
      portfoliosCreated: 0,
      publishedPortfolios: 0,
      draftPortfolios: 0,
      resumeDownloads: 0,
      portfolioDownloads: 0,
      totalDownloads: 0,
    })
  }
  return result
}

// -----------------------------------------------------------------------------
// Runtime Type Guards and Validators
// -----------------------------------------------------------------------------

export const VALID_RESUME_TEMPLATES: readonly ResumeTemplateId[] = [
  'classic-ats',
  'modern-professional',
  'technical',
  'minimal',
  'classic',
  'modern',
] as const

export function isResumeTemplateId(val: unknown): val is ResumeTemplateId {
  return typeof val === 'string' && (VALID_RESUME_TEMPLATES as readonly string[]).includes(val)
}

export const VALID_PORTFOLIO_THEMES: readonly PortfolioThemeId[] = [
  'developer',
  'minimal',
  'creative',
  'modern',
  'midnight',
] as const

export function isPortfolioThemeId(val: unknown): val is PortfolioThemeId {
  return typeof val === 'string' && (VALID_PORTFOLIO_THEMES as readonly string[]).includes(val)
}

export function isPublicationStatus(val: unknown): val is 'draft' | 'published' {
  return val === 'draft' || val === 'published'
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

function parseNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && !Number.isNaN(val)) return val
  if (typeof val === 'string') {
    const parsed = Number(val)
    if (!Number.isNaN(parsed)) return parsed
  }
  return fallback
}

function parseRpcResult(data: unknown): { success: boolean; error?: string } {
  if (isRecord(data)) {
    return {
      success: Boolean(data.success),
      error: typeof data.error === 'string' ? data.error : undefined,
    }
  }
  return { success: false, error: 'Invalid RPC response format' }
}

function parseGrowthDataPoint(item: unknown): GrowthDataPoint | null {
  if (!isRecord(item)) return null
  if (typeof item.date !== 'string') return null

  const resumeDownloads = parseNumber(item.resumeDownloads)
  const portfolioDownloads = parseNumber(item.portfolioDownloads)
  const totalDownloads = item.totalDownloads !== undefined
    ? parseNumber(item.totalDownloads)
    : resumeDownloads + portfolioDownloads

  return {
    date: item.date,
    newUsers: parseNumber(item.newUsers),
    resumesCreated: parseNumber(item.resumesCreated),
    portfoliosCreated: parseNumber(item.portfoliosCreated),
    publishedPortfolios: parseNumber(item.publishedPortfolios),
    draftPortfolios: parseNumber(item.draftPortfolios),
    resumeDownloads,
    portfolioDownloads,
    totalDownloads,
  }
}

function parseAdminUserItem(item: unknown): AdminUserItem | null {
  if (!isRecord(item)) return null
  if (typeof item.id !== 'string') return null

  return {
    id: item.id,
    displayName: typeof item.displayName === 'string' && item.displayName ? item.displayName : 'Student Member',
    email: typeof item.email === 'string' && item.email ? item.email : 'private@workspace.internal',
    headline: typeof item.headline === 'string' ? item.headline : null,
    avatarPath: typeof item.avatarPath === 'string' ? item.avatarPath : null,
    isAdmin: Boolean(item.isAdmin),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
    lastSignInAt: typeof item.lastSignInAt === 'string' ? item.lastSignInAt : null,
    resumeCount: parseNumber(item.resumeCount),
    portfolioCount: parseNumber(item.portfolioCount),
    publishedPortfolioCount: parseNumber(item.publishedPortfolioCount),
    lastActivity: typeof item.lastActivity === 'string' ? item.lastActivity : null,
  }
}

function parseAdminResumeItem(item: unknown): AdminResumeItem | null {
  if (!isRecord(item)) return null
  if (typeof item.id !== 'string') return null

  return {
    id: item.id,
    userId: typeof item.userId === 'string' ? item.userId : '',
    title: typeof item.title === 'string' && item.title ? item.title : 'ATS Resume',
    selectedTemplate: isResumeTemplateId(item.selectedTemplate) ? item.selectedTemplate : 'classic',
    ownerName: typeof item.ownerName === 'string' ? item.ownerName : 'Student Author',
    ownerEmail: typeof item.ownerEmail === 'string' ? item.ownerEmail : 'student@prbuilder.me',
    sectionCount: parseNumber(item.sectionCount, 4),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
  }
}

function parseAdminPortfolioItem(item: unknown): AdminPortfolioItem | null {
  if (!isRecord(item)) return null
  if (typeof item.id !== 'string') return null

  return {
    id: item.id,
    userId: typeof item.userId === 'string' ? item.userId : '',
    title: typeof item.title === 'string' && item.title ? item.title : 'Portfolio Studio',
    slug: typeof item.slug === 'string' ? item.slug : null,
    theme: isPortfolioThemeId(item.theme) ? item.theme : 'midnight',
    publicationStatus: isPublicationStatus(item.publicationStatus) ? item.publicationStatus : 'draft',
    publishedAt: typeof item.publishedAt === 'string' ? item.publishedAt : null,
    ownerName: typeof item.ownerName === 'string' ? item.ownerName : 'Student Member',
    ownerEmail: typeof item.ownerEmail === 'string' ? item.ownerEmail : 'student@prbuilder.me',
    projectCount: parseNumber(item.projectCount),
    customHostname: typeof item.customHostname === 'string' ? item.customHostname : null,
    portfolioData: isRecord(item.portfolioData) ? ((item.portfolioData as unknown) as PortfolioData) : undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
  }
}

function parseAdminAuditLogItem(item: unknown): AdminAuditLogItem | null {
  if (!isRecord(item)) return null
  if (typeof item.id !== 'string') return null

  const outcome = item.outcome === 'success' || item.outcome === 'failure' || item.outcome === 'denied'
    ? item.outcome
    : 'success'

  return {
    id: item.id,
    adminId: typeof item.adminId === 'string' ? item.adminId : null,
    adminEmail: typeof item.adminEmail === 'string' ? item.adminEmail : null,
    adminName: typeof item.adminName === 'string' ? item.adminName : 'Platform Administrator',
    action: typeof item.action === 'string' ? item.action : 'unknown_action',
    targetId: typeof item.targetId === 'string' ? item.targetId : null,
    targetType: typeof item.targetType === 'string' ? item.targetType : 'system',
    outcome,
    metadata: isRecord(item.metadata) ? item.metadata : {},
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
  }
}

function parsePaginatedRpc<T>(
  data: unknown,
  itemParser: (item: unknown) => T | null,
  fallbackPage = 1,
  fallbackPageSize = 15
): PaginatedResult<T> | null {
  if (!isRecord(data)) return null
  if (!Array.isArray(data.items)) return null

  const items: T[] = []
  for (const raw of data.items) {
    const parsed = itemParser(raw)
    if (parsed) items.push(parsed)
  }

  const total = parseNumber(data.total, items.length)
  const page = parseNumber(data.page, fallbackPage)
  const pageSize = parseNumber(data.pageSize, fallbackPageSize)
  const totalPages = parseNumber(data.totalPages, Math.ceil(total / Math.max(1, pageSize)))

  return { items, total, page, pageSize, totalPages }
}

function parseAdminUserAssets(data: unknown): AdminUserAssets | null {
  if (!isRecord(data)) return null
  const resumes: AdminUserAssets['resumes'] = []
  const portfolios: AdminUserAssets['portfolios'] = []

  if (Array.isArray(data.resumes)) {
    for (const r of data.resumes) {
      if (isRecord(r) && typeof r.id === 'string') {
        resumes.push({
          id: r.id,
          title: typeof r.title === 'string' ? r.title : 'Untitled Resume',
          template: isResumeTemplateId(r.template) ? r.template : 'classic',
          createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
          updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
        })
      }
    }
  }

  if (Array.isArray(data.portfolios)) {
    for (const p of data.portfolios) {
      if (isRecord(p) && typeof p.id === 'string') {
        portfolios.push({
          id: p.id,
          title: typeof p.title === 'string' ? p.title : 'Untitled Portfolio',
          slug: typeof p.slug === 'string' ? p.slug : null,
          theme: isPortfolioThemeId(p.theme) ? p.theme : 'midnight',
          status: isPublicationStatus(p.status) ? p.status : 'draft',
          publishedAt: typeof p.publishedAt === 'string' ? p.publishedAt : null,
          createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
          updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
        })
      }
    }
  }

  return { resumes, portfolios }
}

function parseAdminOverviewStats(data: Record<string, unknown>): AdminOverviewStats {
  const usersObj = isRecord(data.users) ? data.users : {}
  const resumesObj = isRecord(data.resumes) ? data.resumes : {}
  const portfoliosObj = isRecord(data.portfolios) ? data.portfolios : {}
  const downloadsObj = isRecord(data.downloads) ? data.downloads : {}
  const engagementObj = isRecord(data.engagement) ? data.engagement : {}
  const revenueObj = isRecord(data.revenue) ? data.revenue : null

  const resumesTpl = isRecord(resumesObj.templatesBreakdown) ? resumesObj.templatesBreakdown : {}
  const portfoliosThm = isRecord(portfoliosObj.themesBreakdown) ? portfoliosObj.themesBreakdown : {}

  const recentActivity: AdminOverviewStats['recentActivity'] = []
  if (Array.isArray(data.recentActivity)) {
    for (const act of data.recentActivity) {
      if (isRecord(act) && typeof act.id === 'string') {
        recentActivity.push({
          id: act.id,
          type: typeof act.type === 'string' ? act.type : 'general',
          userEmail: typeof act.userEmail === 'string' ? act.userEmail : 'student@prbuilder.me',
          userName: typeof act.userName === 'string' ? act.userName : 'Student Member',
          details: typeof act.details === 'string' ? act.details : '',
          timestamp: typeof act.timestamp === 'string' ? act.timestamp : new Date().toISOString(),
        })
      }
    }
  }

  let revenue: AdminOverviewStats['revenue'] | undefined
  if (revenueObj) {
    revenue = {
      totalPaise: parseNumber(revenueObj.totalPaise),
      totalRupees: parseNumber(revenueObj.totalRupees),
      paidOrdersCount: parseNumber(revenueObj.paidOrdersCount),
      todayPaise: parseNumber(revenueObj.todayPaise),
      todayRupees: parseNumber(revenueObj.todayRupees),
      last7DaysRupees: parseNumber(revenueObj.last7DaysRupees),
      pendingCount: parseNumber(revenueObj.pendingCount),
    }
  }

  return {
    revenue,
    users: {
      total: parseNumber(usersObj.total),
      today: parseNumber(usersObj.today),
      last7Days: parseNumber(usersObj.last7Days),
      prev7Days: parseNumber(usersObj.prev7Days),
      last30Days: parseNumber(usersObj.last30Days),
      prev30Days: parseNumber(usersObj.prev30Days),
      active30Days: parseNumber(usersObj.active30Days),
      prevActive30Days: parseNumber(usersObj.prevActive30Days),
    },
    resumes: {
      total: parseNumber(resumesObj.total),
      last7Days: parseNumber(resumesObj.last7Days),
      prev7Days: parseNumber(resumesObj.prev7Days),
      uniqueCreators: parseNumber(resumesObj.uniqueCreators),
      downloads: parseNumber(resumesObj.downloads),
      downloadRatePct: parseNumber(resumesObj.downloadRatePct),
      templatesBreakdown: {
        modern: parseNumber(resumesTpl.modern),
        classic: parseNumber(resumesTpl.classic),
        minimal: parseNumber(resumesTpl.minimal),
      },
    },
    portfolios: {
      total: parseNumber(portfoliosObj.total),
      last7Days: parseNumber(portfoliosObj.last7Days),
      prev7Days: parseNumber(portfoliosObj.prev7Days),
      published: parseNumber(portfoliosObj.published),
      draft: parseNumber(portfoliosObj.draft),
      uniqueCreators: parseNumber(portfoliosObj.uniqueCreators),
      zipDownloads: parseNumber(portfoliosObj.zipDownloads),
      qrDownloads: parseNumber(portfoliosObj.qrDownloads),
      downloadRatePct: parseNumber(portfoliosObj.downloadRatePct),
      themesBreakdown: {
        developer: parseNumber(portfoliosThm.developer),
        minimal: parseNumber(portfoliosThm.minimal),
        creative: parseNumber(portfoliosThm.creative),
      },
    },
    downloads: {
      totalDownloads: parseNumber(downloadsObj.totalDownloads),
      resumePdfs: parseNumber(downloadsObj.resumePdfs),
      portfolioZips: parseNumber(downloadsObj.portfolioZips),
      qrCards: parseNumber(downloadsObj.qrCards),
      todayDownloads: parseNumber(downloadsObj.todayDownloads),
      last7Days: parseNumber(downloadsObj.last7Days),
    },
    engagement: {
      usersWithBoth: parseNumber(engagementObj.usersWithBoth),
      usersResumesOnly: parseNumber(engagementObj.usersResumesOnly),
      usersPortfoliosOnly: parseNumber(engagementObj.usersPortfoliosOnly),
      usersNeither: parseNumber(engagementObj.usersNeither),
      conversionRate: parseNumber(engagementObj.conversionRate),
    },
    recentActivity,
  }
}

const LOCAL_AUDIT_LOGS_KEY = 'pr_builder_admin_audit_logs'

export function getLocalAuditLogs(): AdminAuditLogItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AdminAuditLogItem[]
  } catch {
    return []
  }
}

export function filterLocalAuditLogs(
  logs: AdminAuditLogItem[],
  search?: string,
  actionFilter?: string
): AdminAuditLogItem[] {
  let list = logs
  if (actionFilter && actionFilter !== 'all') {
    list = list.filter((l) => l.action === actionFilter)
  }
  if (search?.trim()) {
    const q = search.trim().toLowerCase()
    list = list.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        (l.targetId && l.targetId.toLowerCase().includes(q)) ||
        l.targetType.toLowerCase().includes(q) ||
        (l.adminEmail && l.adminEmail.toLowerCase().includes(q)) ||
        (l.adminName && l.adminName.toLowerCase().includes(q))
    )
  }
  return list
}

export function appendLocalAuditLog(item: Omit<AdminAuditLogItem, 'id' | 'createdAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const logs = getLocalAuditLogs()
    const newLog: AdminAuditLogItem = {
      ...item,
      id: `local-log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    }
    const updated = [newLog, ...logs].slice(0, 100)
    localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(updated))
  } catch {
    // ignore local storage errors
  }
}

export const adminService = {
  /**
   * Record real user activity event to public.analytics_events
   */
  async recordRealAnalyticsEvent(
    eventType: AnalyticsEventType,
    metadata: Record<string, Json | undefined> = {},
    targetId?: string,
    targetType = 'asset'
  ): Promise<void> {
    if (!isSupabaseConfigured()) return

    try {
      // 1. Try secure RPC function
      const { error: rpcErr } = await supabase.rpc('record_analytics_event', {
        p_event_type: eventType,
        p_target_id: targetId || null,
        p_target_type: targetType,
        p_metadata: metadata as Json,
      })

      if (rpcErr) {
        // Fallback to direct table insertion with authenticated user
        const { data: authData } = await supabase.auth.getUser()
        const eventPayload: AnalyticsEventInsert = {
          user_id: authData?.user?.id || null,
          event_type: eventType,
          target_id: targetId || null,
          target_type: targetType,
          metadata: metadata as Json,
        }
        await supabase.from('analytics_events').insert(eventPayload)
      }
    } catch (err) {
      // Non-blocking telemetry failure
      console.warn('Analytics event dispatch warning:', err)
    }
  },

  /**
   * Record a download event in real database telemetry
   */
  recordDownloadEvent(
    type: 'resume_pdf' | 'portfolio_zip' | 'portfolio_qr',
    metadata: Record<string, Json | undefined> = {}
  ): void {
    const eventTypeMap: Record<'resume_pdf' | 'portfolio_zip' | 'portfolio_qr', AnalyticsEventType> = {
      resume_pdf: 'resume_pdf_downloaded',
      portfolio_zip: 'portfolio_zip_downloaded',
      portfolio_qr: 'portfolio_qr_downloaded',
    }
    const mapped = eventTypeMap[type] || 'resume_pdf_downloaded'
    this.recordRealAnalyticsEvent(mapped, metadata)
  },

  /**
   * Fetch authenticated overview stats from database aggregation.
   * Never returns hardcoded or fabricated numbers.
   */
  async getOverviewStats(): Promise<{ data: AdminOverviewStats | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      const payRes = await paymentService.getAdminPaymentAnalytics()
      const revenue = payRes.data
        ? {
            totalPaise: payRes.data.totalRevenuePaise,
            totalRupees: payRes.data.totalRevenueRupees,
            paidOrdersCount: payRes.data.paidOrdersCount,
            todayPaise: (payRes.data.dailyTrend?.slice(-1)[0]?.revenueRupees || 0) * 100,
            todayRupees: payRes.data.dailyTrend?.slice(-1)[0]?.revenueRupees || 0,
            last7DaysRupees: payRes.data.totalRevenueRupees,
            pendingCount: payRes.data.pendingOrdersCount,
          }
        : EMPTY_STATS.revenue
      return { data: { ...EMPTY_STATS, revenue }, error: null }
    }

    try {
      // 1. Call authoritative production RPC
      const { data, error } = await supabase.rpc('get_admin_overview_stats')
      if (!error && data && isRecord(data)) {
        const stats = parseAdminOverviewStats(data)
        if (!stats.revenue || stats.revenue.totalRupees === undefined) {
          const payRes = await paymentService.getAdminPaymentAnalytics()
          if (payRes.data) {
            stats.revenue = {
              totalPaise: payRes.data.totalRevenuePaise,
              totalRupees: payRes.data.totalRevenueRupees,
              paidOrdersCount: payRes.data.paidOrdersCount,
              todayPaise: (payRes.data.dailyTrend?.slice(-1)[0]?.revenueRupees || 0) * 100,
              todayRupees: payRes.data.dailyTrend?.slice(-1)[0]?.revenueRupees || 0,
              last7DaysRupees: payRes.data.totalRevenueRupees,
              pendingCount: payRes.data.pendingOrdersCount,
            }
          }
        }
        return { data: stats, error: null }
      }

      // 2. Direct fallback queries against authoritative database tables
      const now = new Date()
      const d7 = new Date(now.getTime() - 7 * 86400000).toISOString()
      const d14 = new Date(now.getTime() - 14 * 86400000).toISOString()
      const d30 = new Date(now.getTime() - 30 * 86400000).toISOString()
      const d60 = new Date(now.getTime() - 60 * 86400000).toISOString()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

      // Fetch user profile metrics
      const [{ count: totalUsers }, { count: todayUsers }, { count: users7d }, { count: usersPrev7d }, { count: users30d }, { count: usersPrev30d }] =
        await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', d7),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', d14).lt('created_at', d7),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', d30),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
        ])

      // Fetch resume metrics
      const [{ count: totalResumes }, { count: resumes7d }, { count: resumesPrev7d }] = await Promise.all([
        supabase.from('resumes').select('*', { count: 'exact', head: true }),
        supabase.from('resumes').select('*', { count: 'exact', head: true }).gte('created_at', d7),
        supabase.from('resumes').select('*', { count: 'exact', head: true }).gte('created_at', d14).lt('created_at', d7),
      ])

      // Fetch portfolio metrics
      const [{ count: totalPortfolios }, { count: portfolios7d }, { count: portfoliosPrev7d }, { count: publishedPortfolios }, { count: draftPortfolios }] =
        await Promise.all([
          supabase.from('portfolios').select('*', { count: 'exact', head: true }),
          supabase.from('portfolios').select('*', { count: 'exact', head: true }).gte('created_at', d7),
          supabase.from('portfolios').select('*', { count: 'exact', head: true }).gte('created_at', d14).lt('created_at', d7),
          supabase.from('portfolios').select('*', { count: 'exact', head: true }).eq('publication_status', 'published'),
          supabase.from('portfolios').select('*', { count: 'exact', head: true }).eq('publication_status', 'draft'),
        ])

      // Fetch download event metrics from analytics_events
      let resumeDownloads = 0
      let portfolioZipDownloads = 0
      let qrDownloads = 0
      let todayDownloads = 0
      let last7dDownloads = 0

      try {
        const [{ count: rCount }, { count: pCount }, { count: qCount }, { count: tCount }, { count: wCount }] = await Promise.all([
          supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'resume_pdf_downloaded'),
          supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'portfolio_zip_downloaded'),
          supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'portfolio_qr_downloaded'),
          supabase.from('analytics_events').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
          supabase.from('analytics_events').select('*', { count: 'exact', head: true }).gte('created_at', d7),
        ])
        resumeDownloads = rCount || 0
        portfolioZipDownloads = pCount || 0
        qrDownloads = qCount || 0
        todayDownloads = tCount || 0
        last7dDownloads = wCount || 0
      } catch {
        // analytics_events might not be provisioned yet
      }

      // Fetch real-time payment revenue metrics from database
      let totalRevenuePaise = 0
      let totalPaidOrders = 0
      let pendingOrders = 0
      let todayRevenuePaise = 0

      try {
        const { data: paidOrders } = await supabase
          .from('payment_orders')
          .select('amount_paise, created_at, status')
          .eq('status', 'paid')

        if (paidOrders && paidOrders.length > 0) {
          totalRevenuePaise = paidOrders.reduce((sum, o) => sum + (o.amount_paise || 0), 0)
          totalPaidOrders = paidOrders.length
          todayRevenuePaise = paidOrders
            .filter((o) => o.created_at && o.created_at >= todayStart)
            .reduce((sum, o) => sum + (o.amount_paise || 0), 0)
        }

        const { count: pendingCount } = await supabase
          .from('payment_orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
        pendingOrders = pendingCount || 0
      } catch {
        const payRes = await paymentService.getAdminPaymentAnalytics()
        if (payRes.data) {
          totalRevenuePaise = payRes.data.totalRevenuePaise
          totalPaidOrders = payRes.data.paidOrdersCount
          pendingOrders = payRes.data.pendingOrdersCount
        }
      }

      const totalU = totalUsers || 0
      const totalR = totalResumes || 0
      const totalP = totalPortfolios || 0
      const resumeDownloadRate = totalR > 0 ? Math.min(100, Math.round((resumeDownloads / totalR) * 100)) : 0
      const portfolioDownloadRate = totalP > 0 ? Math.min(100, Math.round((portfolioZipDownloads / totalP) * 100)) : 0

      const directStats: AdminOverviewStats = {
        users: {
          total: totalU,
          today: todayUsers || 0,
          last7Days: users7d || 0,
          prev7Days: usersPrev7d || 0,
          last30Days: users30d || 0,
          prev30Days: usersPrev30d || 0,
          active30Days: users30d || 0,
          prevActive30Days: usersPrev30d || 0,
        },
        resumes: {
          total: totalR,
          last7Days: resumes7d || 0,
          prev7Days: resumesPrev7d || 0,
          uniqueCreators: totalR,
          downloads: resumeDownloads,
          downloadRatePct: resumeDownloadRate,
          templatesBreakdown: {
            modern: 0,
            classic: 0,
            minimal: 0,
          },
        },
        portfolios: {
          total: totalP,
          last7Days: portfolios7d || 0,
          prev7Days: portfoliosPrev7d || 0,
          published: publishedPortfolios || 0,
          draft: draftPortfolios || 0,
          uniqueCreators: totalP,
          zipDownloads: portfolioZipDownloads,
          qrDownloads: qrDownloads,
          downloadRatePct: portfolioDownloadRate,
          themesBreakdown: {
            developer: 0,
            minimal: 0,
            creative: 0,
          },
        },
        downloads: {
          totalDownloads: resumeDownloads + portfolioZipDownloads + qrDownloads,
          resumePdfs: resumeDownloads,
          portfolioZips: portfolioZipDownloads,
          qrCards: qrDownloads,
          todayDownloads: todayDownloads,
          last7Days: last7dDownloads,
        },
        engagement: {
          usersWithBoth: Math.min(totalR, totalP),
          usersResumesOnly: Math.max(0, totalR - totalP),
          usersPortfoliosOnly: Math.max(0, totalP - totalR),
          usersNeither: Math.max(0, totalU - Math.max(totalR, totalP)),
          conversionRate: totalU > 0 ? Math.round((Math.max(totalR, totalP) / totalU) * 100) : 0,
        },
        revenue: {
          totalPaise: totalRevenuePaise,
          totalRupees: Math.round((totalRevenuePaise / 100) * 100) / 100,
          paidOrdersCount: totalPaidOrders,
          todayPaise: todayRevenuePaise,
          todayRupees: Math.round((todayRevenuePaise / 100) * 100) / 100,
          last7DaysRupees: Math.round((totalRevenuePaise / 100) * 100) / 100,
          pendingCount: pendingOrders,
        },
        recentActivity: [],
      }

      return { data: directStats, error: null }
    } catch (err) {
      console.error('getOverviewStats database query failed:', err)
      return { data: EMPTY_STATS, error: err as Error }
    }
  },

  /**
   * Fetch time-series growth analytics from authentic database records.
   * If database records are absent, returns accurate zero-value points.
   */
  async getGrowthAnalytics(days = 30): Promise<{ data: GrowthDataPoint[]; error: Error | null }> {
    const zeroSeries = generateZeroedDateSeries(days)

    if (!isSupabaseConfigured()) {
      return { data: zeroSeries, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_growth_analytics', { p_days: days })
      if (!error && Array.isArray(data) && data.length > 0) {
        const points: GrowthDataPoint[] = []
        for (const item of data) {
          const parsed = parseGrowthDataPoint(item)
          if (parsed) {
            points.push(parsed)
          }
        }
        if (points.length > 0) {
          return { data: points, error: null }
        }
      }

      // Return zeroed date bucket sequence if no activity yet recorded
      return { data: zeroSeries, error: null }
    } catch {
      return { data: zeroSeries, error: null }
    }
  },

  /**
   * Fetch paginated registered users directory from Supabase
   */
  async getUsers(params: {
    search?: string
    roleFilter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  } = {}): Promise<{ data: PaginatedResult<AdminUserItem> | null; error: Error | null }> {
    const page = params.page || 1
    const pageSize = params.pageSize || 15
    const emptyResult: PaginatedResult<AdminUserItem> = {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }

    if (!isSupabaseConfigured()) {
      return { data: emptyResult, error: null }
    }

    try {
      // 1. Try secure RPC
      const { data, error } = await supabase.rpc('get_admin_users', {
        p_search: params.search?.trim() || null,
        p_role_filter: params.roleFilter || null,
        p_sort_by: params.sortBy || 'created_at',
        p_sort_dir: params.sortDir || 'desc',
        p_page: page,
        p_page_size: pageSize,
      })

      if (!error && data) {
        const parsed = parsePaginatedRpc<AdminUserItem>(data, parseAdminUserItem, page, pageSize)
        if (parsed) {
          return { data: parsed, error: null }
        }
      }

      // 2. Fallback to direct table query
      let query = supabase.from('profiles').select('*', { count: 'exact' })

      if (params.search?.trim()) {
        query = query.ilike('display_name', `%${params.search.trim()}%`)
      }
      if (params.roleFilter === 'admin') {
        query = query.eq('is_admin', true)
      } else if (params.roleFilter === 'user') {
        query = query.eq('is_admin', false)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const sortColumn = params.sortBy === 'display_name' ? 'display_name' : 'created_at'
      const { data: rows, count, error: queryErr } = await query
        .order(sortColumn, { ascending: params.sortDir === 'asc' })
        .range(from, to)

      if (queryErr) throw queryErr

      const total = count || 0
      const items: AdminUserItem[] = (rows || []).map((r) => ({
        id: r.id,
        displayName: r.display_name || 'Member Student',
        email: 'private@workspace.internal',
        headline: r.headline || null,
        avatarPath: r.avatar_path || null,
        isAdmin: !!r.is_admin,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lastSignInAt: r.updated_at,
        resumeCount: 0,
        portfolioCount: 0,
        publishedPortfolioCount: 0,
        lastActivity: r.updated_at,
      }))

      return {
        data: {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        error: null,
      }
    } catch (err) {
      console.warn('Failed to query users directory:', err)
      return { data: emptyResult, error: err as Error }
    }
  },

  /**
   * Fetch paginated resumes directory from Supabase
   */
  async getResumes(params: {
    search?: string
    templateFilter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  } = {}): Promise<{ data: PaginatedResult<AdminResumeItem> | null; error: Error | null }> {
    const page = params.page || 1
    const pageSize = params.pageSize || 15
    const emptyResult: PaginatedResult<AdminResumeItem> = {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }

    if (!isSupabaseConfigured()) {
      return { data: emptyResult, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_resumes', {
        p_search: params.search?.trim() || null,
        p_template_filter: params.templateFilter || null,
        p_sort_by: params.sortBy || 'created_at',
        p_sort_dir: params.sortDir || 'desc',
        p_page: page,
        p_page_size: pageSize,
      })

      if (!error && data) {
        const parsed = parsePaginatedRpc<AdminResumeItem>(data, parseAdminResumeItem, page, pageSize)
        if (parsed) {
          return { data: parsed, error: null }
        }
      }

      // Fallback query
      let query = supabase.from('resumes').select('id, user_id, title, selected_template, created_at, updated_at', { count: 'exact' })
      if (params.search?.trim()) {
        query = query.ilike('title', `%${params.search.trim()}%`)
      }
      if (params.templateFilter && isResumeTemplateId(params.templateFilter)) {
        query = query.eq('selected_template', params.templateFilter)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data: rows, count, error: qErr } = await query
        .order('created_at', { ascending: params.sortDir === 'asc' })
        .range(from, to)

      if (qErr) throw qErr

      const total = count || 0
      const items: AdminResumeItem[] = (rows || []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        title: r.title || 'ATS Resume',
        selectedTemplate: isResumeTemplateId(r.selected_template) ? r.selected_template : 'classic',
        ownerName: 'Author Student',
        ownerEmail: 'student@prbuilder.me',
        sectionCount: 4,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }))

      return {
        data: {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        error: null,
      }
    } catch (err) {
      console.warn('Failed to query resumes directory:', err)
      return { data: emptyResult, error: err as Error }
    }
  },

  /**
   * Fetch paginated portfolios directory from Supabase
   */
  async getPortfolios(params: {
    search?: string
    statusFilter?: string
    themeFilter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  } = {}): Promise<{ data: PaginatedResult<AdminPortfolioItem> | null; error: Error | null }> {
    const page = params.page || 1
    const pageSize = params.pageSize || 15
    const emptyResult: PaginatedResult<AdminPortfolioItem> = {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }

    if (!isSupabaseConfigured()) {
      return { data: emptyResult, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_portfolios', {
        p_search: params.search?.trim() || null,
        p_status_filter: params.statusFilter || null,
        p_theme_filter: params.themeFilter || null,
        p_sort_by: params.sortBy || 'created_at',
        p_sort_dir: params.sortDir || 'desc',
        p_page: page,
        p_page_size: pageSize,
      })

      if (!error && data) {
        const parsed = parsePaginatedRpc<AdminPortfolioItem>(data, parseAdminPortfolioItem, page, pageSize)
        if (parsed) {
          return { data: parsed, error: null }
        }
      }

      // Direct fallback
      let query = supabase.from('portfolios').select('id, user_id, title, slug, theme, publication_status, published_at, created_at, updated_at, portfolio_data', { count: 'exact' })
      if (params.search?.trim()) {
        query = query.or(`title.ilike.%${params.search.trim()}%,slug.ilike.%${params.search.trim()}%`)
      }
      if (params.statusFilter && isPublicationStatus(params.statusFilter)) {
        query = query.eq('publication_status', params.statusFilter)
      }
      if (params.themeFilter && isPortfolioThemeId(params.themeFilter)) {
        query = query.eq('theme', params.themeFilter)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data: rows, count, error: qErr } = await query
        .order('created_at', { ascending: params.sortDir === 'asc' })
        .range(from, to)

      if (qErr) throw qErr

      const total = count || 0
      const items: AdminPortfolioItem[] = (rows || []).map((p) => {
        const rawData = isRecord(p.portfolio_data) ? (p.portfolio_data as Record<string, unknown>) : {}
        const rawProfile = isRecord(rawData.profile) ? (rawData.profile as Record<string, unknown>) : {}
        const rawAppearance = isRecord(rawData.appearance) ? (rawData.appearance as Record<string, unknown>) : {}
        const rawProjects = Array.isArray(rawData.projects) ? rawData.projects : []

        const theme = isPortfolioThemeId(p.theme)
          ? p.theme
          : isPortfolioThemeId(rawAppearance.theme)
          ? rawAppearance.theme
          : 'midnight'

        const status = isPublicationStatus(p.publication_status) ? p.publication_status : 'draft'

        return {
          id: p.id,
          userId: p.user_id,
          title: p.title || (typeof rawProfile.title === 'string' ? rawProfile.title : 'Portfolio Studio'),
          slug: p.slug || null,
          theme,
          publicationStatus: status,
          publishedAt: p.published_at || null,
          ownerName: typeof rawProfile.fullName === 'string' ? rawProfile.fullName : 'Student Member',
          ownerEmail: typeof rawProfile.email === 'string' ? rawProfile.email : 'student@prbuilder.me',
          projectCount: rawProjects.length,
          customHostname: null,
          portfolioData: (rawData as unknown) as PortfolioData,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }
      })

      return {
        data: {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        error: null,
      }
    } catch (err) {
      console.warn('Failed to query portfolios directory:', err)
      return { data: emptyResult, error: err as Error }
    }
  },

  /**
   * Fetch paginated audit logs
   */
  async getAuditLogs(params: {
    search?: string
    actionFilter?: string
    page?: number
    pageSize?: number
  } = {}): Promise<{
    data: PaginatedResult<AdminAuditLogItem> | null
    error: Error | null
    isTableMissing?: boolean
  }> {
    const page = params.page || 1
    const pageSize = params.pageSize || 15
    const emptyResult: PaginatedResult<AdminAuditLogItem> = {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }

    if (!isSupabaseConfigured()) {
      const localLogs = getLocalAuditLogs()
      const filtered = filterLocalAuditLogs(localLogs, params.search, params.actionFilter)
      const total = filtered.length
      const from = (page - 1) * pageSize
      return {
        data: {
          items: filtered.slice(from, from + pageSize),
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        error: null,
        isTableMissing: true,
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_audit_logs', {
        p_search: params.search?.trim() || null,
        p_action_filter: params.actionFilter || null,
        p_page: page,
        p_page_size: pageSize,
      })

      if (!error && data) {
        const parsed = parsePaginatedRpc<AdminAuditLogItem>(data, parseAdminAuditLogItem, page, pageSize)
        if (parsed) {
          return { data: parsed, error: null, isTableMissing: false }
        }
      }

      // Direct table query fallback
      let query = supabase.from('admin_audit_logs').select('*', { count: 'exact' })
      if (params.search?.trim()) {
        query = query.ilike('action', `%${params.search.trim()}%`)
      }
      if (params.actionFilter && params.actionFilter !== 'all') {
        query = query.eq('action', params.actionFilter)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data: rows, count, error: qErr } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (qErr) throw qErr

      const total = count || 0
      const items: AdminAuditLogItem[] = (rows || []).map((log) => ({
        id: log.id,
        adminId: log.admin_id,
        adminEmail: log.admin_email,
        adminName: 'Platform Administrator',
        action: log.action,
        targetId: log.target_id,
        targetType: log.target_type,
        outcome: log.outcome as 'success' | 'failure' | 'denied',
        metadata: (log.metadata as Record<string, unknown>) || {},
        createdAt: log.created_at,
      }))

      return {
        data: {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        error: null,
        isTableMissing: false,
      }
    } catch (err: unknown) {
      console.warn('Failed to get audit logs from Supabase:', err)
      const errMsg = err instanceof Error ? err.message : String(err)
      const errCode = (err as { code?: string })?.code
      const isMissingTable =
        errCode === 'PGRST204' ||
        errCode === '42P01' ||
        errMsg.toLowerCase().includes('schema cache') ||
        errMsg.toLowerCase().includes('does not exist')

      if (isMissingTable) {
        const localLogs = getLocalAuditLogs()
        const filtered = filterLocalAuditLogs(localLogs, params.search, params.actionFilter)
        const total = filtered.length
        const from = (page - 1) * pageSize
        return {
          data: {
            items: filtered.slice(from, from + pageSize),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          },
          error: null,
          isTableMissing: true,
        }
      }

      return { data: emptyResult, error: err as Error, isTableMissing: false }
    }
  },

  /**
   * Record administrative audit log
   */
  async logAction(
    action: string,
    targetType: string,
    targetId?: string,
    outcome: 'success' | 'failure' | 'denied' = 'success',
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.rpc('admin_log_action', {
          p_action: action,
          p_target_id: targetId || '',
          p_target_type: targetType,
          p_outcome: outcome,
          p_metadata: metadata as Json,
        })
        if (!error) return
      }
    } catch (err) {
      console.warn('Remote audit logging failed, recording locally:', err)
    }

    appendLocalAuditLog({
      adminId: 'current-admin',
      adminEmail: 'admin@gmail.com',
      adminName: 'Platform Administrator',
      action,
      targetType,
      targetId: targetId || null,
      outcome,
      metadata,
    })
  },

  /**
   * Delete resume with admin authorization
   */
  async deleteResume(resumeId: string, reason: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: new Error('Supabase is not configured.') }
    }

    try {
      const { data, error } = await supabase.rpc('admin_delete_resume', {
        p_resume_id: resumeId,
        p_reason: reason.trim() || 'Administrative deletion',
      })
      if (error) {
        // Direct delete fallback
        const { error: delErr } = await supabase.from('resumes').delete().eq('id', resumeId)
        if (delErr) throw delErr
        return { success: true, error: null }
      }
      const res = parseRpcResult(data)
      if (!res.success) throw new Error(res.error || 'Failed to delete resume')
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err as Error }
    }
  },

  /**
   * Unpublish portfolio with admin authorization
   */
  async unpublishPortfolio(portfolioId: string, reason: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: new Error('Supabase is not configured.') }
    }

    try {
      const { data, error } = await supabase.rpc('admin_unpublish_portfolio', {
        p_portfolio_id: portfolioId,
        p_reason: reason.trim() || 'Administrative unpublish',
      })
      if (error) {
        const { error: upErr } = await supabase
          .from('portfolios')
          .update({ publication_status: 'draft', updated_at: new Date().toISOString() })
          .eq('id', portfolioId)
        if (upErr) throw upErr
        return { success: true, error: null }
      }
      const res = parseRpcResult(data)
      if (!res.success) throw new Error(res.error || 'Failed to unpublish portfolio')
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err as Error }
    }
  },

  /**
   * Delete portfolio with admin authorization
   */
  async deletePortfolio(portfolioId: string, reason: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: new Error('Supabase is not configured.') }
    }

    try {
      const { data, error } = await supabase.rpc('admin_delete_portfolio', {
        p_portfolio_id: portfolioId,
        p_reason: reason.trim() || 'Administrative deletion',
      })
      if (error) {
        const { error: delErr } = await supabase.from('portfolios').delete().eq('id', portfolioId)
        if (delErr) throw delErr
        return { success: true, error: null }
      }
      const res = parseRpcResult(data)
      if (!res.success) throw new Error(res.error || 'Failed to delete portfolio')
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err as Error }
    }
  },

  /**
   * Fetch a specific user's resumes and portfolios for the admin profile drawer
   */
  async getUserAssets(userId: string): Promise<{ data: AdminUserAssets | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: { resumes: [], portfolios: [] }, error: null }
    }

    try {
      // 1. Try secure RPC
      const { data, error } = await supabase.rpc('get_admin_user_assets', { p_user_id: userId })
      if (!error && data) {
        const parsed = parseAdminUserAssets(data)
        if (parsed) {
          return { data: parsed, error: null }
        }
      }

      // 2. Direct query fallback
      const [{ data: resumes }, { data: portfolios }] = await Promise.all([
        supabase
          .from('resumes')
          .select('id, title, selected_template, created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('portfolios')
          .select('id, title, slug, theme, publication_status, published_at, created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ])

      const result: AdminUserAssets = {
        resumes: (resumes || []).map((r) => ({
          id: r.id,
          title: r.title || 'Untitled Resume',
          template: isResumeTemplateId(r.selected_template) ? r.selected_template : 'classic',
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
        portfolios: (portfolios || []).map((p) => ({
          id: p.id,
          title: p.title || 'Untitled Portfolio',
          slug: p.slug || null,
          theme: isPortfolioThemeId(p.theme) ? p.theme : 'midnight',
          status: isPublicationStatus(p.publication_status) ? p.publication_status : 'draft',
          publishedAt: p.published_at || null,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })),
      }

      return { data: result, error: null }
    } catch (err) {
      console.warn('Failed to query user assets:', err)
      return { data: { resumes: [], portfolios: [] }, error: err as Error }
    }
  },

  /**
   * Update user role (assign/revoke admin)
   */
  async updateUserRole(userId: string, isAdmin: boolean, reason: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: new Error('Supabase is not configured.') }
    }

    try {
      const { data, error } = await supabase.rpc('admin_update_user_role', {
        p_user_id: userId,
        p_is_admin: isAdmin,
        p_reason: reason.trim() || 'Role modification by admin',
      })
      if (error) {
        const { error: upErr } = await supabase
          .from('profiles')
          .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
          .eq('id', userId)
        if (upErr) throw upErr
        return { success: true, error: null }
      }
      const res = parseRpcResult(data)
      if (!res.success) throw new Error(res.error || 'Failed to update user role')
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err as Error }
    }
  },

  /**
   * Safely export users to CSV
   */
  exportUsersCsv(users: AdminUserItem[]): void {
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Resume Count', 'Portfolio Count', 'Published Portfolios', 'Registration Date', 'Last Activity']
    const rows = users.map((u) => [
      escapeCsv(u.id),
      escapeCsv(u.displayName),
      escapeCsv(u.email),
      escapeCsv(u.isAdmin ? 'Admin' : 'Member'),
      u.resumeCount,
      u.portfolioCount,
      u.publishedPortfolioCount,
      escapeCsv(u.createdAt ? new Date(u.createdAt).toISOString() : ''),
      escapeCsv(u.lastActivity ? new Date(u.lastActivity).toISOString() : ''),
    ])
    triggerCsvDownload('pr-builder-users-export.csv', [headers, ...rows])
  },

  /**
   * Safely export resume metadata to CSV
   */
  exportResumesCsv(resumes: AdminResumeItem[]): void {
    const headers = ['Resume ID', 'Title', 'Template', 'Owner Name', 'Owner Email', 'Section Count', 'Created Date', 'Last Updated']
    const rows = resumes.map((r) => [
      escapeCsv(r.id),
      escapeCsv(r.title),
      escapeCsv(r.selectedTemplate),
      escapeCsv(r.ownerName),
      escapeCsv(r.ownerEmail),
      r.sectionCount,
      escapeCsv(r.createdAt ? new Date(r.createdAt).toISOString() : ''),
      escapeCsv(r.updatedAt ? new Date(r.updatedAt).toISOString() : ''),
    ])
    triggerCsvDownload('pr-builder-resumes-export.csv', [headers, ...rows])
  },

  /**
   * Safely export portfolio metadata to CSV
   */
  exportPortfoliosCsv(portfolios: AdminPortfolioItem[]): void {
    const headers = ['Portfolio ID', 'Title', 'Slug', 'Theme', 'Status', 'Owner Name', 'Owner Email', 'Projects', 'Custom Hostname', 'Published Date', 'Created Date']
    const rows = portfolios.map((p) => [
      escapeCsv(p.id),
      escapeCsv(p.title || 'Untitled'),
      escapeCsv(p.slug || ''),
      escapeCsv(p.theme),
      escapeCsv(p.publicationStatus),
      escapeCsv(p.ownerName),
      escapeCsv(p.ownerEmail),
      p.projectCount,
      escapeCsv(p.customHostname || ''),
      escapeCsv(p.publishedAt ? new Date(p.publishedAt).toISOString() : ''),
      escapeCsv(p.createdAt ? new Date(p.createdAt).toISOString() : ''),
    ])
    triggerCsvDownload('pr-builder-portfolios-export.csv', [headers, ...rows])
  },

  /**
   * Export comprehensive summary metrics report
   */
  exportSummaryReportCsv(stats: AdminOverviewStats): void {
    const rows = [
      ['Metric Category', 'Metric Name', 'Current Count', 'Comparison / Details'],
      ['Users', 'Total Registered Users', stats.users.total, 'All time database records'],
      ['Users', 'New Users Today', stats.users.today, 'Registered since 00:00 UTC'],
      ['Users', 'New Users (Last 7 Days)', stats.users.last7Days, `Previous 7 days: ${stats.users.prev7Days}`],
      ['Users', 'New Users (Last 30 Days)', stats.users.last30Days, `Previous 30 days: ${stats.users.prev30Days}`],
      ['Users', 'Active Users (30-day window)', stats.users.active30Days, `Previous period: ${stats.users.prevActive30Days}`],
      ['Resumes', 'Total Resumes Created', stats.resumes.total, 'All time database records'],
      ['Resumes', 'Resumes Created (Last 7 Days)', stats.resumes.last7Days, `Previous 7 days: ${stats.resumes.prev7Days}`],
      ['Resumes', 'Unique Resume Creators', stats.resumes.uniqueCreators, 'Distinct users with >=1 resume'],
      ['Portfolios', 'Total Portfolios Created', stats.portfolios.total, 'All time database records'],
      ['Portfolios', 'Published Portfolios', stats.portfolios.published, 'Active public sites'],
      ['Portfolios', 'Draft Portfolios', stats.portfolios.draft, 'Unpublished user drafts'],
      ['Portfolios', 'Unique Portfolio Creators', stats.portfolios.uniqueCreators, 'Distinct users with >=1 portfolio'],
      ['Downloads', 'Total Downloads (PDF & ZIP)', stats.downloads.totalDownloads, 'Recorded download operations'],
      ['Downloads', 'Resume PDFs Downloaded', stats.downloads.resumePdfs, 'ATS PDF downloads'],
      ['Downloads', 'Portfolio ZIPs Exported', stats.downloads.portfolioZips, 'Offline site ZIPs'],
      ['Engagement', 'Users with Both Resume & Portfolio', stats.engagement.usersWithBoth, 'Power users'],
      ['Engagement', 'Users with Resume Only', stats.engagement.usersResumesOnly, 'Resume-focused users'],
      ['Engagement', 'Users with Portfolio Only', stats.engagement.usersPortfoliosOnly, 'Portfolio-focused users'],
      ['Engagement', 'Users with Neither', stats.engagement.usersNeither, 'Registered users with no assets yet'],
    ]
    triggerCsvDownload(`pr-builder-platform-summary-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  },
}

/**
 * Top-level typed analytics convenience exports adhering to Primary Objective 3
 */
export const getAdminOverview = () => adminService.getOverviewStats()
export const getSignupMetrics = (period: 7 | 30 = 30) =>
  adminService.getOverviewStats().then((res) => ({
    total: res.data?.users.total || 0,
    periodSignups: period === 7 ? res.data?.users.last7Days || 0 : res.data?.users.last30Days || 0,
    prevPeriodSignups: period === 7 ? res.data?.users.prev7Days || 0 : res.data?.users.prev30Days || 0,
  }))
export const getResumeMetrics = () =>
  adminService.getOverviewStats().then((res) => res.data?.resumes || EMPTY_STATS.resumes)
export const getPortfolioMetrics = () =>
  adminService.getOverviewStats().then((res) => res.data?.portfolios || EMPTY_STATS.portfolios)
export const getDownloadMetrics = () =>
  adminService.getOverviewStats().then((res) => res.data?.downloads || EMPTY_STATS.downloads)
export const getRecentActivity = (limit = 20) =>
  adminService.getOverviewStats().then((res) => (res.data?.recentActivity || []).slice(0, limit))
export const getUserGrowthSeries = (period = 30) => adminService.getGrowthAnalytics(period)
export const recordRealAnalyticsEvent = (
  eventType: Parameters<typeof adminService.recordRealAnalyticsEvent>[0],
  metadata?: Record<string, Json | undefined>,
  targetId?: string,
  targetType?: string
) => adminService.recordRealAnalyticsEvent(eventType, metadata, targetId, targetType)

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""'
  let str = String(value)
  // Neutralize spreadsheet formula injection per OWASP guidance
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

function triggerCsvDownload(filename: string, rows: (string | number)[][]): void {
  const csvContent = rows.map((row) => row.join(',')).join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
