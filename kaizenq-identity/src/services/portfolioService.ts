import { supabase, isSupabaseConfigured, getBaseAppUrl } from '../lib/supabase.ts'
import type { Database } from '../types/database.types.ts'
import type { PortfolioData } from '../pages/Portfolio/types.ts'
import {
  buildSubdomainUrl,
  validateSubdomainSlug,
  getSubdomainFromHostname,
  getPlatformDomain,
} from '../lib/domainUtils.ts'
import { adminService } from './adminService.ts'

export type PortfolioRow = Database['public']['Tables']['portfolios']['Row']

export interface PublishedPortfolioResult {
  id: string
  userId: string
  slug: string
  title: string | null
  theme: string
  portfolioData: PortfolioData
  publishedAt: string | null
}

export interface PublishResult {
  success: boolean
  publicUrl: string | null
  subdomainUrl: string | null
  error: Error | null
}

export const portfolioService = {
  /**
   * Fetch authenticated user's portfolio record.
   */
  async getUserPortfolio(userId: string): Promise<{ data: PortfolioRow | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: null }
    }

    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Save or update the student's cloud portfolio draft.
   */
  async saveUserPortfolio(
    userId: string,
    portfolioData: PortfolioData,
    slug?: string,
  ): Promise<{ data: PortfolioRow | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') }
    }

    try {
      const cleanSlug = (slug || portfolioData.profile.slug || '').trim().toLowerCase()
      const title = portfolioData.profile.title || `${portfolioData.profile.fullName}'s Portfolio`
      const theme = portfolioData.theme || 'midnight'

      // Check if user already has a portfolio record
      const existing = await this.getUserPortfolio(userId)

      if (existing.data?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('portfolios')
          .update({
            title,
            theme,
            slug: cleanSlug || existing.data.slug,
            portfolio_data: portfolioData as unknown as Database['public']['Tables']['portfolios']['Update']['portfolio_data'],
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.data.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        return { data, error: null }
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('portfolios')
          .insert({
            user_id: userId,
            title,
            theme,
            slug: cleanSlug || null,
            portfolio_data: portfolioData as unknown as Database['public']['Tables']['portfolios']['Insert']['portfolio_data'],
            publication_status: 'draft',
          })
          .select()
          .single()

        if (error) throw error
        return { data, error: null }
      }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Publish portfolio using server-side RPC function or secure RLS update.
   */
  async publishPortfolio(
    portfolioId: string,
    slug: string,
  ): Promise<PublishResult> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        publicUrl: null,
        subdomainUrl: null,
        error: new Error('Supabase is not configured. Real public publishing requires backend connection.'),
      }
    }

    const cleanSlug = slug.trim().toLowerCase()
    const validation = validateSubdomainSlug(cleanSlug)
    if (!validation.valid) {
      return {
        success: false,
        publicUrl: null,
        subdomainUrl: null,
        error: new Error(validation.error || 'Invalid slug format.'),
      }
    }

    try {
      // 1. Try secure RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('publish_portfolio', {
        p_portfolio_id: portfolioId,
        p_slug: cleanSlug,
      })

      const publicUrl = `${getBaseAppUrl()}/p/${cleanSlug}`
      const subdomainUrl = buildSubdomainUrl(cleanSlug)

      if (!rpcError && rpcData) {
        return { success: true, publicUrl, subdomainUrl, error: null }
      }

      // If RPC is unavailable or returned an error, fallback to table update with client-side verification
      const { data: updatedPortfolio, error } = await supabase
        .from('portfolios')
        .update({
          publication_status: 'published',
          slug: cleanSlug,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', portfolioId)
        .select()
        .single()

      if (error) throw error

      // Synchronize domains table for custom subdomain
      try {
        const platformDomain = getPlatformDomain()
        const hostname = `${cleanSlug}.${platformDomain}`
        await supabase
          .from('domains')
          .upsert(
            {
              portfolio_id: portfolioId,
              user_id: updatedPortfolio.user_id,
              hostname,
              verification_status: 'connected',
              connection_status: 'active',
              dns_records: [
                { type: 'CNAME', host: cleanSlug, value: `cname.${platformDomain}`, ttl: 300 },
              ],
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'hostname' },
          )
      } catch (domainSyncErr) {
        console.warn('Subdomain entry sync note:', domainSyncErr)
      }

      adminService.recordRealAnalyticsEvent('portfolio_published', {
        slug: cleanSlug,
        subdomainUrl,
        publicUrl,
      }, portfolioId, 'portfolio').catch(() => {})

      return { success: true, publicUrl, subdomainUrl, error: null }
    } catch (err) {
      return { success: false, publicUrl: null, subdomainUrl: null, error: err as Error }
    }
  },

  /**
   * Unpublish portfolio to revoke anonymous public access.
   */
  async unpublishPortfolio(portfolioId: string): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { success: false, error: new Error('Supabase is not configured.') }
    }

    try {
      // 1. Try secure RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('unpublish_portfolio', {
        p_portfolio_id: portfolioId,
      })

      if (!rpcError && rpcData) {
        return { success: true, error: null }
      }

      // Fallback table update
      const { data: existingPort } = await supabase
        .from('portfolios')
        .select('slug')
        .eq('id', portfolioId)
        .maybeSingle()

      const { error } = await supabase
        .from('portfolios')
        .update({
          publication_status: 'draft',
          updated_at: new Date().toISOString(),
        })
        .eq('id', portfolioId)

      if (error) throw error

      // Disconnect domain record
      if (existingPort?.slug) {
        try {
          const hostname = `${existingPort.slug}.${getPlatformDomain()}`
          await supabase
            .from('domains')
            .update({ connection_status: 'disconnected', updated_at: new Date().toISOString() })
            .eq('portfolio_id', portfolioId)
            .eq('hostname', hostname)
        } catch {
          // ignore domain disconnect error on fallback
        }
      }

      adminService.recordRealAnalyticsEvent('portfolio_unpublished', {}, portfolioId, 'portfolio').catch(() => {})

      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err as Error }
    }
  },

  /**
   * Fetch published portfolio for public viewing via slug.
   * Anonymous viewers can ONLY access this if publication_status = 'published'.
   */
  async getPublishedPortfolio(slug: string): Promise<{ data: PublishedPortfolioResult | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') }
    }

    const cleanSlug = slug.trim().toLowerCase()

    try {
      // 1. Try secure RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_published_portfolio', {
        p_slug: cleanSlug,
      })

      if (!rpcError && rpcData && rpcData.length > 0) {
        const item = rpcData[0]
        return {
          data: {
            id: item.id,
            userId: item.user_id,
            slug: item.slug,
            title: item.title,
            theme: item.theme,
            portfolioData: item.portfolio_data as unknown as PortfolioData,
            publishedAt: item.published_at,
          },
          error: null,
        }
      }

      // 2. Fallback to public RLS query (strictly filters publication_status = 'published')
      const { data, error } = await supabase
        .from('portfolios')
        .select('id, user_id, slug, title, theme, portfolio_data, published_at')
        .eq('slug', cleanSlug)
        .eq('publication_status', 'published')
        .maybeSingle()

      if (error) throw error
      if (!data) return { data: null, error: null }

      return {
        data: {
          id: data.id,
          userId: data.user_id,
          slug: data.slug || cleanSlug,
          title: data.title,
          theme: data.theme,
          portfolioData: data.portfolio_data as unknown as PortfolioData,
          publishedAt: data.published_at,
        },
        error: null,
      }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Fetch published portfolio by requested full hostname (subdomain or custom domain).
   */
  async getPublishedPortfolioByHostname(hostname: string): Promise<{ data: PublishedPortfolioResult | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') }
    }

    const cleanHost = hostname.toLowerCase().trim().replace(/:\d+$/, '')

    try {
      // 1. Try secure RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_published_portfolio_by_hostname', {
        p_hostname: cleanHost,
      })

      if (!rpcError && rpcData && rpcData.length > 0) {
        const item = rpcData[0]
        return {
          data: {
            id: item.id,
            userId: item.user_id,
            slug: item.slug,
            title: item.title,
            theme: item.theme,
            portfolioData: item.portfolio_data as unknown as PortfolioData,
            publishedAt: item.published_at,
          },
          error: null,
        }
      }

      // 2. Fallback: Parse subdomain slug from hostname
      const parsedSlug = getSubdomainFromHostname(cleanHost)
      if (parsedSlug) {
        return await this.getPublishedPortfolio(parsedSlug)
      }

      // 3. Fallback: Check domains table for custom domain
      const { data: domainRec, error: domainErr } = await supabase
        .from('domains')
        .select('portfolio_id')
        .eq('hostname', cleanHost)
        .eq('connection_status', 'active')
        .maybeSingle()

      if (!domainErr && domainRec?.portfolio_id) {
        const { data: portRec, error: portErr } = await supabase
          .from('portfolios')
          .select('id, user_id, slug, title, theme, portfolio_data, published_at')
          .eq('id', domainRec.portfolio_id)
          .eq('publication_status', 'published')
          .maybeSingle()

        if (!portErr && portRec) {
          return {
            data: {
              id: portRec.id,
              userId: portRec.user_id,
              slug: portRec.slug || '',
              title: portRec.title,
              theme: portRec.theme,
              portfolioData: portRec.portfolio_data as unknown as PortfolioData,
              publishedAt: portRec.published_at,
            },
            error: null,
          }
        }
      }

      return { data: null, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Check if a slug is available for public claim with format validation.
   */
  async checkSlugAvailability(
    slug: string,
    currentPortfolioId?: string,
  ): Promise<{ available: boolean; error?: string }> {
    const cleanSlug = slug.trim().toLowerCase()
    const validation = validateSubdomainSlug(cleanSlug)

    if (!validation.valid) {
      return { available: false, error: validation.error }
    }

    if (!isSupabaseConfigured()) {
      return { available: true }
    }

    try {
      // 1. Try server RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('check_subdomain_availability', {
        p_slug: cleanSlug,
        p_portfolio_id: currentPortfolioId || null,
      })

      if (!rpcError && rpcData && typeof rpcData === 'object') {
        const res = rpcData as { available: boolean; error?: string }
        return { available: Boolean(res.available), error: res.error }
      }

      // 2. Fallback query on portfolios table
      let query = supabase
        .from('portfolios')
        .select('id')
        .eq('slug', cleanSlug)
        .eq('publication_status', 'published')

      if (currentPortfolioId) {
        query = query.neq('id', currentPortfolioId)
      }

      const { data, error } = await query
      if (error) throw error

      if (data && data.length > 0) {
        return { available: false, error: 'This slug is already in use by another published portfolio.' }
      }

      return { available: true }
    } catch {
      return { available: false, error: 'Unable to check availability at this moment.' }
    }
  },

  /**
   * Deprecated backward-compatible slug availability check.
   */
  async isSlugAvailable(slug: string, currentPortfolioId?: string): Promise<boolean> {
    const res = await this.checkSlugAvailability(slug, currentPortfolioId)
    return res.available
  },

  /**
   * Upload portfolio project image to project-images bucket
   */
  async uploadProjectImage(userId: string, file: File): Promise<{ path: string | null; publicUrl: string | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { path: null, publicUrl: null, error: new Error('Supabase is not configured.') }
    }

    if (file.size > 8 * 1024 * 1024) {
      return { path: null, publicUrl: null, error: new Error('Project image must be under 8MB.') }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return { path: null, publicUrl: null, error: new Error('Invalid image file format.') }
    }

    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const filePath = `${userId}/project-${Date.now()}.${fileExt}`

      const { error } = await supabase.storage
        .from('project-images')
        .upload(filePath, file, { upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage.from('project-images').getPublicUrl(filePath)
      const publicUrl = urlData?.publicUrl || null

      return { path: filePath, publicUrl, error: null }
    } catch (err) {
      return { path: null, publicUrl: null, error: err as Error }
    }
  },
}
