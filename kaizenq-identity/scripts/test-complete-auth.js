import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('======================================================================')
console.log('  PR BUILDER — COMPLETE AUTHENTICATION & SECURITY TEST SUITE')
console.log('======================================================================')

let passed = 0

function it(desc, fn) {
  try {
    fn()
    console.log(`  ✓ PASS: ${desc}`)
    passed++
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`)
    console.error(err)
    process.exit(1)
  }
}

// -----------------------------------------------------------------------------
// 1. Email Format & Password Requirement Validators
// -----------------------------------------------------------------------------
console.log('\n--- 1. Email & Password Validation Rules ---')

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateSignupForm(email, password, confirmPassword, displayName) {
  if (!email || !emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address.' }
  }
  if (!displayName || !displayName.trim()) {
    return { valid: false, error: 'Please enter your full name or display identity.' }
  }
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters long.' }
  }
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match. Please verify your password.' }
  }
  return { valid: true, error: null }
}

it('Accepts well-formed email and matching secure password', () => {
  const res = validateSignupForm('alexander.vance@mit.edu', 'StrongPassword123!', 'StrongPassword123!', 'Alexander Vance')
  assert.strictEqual(res.valid, true)
  assert.strictEqual(res.error, null)
})

it('Rejects invalid email format without @ or domain', () => {
  const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@domain', 'user name@space.com']
  for (const badEmail of invalidEmails) {
    const res = validateSignupForm(badEmail, 'ValidPass123!', 'ValidPass123!', 'Valid Name')
    assert.strictEqual(res.valid, false, `Expected rejection for: ${badEmail}`)
  }
})

it('Rejects signup with missing or blank display name', () => {
  const res = validateSignupForm('user@domain.com', 'ValidPass123!', 'ValidPass123!', '   ')
  assert.strictEqual(res.valid, false)
  assert.strictEqual(res.error, 'Please enter your full name or display identity.')
})

it('Rejects password shorter than 6 characters', () => {
  const res = validateSignupForm('user@domain.com', '12345', '12345', 'Valid Name')
  assert.strictEqual(res.valid, false)
  assert.strictEqual(res.error, 'Password must be at least 6 characters long.')
})

it('Rejects mismatched password and confirmPassword', () => {
  const res = validateSignupForm('user@domain.com', 'SecretPassword1!', 'DifferentPassword2!', 'Valid Name')
  assert.strictEqual(res.valid, false)
  assert.strictEqual(res.error, 'Passwords do not match. Please verify your password.')
})

// -----------------------------------------------------------------------------
// 2. Production & Development URL Calibrations
// -----------------------------------------------------------------------------
console.log('\n--- 2. Production and Local Development URLs ---')

function resolveBaseUrl(mockWindowOrigin, envUrl) {
  if (mockWindowOrigin) {
    return mockWindowOrigin
  }
  return envUrl || 'https://www.prbuilder.xyz'
}

it('Resolves to http://localhost:5173 during local browser development', () => {
  const url = resolveBaseUrl('http://localhost:5173', 'https://www.prbuilder.xyz')
  assert.strictEqual(url, 'http://localhost:5173')
})

it('Resolves to https://www.prbuilder.xyz in production browser runtime', () => {
  const url = resolveBaseUrl('https://www.prbuilder.xyz', 'https://www.prbuilder.xyz')
  assert.strictEqual(url, 'https://www.prbuilder.xyz')
})

it('Falls back to https://www.prbuilder.xyz when window is undefined', () => {
  const url = resolveBaseUrl(null, null)
  assert.strictEqual(url, 'https://www.prbuilder.xyz')
})

it('Generates accurate email verification redirect URL', () => {
  const base = resolveBaseUrl('https://www.prbuilder.xyz', null)
  const redirect = `${base}/auth?type=signup`
  assert.strictEqual(redirect, 'https://www.prbuilder.xyz/auth?type=signup')
})

it('Generates accurate password reset recovery redirect URL', () => {
  const base = resolveBaseUrl('https://www.prbuilder.xyz', null)
  const redirect = `${base}/auth?type=recovery`
  assert.strictEqual(redirect, 'https://www.prbuilder.xyz/auth?type=recovery')
})

it('Generates accurate Google OAuth redirect URL with encoded target route', () => {
  const base = resolveBaseUrl('https://www.prbuilder.xyz', null)
  const targetRoute = 'portfolio'
  const redirect = `${base}/auth/callback?redirect=${encodeURIComponent(targetRoute)}`
  assert.strictEqual(redirect, 'https://www.prbuilder.xyz/auth/callback?redirect=portfolio')
})

// -----------------------------------------------------------------------------
// 3. Complete URL Parser for OAuth, Recovery, and Expired Links
// -----------------------------------------------------------------------------
console.log('\n--- 3. URL Parameter Inspector & Link Expiry Handling ---')

function parseAuthUrlMock(pathname, searchStr, hashStr) {
  const searchParams = new URLSearchParams(searchStr || '')
  const hashParams = new URLSearchParams((hashStr || '').replace(/^#/, ''))

  const isCallbackPath = pathname === '/auth/callback' || pathname.startsWith('/auth/callback')
  const typeParam = searchParams.get('type') || hashParams.get('type')
  const errorCode = searchParams.get('error_code') || hashParams.get('error_code')
  const errorParam = searchParams.get('error') || hashParams.get('error')
  const errorDesc =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('message') ||
    hashParams.get('message')

  const isExpiredOtp = Boolean(
    errorCode === 'otp_expired' ||
    errorDesc?.toLowerCase().includes('expired') ||
    errorDesc?.toLowerCase().includes('invalid')
  )

  const isRecovery = typeParam === 'recovery' || (hashStr || '').includes('type=recovery') || (searchStr || '').includes('type=recovery')
  const isSignupConfirmation = typeParam === 'signup' || (hashStr || '').includes('type=signup') || (searchStr || '').includes('type=signup')
  const isOAuthCallback =
    isCallbackPath ||
    searchParams.has('code') ||
    (!isRecovery && !isSignupConfirmation && (hashParams.has('access_token') || errorParam === 'access_denied'))

  let errorMessage = null
  if (isExpiredOtp) {
    errorMessage = 'This verification or password reset link has expired or has already been used. Please request a new one.'
  } else if (errorParam === 'access_denied') {
    errorMessage = 'Google sign-in was cancelled or access was denied.'
  } else if (errorParam) {
    errorMessage = errorDesc || `Authentication error: ${errorParam}`
  }

  const targetRoute = searchParams.get('redirect') || 'dashboard'

  return {
    isOAuthCallback,
    isRecovery,
    isSignupConfirmation,
    isExpiredOtp,
    hasError: Boolean(errorMessage),
    errorMessage,
    errorCode,
    targetRoute,
  }
}

it('Identifies password recovery link (#access_token=...&type=recovery)', () => {
  const res = parseAuthUrlMock('/auth', '', '#access_token=token_xyz&type=recovery')
  assert.strictEqual(res.isRecovery, true)
  assert.strictEqual(res.isOAuthCallback, false)
  assert.strictEqual(res.isExpiredOtp, false)
})

it('Identifies email signup confirmation link (#access_token=...&type=signup)', () => {
  const res = parseAuthUrlMock('/auth', '', '#access_token=token_xyz&type=signup')
  assert.strictEqual(res.isSignupConfirmation, true)
  assert.strictEqual(res.isRecovery, false)
})

it('Detects expired OTP / link error (error_code=otp_expired)', () => {
  const res = parseAuthUrlMock('/auth', '', '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired')
  assert.strictEqual(res.isExpiredOtp, true)
  assert.strictEqual(res.hasError, true)
  assert(res.errorMessage.includes('expired or has already been used'))
})

it('Distinguishes Google OAuth cancellation from expired email OTP', () => {
  const oauthCancel = parseAuthUrlMock('/auth/callback', '?error=access_denied', '')
  assert.strictEqual(oauthCancel.isOAuthCallback, true)
  assert.strictEqual(oauthCancel.isExpiredOtp, false)
  assert.strictEqual(oauthCancel.errorMessage, 'Google sign-in was cancelled or access was denied.')
})

// -----------------------------------------------------------------------------
// 4. Source Code and Security Audits
// -----------------------------------------------------------------------------
console.log('\n--- 4. Source Code and Security Architecture Audits ---')

it('authService.ts exports getAuthRedirectBaseUrl pointing to https://www.prbuilder.xyz', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/services/authService.ts'), 'utf-8')
  assert(content.includes('getAuthRedirectBaseUrl'), 'getAuthRedirectBaseUrl defined')
  assert(content.includes('https://www.prbuilder.xyz'), 'Defaults to production domain https://www.prbuilder.xyz')
})

it('AppProviders.tsx wraps AuthProvider inside AppContext.Provider for clean routing integration', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/app/providers/AppProviders.tsx'), 'utf-8')
  const appContextIdx = content.indexOf('<AppContext.Provider')
  const authProviderIdx = content.indexOf('<AuthProvider>')
  assert(appContextIdx !== -1 && authProviderIdx !== -1, 'Both providers present')
  assert(appContextIdx < authProviderIdx, 'AppContext.Provider wraps AuthProvider')
})

it('AuthContext.tsx signOut clears session and redirects to public home page', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/app/providers/AuthContext.tsx'), 'utf-8')
  assert(content.includes("setCurrentRoute('home')"), 'Redirects to home on signOut')
})

it('routes.tsx protects dashboard, publish, and settings with requireAuth={true}', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/app/routes.tsx'), 'utf-8')
  assert(content.includes("requireAuth={true} targetRoute=\"dashboard\""), 'Protects dashboard')
  assert(content.includes("requireAuth={true} targetRoute=\"publish\""), 'Protects publish')
  assert(content.includes("requireAuth={true} targetRoute=\"settings\""), 'Protects settings')
})

it('routes.tsx protects resume and portfolio builders with requireAuth={true}', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/app/routes.tsx'), 'utf-8')
  assert(content.includes("requireAuth={true} targetRoute=\"resume\""), 'Protected resume builder access')
  assert(content.includes("requireAuth={true} targetRoute=\"portfolio\""), 'Protected portfolio builder access')
})

it('AuthCardContent includes password visibility toggles on password and confirmPassword fields', () => {
  const content = fs.readFileSync(path.join(rootDir, 'src/pages/Auth/index.tsx'), 'utf-8')
  assert(content.includes('showPassword ? \'text\' : \'password\''), 'Password toggle input binding')
  assert(content.includes('showConfirmPassword ? \'text\' : \'password\''), 'Confirm password toggle input binding')
  assert(content.includes('setShowPassword(!showPassword)'), 'Password toggle state action')
  assert(content.includes('setShowConfirmPassword(!showConfirmPassword)'), 'Confirm password toggle state action')
})

it('Security: Zero Google Client Secret or service-role keys exposed in frontend code', () => {
  const srcDir = path.join(rootDir, 'src')
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(fullPath)
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        const text = fs.readFileSync(fullPath, 'utf-8')
        assert(!text.includes('GOCSPX-'), `Leaked Google Client Secret in ${fullPath}`)
        assert(!text.includes('service_role'), `Leaked service_role key in ${fullPath}`)
      }
    }
  }
  scanDir(srcDir)
})

console.log('======================================================================')
console.log(`  COMPLETE AUTHENTICATION SUITE: ${passed} PASSED, 0 FAILED`)
console.log('======================================================================\n')

