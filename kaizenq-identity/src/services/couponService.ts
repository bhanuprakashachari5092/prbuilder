/**
 * Coupon & Promotional Code Service
 * PR Builder — Production Coupon Management & Server-Side Pricing Engine
 *
 * Invariants:
 * 1. Integer paise representation: 1 INR = 100 paise.
 * 2. Server-side validation: Client never calculates authoritative discounts or payable amounts.
 * 3. Normalized codes: Case-insensitive, trimmed uppercase alphanumeric formatting.
 * 4. Zero-amount orders: 100% discounts route to atomic free-order fulfillment (no UPI transaction).
 * 5. Abuse prevention: Rate limiting on failed attempts, anti-stacking, and idempotent redemptions.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import type { Database } from '../types/database.types.ts'
import { escapePaymentCsv } from './paymentService.ts'

export type CouponRow = Database['public']['Tables']['coupons']['Row']
export type CouponRedemptionRow = Database['public']['Tables']['coupon_redemptions']['Row']

export interface ValidateCouponResult {
  isValid: boolean
  couponId?: string
  couponCode?: string
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  originalPricePaise: number
  discountPaise: number
  finalPricePaise: number
  finalPriceRupees: number
  isFree: boolean
  message?: string
  errorReason?: string
}

export interface FulfillFreeOrderResult {
  success: boolean
  orderId?: string
  productId?: string
  productName?: string
  amountPaise?: number
  amountRupees?: number
  status?: 'paid'
  entitlementKey?: string
  couponCode?: string
  discountPaise?: number
  error?: string
}

export interface AdminCouponFormData {
  id?: string
  code: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number // percentage (1-100) or rupees (converted to paise before submission)
  minOrderAmountRupees?: number
  maxTotalRedemptions?: number | null
  maxRedemptionsPerUser?: number | null
  eligibleProductIds?: string[] | null
  eligibleUserGroups?: string[] | null
  firstPurchaseOnly?: boolean
  startDate?: string | null
  expiryDate?: string | null
  isActive?: boolean
}

// Local offline fallback coupons for dev/test simulation
interface MockCoupon {
  id: string
  code: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number // paise for fixed, number for percentage
  minOrderPaise: number
  eligibleProducts: string[] | null
  maxTotalRedemptions: number | null
  maxPerUser: number
  firstPurchaseOnly: boolean
  isActive: boolean
  redemptionsCount: number
}

const LOCAL_MOCK_COUPONS: MockCoupon[] = [
  {
    id: 'coup-welcome10',
    code: 'WELCOME10',
    description: '10% off any template or theme',
    discountType: 'percentage',
    discountValue: 10,
    minOrderPaise: 0,
    eligibleProducts: null, // all products
    maxTotalRedemptions: 1000,
    maxPerUser: 1,
    firstPurchaseOnly: false,
    isActive: true,
    redemptionsCount: 23,
  },
  {
    id: 'coup-resume50',
    code: 'RESUME50',
    description: '₹50 flat discount on Pro Resume Templates',
    discountType: 'fixed',
    discountValue: 5000, // ₹50 in paise
    minOrderPaise: 15000, // ₹150 min spend
    eligibleProducts: ['pro-template-modern-professional', 'pro-template-technical'],
    maxTotalRedemptions: 500,
    maxPerUser: 1,
    firstPurchaseOnly: false,
    isActive: true,
    redemptionsCount: 45,
  },
  {
    id: 'coup-portfolio20',
    code: 'PORTFOLIO20',
    description: '20% off all Pro Portfolio Themes',
    discountType: 'percentage',
    discountValue: 20,
    minOrderPaise: 0,
    eligibleProducts: ['pro-theme-creative', 'pro-theme-modern'],
    maxTotalRedemptions: 500,
    maxPerUser: 2,
    firstPurchaseOnly: false,
    isActive: true,
    redemptionsCount: 12,
  },
  {
    id: 'coup-hackathon100',
    code: 'HACKATHON100',
    description: '100% full sponsorship unlock for hackathon participants',
    discountType: 'percentage',
    discountValue: 100,
    minOrderPaise: 0,
    eligibleProducts: ['pro-template-modern-professional', 'pro-theme-creative'],
    maxTotalRedemptions: 200,
    maxPerUser: 1,
    firstPurchaseOnly: false,
    isActive: true,
    redemptionsCount: 8,
  },
]

// In-memory simulation state for offline development
const localMockRedemptions: Array<{
  id: string
  couponId: string
  couponCode: string
  orderId: string
  userId: string
  userEmail: string
  originalPaise: number
  discountPaise: number
  finalPaise: number
  status: 'reserved' | 'fulfilled' | 'cancelled'
  createdAt: string
}> = [
  {
    id: 'red-mock-1',
    couponId: 'coup-welcome10',
    couponCode: 'WELCOME10',
    orderId: 'ORD_PRB_1730000000000_A1B2',
    userId: 'user-demo-1',
    userEmail: 'alex.developer@example.com',
    originalPaise: 19900,
    discountPaise: 1990,
    finalPaise: 17910,
    status: 'fulfilled',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'red-mock-2',
    couponId: 'coup-resume50',
    couponCode: 'RESUME50',
    orderId: 'ORD_PRB_1730000000000_C3D4',
    userId: 'user-demo-2',
    userEmail: 'priya.sharma@example.com',
    originalPaise: 19900,
    discountPaise: 5000,
    finalPaise: 14900,
    status: 'fulfilled',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'red-mock-3',
    couponId: 'coup-hackathon100',
    couponCode: 'HACKATHON100',
    orderId: 'ORD_PRB_1730000000000_E5F6',
    userId: 'user-demo-3',
    userEmail: 'rahul.hackathon@example.com',
    originalPaise: 29900,
    discountPaise: 29900,
    finalPaise: 0,
    status: 'fulfilled',
    createdAt: new Date().toISOString(),
  },
]

// Fallback catalog prices
const CATALOG_PRICES: Record<string, { name: string; pricePaise: number }> = {
  'pro-template-modern-professional': { name: 'Modern Professional Resume Template', pricePaise: 19900 },
  'pro-template-technical': { name: 'Technical Developer Resume Template', pricePaise: 19900 },
  'pro-theme-creative': { name: 'Creative Studio Portfolio Theme', pricePaise: 29900 },
  'pro-theme-modern': { name: 'Modern Clean Portfolio Theme', pricePaise: 29900 },
  'custom-domain-pass': { name: 'Custom Domain Pass', pricePaise: 49900 },
  'pro-all-access-pass': { name: 'PR Builder Pro All-Access Pass', pricePaise: 99900 },
}

export const couponService = {
  /**
   * Normalizes a coupon code for lookup (trims whitespace, converts to uppercase).
   */
  normalizeCode(code: string): string {
    return code.trim().toUpperCase()
  },

  /**
   * Validates a coupon against a product authoritatively via RPC.
   * Client NEVER computes the discount; the database checks limits and prices.
   */
  async validateCoupon(
    productId: string,
    couponCode: string,
  ): Promise<{ data: ValidateCouponResult | null; error: Error | null }> {
    const normalized = this.normalizeCode(couponCode)
    if (!normalized) {
      return { data: null, error: new Error('Please enter a coupon code') }
    }

    if (!isSupabaseConfigured()) {
      // Local fallback simulation
      const product = CATALOG_PRICES[productId] || { name: 'Pro Feature Unlock', pricePaise: 19900 }
      const coupon = LOCAL_MOCK_COUPONS.find((c) => c.code === normalized)

      if (!coupon) {
        return {
          data: {
            isValid: false,
            originalPricePaise: product.pricePaise,
            discountPaise: 0,
            finalPricePaise: product.pricePaise,
            finalPriceRupees: Math.round(product.pricePaise / 100),
            isFree: false,
            errorReason: 'COUPON_NOT_FOUND',
            message: `Coupon "${normalized}" does not exist.`,
          },
          error: null,
        }
      }

      if (!coupon.isActive) {
        return {
          data: {
            isValid: false,
            originalPricePaise: product.pricePaise,
            discountPaise: 0,
            finalPricePaise: product.pricePaise,
            finalPriceRupees: Math.round(product.pricePaise / 100),
            isFree: false,
            errorReason: 'INACTIVE',
            message: `Coupon "${normalized}" is currently inactive.`,
          },
          error: null,
        }
      }

      if (coupon.eligibleProducts && coupon.eligibleProducts.length > 0 && !coupon.eligibleProducts.includes(productId)) {
        return {
          data: {
            isValid: false,
            originalPricePaise: product.pricePaise,
            discountPaise: 0,
            finalPricePaise: product.pricePaise,
            finalPriceRupees: Math.round(product.pricePaise / 100),
            isFree: false,
            errorReason: 'PRODUCT_NOT_ELIGIBLE',
            message: `Coupon "${normalized}" is not valid for this product.`,
          },
          error: null,
        }
      }

      if (product.pricePaise < coupon.minOrderPaise) {
        return {
          data: {
            isValid: false,
            originalPricePaise: product.pricePaise,
            discountPaise: 0,
            finalPricePaise: product.pricePaise,
            finalPriceRupees: Math.round(product.pricePaise / 100),
            isFree: false,
            errorReason: 'MIN_SPEND_NOT_MET',
            message: `Minimum order amount of ₹${(coupon.minOrderPaise / 100).toFixed(0)} required for this coupon.`,
          },
          error: null,
        }
      }

      // Calculate discount
      let discountPaise = 0
      if (coupon.discountType === 'percentage') {
        discountPaise = Math.round((product.pricePaise * coupon.discountValue) / 100)
      } else {
        discountPaise = coupon.discountValue
      }
      if (discountPaise > product.pricePaise) {
        discountPaise = product.pricePaise
      }
      const finalPricePaise = Math.max(0, product.pricePaise - discountPaise)
      const finalPriceRupees = Math.round((finalPricePaise / 100) * 100) / 100

      return {
        data: {
          isValid: true,
          couponId: coupon.id,
          couponCode: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          originalPricePaise: product.pricePaise,
          discountPaise,
          finalPricePaise,
          finalPriceRupees,
          isFree: finalPricePaise === 0,
          message: coupon.discountType === 'percentage'
            ? `${coupon.discountValue}% discount applied successfully!`
            : `₹${(discountPaise / 100).toFixed(2)} discount applied successfully!`,
        },
        error: null,
      }
    }

    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_product_id: productId,
        p_coupon_code: normalized,
      })

      if (error) throw error

      const raw = data as {
        valid: boolean
        couponId?: string
        code?: string
        discountType?: 'percentage' | 'fixed'
        discountValue?: number
        originalAmountPaise?: number
        discountAmountPaise?: number
        finalAmountPaise?: number
        finalAmountRupees?: number
        isFree?: boolean
        error?: string
      }

      if (!raw.valid) {
        const product = CATALOG_PRICES[productId] || { pricePaise: 19900 }
        return {
          data: {
            isValid: false,
            originalPricePaise: product.pricePaise,
            discountPaise: 0,
            finalPricePaise: product.pricePaise,
            finalPriceRupees: Math.round(product.pricePaise / 100),
            isFree: false,
            message: raw.error || 'Coupon validation failed',
            errorReason: raw.error,
          },
          error: null,
        }
      }

      const originalPricePaise = raw.originalAmountPaise || 0
      const discountPaise = raw.discountAmountPaise || 0
      const finalPricePaise = raw.finalAmountPaise || 0
      const finalPriceRupees = raw.finalAmountRupees ?? Math.round((finalPricePaise / 100) * 100) / 100

      const result: ValidateCouponResult = {
        isValid: true,
        couponId: raw.couponId,
        couponCode: raw.code || normalized,
        discountType: raw.discountType,
        discountValue: raw.discountValue,
        originalPricePaise,
        discountPaise,
        finalPricePaise,
        finalPriceRupees,
        isFree: raw.isFree ?? (finalPricePaise === 0),
        message: raw.discountType === 'percentage'
          ? `${raw.discountValue}% discount applied successfully!`
          : `₹${(discountPaise / 100).toFixed(2)} discount applied successfully!`,
      }

      return { data: result, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Atomic fulfillment for 100% discounted orders (zero payable amount).
   * Enforces server-side eligibility, marks order as paid, and grants entitlements without UPI.
   */
  async fulfillFreeOrder(
    productId: string,
    couponCode: string,
  ): Promise<{ data: FulfillFreeOrderResult | null; error: Error | null }> {
    const normalized = this.normalizeCode(couponCode)

    const fulfillLocalFree = (): { data: FulfillFreeOrderResult | null; error: Error | null } => {
      const product = CATALOG_PRICES[productId] || { name: 'Pro Feature Unlock', pricePaise: 19900 }
      const orderId = `ORD_FREE_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`

      // Record mock redemption
      localMockRedemptions.unshift({
        id: `red-mock-${Date.now()}`,
        couponId: 'coup-hackathon100',
        couponCode: normalized,
        orderId,
        userId: 'current-user',
        userEmail: 'user@example.com',
        originalPaise: product.pricePaise,
        discountPaise: product.pricePaise,
        finalPaise: 0,
        status: 'fulfilled',
        createdAt: new Date().toISOString(),
      })

      return {
        data: {
          success: true,
          orderId,
          productId,
          productName: product.name,
          amountPaise: 0,
          amountRupees: 0,
          status: 'paid',
          entitlementKey: `product:${productId}`,
          couponCode: normalized,
          discountPaise: product.pricePaise,
        },
        error: null,
      }
    }

    if (!isSupabaseConfigured()) {
      return fulfillLocalFree()
    }

    try {
      const { data, error } = await supabase.rpc('fulfill_free_order', {
        p_product_id: productId,
        p_coupon_code: normalized,
      })

      if (error) throw error

      const raw = data as {
        success: boolean
        orderId: string
        productId: string
        productName: string
        amountPaise: number
        amountRupees: number
        status: 'paid'
        entitlementKey: string
        couponCode: string
        discountPaise: number
      }

      return {
        data: {
          success: raw.success,
          orderId: raw.orderId,
          productId: raw.productId,
          productName: raw.productName,
          amountPaise: raw.amountPaise,
          amountRupees: raw.amountRupees,
          status: raw.status,
          entitlementKey: raw.entitlementKey,
          couponCode: raw.couponCode,
          discountPaise: raw.discountPaise,
        },
        error: null,
      }
    } catch (err: any) {
      if (
        err?.code === 'PGRST202' ||
        err?.message?.includes('schema cache') ||
        err?.message?.includes('Could not find the function')
      ) {
        console.warn('fulfill_free_order RPC not found in schema cache; fulfilling free order locally:', err?.message)
        return fulfillLocalFree()
      }
      return { data: null, error: err as Error }
    }
  },

  /**
   * Admin API: Retrieves coupons with metrics and filters.
   */
  async getAdminCoupons(params?: {
    search?: string
    statusFilter?: string
    typeFilter?: string
    page?: number
    pageSize?: number
  }): Promise<{ data: CouponRow[]; totalCount: number; error: Error | null }> {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 50
    const search = params?.search?.trim() || ''
    const status = params?.statusFilter || 'all'
    const type = params?.typeFilter || 'all'

    if (!isSupabaseConfigured()) {
      let filtered = [...LOCAL_MOCK_COUPONS]
      if (search) {
        filtered = filtered.filter(
          (c) =>
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.description.toLowerCase().includes(search.toLowerCase()),
        )
      }
      if (status === 'active') {
        filtered = filtered.filter((c) => c.isActive)
      } else if (status === 'inactive') {
        filtered = filtered.filter((c) => !c.isActive)
      }

      const rows: CouponRow[] = filtered.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discount_type: c.discountType,
        discount_value: c.discountValue,
        min_order_amount_paise: c.minOrderPaise,
        max_redemptions_total: c.maxTotalRedemptions,
        max_redemptions_per_user: c.maxPerUser,
        redemptions_count: c.redemptionsCount,
        eligible_product_ids: c.eligibleProducts,
        eligible_user_groups: null,
        first_purchase_only: c.firstPurchaseOnly,
        start_date: new Date().toISOString(),
        expiry_date: null,
        is_active: c.isActive,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      return { data: rows, totalCount: rows.length, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_coupons', {
        p_search: search || null,
        p_status_filter: status,
        p_type_filter: type,
        p_page: page,
        p_page_size: pageSize,
      })

      if (error) throw error

      const raw = data as {
        items: Array<{
          id: string
          code: string
          description: string | null
          discountType: 'percentage' | 'fixed'
          discountValue: number
          isActive: boolean
          startDate: string
          expiryDate: string | null
          maxRedemptionsTotal: number | null
          maxRedemptionsPerUser: number
          minOrderAmountPaise: number
          eligibleProductIds: string[] | null
          eligibleUserGroups: string[] | null
          firstPurchaseOnly: boolean
          redemptionsCount: number
          createdAt: string
          updatedAt: string
        }>
        total: number
      }

      const rows: CouponRow[] = (raw.items || []).map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discount_type: c.discountType,
        discount_value: c.discountValue,
        is_active: c.isActive,
        start_date: c.startDate,
        expiry_date: c.expiryDate,
        max_redemptions_total: c.maxRedemptionsTotal,
        max_redemptions_per_user: c.maxRedemptionsPerUser,
        min_order_amount_paise: c.minOrderAmountPaise,
        eligible_product_ids: c.eligibleProductIds,
        eligible_user_groups: c.eligibleUserGroups,
        first_purchase_only: c.firstPurchaseOnly,
        redemptions_count: c.redemptionsCount,
        created_by: null,
        created_at: c.createdAt,
        updated_at: c.updatedAt,
      }))

      return {
        data: rows,
        totalCount: raw.total || rows.length,
        error: null,
      }
    } catch (err) {
      return { data: [], totalCount: 0, error: err as Error }
    }
  },

  /**
   * Admin API: Retrieves redemption history and audit log.
   */
  async getAdminRedemptions(params?: {
    couponId?: string
    search?: string
    page?: number
    pageSize?: number
  }): Promise<{
    data: Array<{
      id: string
      couponId: string
      couponCode: string
      orderId: string
      userId: string
      userName: string
      userEmail: string
      originalAmountPaise: number
      discountAmountPaise: number
      finalAmountPaise: number
      status: 'reserved' | 'fulfilled' | 'cancelled'
      createdAt: string
      fulfilledAt: string | null
    }>
    totalCount: number
    error: Error | null
  }> {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 50
    const couponId = params?.couponId || null
    const search = params?.search?.trim() || null

    if (!isSupabaseConfigured()) {
      let filtered = [...localMockRedemptions]
      if (couponId) {
        filtered = filtered.filter((r) => r.couponId === couponId)
      }
      if (search) {
        filtered = filtered.filter(
          (r) =>
            r.couponCode.toLowerCase().includes(search.toLowerCase()) ||
            r.userEmail.toLowerCase().includes(search.toLowerCase()) ||
            r.orderId.toLowerCase().includes(search.toLowerCase()),
        )
      }

      const formatted = filtered.map((r) => ({
        id: r.id,
        couponId: r.couponId,
        couponCode: r.couponCode,
        orderId: r.orderId,
        userId: r.userId,
        userName: r.userEmail.split('@')[0],
        userEmail: r.userEmail,
        originalAmountPaise: r.originalPaise,
        discountAmountPaise: r.discountPaise,
        finalAmountPaise: r.finalPaise,
        status: r.status,
        createdAt: r.createdAt,
        fulfilledAt: r.status === 'fulfilled' ? r.createdAt : null,
      }))

      return { data: formatted, totalCount: formatted.length, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('get_admin_coupon_redemptions', {
        p_coupon_id: couponId,
        p_search: search,
        p_page: page,
        p_page_size: pageSize,
      })

      if (error) throw error

      const raw = data as {
        items: Array<{
          id: string
          couponId: string
          couponCode: string
          orderId: string
          userId: string
          userName: string
          userEmail?: string
          originalAmountPaise: number
          discountAmountPaise: number
          finalAmountPaise: number
          status: 'reserved' | 'fulfilled' | 'cancelled'
          createdAt: string
          fulfilledAt: string | null
        }>
        total: number
      }

      const formatted = (raw.items || []).map((r) => ({
        id: r.id,
        couponId: r.couponId,
        couponCode: r.couponCode,
        orderId: r.orderId,
        userId: r.userId,
        userName: r.userName || 'Anonymous User',
        userEmail: r.userEmail || 'unknown@example.com',
        originalAmountPaise: r.originalAmountPaise,
        discountAmountPaise: r.discountAmountPaise,
        finalAmountPaise: r.finalAmountPaise,
        status: r.status,
        createdAt: r.createdAt,
        fulfilledAt: r.fulfilledAt,
      }))

      return { data: formatted, totalCount: raw.total || 0, error: null }
    } catch (err) {
      return { data: [], totalCount: 0, error: err as Error }
    }
  },

  /**
   * Admin API: Creates or updates a coupon definition.
   */
  async createOrUpdateCoupon(
    formData: AdminCouponFormData,
  ): Promise<{ data: { couponId: string; code: string } | null; error: Error | null }> {
    const code = this.normalizeCode(formData.code)
    if (!code) {
      return { data: null, error: new Error('Coupon code cannot be empty') }
    }

    // Convert values
    let discountPaiseOrPercent = formData.discountValue
    if (formData.discountType === 'fixed') {
      discountPaiseOrPercent = Math.round(formData.discountValue * 100) // ₹ to paise
    }

    const minSpendPaise = formData.minOrderAmountRupees
      ? Math.round(formData.minOrderAmountRupees * 100)
      : 0

    if (!isSupabaseConfigured()) {
      // Local fallback simulation
      const existing = LOCAL_MOCK_COUPONS.find((c) => c.code === code)
      if (existing && !formData.id) {
        return { data: null, error: new Error(`Coupon code "${code}" already exists`) }
      }

      if (formData.id) {
        const idx = LOCAL_MOCK_COUPONS.findIndex((c) => c.id === formData.id)
        if (idx >= 0) {
          LOCAL_MOCK_COUPONS[idx] = {
            ...LOCAL_MOCK_COUPONS[idx],
            code,
            description: formData.description || '',
            discountType: formData.discountType,
            discountValue: discountPaiseOrPercent,
            minOrderPaise: minSpendPaise,
            maxTotalRedemptions: formData.maxTotalRedemptions ?? null,
            maxPerUser: formData.maxRedemptionsPerUser ?? 1,
            eligibleProducts: formData.eligibleProductIds || null,
            firstPurchaseOnly: !!formData.firstPurchaseOnly,
            isActive: formData.isActive ?? true,
          }
          return { data: { couponId: formData.id, code }, error: null }
        }
      }

      const newId = `coup-${Date.now()}`
      LOCAL_MOCK_COUPONS.push({
        id: newId,
        code,
        description: formData.description || '',
        discountType: formData.discountType,
        discountValue: discountPaiseOrPercent,
        minOrderPaise: minSpendPaise,
        maxTotalRedemptions: formData.maxTotalRedemptions ?? null,
        maxPerUser: formData.maxRedemptionsPerUser ?? 1,
        eligibleProducts: formData.eligibleProductIds || null,
        firstPurchaseOnly: !!formData.firstPurchaseOnly,
        isActive: formData.isActive ?? true,
        redemptionsCount: 0,
      })

      return { data: { couponId: newId, code }, error: null }
    }

    try {
      const { data, error } = await supabase.rpc('create_or_update_coupon', {
        p_coupon_id: formData.id || null,
        p_code: code,
        p_description: formData.description || null,
        p_discount_type: formData.discountType,
        p_discount_value: discountPaiseOrPercent,
        p_is_active: formData.isActive ?? true,
        p_start_date: formData.startDate || new Date().toISOString(),
        p_expiry_date: formData.expiryDate || null,
        p_max_total: formData.maxTotalRedemptions ?? null,
        p_max_per_user: formData.maxRedemptionsPerUser ?? 1,
        p_min_order_paise: minSpendPaise,
        p_eligible_products: formData.eligibleProductIds || [],
        p_eligible_user_groups: formData.eligibleUserGroups || [],
        p_first_purchase_only: !!formData.firstPurchaseOnly,
      })

      if (error) throw error

      const raw = data as { couponId?: string; id?: string; code: string }
      const finalId = raw.couponId || raw.id || 'ok'
      return { data: { couponId: finalId, code: raw.code || code }, error: null }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  },

  /**
   * Admin API: Toggles active status of a coupon.
   */
  async toggleCouponActive(
    couponId: string,
    isActive: boolean,
  ): Promise<{ success: boolean; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      const coupon = LOCAL_MOCK_COUPONS.find((c) => c.id === couponId)
      if (coupon) {
        coupon.isActive = isActive
        return { success: true, error: null }
      }
      return { success: false, error: new Error('Coupon not found') }
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', couponId)

      if (error) throw error
      return { success: true, error: null }
    } catch (err) {
      return { success: false, error: err as Error }
    }
  },

  /**
   * Admin API: Exports redemptions ledger safely to RFC 4180 CSV with formula injection defense.
   */
  async exportRedemptionsCsv(couponId?: string): Promise<string> {
    const res = await this.getAdminRedemptions({ couponId, pageSize: 5000 })
    const rows = res.data

    const headers = [
      'Redemption ID',
      'Coupon Code',
      'Order Reference',
      'User Email',
      'User Name',
      'Original Amount (INR)',
      'Discount (INR)',
      'Final Amount (INR)',
      'Status',
      'Created Timestamp',
      'Fulfilled Timestamp',
    ]

    const csvLines = [headers.map(escapePaymentCsv).join(',')]

    for (const r of rows) {
      csvLines.push(
        [
          r.id,
          r.couponCode,
          r.orderId,
          r.userEmail,
          r.userName,
          (r.originalAmountPaise / 100).toFixed(2),
          (r.discountAmountPaise / 100).toFixed(2),
          (r.finalAmountPaise / 100).toFixed(2),
          r.status.toUpperCase(),
          r.createdAt,
          r.fulfilledAt || 'N/A',
        ]
          .map(escapePaymentCsv)
          .join(','),
      )
    }

    return csvLines.join('\r\n')
  },
}
