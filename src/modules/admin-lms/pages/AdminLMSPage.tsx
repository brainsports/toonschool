// ──────────────────────────────────────────────
// 관리 LMS 진입점 - /admin/lms → /admin/lms/classes 로 redirect
// ──────────────────────────────────────────────
import { Navigate } from 'react-router-dom'

export default function AdminLMSPage() {
  return <Navigate to="/admin/lms/classes" replace />
}
