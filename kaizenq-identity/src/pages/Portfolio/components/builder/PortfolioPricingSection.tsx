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
  const [activeTab, setActiveTab] = useState<'calculator' | 'themes' | 'customization' | 'domain' | 'bundle'>('calculator')
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
      className={`border-b border-[#E2E8F0] bg-gradient-to-b from-white via-[#F8FAFC] to-white text-[#111827] ${className}`}
    >
      {/* 1. Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
                Build Your Portfolio Package
              </h2>
              <Badge variant="success" size="sm">
                3 FREE • 2 PRO (₹299)
              </Badge>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Active Theme:{' '}
              <span className="font-semibold text-[#0F172A]">{currentThemeName}</span>{' '}
              {currentPriceInfo.isFree ? (
                <span className="text-emerald-600 font-semibold">(Free Tier)</span>
              ) : entitlements.isThemeUnlocked(currentTheme) ? (
                <span className="text-emerald-600 font-semibold">(Unlocked)</span>
              ) : (
                <span className="text-amber-600 font-semibold">(Pro • {currentPriceInfo.formatted})</span>
              )}
            </p>
          </div>
        </div>

        {/* View Tabs & Expand Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isExpanded && (
            <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] text-xs">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'calculator'
                    ? 'bg-white text-[#2563EB] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Package Calculator
              </button>
              <button
                onClick={() => setActiveTab('themes')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'themes'
                    ? 'bg-white text-[#2563EB] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Themes (5)
              </button>
              <button
                onClick={() => setActiveTab('customization')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'customization'
                    ? 'bg-white text-[#2563EB] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Customization Panel
              </button>
              <button
                onClick={() => setActiveTab('domain')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'domain'
                    ? 'bg-white text-[#2563EB] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Custom Domain</span>
              </button>
              <button
                onClick={() => setActiveTab('bundle')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'bundle'
                    ? 'bg-white text-amber-600 font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Pro Pass</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#334155] transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Pricing & Themes' : 'Expand Pricing & Themes'}
          >
            <span>{isExpanded ? 'Hide Pricing & Themes' : 'View Pricing & Themes'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Expanded Content Drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* TAB 0: INTERACTIVE PACKAGE CALCULATOR */}
          {activeTab === 'calculator' && (
            <FeaturePricingCalculator
              mode="portfolio"
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

          {/* TAB 1: THEMES & PRICING CARDS */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Select Your Portfolio Theme Design
                  </h3>
                  <p className="text-xs text-[#475569]">
                    All themes preserve 100% of your configured projects and bio. Prices verified from backend catalog.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#64748B] hidden sm:block">
                  Live Preview • Zero Data Loss
                </div>
              </div>

              {/* 5 Themes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PORTFOLIO_THEMES.map((tmpl) => {
                  const priceInfo = catalog.getThemePrice(tmpl.id)
                  const isActive = currentTheme === tmpl.id
                  const isUnlocked = entitlements.isThemeUnlocked(tmpl.id)

                  return (
                    <div
                      key={tmpl.id}
                      className={`rounded-2xl border transition-all p-4.5 flex flex-col justify-between text-xs relative ${
                        isActive
                          ? 'border-[#2563EB] bg-[#EFF6FF]/60 shadow-md ring-2 ring-[#2563EB]/20'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Theme Visual Preview Thumbnail Header */}
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
                          <div className="text-[10px] font-bold text-white drop-shadow-sm">
                            {tmpl.name}
                          </div>
                        </div>

                        {/* Title, Badges, Price */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                              <span>{tmpl.name}</span>
                              {isActive && (
                                <span className="w-2 h-2 rounded-full bg-[#2563EB]" title="Active Selection" />
                              )}
                            </h4>
                            <p className="text-[11px] text-[#64748B] leading-tight line-clamp-2">
                              {tmpl.tagline}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            {tmpl.isFree ? (
                              <Badge variant="success" size="sm">
                                FREE • ₹0
                              </Badge>
                            ) : (
                              <Badge variant="accent" size="sm">
                                PRO • {priceInfo.formatted}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Feature Highlights */}
                        <ul className="space-y-1 text-[11px] text-[#475569] pt-2 border-t border-[#F1F5F9]">
                          {tmpl.highlights.slice(0, 3).map((h, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                        <div className="text-[11px]">
                          {isActive ? (
                            <span className="font-bold text-[#2563EB] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </span>
                          ) : isUnlocked || tmpl.isFree ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{tmpl.isFree ? 'Free Forever' : 'Unlocked'}</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              <span>{priceInfo.formatted} One-Time</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Preview Action */}
                          <button
                            type="button"
                            onClick={() => setPreviewTheme(tmpl)}
                            className="px-2.5 py-1 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A] text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
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
                              onClick={() => onSelectTheme(tmpl.id)}
                              className="text-[11px] py-1 px-2.5 h-7 bg-[#2563EB] hover:bg-[#1D4ED8]"
                            >
                              Select Theme
                            </Button>
                          ) : (
                            <Button
                              variant="glow"
                              size="sm"
                              onClick={() => {
                                onSelectTheme(tmpl.id)
                              }}
                              className="text-[11px] py-1 px-2.5 h-7 flex items-center gap-1"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Unlock {priceInfo.formatted}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Custom Domain Pass & Pro All-Access Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                      'PR Elevate Pro All-Access Lifetime Pass',
                    )
                  }}
                />
              </div>
            </div>
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

          {/* TAB 3: CUSTOM DOMAIN PASS EXPLANATION */}
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
                    'PR Elevate Pro All-Access Lifetime Pass',
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
