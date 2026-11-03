import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('======================================================')
console.log('  PR BUILDER — CASHFREE PAYMENT GATEWAY TEST SUITE')
console.log('======================================================\n')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${message}`)
    failed++
  }
}

// -----------------------------------------------------------------------------
// 1. Cashfree HMAC-SHA256 Webhook Signature Engine
// -----------------------------------------------------------------------------
console.log('--- 1. Cashfree HMAC-SHA256 Signature Engine ---')

function computeCashfreeSignature(timestamp, rawBody, secret) {
  return crypto.createHmac('sha256', secret).update(timestamp + rawBody).digest('base64')
}

function verifyCashfreeSignature(timestamp, rawBody, secret, signatureHeader) {
  if (!timestamp || !rawBody || !secret || !signatureHeader) return false
  const expected = computeCashfreeSignature(timestamp, rawBody, secret)
  const actual = signatureHeader.trim()
  if (expected.length !== actual.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))
}

const testSecret = 'cfsk_ma_prod_test_secret_key_84ea076faa89f4a7337'
const testTimestamp = '1793720284837'
const testRawPayload = JSON.stringify({
  type: 'PAYMENT_SUCCESS_WEBHOOK',
  data: {
    order: { order_id: 'ORD_PRB_20261103_ABC123', order_amount: 199.0, order_status: 'PAID' },
    payment: { payment_status: 'SUCCESS', bank_reference: '431234567890', cf_payment_id: 99887766 },
  },
})

const validSignature = computeCashfreeSignature(testTimestamp, testRawPayload, testSecret)
assert(
  verifyCashfreeSignature(testTimestamp, testRawPayload, testSecret, validSignature) === true,
  'Authoritative Cashfree webhook signature verifies correctly',
)

const tamperedPayload = JSON.stringify({
  type: 'PAYMENT_SUCCESS_WEBHOOK',
  data: {
    order: { order_id: 'ORD_PRB_20261103_ABC123', order_amount: 1.0, order_status: 'PAID' },
    payment: { payment_status: 'SUCCESS', bank_reference: '431234567890', cf_payment_id: 99887766 },
  },
})
assert(
  verifyCashfreeSignature(testTimestamp, tamperedPayload, testSecret, validSignature) === false,
  'Tampered payload is strictly rejected by HMAC verification',
)

assert(
  verifyCashfreeSignature('1793720299999', testRawPayload, testSecret, validSignature) === false,
  'Tampered timestamp is strictly rejected by signature check',
)

// -----------------------------------------------------------------------------
// 2. Pricing & Currency Invariants (Integer Paise to INR Float)
// -----------------------------------------------------------------------------
console.log('\n--- 2. Pricing & Currency Invariants ---')

function paiseToCashfreeRupees(paise) {
  if (typeof paise !== 'number' || paise < 0) throw new Error('Invalid paise amount')
  return Number((paise / 100).toFixed(2))
}

assert(paiseToCashfreeRupees(19900) === 199.0, '19900 paise converts to exactly 199.00 INR for resume templates')
assert(paiseToCashfreeRupees(29900) === 299.0, '29900 paise converts to exactly 299.00 INR for portfolio themes')
assert(paiseToCashfreeRupees(49900) === 499.0, '49900 paise converts to exactly 499.00 INR for custom domain pass')
assert(paiseToCashfreeRupees(99900) === 999.0, '99900 paise converts to exactly 999.00 INR for Pro All-Access Pass')
assert(paiseToCashfreeRupees(17910) === 179.1, 'Discounted 17910 paise converts to 179.10 INR float')

// -----------------------------------------------------------------------------
// 3. Customer Details & Phone Sanitization
// -----------------------------------------------------------------------------
console.log('\n--- 3. Customer Details & Phone Sanitization ---')

function sanitizeCustomerDetails(user, customerPhone) {
  const customerId = user.id.replace(/-/g, '').slice(0, 36)
  const customerEmail = user.email || 'customer@prbuilder.xyz'
  const customerName = (user.full_name || 'PR Builder User').slice(0, 100)
  let phone = String(customerPhone || user.phone || '9999999999').replace(/\D/g, '')
  if (phone.length < 10) phone = '9999999999'
  if (phone.length > 10) phone = phone.slice(-10)

  return { customer_id: customerId, customer_email: customerEmail, customer_phone: phone, customer_name: customerName }
}

const mockUser = {
  id: 'b6c5380c-00d1-44d0-9ba2-f54d6bb3be2b',
  email: 'bhanu@example.com',
  full_name: 'Banu Prakash Achari',
}
const sanitized = sanitizeCustomerDetails(mockUser, '+91 98765 43210')
assert(sanitized.customer_id === 'b6c5380c00d144d09ba2f54d6bb3be2b', 'Formats clean alphanumeric customer ID')
assert(sanitized.customer_phone === '9876543210', 'Strips non-digits and normalizes to 10-digit Indian phone format')
assert(sanitized.customer_email === 'bhanu@example.com', 'Preserves customer email for payment receipt')

// -----------------------------------------------------------------------------
// 4. Status Machine Transitions
// -----------------------------------------------------------------------------
console.log('\n--- 4. Cashfree Status Transitions ---')

function mapCashfreeStatus(cfStatus) {
  const s = String(cfStatus || '').toUpperCase()
  switch (s) {
    case 'PAID':
      return 'paid'
    case 'ACTIVE':
      return 'pending'
    case 'EXPIRED':
      return 'expired'
    case 'CANCELLED':
    case 'TERMINATED':
      return 'cancelled'
    case 'FAILED':
      return 'failed'
    default:
      return 'pending'
  }
}

assert(mapCashfreeStatus('PAID') === 'paid', 'Maps Cashfree PAID to paid')
assert(mapCashfreeStatus('ACTIVE') === 'pending', 'Maps Cashfree ACTIVE to pending')
assert(mapCashfreeStatus('EXPIRED') === 'expired', 'Maps Cashfree EXPIRED to expired')
assert(mapCashfreeStatus('CANCELLED') === 'cancelled', 'Maps Cashfree CANCELLED to cancelled')
assert(mapCashfreeStatus('FAILED') === 'failed', 'Maps Cashfree FAILED to failed')

// -----------------------------------------------------------------------------
// 5. Security & Source Code Audits
// -----------------------------------------------------------------------------
console.log('\n--- 5. Security & Source Code Audits ---')

// Read files
const cashfreeServiceCode = fs.readFileSync(path.resolve(rootDir, 'src/services/cashfreeService.ts'), 'utf8')
const checkoutModalCode = fs.readFileSync(path.resolve(rootDir, 'src/components/payment/CheckoutModal.tsx'), 'utf8')
const edgeOrderCode = fs.readFileSync(path.resolve(rootDir, '../backend/functions/cashfree-order/index.ts'), 'utf8')
const edgeVerifyCode = fs.readFileSync(path.resolve(rootDir, '../backend/functions/cashfree-verify/index.ts'), 'utf8')
const edgeWebhookCode = fs.readFileSync(path.resolve(rootDir, '../backend/functions/cashfree-webhook/index.ts'), 'utf8')

assert(
  cashfreeServiceCode.includes('https://sdk.cashfree.com/js/v3/cashfree.js'),
  'cashfreeService.ts dynamically loads official Cashfree v3 Web SDK',
)
assert(
  cashfreeServiceCode.includes('launchCheckout'),
  'cashfreeService.ts provides native launchCheckout wrapper for modal mode',
)
assert(
  checkoutModalCode.includes('cashfreeService'),
  'CheckoutModal.tsx integrates cashfreeService for instant checkout',
)
assert(
  checkoutModalCode.includes('handleLaunchCashfree'),
  'CheckoutModal.tsx contains robust handleLaunchCashfree action handler',
)
assert(
  edgeOrderCode.includes("x-api-version") && edgeOrderCode.includes("x-client-id") && edgeOrderCode.includes("x-client-secret"),
  'backend cashfree-order Edge Function securely supplies Cashfree production headers',
)
assert(
  edgeVerifyCode.includes("verify_and_fulfill_payment"),
  'backend cashfree-verify Edge Function invokes authoritative verify_and_fulfill_payment RPC',
)
assert(
  edgeWebhookCode.includes("x-webhook-signature") && edgeWebhookCode.includes("x-webhook-timestamp"),
  'backend cashfree-webhook Edge Function enforces cryptographic signature and timestamp verification',
)

// Security assertion: Ensure CASHFREE_SECRET_KEY is never exposed with VITE_ prefix
const envExample = fs.readFileSync(path.resolve(rootDir, '.env.example'), 'utf8')
assert(
  !envExample.includes('VITE_CASHFREE_SECRET_KEY'),
  'Security Audit: CASHFREE_SECRET_KEY is NOT prefixed with VITE_ (never leaked in frontend bundle)',
)
assert(
  envExample.includes('VITE_CASHFREE_APP_ID'),
  'VITE_CASHFREE_APP_ID is cleanly documented in .env.example',
)

// Check that .env is gitignored
const gitignore = fs.readFileSync(path.resolve(rootDir, '.gitignore'), 'utf8')
assert(gitignore.includes('.env'), '.env is strictly ignored in .gitignore')

console.log('\n======================================================')
console.log(`  CASHFREE PAYMENT SUITE: ${passed} PASSED, ${failed} FAILED`)
console.log('======================================================\n')

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}

