import React, { useState, useEffect, useCallback } from 'react'
import {
  ShoppingCart,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import { Badge } from '../ui/Badge.tsx'
import {
  paymentService,
  type CartPricingResult,
} from '../../services/paymentService.ts'
import { couponService } from '../../services/couponService.ts'
import { formatINR } from '../../hooks/usePricingCatalog.ts'
import type { EntitlementsState } from '../../hooks/useEntitlements.ts'

export interface LivePricingSummaryProps {
  baseProductId: string
  baseItemName: string
  basePriceRupees: number
  baseIsFree: boolean
  addonProductIds: string[]
  onRemoveAddon?: (productId: string) => void
  onClearAddons?: () => void
  onContinueToPreview?: () => void
  entitlements: EntitlementsState
  onProceedToCheckout: (
    productId: string,
    amountPaise: number,
    title: string,
    couponCode?: string,
  ) => void
  className?: string
}

export const LivePricingSummary: React.FC<LivePricingSummaryProps> = ({
  baseProductId,
  baseItemName,
  basePriceRupees,
  baseIsFree,
  addonProductIds,
  onRemoveAddon,
  onClearAddons,
  onContinueToPreview,
  entitlements,
  onProceedToCheckout,
  className = '',
}) => {
  const [pricing, setPricing] = useState<CartPricingResult | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(false)

  // Coupon state
  const [couponInput, setCouponInput] = useState<string>('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false)

  // Determine effective primary product ID (if All-Access pass is among addons, make it base)
  const effectiveBaseId = addonProductIds.includes('pro-all-access-pass')
    ? 'pro-all-access-pass'
    : baseProductId

  const effectiveAddons = addonProductIds.includes('pro-all-access-pass')
    ? [] // Pro pass covers everything
    : addonProductIds.filter((id) => id !== effectiveBaseId)

  // Authoritative server cart recalculation
  const calculatePricing = useCallback(
    async (baseId: string, addons: string[], coupon?: string) => {
      setLoading(true)
      setError(null)

      try {
        const res = await paymentService.calculateCartPricing(baseId, addons, coupon || undefined)
        if (res.error) throw res.error
        setPricing(res.data)
      } catch (err) {
        setError((err as Error).message || 'Failed to calculate cart pricing')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    // Only calculate if base product is a paid product or if addons exist
    if (!baseIsFree || effectiveAddons.length > 0 || effectiveBaseId === 'pro-all-access-pass') {
      calculatePricing(effectiveBaseId, effectiveAddons, appliedCoupon || undefined)
    } else {
      setPricing(null)
      setLoading(false)
    }
  }, [effectiveBaseId, effectiveAddons.join(','), appliedCoupon, baseIsFree, calculatePricing])

  // Apply Coupon Handler
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setIsApplyingCoupon(true)
    setCouponError(null)

    const code = couponInput.trim().toUpperCase()
    try {
      const res = await couponService.validateCoupon(effectiveBaseId, code)
      if (!res.data || !res.data.isValid) {
        setCouponError(res.data?.errorReason || res.error?.message || 'Invalid or ineligible coupon code')
        return
      }

      setAppliedCoupon(code)
      setCouponInput('')
      await calculatePricing(effectiveBaseId, effectiveAddons, code)
    } catch {
      setCouponError('Error applying coupon. Please verify code.')
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  // Remove Coupon Handler
  const handleRemoveCoupon = async () => {
    setAppliedCoupon(null)
    setCouponError(null)
    await calculatePricing(effectiveBaseId, effectiveAddons, undefined)
  }

  // Check if user already owns the selected base product
  const isBaseOwned =
    entitlements.hasAllAccessPass ||
    (effectiveBaseId === 'custom-domain-pass' && entitlements.hasDomainPass) ||
    (effectiveBaseId === 'pro-all-access-pass' && entitlements.hasAllAccessPass) ||
    (effectiveBaseId.includes('template') &&
      entitlements.isTemplateUnlocked(
        effectiveBaseId.replace('pro-template-', '') as any,
      )) ||
    (effectiveBaseId.includes('theme') &&
      entitlements.isThemeUnlocked(effectiveBaseId.replace('pro-theme-', '') as any))

  // If user is solely on a free item with 0 paid addons, show free status
  if (baseIsFree && effectiveAddons.length === 0 && effectiveBaseId !== 'pro-all-access-pass') {
    return (
      <div
        className={`p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#111827] ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>{baseItemName}</span>
              <Badge variant="success" size="sm">
                FREE • ₹0
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              You are currently using the 100% free tier. All core styling, layouts, and exports are included at ₹0.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onContinueToPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onContinueToPreview}
              className="text-xs py-1.5 px-3 border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Continue to Preview
            </Button>
          )}
          <span className="text-[11px] font-mono text-slate-500 hidden md:inline">
            Free forever tier
          </span>
        </div>
      </div>
    )
  }

  const finalPayableRupees = pricing?.finalAmountRupees || basePriceRupees
  const finalPayablePaise = pricing?.finalAmountPaise ?? Math.round(basePriceRupees * 100)

  return (
    <div
      className={`max-w-5xl mx-auto rounded-3xl border border-blue-200 bg-white shadow-xl shadow-blue-500/5 text-[#0F172A] sticky bottom-4 z-20 overflow-hidden transition-all ${className}`}
    >
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/30 to-white border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              Package Price Summary
            </h4>
            <p className="text-[11px] text-slate-500">
              Transparent pricing with instant activation • Zero hidden charges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onClearAddons && addonProductIds.length > 0 && (
            <button
              type="button"
              onClick={onClearAddons}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
              title="Clear all add-on selections"
            >
              Clear Selections
            </button>
          )}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
            UPI / Cards
          </span>
        </div>
      </div>

      {/* Mobile Collapsible Header Bar */}
      <div className="flex md:hidden items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
            <ShoppingCart className="w-3.5 h-3.5" />
          </span>
          <div>
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              Total: {formatINR(finalPayableRupees)}
            </span>
            <button
              type="button"
              onClick={() => setIsMobileExpanded(!isMobileExpanded)}
              className="text-[11px] text-blue-600 font-medium flex items-center gap-0.5"
            >
              <span>{isMobileExpanded ? 'Hide Details' : 'View Breakdown'}</span>
              {isMobileExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={loading}
          onClick={() => {
            const title = pricing?.items.find((i) => i.isBase)?.name || baseItemName
            onProceedToCheckout(effectiveBaseId, finalPayablePaise, title, appliedCoupon || undefined)
          }}
          className="text-xs font-bold py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-xs"
        >
          <span>Checkout</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      {error && (
        <div className="mx-5 mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Itemized Line Items & Coupon Section */}
      <div className={`${isMobileExpanded ? 'block' : 'hidden'} md:block p-5 sm:p-6`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Selected Items + Coupon Input */}
          <div className="lg:col-span-7 space-y-4">
            {/* Line Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Selected Items ({pricing?.items.length || 1})</span>
                <span>Configured Price</span>
              </div>

              <div className="space-y-1.5">
                {pricing?.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {item.title || item.name}
                      </span>
                      {item.isBase ? (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                          Primary
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-indigo-50 text-indigo-700 border-indigo-200 shrink-0">
                          Add-on
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900">
                        {formatINR(item.priceRupees)}
                      </span>
                      {!item.isBase && onRemoveAddon && (
                        <button
                          onClick={() => onRemoveAddon(item.productId)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors rounded hover:bg-rose-50"
                          title={`Remove ${item.title || item.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bundle Savings Disclosure if All-Access is active */}
            {pricing && pricing.bundleSavingsPaise > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Configured Bundle Discount:</strong> Saves{' '}
                    {formatINR(pricing.bundleSavingsRupees)} vs buying items separately!
                  </span>
                </div>
                <span className="font-bold text-amber-800 font-mono text-[11px]">
                  -{formatINR(pricing.bundleSavingsRupees)}
                </span>
              </div>
            )}

            {/* Promotional Coupon Box */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Promotional Coupon</span>
                </span>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="text-slate-400">Available:</span>
                  {['WELCOME10', 'RESUME50', 'HACKATHON100'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setCouponInput(code)
                        setCouponError(null)
                      }}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 font-mono text-[10px] cursor-pointer transition-colors"
                      title={`Click to copy ${code}`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Coupon <strong>{appliedCoupon}</strong> Applied:
                    </span>
                    <span className="font-bold text-emerald-700">
                      -{formatINR(pricing?.discountRupees || 0)} Discount
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold text-xs cursor-pointer flex items-center gap-1 hover:underline"
                  >
                    <span>Remove</span>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase())
                        setCouponError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApplyCoupon()
                      }}
                      placeholder="Enter coupon code (e.g. WELCOME10)"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs font-mono uppercase text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyCoupon}
                    disabled={!couponInput.trim() || isApplyingCoupon}
                    className="text-xs px-4 py-2 border-[#CBD5E1] font-semibold hover:border-blue-500 hover:text-blue-600 shrink-0"
                  >
                    {isApplyingCoupon ? 'Checking...' : 'Apply Coupon'}
                  </Button>
                </div>
              )}

              {couponError && (
                <div className="text-[11px] text-rose-600 flex items-center gap-1 animate-in fade-in">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Actions */}
          <div className="lg:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="space-y-2 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-200">
                Order Summary
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Original Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatINR(pricing?.subtotalRupees || basePriceRupees)}
                </span>
              </div>

              {pricing && pricing.discountPaise > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-{formatINR(pricing.discountRupees)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-600 text-xs">
                <span>Taxes (GST 18%)</span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Included in MRP (₹0 extra surcharges)
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Final Payable Amount</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Authoritative: {pricing?.finalAmountPaise || finalPayablePaise} integer paise
                    </span>
                  </div>
                  <span className="text-2xl font-black text-blue-600 tracking-tight">
                    {formatINR(finalPayableRupees)}
                  </span>
                </div>
              </div>
            </div>

            {/* Duplicate Ownership Notification or Primary Pay Buttons */}
            {isBaseOwned && effectiveAddons.length === 0 ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Already Owned:</strong> You already possess this entitlement on your account. Zero duplicate charge.
                  </span>
                </div>
                <Badge variant="success" size="sm">
                  ACTIVE
                </Badge>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <Button
                  variant="glow"
                  size="md"
                  disabled={loading}
                  onClick={() => {
                    const title = pricing?.items.find((i) => i.isBase)?.name || baseItemName
                    onProceedToCheckout(effectiveBaseId, finalPayablePaise, title, appliedCoupon || undefined)
                  }}
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-300 shrink-0" />}
                  rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
                  className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 text-sm shadow-md shadow-blue-500/20 rounded-xl cursor-pointer justify-center whitespace-nowrap"
                >
                  Proceed to Payment ({formatINR(finalPayableRupees)})
                </Button>

                {onContinueToPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onContinueToPreview}
                    className="w-full text-xs font-semibold border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 py-2 rounded-xl cursor-pointer justify-center"
                  >
                    Continue to Preview
                  </Button>
                )}

                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant Entitlement Unlock • 100% Secure</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
