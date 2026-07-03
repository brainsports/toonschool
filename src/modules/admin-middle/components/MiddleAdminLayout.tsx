import { useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'

const MENU_ITEMS = [
  { label: '대시보드', path: '/manager/dashboard' },
  { label: '테스트기관 관리', path: '/manager/organizations' },
  { label: '이용권 관리', path: '/manager/licenses' },
  { label: '학급 관리', path: '/manager/classes' },
  { label: '선생님 관리', path: '/manager/teachers' },
  { label: '학생 관리', path: '/manager/students' },
  { label: '알림 보내기', path: '/manager/notifications/send' },
  { label: '설정', path: '/manager/settings' },
]

export default function MiddleAdminLayout() {
  const { profile, loading, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
      } else {
        const allowedRoles = ['middle_admin', 'super_admin']
        if (!allowedRoles.includes(profile.role)) {
          alert('이 페이지를 볼 수 있는 권한이 없어요.')
          if (profile.role === 'student') {
            navigate('/student', { replace: true })
          } else if (profile.role === 'teacher') {
            navigate('/admin/lms', { replace: true })
          } else if (profile.role === 'org_admin') {
            navigate('/admin/org/dashboard', { replace: true })
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

  const allowedRoles = ['middle_admin', 'super_admin']
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
                width: 36, height: 36, background: '#7c3aed', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: 14, letterSpacing: -1,
              }}>TS</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>툰스쿨</div>
                <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>중간관리자</div>
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
          <nav style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 0, borderTop: '1px solid #f9f9f9', marginTop: 8 }}>
            {MENU_ITEMS.map(item => {
              const isActive = location.pathname.startsWith(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    padding: '12px 4px',
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#7c3aed' : '#555',
                    textDecoration: 'none',
                    borderBottom: isActive ? '3px solid #7c3aed' : '3px solid transparent',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 60px' }}>
        <Outlet />
      </main>
    </div>
  )
}
