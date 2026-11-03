import React, { useState } from 'react'
import {
  Sparkles,
  CheckCircle2,
  Lock,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Globe,
  ShieldCheck,
  Palette,
  Sliders,
} from 'lucide-react'
import { Badge } from '../../../../components/ui/Badge.tsx'
import { Button } from '../../../../components/ui/Button.tsx'
import { TemplatePreviewModal } from '../../../../components/pricing/TemplatePreviewModal.tsx'
import { PRBuilderProBundleCard } from '../../../../components/pricing/PRBuilderProBundleCard.tsx'
import { CustomDomainPricingCard } from '../../../../components/pricing/CustomDomainPricingCard.tsx'
import { CustomizationPricingPanel } from '../../../../components/pricing/CustomizationPricingPanel.tsx'
import { LivePricingSummary } from '../../../../components/pricing/LivePricingSummary.tsx'
import { FeaturePricingCalculator } from '../../../../components/pricing/FeaturePricingCalculator.tsx'
import {
  usePricingCatalog,
  THEME_PRODUCT_MAP,
} from '../../../../hooks/usePricingCatalog.ts'
import type { EntitlementsState } from '../../../../hooks/useEntitlements.ts'
import type { PortfolioThemeId } from '../../types.ts'

export interface PortfolioPricingSectionProps {
  currentTheme: PortfolioThemeId
  onSelectTheme: (theme: PortfolioThemeId) => void
  entitlements: EntitlementsState
  onProceedToCheckout: (
    productId: string,
    amountPaise: number,
    title: string,
    couponCode?: string,
  ) => void
  onNavigateToDomainManager?: () => void
  className?: string
}

interface ThemeMetadata {
  id: PortfolioThemeId
  name: string
  tagline: string
  isFree: boolean
  productId?: string
  previewColors: string[]
  highlights: string[]
}

const PORTFOLIO_THEMES: ThemeMetadata[] = [
  // 3 Always-Free Themes
  {
    id: 'developer',
    name: 'Developer Terminal Theme',
    tagline: 'Code-first monospace aesthetic with interactive terminal syntax highlighting.',
    isFree: true,
    previewColors: ['#0B0F17', '#10B981', '#38BDF8'],
    highlights: [
      'Interactive terminal aesthetics with macOS window controls',
      'Monospace code snippets and inline repository links',
      'High-contrast tech stack chips and project badges',
      '100% free with unlimited portfolio publishing to subdomains',
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal High-Contrast Theme',
    tagline: 'Clean editorial presentation with refined typography and generous whitespace.',
    isFree: true,
    previewColors: ['#FFFFFF', '#0F172A', '#64748B'],
    highlights: [
      'Editorial serif & sans typography with refined line rules',
      'Light / Dark contrast switching with smooth CSS transition',
      'Streamlined case-study project layouts',
      '100% free with instant local storage & cloud autosave',
    ],
  },
  {
    id: 'midnight',
    name: 'Midnight Dark Showcase',
    tagline: 'Curated deep navy dark-mode portfolio built for modern fullstack software engineers.',
    isFree: true,
    previewColors: ['#030712', '#1E293B', '#38BDF8'],
    highlights: [
      'Sleek dark-mode aesthetic with ambient blue glow effects',
      'Recruiter-ready project cards with live demo and GitHub actions',
      'Comprehensive skill matrix and verified certification badges',
      '100% free forever for all student and developer accounts',
    ],
  },

  // 2 Premium Pro Themes (Configured Catalog Products)
  {
    id: 'creative',
    name: 'Creative Studio Theme',
    tagline: 'Vibrant portfolio showcase designed for UI/UX engineers and creative technologists.',
    isFree: false,
    productId: 'pro-theme-creative',
    previewColors: ['#312E81', '#EC4899', '#8B5CF6'],
    highlights: [
      'Dynamic gradient accents and smooth micro-interaction card reveals',
      'Visual case-study project layouts with live demo and source links',
      'Interactive timeline experience highlighting career milestones',
      'Lifetime unlock across all your published portfolios',
    ],
  },
  {
    id: 'modern',
    name: 'Modern Clean Theme',
    tagline: 'Sophisticated grid portfolio with polished typography and recruiter-ready contrast.',
    isFree: false,
    productId: 'pro-theme-modern',
    previewColors: ['#FFFFFF', '#2563EB', '#0F172A'],
    highlights: [
      'Architectural grid layout with balanced whitespace and crisp borders',
      'Elevated typography hierarchy designed for quick executive scanning',
      'Interactive skill tags with category grouping and link embeds',
      'Lifetime unlock across all your published subdomains',
    ],
  },
]

export const PortfolioPricingSection: React.FC<PortfolioPricingSectionProps> = ({
  currentTheme,
  onSelectTheme,
  entitlements,
  onProceedToCheckout,
  onNavigateToDomainManager,
  className = '',
}) => {
  const catalog = usePricingCatalog()
  const [isExpanded, setIsExpanded] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'themes' | 'calculator' | 'customization' | 'domain' | 'bundle'>('themes')
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])
  const [previewTheme, setPreviewTheme] = useState<ThemeMetadata | null>(null)

  const toggleAddon = (productId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const currentPriceInfo = catalog.getThemePrice(currentTheme)
  const domainPass = catalog.getDomainPassPrice()
  const proPass = catalog.getProPassPrice()

  const isCurrentProAndUnowned = !currentPriceInfo.isFree && !entitlements.isThemeUnlocked(currentTheme)
  const baseProductId = isCurrentProAndUnowned
    ? THEME_PRODUCT_MAP[currentTheme] || 'pro-theme-creative'
    : currentPriceInfo.product?.id || 'developer'

  const currentThemeName =
    PORTFOLIO_THEMES.find((t) => t.id === currentTheme)?.name || 'Portfolio Theme'

  return (
    <div
      className={`border-b border-slate-200 bg-white text-[#111827] ${className}`}
    >
      {/* 1. Header Bar: Single clear title, clean active status & segmented navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Build Your Portfolio Package
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                3 Free • 2 Pro (₹299)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Theme:{' '}
              <span className="font-semibold text-slate-800">{currentThemeName}</span>{' '}
              {currentPriceInfo.isFree ? (
                <span className="text-emerald-600 font-medium">(Free Tier)</span>
              ) : entitlements.isThemeUnlocked(currentTheme) ? (
                <span className="text-emerald-600 font-medium">(Unlocked)</span>
              ) : (
                <span className="text-amber-600 font-medium">(Pro • {currentPriceInfo.formatted})</span>
              )}
            </p>
          </div>
        </div>

        {/* View Tabs & Expand Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {isExpanded && (
            <div
              role="tablist"
              aria-label="Portfolio package sections"
              className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shrink-0"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'themes'}
                onClick={() => setActiveTab('themes')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'themes'
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Themes (5)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'calculator'}
                onClick={() => setActiveTab('calculator')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'calculator'
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Package Calculator</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'customization'}
                onClick={() => setActiveTab('customization')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'customization'
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Customization
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'domain'}
                onClick={() => setActiveTab('domain')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'domain'
                    ? 'bg-white text-blue-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Custom Domain</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'bundle'}
                onClick={() => setActiveTab('bundle')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'bundle'
                    ? 'bg-white text-amber-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Pro Pass</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
            title={isExpanded ? 'Collapse Package Builder' : 'Expand Package Builder'}
          >
            <span>{isExpanded ? 'Collapse' : 'Customize Package'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Expanded Content Drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* TAB 0: THEMES & PRICING CARDS */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select Your Portfolio Theme
                  </h3>
                  <p className="text-xs text-slate-600">
                    Switch freely anytime. 100% of your projects, bio, and custom content are preserved with zero data loss.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-500 hidden sm:block">
                  Live Preview • Zero Data Loss
                </div>
              </div>

              {/* 5 Themes Grid — Uniform card heights, accessible radio selection, single price indicator */}
              <div
                role="radiogroup"
                aria-label="Portfolio theme selection"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {PORTFOLIO_THEMES.map((tmpl) => {
                  const priceInfo = catalog.getThemePrice(tmpl.id)
                  const isActive = currentTheme === tmpl.id
                  const isUnlocked = entitlements.isThemeUnlocked(tmpl.id)

                  return (
                    <div
                      key={tmpl.id}
                      role="radio"
                      aria-checked={isActive}
                      tabIndex={0}
                      onClick={() => onSelectTheme(tmpl.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault()
                          onSelectTheme(tmpl.id)
                        }
                      }}
                      className={`group rounded-2xl border transition-all p-4.5 flex flex-col justify-between text-xs relative cursor-pointer select-none ${
                        isActive
                          ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Visual Palette Preview Thumbnail Header */}
                        <div
                          className="w-full h-20 rounded-xl p-2.5 flex flex-col justify-between overflow-hidden shadow-inner border border-black/5"
                          style={{
                            background: `linear-gradient(135deg, ${tmpl.previewColors[0]}, ${tmpl.previewColors[1] || tmpl.previewColors[0]})`,
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono font-bold text-white/90 uppercase tracking-wider">
                              {tmpl.id}
                            </span>
                            <div className="flex gap-1">
                              {tmpl.previewColors.map((color, idx) => (
                                <span
                                  key={idx}
                                  className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-xs"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-[11px] font-bold text-white drop-shadow-sm">
                            {tmpl.name}
                          </div>
                        </div>

                        {/* Title, Radio Indicator & Single Clean Price Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isActive
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 bg-white group-hover:border-slate-400'
                              }`}
                            >
                              {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <div className="space-y-0.5">
                              <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                {tmpl.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                                {tmpl.tagline}
                              </p>
                            </div>
                          </div>

                          {/* Single Price Badge */}
                          <div className="shrink-0">
                            {tmpl.isFree ? (
                              <Badge variant="success" size="sm">
                                Free Tier
                              </Badge>
                            ) : isUnlocked ? (
                              <Badge variant="success" size="sm">
                                Unlocked
                              </Badge>
                            ) : (
                              <Badge variant="accent" size="sm">
                                Pro • {priceInfo.formatted}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Feature Highlights */}
                        <ul className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                          {tmpl.highlights.slice(0, 3).map((h, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="text-[11px]">
                          {isActive ? (
                            <span className="font-bold text-blue-600 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : isUnlocked || tmpl.isFree ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{tmpl.isFree ? 'Free forever' : 'Unlocked'}</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-medium flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                              <span>One-time unlock</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Secondary Preview Action (Does not select card) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewTheme(tmpl)
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                            title={`Preview ${tmpl.name}`}
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>

                          {/* Select Action */}
                          {isActive ? (
                            <Button variant="outline" size="sm" disabled className="text-[11px] py-1 px-2.5 h-7">
                              Selected
                            </Button>
                          ) : isUnlocked || tmpl.isFree ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectTheme(tmpl.id)
                              }}
                              className="text-[11px] py-1 px-2.5 h-7 bg-blue-600 hover:bg-blue-700"
                            >
                              Select
                            </Button>
                          ) : (
                            <Button
                              variant="glow"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onSelectTheme(tmpl.id)
                              }}
                              className="text-[11px] py-1 px-2.5 h-7 flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Select (Pro)</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Custom Domain Pass & Pro All-Access Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                <CustomDomainPricingCard
                  priceRupees={domainPass.rupees}
                  isOwned={entitlements.hasDomainPass || entitlements.hasAllAccessPass}
                  onUnlock={() => {
                    onProceedToCheckout(
                      'custom-domain-pass',
                      domainPass.paise,
                      'Custom Domain Pass',
                    )
                  }}
                  onNavigateToDomainManager={onNavigateToDomainManager}
                />

                <PRBuilderProBundleCard
                  proPassPriceRupees={proPass.rupees}
                  componentSumRupees={proPass.componentSumRupees}
                  savingsRupees={proPass.savingsRupees}
                  isOwned={entitlements.hasAllAccessPass}
                  onUnlock={() => {
                    onProceedToCheckout(
                      'pro-all-access-pass',
                      proPass.paise,
                      'PR Builder Pro All-Access Lifetime Pass',
                    )
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 1: INTERACTIVE PACKAGE CALCULATOR */}
          {activeTab === 'calculator' && (
            <FeaturePricingCalculator
              mode="portfolio"
              hideHeaderBanner={true}
              selectedTemplateOrTheme={currentTheme}
              onSelectTemplateOrTheme={(id) => onSelectTheme(id as PortfolioThemeId)}
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={toggleAddon}
              entitlements={entitlements}
              catalog={catalog}
              onPreviewItem={(_type, id) => {
                const tmpl = PORTFOLIO_THEMES.find((t) => t.id === id)
                if (tmpl) setPreviewTheme(tmpl)
              }}
            />
          )}

          {/* TAB 2: CUSTOMIZATION PRICING PANEL */}
          {activeTab === 'customization' && (
            <CustomizationPricingPanel
              mode="portfolio"
              selectedTemplateOrTheme={currentTheme}
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={toggleAddon}
              entitlements={entitlements}
              catalog={catalog}
            />
          )}

          {/* TAB 3: CUSTOM DOMAIN PASS */}
          {activeTab === 'domain' && (
            <div className="space-y-4">
              <CustomDomainPricingCard
                priceRupees={domainPass.rupees}
                isOwned={entitlements.hasDomainPass || entitlements.hasAllAccessPass}
                onUnlock={() => {
                  onProceedToCheckout(
                    'custom-domain-pass',
                    domainPass.paise,
                    'Custom Domain Pass',
                  )
                }}
                onNavigateToDomainManager={onNavigateToDomainManager}
              />
            </div>
          )}

          {/* TAB 4: PRO ALL-ACCESS PASS */}
          {activeTab === 'bundle' && (
            <div className="space-y-4">
              <PRBuilderProBundleCard
                proPassPriceRupees={proPass.rupees}
                componentSumRupees={proPass.componentSumRupees}
                savingsRupees={proPass.savingsRupees}
                isOwned={entitlements.hasAllAccessPass}
                onUnlock={() => {
                  onProceedToCheckout(
                    'pro-all-access-pass',
                    proPass.paise,
                    'PR Builder Pro All-Access Lifetime Pass',
                  )
                }}
              />
            </div>
          )}

          {/* 3. LIVE PRICING SUMMARY (Whenever paid theme or addon is selected) */}
          {(!currentPriceInfo.isFree || selectedAddonIds.length > 0) && (
            <LivePricingSummary
              baseProductId={baseProductId}
              baseItemName={currentThemeName}
              basePriceRupees={currentPriceInfo.rupees}
              baseIsFree={currentPriceInfo.isFree}
              addonProductIds={selectedAddonIds}
              onRemoveAddon={toggleAddon}
              onClearAddons={() => setSelectedAddonIds([])}
              onContinueToPreview={() => {
                const tmpl = PORTFOLIO_THEMES.find((t) => t.id === currentTheme)
                if (tmpl) setPreviewTheme(tmpl)
              }}
              entitlements={entitlements}
              onProceedToCheckout={onProceedToCheckout}
            />
          )}
        </div>
      )}

      {/* Theme Preview Modal */}
      {previewTheme && (
        <TemplatePreviewModal
          isOpen={Boolean(previewTheme)}
          onClose={() => setPreviewTheme(null)}
          type="portfolio"
          id={previewTheme.id}
          name={previewTheme.name}
          categoryLabel={previewTheme.isFree ? 'Free Theme Design' : 'Premium Pro Theme'}
          priceFormatted={catalog.getThemePrice(previewTheme.id).formatted}
          pricePaise={catalog.getThemePrice(previewTheme.id).paise}
          isFree={previewTheme.isFree}
          isOwned={entitlements.isThemeUnlocked(previewTheme.id)}
          isActive={currentTheme === previewTheme.id}
          description={previewTheme.tagline}
          highlights={previewTheme.highlights}
          onSelect={() => onSelectTheme(previewTheme.id)}
          onUpgrade={() => {
            onSelectTheme(previewTheme.id)
            if (previewTheme.productId) {
              const p = catalog.getThemePrice(previewTheme.id)
              onProceedToCheckout(previewTheme.productId, p.paise, previewTheme.name)
            }
          }}
        />
      )}
    </div>
  )
}
