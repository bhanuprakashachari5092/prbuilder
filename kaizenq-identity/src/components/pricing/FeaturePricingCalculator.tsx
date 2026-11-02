import React from 'react'
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Eye,
  Check,
  Crown,
  Globe,
  ShieldCheck,
  Palette,
  Type,
  Layout,
  Layers,
  Code2,
  Sliders,
  HelpCircle,
} from 'lucide-react'
import { Badge } from '../ui/Badge.tsx'
import { formatINR } from '../../hooks/usePricingCatalog.ts'
import type { EntitlementsState } from '../../hooks/useEntitlements.ts'
import type { PricingCatalogState } from '../../hooks/usePricingCatalog.ts'
import type { ResumeTemplateId } from '../../pages/Resume/types.ts'
import type { PortfolioThemeId } from '../../pages/Portfolio/types.ts'

export interface FeaturePricingCalculatorProps {
  mode: 'resume' | 'portfolio'
  selectedTemplateOrTheme: string
  onSelectTemplateOrTheme: (id: string) => void
  selectedAddonIds: string[]
  onToggleAddon: (productId: string) => void
  entitlements: EntitlementsState
  catalog: PricingCatalogState
  onPreviewItem?: (type: 'resume' | 'portfolio', id: string) => void
  className?: string
}

export const FeaturePricingCalculator: React.FC<FeaturePricingCalculatorProps> = ({
  mode,
  selectedTemplateOrTheme,
  onSelectTemplateOrTheme,
  selectedAddonIds,
  onToggleAddon,
  entitlements,
  catalog,
  onPreviewItem,
  className = '',
}) => {
  const domainPass = catalog.getDomainPassPrice()
  const proPass = catalog.getProPassPrice()

  // 1. Templates / Themes Catalog Definitions
  const resumeTemplates = [
    {
      id: 'classic-ats' as ResumeTemplateId,
      name: 'Classic ATS Resume',
      desc: 'Single-column high-readability structure verified for corporate ATS scanners.',
      isFree: true,
      productId: undefined,
    },
    {
      id: 'minimal' as ResumeTemplateId,
      name: 'Minimal Editorial Resume',
      desc: 'Balanced typography with subtle divider rules for both digital & print.',
      isFree: true,
      productId: undefined,
    },
    {
      id: 'classic' as ResumeTemplateId,
      name: 'Classic Executive Resume',
      desc: 'Traditional executive format with centered coordinates and balanced margins.',
      isFree: true,
      productId: undefined,
    },
    {
      id: 'modern' as ResumeTemplateId,
      name: 'Modern Balanced Resume',
      desc: 'Crisp contemporary accent lines and compact headers for 1-page targets.',
      isFree: true,
      productId: undefined,
    },
    {
      id: 'modern-professional' as ResumeTemplateId,
      name: 'Modern Professional Resume',
      desc: 'Two-tone split header layout engineered for senior tech roles and managers.',
      isFree: false,
      productId: 'pro-template-modern-professional',
    },
    {
      id: 'technical' as ResumeTemplateId,
      name: 'Technical Developer Resume',
      desc: 'Monospace terminal chips, tech stack density, and git project callouts.',
      isFree: false,
      productId: 'pro-template-technical',
    },
  ]

  const portfolioThemes = [
    {
      id: 'developer' as PortfolioThemeId,
      name: 'Developer Terminal Theme',
      desc: 'Monospace code aesthetics with macOS window dots and interactive syntax blocks.',
      isFree: true,
      productId: undefined,
    },
    {
      id: 'minimal' as PortfolioThemeId,
      name: 'Minimal High-Contrast Theme',
      desc: 'Editorial typography with generous whitespace and seamless dark/light contrast.',
      isFree: true,
      productId: undefined,
    },
    {
      id: 'midnight' as PortfolioThemeId,
      name: 'Midnight Dark Showcase',
      desc: 'Curated deep navy dark mode with ambient glow effects for fullstack developers.',
      isFree: true,
      productId: undefined,
    },
    {
      id: 'creative' as PortfolioThemeId,
      name: 'Creative Studio Theme',
      desc: 'Vibrant gradient accents and micro-interaction case studies for UI/UX engineers.',
      isFree: false,
      productId: 'pro-theme-creative',
    },
    {
      id: 'modern' as PortfolioThemeId,
      name: 'Modern Clean Theme',
      desc: 'Architectural grid layout with polished typography for quick executive scanning.',
      isFree: false,
      productId: 'pro-theme-modern',
    },
  ]

  const activeTemplatesList = mode === 'resume' ? resumeTemplates : portfolioThemes

  return (
    <div className={`space-y-6 text-[#111827] ${className}`}>
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
              <Sliders className="w-4 h-4" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">
              {mode === 'resume'
                ? 'Customize Your Resume & Get Pricing'
                : 'Build Your Portfolio Package'}
            </h3>
            <Badge variant="accent" size="sm">
              INTERACTIVE CALCULATOR
            </Badge>
          </div>
          <p className="text-xs text-[#475569]">
            Select individual features, templates, and optional add-ons below. Your personalized total updates dynamically in integer paise.
          </p>
        </div>

        <div className="text-[11px] font-mono text-[#64748B] bg-white px-3 py-1.5 rounded-xl border border-blue-200 shrink-0">
          Zero Hidden Fees • Never Double-Charged
        </div>
      </div>

      {/* SECTION 1: TEMPLATE / THEME SELECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>
              1. Choose {mode === 'resume' ? 'Resume Template' : 'Portfolio Theme'} (1 Included)
            </span>
          </h4>
          <span className="text-[11px] text-[#64748B]">Click to select & update layout</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeTemplatesList.map((item) => {
            const isSelected = selectedTemplateOrTheme === item.id
            const priceInfo =
              mode === 'resume'
                ? catalog.getTemplatePrice(item.id as ResumeTemplateId)
                : catalog.getThemePrice(item.id as PortfolioThemeId)

            const isOwned =
              item.isFree ||
              (mode === 'resume'
                ? entitlements.isTemplateUnlocked(item.id as ResumeTemplateId)
                : entitlements.isThemeUnlocked(item.id as PortfolioThemeId))

            return (
              <div
                key={item.id}
                onClick={() => onSelectTemplateOrTheme(item.id)}
                className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between cursor-pointer relative ${
                  isSelected
                    ? 'border-[#2563EB] bg-[#EFF6FF] shadow-sm ring-2 ring-[#2563EB]/20'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-[#0F172A] text-xs sm:text-sm">
                      <span
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#2563EB] bg-[#2563EB] text-white'
                            : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.isFree ? (
                      <Badge variant="success" size="sm">
                        FREE • ₹0
                      </Badge>
                    ) : (
                      <Badge variant="accent" size="sm">
                        {isOwned ? 'OWNED' : `PRO • ${priceInfo.formatted}`}
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#0F172A]">
                    {item.isFree ? (
                      <span className="text-emerald-600 font-bold">Free Forever (₹0)</span>
                    ) : isOwned ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{priceInfo.formatted}</span>
                      </span>
                    )}
                  </span>

                  {onPreviewItem && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreviewItem(mode, item.id)
                      }}
                      className="px-2 py-0.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: GENUINELY SUPPORTED CUSTOMIZATION CONTROLS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>2. Built-In Styling & Customization Options (Protected ₹0 Tier)</span>
          </h4>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            All Included at ₹0
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Typography */}
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Typography</span>
              </span>
              <Badge variant="success" size="sm">
                INCLUDED (₹0)
              </Badge>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Inter Sans, Merriweather Serif, and JetBrains Mono fonts tested across PDF & web.
            </p>
            <div className="pt-1 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Full font pairing support</span>
            </div>
          </div>

          {/* Color Themes */}
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Color Palettes</span>
              </span>
              <Badge variant="success" size="sm">
                INCLUDED (₹0)
              </Badge>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Curated HSL theme tokens plus custom native color-picker for brand accents.
            </p>
            <div className="pt-1 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Unlimited custom hex colors</span>
            </div>
          </div>

          {/* Layouts & Spacing */}
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{mode === 'resume' ? 'Layout Density' : 'Project Layouts'}</span>
              </span>
              <Badge variant="success" size="sm">
                INCLUDED (₹0)
              </Badge>
            </div>
            <p className="text-[11px] text-[#64748B]">
              {mode === 'resume'
                ? 'Compact (1-page target), standard, and relaxed margins with real-time scaling.'
                : 'Interactive case studies, responsive grids, live demo and repository links.'}
            </p>
            <div className="pt-1 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Fully adjustable spacing</span>
            </div>
          </div>

          {/* Section Styling / Effects */}
          <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>{mode === 'resume' ? 'Section Styling' : 'Visual Effects'}</span>
              </span>
              <Badge variant="success" size="sm">
                INCLUDED (₹0)
              </Badge>
            </div>
            <p className="text-[11px] text-[#64748B]">
              {mode === 'resume'
                ? 'Reorderable sections, custom titles, terminal tech chips, and ATS badges.'
                : 'Micro-interaction hover card transforms, ambient glows, and reduced-motion mode.'}
            </p>
            <div className="pt-1 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Zero extra styling fees</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: OPTIONAL EXTRAS & ADD-ONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>3. Optional Approved Extras & Configured Bundles</span>
          </h4>
          <span className="text-[11px] text-[#64748B]">Select add-ons to bundle</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Custom Domain Pass */}
          {(() => {
            const isDomainSelected = selectedAddonIds.includes('custom-domain-pass')
            const isDomainOwned = entitlements.hasDomainPass || entitlements.hasAllAccessPass

            return (
              <div
                className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  isDomainOwned
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : isDomainSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#0F172A] text-xs sm:text-sm flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Instant Custom Domain Pass</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Route your personal apex domain or subdomain (e.g. <code>yourname.dev</code>) with automated Edge SSL provisioning.
                      </p>
                    </div>

                    <Badge variant={isDomainOwned ? 'success' : 'accent'} size="sm">
                      {isDomainOwned ? 'OWNED' : formatINR(domainPass.rupees)}
                    </Badge>
                  </div>

                  <ul className="space-y-1 text-[11px] text-[#475569] pt-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Instant CNAME & A record routing to PR Elevate edge</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Automated SSL certificate renewal via Let&apos;s Encrypt</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-amber-800 text-[10px]">
                      <HelpCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Root domain must be registered by user via registrar (Namecheap, GoDaddy, etc.)</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">
                    {formatINR(domainPass.rupees)} <span className="font-normal text-[11px] text-[#64748B]">one-time</span>
                  </span>

                  {isDomainOwned ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Already Unlocked</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleAddon('custom-domain-pass')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isDomainSelected
                          ? 'bg-[#2563EB] text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-[#1E293B] hover:bg-[#EFF6FF] border border-[#CBD5E1]'
                      }`}
                    >
                      {isDomainSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected</span>
                        </>
                      ) : (
                        <span>+ Add to Package</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Pro All-Access Lifetime Pass */}
          {(() => {
            const isBundleSelected = selectedAddonIds.includes('pro-all-access-pass')
            const isBundleOwned = entitlements.hasAllAccessPass

            return (
              <div
                className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  isBundleOwned
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : isBundleSelected
                    ? 'bg-amber-50/60 border-amber-400 shadow-xs'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#0F172A] text-xs sm:text-sm flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span>PR Elevate Pro All-Access Lifetime Pass</span>
                      </div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">
                        Unlocks all Pro resume templates (₹398 value), portfolio themes (₹598 value), and custom domain pass (₹499 value).
                      </p>
                    </div>

                    <Badge variant={isBundleOwned ? 'success' : 'accent'} size="sm">
                      {isBundleOwned ? 'OWNED' : formatINR(proPass.rupees)}
                    </Badge>
                  </div>

                  <ul className="space-y-1 text-[11px] text-[#475569] pt-1">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Covers all current and future Pro templates & themes</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Includes Instant Custom Domain Pass with automated SSL</span>
                    </li>
                    <li className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Saves ₹{proPass.savingsRupees} vs buying individual products!</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-lg text-[#0F172A]">{formatINR(proPass.rupees)}</span>
                    <span className="text-[10px] text-[#64748B] line-through ml-1.5">
                      {formatINR(proPass.componentSumRupees)}
                    </span>
                  </div>

                  {isBundleOwned ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>All-Access Active</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleAddon('pro-all-access-pass')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isBundleSelected
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-[#F8FAFC] text-[#1E293B] hover:bg-amber-50 border border-[#CBD5E1]'
                      }`}
                    >
                      {isBundleSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Selected (Bundle)</span>
                        </>
                      ) : (
                        <span>Upgrade to All-Access</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* SECTION 4: UNAPPROVED DRAFT ADD-ONS DISCLOSURE */}
      <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F172A] text-[11px] uppercase tracking-wider">
              Draft Proposed Add-ons (In Review by Administrator)
            </span>
            <Badge variant="outline" size="sm">
              UNBILLABLE DRAFT
            </Badge>
          </div>
          <span className="text-[10px] text-[#64748B]">Zero Charge Today</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#64748B]">
          <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#1E293B] block">Custom Font Upload (.woff2 / .ttf)</span>
              <span className="text-[10px] text-[#64748B]">Admin Draft • Proposed ₹49</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Unapproved
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#1E293B] block">Custom CSS Stylesheet Injection</span>
              <span className="text-[10px] text-[#64748B]">Admin Draft • Proposed ₹99</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Unapproved
            </span>
          </div>
        </div>

        <p className="text-[10px] text-[#64748B] pt-0.5">
          Per platform integrity rules, suggested draft prices remain unconfigured until an administrator explicitly approves them in the admin database catalog. Unapproved draft features are never billed to users.
        </p>
      </div>
    </div>
  )
}
