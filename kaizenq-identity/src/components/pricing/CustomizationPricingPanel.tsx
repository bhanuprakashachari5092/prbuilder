import React from 'react'
import {
  Palette,
  Type,
  Layout,
  Globe,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Plus,
  Check,
  Crown,
  CheckCircle2,
} from 'lucide-react'
import { Badge } from '../ui/Badge.tsx'
import { formatINR } from '../../hooks/usePricingCatalog.ts'
import type { EntitlementsState } from '../../hooks/useEntitlements.ts'
import type { PricingCatalogState } from '../../hooks/usePricingCatalog.ts'

export interface CustomizationOptionItem {
  id: string
  category: 'templates_themes' | 'typography' | 'colors' | 'layout' | 'effects' | 'domain' | 'bundle'
  title: string
  description: string
  statusType: 'included' | 'configured_product' | 'draft_proposed'
  priceDisplay: string
  pricePaise?: number
  productId?: string
  isOwned?: boolean
  details: string[]
}

export interface CustomizationPricingPanelProps {
  mode: 'resume' | 'portfolio'
  selectedTemplateOrTheme?: string
  selectedAddonIds: string[]
  onToggleAddon: (productId: string) => void
  entitlements: EntitlementsState
  catalog: PricingCatalogState
  className?: string
}

export const CustomizationPricingPanel: React.FC<CustomizationPricingPanelProps> = ({
  mode,
  selectedTemplateOrTheme: _selectedTemplateOrTheme,
  selectedAddonIds,
  onToggleAddon,
  entitlements,
  catalog,
  className = '',
}) => {
  const domainPass = catalog.getDomainPassPrice()
  const proPass = catalog.getProPassPrice()
  const sampleResumeTemplate = catalog.getTemplatePrice('modern-professional')
  const samplePortfolioTheme = catalog.getThemePrice('creative')
  const resumeVal = catalog.getTemplatePrice('modern-professional').rupees + catalog.getTemplatePrice('technical').rupees
  const portfolioVal = catalog.getThemePrice('creative').rupees + catalog.getThemePrice('modern').rupees

  // Define supported options per builder
  const options: CustomizationOptionItem[] = [
    // 1. Templates & Themes
    {
      id: mode === 'resume' ? 'customization-templates' : 'customization-themes',
      category: 'templates_themes',
      title: mode === 'resume' ? 'Resume Template System' : 'Portfolio Theme Showcase',
      description:
        mode === 'resume'
          ? 'Includes 4 free ATS templates (Classic ATS, Minimal, Classic, Modern) and 2 Pro templates (Modern Professional, Technical Developer).'
          : 'Includes 3 free themes (Developer, Minimal, Midnight) and 2 Pro themes (Creative Studio, Modern Clean).',
      statusType: 'included',
      priceDisplay: mode === 'resume' ? `Free (₹0) / Pro (${sampleResumeTemplate.formatted})` : `Free (₹0) / Pro (${samplePortfolioTheme.formatted})`,
      details: [
        'Free ATS templates/themes are 100% free forever',
        mode === 'resume'
          ? `Pro templates: ${sampleResumeTemplate.formatted} per template (lifetime unlock)`
          : `Pro themes: ${samplePortfolioTheme.formatted} per theme (lifetime unlock)`,
        'Zero data loss when switching or previewing templates',
      ],
    },

    // 2. Fonts & Typography
    {
      id: 'customization-typography',
      category: 'typography',
      title: 'Fonts & Typography Hierarchy',
      description: 'Hand-picked typefaces tested across PDF rendering and web displays.',
      statusType: 'included',
      priceDisplay: 'Included in All Templates (₹0)',
      details: [
        'Sans-Serif: Inter Sans (Modern & ATS-optimized)',
        'Serif: Merriweather Serif (Executive & Academic)',
        'Monospace: JetBrains Mono (Technical & Code stacks)',
        '100% free with all templates and themes — zero extra charge',
      ],
    },

    // 3. Draft Font Upload (Proposed - Not billable)
    {
      id: 'customization-custom-fonts-draft',
      category: 'typography',
      title: 'Custom Font File Upload (.woff2 / .ttf)',
      description: 'Upload your organization or custom brand typography.',
      statusType: 'draft_proposed',
      priceDisplay: 'Draft Feature • ₹49 proposed (Unreleased / Zero charge)',
      details: [
        'Proposed price: ₹49 (draft status only)',
        'Not currently billed or active in catalog',
        'Will only activate once approved by administrator',
      ],
    },

    // 4. Color Palettes & Hex Customizer
    {
      id: 'customization-colors',
      category: 'colors',
      title: 'Color Palettes & Custom Hex Accent',
      description: 'Curated HSL harmonious color tokens plus native browser color-picker support.',
      statusType: 'included',
      priceDisplay: 'Included in All Tiers (₹0)',
      details: [
        mode === 'resume'
          ? 'Curated: Slate (#0F172A), Navy (#1E3A8A), Royal (#2563EB), Emerald (#047857), Crimson (#991B1B), Violet (#7C3AED)'
          : 'Curated: Emerald, Royal Blue, Cyan, Violet, Amber, Rose',
        'Custom hex color picker for infinite branding possibilities',
        'Included without any extra charge in both Free and Pro tiers',
      ],
    },

    // 5. Layout Density & Spacing
    {
      id: 'customization-layout',
      category: 'layout',
      title: 'Layout Density & Spacing Controls',
      description: 'Adjust page density for 1-page resume constraints or generous portfolio white-space.',
      statusType: 'included',
      priceDisplay: 'Included in All Tiers (₹0)',
      details: [
        'Compact: High information density for tight single-page target',
        'Normal: Balanced spacing for standard recruiter scans',
        'Relaxed / Spacious: Breathable, editorial white-space',
        'No paywall — included in all templates',
      ],
    },

    // 6. Portfolio Visual Effects & Micro-Animations (Portfolio only)
    ...(mode === 'portfolio'
      ? [
          {
            id: 'customization-effects',
            category: 'effects' as const,
            title: 'Visual Effects & CSS Micro-Interactions',
            description: 'Smooth CSS hover card transforms and scroll entrance animations.',
            statusType: 'included' as const,
            priceDisplay: 'Included in Portfolio Studio (₹0)',
            details: [
              'Smooth hover card transforms and glow elevation',
              'Entrance animations with reduce-motion accessibility support',
              'Included across all themes at zero charge',
            ],
          },
          {
            id: 'customization-css-draft',
            category: 'effects' as const,
            title: 'Custom CSS Stylesheet Injection',
            description: 'Advanced custom CSS override stylesheet editor.',
            statusType: 'draft_proposed' as const,
            priceDisplay: 'Draft Feature • ₹99 proposed (Unreleased / Zero charge)',
            details: [
              'Proposed price: ₹99 (draft status only)',
              'Proposed for advanced developers; zero charge today',
              'Requires admin catalog approval before any payment trigger',
            ],
          },
        ]
      : []),

    // 7. Custom Domain Connection (Configured Product)
    {
      id: 'custom-domain-pass',
      category: 'domain',
      title: 'Instant Custom Domain Pass',
      description: 'Route your personal domain (e.g. yourname.dev) with automated SSL provisioning.',
      statusType: 'configured_product',
      priceDisplay: formatINR(domainPass.rupees),
      pricePaise: domainPass.paise,
      productId: 'custom-domain-pass',
      isOwned: entitlements.hasDomainPass || entitlements.hasAllAccessPass,
      details: [
        'Instant DNS CNAME & A record routing to PR Builder edge',
        'Automated SSL certificate provisioning and renewal',
        'Zero wait for hackathon sponsorship or approval',
        'Lifetime routing to your portfolio',
      ],
    },

    // 8. PR Builder Pro All-Access Lifetime Pass (Configured Bundle)
    {
      id: 'pro-all-access-pass',
      category: 'bundle',
      title: 'PR Builder Pro All-Access Lifetime Pass',
      description: 'Complete lifetime access to all Pro resume templates, portfolio themes, and custom domain pass.',
      statusType: 'configured_product',
      priceDisplay: formatINR(proPass.rupees),
      pricePaise: proPass.paise,
      productId: 'pro-all-access-pass',
      isOwned: entitlements.hasAllAccessPass,
      details: [
        `Unlocks Modern Professional & Technical Developer resumes (${formatINR(resumeVal)} value)`,
        `Unlocks Creative Studio & Modern Clean portfolio themes (${formatINR(portfolioVal)} value)`,
        `Includes Instant Custom Domain Pass (${domainPass.formatted} value)`,
        `Saves ${formatINR(proPass.savingsRupees)} vs individual purchases`,
      ],
    },
  ]

  return (
    <div className={`space-y-4 text-[#111827] ${className}`}>
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Customization & Pricing Catalog
          </h3>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Server-Authoritative Pricing • Protected Free Tier
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {options.map((opt) => {
          const isSelected = opt.productId ? selectedAddonIds.includes(opt.productId) : false
          const isOwned = opt.isOwned

          return (
            <div
              key={opt.id}
              className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                opt.statusType === 'draft_proposed'
                  ? 'bg-slate-50/70 border-slate-200 opacity-80'
                  : isOwned
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : isSelected
                  ? 'bg-blue-50/50 border-blue-600 shadow-xs ring-1 ring-blue-600/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      {opt.category === 'bundle' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                      {opt.category === 'domain' && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                      {opt.category === 'typography' && <Type className="w-3.5 h-3.5 text-slate-500" />}
                      {opt.category === 'colors' && <Palette className="w-3.5 h-3.5 text-slate-500" />}
                      {opt.category === 'layout' && <Layout className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{opt.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{opt.description}</p>
                  </div>

                  {/* Status Badge: Clean and uncluttered */}
                  <div>
                    {opt.statusType === 'included' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Included
                      </span>
                    )}
                    {opt.statusType === 'draft_proposed' && (
                      <Badge variant="outline" size="sm">
                        ADMIN DRAFT
                      </Badge>
                    )}
                    {opt.statusType === 'configured_product' && (
                      <Badge variant={isOwned ? 'success' : 'accent'} size="sm">
                        {isOwned ? 'OWNED' : 'ADD-ON'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bullet Points */}
                <ul className="space-y-1 text-[11px] text-slate-600 pt-1">
                  {opt.details.map((d, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price & Action Footer */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Pricing Status</span>
                  <span
                    className={`font-bold ${
                      opt.statusType === 'included'
                        ? 'text-emerald-700'
                        : opt.statusType === 'draft_proposed'
                        ? 'text-amber-700 font-mono text-[11px]'
                        : 'text-slate-900'
                    }`}
                  >
                    {opt.priceDisplay}
                  </span>
                </div>

                {opt.productId && (
                  <div>
                    {isOwned ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Already Owned</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => opt.productId && onToggleAddon(opt.productId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Package</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footnote Disclosures */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Double-Charge Protection & Invariant Guarantee</span>
        </div>
        <p>
          All fonts, color palettes, and layout density settings are permanently included with templates at ₹0. Users never pay twice for customizations already granted. Proposed features marked as <strong>Admin Draft</strong> remain strictly unbillable until formally approved in the database catalog.
        </p>
      </div>
    </div>
  )
}
