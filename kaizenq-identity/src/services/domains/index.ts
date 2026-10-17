import type { DomainCheckResult, DomainRecord } from '../../types/domain.ts'
import { slugify } from '../../lib/utils.ts'

/**
 * Domain Service Interface & Implementation
 * Prepares the platform for automated personal .xyz DNS routing and SSL provisioning
 */
export class DomainService {
  private reservedHandles = new Set([
    'admin',
    'root',
    'api',
    'app',
    'dashboard',
    'auth',
    'login',
    'billing',
    'support',
    'kaizenq',
  ])

  /**
   * Checks real-time availability of a personal .xyz domain handle
   */
  async checkAvailability(rawInput: string): Promise<DomainCheckResult> {
    const cleanHandle = slugify(rawInput)

    if (!cleanHandle || cleanHandle.length < 2) {
      return {
        domain: `${cleanHandle || 'yourname'}.xyz`,
        available: false,
        suggestionHandles: ['student-dev', 'builder-id'],
      }
    }

    const isReserved = this.reservedHandles.has(cleanHandle)
    const domain = `${cleanHandle}.xyz`

    // Simulation logic: handles over 2 chars and not reserved are marked available
    const available = !isReserved

    const suggestionHandles = !available
      ? [`${cleanHandle}-dev`, `${cleanHandle}-build`, `${cleanHandle}-code`]
      : []

    return {
      domain,
      available,
      isPremium: cleanHandle.length <= 3,
      suggestionHandles,
    }
  }

  /**
   * Simulates domain provisioning request
   */
  async requestProvision(handle: string, portfolioId: string): Promise<DomainRecord> {
    const cleanHandle = slugify(handle)
    const domain = `${cleanHandle}.xyz`

    return {
      id: `dom_${Date.now()}`,
      userId: 'usr_current',
      portfolioId,
      domain,
      tld: 'xyz',
      status: 'provisioning',
      sslActive: true,
      dnsConfig: [
        {
          type: 'CNAME',
          name: '@',
          value: 'cname.kaizenq.id',
          ttl: 300,
        },
      ],
      registeredAt: new Date().toISOString(),
      autoRenew: true,
    }
  }
}

export const domainService = new DomainService()
