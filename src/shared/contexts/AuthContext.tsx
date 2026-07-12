import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  email: string | null
  name?: string | null
  role: 'super_admin' | 'org_admin' | 'middle_admin' | 'center_admin' | 'teacher' | 'student' | 'free_user'
  status?: string
  plan_type: string
  monthly_quota: number
  monthly_used?: number
  center_id?: string | null
  organization_id?: string | null
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  fetchProfile: (uid: string) => Promise<Profile | null>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 이벤트성 status 재확인 최소 간격 (focus/visibility 중복 억제)
const STATUS_CHECK_THROTTLE_MS = 30_000
// 장시간 열린 세션을 위한 주기적 재확인 간격
const STATUS_CHECK_INTERVAL_MS = 5 * 60_000

const PROFILE_SELECT = 'id, email, name, role, status, plan_type, monthly_quota, monthly_used, center_id, organization_id, created_at, updated_at'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // 동시성/중복/안전 제어용 ref
  const mountedRef = useRef(true)
  const refreshingRef = useRef(false)   // refreshProfile 중복 실행 방지
  const suspendingRef = useRef(false)   // 정지 처리 중복(무한 signOut) 방지
  const lastCheckRef = useRef(0)        // 마지막 status 확인 시각(throttle)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // 기존 로그인 페이지에서 사용하는 1회성 profile 조회 (동작 유지)
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

  // 정지/대기 계정 처리: 중복 방지 → signOut → 상태 초기화 → 로그인 페이지(사유)
  // AuthProvider 가 Router 바깥이므로 useNavigate 대신 window.location 사용
  const handleBlocked = useCallback(async (reason: 'suspended' | 'pending') => {
    if (suspendingRef.current) return
    suspendingRef.current = true
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('signOut during block failed:', err)
    }
    if (mountedRef.current) {
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
    if (typeof window !== 'undefined') {
      window.location.replace(`/login?reason=${reason}`)
    }
  }, [])

  // 현재 로그인 사용자 profile 재조회 + status 확인
  // - 진행 중 요청은 ref 로 중복 실행 차단
  // - 네트워크/RLS 오류는 즉시 로그아웃하지 않고 경고만 기록(일시 오류와 정지 구분)
  // - suspended 발견 시 handleBlocked
  const refreshProfile = useCallback(async (): Promise<void> => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return

      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', u.id)
        .maybeSingle()

      if (error) {
        // 일시적 네트워크 오류/RLS 거부일 수 있으므로 세션을 강제 종료하지 않음
        console.warn('[Auth] profile refresh error, keeping session:', error.message)
        return
      }
      if (!data) {
        // profile 이 없는 드문 경우: 강제 로그아웃 대신 상태만 비움(가드/페이지가 처리)
        if (mountedRef.current) setProfile(null)
        return
      }
      if (mountedRef.current) setProfile(data as Profile)
      lastCheckRef.current = Date.now()

      if (data.status === 'suspended') {
        await handleBlocked('suspended')
      }
      // pending 은 로그인 정책상 허용되므로 자동 로그아웃하지 않음.
      // 관리자 페이지는 공통 가드가 status !== 'active' 로 차단.
    } catch (err) {
      console.warn('[Auth] refreshProfile exception:', err)
    } finally {
      refreshingRef.current = false
    }
  }, [handleBlocked])

  // 초기 세션 로드 + 인증 상태 변경 구독
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null
      setUser(nextUser)

      if (!nextUser) {
        setProfile(null)
        setLoading(false)
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // 최초 로드/로그인에만 로딩 표시 (TOKEN_REFRESHED 등은 화면 깜빡임 방지)
        setLoading(true)
      }

      // 토큰 갱신 시 status 재확인 (user-effect 와의 중복은 refreshingRef 로 방지)
      if (event === 'TOKEN_REFRESHED' && nextUser) {
        refreshProfile()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshProfile])

  // user 변경(최초 로드/로그인/갱신) 시 profile 로드 + status 확인
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    let cancelled = false

    refreshProfile().finally(() => {
      if (!cancelled && mountedRef.current) setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [user, refreshProfile])

  // 탭 활성화/포커스/주기적 status 재확인 (visible 일 때만, throttle 적용)
  useEffect(() => {
    const maybeCheck = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (Date.now() - lastCheckRef.current < STATUS_CHECK_THROTTLE_MS) return
      refreshProfile()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') maybeCheck()
    }
    const onFocus = () => maybeCheck()

    window.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onFocus)
    const intervalId = window.setInterval(maybeCheck, STATUS_CHECK_INTERVAL_MS)

    return () => {
      window.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onFocus)
      window.clearInterval(intervalId)
    }
  }, [refreshProfile])

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticated: !!user, signOut, fetchProfile, refreshProfile }}>
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
