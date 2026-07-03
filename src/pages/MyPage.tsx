import { useEffect, useState } from 'react'
import { useAuth } from '../shared/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Award, Shield, FileClock } from 'lucide-react'
import { supabase } from '../shared/lib/supabase'

export default function MyPage() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  const [debugRawProfile, setDebugRawProfile] = useState<any>(null);
  const [debugError, setDebugError] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data, error }) => {
          setDebugRawProfile(data);
          setDebugError(error);
        });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'org_admin') {
        navigate('/admin/org/dashboard', { replace: true })
      } else if (profile.role === 'middle_admin') {
        navigate('/manager', { replace: true })
      } else if (profile.role === 'student') {
        navigate('/student/mypage', { replace: true })
      }
    }
  }, [loading, profile, navigate])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-500">불러오는 중입니다...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-100">로그인이 필요합니다</h2>
        <p className="text-slate-500 text-sm">마이페이지는 로그인한 사용자만 접근 가능합니다.</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-all"
        >
          로그인 페이지로 가기
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4 border-b border-slate-850 pb-5">
        <div className="h-12 w-12 rounded-xl bg-purple-950/40 border border-purple-800 flex items-center justify-center text-purple-400">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">마이페이지 (My Page)</h1>
          <p className="text-xs text-slate-500 mt-1">내 가입 상세 내역과 이용 가능한 만화 생성 쿼타를 확인합니다.</p>
        </div>
      </div>

      {/* DEBUG BOX */}
      <div className="p-4 rounded-xl border-2 border-red-500 bg-red-950/30 space-y-2 text-xs font-mono text-red-200 break-all">
        <h3 className="font-bold text-red-400 text-sm mb-2">[DEBUG] Production Runtime Values</h3>
        <p><span className="font-bold">VITE_SUPABASE_URL:</span> {import.meta.env.VITE_SUPABASE_URL}</p>
        <p><span className="font-bold">auth.user.id:</span> {user.id}</p>
        <p><span className="font-bold">auth.user.email:</span> {user.email}</p>
        <p><span className="font-bold">AuthContext profile.id:</span> {profile?.id}</p>
        <p><span className="font-bold">AuthContext profile.email:</span> {profile?.email}</p>
        <p><span className="font-bold">AuthContext profile.role:</span> {profile?.role}</p>
        <p><span className="font-bold">Direct DB fetch error:</span> {debugError ? JSON.stringify(debugError) : 'None'}</p>
        <p><span className="font-bold">Direct DB fetch role:</span> {debugRawProfile?.role}</p>
        <p><span className="font-bold">Build Timestamp:</span> {new Date().toISOString()}</p>
        <p><span className="font-bold">Latest Commit:</span> 354dc3657c3550e64de82ac1c638e1cbf6c71041</p>
      </div>

      {/* Profile details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">기본 정보</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-850/50 pb-2">
              <span className="text-slate-500">계정 이메일</span>
              <span className="text-slate-200 font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between border-b border-slate-850/50 pb-2">
              <span className="text-slate-500">계정 고유 식별값 (UID)</span>
              <span className="text-slate-400 font-mono text-[10px] select-all">{user.id}</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">이용 등급 & 권한</h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between border-b border-slate-850/50 pb-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-purple-400" />
                <span>회원 권한 (Role)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-bold text-[10px] uppercase">
                {profile?.role === 'middle_admin' ? '중간관리자' : (profile?.role || 'free_user')}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-850/50 pb-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-emerald-400" />
                <span>가입 요금제 (Plan)</span>
              </span>
              <span className="text-emerald-400 font-bold uppercase">
                {profile?.plan_type || 'free'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-850/50 pb-2">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FileClock className="h-3.5 w-3.5 text-blue-400" />
                <span>잔여 월간 생성 쿼타</span>
              </span>
              <span className="text-blue-400 font-bold">
                {profile?.monthly_quota ?? 3} 회 / 3 회
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-950 hover:text-rose-455 text-slate-300 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <LogOut className="h-4 w-4" />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  )
}
