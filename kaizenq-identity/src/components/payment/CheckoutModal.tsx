import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  Smartphone,
  QrCode,
  RefreshCw,
  Tag,
  Gift,
  ArrowRight,
  CreditCard,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import QRCode from 'qrcode'
import { Button } from '../ui/Button.tsx'
import { Badge } from '../ui/Badge.tsx'
import {
  paymentService,
  type CreateOrderResult,
  type PaymentOrderStatus,
} from '../../services/paymentService.ts'
import {
  couponService,
  type ValidateCouponResult,
} from '../../services/couponService.ts'
import { cashfreeService } from '../../services/cashfreeService.ts'

export interface CheckoutModalProps {
  isOpen: boolean
  productId: string
  productTitle: string
  productCategory: 'resume_template' | 'portfolio_theme' | 'domain_pass' | 'bundle'
  pricePaise: number
  initialCouponCode?: string
  onClose: () => void
  onSuccess: (orderId: string, utr?: string) => void
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  productId,
  productTitle,
  pricePaise,
  initialCouponCode,
  onClose,
  onSuccess,
}) => {
  const isCashfreeConfigured = cashfreeService.isConfigured()

  const [order, setOrder] = useState<CreateOrderResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300) // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState<PaymentOrderStatus>('pending')
  const [confirmedUtr, setConfirmedUtr] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)

  // Payment Options & Cashfree State
  const [showQrCode, setShowQrCode] = useState<boolean>(!isCashfreeConfigured)
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null)
  const [isLaunchingCashfree, setIsLaunchingCashfree] = useState<boolean>(false)
  const [cashfreeError, setCashfreeError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState<boolean>(false)

  // Coupon State
  const [showCouponInput, setShowCouponInput] = useState<boolean>(false)
  const [couponInput, setCouponInput] = useState<string>('')
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResult | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isFulfillingFree, setIsFulfillingFree] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  const originalRupees = Math.round((pricePaise / 100) * 100) / 100

  // 1. Initialize Order
  const initOrderWithCoupon = useCallback(
    async (codeToApply?: string) => {
      setLoading(true)
      setError(null)
      setCashfreeError(null)
      setPaymentStatus('pending')
      setSecondsRemaining(300)

      const isSandboxEnv = import.meta.env.VITE_PAYMENT_MODE !== 'live'

      const res = await paymentService.createOrder(productId, isSandboxEnv, codeToApply)
      if (res.error || !res.data) {
        setError(res.error?.message || 'Unable to establish payment session. Please try again.')
        setLoading(false)
        return
      }

      setOrder(res.data)
      setLoading(false)

      // Preload Cashfree payment session silently in the background
      if (isCashfreeConfigured) {
        cashfreeService
          .createOrder(productId, isSandboxEnv, codeToApply)
          .then((cfRes) => {
            if (cfRes.data?.paymentSessionId) {
              setPaymentSessionId(cfRes.data.paymentSessionId)
            }
          })
          .catch(() => {})
      }
    },
    [productId, isCashfreeConfigured],
  )

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setAppliedCoupon(null)
      setCouponInput(initialCouponCode || '')
      setCouponError(null)
      setCashfreeError(null)
      setPaymentSessionId(null)
      setShowQrCode(!isCashfreeConfigured)
      setShowCouponInput(Boolean(initialCouponCode))
      if (isCashfreeConfigured) {
        cashfreeService.loadSdk().catch(() => {})
      }
      initOrderWithCoupon(initialCouponCode)
    } else {
      if (order?.orderId && paymentStatus === 'pending') {
        paymentService.cancelOrder(order.orderId).catch(() => {})
      }
      setOrder(null)
      setAppliedCoupon(null)
      setPaymentSessionId(null)
      setIsVerifying(false)
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [isOpen])

  // 2. Render QR Code onto Canvas when visible
  useEffect(() => {
    if (!order?.upiUri || !canvasRef.current || appliedCoupon?.isFree || !showQrCode) return

    QRCode.toCanvas(
      canvasRef.current,
      order.upiUri,
      {
        width: 180,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      },
      (err) => {
        if (err) {
          console.error('Failed to render QR Code:', err)
        }
      },
    )
  }, [order?.upiUri, loading, appliedCoupon, showQrCode])

  // 3. Countdown Timer (5 Minutes)
  useEffect(() => {
    if (!isOpen || !order || paymentStatus !== 'pending' || appliedCoupon?.isFree) return

    countdownTimerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
          setPaymentStatus('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [isOpen, order, paymentStatus, appliedCoupon])

  // 4. Background Status Auto-Polling
  useEffect(() => {
    if (!isOpen || !order || paymentStatus !== 'pending' || appliedCoupon?.isFree) return

    pollTimerRef.current = setInterval(async () => {
      const res = await paymentService.getOrderStatus(order.orderId)
      if (res.status === 'paid') {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        setPaymentStatus('paid')
        setConfirmedUtr(res.utr || 'CONFIRMED')
      } else if (res.status === 'expired' || res.status === 'cancelled') {
        if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        setPaymentStatus(res.status)
      }
    }, 3000)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [isOpen, order, paymentStatus, appliedCoupon])

  // Launch Cashfree Checkout Modal
  const handleLaunchCashfree = async () => {
    if (!order) return
    setIsLaunchingCashfree(true)
    setCashfreeError(null)

    try {
      let currentSession = paymentSessionId
      if (!currentSession) {
        const isSandboxEnv = import.meta.env.VITE_PAYMENT_MODE !== 'live'
        const cfRes = await cashfreeService.createOrder(
          productId,
          isSandboxEnv,
          appliedCoupon?.couponCode || initialCouponCode,
        )
        if (cfRes.data?.paymentSessionId) {
          currentSession = cfRes.data.paymentSessionId
          setPaymentSessionId(currentSession)
        } else if (cfRes.error) {
          throw cfRes.error
        }
      }

      if (!currentSession) {
        throw new Error('Could not establish Cashfree session. You can pay via QR below.')
      }

      setIsLaunchingCashfree(false)
      setIsVerifying(true)

      const checkoutRes = await cashfreeService.launchCheckout(currentSession, '_modal')
      if (checkoutRes.error) {
        setCashfreeError(checkoutRes.error.message || 'Payment window closed or cancelled')
      }

      // Verify status with server
      const verifyRes = await cashfreeService.verifyOrder(order.orderId)
      if (verifyRes.success) {
        await paymentService.verifyAndFulfill(
          order.orderId,
          verifyRes.utr || 'CASHFREE_VERIFIED',
          undefined,
          undefined,
          false,
        )
        setPaymentStatus('paid')
        setConfirmedUtr(verifyRes.utr || 'CASHFREE_VERIFIED')
      }
    } catch (err: any) {
      setCashfreeError(err?.message || 'Failed to open Cashfree checkout')
    } finally {
      setIsLaunchingCashfree(false)
      setIsVerifying(false)
    }
  }

  // Apply Coupon Action
  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = couponInput.trim().toUpperCase()
    if (!trimmed) {
      setCouponError('Please enter a coupon code')
      return
    }

    setIsApplyingCoupon(true)
    setCouponError(null)

    try {
      const res = await couponService.validateCoupon(productId, trimmed)
      if (res.error) {
        setCouponError(res.error.message || 'Failed to validate coupon')
        setIsApplyingCoupon(false)
        return
      }

      if (!res.data || !res.data.isValid) {
        setCouponError(res.data?.message || 'Invalid or expired coupon code')
        setIsApplyingCoupon(false)
        return
      }

      setAppliedCoupon(res.data)

      if (res.data.isFree) {
        if (order?.orderId) {
          paymentService.cancelOrder(order.orderId).catch(() => {})
        }
        setOrder(null)
      } else {
        if (order?.orderId) {
          await paymentService.cancelOrder(order.orderId).catch(() => {})
        }
        await initOrderWithCoupon(trimmed)
      }
    } catch (err) {
      setCouponError((err as Error).message || 'Validation error')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  // Remove Coupon Action
  const handleRemoveCoupon = async () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponError(null)

    if (order?.orderId) {
      await paymentService.cancelOrder(order.orderId).catch(() => {})
    }
    await initOrderWithCoupon()
  }

  // Handle Free Order Claim
  const handleClaimFreeUnlock = async () => {
    if (!appliedCoupon?.couponCode) return
    setIsFulfillingFree(true)
    setError(null)

    try {
      const res = await couponService.fulfillFreeOrder(productId, appliedCoupon.couponCode)
      if (res.error || !res.data?.success) {
        setError(res.error?.message || 'Failed to activate free access. Please try again.')
        setIsFulfillingFree(false)
        return
      }

      setPaymentStatus('paid')
      setConfirmedUtr(`PROMO_${appliedCoupon.couponCode}`)
      setOrder({
        orderId: res.data.orderId || `ORD_FREE_${Date.now()}`,
        productId,
        productName: productTitle,
        amountPaise: 0,
        amountRupees: 0,
        currency: 'INR',
        status: 'paid',
        upiVpa: 'PR Builder Promo',
        upiUri: '',
        expiresAt: new Date().toISOString(),
        isSandbox: false,
        originalAmountPaise: pricePaise,
        discountAmountPaise: pricePaise,
        couponCode: appliedCoupon.couponCode,
      })
    } catch (err) {
      setError((err as Error).message || 'Free order activation error')
    } finally {
      setIsFulfillingFree(false)
    }
  }

  // Handle Sandbox Simulation
  const handleSimulatePayment = async () => {
    if (!order) return
    setIsSimulating(true)
    const simulatedUtr = `CF_SIM_${Date.now()}_${Math.random().toString(16).slice(2, 6).toUpperCase()}`
    const res = await paymentService.verifyAndFulfill(
      order.orderId,
      simulatedUtr,
      'sandbox_simulated_sig',
      JSON.stringify({ simulated: true, orderId: order.orderId }),
      true,
    )
    setIsSimulating(false)

    if (res.data?.success) {
      setPaymentStatus('paid')
      setConfirmedUtr(simulatedUtr)
    } else {
      setError(res.error?.message || 'Sandbox simulation failed')
    }
  }

  // Handle Copy Actions
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedVpa(true)
    setTimeout(() => setCopiedVpa(false), 2000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  // Financial breakdown calculation
  const displayOriginalRupees = order?.originalAmountPaise
    ? (order.originalAmountPaise / 100).toFixed(2)
    : originalRupees.toFixed(2)

  const displayDiscountRupees = appliedCoupon
    ? (appliedCoupon.discountPaise / 100).toFixed(2)
    : order?.discountAmountPaise
    ? (order.discountAmountPaise / 100).toFixed(2)
    : '0.00'

  const displayFinalRupees = appliedCoupon?.isFree
    ? '0.00'
    : order?.amountRupees
    ? order.amountRupees.toFixed(2)
    : originalRupees.toFixed(2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              {appliedCoupon?.isFree ? (
                <Gift className="w-5 h-5 text-emerald-600" />
              ) : (
                <Lock className="w-4 h-4 text-[#2563EB]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] leading-tight">
                {appliedCoupon?.isFree ? 'Promotional Access Unlock' : 'Secure Checkout'}
              </h3>
              <p className="text-[11px] text-[#64748B]">
                {appliedCoupon?.isFree ? '100% Sponsored coupon applied' : 'Instant activation & lifetime access'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/50 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error ? (
            /* Error State */
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900">Payment Session Error</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
              <Button onClick={() => initOrderWithCoupon()} variant="primary" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Try Again
              </Button>
            </div>
          ) : paymentStatus === 'paid' ? (
            /* Success State */
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Payment Verified
                </span>
                <h4 className="text-lg font-bold text-[#0F172A] mt-2">Access Granted!</h4>
                <p className="text-xs text-[#64748B] mt-1">
                  <span className="font-semibold text-[#0F172A]">{productTitle}</span> is now active on your account.
                </p>
              </div>

              {/* Receipt Summary */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Order Ref</span>
                  <span className="font-mono text-[#0F172A] text-[11px]">{order?.orderId}</span>
                </div>
                {confirmedUtr && (
                  <div className="flex justify-between items-center text-[#64748B]">
                    <span>Reference / UTR</span>
                    <span className="font-mono text-emerald-700 font-semibold text-[11px]">{confirmedUtr}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[#64748B] pt-1.5 border-t border-[#E2E8F0]">
                  <span>Amount Settled</span>
                  <span className="font-bold text-[#0F172A]">₹{displayFinalRupees}</span>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20"
                onClick={() => {
                  if (order) {
                    onSuccess(order.orderId, confirmedUtr || undefined)
                  }
                  onClose()
                }}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Using Now
              </Button>
            </div>
          ) : paymentStatus === 'expired' ? (
            /* Expired State */
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Session Expired</p>
                <p className="text-xs text-[#64748B] mt-1">
                  Payment sessions expire after 5 minutes for transaction safety.
                </p>
              </div>
              <Button onClick={() => initOrderWithCoupon()} variant="primary" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Generate Fresh Session
              </Button>
            </div>
          ) : (
            /* Active Checkout Flow */
            <div className="space-y-4">
              {/* Product Card */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">Selected Upgrade</span>
                    <span className="text-sm font-bold text-[#0F172A] truncate block">{productTitle}</span>
                  </div>
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] shrink-0">
                    Lifetime
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]/70 text-xs">
                  <div className="flex items-center gap-1.5 text-[#64748B]">
                    <span>Original: ₹{displayOriginalRupees}</span>
                    {Number(displayDiscountRupees) > 0 && (
                      <span className="text-emerald-600 font-semibold">(-₹{displayDiscountRupees})</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[#0F172A]">₹{displayFinalRupees}</span>
                  </div>
                </div>
              </div>

              {/* Coupon Bar */}
              <div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-mono font-bold text-emerald-900">{appliedCoupon.couponCode}</span>
                        <span className="text-[11px] text-emerald-700 ml-1.5">Applied!</span>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : showCouponInput ? (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. WELCOME10)"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase())
                        if (couponError) setCouponError(null)
                      }}
                      className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="text-xs px-3.5 border-[#CBD5E1] font-semibold"
                    >
                      {isApplyingCoupon ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </Button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCouponInput(true)}
                    className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-semibold cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Have a promo code or voucher?</span>
                  </button>
                )}

                {couponError && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              {/* 100% Free Coupon Claim Flow */}
              {appliedCoupon?.isFree ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">100% Sponsored Access</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Code <span className="font-mono font-bold">{appliedCoupon.couponCode}</span> covers the full amount.
                    </p>
                  </div>
                  <Button
                    onClick={handleClaimFreeUnlock}
                    disabled={isFulfillingFree}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {isFulfillingFree ? 'Unlocking...' : 'Claim Free Access Now'}
                  </Button>
                </div>
              ) : (
                /* Primary Gateway Checkout Card */
                <div className="space-y-3 pt-1">
                  {/* Cashfree Main Action Box */}
                  <div className="p-4 bg-gradient-to-b from-[#F8FAFC] to-white rounded-2xl border border-[#CBD5E1] shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#2563EB]" />
                        <span>Instant Checkout</span>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Zero Convenience Fee
                      </span>
                    </div>

                    {/* Clean payment badges */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#475569]">
                      <span className="px-2 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium">Google Pay</span>
                      <span className="px-2 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium">PhonePe</span>
                      <span className="px-2 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium">Paytm</span>
                      <span className="px-2 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium">Cards (Visa/Mastercard/RuPay)</span>
                      <span className="px-2 py-1 rounded-lg bg-white border border-[#E2E8F0] font-medium">NetBanking</span>
                    </div>

                    {cashfreeError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span className="text-[11px]">{cashfreeError}</span>
                      </div>
                    )}

                    {/* Primary Pay Button */}
                    <Button
                      onClick={handleLaunchCashfree}
                      disabled={isLaunchingCashfree || loading}
                      className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-blue-500/20 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {isLaunchingCashfree ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Opening Secure Gateway...</span>
                        </>
                      ) : isVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Payment...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Proceed to Pay ₹{displayFinalRupees}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-0.5">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>256-bit encrypted via Cashfree</span>
                      </span>
                      <span className="font-mono text-[#64748B]">
                        Expires: {formatTime(secondsRemaining)}
                      </span>
                    </div>
                  </div>

                  {/* Collapsible Alternative: Direct UPI QR Scan */}
                  <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-[#F8FAFC] text-xs font-semibold text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>Or scan QR code directly with any UPI app</span>
                      </span>
                      {showQrCode ? <ChevronUp className="w-4 h-4 text-[#64748B]" /> : <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                    </button>

                    {showQrCode && (
                      <div className="p-4 bg-white border-t border-[#E2E8F0] space-y-3 animate-in fade-in duration-150">
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                          <div className="p-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm shrink-0">
                            <canvas ref={canvasRef} className="rounded-lg" />
                          </div>

                          <div className="flex-1 w-full space-y-2">
                            <p className="text-[11px] font-semibold text-[#0F172A] flex items-center gap-1">
                              <Smartphone className="w-3.5 h-3.5 text-[#2563EB]" />
                              <span>Deep links:</span>
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              <a
                                href={order?.upiUri}
                                className="p-1.5 rounded-lg border border-[#E2E8F0] text-[11px] font-semibold text-center text-[#334155] hover:bg-[#F8FAFC] flex items-center justify-center gap-1"
                              >
                                <span>GPay</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#64748B]" />
                              </a>
                              <a
                                href={order?.upiUri}
                                className="p-1.5 rounded-lg border border-[#E2E8F0] text-[11px] font-semibold text-center text-[#334155] hover:bg-[#F8FAFC] flex items-center justify-center gap-1"
                              >
                                <span>PhonePe</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#64748B]" />
                              </a>
                            </div>

                            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px]">
                              <span className="font-mono text-[#334155] truncate pr-1">{order?.upiVpa}</span>
                              <button
                                onClick={() => order?.upiVpa && handleCopy(order.upiVpa)}
                                className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                                title="Copy VPA"
                              >
                                {copiedVpa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#64748B]" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Developer Sandbox Test Simulation */}
                  <div className="pt-0.5 text-center">
                    <button
                      type="button"
                      onClick={handleSimulatePayment}
                      disabled={isSimulating}
                      className="text-[10px] text-[#94A3B8] hover:text-[#475569] transition-colors cursor-pointer"
                    >
                      {isSimulating ? 'Simulating test payment...' : 'Developer Sandbox Test Simulation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
