import { createContext, useContext } from 'react'

export interface AppContextType {
  currentRoute: string
  setCurrentRoute: (route: string) => void
  currentSlug?: string
  setCurrentSlug: (slug: string) => void
  isAuthOpen: boolean
  setIsAuthOpen: (open: boolean) => void
  authMode: 'signin' | 'signup'
  setAuthMode: (mode: 'signin' | 'signup') => void
  targetRouteAfterAuth: string | null
  setTargetRouteAfterAuth: (route: string | null) => void
}

export const AppContext = createContext<AppContextType | undefined>(undefined)

export function useApp(): AppContextType {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProviders')
  }
  return context
}
