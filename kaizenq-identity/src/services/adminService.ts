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
  }
  portfolios: {
    total: number
    last7Days: number
    prev7Days: number
    published: number
    draft: number
    uniqueCreators: number
  }
  engagement: {
    usersWithBoth: number
    usersResumesOnly: number
    usersPortfoliosOnly: number
    usersNeither: number
  }
}

export interface GrowthDataPoint {
  date: string
  newUsers: number
  resumesCreated: number
  portfoliosCreated: number
  publishedPortfolios: number
  draftPortfolios: number
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

export const adminService = {
  /**
   * Fetch authenticated overview stats from database aggregation
   */
  async getOverviewStats(): Promise<{ data: AdminOverviewStats | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        data: {
          users: { total: 0, today: 0, last7Days: 0, prev7Days: 0, last30Days: 0, prev30Days: 0, active30Days: 0, prevActive30Days: 0 },
          resumes: { total: 0, last7Days: 0, prev7Days: 0, uniqueCreators: 0 },
          portfolios: { total: 0, last7Days: 0, prev7Days: 0, published: 0, draft: 0, uniqueCreators: 0 },
          engagement: { usersWithBoth: 0, usersResumesOnly: 0, usersPortfoliosOnly: 0, usersNeither: 0 },
        },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_overview_stats')
      if (error) throw error
      return { data: data as unknown as AdminOverviewStats, error: null }
    } catch (err) {
      console.error('Failed to get admin overview stats:', err)
      return { data: null, error: err as Error }
    }
  },

  /**
   * Fetch time-series growth analytics
   */
  async getGrowthAnalytics(days = 30): Promise<{ data: GrowthDataPoint[]; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_growth_analytics', { p_days: days })
      if (error) throw error
      return { data: (data as unknown as GrowthDataPoint[]) || [], error: null }
    } catch (err) {
      console.error('Failed to get growth analytics:', err)
      return { data: [], error: err as Error }
    }
  },

  /**
   * Fetch paginated users directory
   */
  async getUsers(params: {
    search?: string
    roleFilter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  } = {}): Promise<{ data: PaginatedResult<AdminUserItem> | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        data: { items: [], total: 0, page: 1, pageSize: 15, totalPages: 0 },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_users', {
        p_search: params.search?.trim() || null,
        p_role_filter: params.roleFilter || null,
        p_sort_by: params.sortBy || 'created_at',
        p_sort_dir: params.sortDir || 'desc',
        p_page: params.page || 1,
        p_page_size: params.pageSize || 15,
      })

      if (error) throw error
      return { data: data as unknown as PaginatedResult<AdminUserItem>, error: null }
    } catch (err) {
      console.error('Failed to get admin users:', err)
      return { data: null, error: err as Error }
    }
  },

  /**
   * Fetch paginated resumes directory
   */
  async getResumes(params: {
    search?: string
    templateFilter?: string
    sortBy?: string
    sortDir?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  } = {}): Promise<{ data: PaginatedResult<AdminResumeItem> | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        data: { items: [], total: 0, page: 1, pageSize: 15, totalPages: 0 },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_resumes', {
        p_search: params.search?.trim() || null,
        p_template_filter: params.templateFilter || null,
        p_sort_by: params.sortBy || 'created_at',
        p_sort_dir: params.sortDir || 'desc',
        p_page: params.page || 1,
        p_page_size: params.pageSize || 15,
      })

      if (error) throw error
      return { data: data as unknown as PaginatedResult<AdminResumeItem>, error: null }
    } catch (err) {
      console.error('Failed to get admin resumes:', err)
      return { data: null, error: err as Error }
    }
  },

  /**
   * Fetch paginated portfolios directory
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
    if (!isSupabaseConfigured()) {
      return {
        data: { items: [], total: 0, page: 1, pageSize: 15, totalPages: 0 },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_portfolios', {
        p_search: params.search?.trim() || null,
        p_status_filter: params.statusFilter || null,
        p_theme_filter: params.themeFilter || null,
        p_sort_by: params.sortBy || 'created_at',
        p_sort_dir: params.sortDir || 'desc',
        p_page: params.page || 1,
        p_page_size: params.pageSize || 15,
      })

      if (error) throw error
      return { data: data as unknown as PaginatedResult<AdminPortfolioItem>, error: null }
    } catch (err) {
      console.error('Failed to get admin portfolios:', err)
      return { data: null, error: err as Error }
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
    if (!isSupabaseConfigured()) {
      return {
        data: { items: [], total: 0, page: 1, pageSize: 15, totalPages: 0 },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_audit_logs', {
        p_search: params.search?.trim() || null,
        p_action_filter: params.actionFilter || null,
        p_page: params.page || 1,
        p_page_size: params.pageSize || 15,
      })

      if (error) throw error
      return { data: data as unknown as PaginatedResult<AdminAuditLogItem>, error: null }
    } catch (err) {
      console.error('Failed to get audit logs:', err)
      return { data: null, error: err as Error }
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
      if (error) throw error
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
      if (error) throw error
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
      if (error) throw error
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
      if (error) throw error
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
      ['Engagement', 'Users with Both Resume & Portfolio', stats.engagement.usersWithBoth, 'Power users'],
      ['Engagement', 'Users with Resume Only', stats.engagement.usersResumesOnly, 'Resume-focused users'],
      ['Engagement', 'Users with Portfolio Only', stats.engagement.usersPortfoliosOnly, 'Portfolio-focused users'],
      ['Engagement', 'Users with Neither', stats.engagement.usersNeither, 'Registered users with no assets yet'],
    ]
    triggerCsvDownload(`pr-builder-platform-summary-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  },
}

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
