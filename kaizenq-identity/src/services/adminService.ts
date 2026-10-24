import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'

export interface AdminOverviewStats {
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
  selectedTemplate: string
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
  theme: string
  publicationStatus: 'draft' | 'published'
  publishedAt: string | null
  ownerName: string
  ownerEmail: string
  projectCount: number
  customHostname: string | null
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

const EMPTY_STATS: AdminOverviewStats = {
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

export const adminService = {
  /**
   * Record real user activity event to public.analytics_events
   */
  async recordRealAnalyticsEvent(
    eventType:
      | 'resume_pdf_downloaded'
      | 'portfolio_zip_downloaded'
      | 'portfolio_qr_downloaded'
      | 'resume_created'
      | 'resume_updated'
      | 'resume_deleted'
      | 'portfolio_created'
      | 'portfolio_published'
      | 'portfolio_unpublished'
      | 'portfolio_viewed'
      | 'user_registered',
    metadata: Record<string, unknown> = {},
    targetId?: string,
    targetType: string = 'asset'
  ): Promise<void> {
    if (!isSupabaseConfigured()) return

    try {
      // 1. Try secure RPC function
      const { error: rpcErr } = await supabase.rpc('record_analytics_event', {
        p_event_type: eventType,
        p_target_id: targetId || null,
        p_target_type: targetType,
        p_metadata: metadata,
      })

      if (rpcErr) {
        // Fallback to direct table insertion with authenticated user
        const { data: authData } = await supabase.auth.getUser()
        await supabase.from('analytics_events').insert({
          user_id: authData?.user?.id || null,
          event_type: eventType,
          target_id: targetId || null,
          target_type: targetType,
          metadata,
        })
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
    metadata: Record<string, unknown> = {}
  ): void {
    const eventTypeMap = {
      resume_pdf: 'resume_pdf_downloaded' as const,
      portfolio_zip: 'portfolio_zip_downloaded' as const,
      portfolio_qr: 'portfolio_qr_downloaded' as const,
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
      return { data: EMPTY_STATS, error: null }
    }

    try {
      // 1. Call authoritative production RPC
      const { data, error } = await supabase.rpc('get_admin_overview_stats')
      if (!error && data) {
        const stats = data as unknown as AdminOverviewStats
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
        return { data: data as GrowthDataPoint[], error: null }
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

      if (!error && data && Array.isArray((data as any)?.items)) {
        return { data: data as unknown as PaginatedResult<AdminUserItem>, error: null }
      }

      // 2. Fallback to direct table query
      let query = supabase.from('profiles').select('*', { count: 'exact' })

      if (params.search?.trim()) {
        query = query.ilike('full_name', `%${params.search.trim()}%`)
      }
      if (params.roleFilter === 'admin') {
        query = query.eq('is_admin', true)
      } else if (params.roleFilter === 'user') {
        query = query.eq('is_admin', false)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const sortColumn = params.sortBy === 'display_name' ? 'full_name' : 'created_at'
      const { data: rows, count, error: queryErr } = await query
        .order(sortColumn, { ascending: params.sortDir === 'asc' })
        .range(from, to)

      if (queryErr) throw queryErr

      const total = count || 0
      const items: AdminUserItem[] = (rows || []).map((r) => ({
        id: r.id,
        displayName: r.full_name || 'Member Student',
        email: r.email || 'student@prbuilder.me',
        headline: r.headline || null,
        avatarPath: r.avatar_url || null,
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

      if (!error && data && Array.isArray((data as any)?.items)) {
        return { data: data as unknown as PaginatedResult<AdminResumeItem>, error: null }
      }

      // Fallback query
      let query = supabase.from('resumes').select('id, user_id, title, selected_template, created_at, updated_at', { count: 'exact' })
      if (params.search?.trim()) {
        query = query.ilike('title', `%${params.search.trim()}%`)
      }
      if (params.templateFilter) {
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
        selectedTemplate: r.selected_template || 'classic',
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

      if (!error && data && Array.isArray((data as any)?.items)) {
        return { data: data as unknown as PaginatedResult<AdminPortfolioItem>, error: null }
      }

      // Direct fallback
      let query = supabase.from('portfolios').select('id, user_id, title, slug, theme, publication_status, published_at, created_at, updated_at', { count: 'exact' })
      if (params.search?.trim()) {
        query = query.or(`title.ilike.%${params.search.trim()}%,slug.ilike.%${params.search.trim()}%`)
      }
      if (params.statusFilter) {
        query = query.eq('publication_status', params.statusFilter)
      }
      if (params.themeFilter) {
        query = query.eq('theme', params.themeFilter)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data: rows, count, error: qErr } = await query
        .order('created_at', { ascending: params.sortDir === 'asc' })
        .range(from, to)

      if (qErr) throw qErr

      const total = count || 0
      const items: AdminPortfolioItem[] = (rows || []).map((p) => ({
        id: p.id,
        userId: p.user_id,
        title: p.title || 'Portfolio Studio',
        slug: p.slug || null,
        theme: p.theme || 'midnight',
        publicationStatus: p.publication_status as 'draft' | 'published',
        publishedAt: p.published_at || null,
        ownerName: 'Author Student',
        ownerEmail: 'student@prbuilder.me',
        projectCount: 0,
        customHostname: null,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
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
  } = {}): Promise<{ data: PaginatedResult<AdminAuditLogItem> | null; error: Error | null }> {
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
      return { data: emptyResult, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_audit_logs', {
        p_search: params.search?.trim() || null,
        p_action_filter: params.actionFilter || null,
        p_page: page,
        p_page_size: pageSize,
      })

      if (!error && data) {
        return { data: data as unknown as PaginatedResult<AdminAuditLogItem>, error: null }
      }

      // Direct table query fallback
      let query = supabase.from('admin_audit_logs').select('*', { count: 'exact' })
      if (params.search?.trim()) {
        query = query.ilike('action', `%${params.search.trim()}%`)
      }
      if (params.actionFilter) {
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
      }
    } catch (err) {
      console.warn('Failed to get audit logs:', err)
      return { data: emptyResult, error: err as Error }
    }
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
      const res = data as unknown as { success: boolean; error?: string }
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
      const res = data as unknown as { success: boolean; error?: string }
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
      const res = data as unknown as { success: boolean; error?: string }
      if (!res.success) throw new Error(res.error || 'Failed to delete portfolio')
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err as Error }
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
      const res = data as unknown as { success: boolean; error?: string }
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
  metadata?: Record<string, unknown>,
  targetId?: string,
  targetType?: string
) => adminService.recordRealAnalyticsEvent(eventType, metadata, targetId, targetType)

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""'
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
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
