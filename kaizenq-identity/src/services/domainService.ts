import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { Database } from '../types/database.types.ts'
import { getPlatformDomain } from '../lib/domainUtils.ts'

export type DomainRow = Database['public']['Tables']['domains']['Row']

export interface DnsRecordInstruction {
  type: 'A' | 'CNAME' | 'TXT'
  host: string
  name: string
  value: string
  ttl: number
  purpose: string
  verified?: boolean
}

export interface DnsCheckResult {
  txtFound: boolean
  targetConfigured: boolean
  currentRecords: string[]
  details: string
}

export interface ConnectDomainResult {
  success: boolean
  domain?: DomainRow | null
  error?: string | null
  requiresEntitlement?: boolean
}

export interface VerifyDomainResult {
  success: boolean
  domain?: DomainRow | null
  error?: string | null
  status?: string
}

export const domainService = {
  /**
   * Cleans and normalizes domain names.
   */
  normalizeHostname(raw: string): string {
    if (!raw) return ''
    let clean = raw.trim().toLowerCase()
    clean = clean.replace(/^https?:\/\//, '')
    clean = clean.split('/')[0]
    clean = clean.split('?')[0]
    clean = clean.split(':')[0]
    clean = clean.replace(/^\.+|\.+$/g, '')
    return clean
  },

  /**
   * Validates if a hostname is structurally valid.
   */
  isValidHostname(hostname: string): boolean {
    const clean = this.normalizeHostname(hostname)
    if (!clean || clean.length < 4 || clean.length > 253) return false
    const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/
    return regex.test(clean)
  },

  /**
   * Checks whether the hostname is an apex domain (e.g. example.com) or a subdomain (e.g. blog.example.com).
   */
  isApexDomain(hostname: string): boolean {
    const clean = this.normalizeHostname(hostname)
    const parts = clean.split('.')
    return parts.length === 2
  },

  /**
   * Generates exact, authoritative Netlify DNS records for a given custom domain.
   */
  getExactDnsRecords(hostname: string, verificationToken: string): DnsRecordInstruction[] {
    const clean = this.normalizeHostname(hostname)
    const isApex = this.isApexDomain(clean)

    if (isApex) {
      return [
        {
          type: 'A',
          host: '@',
          name: clean,
          value: '75.2.60.5',
          ttl: 300,
          purpose: 'Routes root traffic to Netlify Edge CDN Load Balancer',
        },
        {
          type: 'CNAME',
          host: 'www',
          name: `www.${clean}`,
          value: getPlatformDomain(),
          ttl: 300,
          purpose: 'Routes www alias to PR Builder platform',
        },
        {
          type: 'TXT',
          host: '_prbuilder-challenge',
          name: `_prbuilder-challenge.${clean}`,
          value: verificationToken,
          ttl: 300,
          purpose: 'Cryptographic ownership verification challenge',
        },
      ]
    }

    const subdomainPart = clean.split('.')[0]
    return [
      {
        type: 'CNAME',
        host: subdomainPart,
        name: clean,
        value: getPlatformDomain(),
        ttl: 300,
        purpose: 'Routes custom subdomain to Netlify edge network',
      },
      {
        type: 'TXT',
        host: `_prbuilder-challenge.${subdomainPart}`,
        name: `_prbuilder-challenge.${clean}`,
        value: verificationToken,
        ttl: 300,
        purpose: 'Cryptographic ownership verification challenge',
      },
    ]
  },

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
   * Connects a custom domain via server-authoritative RPC.
   * Validates portfolio ownership, Custom Domain Pass entitlement, format, and duplicate conflicts.
   */
  async connectCustomDomain(
    portfolioId: string,
    rawHostname: string,
  ): Promise<ConnectDomainResult> {
    const clean = this.normalizeHostname(rawHostname)
    if (!this.isValidHostname(clean)) {
      return {
        success: false,
        error: 'Invalid domain format. Example: example.com or portfolio.example.com',
      }
    }

    if (!isSupabaseConfigured()) {
      // Offline fallback simulation for local testing
      const token = `prbuilder-verify-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
      const records = this.getExactDnsRecords(clean, token)
      const simulated: DomainRow = {
        id: `dom-${Date.now()}`,
        portfolio_id: portfolioId,
        user_id: 'mock-user',
        hostname: clean,
        verification_status: 'pending_verification',
        connection_status: 'disconnected',
        ssl_status: 'pending',
        verification_token: token,
        provider_reference: 'netlify-simulated',
        activated_at: null,
        last_checked_at: new Date().toISOString(),
        error_message: null,
        dns_records: records as unknown as Database['public']['Tables']['domains']['Row']['dns_records'],
        verified_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return { success: true, domain: simulated }
    }

    try {
      const { data, error } = await supabase.rpc('connect_custom_domain', {
        p_portfolio_id: portfolioId,
        p_raw_hostname: clean,
      })

      if (error) throw error

      const res = data as unknown as {
        success: boolean
        error?: string
        requires_entitlement?: boolean
        domain?: DomainRow
      }

      if (!res.success) {
        return {
          success: false,
          error: res.error || 'Failed to connect domain',
          requiresEntitlement: res.requires_entitlement,
        }
      }

      return {
        success: true,
        domain: res.domain || null,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect custom domain.',
      }
    }
  },

  /**
   * Verifies a custom domain via server-authoritative RPC.
   */
  async verifyCustomDomain(
    domainId: string,
    simulateSuccess = false,
  ): Promise<VerifyDomainResult> {
    if (!isSupabaseConfigured()) {
      return {
        success: true,
        domain: {
          id: domainId,
          portfolio_id: 'mock-portfolio',
          user_id: 'mock-user',
          hostname: 'example.com',
          verification_status: 'verified',
          connection_status: 'active',
          ssl_status: 'issued',
          verification_token: 'prbuilder-verify-token',
          provider_reference: 'netlify-alias-mock',
          activated_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
          error_message: null,
          dns_records: [],
          verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }
    }

    try {
      const { data, error } = await supabase.rpc('verify_custom_domain', {
        p_domain_id: domainId,
        p_simulate_success: simulateSuccess,
      })

      if (error) throw error

      const res = data as unknown as {
        success: boolean
        error?: string
        status?: string
        domain?: DomainRow
      }

      if (!res.success) {
        return {
          success: false,
          error: res.error || 'Verification failed. DNS records not detected yet.',
          status: res.status,
        }
      }

      return {
        success: true,
        domain: res.domain || null,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Domain verification check failed.',
      }
    }
  },

  /**
   * Disconnects a custom domain via server-authoritative RPC.
   */
  async disconnectCustomDomain(
    domainId: string,
  ): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured()) {
      return { success: true, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('disconnect_custom_domain', {
        p_domain_id: domainId,
      })

      if (error) throw error

      const res = data as unknown as { success: boolean; error?: string }
      return {
        success: res.success,
        error: res.error || null,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to disconnect domain.',
      }
    }
  },

  /**
   * Optional live DNS check using Google Public DNS over HTTPS (DoH).
   * Runs client-side non-privileged diagnostics to inform the user before triggering server verification.
   */
  async checkLiveDnsOverHttps(
    hostname: string,
    verificationToken: string,
  ): Promise<DnsCheckResult> {
    const clean = this.normalizeHostname(hostname)
    const challengeHost = `_prbuilder-challenge.${clean}`

    try {
      // 1. Check TXT Challenge
      const txtResp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(challengeHost)}&type=TXT`, {
        headers: { Accept: 'application/dns-json' },
      })

      let txtFound = false
      const currentRecords: string[] = []

      if (txtResp.ok) {
        const json = await txtResp.json()
        if (json.Answer && Array.isArray(json.Answer)) {
          for (const ans of json.Answer) {
            const rawData = String(ans.data || '').replace(/"/g, '')
            currentRecords.push(`TXT: ${rawData}`)
            if (rawData.includes(verificationToken) || rawData === verificationToken) {
              txtFound = true
            }
          }
        }
      }

      // 2. Check Routing Target (A or CNAME)
      const targetResp = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(clean)}`, {
        headers: { Accept: 'application/dns-json' },
      })

      let targetConfigured = false
      if (targetResp.ok) {
        const json = await targetResp.json()
        if (json.Answer && Array.isArray(json.Answer)) {
          for (const ans of json.Answer) {
            const rawData = String(ans.data || '').replace(/"/g, '').replace(/\.$/, '')
            currentRecords.push(`${ans.type === 1 ? 'A' : ans.type === 5 ? 'CNAME' : 'RECORD'}: ${rawData}`)
            if (rawData === '75.2.60.5' || rawData.includes('prbuilder.xyz') || rawData.includes('prbuilder.in') || rawData.includes('netlify.app')) {
              targetConfigured = true
            }
          }
        }
      }

      return {
        txtFound,
        targetConfigured,
        currentRecords,
        details: txtFound && targetConfigured
          ? 'DNS records detected and matched successfully!'
          : txtFound
          ? 'TXT challenge verified. Routing A/CNAME record is still propagating.'
          : 'TXT challenge record not detected yet. DNS propagation may take a few minutes.',
      }
    } catch {
      return {
        txtFound: false,
        targetConfigured: false,
        currentRecords: [],
        details: 'Unable to query public DNS directly. You can proceed with server verification.',
      }
    }
  },

  /**
   * Backwards-compatible legacy wrapper
   */
  async requestCustomDomain(
    _userId: string,
    portfolioId: string,
    rawHostname: string,
  ): Promise<{ data: DomainRow | null; error: Error | null }> {
    const res = await this.connectCustomDomain(portfolioId, rawHostname)
    if (!res.success) {
      return { data: null, error: new Error(res.error || 'Connection failed') }
    }
    return { data: res.domain || null, error: null }
  },
}
