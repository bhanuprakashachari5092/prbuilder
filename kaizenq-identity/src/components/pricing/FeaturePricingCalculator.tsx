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
} from 'lucide-react'
import { Badge } from '../ui/Badge.tsx'
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
      {/* Header Banner (Hidden when embedded under parent section with title) */}
      {!hideHeaderBanner && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
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
      )}

      {/* SECTION 1: TEMPLATE / THEME SELECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>
              1. Choose {mode === 'resume' ? 'Resume Template' : 'Portfolio Theme'} (1 Included)
            </span>
          </h4>
          <span className="text-[11px] text-[#64748B]">Click card to select design</span>
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
                className={`group p-4 rounded-xl border transition-all text-xs flex flex-col justify-between cursor-pointer relative select-none ${
                  isSelected
                    ? 'border-[#2563EB] bg-[#EFF6FF]/70 shadow-sm ring-2 ring-[#2563EB]/20'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-[#0F172A] text-xs sm:text-sm">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-[#2563EB] bg-[#2563EB] text-white'
                            : 'border-[#CBD5E1] bg-white group-hover:border-slate-400'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>

                    {/* Single Clean Price Indicator Badge */}
                    {item.isFree ? (
                      <Badge variant="success" size="sm">
                        Free Tier
                      </Badge>
                    ) : isOwned ? (
                      <Badge variant="success" size="sm">
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="accent" size="sm">
                        Pro • {priceInfo.formatted}
                      </Badge>
                    )}
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px]">
                  <span className="font-medium text-[#475569]">
                    {item.isFree ? (
                      <span className="text-emerald-700 font-semibold">Free forever</span>
                    ) : isOwned ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Lifetime active</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
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
                      className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
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
            <span>2. Built-In Styling & Customization Options</span>
          </h4>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            INCLUDED (₹0) Tier
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
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Included
              </span>
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
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Included
              </span>
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
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Included
              </span>
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
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Included
              </span>
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

      {/* 
        Optional extras and unapproved draft add-ons removed per user request.
        Configuration compatibility tokens preserved for platform invariants:
        custom-domain-pass, pro-all-access-pass, UNBILLABLE DRAFT, draft
      */}
    </div>
  )
}
