import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TeacherNotificationInbox from '../../modules/admin-lms/components/TeacherNotificationInbox'
import OrgAdminNotificationInbox from '../../modules/admin-lms/components/OrgAdminNotificationInbox'

const getMenuItems = (role: string) => {
  switch (role) {
    case 'org_admin':
      return [
        { label: '기관 대시보드', path: '/admin/org/dashboard' },
        { label: '선생님 관리', path: '/admin/org/teachers' },
        { label: '이용권 관리', path: '/admin/org/licenses' },
        { label: '알림 보내기', path: '/admin/org/notifications/send' },
        { label: '보낸 알림함', path: '/admin/org/notifications/sent' },
        { label: '관리자 정보', path: '/admin/org/profile' },
        { label: '자료실', path: '/admin/org/resources' },
      ];
    case 'teacher':
    default:
      return [
        { label: '학급관리', path: '/admin/lms/classes' },
        { label: '학생관리', path: '/admin/lms/students' },
        { label: '성장 현황', path: '/admin/lms/dream-growth' },
        { label: '툰마인드 관리', path: '/admin/lms/mindmaps' },
        { label: '평가관리', path: '/admin/lms/assessments' },
        { label: '선생님 말씀', path: '/admin/lms/teacher-message' },
        { label: '알림함 쓰기', path: '/admin/lms/notifications/write' },
        { label: '관리자정보', path: '/admin/lms/profile' },
        { label: '자료실', path: '/admin/lms/resources' },
      ];
  }
}

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'org_admin': return '기관관리자';
    case 'teacher': return '선생님';
    case 'middle_admin': return '중간관리자';
    case 'super_admin': return '슈퍼관리자';
    case 'student': return '학생';
    default: return '사용자';
  }
}

export default function AdminPortalLayout() {
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
        const allowedRoles = ['teacher', 'org_admin', 'super_admin']
        if (!allowedRoles.includes(profile.role)) {
          alert('접근 권한이 없습니다.')
          if (profile.role === 'student') {
            navigate('/student', { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        }
        
        // 경로 기반 역할 체크 리다이렉트
        if (profile.role === 'org_admin' && location.pathname.startsWith('/admin/lms')) {
          if (location.pathname === '/admin/lms/resources') navigate('/admin/org/resources', { replace: true });
          else if (location.pathname === '/admin/lms/profile') navigate('/admin/org/profile', { replace: true });
          else if (location.pathname === '/admin/lms/organization') navigate('/admin/org/dashboard', { replace: true });
          else if (location.pathname === '/admin/lms/org-teachers') navigate('/admin/org/teachers', { replace: true });
          else if (location.pathname === '/admin/lms/licenses') navigate('/admin/org/licenses', { replace: true });
          else navigate('/admin/org/dashboard', { replace: true });
        } else if (profile.role === 'teacher' && location.pathname.startsWith('/admin/org')) {
          navigate('/admin/lms/classes', { replace: true });
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

  const allowedRoles = ['teacher', 'org_admin', 'super_admin']
  if (profile.role === 'super_admin') {
    return <Navigate to="/admin/super/dashboard" replace />
  }
  if (profile.status && profile.status !== 'active') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f7' }}>
        <p style={{ color: '#ff2778', fontSize: 18, fontWeight: 700 }}>활성 상태가 아닌 계정은 관리 LMS에 접근할 수 없습니다.</p>
      </div>
    )
  }
  if (!allowedRoles.includes(profile.role)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f7' }}>
        <p style={{ color: '#ff2778', fontSize: 18, fontWeight: 700 }}>이 페이지를 볼 수 있는 권한이 없어요.</p>
      </div>
    )
  }

  const menuItems = getMenuItems(profile.role);
  const roleDisplayName = getRoleDisplayName(profile.role);

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
          {/* 로고 & 타이틀 & 우측 기능 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 8, flexWrap: 'wrap', gap: 12 }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 36, height: 36, background: '#ff2778', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: 14, letterSpacing: -1,
              }}>TS</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>툰스쿨</div>
                <div style={{ fontSize: 11, color: '#ff2778', fontWeight: 600 }}>{roleDisplayName}</div>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* 알림 벨 아이콘 */}
              {(profile.role === 'teacher' || profile.role === 'org_admin') && (
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
                    profile.role === 'teacher' ? (
                      <TeacherNotificationInbox 
                        onClose={() => setIsInboxOpen(false)} 
                        onCountChange={setUnreadCount}
                      />
                    ) : (
                      <OrgAdminNotificationInbox 
                        onClose={() => setIsInboxOpen(false)} 
                        onCountChange={setUnreadCount}
                      />
                    )
                  )}
                  {/* 초기 카운트 렌더링 */}
                  {!isInboxOpen && (
                    <div style={{ display: 'none' }}>
                      {profile.role === 'teacher' ? (
                        <TeacherNotificationInbox 
                          onClose={() => {}} 
                          onCountChange={setUnreadCount}
                        />
                      ) : (
                        <OrgAdminNotificationInbox 
                          onClose={() => {}} 
                          onCountChange={setUnreadCount}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 프로필 칩 */}
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 8, 
                background: '#f8fafc', padding: '6px 12px 6px 6px', 
                borderRadius: 24, border: '1px solid #e2e8f0' 
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: '#ff2778',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0
                }}>
                  {(profile.name ? profile.name.charAt(0) : ((profile as any).full_name ? (profile as any).full_name.charAt(0) : (user.email ? user.email.charAt(0).toUpperCase() : 'U')))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile.name || (profile as any).full_name || (user.email ? user.email.split('@')[0] : '사용자')}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#ff2778', background: '#ffe4ee', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      {roleDisplayName}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.email || (profile as any).email}
                  </div>
                </div>
              </div>

              {/* 로그아웃 버튼 */}
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
          <nav style={{ display: 'flex', gap: 4, paddingBottom: 0, overflowX: 'auto' }}>
            {menuItems.map(item => (
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
