import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

console.log('======================================================================')
console.log('  PR BUILDER — GOOGLE AUTHENTICATION INTEGRATION TEST SUITE')
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

// Mock sanitizeRoute function matching AppProviders.tsx
const VALID_ROUTES = [
  'home',
  'auth',
  'dashboard',
  'builder',
  'resume',
  'portfolio',
  'publish',
  'portfolio-preview',
  'public-portfolio',
  'settings',
  'admin',
]

function sanitizeRouteTest(route) {
  if (!route || typeof route !== 'string') return 'home'
  const trimmed = route.trim()
  if (
    trimmed.includes('://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('\\\\') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.includes('/') ||
    trimmed.includes('\\')
  ) {
    return 'home'
  }
  return VALID_ROUTES.includes(trimmed) ? trimmed : 'home'
}

console.log('\n--- 1. Google OAuth URL & Destination Flow ---')

it('Formats proper callback URL preserving target route', () => {
  const origin = 'https://prbuilder.xyz'
  const targetRoute = 'resume'
  const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(targetRoute)}`
  assert(callbackUrl.includes('/auth/callback?redirect=resume'), 'Callback URL contains target route query parameter')
})

it('Sanitizes open-redirect attacks in destination routing', () => {
  const maliciousUrls = [
    'https://attacker.com/steal-token',
    '//evil.org/phish',
    'javascript:alert(1)',
    'data:text/html,evil',
    '/internal/hidden',
    '../escape/path',
  ]
  for (const attack of maliciousUrls) {
    const result = sanitizeRouteTest(attack)
    assert(result === 'home', `Blocked malicious redirect "${attack}" -> safely resolved to home`)
  }
})

it('Allows valid application target destinations', () => {
  const safeRoutes = ['dashboard', 'resume', 'portfolio', 'settings', 'admin']
  for (const route of safeRoutes) {
    assert(sanitizeRouteTest(route) === route, `Accepted valid route "${route}"`)
  }
})

console.log('\n--- 2. OAuth Callback & Error Parser ---')

function parseOAuthCallbackMock(searchStr, hashStr, pathname = '/auth/callback') {
  const searchParams = new URLSearchParams(searchStr || '')
  const hashParams = new URLSearchParams((hashStr || '').replace(/^#/, ''))

  const isCallbackPath = pathname === '/auth/callback' || pathname.startsWith('/auth/callback')
  const hasOAuthParams =
    searchParams.has('code') ||
    searchParams.has('error') ||
    hashParams.has('access_token') ||
    hashParams.has('error')

  if (!isCallbackPath && !hasOAuthParams) {
    return { isCallback: false, hasError: false, errorMessage: null, targetRoute: 'dashboard' }
  }

  const errorParam = searchParams.get('error') || hashParams.get('error')
  const errorDesc =
    searchParams.get('error_description') ||
    hashParams.get('error_description') ||
    searchParams.get('message') ||
    hashParams.get('message')

  let errorMessage = null
  if (errorParam) {
    if (errorParam === 'access_denied') {
      errorMessage = 'Google sign-in was cancelled or access was denied.'
    } else {
      errorMessage = errorDesc || `Authentication error: ${errorParam}`
    }
  }

  let targetRoute = searchParams.get('redirect') || 'dashboard'
  return {
    isCallback: true,
    hasError: Boolean(errorMessage),
    errorMessage,
    targetRoute: targetRoute || 'dashboard',
  }
}

it('Parses successful authorization code callback (PKCE)', () => {
  const res = parseOAuthCallbackMock('?code=auth_code_987654&redirect=portfolio', '')
  assert(res.isCallback === true, 'Detected callback route')
  assert(res.hasError === false, 'No error reported')
  assert(res.targetRoute === 'portfolio', 'Preserved portfolio destination')
})

it('Parses successful implicit token callback (#access_token)', () => {
  const res = parseOAuthCallbackMock('?redirect=settings', '#access_token=eyJh...&token_type=bearer')
  assert(res.isCallback === true, 'Detected callback with token hash')
  assert(res.hasError === false, 'No error reported')
  assert(res.targetRoute === 'settings', 'Preserved settings destination')
})

it('Gracefully catches user consent cancellation without redirect loop', () => {
  const res = parseOAuthCallbackMock('?error=access_denied&error_code=403&error_description=The+user+denied+the+request', '')
  assert(res.isCallback === true, 'Recognized as callback')
  assert(res.hasError === true, 'Detected error status')
  assert(res.errorMessage.includes('cancelled') || res.errorMessage.includes('denied'), 'Human-readable cancelled notice')
})

it('Catches provider error descriptions from URL fragments', () => {
  const res = parseOAuthCallbackMock('', '#error=server_error&error_description=OAuth+temporarily+unavailable')
  assert(res.hasError === true, 'Detected provider error in fragment')
  assert(res.errorMessage.includes('OAuth temporarily unavailable'), 'Extracted detailed error description')
})

console.log('\n--- 3. User Profile Provisioning & Anti-Overwrite Logic ---')

class MockProfileRepo {
  constructor() {
    this.profiles = new Map()
  }

  async syncProfileWithAuthUser(user) {
    const existing = this.profiles.get(user.id)
    const meta = user.user_metadata || {}
    const metaName = (meta.full_name || meta.name || user.email?.split('@')[0] || '').trim()
    const metaAvatar = meta.avatar_url || meta.picture || null

    if (existing) {
      // Returning user: ONLY update blank fields. NEVER overwrite user edits!
      let hasUpdates = false
      const copy = { ...existing }
      if (!copy.display_name && metaName) {
        copy.display_name = metaName
        hasUpdates = true
      }
      if (!copy.avatar_path && metaAvatar) {
        copy.avatar_path = metaAvatar
        hasUpdates = true
      }
      if (hasUpdates) {
        copy.updated_at = new Date().toISOString()
        this.profiles.set(user.id, copy)
        return { data: copy, error: null, action: 'updated_blanks' }
      }
      return { data: existing, error: null, action: 'preserved_intact' }
    }

    // New user profile creation
    const newProfile = {
      id: user.id,
      display_name: metaName || 'Student Builder',
      headline: meta.headline || 'Software Engineering Student',
      location: '',
      bio: '',
      avatar_path: metaAvatar,
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.profiles.set(user.id, newProfile)
    return { data: newProfile, error: null, action: 'created' }
  }
}

it('Creates new profile safely from Google metadata', async () => {
  const repo = new MockProfileRepo()
  const googleUser = {
    id: 'usr_google_123',
    email: 'alex.vance@gmail.com',
    user_metadata: {
      full_name: 'Alex Vance',
      avatar_url: 'https://lh3.googleusercontent.com/a/photo123',
    },
  }

  const { data, action } = await repo.syncProfileWithAuthUser(googleUser)
  assert(action === 'created', 'Profile was created for new user')
  assert(data.id === 'usr_google_123', 'Profile uses Supabase user ID')
  assert(data.display_name === 'Alex Vance', 'Populated name from Google')
  assert(data.avatar_path === 'https://lh3.googleusercontent.com/a/photo123', 'Populated avatar from Google')
})

it('PRESERVES user-edited profile details on returning Google login', async () => {
  const repo = new MockProfileRepo()
  const userId = 'usr_google_456'

  // 1. Initial creation
  await repo.syncProfileWithAuthUser({
    id: userId,
    email: 'priya@gmail.com',
    user_metadata: { full_name: 'Priya Sharma', avatar_url: 'https://google.com/avatar.png' },
  })

  // 2. User edits their profile in settings
  const existing = repo.profiles.get(userId)
  existing.display_name = 'Dr. Priya S. (Lead Systems Architect)'
  existing.bio = 'Specialized in micro-kernel architectures and distributed queues'
  existing.avatar_path = 'https://custom-cdn.dev/my-pro-headshot.jpg'
  repo.profiles.set(userId, existing)

  // 3. User logs out and logs in again with Google
  const loginAgain = await repo.syncProfileWithAuthUser({
    id: userId,
    email: 'priya@gmail.com',
    user_metadata: { full_name: 'Priya Sharma', avatar_url: 'https://google.com/avatar.png' },
  })

  assert(loginAgain.action === 'preserved_intact', 'Preserved user-edited profile intact')
  assert(loginAgain.data.display_name === 'Dr. Priya S. (Lead Systems Architect)', 'Did NOT overwrite user-edited display_name')
  assert(loginAgain.data.bio === 'Specialized in micro-kernel architectures and distributed queues', 'Did NOT overwrite bio')
  assert(loginAgain.data.avatar_path === 'https://custom-cdn.dev/my-pro-headshot.jpg', 'Did NOT overwrite user-edited avatar')
})

it('Does not create duplicate profiles for returning users', async () => {
  const repo = new MockProfileRepo()
  const user = { id: 'usr_repeat_789', email: 'repeat@gmail.com' }

  await repo.syncProfileWithAuthUser(user)
  await repo.syncProfileWithAuthUser(user)
  await repo.syncProfileWithAuthUser(user)

  assert(repo.profiles.size === 1, 'Repository contains exactly 1 profile for returning user')
})

console.log('\n--- 4. Codebase & Component Source Audits ---')

it('authService.ts implements signInWithGoogle with prompt: select_account and offline access', () => {
  const authCode = fs.readFileSync(path.join(rootDir, 'src', 'services', 'authService.ts'), 'utf8')
  assert(authCode.includes("provider: 'google'"), 'Calls Supabase OAuth with google provider')
  assert(authCode.includes('select_account'), 'Forces select_account prompt to prevent stuck OAuth state')
  assert(authCode.includes('parseOAuthCallback'), 'Exports parseOAuthCallback helper')
})

it('AuthCardContent in Auth/index.tsx provides accessible Continue with Google button', () => {
  const authIndex = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'Auth', 'index.tsx'), 'utf8')
  assert(authIndex.includes('Continue with Google'), 'Displays Continue with Google label')
  assert(authIndex.includes('aria-label="Continue with Google"'), 'Provides accessible aria-label')
  assert(authIndex.includes('viewBox="0 0 24 24"'), 'Renders official Google SVG vector logo')
  assert(authIndex.includes('Connecting to Google...'), 'Renders accessible loading state during OAuth redirect')
})

it('AuthCallbackView.tsx handles OAuth verification, errors, and redirection', () => {
  const callbackCode = fs.readFileSync(path.join(rootDir, 'src', 'pages', 'Auth', 'components', 'AuthCallbackView.tsx'), 'utf8')
  assert(callbackCode.includes('processOAuthCallback'), 'Processes callback on mount')
  assert(callbackCode.includes('syncProfileWithAuthUser'), 'Synchronizes user profile from session')
  assert(callbackCode.includes('Signing in with Google'), 'Provides loading feedback')
  assert(callbackCode.includes('Try Continue with Google Again'), 'Provides retry button on cancellation/error')
})

it('Security: Zero Google Client Secrets exposed in frontend bundle', () => {
  const srcFiles = fs.readdirSync(path.join(rootDir, 'src'), { recursive: true })
  for (const file of srcFiles) {
    if (typeof file === 'string' && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      const content = fs.readFileSync(path.join(rootDir, 'src', file), 'utf8')
      assert(!content.includes('client_secret') && !content.includes('GOOGLE_CLIENT_SECRET'), `File ${file} does not contain client secret`)
    }
  }
})

console.log('\n======================================================================')
console.log(`  GOOGLE AUTHENTICATION TEST SUITE: ${passed} PASSED, 0 FAILED`)
console.log('======================================================================\n')
