import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../app/providers/AuthContext.tsx'
import { paymentService } from '../services/paymentService.ts'
import type { ResumeTemplateId } from '../pages/Resume/types.ts'
import type { PortfolioThemeId } from '../pages/Portfolio/types.ts'

export interface EntitlementsState {
  unlockedKeys: Set<string>
  isLoading: boolean
  hasAllAccessPass: boolean
  hasDomainPass: boolean
  isTemplateUnlocked: (templateId: ResumeTemplateId) => boolean
  isThemeUnlocked: (themeId: PortfolioThemeId) => boolean
  isCustomDomainUnlocked: () => boolean
  refreshEntitlements: () => Promise<void>
}

// Free tiers available to every student without payment
export const FREE_RESUME_TEMPLATES: ResumeTemplateId[] = [
  'classic-ats',
  'minimal',
  'classic',
  'modern',
]

export const FREE_PORTFOLIO_THEMES: PortfolioThemeId[] = [
  'developer',
  'minimal',
  'midnight',
]

export function useEntitlements(): EntitlementsState {
  const { user, isAdmin } = useAuth()
  const [unlockedKeys, setUnlockedKeys] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadEntitlements = useCallback(async () => {
    if (!user) {
      setUnlockedKeys(new Set())
      setIsLoading(false)
      return
    }

    // Administrators automatically possess all entitlements
    if (isAdmin) {
      setUnlockedKeys(new Set(['*']))
      setIsLoading(false)
      return
    }

    try {
      const res = await paymentService.getUserPaymentHistory()
      const keys = new Set<string>()

      if (res.data?.entitlements) {
        res.data.entitlements.forEach((e) => {
          if (e.is_active) {
            keys.add(e.entitlement_key)
          }
        })
      }

      setUnlockedKeys(keys)
    } catch {
      // In case of error, default to empty set (free tiers remain active)
    } finally {
      setIsLoading(false)
    }
  }, [user, isAdmin])

  useEffect(() => {
    loadEntitlements()
  }, [loadEntitlements])

  const isTemplateUnlocked = useCallback(
    (templateId: ResumeTemplateId): boolean => {
      if (isAdmin) return true
      if (FREE_RESUME_TEMPLATES.includes(templateId)) return true
      if (unlockedKeys.has('*') || unlockedKeys.has('bundle:all_access')) return true
      return unlockedKeys.has(`template:${templateId}`)
    },
    [isAdmin, unlockedKeys],
  )

  const isThemeUnlocked = useCallback(
    (themeId: PortfolioThemeId): boolean => {
      if (isAdmin) return true
      if (FREE_PORTFOLIO_THEMES.includes(themeId)) return true
      if (unlockedKeys.has('*') || unlockedKeys.has('bundle:all_access')) return true
      return unlockedKeys.has(`theme:${themeId}`)
    },
    [isAdmin, unlockedKeys],
  )

  const isCustomDomainUnlocked = useCallback((): boolean => {
    if (isAdmin) return true
    if (unlockedKeys.has('*') || unlockedKeys.has('bundle:all_access')) return true
    return unlockedKeys.has('domain:custom')
  }, [isAdmin, unlockedKeys])

  const hasAllAccessPass = Boolean(isAdmin || unlockedKeys.has('*') || unlockedKeys.has('bundle:all_access'))
  const hasDomainPass = Boolean(hasAllAccessPass || unlockedKeys.has('domain:custom'))

  return {
    unlockedKeys,
    isLoading,
    hasAllAccessPass,
    hasDomainPass,
    isTemplateUnlocked,
    isThemeUnlocked,
    isCustomDomainUnlocked,
    refreshEntitlements: loadEntitlements,
  }
}
