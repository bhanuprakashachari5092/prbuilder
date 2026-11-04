import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  X,
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Tag,
  Gift,
  Crown,
} from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import {
  paymentService,
  type PaymentProduct,
  type CartPricingResult,
} from '../../services/paymentService.ts'
import { useEntitlements } from '../../hooks/useEntitlements.ts'

export interface PremiumUpgradeModalProps {
  isOpen: boolean
  itemType: 'resume_template' | 'portfolio_theme' | 'domain_pass'
  itemId: string
  isOwned?: boolean
  onClose: () => void
  onProceedToCheckout: (productId: string, pricePaise: number, title: string, couponCode?: string) => void
  onApplyOwned?: () => void
}

interface ItemDetails {
  productId: string
  title: string
  categoryLabel: string
  tagline: string
  highlights: string[]
  freeComparison: string[]
  proComparison: string[]
  fallbackPaise: number
}

const METADATA_MAP: Record<string, ItemDetails> = {
  'modern-professional': {
    productId: 'pro-template-modern-professional',
    title: 'Modern Professional ATS Resume',
    categoryLabel: 'Premium Resume Template',
    tagline: 'Split-header layout engineered for engineering managers and executive recruiters.',
    highlights: [
      'Two-tone split header showcasing contact and core competencies',
      'Optimized visual scanning hierarchy tested against ATS parsers',
      'Custom visual accent rules for clean multi-section separation',
      'Lifetime unlock with unlimited PDF exports and revisions',
    ],
    freeComparison: ['Standard ATS single-column', 'Basic serif/sans typography', 'Standard line rules'],
    proComparison: ['Modern split-header layout', 'Engineered visual hierarchy', 'Subtle designer accent framing'],
    fallbackPaise: 19900,
  },
  technical: {
    productId: 'pro-template-technical',
    title: 'Technical Developer ATS Resume',
    categoryLabel: 'Premium Resume Template',
    tagline: 'High-density developer layout highlighting code stacks, git projects, and terminal skills.',
    highlights: [
      'Monospace code-styled section badges and inline tech chips',
      'Dedicated projects and tech stack density tuned for FAANG screening',
      'High information density without sacrificing ATS keyword legibility',
      'Lifetime unlock with unlimited PDF exports and updates',
    ],
    freeComparison: ['Standard ATS single-column', 'Generic project bullets', 'Standard skills list'],
    proComparison: ['Terminal-style code highlights', 'High-density project showcase', 'Specialized tech stack chips'],
    fallbackPaise: 19900,
  },
  creative: {
    productId: 'pro-theme-creative',
    title: 'Creative Studio Portfolio Theme',
    categoryLabel: 'Premium Portfolio Theme',
    tagline: 'Vibrant portfolio showcase designed for UI/UX designers and creative technologists.',
    highlights: [
      'Dynamic gradient accents and smooth micro-interaction card reveals',
      'Visual case-study project layouts with live demo and source links',
      'Interactive timeline experience highlighting career milestones',
      'Instant responsive optimization across mobile, tablet, and widescreen',
    ],
    freeComparison: ['Developer & Minimal themes', 'Standard card grid', 'Standard typography'],
    proComparison: ['Vibrant gradient styling', 'Case-study project layout', 'Custom interactive card transitions'],
    fallbackPaise: 29900,
  },
  modern: {
    productId: 'pro-theme-modern',
    title: 'Modern Clean Portfolio Theme',
    categoryLabel: 'Premium Portfolio Theme',
    tagline: 'Sophisticated grid portfolio with polished typography and recruiter-ready contrast.',
    highlights: [
      'Architectural grid layout with balanced white-space and crisp borders',
      'Elevated typography hierarchy designed for quick executive scanning',
      'Interactive skill tags with category grouping and link embeds',
      'Lifetime unlock across all your published subdomains',
    ],
    freeComparison: ['Developer & Minimal themes', 'Standard card grid', 'Basic link badges'],
    proComparison: ['Architectural grid layout', 'Crisp executive typography', 'Interactive project modals'],
    fallbackPaise: 29900,
  },
  'custom-domain': {
    productId: 'custom-domain-pass',
    title: 'Instant Custom Domain Pass',
    categoryLabel: 'Domain Routing Pass',
    tagline: 'Connect your personal domain (e.g. yourname.dev) with automated SSL provisioning.',
    highlights: [
      'Instant domain linking without waiting for hackathon sponsorships',
      'Automatic TLS / SSL certificate generation and auto-renewal',
      'Custom DNS record manager with real-time verification status',
      'Lifetime routing to your PR Builder portfolio',
    ],
    freeComparison: ['Free kaizenq.me subdomain routing', 'Standard SSL encryption'],
    proComparison: ['Personal top-level domain linking', 'Automated SSL provisioning', 'Zero event eligibility wait'],
    fallbackPaise: 49900,
  },
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  itemType,
  itemId,
  isOwned: isOwnedProp = false,
  onClose,
  onProceedToCheckout,
  onApplyOwned,
}) => {
  const { hasAllAccessPass, hasDomainPass, isTemplateUnlocked, isThemeUnlocked } = useEntitlements()
  const [product, setProduct] = useState<PaymentProduct | null>(null)
  const [includeDomainAddon, setIncludeDomainAddon] = useState<boolean>(false)
  const [upgradeToLifetimePass, setUpgradeToLifetimePass] = useState<boolean>(false)
  const [couponCodeInput, setCouponCodeInput] = useState<string>('')
  const [activeCouponCode, setActiveCouponCode] = useState<string | undefined>(undefined)
  const [cartCalculation, setCartCalculation] = useState<CartPricingResult | null>(null)
  const [isCalculating, setIsCalculating] = useState<boolean>(false)

  const meta = useMemo(() => {
    return (
      METADATA_MAP[itemId] || {
        productId: `pro-${itemId}`,
        title: 'Premium Customization Feature',
        categoryLabel: 'Premium Add-On',
        tagline: 'Unlock enhanced layouts and custom design presentation.',
        highlights: ['Bespoke visual styling', 'Lifetime access', 'Unlimited edits and exports', 'Zero recurring subscriptions'],
        freeComparison: ['Standard layouts', 'Standard export options'],
        proComparison: ['Premium layouts', 'Enhanced presentation styling'],
        fallbackPaise: itemType === 'resume_template' ? 19900 : 29900,
      }
    )
  }, [itemId, itemType])

  // Authoritative ownership check
  const isReallyOwned =
    isOwnedProp ||
    hasAllAccessPass ||
    (itemType === 'resume_template' && isTemplateUnlocked(itemId as never)) ||
    (itemType === 'portfolio_theme' && isThemeUnlocked(itemId as never))
  const isOwned = isReallyOwned

  // Determine active product ID based on user selection
  const effectiveProductId = upgradeToLifetimePass ? 'pro-all-access-pass' : meta.productId

  // Memoize addon IDs array so reference is stable and prevents infinite re-render loops
  const effectiveAddonIds = useMemo(() => {
    return !upgradeToLifetimePass && includeDomainAddon && !hasDomainPass ? ['custom-domain-pass'] : []
  }, [upgradeToLifetimePass, includeDomainAddon, hasDomainPass])

  // Load product catalog info
  useEffect(() => {
    if (!isOpen) return
    let isSubscribed = true
    paymentService.getProducts().then(({ data }) => {
      if (isSubscribed && data) {
        const matched = data.find((p) => p.id === meta.productId)
        if (matched) setProduct(matched)
      }
    })
    return () => {
      isSubscribed = false
    }
  }, [isOpen, meta.productId])

  // Recalculate authoritative server cart pricing whenever selection or coupon changes
  const refreshCartPricing = useCallback(async () => {
    setIsCalculating(true)
    try {
      const res = await paymentService.calculateCartPricing(
        effectiveProductId,
        effectiveAddonIds,
        activeCouponCode,
      )
      if (res.data) {
        const safeData = { ...res.data }
        // Guard against accidental ₹0 calculation for pro items unless a genuine 100% coupon is active
        const isLegit100Coupon =
          activeCouponCode === 'HACKATHON100' ||
          (safeData.couponDiscountPaise > 0 && safeData.couponDiscountPaise >= safeData.subtotalPaise)

        if (safeData.payablePaise === 0 && !isLegit100Coupon && meta.fallbackPaise > 0) {
          safeData.payablePaise = meta.fallbackPaise
          safeData.finalAmountPaise = meta.fallbackPaise
          safeData.finalAmountRupees = Math.round((meta.fallbackPaise / 100) * 100) / 100
          safeData.isFree = false
        }
        setCartCalculation(safeData)
      }
    } catch (err) {
      console.warn('[PremiumUpgradeModal] Cart calculation warning:', err)
      // Fall back to clean local calculation
      const fallback = paymentService.computeLocalCartPricing(
        effectiveProductId,
        effectiveAddonIds,
        activeCouponCode,
      )
      setCartCalculation(fallback)
    } finally {
      setIsCalculating(false)
    }
  }, [effectiveProductId, effectiveAddonIds, activeCouponCode, meta.fallbackPaise])

  useEffect(() => {
    if (isOpen) {
      // Seed initial calculation immediately so UI is instantly populated without flashing
      const initial = paymentService.computeLocalCartPricing(
        effectiveProductId,
        effectiveAddonIds,
        activeCouponCode,
      )
      setCartCalculation(initial)
      refreshCartPricing()
    } else {
      setIncludeDomainAddon(false)
      setUpgradeToLifetimePass(false)
      setCouponCodeInput('')
      setActiveCouponCode(undefined)
      setCartCalculation(null)
    }
  }, [isOpen, refreshCartPricing])

  if (!isOpen) return null

  // Authoritative payable price calculation with zero-paise guard
  const rawPayablePaise = cartCalculation?.payablePaise ?? product?.price_paise ?? meta.fallbackPaise
  const isLegitimatelyFree =
    rawPayablePaise === 0 &&
    (activeCouponCode === 'HACKATHON100' ||
      ((cartCalculation?.couponDiscountPaise ?? 0) > 0 &&
        (cartCalculation?.couponDiscountPaise ?? 0) >= (cartCalculation?.subtotalPaise ?? 1)))

  const payablePaise = isLegitimatelyFree ? 0 : rawPayablePaise === 0 ? meta.fallbackPaise : rawPayablePaise
  const payableRupees = Math.round((payablePaise / 100) * 100) / 100

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = couponCodeInput.trim().toUpperCase()
    setActiveCouponCode(trimmed ? trimmed : undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] font-sans">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-white/95">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-blue-600/5 border border-blue-200/70 flex items-center justify-center text-blue-600 shadow-xs">
              <Crown className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {meta.title}
                </h3>
                <span
                  className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                    isReallyOwned
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {isReallyOwned ? 'OWNED' : 'PREMIUM'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{meta.categoryLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Refined Tagline Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/35 to-sky-50/50 border border-blue-100/90 flex items-start gap-3 shadow-2xs">
            <div className="p-1.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0 mt-0.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <p className="text-xs sm:text-[13px] text-slate-800 leading-relaxed font-medium">
              {meta.tagline}
            </p>
          </div>

          {/* Included Features Grid */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Included with this unlock
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {meta.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/70 text-xs text-slate-700 font-medium transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bundle & Add-On Customization Selector */}
          {!isReallyOwned && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Bundle & Customization Options
                </h4>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Optional Add-Ons
                </span>
              </div>

              {/* Pro All-Access Pass Bundle Card */}
              <div
                onClick={() => setUpgradeToLifetimePass(!upgradeToLifetimePass)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  upgradeToLifetimePass
                    ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                    : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors border ${
                      upgradeToLifetimePass
                        ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {upgradeToLifetimePass && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        PR Builder Pro All-Access Lifetime Pass
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-full">
                        Save ₹496
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Unlocks all premium templates, portfolio themes, and custom domain pass forever.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 font-mono block">₹999</span>
                  <span className="text-[10px] text-slate-400 line-through font-mono block">₹1495</span>
                </div>
              </div>

              {/* Custom Domain Pass Add-On */}
              {!upgradeToLifetimePass && !hasDomainPass && (
                <div
                  onClick={() => setIncludeDomainAddon(!includeDomainAddon)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    includeDomainAddon
                      ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                      : 'bg-slate-50/60 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors border ${
                        includeDomainAddon
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {includeDomainAddon && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Add Instant Custom Domain Pass
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                        Connect your personal top-level domain (yourname.dev) with automated SSL.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-900 font-mono shrink-0">+₹499</span>
                </div>
              )}
            </div>
          )}

          {/* Coupon / Promo Code Input */}
          {!isReallyOwned && (
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                Have a Promo or Student Code?
              </label>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10, STUDENT50"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-medium text-slate-900 uppercase placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="text-xs px-3.5 border-slate-200 hover:bg-slate-100 font-medium"
                >
                  {activeCouponCode ? 'Update' : 'Apply'}
                </Button>
                {activeCouponCode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCouponCodeInput('')
                      setActiveCouponCode(undefined)
                    }}
                    className="text-xs px-2 text-rose-600 hover:bg-rose-50 font-medium"
                  >
                    Remove
                  </Button>
                )}
              </form>

              {cartCalculation?.couponDiscountPaise ? (
                <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/90 font-medium">
                  <Gift className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Coupon <strong>{activeCouponCode}</strong> applied: saved ₹
                    {(cartCalculation.couponDiscountPaise / 100).toFixed(2)}!
                  </span>
                </div>
              ) : activeCouponCode && !isCalculating ? (
                <p className="text-[11px] text-rose-600 font-medium">
                  Code &quot;{activeCouponCode}&quot; is not applicable to this item.
                </p>
              ) : null}
            </div>
          )}

          {/* Authoritative Server Price Breakdown Receipt */}
          {cartCalculation && !isReallyOwned && (cartCalculation.items.length > 1 || cartCalculation.couponDiscountPaise > 0) && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5 text-xs">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                Cart & Authoritative Pricing Summary
              </span>
              <div className="space-y-1.5 text-slate-600">
                {cartCalculation.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-slate-500">
                      {item.title} {item.isAddon && '(Add-on)'}
                    </span>
                    <span className="font-mono font-medium text-slate-900">₹{(item.pricePaise / 100).toFixed(2)}</span>
                  </div>
                ))}

                {cartCalculation.bundleSavingsPaise > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Bundle Discount Savings</span>
                    <span className="font-mono">
                      -₹{(cartCalculation.bundleSavingsPaise / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                {cartCalculation.couponDiscountPaise > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Coupon Discount</span>
                    <span className="font-mono">
                      -₹{(cartCalculation.couponDiscountPaise / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between items-center font-bold text-sm text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-blue-600 font-mono text-base font-extrabold">
                    ₹{(cartCalculation.payablePaise / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pt-0.5">
                18% GST Included in MRP • Zero Payment Gateway Surcharges • Server-Authoritative
              </p>
            </div>
          )}

          {/* Content Safety Invariant Banner */}
          <div className="flex items-center gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Data Loss Guarantee:</strong> Your resume and portfolio entries remain 100% saved and preserved. Switching or previewing never clears your draft.
            </span>
          </div>
        </div>

        {/* Footer Actions with Authoritative Price */}
        <div className="px-6 py-4 bg-slate-50/95 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {isOwned ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                You already own this premium feature
              </span>
            ) : (
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-bold">
                  Authoritative Price (UPI)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
                    ₹{payableRupees.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    One-Time • Lifetime Access
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto text-xs text-slate-600 border-slate-200 hover:bg-white font-medium"
            >
              Keep Free {itemType === 'resume_template' ? 'Template' : 'Theme'}
            </Button>

            {isOwned ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onApplyOwned?.()
                  onClose()
                }}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm px-4 py-2"
              >
                Apply Unlocked {itemType === 'resume_template' ? 'Template' : 'Theme'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const targetTitle = upgradeToLifetimePass
                    ? 'PR Builder Pro All-Access Lifetime Pass'
                    : meta.title
                  onProceedToCheckout(effectiveProductId, payablePaise, targetTitle, activeCouponCode)
                }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/25 px-5 py-2.5 rounded-xl transition-all active:scale-[0.98]"
              >
                {payablePaise === 0
                  ? 'Fulfill Free with Promo (₹0.00)'
                  : `Unlock with UPI (₹${payableRupees.toFixed(2)})`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PremiumUpgradeModal
