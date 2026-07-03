import { useState, useEffect } from 'react'
import { teacherNotificationService, type TeacherNotification } from '../services/teacherNotificationService'
import { useAuth } from '../../../shared/contexts/AuthContext'

interface TeacherNotificationInboxProps {
  onClose: () => void
  onCountChange?: (count: number) => void
}

export default function TeacherNotificationInbox({ onClose, onCountChange }: TeacherNotificationInboxProps) {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<TeacherNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNoti, setSelectedNoti] = useState<TeacherNotification | null>(null)

  useEffect(() => {
    if (profile?.id && profile?.organization_id) {
      loadNotifications()
    }
  }, [profile])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await teacherNotificationService.getNotifications(profile!.id, profile!.organization_id!)
      setNotifications(data)
      const unreadCount = data.filter(n => !n.is_read).length
      onCountChange?.(unreadCount)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRead = async (noti: TeacherNotification) => {
    if (!noti.is_read) {
      try {
        await teacherNotificationService.markAsRead(profile!.id, noti.id)
        const updated = notifications.map(n => n.id === noti.id ? { ...n, is_read: true } : n)
        setNotifications(updated)
        onCountChange?.(updated.filter(n => !n.is_read).length)
      } catch (err) {
        console.error('Failed to mark as read:', err)
      }
    }
    setSelectedNoti(noti)
  }

  const handleDelete = async (noti: TeacherNotification, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    
    if (window.confirm('이 알림을 내 알림함에서 삭제하시겠습니까?')) {
      try {
        await teacherNotificationService.hideNotification(profile!.id, noti.id)
        const updated = notifications.filter(n => n.id !== noti.id)
        setNotifications(updated)
        onCountChange?.(updated.filter(n => !n.is_read).length)
        if (selectedNoti?.id === noti.id) {
          setSelectedNoti(null)
        }
      } catch (err) {
        console.error('Failed to delete notification:', err)
      }
    }
  }

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'org_admin': return '기관관리자'
      case 'middle_admin': return '중간관리자'
      case 'super_admin': return '슈퍼관리자'
      default: return '관리자'
    }
  }

  const getCategoryColor = (category: string) => {
    switch(category) {
      case '공지': return { bg: '#eef2ff', text: '#4f46e5' }
      case '안내': return { bg: '#f0fdf4', text: '#16a34a' }
      case '행사': return { bg: '#fff7ed', text: '#ea580c' }
      case '긴급': return { bg: '#fef2f2', text: '#dc2626' }
      default: return { bg: '#f1f5f9', text: '#64748b' }
    }
  }

  if (selectedNoti) {
    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <div style={modalHeaderStyle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>알림 상세</h2>
            <button onClick={() => setSelectedNoti(null)} style={closeButtonStyle}>✕</button>
          </div>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <span style={{
                fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 4,
                background: getCategoryColor(selectedNoti.category).bg,
                color: getCategoryColor(selectedNoti.category).text
              }}>
                {selectedNoti.category}
              </span>
              {selectedNoti.priority === 'high' && (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '4px 8px', borderRadius: 4 }}>
                  중요
                </span>
              )}
            </div>
            
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 16, lineHeight: 1.4 }}>
              {selectedNoti.title}
            </h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 600, fontSize: 14 }}>
                  {selectedNoti.sender_name?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                    {selectedNoti.sender_name} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{getRoleLabel(selectedNoti.sender_role)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{selectedNoti.notice_date}</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap', minHeight: 200 }}>
              {selectedNoti.message}
            </div>
          </div>
          
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', background: '#f8fafc' }}>
            <button 
              onClick={() => handleDelete(selectedNoti)}
              style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', color: '#ef4444', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              삭제
            </button>
            <button 
              onClick={() => setSelectedNoti(null)}
              style={{ padding: '8px 24px', border: 'none', background: '#0f172a', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              목록으로
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>받은 알림함</h2>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>알림을 불러오는 중...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 40 }}>📭</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>새로운 알림이 없습니다.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map(noti => (
                <div 
                  key={noti.id}
                  onClick={() => handleRead(noti)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: noti.is_read ? 'white' : '#f8fafc',
                    border: `1px solid ${noti.is_read ? '#e2e8f0' : '#cbd5e1'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {!noti.is_read && (
                    <div style={{ width: 8, height: 8, background: '#ff2778', borderRadius: '50%', position: 'absolute', top: 16, right: 16 }}></div>
                  )}
                  
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: getCategoryColor(noti.category).bg, color: getCategoryColor(noti.category).text }}>
                      {noti.category}
                    </span>
                    {noti.priority === 'high' && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>중요</span>
                    )}
                    <span style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto', paddingRight: noti.is_read ? 0 : 16 }}>{noti.notice_date}</span>
                  </div>
                  
                  <h4 style={{ fontSize: 15, fontWeight: noti.is_read ? 500 : 700, color: noti.is_read ? '#475569' : '#0f172a', margin: '0 0 6px 0' }}>
                    {noti.title}
                  </h4>
                  
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {noti.message}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: '#64748b' }}>{noti.sender_name}</span>
                      <span>({getRoleLabel(noti.sender_role)})</span>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(noti, e)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(2px)'
}

const modalContentStyle: React.CSSProperties = {
  background: 'white',
  width: '100%',
  maxWidth: 480,
  height: '80vh',
  maxHeight: 700,
  borderRadius: 16,
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
}

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid #e2e8f0',
  background: 'white'
}

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 20,
  color: '#64748b',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: '50%',
  transition: 'background 0.2s'
}
