import React, { useState, useEffect, useCallback } from 'react'
import {
  X,
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Tag,
  Gift,
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
      'Lifetime routing to your PR Elevate portfolio',
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

  const meta = METADATA_MAP[itemId] || {
    productId: `pro-${itemId}`,
    title: 'Premium Customization Feature',
    categoryLabel: 'Premium Add-On',
    tagline: 'Unlock enhanced layouts and custom design presentation.',
    highlights: ['Bespoke visual styling', 'Lifetime access', 'Unlimited edits and exports'],
    freeComparison: ['Standard layouts', 'Standard export options'],
    proComparison: ['Premium layouts', 'Enhanced presentation styling'],
    fallbackPaise: itemType === 'resume_template' ? 19900 : 29900,
  }

  // Authoritative ownership check
  const isReallyOwned =
    isOwnedProp ||
    hasAllAccessPass ||
    (itemType === 'resume_template' && isTemplateUnlocked(itemId as never)) ||
    (itemType === 'portfolio_theme' && isThemeUnlocked(itemId as never))
  const isOwned = isReallyOwned

  // Determine active product ID based on user selection
  const effectiveProductId = upgradeToLifetimePass ? 'pro-all-access-pass' : meta.productId
  const effectiveAddonIds =
    !upgradeToLifetimePass && includeDomainAddon && !hasDomainPass ? ['custom-domain-pass'] : []

  // Load product catalog info
  useEffect(() => {
    if (!isOpen) return
    paymentService.getProducts().then(({ data }) => {
      if (data) {
        const matched = data.find((p) => p.id === meta.productId)
        if (matched) setProduct(matched)
      }
    })
  }, [isOpen, meta.productId])

  // Recalculate authoritative server cart pricing whenever selection or coupon changes
  const refreshCartPricing = useCallback(async () => {
    setIsCalculating(true)
    const res = await paymentService.calculateCartPricing(
      effectiveProductId,
      effectiveAddonIds,
      activeCouponCode,
    )
    if (res.data) {
      setCartCalculation(res.data)
    }
    setIsCalculating(false)
  }, [effectiveProductId, effectiveAddonIds, activeCouponCode])

  useEffect(() => {
    if (isOpen) {
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

  const payablePaise = cartCalculation?.payablePaise ?? product?.price_paise ?? meta.fallbackPaise
  const payableRupees = Math.round((payablePaise / 100) * 100) / 100

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = couponCodeInput.trim().toUpperCase()
    setActiveCouponCode(trimmed ? trimmed : undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0F172A]">{meta.title}</h3>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                  {isReallyOwned ? 'OWNED' : 'PREMIUM'}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">{meta.categoryLabel}</p>
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

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tagline Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100 flex items-start gap-3">
            <Zap className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1E293B] leading-relaxed font-medium">
              {meta.tagline}
            </p>
          </div>

          {/* Key Benefits */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Included with this unlock
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {meta.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/70 text-xs text-[#334155]">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <span className="leading-snug">{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bundle & Add-On Customization Selector */}
          {!isReallyOwned && (
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center justify-between">
                <span>Bundle & Customization Options</span>
                <span className="text-[11px] text-emerald-600 font-semibold normal-case">
                  Optional Add-Ons
                </span>
              </h4>

              {/* Bundle Upgrade Card */}
              <div
                onClick={() => setUpgradeToLifetimePass(!upgradeToLifetimePass)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  upgradeToLifetimePass
                    ? 'bg-blue-50/70 border-[#2563EB] shadow-xs'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                      upgradeToLifetimePass
                        ? 'bg-[#2563EB] border-[#2563EB] text-white'
                        : 'border-[#CBD5E1] bg-white'
                    }`}
                  >
                    {upgradeToLifetimePass && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">
                        PR Elevate Pro All-Access Lifetime Pass
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                        Save ₹496
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Unlocks all premium templates, portfolio themes, and custom domain pass forever.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#0F172A]">₹999</span>
                  <span className="text-[10px] text-[#64748B] line-through block">₹1495</span>
                </div>
              </div>

              {/* Custom Domain Pass Add-On (if not lifetime pass) */}
              {!upgradeToLifetimePass && !hasDomainPass && (
                <div
                  onClick={() => setIncludeDomainAddon(!includeDomainAddon)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    includeDomainAddon
                      ? 'bg-blue-50/70 border-[#2563EB] shadow-xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${
                        includeDomainAddon
                          ? 'bg-[#2563EB] border-[#2563EB] text-white'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {includeDomainAddon && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#0F172A]">
                        Add Instant Custom Domain Pass
                      </span>
                      <p className="text-[11px] text-[#64748B]">
                        Connect your personal top-level domain (yourname.dev) with automated SSL.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0F172A] shrink-0">+₹499</span>
                </div>
              )}
            </div>
          )}

          {/* Coupon / Promo Code Input */}
          {!isReallyOwned && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#2563EB]" />
                Have a Promo or Student Code?
              </label>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME10, STUDENT50"
                  className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3 py-2 text-xs font-mono text-[#0F172A] uppercase focus:outline-none focus:border-[#2563EB]"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 border-[#CBD5E1] hover:bg-slate-100"
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
                    className="text-xs px-2 text-rose-600 hover:bg-rose-50"
                  >
                    Remove
                  </Button>
                )}
              </form>

              {cartCalculation?.couponDiscountPaise ? (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Coupon <strong>{activeCouponCode}</strong> applied: saved ₹
                    {(cartCalculation.couponDiscountPaise / 100).toFixed(2)}!
                  </span>
                </div>
              ) : activeCouponCode && !isCalculating ? (
                <p className="text-[11px] text-rose-600">
                  Code &quot;{activeCouponCode}&quot; is not applicable to this cart.
                </p>
              ) : null}
            </div>
          )}

          {/* Authoritative Server Price Breakdown Table */}
          {cartCalculation && !isReallyOwned && (
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
              <span className="font-bold text-[#0F172A] block text-[11px] uppercase tracking-wider">
                Cart & Authoritative Pricing Summary
              </span>
              <div className="space-y-1.5 text-[#334155]">
                {cartCalculation.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-[#64748B]">
                      {item.title} {item.isAddon && '(Add-on)'}
                    </span>
                    <span className="font-mono">₹{(item.pricePaise / 100).toFixed(2)}</span>
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

                <div className="border-t border-[#E2E8F0] pt-2 flex justify-between items-center font-bold text-sm text-[#0F172A]">
                  <span>Total Payable (UPI / Zero-Pay)</span>
                  <span className="text-[#2563EB] font-mono">
                    ₹{(cartCalculation.payablePaise / 100).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[#64748B] pt-1">
                18% GST Included in MRP • Zero Payment Gateway Surcharges • Server-Authoritative
              </p>
            </div>
          )}

          {/* Content Safety Invariant Banner */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Zero Data Loss Guarantee:</strong> Your resume and portfolio entries remain 100% saved and preserved. Switching or previewing never clears your draft.
            </span>
          </div>
        </div>

        {/* Footer Actions with Server Confirmed Price */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {isOwned ? (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                You already own this premium feature
              </span>
            ) : (
              <div>
                <span className="text-[10px] text-[#64748B] block uppercase tracking-wider font-semibold">
                  Authoritative Price (UPI)
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#0F172A]">
                    {isCalculating ? '...' : `₹${payableRupees.toFixed(2)}`}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
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
              className="w-full sm:w-auto text-xs text-[#64748B] border-[#E2E8F0] hover:bg-white"
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
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
              >
                Apply Unlocked {itemType === 'resume_template' ? 'Template' : 'Theme'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const targetTitle = upgradeToLifetimePass
                    ? 'PR Elevate Pro All-Access Lifetime Pass'
                    : meta.title
                  onProceedToCheckout(effectiveProductId, payablePaise, targetTitle, activeCouponCode)
                }}
                className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-md shadow-blue-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
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
