import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

const suites = [
  { name: 'Suite 1: Full Platform Validation', script: 'test-validation.js' },
  { name: 'Suite 2: Coupons & Promotional Code System', script: 'test-coupons.js' },
  { name: 'Suite 3: Pricing, Customization & Checkout Engine', script: 'test-pricing-customization.js' },
  { name: 'Suite 4: Secure Custom Domain Management & Tenant Isolation', script: 'test-custom-domain.js' },
  { name: 'Suite 5: Client-Side ATS Resume Vector PDF Export Engine', script: 'test-resume-export.js' },
  { name: 'Suite 6: Google Authentication Integration & Profile Sync', script: 'test-google-auth.js' },
  { name: 'Suite 7: Complete Authentication, Validation & Link Expiry Engine', script: 'test-complete-auth.js' },
  { name: 'Suite 8: Cashfree Payment Gateway Integration & Webhook Security', script: 'test-cashfree-payments.js' },
]

for (const suite of suites) {
  console.log(`\nRunning ${suite.name}...`)
  const scriptPath = path.resolve(__dirname, suite.script)
  const res = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    cwd: projectRoot,
  })
  if (res.status !== 0) {
    console.error(`Failed ${suite.name} with code ${res.status}`)
    process.exit(res.status || 1)
  }
}

console.log('\n★ All Platform, Coupon, Pricing, Custom Domain & Resume PDF Test Suites Passed Successfully!\n')
