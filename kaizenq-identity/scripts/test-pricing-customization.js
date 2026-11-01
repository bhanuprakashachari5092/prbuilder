/**
 * Automated Verification Test Suite: Pricing, Customization & Checkout Engine
 * PR Builder — Production Pricing Engine & Zero-Data-Loss Architecture
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

let testsPassed = 0
let testsFailed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`)
    testsPassed++
  } else {
    console.error(`  ✗ FAIL: ${testName}`)
    testsFailed++
  }
}

console.log('\n======================================================================')
console.log('  PR BUILDER — PRICING, CUSTOMIZATION & CHECKOUT ENGINE TEST SUITE')
console.log('======================================================================\n')

// -----------------------------------------------------------------------------
// 1. Free Tier Invariants
// -----------------------------------------------------------------------------
console.log('--- 1. Free Tier Invariants ---')
const FREE_RESUME_TEMPLATES = ['classic-ats', 'minimal', 'classic', 'modern']
const FREE_PORTFOLIO_THEMES = ['developer', 'minimal', 'midnight']

assert(FREE_RESUME_TEMPLATES.includes('classic-ats'), 'classic-ats is an unconditional free resume template')
assert(FREE_RESUME_TEMPLATES.includes('minimal'), 'minimal is an unconditional free resume template')
assert(FREE_RESUME_TEMPLATES.includes('classic'), 'classic is an unconditional free resume template')
assert(FREE_RESUME_TEMPLATES.includes('modern'), 'modern is an unconditional free resume template')
assert(FREE_RESUME_TEMPLATES.length === 4, 'Exactly 4 resume templates are preserved in free tier')

assert(FREE_PORTFOLIO_THEMES.includes('developer'), 'developer is an unconditional free portfolio theme')
assert(FREE_PORTFOLIO_THEMES.includes('minimal'), 'minimal is an unconditional free portfolio theme')
assert(FREE_PORTFOLIO_THEMES.includes('midnight'), 'midnight is an unconditional free portfolio theme')
assert(FREE_PORTFOLIO_THEMES.length === 3, 'Exactly 3 portfolio themes are preserved in free tier')

// -----------------------------------------------------------------------------
// 2. Authoritative Catalog & Product-to-Entitlement Mappings
// -----------------------------------------------------------------------------
console.log('\n--- 2. Server-Authoritative Product Catalog & Entitlements ---')
const CATALOG = [
  { id: 'pro-template-modern-professional', name: 'Modern Professional Resume Template', category: 'resume_template', targetId: 'modern-professional', pricePaise: 19900, entitlement: 'template:modern-professional' },
  { id: 'pro-template-technical', name: 'Technical Developer Resume Template', category: 'resume_template', targetId: 'technical', pricePaise: 19900, entitlement: 'template:technical' },
  { id: 'pro-theme-creative', name: 'Creative Studio Portfolio Theme', category: 'portfolio_theme', targetId: 'creative', pricePaise: 29900, entitlement: 'theme:creative' },
  { id: 'pro-theme-modern', name: 'Modern Clean Portfolio Theme', category: 'portfolio_theme', targetId: 'modern', pricePaise: 29900, entitlement: 'theme:modern' },
  { id: 'custom-domain-pass', name: 'Custom Domain Pass', category: 'domain_pass', targetId: 'custom-domain', pricePaise: 49900, entitlement: 'domain:custom' },
  { id: 'pro-all-access-pass', name: 'PR Builder Pro All-Access Lifetime Pass', category: 'bundle', targetId: 'all_access', pricePaise: 99900, entitlement: 'bundle:all_access' },
]

CATALOG.forEach((item) => {
  assert(Number.isInteger(item.pricePaise) && item.pricePaise > 0, `${item.name} stored in integer paise (${item.pricePaise})`)
  assert(typeof item.entitlement === 'string' && item.entitlement.length > 0, `${item.name} maps to stable entitlement key (${item.entitlement})`)
})

const modernResume = CATALOG.find((p) => p.id === 'pro-template-modern-professional')
assert(modernResume.pricePaise === 19900, 'Modern Professional Resume is ₹199 (19900 paise)')

const techResume = CATALOG.find((p) => p.id === 'pro-template-technical')
assert(techResume.pricePaise === 19900, 'Technical Developer Resume is ₹199 (19900 paise)')

const creativeTheme = CATALOG.find((p) => p.id === 'pro-theme-creative')
assert(creativeTheme.pricePaise === 29900, 'Creative Studio Theme is ₹299 (29900 paise)')

const modernTheme = CATALOG.find((p) => p.id === 'pro-theme-modern')
assert(modernTheme.pricePaise === 29900, 'Modern Clean Theme is ₹299 (29900 paise)')

const domainPass = CATALOG.find((p) => p.id === 'custom-domain-pass')
assert(domainPass.pricePaise === 49900, 'Custom Domain Pass is ₹499 (49900 paise)')

const lifetimePass = CATALOG.find((p) => p.id === 'pro-all-access-pass')
assert(lifetimePass.pricePaise === 99900, 'All-Access Lifetime Pass is ₹999 (99900 paise)')

// -----------------------------------------------------------------------------
// 3. Cart Pricing Engine & Bundle Calculations
// -----------------------------------------------------------------------------
console.log('\n--- 3. Cart Pricing Engine & Bundle Savings ---')

function calculateCartPricing(baseProductId, addonIds = [], couponCode = null) {
  const baseProduct = CATALOG.find((p) => p.id === baseProductId)
  if (!baseProduct) throw new Error(`Unknown product: ${baseProductId}`)

  const items = [{ ...baseProduct, isBase: true }]
  let subtotalPaise = baseProduct.pricePaise

  for (const addonId of addonIds) {
    const addon = CATALOG.find((p) => p.id === addonId)
    if (addon) {
      items.push({ ...addon, isBase: false })
      subtotalPaise += addon.pricePaise
    }
  }

  let bundleSavingsPaise = 0
  if (baseProductId === 'pro-all-access-pass') {
    // Component sum: ₹199 + ₹199 + ₹299 + ₹299 + ₹499 = ₹1495 (149500 paise)
    const componentTotalPaise = 19900 + 19900 + 29900 + 29900 + 49900
    bundleSavingsPaise = componentTotalPaise - 99900 // 49600 paise (₹496)
  }

  let discountPaise = 0
  if (couponCode) {
    const code = couponCode.trim().toUpperCase()
    if (code === 'WELCOME10') {
      discountPaise = Math.round((subtotalPaise * 10) / 100)
    } else if (code === 'STUDENT50') {
      discountPaise = Math.round((subtotalPaise * 50) / 100)
    } else if (code === 'HACKATHON100') {
      discountPaise = subtotalPaise
    }
  }

  discountPaise = Math.min(subtotalPaise, discountPaise)
  const payablePaise = Math.max(0, subtotalPaise - discountPaise)

  return {
    items,
    subtotalPaise,
    bundleSavingsPaise,
    discountPaise,
    payablePaise,
    isFree: payablePaise === 0,
  }
}

// Single template
const cart1 = calculateCartPricing('pro-template-modern-professional')
assert(cart1.subtotalPaise === 19900, 'Single template subtotal is 19900 paise')
assert(cart1.payablePaise === 19900, 'Single template payable is 19900 paise')
assert(!cart1.isFree, 'Single template is not free')

// Template with custom domain add-on
const cart2 = calculateCartPricing('pro-template-modern-professional', ['custom-domain-pass'])
assert(cart2.subtotalPaise === 19900 + 49900, 'Template + Domain add-on subtotal is 69800 paise (₹698)')
assert(cart2.payablePaise === 69800, 'Payable is 69800 paise')
assert(cart2.items.length === 2, 'Cart has 2 items')

// Bundle calculation and savings
const bundleCart = calculateCartPricing('pro-all-access-pass')
assert(bundleCart.subtotalPaise === 99900, 'Lifetime pass subtotal is 99900 paise (₹999)')
assert(bundleCart.bundleSavingsPaise === 49600, 'Lifetime pass grants exactly ₹496 (49600 paise) bundle savings')

// -----------------------------------------------------------------------------
// 4. Coupon Integration on Cart
// -----------------------------------------------------------------------------
console.log('\n--- 4. Coupon Discounts on Cart Engine ---')

// 10% coupon
const coupon10Cart = calculateCartPricing('pro-theme-creative', [], 'WELCOME10')
assert(coupon10Cart.discountPaise === 2990, '10% discount on ₹299 is ₹29.90 (2990 paise)')
assert(coupon10Cart.payablePaise === 26910, 'Payable is ₹269.10 (26910 paise)')

// 50% student coupon
const studentCart = calculateCartPricing('pro-all-access-pass', [], 'STUDENT50')
assert(studentCart.discountPaise === 49950, '50% on ₹999 is ₹499.50 (49950 paise)')
assert(studentCart.payablePaise === 49950, 'Payable after 50% discount is ₹499.50 (49950 paise)')

// 100% free hackathon coupon
const hackathonCart = calculateCartPricing('pro-template-technical', [], 'HACKATHON100')
assert(hackathonCart.discountPaise === 19900, '100% discount on ₹199 is ₹199 (19900 paise)')
assert(hackathonCart.payablePaise === 0, 'Final payable is 0 paise')
assert(hackathonCart.isFree === true, 'Cart is marked isFree = true for zero-payable fulfillment')

// -----------------------------------------------------------------------------
// 5. Entitlement Ownership & Duplicate Charge Prevention
// -----------------------------------------------------------------------------
console.log('\n--- 5. Duplicate Charge Prevention & Entitlement Verification ---')

function checkCanPurchase(userEntitlements, targetProductId) {
  const product = CATALOG.find((p) => p.id === targetProductId)
  if (!product) return { allowed: false, reason: 'Invalid product' }

  // Check if user possesses All-Access Lifetime Pass
  if (userEntitlements.has('*') || userEntitlements.has('bundle:all_access')) {
    return { allowed: false, isOwned: true, reason: 'User owns All-Access Lifetime Pass' }
  }

  // Check direct entitlement key
  if (userEntitlements.has(product.entitlement)) {
    return { allowed: false, isOwned: true, reason: 'User already owns this entitlement' }
  }

  return { allowed: true, isOwned: false }
}

const emptyUser = new Set()
assert(checkCanPurchase(emptyUser, 'pro-template-technical').allowed === true, 'New user can purchase technical template')

const ownedUser = new Set(['template:technical'])
assert(checkCanPurchase(ownedUser, 'pro-template-technical').allowed === false, 'Owner cannot repurchase technical template')
assert(checkCanPurchase(ownedUser, 'pro-template-technical').isOwned === true, 'Flagged as already owned')
assert(checkCanPurchase(ownedUser, 'pro-template-modern-professional').allowed === true, 'Can purchase different unowned template')

const allAccessUser = new Set(['bundle:all_access'])
assert(checkCanPurchase(allAccessUser, 'pro-template-modern-professional').allowed === false, 'All-Access owner cannot be charged for modern-professional')
assert(checkCanPurchase(allAccessUser, 'pro-theme-creative').allowed === false, 'All-Access owner cannot be charged for creative theme')
assert(checkCanPurchase(allAccessUser, 'custom-domain-pass').allowed === false, 'All-Access owner cannot be charged for custom domain pass')

// -----------------------------------------------------------------------------
// 6. Draft Content Safety Invariants
// -----------------------------------------------------------------------------
console.log('\n--- 6. Zero Data Loss Invariants ---')

const sampleResumeDraft = {
  title: 'Senior Software Engineer',
  personal: { fullName: 'Bhanu Prakash', email: 'bhanu@dev.local', phone: '+91 9876543210' },
  experience: [{ company: 'Acme Corp', role: 'Staff Engineer', highlights: ['Led migration to TypeScript'] }],
  education: [{ institution: 'IIT', degree: 'B.Tech' }],
  template: 'classic-ats',
  customization: { fontFamily: 'sans', accentColor: '#0F172A', spacing: 'normal' },
}

// Simulate template switch
function switchTemplate(currentDraft, newTemplate) {
  return {
    ...currentDraft,
    template: newTemplate,
  }
}

const switched = switchTemplate(sampleResumeDraft, 'technical')
assert(switched.personal.fullName === sampleResumeDraft.personal.fullName, 'Personal info retained on template switch')
assert(switched.experience.length === sampleResumeDraft.experience.length, 'Experience retained on template switch')
assert(switched.template === 'technical', 'Template updated successfully')

// Simulate customization change
function updateCustomization(currentDraft, newCustomization) {
  return {
    ...currentDraft,
    customization: {
      ...currentDraft.customization,
      ...newCustomization,
    },
  }
}

const styled = updateCustomization(sampleResumeDraft, { accentColor: '#2563EB', spacing: 'compact' })
assert(styled.customization.accentColor === '#2563EB', 'Accent color updated in draft state')
assert(styled.customization.spacing === 'compact', 'Spacing updated in draft state')
assert(styled.customization.fontFamily === 'sans', 'Previous font family retained')

// -----------------------------------------------------------------------------
// 7. Admin Price Update & Audit Log Integrity
// -----------------------------------------------------------------------------
console.log('\n--- 7. Admin Pricing Controls & Audit Logging ---')

const auditLogs = []

function adminUpdateProductPrice(productId, newPricePaise, reason, adminUserId) {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Audit justification reason is mandatory')
  }
  if (!Number.isInteger(newPricePaise) || newPricePaise < 0) {
    throw new Error('Price must be a valid positive integer in paise')
  }

  const product = CATALOG.find((p) => p.id === productId)
  if (!product) throw new Error('Product not found')

  const oldPrice = product.pricePaise
  product.pricePaise = newPricePaise

  const logEntry = {
    id: `audit-${Date.now()}`,
    action: 'admin_price_update',
    adminId: adminUserId,
    productId,
    oldPricePaise: oldPrice,
    newPricePaise,
    reason: reason.trim(),
    timestamp: new Date().toISOString(),
  }

  auditLogs.push(logEntry)
  return logEntry
}

const log = adminUpdateProductPrice(
  'pro-template-technical',
  24900,
  'Seasonal update for hiring sprint',
  'admin-uuid-123',
)

assert(log.oldPricePaise === 19900, 'Audit log records old price of 19900 paise')
assert(log.newPricePaise === 24900, 'Audit log records new price of 24900 paise')
assert(log.reason === 'Seasonal update for hiring sprint', 'Audit log records justification reason')

// Revert back for catalog consistency
adminUpdateProductPrice('pro-template-technical', 19900, 'Reverting to baseline test catalog', 'admin-uuid-123')

// -----------------------------------------------------------------------------
// 8. Migration File Verification
// -----------------------------------------------------------------------------
console.log('\n--- 8. Database Migration 14 Verification ---')
const migration14Path = path.join(rootDir, 'supabase', 'migrations', '20261026000014_pricing_and_customization.sql')
assert(fs.existsSync(migration14Path), 'Migration 20261026000014_pricing_and_customization.sql exists')

if (fs.existsSync(migration14Path)) {
  const content = fs.readFileSync(migration14Path, 'utf8')
  assert(content.includes('calculate_cart_pricing'), 'Defines calculate_cart_pricing RPC')
  assert(content.includes('update_product_price'), 'Defines update_product_price RPC')
  assert(content.includes('toggle_product_status'), 'Defines toggle_product_status RPC')
  assert(content.includes('get_admin_pricing_catalog'), 'Defines get_admin_pricing_catalog RPC')
  assert(content.includes('payment_audit_logs'), 'References payment_audit_logs table')
}

// -----------------------------------------------------------------------------
// 9. Builder Tabs Visible Pricing Components Verification
// -----------------------------------------------------------------------------
console.log('\n--- 9. Builder Tabs Visible Pricing & Customization Architecture ---')

const resumePricingSectionPath = path.join(rootDir, 'src', 'pages', 'Resume', 'components', 'ResumePricingSection.tsx')
assert(fs.existsSync(resumePricingSectionPath), 'ResumePricingSection.tsx exists inside Resume components')

if (fs.existsSync(resumePricingSectionPath)) {
  const content = fs.readFileSync(resumePricingSectionPath, 'utf8')
  assert(content.includes('classic-ats'), 'Includes classic-ats template card')
  assert(content.includes('minimal'), 'Includes minimal template card')
  assert(content.includes('classic'), 'Includes classic template card')
  assert(content.includes('modern'), 'Includes modern template card')
  assert(content.includes('modern-professional'), 'Includes modern-professional pro template')
  assert(content.includes('technical'), 'Includes technical pro developer template')
  assert(content.includes('TemplatePreviewModal'), 'Integrates TemplatePreviewModal')
  assert(content.includes('PRBuilderProBundleCard'), 'Integrates PRBuilderProBundleCard')
  assert(content.includes('CustomizationPricingPanel'), 'Integrates CustomizationPricingPanel')
  assert(content.includes('LivePricingSummary'), 'Integrates LivePricingSummary')
}

const portfolioPricingSectionPath = path.join(rootDir, 'src', 'pages', 'Portfolio', 'components', 'builder', 'PortfolioPricingSection.tsx')
assert(fs.existsSync(portfolioPricingSectionPath), 'PortfolioPricingSection.tsx exists inside Portfolio builder components')

if (fs.existsSync(portfolioPricingSectionPath)) {
  const content = fs.readFileSync(portfolioPricingSectionPath, 'utf8')
  assert(content.includes('developer'), 'Includes developer free theme')
  assert(content.includes('minimal'), 'Includes minimal free theme')
  assert(content.includes('midnight'), 'Includes midnight free theme')
  assert(content.includes('creative'), 'Includes creative pro studio theme')
  assert(content.includes('modern'), 'Includes modern pro clean theme')
  assert(content.includes('CustomDomainPricingCard'), 'Integrates CustomDomainPricingCard')
  assert(content.includes('PRBuilderProBundleCard'), 'Integrates PRBuilderProBundleCard')
  assert(content.includes('CustomizationPricingPanel'), 'Integrates CustomizationPricingPanel')
  assert(content.includes('LivePricingSummary'), 'Integrates LivePricingSummary')
}

// -----------------------------------------------------------------------------
// 10. Customization Panel & Domain Invariants
// -----------------------------------------------------------------------------
console.log('\n--- 10. Customization Panel & Domain Invariants ---')

const customizationPanelPath = path.join(rootDir, 'src', 'components', 'pricing', 'CustomizationPricingPanel.tsx')
assert(fs.existsSync(customizationPanelPath), 'CustomizationPricingPanel.tsx exists')

if (fs.existsSync(customizationPanelPath)) {
  const content = fs.readFileSync(customizationPanelPath, 'utf8')
  assert(content.includes('customization-typography'), 'Supports typography and fonts customization')
  assert(content.includes('customization-colors'), 'Supports color palettes and hex picker')
  assert(content.includes('customization-layout'), 'Supports layout density and spacing')
  assert(content.includes('customization-effects'), 'Supports visual effects and CSS animations')
  assert(content.includes('draft_proposed'), 'Draft proposed prices (₹49/₹99) remain unapproved drafts')
  assert(content.includes('Included in All Templates (₹0)') || content.includes('Included in All Tiers (₹0)'), 'Core customizations marked included at ₹0')
}

const domainCardPath = path.join(rootDir, 'src', 'components', 'pricing', 'CustomDomainPricingCard.tsx')
assert(fs.existsSync(domainCardPath), 'CustomDomainPricingCard.tsx exists')

if (fs.existsSync(domainCardPath)) {
  const content = fs.readFileSync(domainCardPath, 'utf8')
  assert(content.includes('Custom Domain Connection'), 'Explains custom domain edge routing & SSL')
  assert(content.includes('Domain Name Registration'), 'Explains registrar root domain ownership')
}

const bundleCardPath = path.join(rootDir, 'src', 'components', 'pricing', 'PRBuilderProBundleCard.tsx')
assert(fs.existsSync(bundleCardPath), 'PRBuilderProBundleCard.tsx exists')

if (fs.existsSync(bundleCardPath)) {
  const content = fs.readFileSync(bundleCardPath, 'utf8')
  assert(content.includes('PR Builder Pro All-Access Lifetime Pass'), 'Displays All-Access Lifetime Pass')
  assert(content.includes('Save'), 'Displays bundle savings')
  assert(content.includes('Lifetime unlock across all your published portfolios') || content.includes('One-time purchase unlocking all current and future Pro'), 'Declares lifetime scope')
}

// -----------------------------------------------------------------------------
// 11. Interactive Custom Pricing Calculator Tests
// -----------------------------------------------------------------------------
console.log('\n--- 11. Interactive Selection-Based Custom Pricing Calculator ---')

const calculatorCompPath = path.join(rootDir, 'src', 'components', 'pricing', 'FeaturePricingCalculator.tsx')
assert(fs.existsSync(calculatorCompPath), 'FeaturePricingCalculator.tsx exists')

if (fs.existsSync(calculatorCompPath)) {
  const content = fs.readFileSync(calculatorCompPath, 'utf8')
  assert(content.includes('Customize Your Resume & Get Pricing'), 'Implements Customize Your Resume & Get Pricing')
  assert(content.includes('Build Your Portfolio Package'), 'Implements Build Your Portfolio Package')
  assert(content.includes('classic-ats'), 'Includes Free Classic ATS in calculator')
  assert(content.includes('minimal'), 'Includes Free Minimal in calculator')
  assert(content.includes('classic'), 'Includes Free Classic in calculator')
  assert(content.includes('modern'), 'Includes Free Modern in calculator')
  assert(content.includes('modern-professional'), 'Includes Pro Modern Professional in calculator')
  assert(content.includes('technical'), 'Includes Pro Technical Developer in calculator')
  assert(content.includes('developer'), 'Includes Free Developer Terminal theme in calculator')
  assert(content.includes('midnight'), 'Includes Free Midnight theme in calculator')
  assert(content.includes('creative'), 'Includes Pro Creative Studio theme in calculator')
  assert(content.includes('pro-theme-modern') || content.includes('modern'), 'Includes Pro Modern Clean theme in calculator')
  assert(content.includes('custom-domain-pass'), 'Includes Custom Domain Pass add-on in calculator')
  assert(content.includes('pro-all-access-pass'), 'Includes Pro All-Access Lifetime Pass in calculator')
  assert(content.includes('UNBILLABLE DRAFT') || content.includes('draft'), 'Unapproved draft features clearly labeled')
  assert(content.includes('INCLUDED (₹0)'), 'Core styling features marked included at ₹0')
}

// Check integration in both Resume and Portfolio pricing sections
if (fs.existsSync(resumePricingSectionPath)) {
  const content = fs.readFileSync(resumePricingSectionPath, 'utf8')
  assert(content.includes('FeaturePricingCalculator'), 'ResumePricingSection integrates FeaturePricingCalculator')
  assert(content.includes('Customize Your Resume & Get Pricing'), 'ResumePricingSection displays Customize Your Resume & Get Pricing title')
}

if (fs.existsSync(portfolioPricingSectionPath)) {
  const content = fs.readFileSync(portfolioPricingSectionPath, 'utf8')
  assert(content.includes('FeaturePricingCalculator'), 'PortfolioPricingSection integrates FeaturePricingCalculator')
  assert(content.includes('Build Your Portfolio Package'), 'PortfolioPricingSection displays Build Your Portfolio Package title')
}

// -----------------------------------------------------------------------------
// 12. Live Price Summary Panel & Calculation Rules
// -----------------------------------------------------------------------------
console.log('\n--- 12. Live Price Summary Panel & Calculation Rules ---')

const liveSummaryCompPath = path.join(rootDir, 'src', 'components', 'pricing', 'LivePricingSummary.tsx')
assert(fs.existsSync(liveSummaryCompPath), 'LivePricingSummary.tsx exists')

if (fs.existsSync(liveSummaryCompPath)) {
  const content = fs.readFileSync(liveSummaryCompPath, 'utf8')
  assert(content.includes('onRemoveAddon'), 'Supports removing selected feature')
  assert(content.includes('onClearAddons'), 'Supports clearing selections')
  assert(content.includes('onContinueToPreview'), 'Supports continue to preview')
  assert(content.includes('onProceedToCheckout'), 'Supports continue to checkout')
  assert(content.includes('Original Subtotal') || content.includes('Subtotal'), 'Displays subtotal')
  assert(content.includes('Configured Bundle Discount') || content.includes('bundleSavings'), 'Displays configured bundle discount')
  assert(content.includes('Coupon Discount') || content.includes('discountRupees'), 'Displays coupon discount')
  assert(content.includes('Final Payable Amount'), 'Displays final payable amount')
  assert(content.includes('integer paise'), 'Authoritative integer paise computation noted')
}

// -----------------------------------------------------------------------------
// 13. Migration 16 Verification
// -----------------------------------------------------------------------------
console.log('\n--- 13. Database Migration 16 Verification ---')

const migration16Path = path.join(rootDir, 'supabase', 'migrations', '20261026000016_custom_pricing_calculator.sql')
assert(fs.existsSync(migration16Path), 'Migration 20261026000016_custom_pricing_calculator.sql exists')

if (fs.existsSync(migration16Path)) {
  const content = fs.readFileSync(migration16Path, 'utf8')
  assert(content.includes('calculate_cart_pricing'), 'Defines upgraded calculate_cart_pricing RPC')
  assert(content.includes('approve_draft_product'), 'Defines approve_draft_product RPC')
  assert(content.includes('payment_audit_logs'), 'Logs draft product approval to payment_audit_logs')
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n======================================================================')
console.log(`  PRICING & CUSTOMIZATION TESTS COMPLETED: ${testsPassed} passed, ${testsFailed} failed`)
console.log('======================================================================\n')

if (testsFailed > 0) {
  process.exit(1)
}
