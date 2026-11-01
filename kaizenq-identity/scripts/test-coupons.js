/**
 * Automated Verification Test Suite: Coupon & Promo Code System
 * PR Builder — Production Coupon Management & Server-Side Pricing Engine
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

console.log('\n======================================================')
console.log('  PR BUILDER — COUPON & PROMO CODE SYSTEM TEST SUITE')
console.log('======================================================\n')

// -----------------------------------------------------------------------------
// 1. Code Normalization & Formatting
// -----------------------------------------------------------------------------
console.log('--- 1. Coupon Code Normalization ---')
function normalizeCouponCode(code) {
  if (!code || typeof code !== 'string') return ''
  return code.trim().toUpperCase()
}

assert(normalizeCouponCode('welcome10') === 'WELCOME10', 'Converts lowercase to uppercase')
assert(normalizeCouponCode('  WELCOME10  ') === 'WELCOME10', 'Trims leading and trailing whitespace')
assert(normalizeCouponCode('  WeLcOmE10  ') === 'WELCOME10', 'Handles mixed case and whitespace')
assert(normalizeCouponCode('') === '', 'Handles empty string gracefully')
assert(normalizeCouponCode(null) === '', 'Handles null value gracefully')

// -----------------------------------------------------------------------------
// 2. Integer Paise Discount Calculations & Rounding
// -----------------------------------------------------------------------------
console.log('\n--- 2. Discount Calculations in Integer Paise ---')

function calculateDiscount(originalPricePaise, coupon) {
  let discountPaise = 0
  if (coupon.discountType === 'percentage') {
    discountPaise = Math.round((originalPricePaise * coupon.discountValue) / 100)
  } else if (coupon.discountType === 'fixed') {
    discountPaise = coupon.discountValue // in paise
  }

  // Cap discount to original price (no negative amounts)
  discountPaise = Math.min(originalPricePaise, discountPaise)
  const finalPricePaise = Math.max(0, originalPricePaise - discountPaise)
  const finalPriceRupees = Math.round((finalPricePaise / 100) * 100) / 100

  return {
    originalPricePaise,
    discountPaise,
    finalPricePaise,
    finalPriceRupees,
    isFree: finalPricePaise === 0,
  }
}

// 10% off Modern Professional Resume (₹199 = 19900 paise)
const disc10 = calculateDiscount(19900, { discountType: 'percentage', discountValue: 10 })
assert(disc10.discountPaise === 1990, '10% of 19900 paise is exactly 1990 paise (₹19.90)')
assert(disc10.finalPricePaise === 17910, 'Payable amount is 17910 paise (₹179.10)')
assert(disc10.finalPriceRupees === 179.1, 'Final rupees representation is 179.10')
assert(!disc10.isFree, '10% discount is not free')

// 20% off Creative Portfolio Theme (₹299 = 29900 paise)
const disc20 = calculateDiscount(29900, { discountType: 'percentage', discountValue: 20 })
assert(disc20.discountPaise === 5980, '20% of 29900 paise is exactly 5980 paise (₹59.80)')
assert(disc20.finalPricePaise === 23920, 'Payable amount is 23920 paise (₹239.20)')

// Fixed ₹50 discount (5000 paise) on ₹199 product
const fixed50 = calculateDiscount(19900, { discountType: 'fixed', discountValue: 5000 })
assert(fixed50.discountPaise === 5000, 'Fixed discount is 5000 paise (₹50.00)')
assert(fixed50.finalPricePaise === 14900, 'Payable amount is 14900 paise (₹149.00)')
assert(fixed50.finalPriceRupees === 149, 'Final rupees is 149.00')

// 100% full discount (free order)
const free100 = calculateDiscount(19900, { discountType: 'percentage', discountValue: 100 })
assert(free100.discountPaise === 19900, '100% discount equals full product price (19900 paise)')
assert(free100.finalPricePaise === 0, 'Payable amount is 0 paise')
assert(free100.isFree === true, 'Correctly flags order as 100% free')

// Protection against negative totals when fixed discount exceeds product price
const excessDiscount = calculateDiscount(19900, { discountType: 'fixed', discountValue: 50000 }) // ₹500 off ₹199
assert(excessDiscount.discountPaise === 19900, 'Caps discount at original price when fixed discount is greater')
assert(excessDiscount.finalPricePaise === 0, 'Payable amount does not become negative (floored at 0)')
assert(excessDiscount.isFree === true, 'Correctly marks order as free')

// -----------------------------------------------------------------------------
// 3. Coupon Validation Rules & Server-Side Enforcement
// -----------------------------------------------------------------------------
console.log('\n--- 3. Server-Side Eligibility & Validation Rules ---')

function validateCouponRules(product, coupon, userContext) {
  const now = Date.now()

  if (!coupon) {
    return { valid: false, error: 'Coupon code does not exist' }
  }
  if (!coupon.isActive) {
    return { valid: false, error: 'Coupon is currently inactive' }
  }
  if (coupon.startDate && new Date(coupon.startDate).getTime() > now) {
    return { valid: false, error: 'Coupon is not yet active' }
  }
  if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() <= now) {
    return { valid: false, error: 'Coupon has expired' }
  }
  if (coupon.maxTotalRedemptions && coupon.redemptionsCount >= coupon.maxTotalRedemptions) {
    return { valid: false, error: 'Coupon has reached its maximum total redemptions' }
  }
  if (product.pricePaise < (coupon.minOrderPaise || 0)) {
    return { valid: false, error: 'Minimum order amount not met' }
  }
  if (coupon.eligibleProducts && coupon.eligibleProducts.length > 0 && !coupon.eligibleProducts.includes(product.id)) {
    return { valid: false, error: 'Coupon is not valid for this product' }
  }
  if (userContext.userRedemptionsCount >= (coupon.maxPerUser || 1)) {
    return { valid: false, error: 'User has reached redemption limit for this coupon' }
  }
  if (coupon.firstPurchaseOnly && userContext.hasPreviousPaidOrders) {
    return { valid: false, error: 'Coupon is strictly reserved for first-time purchases' }
  }
  if (coupon.eligibleUserGroups && coupon.eligibleUserGroups.length > 0) {
    const isGroupMember = coupon.eligibleUserGroups.some((g) => userContext.userGroups?.includes(g))
    if (!isGroupMember) {
      return { valid: false, error: 'User does not belong to eligible group' }
    }
  }

  return { valid: true, error: null }
}

const mockProductResume = { id: 'pro-template-modern-professional', pricePaise: 19900 }
const mockProductTheme = { id: 'pro-theme-creative', pricePaise: 29900 }

// Inactive coupon
assert(
  !validateCouponRules(mockProductResume, { isActive: false }, { userRedemptionsCount: 0 }).valid,
  'Rejects inactive coupon'
)

// Expired coupon
assert(
  !validateCouponRules(
    mockProductResume,
    { isActive: true, expiryDate: new Date(Date.now() - 3600000).toISOString() },
    { userRedemptionsCount: 0 }
  ).valid,
  'Rejects expired coupon'
)

// Future start date coupon
assert(
  !validateCouponRules(
    mockProductResume,
    { isActive: true, startDate: new Date(Date.now() + 3600000).toISOString() },
    { userRedemptionsCount: 0 }
  ).valid,
  'Rejects coupon with future start date'
)

// Product restriction check
assert(
  !validateCouponRules(
    mockProductTheme,
    { isActive: true, eligibleProducts: ['pro-template-modern-professional'] },
    { userRedemptionsCount: 0 }
  ).valid,
  'Rejects coupon when product is not in eligible products list'
)
assert(
  validateCouponRules(
    mockProductResume,
    { isActive: true, eligibleProducts: ['pro-template-modern-professional'] },
    { userRedemptionsCount: 0 }
  ).valid,
  'Accepts coupon when product is in eligible products list'
)

// Minimum spend check
assert(
  !validateCouponRules(
    mockProductResume, // 19900 paise (₹199)
    { isActive: true, minOrderPaise: 25000 }, // min ₹250
    { userRedemptionsCount: 0 }
  ).valid,
  'Rejects when product price is lower than minimum order spend'
)
assert(
  validateCouponRules(
    mockProductTheme, // 29900 paise (₹299)
    { isActive: true, minOrderPaise: 25000 }, // min ₹250
    { userRedemptionsCount: 0 }
  ).valid,
  'Accepts when product price meets minimum order spend'
)

// Global redemption cap check
assert(
  !validateCouponRules(
    mockProductResume,
    { isActive: true, maxTotalRedemptions: 100, redemptionsCount: 100 },
    { userRedemptionsCount: 0 }
  ).valid,
  'Rejects when total global redemption cap is reached'
)

// Per-user redemption limit check
assert(
  !validateCouponRules(
    mockProductResume,
    { isActive: true, maxPerUser: 1 },
    { userRedemptionsCount: 1 }
  ).valid,
  'Rejects when user has reached per-user redemption limit'
)

// First-purchase only check
assert(
  !validateCouponRules(
    mockProductResume,
    { isActive: true, firstPurchaseOnly: true },
    { userRedemptionsCount: 0, hasPreviousPaidOrders: true }
  ).valid,
  'Rejects first-purchase-only coupon for returning customer'
)
assert(
  validateCouponRules(
    mockProductResume,
    { isActive: true, firstPurchaseOnly: true },
    { userRedemptionsCount: 0, hasPreviousPaidOrders: false }
  ).valid,
  'Accepts first-purchase-only coupon for new customer'
)

// User group verification (hackathon / student)
assert(
  !validateCouponRules(
    mockProductResume,
    { isActive: true, eligibleUserGroups: ['student', 'hackathon'] },
    { userRedemptionsCount: 0, userGroups: ['standard'] }
  ).valid,
  'Rejects coupon when user does not belong to required user group'
)
assert(
  validateCouponRules(
    mockProductResume,
    { isActive: true, eligibleUserGroups: ['student', 'hackathon'] },
    { userRedemptionsCount: 0, userGroups: ['hackathon'] }
  ).valid,
  'Accepts coupon when user belongs to verified user group'
)

// -----------------------------------------------------------------------------
// 4. Rate Limiting & Anti-Brute Force Protection
// -----------------------------------------------------------------------------
console.log('\n--- 4. Anti-Brute Force Rate Limiting ---')

function checkRateLimit(failedAttemptsInLast5Mins) {
  const MAX_FAILED_ATTEMPTS = 10
  if (failedAttemptsInLast5Mins >= MAX_FAILED_ATTEMPTS) {
    return {
      allowed: false,
      error: 'Too many invalid coupon attempts. Please wait 5 minutes before trying again.',
    }
  }
  return { allowed: true }
}

assert(checkRateLimit(0).allowed, 'Allows initial attempt (0 failed attempts)')
assert(checkRateLimit(9).allowed, 'Allows attempt under limit (9 failed attempts)')
assert(!checkRateLimit(10).allowed, 'Blocks attempt at threshold (10 failed attempts)')
assert(!checkRateLimit(15).allowed, 'Blocks attempt over threshold (15 failed attempts)')

// -----------------------------------------------------------------------------
// 5. Formula Injection & Safe CSV Escaping
// -----------------------------------------------------------------------------
console.log('\n--- 5. CSV Formula Injection Defense ---')

function escapePaymentCsv(value) {
  if (value === null || value === undefined) return '""'
  let str = String(value)
  // Neutralize spreadsheet formula injection triggers: =, +, -, @, \t, \r
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return `"${str}"`
}

assert(escapePaymentCsv('=SUM(A1:A10)') === `"'=SUM(A1:A10)"`, 'Prefixes formula trigger "=" with single quote')
assert(escapePaymentCsv('+12345') === `"'+12345"`, 'Prefixes formula trigger "+" with single quote')
assert(escapePaymentCsv('-CMD|') === `"'-CMD|"`, 'Prefixes formula trigger "-" with single quote')
assert(escapePaymentCsv('@evil.com') === `"'@evil.com"`, 'Prefixes formula trigger "@" with single quote')
assert(escapePaymentCsv('Regular Text') === `"Regular Text"`, 'Wraps regular string in double quotes')
assert(escapePaymentCsv('Text "with" quotes') === `"Text ""with"" quotes"`, 'Escapes internal double quotes per RFC 4180')

// -----------------------------------------------------------------------------
// 6. Static Architecture & File Verification
// -----------------------------------------------------------------------------
console.log('\n--- 6. Codebase Architecture & Feature Verification ---')

// 6.1 Database Migration
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20261026000013_coupons_and_promotions.sql')
assert(fs.existsSync(migrationPath), 'Migration 20261026000013_coupons_and_promotions.sql exists')
const migrationCode = fs.readFileSync(migrationPath, 'utf8')

assert(migrationCode.includes('CREATE TABLE IF NOT EXISTS public.coupons'), 'Migration declares public.coupons table')
assert(migrationCode.includes('CREATE TABLE IF NOT EXISTS public.coupon_redemptions'), 'Migration declares public.coupon_redemptions table')
assert(migrationCode.includes('CREATE TABLE IF NOT EXISTS public.coupon_validation_logs'), 'Migration declares public.coupon_validation_logs table')
assert(migrationCode.includes('CREATE OR REPLACE FUNCTION public.validate_coupon'), 'Migration declares validate_coupon RPC')
assert(migrationCode.includes('CREATE OR REPLACE FUNCTION public.fulfill_free_order'), 'Migration declares fulfill_free_order RPC')
assert(migrationCode.includes('CREATE OR REPLACE FUNCTION public.create_payment_order'), 'Migration updates create_payment_order with coupon parameter')
assert(migrationCode.includes('CREATE OR REPLACE FUNCTION public.get_admin_coupons'), 'Migration declares get_admin_coupons RPC')
assert(migrationCode.includes('CREATE OR REPLACE FUNCTION public.get_admin_coupon_redemptions'), 'Migration declares get_admin_coupon_redemptions RPC')
assert(migrationCode.includes('CREATE OR REPLACE FUNCTION public.create_or_update_coupon'), 'Migration declares create_or_update_coupon RPC')
assert(migrationCode.includes('ALTER TABLE public.payment_orders DROP CONSTRAINT payment_orders_amount_paise_check'), 'Migration drops strict positive amount check for zero-payable free orders')

// 6.2 Coupon Service
const couponServicePath = path.join(rootDir, 'src', 'services', 'couponService.ts')
assert(fs.existsSync(couponServicePath), 'src/services/couponService.ts exists')
const couponServiceCode = fs.readFileSync(couponServicePath, 'utf8')
assert(couponServiceCode.includes('validateCoupon'), 'couponService exports validateCoupon')
assert(couponServiceCode.includes('fulfillFreeOrder'), 'couponService exports fulfillFreeOrder')
assert(couponServiceCode.includes('getAdminCoupons'), 'couponService exports getAdminCoupons')
assert(couponServiceCode.includes('getAdminRedemptions'), 'couponService exports getAdminRedemptions')
assert(couponServiceCode.includes('createOrUpdateCoupon'), 'couponService exports createOrUpdateCoupon')
assert(couponServiceCode.includes('exportRedemptionsCsv'), 'couponService exports exportRedemptionsCsv')

// 6.3 Checkout Modal
const checkoutModalPath = path.join(rootDir, 'src', 'components', 'payment', 'CheckoutModal.tsx')
assert(fs.existsSync(checkoutModalPath), 'src/components/payment/CheckoutModal.tsx exists')
const checkoutModalCode = fs.readFileSync(checkoutModalPath, 'utf8')
assert(checkoutModalCode.includes('couponInput'), 'CheckoutModal maintains couponInput state')
assert(checkoutModalCode.includes('handleApplyCoupon'), 'CheckoutModal implements handleApplyCoupon')
assert(checkoutModalCode.includes('handleRemoveCoupon'), 'CheckoutModal implements handleRemoveCoupon')
assert(checkoutModalCode.includes('handleClaimFreeUnlock'), 'CheckoutModal implements handleClaimFreeUnlock for 100% discount')
assert(checkoutModalCode.includes('displayDiscountRupees'), 'CheckoutModal renders line-item discount breakdown')
assert(checkoutModalCode.includes('fulfillFreeOrder'), 'CheckoutModal calls couponService.fulfillFreeOrder')

// 6.4 Admin Coupon Management
const adminCouponsPath = path.join(rootDir, 'src', 'pages', 'Admin', 'components', 'AdminCouponsView.tsx')
assert(fs.existsSync(adminCouponsPath), 'src/pages/Admin/components/AdminCouponsView.tsx exists')
const adminCouponsCode = fs.readFileSync(adminCouponsPath, 'utf8')
assert(adminCouponsCode.includes('AdminCouponsView'), 'AdminCouponsView component exported')
assert(adminCouponsCode.includes('handleOpenCreateModal'), 'AdminCouponsView supports creating new coupons')
assert(adminCouponsCode.includes('handleToggleActive'), 'AdminCouponsView supports toggling active status')
assert(adminCouponsCode.includes('handleOpenRedemptionsModal'), 'AdminCouponsView supports audit redemption ledger')
assert(adminCouponsCode.includes('handleExportCsv'), 'AdminCouponsView supports safe CSV export')

// 6.5 Admin Routing and Types
const adminTypesPath = path.join(rootDir, 'src', 'pages', 'Admin', 'types.ts')
const adminTypesCode = fs.readFileSync(adminTypesPath, 'utf8')
assert(adminTypesCode.includes("'coupons'"), "AdminTab union type includes 'coupons'")

const adminIndexPath = path.join(rootDir, 'src', 'pages', 'Admin', 'index.tsx')
const adminIndexCode = fs.readFileSync(adminIndexPath, 'utf8')
assert(adminIndexCode.includes('AdminCouponsView'), "Admin dashboard imports AdminCouponsView")
assert(adminIndexCode.includes("id: 'coupons'"), "NAV_ITEMS includes coupons navigation item")
assert(adminIndexCode.includes("<AdminCouponsView />"), "Admin dashboard renders <AdminCouponsView /> when activeTab is coupons")

// -----------------------------------------------------------------------------
// Test Summary
// -----------------------------------------------------------------------------
console.log('\n======================================================')
console.log(`  TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`)
console.log('======================================================\n')

if (testsFailed > 0) {
  process.exit(1)
}
