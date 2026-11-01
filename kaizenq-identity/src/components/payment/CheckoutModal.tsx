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
  FlaskConical,
  Tag,
  Gift,
  ArrowRight,
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
  const [order, setOrder] = useState<CreateOrderResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300) // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState<PaymentOrderStatus>('pending')
  const [confirmedUtr, setConfirmedUtr] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)

  // Coupon State
  const [couponInput, setCouponInput] = useState<string>('')
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResult | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isFulfillingFree, setIsFulfillingFree] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  const originalRupees = Math.round((pricePaise / 100) * 100) / 100

  // 1. Initialize Order (with optional coupon)
  const initOrderWithCoupon = useCallback(
    async (codeToApply?: string) => {
      setLoading(true)
      setError(null)
      setPaymentStatus('pending')
      setSecondsRemaining(300)

      const isSandboxEnv = import.meta.env.VITE_PAYMENT_MODE !== 'live'

      const res = await paymentService.createOrder(productId, isSandboxEnv, codeToApply)
      if (res.error || !res.data) {
        setError(res.error?.message || 'Unable to create payment session. Please try again.')
        setLoading(false)
        return
      }

      setOrder(res.data)
      setLoading(false)
    },
    [productId],
  )

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setAppliedCoupon(null)
      setCouponInput(initialCouponCode || '')
      setCouponError(null)
      initOrderWithCoupon(initialCouponCode)
    } else {
      if (order?.orderId && paymentStatus === 'pending') {
        paymentService.cancelOrder(order.orderId).catch(() => {})
      }
      setOrder(null)
      setAppliedCoupon(null)
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [isOpen])

  // 2. Render QR Code onto Canvas
  useEffect(() => {
    if (!order?.upiUri || !canvasRef.current || appliedCoupon?.isFree) return

    QRCode.toCanvas(
      canvasRef.current,
      order.upiUri,
      {
        width: 220,
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
  }, [order?.upiUri, loading, appliedCoupon])

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

  // 4. Status Auto-Polling
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
    }, 2500)

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [isOpen, order, paymentStatus, appliedCoupon])

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

      // Valid coupon
      setAppliedCoupon(res.data)

      if (res.data.isFree) {
        // 100% Free: cancel previous pending order and clear UPI QR
        if (order?.orderId) {
          paymentService.cancelOrder(order.orderId).catch(() => {})
        }
        setOrder(null)
      } else {
        // Re-generate order with coupon discount applied
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

  // Handle Copy Actions
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedVpa(true)
    setTimeout(() => setCopiedVpa(false), 2000)
  }

  // Handle Sandbox Simulation
  const handleSimulatePayment = async () => {
    if (!order) return
    setIsSimulating(true)
    const simulatedUtr = `UTR${Date.now()}${Math.random().toString(16).slice(2, 6).toUpperCase()}`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#2563EB]">
              {appliedCoupon?.isFree ? <Gift className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0F172A]">
                  {appliedCoupon?.isFree ? '100% Sponsored Unlock' : 'UPI Instant Checkout'}
                </h3>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  YouPI-PG
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {appliedCoupon?.isFree
                  ? 'Server-verified promotional sponsorship'
                  : 'Scan with any UPI app for zero-fee activation'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto" />
              <p className="text-sm font-medium text-[#0F172A]">Generating secure payment session...</p>
              <p className="text-xs text-[#64748B]">Verifying catalog pricing on PR Builder server</p>
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900">Payment Session Error</p>
                <p className="text-xs text-red-700 mt-1 max-w-sm mx-auto">{error}</p>
              </div>
              <Button onClick={() => initOrderWithCoupon()} variant="primary" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Try Again
              </Button>
            </div>
          ) : paymentStatus === 'paid' ? (
            /* Success State */
            <div className="py-8 text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs px-3 py-1">
                  Access Verified & Entitlement Granted
                </Badge>
                <h4 className="text-xl font-bold text-[#0F172A] mt-2">Access Granted!</h4>
                <p className="text-xs text-[#64748B] mt-1">
                  <span className="font-semibold text-[#0F172A]">{productTitle}</span> is now permanently unlocked for your account.
                </p>
              </div>

              {/* Receipt details */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] text-left text-xs space-y-2">
                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Order Reference</span>
                  <span className="font-mono text-[#0F172A]">{order?.orderId}</span>
                </div>
                {confirmedUtr && (
                  <div className="flex justify-between items-center text-[#64748B]">
                    <span>Reference / UTR</span>
                    <span className="font-mono text-emerald-700 font-semibold">{confirmedUtr}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between items-center text-[#64748B]">
                    <span>Coupon Applied</span>
                    <span className="font-semibold text-emerald-600">{appliedCoupon.couponCode}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                  <span>Amount Settled</span>
                  <span className="font-bold text-[#0F172A]">₹{displayFinalRupees}</span>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-blue-500/20 py-3 rounded-2xl text-sm font-semibold"
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
            <div className="py-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Payment Session Expired</p>
                <p className="text-xs text-[#64748B] mt-1">
                  This payment session expired after 5 minutes for transaction security.
                </p>
              </div>
              <Button onClick={() => initOrderWithCoupon()} variant="primary" size="sm">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Generate New Session
              </Button>
            </div>
          ) : (
            /* Active Checkout Flow */
            <div className="space-y-5">
              {/* Product and Line-Item Pricing Card */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]/70">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Item Selected</p>
                    <p className="text-sm font-bold text-[#0F172A] mt-0.5">{productTitle}</p>
                  </div>
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px]">
                    Lifetime Access
                  </Badge>
                </div>

                {/* Line Items Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-[#64748B]">
                    <span>Original Price</span>
                    <span className="font-semibold text-[#0F172A]">₹{displayOriginalRupees}</span>
                  </div>

                  {(appliedCoupon || Number(displayDiscountRupees) > 0) && (
                    <div className="flex justify-between items-center text-emerald-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Discount ({appliedCoupon?.couponCode || order?.couponCode})</span>
                      </span>
                      <span>-₹{displayDiscountRupees}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0] text-sm">
                    <span className="font-bold text-[#0F172A]">Payable Total</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-[#0F172A]">
                        ₹{displayFinalRupees}
                      </span>
                      {appliedCoupon?.isFree && (
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                          100% Free Sponsor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Have a Promo Code or Voucher?</span>
                  </span>
                  {appliedCoupon && (
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-red-600 hover:text-red-700 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-900 font-mono">
                          {appliedCoupon.couponCode}
                        </span>
                        <span className="text-[11px] text-emerald-700 ml-2">
                          {appliedCoupon.message || 'Applied successfully'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="e.g. WELCOME10, HACKATHON100"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase())
                          if (couponError) setCouponError(null)
                        }}
                        className="w-full px-3 py-2 text-xs font-mono uppercase bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="text-xs px-4 py-2 border-[#CBD5E1] hover:bg-[#F1F5F9] font-semibold"
                    >
                      {isApplyingCoupon ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </form>
                )}

                {couponError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}
              </div>

              {/* 100% Free Order Action OR Standard Payment View */}
              {appliedCoupon?.isFree ? (
                /* Free Order Unlock Card */
                <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 rounded-2xl border border-emerald-300 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-emerald-950">
                      100% Free Promotional Unlock
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 max-w-sm mx-auto">
                      Your coupon <span className="font-mono font-bold">{appliedCoupon.couponCode}</span> covers the full price. No UPI transfer or credit card needed!
                    </p>
                  </div>

                  <Button
                    onClick={handleClaimFreeUnlock}
                    disabled={isFulfillingFree}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer"
                  >
                    {isFulfillingFree ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        Authorizing Free Access...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Claim Free Unlock Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                /* Standard UPI Payment Gateway View */
                <div className="space-y-5">
                  {/* QR and Mobile Intent Grid */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 justify-center">
                    {/* QR Code Canvas Frame */}
                    <div className="relative p-3 bg-white rounded-3xl border-2 border-[#2563EB]/20 shadow-md flex flex-col items-center shrink-0">
                      <canvas ref={canvasRef} className="rounded-xl" />
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-[#64748B]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Expires in: </span>
                        <span className="font-mono font-bold text-[#0F172A]">{formatTime(secondsRemaining)}</span>
                      </div>
                    </div>

                    {/* Mobile Intent Actions & Manual Details */}
                    <div className="flex-1 w-full space-y-3">
                      <p className="text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-[#2563EB]" />
                        <span>Pay with mobile UPI app:</span>
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={order?.upiUri}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-all"
                        >
                          <span>Google Pay</span>
                          <ExternalLink className="w-3 h-3 text-[#64748B]" />
                        </a>
                        <a
                          href={order?.upiUri}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-all"
                        >
                          <span>PhonePe</span>
                          <ExternalLink className="w-3 h-3 text-[#64748B]" />
                        </a>
                        <a
                          href={order?.upiUri}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-all"
                        >
                          <span>Paytm</span>
                          <ExternalLink className="w-3 h-3 text-[#64748B]" />
                        </a>
                        <a
                          href={order?.upiUri}
                          className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] transition-all"
                        >
                          <span>Any UPI App</span>
                          <ExternalLink className="w-3 h-3 text-[#64748B]" />
                        </a>
                      </div>

                      {/* Copy UPI VPA Option */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                          <div className="truncate pr-2">
                            <span className="text-[10px] text-[#64748B] block">UPI VPA:</span>
                            <span className="font-mono font-medium text-[#0F172A]">{order?.upiVpa}</span>
                          </div>
                          <button
                            onClick={() => order?.upiVpa && handleCopy(order.upiVpa)}
                            className="p-1.5 rounded-lg hover:bg-white text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                            title="Copy VPA"
                          >
                            {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Waiting status indicator */}
                  <div className="flex items-center justify-center gap-2 py-2 px-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-[#2563EB]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Listening for payment confirmation... Auto-activates in real time</span>
                  </div>

                  {/* Sandbox Simulation Panel (Visible during test/dev) */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                        <FlaskConical className="w-4 h-4 text-amber-600" />
                        <span>Developer Sandbox Test Simulation</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900">
                        Test Mode
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Safely test the atomic entitlement flow without real bank transfers. Simulates an NPCI webhook callback with a verified UTR.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={handleSimulatePayment}
                        disabled={isSimulating}
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2 rounded-xl shadow-sm cursor-pointer"
                      >
                        {isSimulating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            Simulating Payment...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                            Simulate Successful UPI Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Invariant Notice */}
              <div className="text-[11px] text-[#64748B] text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Peer-to-peer UPI protocol • 100% encrypted & verified server-side</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
