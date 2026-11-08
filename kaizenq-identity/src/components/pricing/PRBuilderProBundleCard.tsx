import React from 'react'
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Info,
  Crown,
} from 'lucide-react'
import { Button } from '../ui/Button.tsx'
import { Badge } from '../ui/Badge.tsx'
import { formatINR, usePricingCatalog } from '../../hooks/usePricingCatalog.ts'

export interface PRBuilderProBundleCardProps {
  proPassPriceRupees: number
  componentSumRupees: number
  savingsRupees: number
  isOwned: boolean
  onUnlock: () => void
  className?: string
}

export const PRBuilderProBundleCard: React.FC<PRBuilderProBundleCardProps> = ({
  proPassPriceRupees,
  componentSumRupees,
  savingsRupees,
  isOwned,
  onUnlock,
  className = '',
}) => {
  const catalog = usePricingCatalog()
  const modProPrice = catalog.getTemplatePrice('modern-professional').formatted
  const techPrice = catalog.getTemplatePrice('technical').formatted
  const creativePrice = catalog.getThemePrice('creative').formatted
  const cleanPrice = catalog.getThemePrice('modern').formatted
  const domainPassPrice = catalog.getDomainPassPrice().formatted
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] text-white p-5 sm:p-6 shadow-xl ${className}`}
    >
      {/* Decorative background glow elements */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 rounded-full bg-purple-500/15 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Heading, Badge, Savings Economics */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-black shadow-md">
              <Crown className="w-4 h-4" />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                PR Builder Pro All-Access Lifetime Pass
              </h3>
              <Badge variant="accent" size="sm" className="bg-amber-400/20 text-amber-300 border-amber-400/40">
                LIFETIME PASS
              </Badge>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
            One-time purchase unlocking all current and future Pro resume templates, portfolio themes, and instant custom domain routing forever.
          </p>

          {/* Bundle Savings Comparison */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-[#94A3B8] text-[11px]">Individual Purchases Sum</div>
              <div className="text-sm font-semibold line-through text-slate-400">
                {formatINR(componentSumRupees)}
              </div>
              <div className="text-[10px] text-slate-400">
                (Modern Pro {modProPrice} + Tech {techPrice} + Creative {creativePrice} + Modern Clean {cleanPrice} + Custom Domain {domainPassPrice})
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-white/10" />

            <div className="space-y-1">
              <div className="text-amber-300 font-bold text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>All-Access Bundle Savings</span>
              </div>
              <div className="text-base font-extrabold text-emerald-400">
                Save {formatINR(savingsRupees)} Instantly
              </div>
              <div className="text-[10px] text-emerald-300/80">33% Discount vs buying separately</div>
            </div>
          </div>

          {/* Included Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-indigo-100/90">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Modern Professional Resume Template ({modProPrice} value)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Technical Developer Resume Template ({techPrice} value)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Creative Studio Portfolio Theme ({creativePrice} value)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Modern Clean Portfolio Theme ({cleanPrice} value)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Instant Custom Domain Pass & SSL ({domainPassPrice} value)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>All Future Pro Templates & Themes Included</span>
            </div>
          </div>

          {/* Explicit Scope Clarification */}
          <div className="flex items-start gap-2 text-[10px] text-slate-400 bg-white/5 p-2 rounded-lg border border-white/5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.2" />
            <span>
              <strong>Note on Custom Domains:</strong> PR Builder provides DNS edge routing and automated SSL certificate provisioning. Root domain registration (e.g. purchasing yourname.dev from registrars such as Cloudflare or Namecheap) is handled directly by you with the registrar.
            </span>
          </div>
        </div>

        {/* Right Column: Price Tag and Checkout Trigger */}
        <div className="flex flex-col items-start lg:items-end justify-center shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 space-y-3">
          <div className="text-left lg:text-right">
            <div className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">Catalog Price</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {formatINR(proPassPriceRupees)}
              </span>
              <span className="text-xs text-indigo-300">one-time</span>
            </div>
            <div className="text-[10px] text-indigo-300 mt-0.5">18% GST Included • Lifetime Validity</div>
          </div>

          {isOwned ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Pro All-Access Active on Your Account</span>
            </div>
          ) : (
            <Button
              variant="glow"
              size="md"
              onClick={onUnlock}
              className="w-full sm:w-auto text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg cursor-pointer flex items-center justify-center gap-2 py-3 px-6"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get All-Access for {formatINR(proPassPriceRupees)}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          <div className="text-[10px] text-slate-400 text-center lg:text-right">
            Secure UPI Checkout • Zero Duplicate Charges
          </div>
        </div>
      </div>
    </div>
  )
}
