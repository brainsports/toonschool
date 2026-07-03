import { useEffect, useState } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import type { OrgNotification } from '../types/orgAdmin'
import { useAuth } from '../../../shared/contexts/AuthContext'
import NotificationDetailModal from '../components/NotificationDetailModal'

export default function OrgSentNotifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<OrgNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNotif, setSelectedNotif] = useState<OrgNotification | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!profile?.organization_id) return
      try {
        setLoading(true)
        const data = await orgAdminService.getSentOrgNotifications(profile.organization_id)
        setNotifications(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [profile])

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>불러오는 중입니다...</div>
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>에러: {error}</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>보낸 알림함</h1>

      {notifications.length === 0 ? (
        <div style={{ background: 'white', padding: 60, borderRadius: 16, textAlign: 'center', color: '#888', border: '1px solid #eee' }}>
          아직 보낸 알림이 없어요. 알림 보내기 메뉴를 이용해 보세요.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14 }}>발송일</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14 }}>받는 대상</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14 }}>제목</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>중요도</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>읽음 수</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>상세 보기</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px 20px', color: '#666', fontSize: 14 }}>
                    {new Date(n.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#333', fontSize: 14 }}>{getTargetLabel(n.target_type)}</td>
                  <td style={{ padding: '16px 20px', color: '#333', fontSize: 15, fontWeight: 700 }}>
                    {n.title.length > 30 ? n.title.substring(0, 30) + '...' : n.title}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    {n.priority === 'high' ? (
                      <span style={{ color: '#ff2778', fontWeight: 700, fontSize: 13, background: '#fff0f6', padding: '4px 8px', borderRadius: 12 }}>중요</span>
                    ) : (
                      <span style={{ color: '#666', fontSize: 13 }}>일반</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#666', fontSize: 14, textAlign: 'center' }}>-</td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <button 
                      onClick={() => setSelectedNotif(n)}
                      style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NotificationDetailModal 
        isOpen={!!selectedNotif} 
        onClose={() => setSelectedNotif(null)} 
        notification={selectedNotif} 
      />
    </div>
  )
}
