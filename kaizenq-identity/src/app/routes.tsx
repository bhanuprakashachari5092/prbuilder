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
import { AdminDashboard } from '../pages/Admin/index.tsx'
import { AdminAccessDenied } from '../pages/Admin/components/AdminAccessDenied.tsx'
import { AuthPage } from '../pages/Auth/index.tsx'

export type RouteKey =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'builder'
  | 'resume'
  | 'portfolio'
  | 'publish'
  | 'portfolio-preview'
  | 'public-portfolio'
  | 'settings'
  | 'admin'

interface ProtectedRouteProps {
  children: React.ReactNode
  targetRoute?: RouteKey
  targetRouteName?: string
  requireAuth?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  targetRoute = 'dashboard',
  targetRouteName = 'Workspace',
  requireAuth = true,
}) => {
  const { user, isAdmin, isLoading } = useAuth()
  const { setCurrentRoute, setTargetRouteAfterAuth, setIsAuthOpen, setAuthMode } = useApp()

  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      setCurrentRoute('admin')
    }
  }, [isLoading, user, isAdmin, setCurrentRoute])

  if (isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] font-medium">Routing to Platform Admin Console...</p>
        </div>
      </div>
    )
  }

  // When route strictly requires authentication and session is still initializing:
  if (requireAuth && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] font-medium">Verifying authentication session...</p>
        </div>
      </div>
    )
  }

  // When route strictly requires authentication and user is unauthenticated:
  if (requireAuth && !user) {
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

interface AdminProtectedRouteProps {
  children: React.ReactNode
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user, isAdmin, isLoading } = useAuth()
  const { setIsAuthOpen, setAuthMode, setTargetRouteAfterAuth, setCurrentRoute } = useApp()

  useEffect(() => {
    if (!isLoading && !user) {
      setTargetRouteAfterAuth('admin')
      setAuthMode('signin')
      setIsAuthOpen(true)
    }
  }, [isLoading, user, setTargetRouteAfterAuth, setAuthMode, setIsAuthOpen])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#64748B] font-medium">Verifying administrator authorization...</p>
        </div>
      </div>
    )
  }

  // If already verified as administrator (owner email or owner diagnostic mode), grant entry immediately
  if (isAdmin) {
    return <>{children}</>
  }

  if (!user) {
    return (
      <AuthRequiredGate
        targetRouteName="Platform Administration Console"
        onOpenSignup={() => {
          setTargetRouteAfterAuth('admin')
          setAuthMode('signup')
          setIsAuthOpen(true)
        }}
        onOpenSignin={() => {
          setTargetRouteAfterAuth('admin')
          setAuthMode('signin')
          setIsAuthOpen(true)
        }}
        onGoHome={() => setCurrentRoute('home')}
      />
    )
  }

  return (
    <AdminAccessDenied
      onGoBack={() => setCurrentRoute('dashboard')}
      onSignInAgain={() => {
        setTargetRouteAfterAuth('admin')
        setAuthMode('signin')
        setIsAuthOpen(true)
      }}
    />
  )
}

export const AppRoutes: React.FC = () => {
  const {
    currentRoute,
    setCurrentRoute,
    currentSlug,
    setIsAuthOpen,
    setAuthMode,
  } = useApp()

  const handleOpenAuth = (mode: 'signin' | 'signup' = 'signup') => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  const handleOpenBuilder = (target: RouteKey = 'portfolio') => {
    setCurrentRoute(target)
  }

  switch (currentRoute) {
    case 'auth':
      return (
        <AuthPage
          onSuccess={() => setCurrentRoute('dashboard')}
          onBackHome={() => setCurrentRoute('home')}
        />
      )
    case 'dashboard':
      return (
        <ProtectedRoute requireAuth={true} targetRoute="dashboard" targetRouteName="Student Workspace Dashboard">
          <Dashboard onNavigate={(route) => setCurrentRoute(route as RouteKey)} />
        </ProtectedRoute>
      )
    case 'publish':
      return (
        <ProtectedRoute requireAuth={true} targetRoute="publish" targetRouteName="Publish & Domain Studio">
          <Dashboard
            initialTab="publish"
            onNavigate={(route) => setCurrentRoute(route as RouteKey)}
          />
        </ProtectedRoute>
      )
    case 'builder':
      return (
        <ProtectedRoute requireAuth={false} targetRoute="builder" targetRouteName="Portfolio Studio">
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
        <ProtectedRoute requireAuth={false} targetRoute="resume" targetRouteName="ATS Resume Builder">
          <Resume onBack={() => setCurrentRoute('dashboard')} />
        </ProtectedRoute>
      )
    case 'portfolio':
      return (
        <ProtectedRoute requireAuth={false} targetRoute="portfolio" targetRouteName="Portfolio Studio">
          <PortfolioPage
            onBack={() => setCurrentRoute('dashboard')}
            onViewPublic={() => setCurrentRoute('portfolio-preview')}
          />
        </ProtectedRoute>
      )
    case 'portfolio-preview':
      return (
        <ProtectedRoute requireAuth={false} targetRoute="portfolio-preview" targetRouteName="Portfolio Studio">
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
        <ProtectedRoute requireAuth={true} targetRoute="settings" targetRouteName="Account Settings">
          <PageContainer
            onOpenAuth={handleOpenAuth}
            onOpenBuilder={() => handleOpenBuilder('portfolio')}
          >
            <Settings onBack={() => setCurrentRoute('home')} />
          </PageContainer>
        </ProtectedRoute>
      )
    case 'admin':
      return (
        <AdminProtectedRoute>
          <AdminDashboard onExitToHome={() => setCurrentRoute('home')} />
        </AdminProtectedRoute>
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
