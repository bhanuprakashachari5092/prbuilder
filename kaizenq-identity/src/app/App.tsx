import React, { useState, useEffect } from 'react'
import { AppProviders } from './providers/AppProviders.tsx'
import { useApp } from './providers/AppContext.ts'
import { useAuth } from './providers/AuthContext.tsx'
import { AppRoutes } from './routes.tsx'
import { AuthModal } from '../pages/Auth/index.tsx'
import { OnboardingModal } from '../components/onboarding/OnboardingModal.tsx'

import { LogoIntro } from '../components/brand/LogoIntro.tsx'

const MainAppContent: React.FC = () => {
  const {
    currentRoute,
    isAuthOpen,
    setIsAuthOpen,
    authMode,
    setCurrentRoute,
    targetRouteAfterAuth,
    setTargetRouteAfterAuth,
  } = useApp()
  const { user, isAdmin } = useAuth()

  // Dedicated admin routing guard: Admin credentials are strictly for the Admin Console
  useEffect(() => {
    if (
      isAdmin &&
      (currentRoute === 'dashboard' ||
        currentRoute === 'publish' ||
        currentRoute === 'builder' ||
        currentRoute === 'resume' ||
        currentRoute === 'portfolio' ||
        currentRoute === 'portfolio-preview')
    ) {
      setCurrentRoute('admin')
    }
  }, [isAdmin, currentRoute, setCurrentRoute])

  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.has('intro') || params.has('loading')) return true
    }
    return !sessionStorage.getItem('pr_builder_intro_seen')
  })

  const handleIntroComplete = () => {
    sessionStorage.setItem('pr_builder_intro_seen', 'true')
    setShowIntro(false)
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827]">
      {/* Cinematic Brand Intro on initial load */}
      {showIntro && <LogoIntro onComplete={handleIntroComplete} />}

      <AppRoutes />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          if (isAdmin || user?.email?.toLowerCase() === 'admin@gmail.com') {
            setCurrentRoute('admin')
            setTargetRouteAfterAuth(null)
          } else if (targetRouteAfterAuth) {
            setCurrentRoute(targetRouteAfterAuth)
            setTargetRouteAfterAuth(null)
          } else {
            setCurrentRoute('dashboard')
          }
        }}
      />

      {/* Post-Signup Onboarding Wizard */}
      <OnboardingModal />
    </div>
  )
}

export function App() {
  return (
    <AppProviders>
      <MainAppContent />
    </AppProviders>
  )
}

export default App
