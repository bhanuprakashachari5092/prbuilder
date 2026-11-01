import { useState, useEffect, useCallback, useMemo } from 'react'
import { paymentService, type PaymentProduct } from '../services/paymentService.ts'
import type { ResumeTemplateId } from '../pages/Resume/types.ts'
import type { PortfolioThemeId } from '../pages/Portfolio/types.ts'

export interface ProductPriceInfo {
  paise: number
  rupees: number
  formatted: string
  isFree: boolean
  product?: PaymentProduct
}

export interface PricingCatalogState {
  products: PaymentProduct[]
  isLoading: boolean
  error: Error | null
  getProduct: (id: string) => PaymentProduct | undefined
  getProductByTarget: (targetId: string, category?: string) => PaymentProduct | undefined
  getTemplatePrice: (templateId: ResumeTemplateId) => ProductPriceInfo
  getThemePrice: (themeId: PortfolioThemeId) => ProductPriceInfo
  getDomainPassPrice: () => ProductPriceInfo
  getProPassPrice: () => ProductPriceInfo & {
    componentSumPaise: number
    componentSumRupees: number
    savingsPaise: number
    savingsRupees: number
    savingsFormatted: string
  }
  refreshCatalog: () => Promise<void>
}

// Authoritative mapping from builder IDs to payment_products target_ids
export const TEMPLATE_PRODUCT_MAP: Record<string, string> = {
  'modern-professional': 'pro-template-modern-professional',
  'technical': 'pro-template-technical',
}

export const THEME_PRODUCT_MAP: Record<string, string> = {
  'creative': 'pro-theme-creative',
  'modern': 'pro-theme-modern',
}

// Free tier template & theme IDs (always ₹0)
export const FREE_RESUME_TEMPLATE_IDS: ResumeTemplateId[] = [
  'classic-ats',
  'minimal',
  'classic',
  'modern',
]

export const FREE_PORTFOLIO_THEME_IDS: PortfolioThemeId[] = [
  'developer',
  'minimal',
  'midnight',
]

export function formatINR(rupees: number): string {
  if (rupees === 0) return '₹0'
  return `₹${Math.round(rupees).toLocaleString('en-IN')}`
}

export function usePricingCatalog(): PricingCatalogState {
  const [products, setProducts] = useState<PaymentProduct[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const loadCatalog = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await paymentService.getProducts()
      if (res.error) throw res.error
      setProducts(res.data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  const productsMap = useMemo(() => {
    const map = new Map<string, PaymentProduct>()
    products.forEach((p) => {
      map.set(p.id, p)
      map.set(`${p.category}:${p.target_id}`, p)
    })
    return map
  }, [products])

  const getProduct = useCallback(
    (id: string): PaymentProduct | undefined => {
      return productsMap.get(id)
    },
    [productsMap],
  )

  const getProductByTarget = useCallback(
    (targetId: string, category?: string): PaymentProduct | undefined => {
      if (category) {
        return productsMap.get(`${category}:${targetId}`)
      }
      return products.find((p) => p.target_id === targetId)
    },
    [products, productsMap],
  )

  const getTemplatePrice = useCallback(
    (templateId: ResumeTemplateId): ProductPriceInfo => {
      if (FREE_RESUME_TEMPLATE_IDS.includes(templateId)) {
        return {
          paise: 0,
          rupees: 0,
          formatted: '₹0',
          isFree: true,
        }
      }

      const prodId = TEMPLATE_PRODUCT_MAP[templateId]
      const product = prodId ? productsMap.get(prodId) : undefined
      const paise = product ? product.price_paise : 19900
      const rupees = Math.round((paise / 100) * 100) / 100

      return {
        paise,
        rupees,
        formatted: formatINR(rupees),
        isFree: false,
        product,
      }
    },
    [productsMap],
  )

  const getThemePrice = useCallback(
    (themeId: PortfolioThemeId): ProductPriceInfo => {
      if (FREE_PORTFOLIO_THEME_IDS.includes(themeId)) {
        return {
          paise: 0,
          rupees: 0,
          formatted: '₹0',
          isFree: true,
        }
      }

      const prodId = THEME_PRODUCT_MAP[themeId]
      const product = prodId ? productsMap.get(prodId) : undefined
      const paise = product ? product.price_paise : 29900
      const rupees = Math.round((paise / 100) * 100) / 100

      return {
        paise,
        rupees,
        formatted: formatINR(rupees),
        isFree: false,
        product,
      }
    },
    [productsMap],
  )

  const getDomainPassPrice = useCallback((): ProductPriceInfo => {
    const product = productsMap.get('custom-domain-pass')
    const paise = product ? product.price_paise : 49900
    const rupees = Math.round((paise / 100) * 100) / 100
    return {
      paise,
      rupees,
      formatted: formatINR(rupees),
      isFree: false,
      product,
    }
  }, [productsMap])

  const getProPassPrice = useCallback(() => {
    const product = productsMap.get('pro-all-access-pass')
    const paise = product ? product.price_paise : 99900
    const rupees = Math.round((paise / 100) * 100) / 100

    // Compute actual individual sum of all eligible components
    const modernResume = productsMap.get('pro-template-modern-professional')?.price_paise ?? 19900
    const techResume = productsMap.get('pro-template-technical')?.price_paise ?? 19900
    const creativeTheme = productsMap.get('pro-theme-creative')?.price_paise ?? 29900
    const modernTheme = productsMap.get('pro-theme-modern')?.price_paise ?? 29900
    const domainPass = productsMap.get('custom-domain-pass')?.price_paise ?? 49900

    const componentSumPaise = modernResume + techResume + creativeTheme + modernTheme + domainPass // 149500 paise (₹1,495)
    const componentSumRupees = Math.round((componentSumPaise / 100) * 100) / 100

    const savingsPaise = Math.max(0, componentSumPaise - paise) // 49600 paise (₹496)
    const savingsRupees = Math.round((savingsPaise / 100) * 100) / 100

    return {
      paise,
      rupees,
      formatted: formatINR(rupees),
      isFree: false,
      product,
      componentSumPaise,
      componentSumRupees,
      savingsPaise,
      savingsRupees,
      savingsFormatted: formatINR(savingsRupees),
    }
  }, [productsMap])

  return {
    products,
    isLoading,
    error,
    getProduct,
    getProductByTarget,
    getTemplatePrice,
    getThemePrice,
    getDomainPassPrice,
    getProPassPrice,
    refreshCatalog: loadCatalog,
  }
}
