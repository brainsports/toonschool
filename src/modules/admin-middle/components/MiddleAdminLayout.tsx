import { useEffect, useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'
import MiddleAdminNotificationInbox from './MiddleAdminNotificationInbox'

const MENU_ITEMS = [
  { label: '대시보드', path: '/manager/dashboard' },
  { label: '소속기관 관리', path: '/manager/organizations' },
  { label: '이용권 관리', path: '/manager/licenses' },
  { label: '알림 보내기', path: '/manager/notifications/send' },
  { label: '설정', path: '/manager/settings' },
]

export default function MiddleAdminLayout() {
  const { profile, loading, user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* 알림 벨 아이콘 */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsInboxOpen(true)}
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#ef4444',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      boxShadow: '0 0 0 2px white'
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  )}
                </button>
                {isInboxOpen && (
                  <MiddleAdminNotificationInbox 
                    onClose={() => setIsInboxOpen(false)} 
                    onCountChange={setUnreadCount}
                  />
                )}
                {/* 최초 렌더링 시 알림 개수를 가져오기 위해 보이지 않게 컴포넌트를 하나 렌더링 */}
                {!isInboxOpen && (
                  <div style={{ display: 'none' }}>
                    <MiddleAdminNotificationInbox 
                      onClose={() => {}} 
                      onCountChange={setUnreadCount}
                    />
                  </div>
                )}
              </div>

              {/* 현재 로그인 계정 프로필 칩 */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8, 
                background: '#f8fafc', padding: '6px 12px 6px 6px', 
                borderRadius: 24, border: '1px solid #e2e8f0' 
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#7c3aed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>
                  {(profile.name ? profile.name.charAt(0) : ((profile as any).full_name ? (profile as any).full_name.charAt(0) : (user.email ? user.email.charAt(0).toUpperCase() : 'M')))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile.name || (profile as any).full_name || (user.email ? user.email.split('@')[0] : '중간관리자')}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#f3e8ff', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      중간관리자
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email || (profile as any).email}
                  </div>
                </div>
              </div>

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
                  flexShrink: 0
                }}
              >
                로그아웃
              </button>
            </div>
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
