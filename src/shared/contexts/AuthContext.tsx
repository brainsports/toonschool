import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  email: string | null
  name?: string | null
  role: 'super_admin' | 'org_admin' | 'middle_admin' | 'center_admin' | 'teacher' | 'student' | 'free_user'
  plan_type: string
  monthly_quota: number
  center_id?: string | null
  organization_id?: string | null
  created_at?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  fetchProfile: (uid: string) => Promise<Profile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfile = useCallback(async (uid: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()

      if (error) {
        console.warn('Error fetching profile or profile does not exist yet:', error.message)
        return null
      }
      return data as Profile
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      return null
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return

        setUser(session?.user ?? null)
        if (!session?.user) {
          setProfile(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error getting auth session:', err)
        if (!mounted) return
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        setLoading(false)
      } else {
        setLoading(true)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    let cancelled = false

    fetchProfile(user.id)
      .then((prof) => {
        if (!cancelled) setProfile(prof)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [fetchProfile, user])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
