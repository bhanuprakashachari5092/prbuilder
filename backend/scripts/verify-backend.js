import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendDir = path.resolve(__dirname, '..')
const migrationsDir = path.resolve(backendDir, 'migrations')
const functionsDir = path.resolve(backendDir, 'functions')

console.log('======================================================')
console.log('  KAIZENQ IDENTITY — BACKEND INTEGRITY VERIFIER')
console.log('======================================================\n')

let errors = 0
let checks = 0

function pass(msg) {
  checks++
  console.log(`  ✓ PASS: ${msg}`)
}

function fail(msg) {
  checks++
  errors++
  console.error(`  ✗ FAIL: ${msg}`)
}

// 1. Verify Migrations
if (!fs.existsSync(migrationsDir)) {
  fail('Migrations directory does not exist')
} else {
  const migrations = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  pass(`Found ${migrations.length} versioned SQL migrations`)

  const expectedPrefixes = [
    '20261009000001_initial_schema',
    '20261009000002_row_level_security',
    '20261009000003_publication_functions',
    '20261009000004_storage_buckets',
    '20261009000005_domain_claims',
    '20261012000006_runner_winner_domain_sponsorship',
    '20261016000007_platform_subdomains',
    '20261020000008_admin_dashboard_platform_management',
    '20261023000009_configure_admin_credentials',
    '20261023000010_production_analytics_events',
    '20261024000011_admin_fixes_and_authoritative_rpcs',
    '20261026000012_youpi_upi_payments',
    '20261026000013_coupons_and_promotions',
    '20261026000014_pricing_and_customization',
    '20261026000015_custom_domain_management',
    '20261026000016_custom_pricing_calculator',
    '20261027000017_realtime_revenue_telemetry',
  ]

  for (const prefix of expectedPrefixes) {
    const found = migrations.some((m) => m.startsWith(prefix))
    if (found) {
      pass(`Verified migration: ${prefix}.sql`)
    } else {
      fail(`Missing required migration: ${prefix}.sql`)
    }
  }
}

// 2. Verify Edge Functions
if (!fs.existsSync(functionsDir)) {
  fail('Functions directory does not exist')
} else {
  const webhookIndex = path.join(functionsDir, 'youpi-webhook', 'index.ts')
  if (fs.existsSync(webhookIndex)) {
    pass('Verified Edge Function: youpi-webhook/index.ts')
  } else {
    fail('Missing Edge Function: youpi-webhook/index.ts')
  }
}

// 3. Verify Database Types
const typesFile = path.resolve(backendDir, 'types', 'database.types.ts')
if (fs.existsSync(typesFile)) {
  const content = fs.readFileSync(typesFile, 'utf8')
  if (content.includes('export interface Database') && content.includes('analytics_events') && content.includes('payment_orders')) {
    pass('Verified backend types contract: database.types.ts with production tables')
  } else {
    fail('database.types.ts missing expected interfaces')
  }
} else {
  fail('database.types.ts missing in backend/types/')
}

console.log('\n======================================================')
if (errors === 0) {
  console.log(`  ★ ALL ${checks} BACKEND INTEGRITY CHECKS PASSED SUCCESSFULLY!`)
  console.log('======================================================\n')
  process.exit(0)
} else {
  console.error(`  ✗ ${errors} OF ${checks} BACKEND CHECKS FAILED.`)
  console.log('======================================================\n')
  process.exit(1)
}

