import { useEffect } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'

const MENU_ITEMS = [
  { label: '대시보드', path: '/admin/org/dashboard' },
  { label: '선생님 관리', path: '/admin/org/teachers' },
  { label: '이용권 관리', path: '/admin/org/licenses' },
  { label: '알림 보내기', path: '/admin/org/notifications/send' },
  { label: '보낸 알림함', path: '/admin/org/notifications/sent' },
]

export default function OrgAdminLayout() {
  const { profile, loading, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
      } else {
        const allowedRoles = ['org_admin', 'super_admin']
        if (!allowedRoles.includes(profile.role)) {
          alert('이 페이지를 볼 수 있는 권한이 없어요.')
          if (profile.role === 'student') {
            navigate('/student', { replace: true })
          } else if (profile.role === 'teacher') {
            navigate('/admin/lms', { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        }
      }
    }
  }, [loading, user, profile, navigate, location.pathname])

  if (loading || !user || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f7' }}>
        <p style={{ color: '#888', fontSize: 16 }}>불러오는 중입니다...</p>
      </div>
    )
  }

  const allowedRoles = ['org_admin', 'super_admin']
  if (!allowedRoles.includes(profile.role)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f7' }}>
        <p style={{ color: '#ff2778', fontSize: 18, fontWeight: 700 }}>이 페이지를 볼 수 있는 권한이 없어요.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f7' }}>
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
                <div style={{ fontSize: 11, color: '#ff2778', fontWeight: 600 }}>기관관리자</div>
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
