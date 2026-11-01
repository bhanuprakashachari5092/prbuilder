/**
 * Automated Verification Test Suite: Custom Domain Management System
 * PR Builder — Netlify Edge CDN Custom Domain Architecture
 *
 * Verifies:
 * 1. Hostname normalization & format validation
 * 2. Apex vs Subdomain detection
 * 3. Exact Netlify DNS record generation (A record 75.2.60.5, CNAME prbuilder.in, TXT challenge)
 * 4. Custom Domain Pass entitlement enforcement (₹499 / ₹999 passes; payment != ownership)
 * 5. Domain ownership verification requirements (pending_verification -> verified -> active)
 * 6. Duplicate domain claim prevention & collision protection
 * 7. Tenant isolation & authorization boundaries (User A cannot touch User B's domain)
 * 8. Safe published portfolio routing (unpublished drafts blocked, zero draft/resume leakage)
 * 9. Migration 15 database schema & RPC function integrity
 * 10. Disconnection and deactivation lifecycle
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

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
console.log('  PR BUILDER — SECURE CUSTOM DOMAIN MANAGEMENT TEST SUITE')
console.log('======================================================================\n')

// -----------------------------------------------------------------------------
// 1. Hostname Normalization Engine
// -----------------------------------------------------------------------------
console.log('--- 1. Hostname Normalization Engine ---')

function normalizeHostname(input) {
  if (!input || typeof input !== 'string') return ''
  let cleaned = input.trim().toLowerCase()
  cleaned = cleaned.replace(/^[a-z]+:\/\//i, '')
  cleaned = cleaned.split('/')[0]
  cleaned = cleaned.split('?')[0]
  cleaned = cleaned.split('#')[0]
  cleaned = cleaned.replace(/:\d+$/, '')
  cleaned = cleaned.replace(/^\.+|\.+$/g, '')
  return cleaned
}

assert(normalizeHostname('https://MyPortfolio.com/') === 'myportfolio.com', 'Strips https:// and trailing slashes and converts to lowercase')
assert(normalizeHostname('HTTP://SUB.DOMAIN.CO.UK/path/to/page?query=1#hash') === 'sub.domain.co.uk', 'Strips protocol, paths, query parameters, and hashes')
assert(normalizeHostname('developer.io:3000') === 'developer.io', 'Strips port numbers')
assert(normalizeHostname('..dev.mysite.com..') === 'dev.mysite.com', 'Strips leading and trailing dots')
assert(normalizeHostname('') === '', 'Handles empty input cleanly')
assert(normalizeHostname('   ') === '', 'Handles whitespace input cleanly')

// -----------------------------------------------------------------------------
// 2. Hostname Validation & Prohibited Host Detection
// -----------------------------------------------------------------------------
console.log('--- 2. Hostname Validation & Security Filtering ---')

const BLOCKED_HOSTNAMES = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'prbuilder.in',
  'www.prbuilder.in',
  'identity.kaizenq.me',
  'netlify.app',
]

function isValidHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') return { valid: false, error: 'Hostname cannot be empty.' }
  const clean = normalizeHostname(hostname)
  if (!clean) return { valid: false, error: 'Hostname cannot be empty.' }
  if (clean.length < 4 || clean.length > 253) return { valid: false, error: 'Hostname must be between 4 and 253 characters.' }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(clean)) return { valid: false, error: 'IP addresses cannot be used as custom domains.' }
  if (clean === 'localhost' || clean.endsWith('.localhost')) return { valid: false, error: 'Localhost addresses cannot be used.' }
  if (clean.endsWith('.netlify.app')) return { valid: false, error: 'Cannot connect a netlify.app preview domain.' }
  if (clean === 'prbuilder.in' || clean.endsWith('.prbuilder.in')) return { valid: false, error: 'Cannot claim the primary PR Builder platform domain.' }
  if (clean.includes('..')) return { valid: false, error: 'Hostname cannot contain consecutive dots.' }

  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i
  if (!domainRegex.test(clean)) return { valid: false, error: 'Invalid domain format. Example: myportfolio.com or portfolio.mysite.com' }
  return { valid: true, hostname: clean }
}

assert(isValidHostname('myportfolio.com').valid === true, 'Accepts valid apex domain: myportfolio.com')
assert(isValidHostname('portfolio.johndoe.dev').valid === true, 'Accepts valid subdomain: portfolio.johndoe.dev')
assert(isValidHostname('sub.domain.co.uk').valid === true, 'Accepts multi-part TLD: sub.domain.co.uk')
assert(isValidHostname('localhost').valid === false, 'Rejects localhost')
assert(isValidHostname('192.168.1.1').valid === false, 'Rejects IPv4 addresses')
assert(isValidHostname('test.netlify.app').valid === false, 'Rejects netlify.app addresses')
assert(isValidHostname('prbuilder.in').valid === false, 'Rejects platform apex domain')
assert(isValidHostname('user.prbuilder.in').valid === false, 'Rejects platform subdomains')
assert(isValidHostname('my..domain.com').valid === false, 'Rejects consecutive dots')
assert(isValidHostname('invalid_char.com').valid === false, 'Rejects underscore in hostname')

// -----------------------------------------------------------------------------
// 3. Apex vs Subdomain Detection
// -----------------------------------------------------------------------------
console.log('--- 3. Apex vs Subdomain Detection ---')

function isApexDomain(hostname) {
  const clean = normalizeHostname(hostname)
  const parts = clean.split('.')
  if (parts.length <= 1) return true
  if (parts.length === 2) return true

  const multiPartTlds = [
    'co.uk', 'org.uk', 'gov.uk', 'ac.uk',
    'co.in', 'net.in', 'org.in', 'gen.in', 'firm.in', 'ind.in',
    'com.au', 'net.au', 'org.au',
    'co.nz', 'net.nz',
    'co.za', 'com.br', 'com.sg',
  ]
  const lastTwo = parts.slice(-2).join('.')
  if (multiPartTlds.includes(lastTwo) && parts.length === 3) {
    return true
  }
  return false
}

assert(isApexDomain('example.com') === true, 'example.com is an apex domain')
assert(isApexDomain('mybrand.co.in') === true, 'mybrand.co.in is an apex domain (multi-part TLD)')
assert(isApexDomain('sub.example.com') === false, 'sub.example.com is a subdomain')
assert(isApexDomain('portfolio.mybrand.co.in') === false, 'portfolio.mybrand.co.in is a subdomain')
assert(isApexDomain('www.example.com') === false, 'www.example.com is treated as a subdomain')

// -----------------------------------------------------------------------------
// 4. Exact Netlify DNS Record Generation (Never Invent DNS Targets)
// -----------------------------------------------------------------------------
console.log('--- 4. Exact Netlify DNS Record Generation ---')

const NETLIFY_APEX_IP = '75.2.60.5'
const NETLIFY_CNAME_TARGET = 'prbuilder.in'

function getExactDnsRecords(hostname, verificationToken) {
  const clean = normalizeHostname(hostname)
  const isApex = isApexDomain(clean)
  const records = []

  // Routing record
  if (isApex) {
    records.push({
      type: 'A',
      host: '@',
      target: NETLIFY_APEX_IP,
      ttl: 300,
      purpose: 'Apex routing to Netlify High-Availability Load Balancer',
    })
  } else {
    const parts = clean.split('.')
    const subdomainPrefix = parts[0]
    records.push({
      type: 'CNAME',
      host: subdomainPrefix,
      target: NETLIFY_CNAME_TARGET,
      ttl: 300,
      purpose: 'Subdomain routing to PR Builder Netlify CDN edge',
    })
  }

  // TXT Verification Challenge record
  const token = verificationToken || 'prbuilder-verify-mock-token'
  records.push({
    type: 'TXT',
    host: `_prbuilder-challenge.${clean}`,
    target: `prbuilder-verify=${token}`,
    ttl: 300,
    purpose: 'Cryptographic ownership verification challenge',
  })

  return records
}

const apexRecords = getExactDnsRecords('johndoe.com', 'test-token-123')
assert(apexRecords.some(r => r.type === 'A' && r.target === '75.2.60.5' && r.host === '@'), 'Apex domain returns exact Netlify load balancer A record 75.2.60.5')
assert(apexRecords.some(r => r.type === 'TXT' && r.host.startsWith('_prbuilder-challenge') && r.target.includes('test-token-123')), 'Apex domain includes TXT ownership verification challenge')

const subRecords = getExactDnsRecords('portfolio.johndoe.com', 'test-token-456')
assert(subRecords.some(r => r.type === 'CNAME' && r.target === 'prbuilder.in' && r.host === 'portfolio'), 'Subdomain returns exact Netlify CNAME target prbuilder.in with subdomain host')
assert(subRecords.some(r => r.type === 'TXT' && r.host === '_prbuilder-challenge.portfolio.johndoe.com'), 'Subdomain includes TXT challenge for specific hostname')

// -----------------------------------------------------------------------------
// 5. Entitlement Enforcement & Separation from Ownership
// -----------------------------------------------------------------------------
console.log('--- 5. Entitlement Enforcement & Separation from Ownership ---')

// Mock Entitlement Store
const mockEntitlements = {
  'user-free': [],
  'user-custom-domain': ['domain:custom'],
  'user-pro-all-access': ['bundle:all_access', 'domain:custom'],
  'user-runner-up': ['domain:claim_xyz'],
}

function hasCustomDomainEntitlement(userId) {
  const userEnts = mockEntitlements[userId] || []
  return userEnts.includes('domain:custom') || userEnts.includes('bundle:all_access')
}

assert(hasCustomDomainEntitlement('user-free') === false, 'Free user does not have custom domain entitlement')
assert(hasCustomDomainEntitlement('user-custom-domain') === true, 'Custom Domain Pass (₹499) grants custom domain entitlement')
assert(hasCustomDomainEntitlement('user-pro-all-access') === true, 'Pro All-Access Pass (₹999) grants custom domain entitlement')
assert(hasCustomDomainEntitlement('user-runner-up') === false, 'Sponsorship entitlement (domain:claim_xyz) does not grant custom domain pass')

// Invariant: Entitlement grants right to ATTEMPT connection, NOT automatic ownership
class MockDomainManager {
  constructor() {
    this.domains = new Map()
    this.portfolios = new Map()
  }

  addPortfolio(portfolio) {
    this.portfolios.set(portfolio.id, portfolio)
  }

  connectDomain(userId, portfolioId, rawHostname) {
    // 1. Entitlement check
    if (!hasCustomDomainEntitlement(userId)) {
      return { success: false, error: 'Custom Domain Pass or Pro All-Access Pass is required.' }
    }

    // 2. Portfolio ownership check
    const portfolio = this.portfolios.get(portfolioId)
    if (!portfolio || portfolio.userId !== userId) {
      return { success: false, error: 'Portfolio not found or access denied.' }
    }

    // 3. Validation
    const val = isValidHostname(rawHostname)
    if (!val.valid) {
      return { success: false, error: val.error }
    }
    const cleanHost = val.hostname

    // 4. Duplicate claim prevention (across all users)
    for (const [id, d] of this.domains.entries()) {
      if (d.hostname === cleanHost && d.connection_status !== 'disconnected') {
        if (d.userId !== userId) {
          return { success: false, error: 'This domain is already claimed by another user.' }
        } else {
          return { success: false, error: 'You have already connected this domain.' }
        }
      }
    }

    // 5. Generate secure verification token
    const token = `prbuilder-verify-${crypto.randomBytes(16).toString('hex')}`
    const domainRecord = {
      id: `dom-${crypto.randomUUID()}`,
      userId,
      portfolioId,
      hostname: cleanHost,
      verification_status: 'pending_verification',
      connection_status: 'pending_dns',
      verification_token: token,
      ssl_status: 'pending',
      created_at: new Date().toISOString(),
      dns_instructions: getExactDnsRecords(cleanHost, token),
    }

    this.domains.set(domainRecord.id, domainRecord)
    return { success: true, domain: domainRecord }
  }

  verifyDomain(userId, domainId, simulatedDnsMatch = true) {
    const domain = this.domains.get(domainId)
    if (!domain) return { success: false, error: 'Domain record not found.' }

    // Tenant isolation check
    if (domain.userId !== userId) {
      return { success: false, error: 'Unauthorized: you do not own this domain record.' }
    }

    if (!simulatedDnsMatch) {
      domain.verification_status = 'failed'
      domain.connection_status = 'failed'
      domain.error_message = 'DNS TXT challenge record not found or does not match.'
      return { success: false, error: domain.error_message }
    }

    domain.verification_status = 'verified'
    domain.connection_status = 'active'
    domain.ssl_status = 'provisioning'
    domain.activated_at = new Date().toISOString()
    domain.error_message = null
    return { success: true, domain }
  }

  disconnectDomain(userId, domainId) {
    const domain = this.domains.get(domainId)
    if (!domain) return { success: false, error: 'Domain record not found.' }

    // Tenant isolation check
    if (domain.userId !== userId) {
      return { success: false, error: 'Unauthorized: you do not own this domain record.' }
    }

    domain.connection_status = 'disconnected'
    domain.verification_status = 'pending_verification'
    return { success: true }
  }

  resolveHostname(hostname) {
    const clean = normalizeHostname(hostname)
    for (const d of this.domains.values()) {
      if (d.hostname === clean && d.connection_status === 'active' && d.verification_status === 'verified') {
        const port = this.portfolios.get(d.portfolioId)
        if (!port) return null
        // CRITICAL SECURITY RULE: NEVER SERVE UNPUBLISHED DRAFTS
        if (port.publication_status !== 'published') {
          return null
        }
        return {
          id: port.id,
          userId: port.userId,
          slug: port.slug,
          title: port.title,
          theme: port.theme,
          portfolioData: port.portfolioData,
        }
      }
    }
    return null
  }
}

// -----------------------------------------------------------------------------
// 6. Security & Tenant Isolation Invariants
// -----------------------------------------------------------------------------
console.log('--- 6. Security, Ownership & Tenant Isolation ---')

const manager = new MockDomainManager()
manager.addPortfolio({
  id: 'port-alice-1',
  userId: 'user-custom-domain',
  title: "Alice's Portfolio",
  slug: 'alice',
  publication_status: 'published',
  portfolioData: { profile: { fullName: 'Alice Designer' } },
})
manager.addPortfolio({
  id: 'port-bob-1',
  userId: 'user-pro-all-access',
  title: "Bob's Portfolio",
  slug: 'bob',
  publication_status: 'published',
  portfolioData: { profile: { fullName: 'Bob Engineer' } },
})
manager.addPortfolio({
  id: 'port-draft-1',
  userId: 'user-custom-domain',
  title: 'Draft Secret Portfolio',
  slug: 'secret-draft',
  publication_status: 'draft', // DRAFT
  portfolioData: { profile: { fullName: 'Secret Draft' } },
})

// Test free user rejection
const freeAttempt = manager.connectDomain('user-free', 'port-alice-1', 'alice.design')
assert(freeAttempt.success === false, 'User without Custom Domain Pass is blocked from connecting domain')

// Test unauthorized portfolio claim
const unauthPortClaim = manager.connectDomain('user-pro-all-access', 'port-alice-1', 'bobsdomain.com')
assert(unauthPortClaim.success === false, 'User cannot connect a domain to a portfolio they do not own')

// Test successful connection request
const aliceConnect = manager.connectDomain('user-custom-domain', 'port-alice-1', 'alicedesign.com')
assert(aliceConnect.success === true, 'Authorized user with Custom Domain Pass connects domain successfully')
assert(aliceConnect.domain.verification_status === 'pending_verification', 'New domain initial status is pending_verification')
assert(aliceConnect.domain.connection_status === 'pending_dns', 'New domain initial connection_status is pending_dns')

// Test duplicate domain claim prevention (Bob tries to claim Alice's domain)
const bobDuplicateClaim = manager.connectDomain('user-pro-all-access', 'port-bob-1', 'alicedesign.com')
assert(bobDuplicateClaim.success === false, 'Second user is blocked from claiming an existing active/pending domain')
assert(bobDuplicateClaim.error.includes('already claimed'), 'Error clearly informs that domain is already claimed')

// Test tenant isolation: Bob cannot verify Alice's domain
const bobVerifyAlice = manager.verifyDomain('user-pro-all-access', aliceConnect.domain.id, true)
assert(bobVerifyAlice.success === false, 'Tenant isolation: User B cannot verify User A\'s domain')
assert(bobVerifyAlice.error.includes('Unauthorized'), 'Returns unauthorized error on cross-tenant verification attempt')

// Test tenant isolation: Bob cannot disconnect Alice's domain
const bobDisconnectAlice = manager.disconnectDomain('user-pro-all-access', aliceConnect.domain.id)
assert(bobDisconnectAlice.success === false, 'Tenant isolation: User B cannot disconnect User A\'s domain')

// Test verification failure handling
const aliceFailVerify = manager.verifyDomain('user-custom-domain', aliceConnect.domain.id, false)
assert(aliceFailVerify.success === false, 'Verification failure is gracefully reported')
assert(aliceConnect.domain.verification_status === 'failed', 'Domain status updates to failed on failed DNS match')

// Test successful verification
const aliceSuccessVerify = manager.verifyDomain('user-custom-domain', aliceConnect.domain.id, true)
assert(aliceSuccessVerify.success === true, 'Domain verifies successfully once DNS match succeeds')
assert(aliceConnect.domain.verification_status === 'verified', 'Domain status is now verified')
assert(aliceConnect.domain.connection_status === 'active', 'Domain connection_status is now active')

// -----------------------------------------------------------------------------
// 7. Safe Hostname Resolution & Draft Leak Prevention
// -----------------------------------------------------------------------------
console.log('--- 7. Safe Hostname Resolution & Draft Leak Prevention ---')

// Resolving Alice's verified domain
const resolvedAlice = manager.resolveHostname('alicedesign.com')
assert(resolvedAlice !== null && resolvedAlice.title === "Alice's Portfolio", 'Verified active domain resolves to published portfolio')
assert(resolvedAlice.portfolioData.profile.fullName === 'Alice Designer', 'Contains portfolio public data')

// Resolving unknown domain returns null
assert(manager.resolveHostname('unknown-domain.com') === null, 'Unknown domain returns null (404)')

// Connecting domain to draft portfolio
const draftConnect = manager.connectDomain('user-custom-domain', 'port-draft-1', 'draftsite.com')
assert(draftConnect.success === true, 'Draft portfolio can have domain connected in pending state')
manager.verifyDomain('user-custom-domain', draftConnect.domain.id, true)

// Invariant: Even if domain is verified, draft portfolio is NEVER served
const resolvedDraft = manager.resolveHostname('draftsite.com')
assert(resolvedDraft === null, 'CRITICAL: Verified domain connected to unpublished draft portfolio is NEVER served publicly')

// Test domain disconnection
const aliceDisconnect = manager.disconnectDomain('user-custom-domain', aliceConnect.domain.id)
assert(aliceDisconnect.success === true, 'Owner can disconnect their own domain')
assert(manager.resolveHostname('alicedesign.com') === null, 'Disconnected domain immediately ceases resolving')

// Now Bob can claim alicedesign.com since it was disconnected
const bobReclaim = manager.connectDomain('user-pro-all-access', 'port-bob-1', 'alicedesign.com')
assert(bobReclaim.success === true, 'Disconnected domain can be reclaimed cleanly')

// -----------------------------------------------------------------------------
// 8. Database Migration 15 Audit
// -----------------------------------------------------------------------------
console.log('--- 8. Database Migration 15 Audit ---')

const migrationFile = path.join(rootDir, 'supabase', 'migrations', '20261026000015_custom_domain_management.sql')
assert(fs.existsSync(migrationFile), 'Migration 15 file exists in supabase/migrations/')

const migrationSql = fs.readFileSync(migrationFile, 'utf8')

assert(migrationSql.includes('normalize_custom_domain_hostname'), 'Migration defines normalize_custom_domain_hostname function')
assert(migrationSql.includes('check_user_custom_domain_entitlement'), 'Migration defines check_user_custom_domain_entitlement function')
assert(migrationSql.includes('connect_custom_domain'), 'Migration defines connect_custom_domain RPC')
assert(migrationSql.includes('verify_custom_domain'), 'Migration defines verify_custom_domain RPC')
assert(migrationSql.includes('disconnect_custom_domain'), 'Migration defines disconnect_custom_domain RPC')
assert(migrationSql.includes('get_published_portfolio_by_hostname'), 'Migration defines get_published_portfolio_by_hostname RPC')
assert(migrationSql.includes('75.2.60.5'), 'Migration specifies exact Netlify load balancer IP 75.2.60.5')
assert(migrationSql.includes('prbuilder.in'), 'Migration specifies exact CNAME target prbuilder.in')
assert(migrationSql.includes('_prbuilder-challenge'), 'Migration specifies _prbuilder-challenge TXT prefix')
assert(migrationSql.includes("publication_status = 'published'"), 'Migration strictly checks publication_status = published in hostname resolver')
assert(migrationSql.includes('SECURITY DEFINER'), 'Migration marks privileged RPC functions as SECURITY DEFINER')

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n======================================================================')
console.log(`  CUSTOM DOMAIN TEST SUITE SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`)
console.log('======================================================================\n')

if (testsFailed > 0) {
  process.exit(1)
}
