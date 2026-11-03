import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { authService } from '../../services/authService.ts'
import { profileService, type Profile } from '../../services/profileService.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { useApp } from './AppContext.ts'

export interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  isAdmin: boolean
  isLoading: boolean
  isConfigured: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setCurrentRoute } = useApp()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const isConfigured = isSupabaseConfigured()

  const fetchProfile = useCallback(async (userId: string, authUser?: User | null) => {
    try {
      if (authUser) {
        const { data: synced } = await profileService.syncProfileWithAuthUser(authUser)
        if (synced) {
          setProfile(synced)
          return
        }
      }
      const { data } = await profileService.getProfile(userId)
      if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.warn('Failed to fetch user profile:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, user)
    }
  }, [user, fetchProfile])

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    // Initial session load
    authService.getSession().then(({ session: initialSession }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id, initialSession.user)
      }
      setIsLoading(false)
    })

    // Listen to auth changes
    const subscription = authService.onAuthStateChange(async (event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user)
      } else {
        setProfile(null)
        if (event === 'SIGNED_OUT') {
          setCurrentRoute('home')
        }
      }
      setIsLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [isConfigured, fetchProfile, setCurrentRoute])

  const handleSignOut = async () => {
    await authService.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setCurrentRoute('home')
  }

  const isAdmin = Boolean(
    profile?.is_admin ||
    user?.app_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'admin' ||
    user?.email?.toLowerCase() === 'admin@gmail.com' ||
    user?.email?.toLowerCase() === 'bhanuprakashachari5092@gmail.com'
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        isConfigured,
        refreshProfile,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
