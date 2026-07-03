// ──────────────────────────────────────────────
// 관리 LMS 진입점 - /admin/lms → /admin/lms/classes 로 redirect
// ──────────────────────────────────────────────
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'

export default function AdminLMSPage() {
  const { profile, loading } = useAuth()
  if (loading || !profile) return null;

  switch(profile.role) {
    case 'org_admin': return <Navigate to="/admin/lms/organization" replace />
    case 'middle_admin': return <Navigate to="/admin/lms/manager" replace />
    case 'super_admin': return <Navigate to="/admin/lms/super" replace />
    case 'teacher':
    default:
      return <Navigate to="/admin/lms/classes" replace />
  }
}
