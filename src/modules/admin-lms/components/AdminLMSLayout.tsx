// ──────────────────────────────────────────────
// 관리 LMS 전체 레이아웃 - 1단 상단 탭 메뉴
// ──────────────────────────────────────────────
import { useEffect } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'

const MENU_ITEMS = [
  { label: '학급관리', path: '/admin/lms/classes' },
  { label: '학생관리', path: '/admin/lms/students' },
  { label: '평가관리', path: '/admin/lms/assessments' },
  { label: '선생님관리', path: '/admin/lms/teachers' },
  { label: '관리자정보', path: '/admin/lms/profile' },
]

export default function AdminLMSLayout() {
  const { profile, loading, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
      } else {
        const allowedRoles = ['teacher', 'org_admin', 'middle_admin', 'super_admin']
        if (!allowedRoles.includes(profile.role)) {
          alert('관리 LMS는 선생님 및 관리자 계정만 이용할 수 있습니다.')
          if (profile.role === 'student') {
            navigate('/student', { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        }
      }
    }
  }, [loading, user, profile, navigate, location.pathname])

  if (loading || !user || !profile) {
    return null
  }

  const allowedRoles = ['teacher', 'org_admin', 'middle_admin', 'super_admin']
  if (!allowedRoles.includes(profile.role)) {
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #fdf0f8 50%, #f0fdf4 100%)' }}>
      {/* 상단 헤더 */}
      <header style={{
        background: 'white',
        borderBottom: '2px solid #f3e8ff',
        boxShadow: '0 2px 12px rgba(255,39,120,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {/* 로고 & 타이틀 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 8 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 36, height: 36, background: '#ff2778', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: 14, letterSpacing: -1,
              }}>TS</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>툰스쿨</div>
                <div style={{ fontSize: 11, color: '#ff2778', fontWeight: 600 }}>관리 LMS</div>
              </div>
            </Link>
            <button 
              onClick={async () => {
                try {
                  await signOut()
                  navigate('/login', { replace: true })
                } catch (error) {
                  console.error('로그아웃 오류:', error)
                }
              }}
              style={{
                fontSize: 13, color: '#888', textDecoration: 'none', fontWeight: 500,
                padding: '6px 14px', borderRadius: 20, border: '1px solid #eee',
                background: 'transparent', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              로그아웃
            </button>
          </div>

          {/* 1단 탭 메뉴 */}
          <nav style={{ display: 'flex', gap: 4, paddingBottom: 0, overflowX: 'auto' }}>
            {MENU_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  fontSize: 15,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ff2778' : '#555',
                  borderBottom: isActive ? '3px solid #ff2778' : '3px solid transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  borderRadius: '8px 8px 0 0',
                  background: isActive ? '#fff0f6' : 'transparent',
                })}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 64px' }}>
        <Outlet />
      </main>
    </div>
  )
}
