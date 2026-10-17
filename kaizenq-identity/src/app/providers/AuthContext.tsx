import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { authService } from '../../services/authService.ts'
import { profileService, type Profile } from '../../services/profileService.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'

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
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const isConfigured = isSupabaseConfigured()

  const fetchProfile = useCallback(async (userId: string) => {
    try {
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
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

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
        fetchProfile(initialSession.user.id)
      }
      setIsLoading(false)
    })

    // Listen to auth changes
    const subscription = authService.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        await fetchProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [isConfigured, fetchProfile])

  const handleSignOut = async () => {
    await authService.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
  }

  const isAdmin = Boolean(
    profile?.is_admin ||
    user?.app_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'admin'
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
