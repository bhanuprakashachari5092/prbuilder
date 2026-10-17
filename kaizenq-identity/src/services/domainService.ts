import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { Database } from '../types/database.types.ts'

export type DomainRow = Database['public']['Tables']['domains']['Row']

export const domainService = {
  /**
   * Fetch all custom domains associated with this student.
   */
  async getUserDomains(userId: string): Promise<{ data: DomainRow[] | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: [], error: null }
    }

    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Request a custom domain connection for a student portfolio.
   * Status initializes to 'pending_verification'.
   */
  async requestCustomDomain(
    userId: string,
    portfolioId: string,
    rawHostname: string,
  ): Promise<{ data: DomainRow | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase is not configured.') }
    }

    const cleanHostname = rawHostname
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')

    // Basic domain validation
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/
    if (!domainRegex.test(cleanHostname)) {
      return { data: null, error: new Error('Invalid domain format. Example: alexander.xyz') }
    }

    try {
      const dnsRecords = [
        { type: 'CNAME', host: '@', value: 'cname.kaizenq.me', ttl: 300 },
        { type: 'CNAME', host: 'www', value: 'cname.kaizenq.me', ttl: 300 },
        {
          type: 'TXT',
          host: '_verify',
          value: `kaizenq-verify=${userId.slice(0, 8)}`,
          ttl: 3600,
        },
      ]

      const { data, error } = await supabase
        .from('domains')
        .insert({
          user_id: userId,
          portfolio_id: portfolioId,
          hostname: cleanHostname,
          verification_status: 'pending_verification',
          connection_status: 'disconnected',
          dns_records: dnsRecords,
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },
}
