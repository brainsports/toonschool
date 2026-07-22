import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ToonDictionaryWidgetProvider from '../../modules/student/components/toonVocabulary/ToonDictionaryWidgetProvider'
import type { VocabularySourceType } from '../../modules/student/types/vocabulary'

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
    <div className="min-h-screen flex items-center justify-center bg-[#f3f4f7]">
      <p className="text-slate-500 font-bold">로그인 정보를 확인하는 중입니다...</p>
    </div>
  )
}

export default function RequireStudent() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?mode=student&redirect=${redirect}`} replace />
  }

  if (!profile) {
    return <Navigate to="/login?mode=student" replace />
  }

  if (profile.status === 'suspended') {
    return <Navigate to="/login?mode=student&reason=suspended" replace />
  }

  if (profile.role !== 'student') {
    const home = ROLE_HOME[profile.role] || '/'
    return <Navigate to={home} replace />
  }

  const isMindmapEditor = location.pathname.startsWith('/student/mindmap/edit/')
  const sourceType: VocabularySourceType = isMindmapEditor
    ? 'mindmap_editor'
    : location.pathname === '/student/mindmap'
      ? 'mindmap_start'
      : 'comic_editor'
  const sourceId = isMindmapEditor
    ? location.pathname.split('/').filter(Boolean).at(-1) ?? null
    : localStorage.getItem('currentProjectId') || localStorage.getItem('studentCurrentProjectId')

  return (
    <ToonDictionaryWidgetProvider
      defaultContext={{ sourceType, sourceId }}
      placement={isMindmapEditor ? 'mindmap-editor' : 'default'}
    >
      <Outlet />
    </ToonDictionaryWidgetProvider>
  )
}
