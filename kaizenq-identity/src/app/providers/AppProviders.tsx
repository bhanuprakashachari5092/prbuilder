import React, { useState, useEffect, useCallback } from 'react'
import { AppContext } from './AppContext.ts'
import { AuthProvider } from './AuthContext.tsx'
import { getSubdomainFromHostname } from '../../lib/domainUtils.ts'

export const VALID_ROUTES = [
  'home',
  'dashboard',
  'builder',
  'resume',
  'portfolio',
  'publish',
  'portfolio-preview',
  'public-portfolio',
  'settings',
] as const

export type ValidRoute = (typeof VALID_ROUTES)[number]

export function sanitizeRoute(route: string | null | undefined): string {
  if (!route || typeof route !== 'string') return 'home'
  const trimmed = route.trim()
  if (
    trimmed.includes('://') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('\\\\') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.includes('/') ||
    trimmed.includes('\\')
  ) {
    return 'home'
  }
  return VALID_ROUTES.includes(trimmed as ValidRoute) ? trimmed : 'home'
}

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoute, setCurrentRouteState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      // 1. Check if accessed via platform subdomain (e.g. username.prbuilder.in or username.localhost)
      const hostnameSubdomain = getSubdomainFromHostname(window.location.hostname)
      if (hostnameSubdomain) {
        return 'public-portfolio'
      }

      // 2. Check path-based public portfolio route (/p/:slug)
      const pathname = window.location.pathname
      if (pathname.startsWith('/p/')) {
        return 'public-portfolio'
      }

      // 3. Check query param route (?route=...)
      const params = new URLSearchParams(window.location.search)
      return sanitizeRoute(params.get('route'))
    }
    return 'home'
  })

  const [currentSlug, setCurrentSlug] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      // 1. Subdomain slug
      const hostnameSubdomain = getSubdomainFromHostname(window.location.hostname)
      if (hostnameSubdomain) {
        return hostnameSubdomain
      }

      // 2. Path-based slug
      const pathname = window.location.pathname
      if (pathname.startsWith('/p/')) {
        return pathname.replace(/^\/p\//, '').replace(/\/$/, '')
      }

      // 3. Query param slug
      const params = new URLSearchParams(window.location.search)
      return params.get('slug') || undefined
    }
    return undefined
  })

  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [targetRouteAfterAuth, setTargetRouteAfterAuthState] = useState<string | null>(null)

  const setTargetRouteAfterAuth = useCallback((route: string | null) => {
    if (!route) {
      setTargetRouteAfterAuthState(null)
      return
    }
    const safe = sanitizeRoute(route)
    setTargetRouteAfterAuthState(safe === 'home' ? null : safe)
  }, [])

  const setCurrentRoute = useCallback((newRoute: string) => {
    const safeRoute = sanitizeRoute(newRoute)
    setCurrentRouteState(safeRoute)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (safeRoute === 'home') {
        params.delete('route')
        const newSearch = params.toString() ? `?${params.toString()}` : ''
        window.history.pushState({ route: 'home' }, '', `${window.location.pathname}${newSearch}`)
      } else if (safeRoute !== 'public-portfolio') {
        params.set('route', safeRoute)
        window.history.pushState({ route: safeRoute }, '', `${window.location.pathname}?${params.toString()}`)
      }
    }
  }, [])

  // Sync route changes with browser URL & popstate
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      const hostnameSubdomain = getSubdomainFromHostname(window.location.hostname)
      if (hostnameSubdomain) {
        setCurrentRouteState('public-portfolio')
        setCurrentSlug(hostnameSubdomain)
        return
      }

      const pathname = window.location.pathname
      if (pathname.startsWith('/p/')) {
        setCurrentRouteState('public-portfolio')
        setCurrentSlug(pathname.replace(/^\/p\//, '').replace(/\/$/, ''))
      } else {
        const params = new URLSearchParams(window.location.search)
        setCurrentRouteState(sanitizeRoute(params.get('route')))
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <AuthProvider>
      <AppContext.Provider
        value={{
          currentRoute,
          setCurrentRoute,
          currentSlug,
          setCurrentSlug,
          isAuthOpen,
          setIsAuthOpen,
          authMode,
          setAuthMode,
          targetRouteAfterAuth,
          setTargetRouteAfterAuth,
        }}
      >
        {children}
      </AppContext.Provider>
    </AuthProvider>
  )
}
