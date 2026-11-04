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
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '../../../components/ui/Badge.tsx'
import { Button } from '../../../components/ui/Button.tsx'
import { TemplatePreviewModal } from '../../../components/pricing/TemplatePreviewModal.tsx'
import { PRBuilderProBundleCard } from '../../../components/pricing/PRBuilderProBundleCard.tsx'
import { CustomizationPricingPanel } from '../../../components/pricing/CustomizationPricingPanel.tsx'
import { LivePricingSummary } from '../../../components/pricing/LivePricingSummary.tsx'
import { FeaturePricingCalculator } from '../../../components/pricing/FeaturePricingCalculator.tsx'
import {
  usePricingCatalog,
  TEMPLATE_PRODUCT_MAP,
} from '../../../hooks/usePricingCatalog.ts'
import type { EntitlementsState } from '../../../hooks/useEntitlements.ts'
import type { ResumeTemplateId } from '../types.ts'

export interface ResumePricingSectionProps {
  currentTemplate: ResumeTemplateId
  onSelectTemplate: (template: ResumeTemplateId) => void
  entitlements: EntitlementsState
  onProceedToCheckout: (
    productId: string,
    amountPaise: number,
    title: string,
    couponCode?: string,
  ) => void
  className?: string
}

interface TemplateMetadata {
  id: ResumeTemplateId
  name: string
  tagline: string
  isFree: boolean
  productId?: string
  highlights: string[]
}

const RESUME_TEMPLATES: TemplateMetadata[] = [
  // 4 Always-Free Templates
  {
    id: 'classic-ats',
    name: 'Classic ATS Resume',
    tagline: 'Standard single-column format engineered for maximum ATS parser readability.',
    isFree: true,
    highlights: [
      'Strict single-column layout recognized by all ATS scanners',
      'Clean serif and sans typography pairing',
      'Standard section hierarchy and bullet spacing',
      '100% free with unlimited PDF downloads and revisions',
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal Editorial Resume',
    tagline: 'Lightweight contemporary layout with subtle divider rules and elegant typography.',
    isFree: true,
    highlights: [
      'Balanced whitespace with clean horizontal rules',
      'Optimized for both digital screen and physical print export',
      'Numbered section hierarchy for high scannability',
      '100% free with draft cloud sync and local storage',
    ],
  },
  {
    id: 'classic',
    name: 'Classic Executive Resume',
    tagline: 'Traditional executive layout designed for corporate and enterprise roles.',
    isFree: true,
    highlights: [
      'Distinguished executive header with centered contact coordinates',
      'Balanced serif margins and refined font scale',
      'Comprehensive experience and education density',
      '100% free forever for all students and developers',
    ],
  },
  {
    id: 'modern',
    name: 'Modern Balanced Resume',
    tagline: 'Fresh contemporary layout featuring crisp accent lines and modern headers.',
    isFree: true,
    highlights: [
      'Subtle accent border framing on key titles',
      'Compact section headers for 1-page targets',
      'Clean skill tag matrix and project callouts',
      '100% free forever with instant browser backup',
    ],
  },

  // 2 Premium Pro Templates (Configured Catalog Products)
  {
    id: 'modern-professional',
    name: 'Modern Professional Resume',
    tagline: 'Two-tone split header engineered for senior engineers and tech managers.',
    isFree: false,
    productId: 'pro-template-modern-professional',
    highlights: [
      'Two-tone split header highlighting core competencies and contact info',
      'Recruiter eye-tracking scanning hierarchy tested on FAANG recruiters',
      'Custom visual accent rules for clean multi-section separation',
      'Lifetime unlock with unlimited PDF exports and updates',
    ],
  },
  {
    id: 'technical',
    name: 'Technical Developer Resume',
    tagline: 'High-density developer layout highlighting git projects, tech stacks, and terminal skills.',
    isFree: false,
    productId: 'pro-template-technical',
    highlights: [
      'Monospace terminal-style section badges and inline tech chips',
      'Dedicated project density and tech stack chips for technical screening',
      'High information density without sacrificing ATS keyword legibility',
      'Lifetime unlock with unlimited updates and custom styling',
    ],
  },
]

export const ResumePricingSection: React.FC<ResumePricingSectionProps> = ({
  currentTemplate,
  onSelectTemplate,
  entitlements,
  onProceedToCheckout,
  className = '',
}) => {
  const catalog = usePricingCatalog()
  const [isExpanded, setIsExpanded] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<'calculator' | 'templates' | 'customization' | 'bundle'>('calculator')
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])
  const [previewTemplate, setPreviewTemplate] = useState<TemplateMetadata | null>(null)

  const toggleAddon = (productId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  // Find price info for current selection
  const currentPriceInfo = catalog.getTemplatePrice(currentTemplate)
  const proPass = catalog.getProPassPrice()

  // Base product for live summary: if current is pro and not owned, or if an unowned template is selected
  const isCurrentProAndUnowned = !currentPriceInfo.isFree && !entitlements.isTemplateUnlocked(currentTemplate)
  const baseProductId = isCurrentProAndUnowned
    ? TEMPLATE_PRODUCT_MAP[currentTemplate] || 'pro-template-modern-professional'
    : currentPriceInfo.product?.id || 'classic-ats'

  const currentTemplateName =
    RESUME_TEMPLATES.find((t) => t.id === currentTemplate)?.name || 'Resume Template'

  return (
    <div
      className={`border-b border-[#E2E8F0] bg-gradient-to-b from-white via-[#F8FAFC] to-white text-[#111827] ${className}`}
    >
      {/* 1. Collapsible Section Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
                Customize Your Resume & Get Pricing
              </h2>
              <Badge variant="success" size="sm">
                4 FREE • 2 PRO (₹199)
              </Badge>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Active Template:{' '}
              <span className="font-semibold text-[#0F172A]">{currentTemplateName}</span>{' '}
              {currentPriceInfo.isFree ? (
                <span className="text-emerald-600 font-semibold">(Free Tier)</span>
              ) : entitlements.isTemplateUnlocked(currentTemplate) ? (
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
                Custom Calculator
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'templates'
                    ? 'bg-white text-[#2563EB] font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Templates (6)
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
                onClick={() => setActiveTab('bundle')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'bundle'
                    ? 'bg-white text-amber-600 font-bold shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Pro All-Access</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#334155] transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Pricing & Templates' : 'Expand Pricing & Templates'}
          >
            <span>{isExpanded ? 'Hide Pricing & Templates' : 'View Pricing & Templates'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Expanded Content Drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-200">
          {/* TAB 0: INTERACTIVE SELECTION PRICING CALCULATOR */}
          {activeTab === 'calculator' && (
            <FeaturePricingCalculator
              mode="resume"
              selectedTemplateOrTheme={currentTemplate}
              onSelectTemplateOrTheme={(id) => onSelectTemplate(id as ResumeTemplateId)}
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={toggleAddon}
              entitlements={entitlements}
              catalog={catalog}
              onPreviewItem={(_type, id) => {
                const tmpl = RESUME_TEMPLATES.find((t) => t.id === id)
                if (tmpl) setPreviewTemplate(tmpl)
              }}
            />
          )}

          {/* TAB 1: TEMPLATES & PRICING CARDS */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Select Your Resume Template Format
                  </h3>
                  <p className="text-xs text-[#475569]">
                    All templates preserve 100% of your entered content. Prices loaded dynamically from catalog.
                  </p>
                </div>
                <div className="text-xs font-mono text-[#64748B] hidden sm:block">
                  Integer Paise • Zero Data Loss
                </div>
              </div>

              {/* 6 Template Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {RESUME_TEMPLATES.map((tmpl) => {
                  const priceInfo = catalog.getTemplatePrice(tmpl.id)
                  const isActive = currentTemplate === tmpl.id
                  const isUnlocked = entitlements.isTemplateUnlocked(tmpl.id)

                  return (
                    <div
                      key={tmpl.id}
                      className={`rounded-2xl border transition-all p-4.5 flex flex-col justify-between text-xs relative ${
                        isActive
                          ? 'border-[#2563EB] bg-[#EFF6FF]/60 shadow-md ring-2 ring-[#2563EB]/20'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-sm'
                      }`}
                    >
                      {/* Top Row: Title, Badges, Price */}
                      <div className="space-y-2">
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
                              <span>{tmpl.isFree ? 'Free Tier' : 'Unlocked'}</span>
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5" />
                              <span>{priceInfo.formatted} One-Time</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Preview Action */}
                          <button
                            type="button"
                            onClick={() => setPreviewTemplate(tmpl)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-medium transition-all shadow-2xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                            title={`Preview ${tmpl.name}`}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Preview</span>
                          </button>

                          {/* Select Action */}
                          {isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="text-xs font-semibold py-1.5 px-3 rounded-lg border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                            >
                              Selected
                            </Button>
                          ) : isUnlocked || tmpl.isFree ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onSelectTemplate(tmpl.id)}
                              className="text-xs font-semibold py-1.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-[0.98]"
                            >
                              Select Template
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                onSelectTemplate(tmpl.id)
                              }}
                              className="text-xs font-semibold py-1.5 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all active:scale-[0.98]"
                            >
                              Select (Pro)
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* All-Access Bundle Banner */}
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

          {/* TAB 2: CUSTOMIZATION PRICING PANEL */}
          {activeTab === 'customization' && (
            <CustomizationPricingPanel
              mode="resume"
              selectedTemplateOrTheme={currentTemplate}
              selectedAddonIds={selectedAddonIds}
              onToggleAddon={toggleAddon}
              entitlements={entitlements}
              catalog={catalog}
            />
          )}

          {/* TAB 3: PRO ALL-ACCESS LIFETIME PASS */}
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

          {/* 3. LIVE PRICING SUMMARY (Whenever paid item or addon is active) */}
          {(!currentPriceInfo.isFree || selectedAddonIds.length > 0) && (
            <LivePricingSummary
              baseProductId={baseProductId}
              baseItemName={currentTemplateName}
              basePriceRupees={currentPriceInfo.rupees}
              baseIsFree={currentPriceInfo.isFree}
              addonProductIds={selectedAddonIds}
              onRemoveAddon={toggleAddon}
              onClearAddons={() => setSelectedAddonIds([])}
              onContinueToPreview={() => {
                const tmpl = RESUME_TEMPLATES.find((t) => t.id === currentTemplate)
                if (tmpl) setPreviewTemplate(tmpl)
              }}
              entitlements={entitlements}
              onProceedToCheckout={onProceedToCheckout}
            />
          )}
        </div>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          isOpen={Boolean(previewTemplate)}
          onClose={() => setPreviewTemplate(null)}
          type="resume"
          id={previewTemplate.id}
          name={previewTemplate.name}
          categoryLabel={previewTemplate.isFree ? 'Free ATS Format' : 'Premium Pro Format'}
          priceFormatted={catalog.getTemplatePrice(previewTemplate.id).formatted}
          pricePaise={catalog.getTemplatePrice(previewTemplate.id).paise}
          isFree={previewTemplate.isFree}
          isOwned={entitlements.isTemplateUnlocked(previewTemplate.id)}
          isActive={currentTemplate === previewTemplate.id}
          description={previewTemplate.tagline}
          highlights={previewTemplate.highlights}
          onSelect={() => onSelectTemplate(previewTemplate.id)}
          onUpgrade={() => {
            onSelectTemplate(previewTemplate.id)
            if (previewTemplate.productId) {
              const p = catalog.getTemplatePrice(previewTemplate.id)
              onProceedToCheckout(previewTemplate.productId, p.paise, previewTemplate.name)
            }
          }}
        />
      )}
    </div>
  )
}
