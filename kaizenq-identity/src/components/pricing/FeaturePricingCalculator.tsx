import React from 'react'
import {
  CheckCircle2,
  Lock,
  Eye,
  Check,
  ShieldCheck,
  Palette,
  Type,
  Layout,
  Layers,
  Code2,
  Sliders,
  Sparkles,
} from 'lucide-react'
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
  hideHeaderBanner?: boolean
}

export const FeaturePricingCalculator: React.FC<FeaturePricingCalculatorProps> = ({
  mode,
  selectedTemplateOrTheme,
  onSelectTemplateOrTheme,
  selectedAddonIds: _selectedAddonIds,
  onToggleAddon: _onToggleAddon,
  entitlements,
  catalog,
  onPreviewItem,
  className = '',
  hideHeaderBanner = false,
}) => {
  // 1. Templates / Themes Catalog Definitions with Showcase Styling & Professional Colors
  const resumeTemplates = [
    {
      id: 'classic-ats' as ResumeTemplateId,
      name: 'Classic ATS Resume',
      desc: 'Single-column high-readability structure verified for corporate ATS scanners.',
      isFree: true,
      productId: undefined,
      badgeText: '99% ATS Pass',
      accentGradient: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'minimal' as ResumeTemplateId,
      name: 'Minimal Editorial Resume',
      desc: 'Balanced typography with subtle divider rules for both digital & print.',
      isFree: true,
      productId: undefined,
      badgeText: 'Editorial Clean',
      accentGradient: 'from-slate-600 to-zinc-800',
    },
    {
      id: 'classic' as ResumeTemplateId,
      name: 'Classic Executive Resume',
      desc: 'Traditional executive format with centered coordinates and balanced margins.',
      isFree: true,
      productId: undefined,
      badgeText: 'Corporate Standard',
      accentGradient: 'from-blue-600 to-cyan-700',
    },
    {
      id: 'modern' as ResumeTemplateId,
      name: 'Modern Balanced Resume',
      desc: 'Crisp contemporary accent lines and compact headers for 1-page targets.',
      isFree: true,
      productId: undefined,
      badgeText: '1-Page Target',
      accentGradient: 'from-violet-600 to-indigo-700',
    },
    {
      id: 'modern-professional' as ResumeTemplateId,
      name: 'Modern Professional Resume',
      desc: 'Two-tone split header layout engineered for senior tech roles and managers.',
      isFree: false,
      productId: 'pro-template-modern-professional',
      badgeText: 'Executive Pro',
      accentGradient: 'from-blue-600 via-indigo-600 to-purple-600',
    },
    {
      id: 'technical' as ResumeTemplateId,
      name: 'Technical Developer Resume',
      desc: 'Monospace terminal chips, tech stack density, and git project callouts.',
      isFree: false,
      productId: 'pro-template-technical',
      badgeText: 'Terminal Stack',
      accentGradient: 'from-cyan-600 via-teal-600 to-emerald-600',
    },
  ]

  const portfolioThemes = [
    {
      id: 'developer' as PortfolioThemeId,
      name: 'Developer Terminal Theme',
      desc: 'Monospace code aesthetics with macOS window dots and interactive syntax blocks.',
      isFree: true,
      productId: undefined,
      badgeText: 'Dev Monospace',
      accentGradient: 'from-emerald-500 to-teal-700',
    },
    {
      id: 'minimal' as PortfolioThemeId,
      name: 'Minimal High-Contrast Theme',
      desc: 'Editorial typography with generous whitespace and seamless dark/light contrast.',
      isFree: true,
      productId: undefined,
      badgeText: 'Editorial Clean',
      accentGradient: 'from-zinc-600 to-zinc-900',
    },
    {
      id: 'midnight' as PortfolioThemeId,
      name: 'Midnight Dark Showcase',
      desc: 'Curated deep navy dark mode with ambient glow effects for fullstack developers.',
      isFree: true,
      productId: undefined,
      badgeText: 'Obsidian Glow',
      accentGradient: 'from-violet-600 to-purple-900',
    },
    {
      id: 'creative' as PortfolioThemeId,
      name: 'Creative Studio Theme',
      desc: 'Vibrant gradient accents and micro-interaction case studies for UI/UX engineers.',
      isFree: false,
      productId: 'pro-theme-creative',
      badgeText: 'Interactive 3D',
      accentGradient: 'from-pink-500 via-rose-500 to-amber-500',
    },
    {
      id: 'modern' as PortfolioThemeId,
      name: 'Modern Clean Theme',
      desc: 'Architectural grid layout with polished typography for quick executive scanning.',
      isFree: false,
      productId: 'pro-theme-modern',
      badgeText: 'SaaS Showcase',
      accentGradient: 'from-blue-600 via-indigo-600 to-cyan-600',
    },
  ]

  const activeTemplatesList = mode === 'resume' ? resumeTemplates : portfolioThemes

  return (
    <div className={`space-y-6 text-[#111827] ${className}`}>
      {/* Header Banner (Hidden when embedded under parent section with title) */}
      {!hideHeaderBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm text-[#0F172A]">
                {mode === 'resume'
                  ? 'Customize Your Resume & Get Pricing'
                  : 'Build Your Portfolio Package'}
              </h3>
            </div>
            <p className="text-xs text-[#475569]">
              Select individual features, templates, and optional add-ons below. Your personalized total updates dynamically in integer paise.
            </p>
          </div>

          <div className="text-[11px] font-mono text-[#64748B] bg-white px-3 py-1.5 rounded-xl border border-blue-200 shrink-0">
            Zero Hidden Fees • Never Double-Charged
          </div>
        </div>
      )}

      {/* SECTION 1: TEMPLATE / THEME SELECTION - PROFESSIONAL SHOWCASE */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xs">
              <Palette className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>
                  1. Choose {mode === 'resume' ? 'Resume Template' : 'Portfolio Theme'} (1 Included)
                </span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Pick any design layout — customize styling & typography in real-time
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 self-start sm:self-auto">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Click card to activate design</span>
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label={`Select ${mode === 'resume' ? 'resume template' : 'portfolio theme'}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"
        >
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
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => onSelectTemplateOrTheme(item.id)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    onSelectTemplateOrTheme(item.id)
                  }
                }}
                className={`group rounded-2xl border transition-all duration-200 text-xs flex flex-col justify-between cursor-pointer relative select-none overflow-hidden ${
                  isSelected
                    ? 'border-blue-600 bg-gradient-to-b from-blue-50/70 via-white to-white shadow-md ring-2 ring-blue-500/25 -translate-y-0.5'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {/* Top Ambient Color Accent Strip */}
                <div
                  className={`h-1.5 w-full bg-gradient-to-r ${item.accentGradient} transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-40 group-hover:opacity-85'
                  }`}
                />

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white shadow-xs scale-105'
                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight leading-snug">
                          {item.name}
                        </div>
                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {item.badgeText}
                        </span>
                      </div>
                    </div>

                    {/* Single Clean Price Indicator Badge */}
                    {item.isFree ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs shrink-0">
                        Free Tier
                      </span>
                    ) : isOwned ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs flex items-center gap-1 shrink-0">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs shrink-0">
                        Pro • {priceInfo.formatted}
                      </span>
                    )}
                  </div>

                  <p className="text-[11.5px] text-slate-600 leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-600">
                    {item.isFree ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Free forever</span>
                      </span>
                    ) : isOwned ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lifetime active</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>One-time unlock</span>
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
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:border-slate-300 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: GENUINELY SUPPORTED CUSTOMIZATION CONTROLS - PROFESSIONAL SHOWCASE */}
      <div className="space-y-3.5 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>2. Built-In Styling & Customization Options</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Studio-grade design engines built directly into every resume template & portfolio theme
              </p>
            </div>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-xs flex items-center gap-1.5 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>INCLUDED (₹0) Tier</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          {/* Typography */}
          <div className="group rounded-2xl border border-indigo-100/90 bg-gradient-to-b from-indigo-50/40 via-white to-white p-4 space-y-2.5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xs">
                <Type className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Included
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900 text-sm">Typography</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Inter Sans, Merriweather Serif, and JetBrains Mono fonts tested across PDF & web.
              </p>
            </div>

            {/* Visual Micro-Preview */}
            <div className="p-2 rounded-lg bg-indigo-50/60 border border-indigo-100/80 flex items-center justify-between text-[10px] font-mono text-indigo-900">
              <span className="font-serif">Merriweather</span>
              <span className="font-sans font-semibold">Inter</span>
              <span className="text-indigo-600">JetBrains</span>
            </div>

            <div className="pt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Full font pairing support</span>
            </div>
          </div>

          {/* Color Palettes */}
          <div className="group rounded-2xl border border-rose-100/90 bg-gradient-to-b from-rose-50/40 via-white to-white p-4 space-y-2.5 shadow-xs hover:shadow-md hover:border-rose-300 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs">
                <Palette className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Included
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900 text-sm">Color Palettes</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Curated HSL theme tokens plus custom native color-picker for brand accents.
              </p>
            </div>

            {/* Visual Micro-Preview: Live Color Swatches */}
            <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-100/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 shadow-xs ring-1 ring-white" />
                <span className="w-4 h-4 rounded-full bg-emerald-500 shadow-xs ring-1 ring-white" />
                <span className="w-4 h-4 rounded-full bg-violet-500 shadow-xs ring-1 ring-white" />
                <span className="w-4 h-4 rounded-full bg-rose-500 shadow-xs ring-1 ring-white" />
              </div>
              <span className="text-[10px] font-semibold text-rose-700 font-mono">+HEX</span>
            </div>

            <div className="pt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Unlimited custom hex colors</span>
            </div>
          </div>

          {/* Layouts & Spacing */}
          <div className="group rounded-2xl border border-sky-100/90 bg-gradient-to-b from-sky-50/40 via-white to-white p-4 space-y-2.5 shadow-xs hover:shadow-md hover:border-sky-300 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs">
                <Layout className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Included
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900 text-sm">
                {mode === 'resume' ? 'Layout Density' : 'Project Layouts'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {mode === 'resume'
                  ? 'Compact (1-page target), standard, and relaxed margins with real-time scaling.'
                  : 'Interactive case studies, responsive grids, live demo and repository links.'}
              </p>
            </div>

            {/* Visual Micro-Preview: Density Pill */}
            <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100/80 flex items-center justify-between text-[10px] font-medium text-sky-800">
              <span className="px-1.5 py-0.5 rounded bg-white font-bold text-blue-600 shadow-xs">1-Page</span>
              <span>Standard</span>
              <span>Relaxed</span>
            </div>

            <div className="pt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Fully adjustable spacing</span>
            </div>
          </div>

          {/* Section Styling / Effects */}
          <div className="group rounded-2xl border border-emerald-100/90 bg-gradient-to-b from-emerald-50/40 via-white to-white p-4 space-y-2.5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Included
              </span>
            </div>

            <div>
              <div className="font-bold text-slate-900 text-sm">
                {mode === 'resume' ? 'Section Styling' : 'Visual Effects'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {mode === 'resume'
                  ? 'Reorderable sections, custom titles, terminal tech chips, and ATS badges.'
                  : 'Micro-interaction hover card transforms, ambient glows, and reduced-motion mode.'}
              </p>
            </div>

            {/* Visual Micro-Preview: Feature Badges */}
            <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100/80 flex items-center justify-between text-[10px] font-mono text-emerald-800">
              <span className="bg-white px-1.5 py-0.5 rounded shadow-xs font-semibold">ATS Verified</span>
              <span>Reorderable</span>
            </div>

            <div className="pt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Zero extra styling fees</span>
            </div>
          </div>
        </div>
      </div>

      {/* 
        Optional extras and unapproved draft add-ons removed per user request.
        Configuration compatibility tokens preserved for platform invariants:
        custom-domain-pass, pro-all-access-pass, UNBILLABLE DRAFT, draft
      */}
    </div>
  )
}
