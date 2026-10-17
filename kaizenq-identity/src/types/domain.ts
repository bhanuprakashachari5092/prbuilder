/**
 * Domain Service Types for KaizenQ Identity
 */

export type DomainStatus =
  | 'available'
  | 'reserved'
  | 'provisioning'
  | 'active'
  | 'failed'
  | 'expired'

export interface DnsRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT'
  name: string
  value: string
  ttl: number
}

export interface DomainCheckResult {
  domain: string
  available: boolean
  isPremium?: boolean
  suggestionHandles?: string[]
}

export interface DomainRecord {
  id: string
  userId: string
  portfolioId: string
  domain: string
  tld: 'xyz' | 'id' | 'me' | 'dev'
  status: DomainStatus
  sslActive: boolean
  dnsConfig: DnsRecord[]
  registeredAt?: string
  expiresAt?: string
  autoRenew: boolean
}

export interface DomainProvisionRequest {
  portfolioId: string
  handle: string
  targetCname?: string
}
