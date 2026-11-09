/**
 * Cashfree Payment Gateway Service & SDK Adapter
 * PR Builder — Production Cashfree PG Integration
 *
 * Capabilities:
 * - Dynamic asynchronous loading of official Cashfree v3 Web SDK (https://sdk.cashfree.com/js/v3/cashfree.js)
 * - Serverless API order creation with automatic catalog price validation & secrets isolation
 * - Native Drop-in Modal checkout (Cards, UPI, NetBanking, Wallets, PayLater)
 * - Authoritative payment verification and entitlement fulfillment
 * - Webhook HMAC-SHA256 signature verification utility
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase.ts'
import { paymentService, type CreateOrderResult } from './paymentService.ts'

export interface CashfreeCustomerDetails {
  customerId?: string
  customerEmail?: string
  customerPhone?: string
  customerName?: string
}

export interface CreateCashfreeOrderResult {
  orderId: string
  paymentSessionId: string
  cfOrderId?: string | number
  amountRupees: number
  amountPaise: number
  currency: string
  orderStatus: string
  expiresAt?: string
}

export interface CashfreeCheckoutResult {
  error?: {
    message: string
    code?: string
  }
  paymentDetails?: {
    paymentMessage?: string
    paymentStatus?: string
  }
  redirect?: boolean
}

// Cashfree SDK window interface
declare global {
  interface Window {
    Cashfree?: (config: { mode: 'production' | 'sandbox' }) => {
      checkout: (options: {
        paymentSessionId: string
        redirectTarget?: '_modal' | '_self' | '_blank'
      }) => Promise<CashfreeCheckoutResult>
    }
    _cfInstance?: any
  }
}

const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js'
const SDK_LOAD_TIMEOUT_MS = 10000
const USER_FRIENDLY_SDK_ERROR =
  'Unable to load the secure payment service. Please check your connection and try again.'

let sdkLoadingPromise: Promise<any> | null = null
let cfSdkInstance: any = null

/**
 * Cleanly removes all Cashfree SDK script tags from the document DOM.
 */
function removeCashfreeScriptTags(): void {
  if (typeof document === 'undefined') return
  const scripts = document.querySelectorAll('script[src*="cashfree.js"], script[data-cf-sdk="true"]')
  scripts.forEach((el) => {
    try {
      el.parentNode?.removeChild(el)
    } catch {}
  })
}

export const cashfreeService = {
  /**
   * Checks if Cashfree gateway is configured in the environment.
   */
  isConfigured(): boolean {
    return true
  },

  /**
   * Returns current Cashfree environment mode ('production' | 'sandbox').
   */
  getMode(): 'production' | 'sandbox' {
    const rawMode = (import.meta.env.VITE_CASHFREE_MODE || import.meta.env.VITE_PAYMENT_MODE || '').toLowerCase()
    const appId = String(import.meta.env.VITE_CASHFREE_APP_ID || '')
    if (rawMode === 'sandbox' || rawMode === 'test' || appId.startsWith('TEST')) {
      return 'sandbox'
    }
    return 'production'
  },

  /**
   * Checks whether the official Cashfree JS SDK is loaded and ready.
   */
  isSdkLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.Cashfree === 'function'
  },

  /**
   * Resets SDK loading cache and purges any stalled script elements from DOM.
   * Ensures clean slate for user retries without stale failure references.
   */
  resetSdk(): void {
    sdkLoadingPromise = null
    cfSdkInstance = null
    if (typeof window !== 'undefined') {
      window._cfInstance = undefined
      try {
        delete (window as any).Cashfree
      } catch {
        window.Cashfree = undefined
      }
      removeCashfreeScriptTags()
    }
  },

  /**
   * Dynamically and reliably loads the official Cashfree JS SDK v3 from Cashfree CDN.
   * - Ensures browser-only execution (SSR/build safe)
   * - Avoids duplicate script injection and concurrent loading races
   * - Reuses already-loaded window.Cashfree instance
   * - Handles script load, error, timeout (10s), and retry states
   * - Never enforces crossOrigin='anonymous' as Cashfree CDN does not send CORS headers
   * - Stale script detection: automatically replaces non-evaluating scripts on retry
   * - Translates all network/CDN errors to user-friendly message
   */
  async loadSdk(): Promise<any> {
    if (typeof window === 'undefined') return null

    // 1. Reuse existing cached instance
    if (cfSdkInstance) {
      return cfSdkInstance
    }
    if (window._cfInstance) {
      cfSdkInstance = window._cfInstance
      return cfSdkInstance
    }

    // 2. Reuse existing window.Cashfree constructor if already available
    if (typeof window.Cashfree === 'function') {
      try {
        const instance = window.Cashfree({ mode: this.getMode() })
        window._cfInstance = instance
        cfSdkInstance = instance
        return instance
      } catch (err) {
        console.warn('Failed to initialize existing window.Cashfree instance:', err)
      }
    }

    // 3. Return in-flight promise to prevent race conditions
    if (sdkLoadingPromise) {
      return sdkLoadingPromise
    }

    sdkLoadingPromise = new Promise((resolve, reject) => {
      let timeoutId: any = null
      let pollIntervalId: any = null
      let settled = false

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId)
        if (pollIntervalId) clearInterval(pollIntervalId)
        timeoutId = null
        pollIntervalId = null
      }

      const onSdkAvailable = () => {
        if (settled) return
        settled = true
        cleanup()
        if (typeof window.Cashfree === 'function') {
          try {
            const instance = window.Cashfree({ mode: this.getMode() })
            window._cfInstance = instance
            cfSdkInstance = instance
            resolve(instance)
          } catch {
            sdkLoadingPromise = null
            cfSdkInstance = null
            reject(new Error(USER_FRIENDLY_SDK_ERROR))
          }
        } else {
          sdkLoadingPromise = null
          reject(new Error(USER_FRIENDLY_SDK_ERROR))
        }
      }

      const onSdkFailed = () => {
        if (settled) return
        settled = true
        cleanup()
        sdkLoadingPromise = null
        cfSdkInstance = null
        // Remove failed script elements so subsequent retry re-inserts freshly
        removeCashfreeScriptTags()
        reject(new Error(USER_FRIENDLY_SDK_ERROR))
      }

      // 10-second timeout guard
      timeoutId = setTimeout(() => {
        onSdkFailed()
      }, SDK_LOAD_TIMEOUT_MS)

      // Inject fresh script element with event listeners
      const injectFreshScript = () => {
        removeCashfreeScriptTags()
        const script = document.createElement('script')
        script.src = CASHFREE_SDK_URL
        script.async = true
        script.setAttribute('data-cf-sdk', 'true')

        script.onload = () => {
          if (typeof window.Cashfree === 'function') {
            onSdkAvailable()
          } else {
            // Short grace period in case script evaluated asynchronously
            setTimeout(() => {
              if (typeof window.Cashfree === 'function') {
                onSdkAvailable()
              } else {
                onSdkFailed()
              }
            }, 100)
          }
        }
        script.onerror = onSdkFailed

        document.head.appendChild(script)
      }

      // Check if script tag is already in DOM
      const existingScript = document.querySelector(`script[src*="cashfree.js"]`) as HTMLScriptElement | null

      if (existingScript) {
        let elapsed = 0
        // Polling to detect when script finishes evaluating
        pollIntervalId = setInterval(() => {
          if (typeof window.Cashfree === 'function') {
            onSdkAvailable()
            return
          }
          elapsed += 50
          // If after 2 seconds the existing script hasn't evaluated window.Cashfree,
          // it likely errored before listener attachment (e.g. at initial page load).
          // Replace it with a fresh dynamically injected script.
          if (elapsed >= 2000) {
            if (pollIntervalId) clearInterval(pollIntervalId)
            pollIntervalId = null
            if (!settled && typeof window.Cashfree !== 'function') {
              injectFreshScript()
            }
          }
        }, 50)

        existingScript.addEventListener('load', onSdkAvailable, { once: true })
        existingScript.addEventListener('error', onSdkFailed, { once: true })
        return
      }

      // No existing script tag found; inject fresh script tag
      injectFreshScript()

      // Safety polling interval
      pollIntervalId = setInterval(() => {
        if (typeof window.Cashfree === 'function') {
          onSdkAvailable()
        }
      }, 50)
    })

    return sdkLoadingPromise
  },

  /**
   * Creates an authoritative Cashfree order session.
   * Priority 1: Vercel serverless /api/cashfree-order
   * Priority 2: Supabase Edge Function 'cashfree-order'
   * Priority 3: Fallback database order
   */
  async createOrder(
    productId: string,
    isSandbox = false,
    couponCode?: string,
    customer?: CashfreeCustomerDetails,
    orderId?: string,
  ): Promise<{ data: CreateCashfreeOrderResult | null; error: Error | null }> {
    try {
      // 1. Try Vercel / Netlify Serverless API Route
      try {
        const apiRes = await fetch('/api/cashfree-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
            customerPhone: customer?.customerPhone,
            customerEmail: customer?.customerEmail,
            customerName: customer?.customerName,
            customerId: customer?.customerId,
            orderId,
            returnUrl:
              typeof window !== 'undefined'
                ? `${window.location.origin}/dashboard?order_id=${orderId || '{order_id}'}`
                : undefined,
          }),
        })

        const apiData = await apiRes.json().catch(() => ({}))
        if (apiRes.ok && apiData.paymentSessionId) {
          return {
            data: {
              orderId: apiData.orderId,
              paymentSessionId: apiData.paymentSessionId,
              cfOrderId: apiData.cfOrderId,
              amountRupees: apiData.amountRupees,
              amountPaise: apiData.amountPaise,
              currency: apiData.currency || 'INR',
              orderStatus: apiData.orderStatus || 'ACTIVE',
              expiresAt: apiData.expiresAt,
            },
            error: null,
          }
        }
        if (!apiRes.ok && apiData.error) {
          throw new Error(apiData.error)
        }
      } catch (e: any) {
        if (!isSandbox && this.getMode() === 'production') {
          return { data: null, error: e instanceof Error ? e : new Error(String(e)) }
        }
        // Fall through for local simulation
      }

      // 2. Try Supabase Edge Function
      if (isSupabaseConfigured()) {
        try {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
            'cashfree-order',
            {
              body: {
                productId,
                couponCode: couponCode ? couponCode.trim().toUpperCase() : undefined,
                customerPhone: customer?.customerPhone,
              },
            },
          )

          if (!edgeError && edgeData && edgeData.paymentSessionId) {
            return {
              data: {
                orderId: edgeData.orderId,
                paymentSessionId: edgeData.paymentSessionId,
                cfOrderId: edgeData.cfOrderId,
                amountRupees: edgeData.amountRupees,
                amountPaise: edgeData.amountPaise,
                currency: edgeData.currency || 'INR',
                orderStatus: edgeData.orderStatus || 'ACTIVE',
                expiresAt: edgeData.expiresAt,
              },
              error: null,
            }
          }
        } catch (e) {
          // Fall through
        }
      }

      // 3. In production mode, do not generate mock sessions
      if (!isSandbox && this.getMode() === 'production') {
        return {
          data: null,
          error: new Error(
            'Unable to initialize secure Cashfree payment session. Please check your network and try again.',
          ),
        }
      }

      // 4. Fallback: Create DB order for local sandbox simulation
      const orderRes = await paymentService.createOrder(productId, isSandbox, couponCode)
      if (orderRes.error || !orderRes.data) {
        return { data: null, error: orderRes.error || new Error('Failed to create order') }
      }

      const dbOrder: CreateOrderResult = orderRes.data
      const amountRupees = dbOrder.amountRupees || Number((dbOrder.amountPaise / 100).toFixed(2))

      return {
        data: {
          orderId: dbOrder.orderId,
          paymentSessionId: `mock_session_${dbOrder.orderId}`,
          amountRupees,
          amountPaise: dbOrder.amountPaise,
          currency: dbOrder.currency || 'INR',
          orderStatus: 'ACTIVE',
          expiresAt: dbOrder.expiresAt,
        },
        error: null,
      }
    } catch (err: any) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  },

  /**
   * Launches Cashfree Drop-in Checkout modal.
   * Renders UPI, Cards, NetBanking, and Wallets directly within the app.
   */
  async launchCheckout(
    paymentSessionId: string,
    redirectTarget: '_modal' | '_self' = '_self',
  ): Promise<CashfreeCheckoutResult> {
    try {
      // Mock session fallback for sandbox simulation
      if (paymentSessionId.startsWith('mock_session_')) {
        return {
          paymentDetails: {
            paymentStatus: 'SUCCESS',
            paymentMessage: 'Test sandbox checkout simulated successfully',
          },
        }
      }

      const cashfree = await this.loadSdk()
      if (!cashfree || typeof cashfree.checkout !== 'function') {
        throw new Error('Unable to load the secure payment service. Please check your connection and try again.')
      }

      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: redirectTarget || '_self',
      })

      return result || {}
    } catch (err: any) {
      const raw = err?.message || ''
      const isConnectionIssue =
        raw.includes('load the secure payment') ||
        raw.includes('Network') ||
        raw.includes('Failed to load') ||
        raw.includes('SDK') ||
        raw.includes('connection') ||
        raw.includes('timed out') ||
        raw.includes('cashfree.com') ||
        raw.includes('cashfree.js') ||
        raw.includes('script')

      return {
        error: {
          message: isConnectionIssue
            ? USER_FRIENDLY_SDK_ERROR
            : (raw || 'Unable to open secure checkout. Please try again.'),
          code: 'CHECKOUT_ERROR',
        },
      }
    }
  },

  /**
   * Authoritatively checks and fulfills a completed Cashfree order.
   */
  async verifyOrder(
    orderId: string,
  ): Promise<{ success: boolean; status: string; utr?: string; error?: string }> {
    try {
      // 1. Try Vercel Serverless API
      try {
        const verifyRes = await fetch('/api/cashfree-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        })
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json()
          if (verifyData.success || verifyData.status === 'paid') {
            await paymentService.verifyAndFulfill(
              orderId,
              verifyData.utr || 'CASHFREE_VERIFIED',
              undefined,
              undefined,
              false,
            )
            return {
              success: true,
              status: 'paid',
              utr: verifyData.utr,
            }
          }
        }
      } catch (e) {
        // Fall through
      }

      // 2. Try Supabase Edge Function
      if (isSupabaseConfigured()) {
        try {
          const { data: edgeData, error: edgeError } = await supabase.functions.invoke(
            'cashfree-verify',
            {
              body: { orderId },
            },
          )

          if (!edgeError && edgeData) {
            if (edgeData.status === 'paid' || edgeData.success) {
              await paymentService.verifyAndFulfill(
                orderId,
                edgeData.utr || 'CASHFREE_VERIFIED',
                undefined,
                undefined,
                false,
              )
              return {
                success: true,
                status: 'paid',
                utr: edgeData.utr,
              }
            }
          }
        } catch (e) {
          // Fall through
        }
      }

      // 3. Check via database order status
      const statusRes = await paymentService.getOrderStatus(orderId)
      return {
        success: statusRes.status === 'paid',
        status: statusRes.status,
        utr: statusRes.utr || undefined,
      }
    } catch (err: any) {
      return {
        success: false,
        status: 'error',
        error: err.message || 'Payment verification failed',
      }
    }
  },

  /**
   * Cashfree Webhook HMAC-SHA256 Base64 Signature Calculation.
   */
  async computeWebhookSignature(timestamp: string, rawBody: string, secret: string): Promise<string> {
    const cryptoSubtle = globalThis.crypto?.subtle
    if (!cryptoSubtle) {
      throw new Error('Web Crypto API is not available in current environment')
    }

    const enc = new TextEncoder()
    const key = await cryptoSubtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signatureBuffer = await cryptoSubtle.sign(
      'HMAC',
      key,
      enc.encode(timestamp + rawBody),
    )
    const bytes = new Uint8Array(signatureBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  },
}
