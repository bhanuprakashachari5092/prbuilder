import { spawnSync } from 'node:child_process'

console.log('Running Suite 1: Full Platform Validation...')
const r1 = spawnSync(process.execPath, ['./scripts/test-validation.js'], { stdio: 'inherit' })
if (r1.status !== 0) {
  process.exit(r1.status || 1)
}

console.log('Running Suite 2: Coupons & Promotional Code System...')
const r2 = spawnSync(process.execPath, ['./scripts/test-coupons.js'], { stdio: 'inherit' })
if (r2.status !== 0) {
  process.exit(r2.status || 1)
}

console.log('Running Suite 3: Pricing, Customization & Checkout Engine...')
const r3 = spawnSync(process.execPath, ['./scripts/test-pricing-customization.js'], { stdio: 'inherit' })
if (r3.status !== 0) {
  process.exit(r3.status || 1)
}

console.log('Running Suite 4: Secure Custom Domain Management & Tenant Isolation...')
const r4 = spawnSync(process.execPath, ['./scripts/test-custom-domain.js'], { stdio: 'inherit' })
if (r4.status !== 0) {
  process.exit(r4.status || 1)
}

console.log('Running Suite 5: Client-Side ATS Resume Vector PDF Export Engine...')
const r5 = spawnSync(process.execPath, ['./scripts/test-resume-export.js'], { stdio: 'inherit' })
if (r5.status !== 0) {
  process.exit(r5.status || 1)
}

console.log('\n★ All Platform, Coupon, Pricing, Custom Domain & Resume PDF Test Suites Passed Successfully!\n')


