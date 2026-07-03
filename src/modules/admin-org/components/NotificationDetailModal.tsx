import type { OrgNotification } from '../types/orgAdmin'

interface NotificationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  notification: OrgNotification | null
}

export default function NotificationDetailModal({ isOpen, onClose, notification }: NotificationDetailModalProps) {
  if (!isOpen || !notification) return null

  const getTargetLabel = (type: string) => {
    switch(type) {
      case 'all': return '선생님 전체'
      case 'specific_teacher': return '특정 선생님'
      case 'all_students': return '학생 전체'
      case 'specific_class': return '특정 학급 학생'
      case 'specific_student': return '특정 학생'
      default: return type
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 500
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a2e' }}>알림 상세 보기</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
        </div>
        
        <div style={{ background: '#f8f9fa', padding: 20, borderRadius: 12, marginBottom: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#888', marginRight: 12, display: 'inline-block', width: 60 }}>발송일</span>
            <span style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>{new Date(notification.created_at).toLocaleString('ko-KR')}</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#888', marginRight: 12, display: 'inline-block', width: 60 }}>대상</span>
            <span style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>{getTargetLabel(notification.target_type)}</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#888', marginRight: 12, display: 'inline-block', width: 60 }}>중요도</span>
            {notification.priority === 'high' ? (
              <span style={{ color: '#ff2778', fontWeight: 700, fontSize: 14 }}>중요</span>
            ) : (
              <span style={{ color: '#0369a1', fontWeight: 600, fontSize: 14 }}>일반</span>
            )}
          </div>
          <div>
            <span style={{ fontSize: 13, color: '#888', marginRight: 12, display: 'inline-block', width: 60 }}>읽음 수</span>
            <span style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>- / -</span>
          </div>
        </div>

        <div style={{ marginBottom: 8, fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>
          {notification.title}
        </div>
        <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#fff', padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
          {notification.message}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button 
            onClick={onClose}
            style={{ padding: '12px 32px', background: '#ff2778', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
