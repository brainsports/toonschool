// ──────────────────────────────────────────────
// 관리 LMS 전체 레이아웃 - 1단 상단 탭 메뉴
// ──────────────────────────────────────────────
import { useEffect } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { useState } from 'react'
import TeacherNotificationInbox from './TeacherNotificationInbox'
import OrgAdminNotificationInbox from './OrgAdminNotificationInbox'

const getMenuItems = (role: string) => {
  switch (role) {
    case 'org_admin':
      return [
        { label: '기관대시보드', path: '/admin/lms/organization' },
        { label: '선생님관리', path: '/admin/lms/org-teachers' },
        { label: '이용권관리', path: '/admin/lms/licenses' },
        { label: '관리자정보', path: '/admin/lms/profile' },
        { label: '자료실', path: '/admin/lms/resources' },
      ];
    case 'middle_admin':
      return [
        { label: '중간관리자 대시보드', path: '/admin/lms/manager' },
        { label: '기관관리', path: '/admin/lms/centers' },
        { label: '이용현황', path: '/admin/lms/usage' },
        { label: '선생님/학생 현황', path: '/admin/lms/status' },
        { label: '관리자정보', path: '/admin/lms/profile' },
      ];
    case 'super_admin':
      return [
        { label: '슈퍼관리자 대시보드', path: '/admin/lms/super' },
        { label: '전체 기관관리', path: '/admin/lms/all-centers' },
        { label: '전체 관리자관리', path: '/admin/lms/all-admins' },
        { label: '이용권/결제관리', path: '/admin/lms/all-licenses' },
        { label: '시스템 설정', path: '/admin/lms/settings' },
      ];
    case 'teacher':
    default:
      return [
        { label: '학급관리', path: '/admin/lms/classes' },
        { label: '학생관리', path: '/admin/lms/students' },
        { label: '평가관리', path: '/admin/lms/assessments' },
        { label: '관리자정보', path: '/admin/lms/profile' },
        { label: '자료실', path: '/admin/lms/resources' },
      ];
  }
}

export default function AdminLMSLayout() {
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
        const allowedRoles = ['teacher', 'org_admin', 'middle_admin', 'super_admin']
        if (!allowedRoles.includes(profile.role)) {
          alert('관리 LMS는 선생님 및 관리자 계정만 이용할 수 있습니다.')
          if (profile.role === 'student') {
            navigate('/student', { replace: true })
          } else {
            navigate('/', { replace: true })
          }
        } else if (profile.role === 'org_admin') {
          if (location.pathname.startsWith('/admin/lms/classes') || location.pathname.startsWith('/admin/lms/students')) {
            navigate('/admin/lms/organization', { replace: true })
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, paddingBottom: 8, flexWrap: 'wrap', gap: 12 }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* 알림 벨 아이콘 (선생님 및 기관관리자 표시) */}
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
                  {/* 최초 렌더링 시 알림 개수를 가져오기 위해 보이지 않게 컴포넌트를 하나 렌더링하여 초기 카운트를 가져옴 */}
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

              {/* 현재 로그인 계정 프로필 칩 */}
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
                  {(profile.name ? profile.name.charAt(0) : ((profile as any).full_name ? (profile as any).full_name.charAt(0) : (user.email ? user.email.charAt(0).toUpperCase() : 'T')))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile.name || (profile as any).full_name || (user.email ? user.email.split('@')[0] : '사용자')}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#ff2778', background: '#ffe4ee', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                      {profile.role === 'teacher' ? '선생님' :
                       profile.role === 'org_admin' ? '기관관리자' :
                       profile.role === 'middle_admin' ? '중간관리자' :
                       profile.role === 'super_admin' ? '슈퍼관리자' :
                       profile.role === 'student' ? '학생' :
                       profile.role === 'free_user' ? '일반회원' : '사용자'}
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
          <nav style={{ display: 'flex', gap: 4, paddingBottom: 0, overflowX: 'auto' }}>
            {getMenuItems(profile.role).map(item => (
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
