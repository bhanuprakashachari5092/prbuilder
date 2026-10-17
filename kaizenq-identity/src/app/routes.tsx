import React, { useEffect } from 'react'
import { Home } from '../pages/Home.tsx'
import { Dashboard } from '../pages/Dashboard/index.tsx'
import { Builder } from '../pages/Builder/index.tsx'
import { Resume } from '../pages/Resume/index.tsx'
import { PortfolioPage } from '../pages/Portfolio/index.tsx'
import { LocalPortfolioPreviewPage } from '../pages/Portfolio/components/preview/LocalPortfolioPreviewPage.tsx'
import { Settings } from '../pages/Settings/index.tsx'
import { useApp } from './providers/AppContext.ts'
import { useAuth } from './providers/AuthContext.tsx'
import { PageContainer } from '../components/layout/PageContainer.tsx'
import { PublicPortfolioPage } from '../pages/Portfolio/components/public/PublicPortfolioPage.tsx'
import { AuthRequiredGate } from '../components/auth/AuthRequiredGate.tsx'

export type RouteKey =
  | 'home'
  | 'dashboard'
  | 'builder'
  | 'resume'
  | 'portfolio'
  | 'publish'
  | 'portfolio-preview'
  | 'public-portfolio'
  | 'settings'

interface ProtectedRouteProps {
  children: React.ReactNode
  targetRoute: RouteKey
  targetRouteName: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  targetRoute,
  targetRouteName,
}) => {
  const { user, isLoading } = useAuth()
  const { setIsAuthOpen, setAuthMode, setTargetRouteAfterAuth, setCurrentRoute } = useApp()

  useEffect(() => {
    if (!isLoading && !user) {
      setTargetRouteAfterAuth(targetRoute)
      setAuthMode('signup')
      setIsAuthOpen(true)
    }
  }, [isLoading, user, targetRoute, setTargetRouteAfterAuth, setAuthMode, setIsAuthOpen])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] font-medium">Verifying authentication session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthRequiredGate
        targetRouteName={targetRouteName}
        onOpenSignup={() => {
          setTargetRouteAfterAuth(targetRoute)
          setAuthMode('signup')
          setIsAuthOpen(true)
        }}
        onOpenSignin={() => {
          setTargetRouteAfterAuth(targetRoute)
          setAuthMode('signin')
          setIsAuthOpen(true)
        }}
        onGoHome={() => setCurrentRoute('home')}
      />
    )
  }

  return <>{children}</>
}

export const AppRoutes: React.FC = () => {
  const {
    currentRoute,
    setCurrentRoute,
    currentSlug,
    setIsAuthOpen,
    setAuthMode,
    setTargetRouteAfterAuth,
  } = useApp()
  const { user } = useAuth()

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signup') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  const handleOpenBuilder = (target: RouteKey = 'portfolio') => {
    if (user) {
      setCurrentRoute(target)
    } else {
      setTargetRouteAfterAuth(target)
      setAuthMode('signup')
      setIsAuthOpen(true)
    }
  }

  switch (currentRoute) {
    case 'dashboard':
      return (
        <ProtectedRoute targetRoute="dashboard" targetRouteName="Student Workspace Dashboard">
          <Dashboard onNavigate={(route) => setCurrentRoute(route as RouteKey)} />
        </ProtectedRoute>
      )
    case 'publish':
      return (
        <ProtectedRoute targetRoute="publish" targetRouteName="Publish & Domain Studio">
          <Dashboard
            initialTab="publish"
            onNavigate={(route) => setCurrentRoute(route as RouteKey)}
          />
        </ProtectedRoute>
      )
    case 'builder':
      return (
        <ProtectedRoute targetRoute="builder" targetRouteName="Portfolio Studio">
          <PageContainer
            onOpenAuth={handleOpenAuth}
            onOpenBuilder={() => handleOpenBuilder('portfolio')}
          >
            <Builder onBack={() => setCurrentRoute('home')} />
          </PageContainer>
        </ProtectedRoute>
      )
    case 'resume':
      return (
        <ProtectedRoute targetRoute="resume" targetRouteName="ATS Resume Builder">
          <Resume onBack={() => setCurrentRoute('dashboard')} />
        </ProtectedRoute>
      )
    case 'portfolio':
      return (
        <ProtectedRoute targetRoute="portfolio" targetRouteName="Portfolio Studio">
          <PortfolioPage
            onBack={() => setCurrentRoute('dashboard')}
            onViewPublic={() => setCurrentRoute('portfolio-preview')}
          />
        </ProtectedRoute>
      )
    case 'portfolio-preview':
      return (
        <ProtectedRoute targetRoute="portfolio-preview" targetRouteName="Portfolio Studio">
          <LocalPortfolioPreviewPage
            onBackToEditor={() => setCurrentRoute('portfolio')}
            onBackToDashboard={() => setCurrentRoute('dashboard')}
          />
        </ProtectedRoute>
      )
    case 'public-portfolio':
      return (
        <PublicPortfolioPage
          slug={currentSlug}
          onBackToBuilder={() => handleOpenBuilder('portfolio')}
          onBackToDashboard={() => handleOpenBuilder('dashboard')}
          onNavigateHome={() => setCurrentRoute('home')}
        />
      )
    case 'settings':
      return (
        <ProtectedRoute targetRoute="settings" targetRouteName="Account Settings">
          <PageContainer
            onOpenAuth={handleOpenAuth}
            onOpenBuilder={() => handleOpenBuilder('portfolio')}
          >
            <Settings onBack={() => setCurrentRoute('home')} />
          </PageContainer>
        </ProtectedRoute>
      )
    case 'home':
    default:
      return (
        <Home
          onOpenAuth={handleOpenAuth}
          onOpenBuilder={() => handleOpenBuilder('portfolio')}
        />
      )
  }
}
