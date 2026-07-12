import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// 슈퍼관리자가 아닌 사용자가 /admin/super/* 에 접근했을 때 돌려보낼 안전한 경로
const ROLE_HOME: Record<string, string> = {
  super_admin: '/admin/super/dashboard',
  middle_admin: '/manager/dashboard',
  org_admin: '/admin/org/dashboard',
  center_admin: '/mypage',
  teacher: '/admin/lms/classes',
  student: '/student/mypage',
  free_user: '/mypage',
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <svg className="animate-spin h-8 w-8 text-[#6B4EFE]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">권한을 확인하는 중...</span>
      </div>
    </div>
  )
}

function ProfileErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">계정 정보를 불러올 수 없습니다</h2>
        <p className="text-sm text-gray-500 mb-6">잠시 후 다시 시도해 주세요.</p>
        <div className="flex flex-col gap-2">
          <button onClick={onRetry} className="w-full px-4 py-2.5 rounded-xl bg-[#6B4EFE] hover:bg-[#5839F6] text-white text-sm font-semibold">
            다시 시도
          </button>
          <a href="/login" className="block w-full px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold">
            로그인 페이지로
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * 슈퍼관리자 전용 라우트 공통 가드.
 * 각 페이지가 아닌 상위 라우트에서 한 번에 판정하며,
 * 렌더 단계에서 Outlet 반환 여부를 결정한다(useEffect redirect 금지).
 *
 * 판정 순서:
 *  1) 로딩 중 -> 로딩 화면(관리자 콘텐츠 미렌더)
 *  2) 세션 없음 -> /login (원래 경로 보존)
 *  3) profile 없음 -> 재시도 화면(무한 로딩 금지)
 *  4) status !== active -> 차단(suspended 는 로그인 사유 전달)
 *  5) role !== super_admin -> 역할에 맞는 대시보드로 이동
 *  6) super_admin + active -> <Outlet />
 *
 * 주의: 클라이언트 가드는 UX/접근제어용이며, 실제 권한은 서버 RPC/Edge Function 의
 * super_admin 검증과 profiles RLS 가 최종 보증한다.
 */
export default function RequireSuperAdmin() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }

  if (!profile) return <ProfileErrorScreen onRetry={refreshProfile} />

  if (profile.status === 'suspended') {
    return <Navigate to="/login?reason=suspended" replace />
  }
  if (profile.status && profile.status !== 'active') {
    const home = ROLE_HOME[profile.role] || '/'
    return <Navigate to={home} replace />
  }

  if (profile.role !== 'super_admin') {
    const home = ROLE_HOME[profile.role] || '/'
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
