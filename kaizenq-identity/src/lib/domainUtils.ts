/**
 * Subdomain and Hostname Utilities
 * KaizenQ Identity — PR Builder
 *
 * Provides safe hostname resolution, subdomain slug extraction, format validation,
 * and URL construction for free platform subdomains (e.g. username.prbuilder.in).
 */

export const RESERVED_SUBDOMAINS = [
  'account',
  'admin',
  'api',
  'app',
  'assets',
  'auth',
  'billing',
  'cdn',
  'checkout',
  'cname',
  'dashboard',
  'dev',
  'dns',
  'docs',
  'email',
  'help',
  'identity',
  'kaizenq',
  'login',
  'mail',
  'media',
  'p',
  'portal',
  'portfolio',
  'prbuilder',
  'privacy',
  'public',
  'resume',
  'root',
  'settings',
  'signup',
  'ssl',
  'stage',
  'staging',
  'static',
  'status',
  'support',
  'terms',
  'test',
  'verify',
  'webhook',
  'webhooks',
  'www',
] as const

/**
 * Returns the primary configured platform domain (e.g. prbuilder.in).
 * Reads from VITE_PLATFORM_DOMAIN, falling back to 'prbuilder.in'.
 */
export function getPlatformDomain(): string {
  const envDomain = import.meta.env.VITE_PLATFORM_DOMAIN
  if (envDomain && typeof envDomain === 'string' && envDomain.trim() && !envDomain.includes('example.com')) {
    return envDomain.trim().toLowerCase()
  }
  return 'prbuilder.in'
}

/**
 * Checks whether a candidate slug is a reserved platform keyword.
 */
export function isReservedSubdomain(slug: string): boolean {
  if (!slug) return false
  const clean = slug.trim().toLowerCase()
  return (RESERVED_SUBDOMAINS as readonly string[]).includes(clean)
}

export interface SlugValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates candidate slug for safe subdomain usage:
 * - Length 3-48 characters
 * - Only lowercase alphanumeric with single hyphens
 * - No leading, trailing, or consecutive hyphens
 * - Not in reserved system list
 */
export function validateSubdomainSlug(slug: string): SlugValidationResult {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Subdomain handle cannot be empty.' }
  }

  const clean = slug.trim().toLowerCase()

  if (clean.length < 3) {
    return { valid: false, error: 'Subdomain handle must be at least 3 characters.' }
  }

  if (clean.length > 48) {
    return { valid: false, error: 'Subdomain handle cannot exceed 48 characters.' }
  }

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) {
    if (clean.startsWith('-') || clean.endsWith('-')) {
      return { valid: false, error: 'Subdomain cannot start or end with a hyphen.' }
    }
    if (clean.includes('--')) {
      return { valid: false, error: 'Subdomain cannot contain consecutive hyphens.' }
    }
    return {
      valid: false,
      error: 'Only lowercase letters (a-z), numbers (0-9), and hyphens are allowed.',
    }
  }

  if (isReservedSubdomain(clean)) {
    return { valid: false, error: `"${clean}" is a reserved system address. Please choose another handle.` }
  }

  return { valid: true }
}

/**
 * Extracts the portfolio subdomain slug from a request hostname.
 * Returns null if the hostname represents the apex domain, an IP, localhost without subdomain,
 * or a reserved system subdomain (e.g. www, app, admin).
 */
export function getSubdomainFromHostname(hostname?: string): string | null {
  if (typeof window === 'undefined' && !hostname) return null
  const rawHost = (hostname || (typeof window !== 'undefined' ? window.location.hostname : '') || '').toLowerCase().trim()

  if (!rawHost) return null

  // Strip port if present
  const host = rawHost.replace(/:\d+$/, '')

  // 1. Ignore IP addresses
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) return null

  // 2. Localhost testing (e.g. john.localhost)
  if (host === 'localhost') return null
  if (host.endsWith('.localhost')) {
    const sub = host.slice(0, -'.localhost'.length)
    if (!sub || isReservedSubdomain(sub)) return null
    return sub
  }

  const platformDomain = getPlatformDomain()

  // 3. Exact apex domain match
  if (host === platformDomain) return null

  // 4. Platform subdomain match (e.g. username.prbuilder.in)
  if (host.endsWith(`.${platformDomain}`)) {
    const prefix = host.slice(0, -(platformDomain.length + 1))
    const parts = prefix.split('.')
    const slug = parts[parts.length - 1]
    if (!slug || isReservedSubdomain(slug)) return null
    return slug
  }

  // 5. Also support identity.kaizenq.me if deployed under existing host
  if (host.endsWith('.identity.kaizenq.me')) {
    const prefix = host.slice(0, -'.identity.kaizenq.me'.length)
    const parts = prefix.split('.')
    const slug = parts[parts.length - 1]
    if (!slug || isReservedSubdomain(slug)) return null
    return slug
  }

  return null
}

/**
 * Builds the canonical public URL for a published subdomain.
 * In production: https://username.prbuilder.in
 * In local development: http://username.localhost:5174 (or current port)
 */
export function buildSubdomainUrl(slug: string): string {
  const cleanSlug = slug.trim().toLowerCase()
  const platform = getPlatformDomain()

  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    const port = window.location.port ? `:${window.location.port}` : ''

    // Local development support
    if (host === 'localhost' || host.endsWith('.localhost')) {
      return `${window.location.protocol}//${cleanSlug}.localhost${port}`
    }
  }

  return `https://${cleanSlug}.${platform}`
}

/**
 * Returns the apex application URL for returning to the main dashboard or home page
 * from a subdomain context.
 */
export function getApexUrl(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase()
    const port = window.location.port ? `:${window.location.port}` : ''

    if (host.endsWith('.localhost')) {
      return `${window.location.protocol}//localhost${port}`
    }

    const platform = getPlatformDomain()
    if (host.endsWith(`.${platform}`)) {
      return `https://${platform}`
    }

    if (host.endsWith('.identity.kaizenq.me')) {
      return `https://identity.kaizenq.me`
    }

    return window.location.origin
  }

  return `https://${getPlatformDomain()}`
}
