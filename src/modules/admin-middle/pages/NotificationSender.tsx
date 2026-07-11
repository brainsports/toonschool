import { useState, useEffect } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'
import { supabase } from '../../../shared/lib/supabase'

export default function NotificationSender() {
  const { profile } = useAuth()
  const [orgs, setOrgs] = useState<any[]>([])
  
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [targetType, setTargetType] = useState('org_admin')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (profile) {
      if (profile.role === 'super_admin') {
        supabase.from('organizations').select('*').order('created_at', { ascending: false })
          .then(({ data }) => setOrgs(data || []))
      } else {
        middleAdminService.getOrganizations(profile.id).then(setOrgs)
      }
      fetchHistory()
    }
  }, [profile])

  const fetchHistory = async () => {
    if (!profile) return
    
    // 중간관리자/수퍼관리자 발송 이력 조회
    let query = supabase
      .from('org_notifications')
      .select('*, organizations(name)')
      .eq('sender_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data, error } = await query
    if (!error && data) {
      setHistory(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgId) return alert('발송 대상 기관을 선택해 주세요.')
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 모두 입력해 주세요.')

    setIsSubmitting(true)
    try {
      const { error } = await supabase.rpc('create_org_notification', {
        p_organization_id: selectedOrgId,
        p_target_type: targetType,
        p_title: title,
        p_message: content,
        p_priority: isImportant ? 'high' : 'normal'
      })

      if (error) throw error

      alert('알림이 발송되었습니다.')
      setTitle('')
      setContent('')
      fetchHistory()
    } catch (err: any) {
      alert(err.message || '알림 발송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      const { data, error } = await supabase.rpc('delete_middle_admin_notification', {
        p_notification_id: deletingId
      })
      if (error) throw error
      if (data && data.success === false) throw new Error(data.error)
      
      alert('알림이 모든 수신자의 알림함에서 삭제되었습니다.')
      fetchHistory()
    } catch (err: any) {
      console.error('Delete notification error:', {
        error: err,
        code: err?.code,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        deletingId
      });
      alert('알림을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
      setDeletingId(null)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>알림 보내기</h2>
      
      <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>기관 선택</label>
            <select
              value={selectedOrgId}
              onChange={e => setSelectedOrgId(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}
            >
              <option value="">-- 소속기관 선택 --</option>
              {orgs.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>발송 대상</label>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { id: 'all', label: '모두에게' },
                { id: 'org_admin', label: '기관관리자 전체' },
                { id: 'teacher', label: '선생님 전체' },
                { id: 'student', label: '학생 전체' }
              ].map(opt => (
                <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="targetType" 
                    value={opt.id} 
                    checked={targetType === opt.id}
                    onChange={e => setTargetType(e.target.value)}
                    style={{ width: 18, height: 18, accentColor: '#7c3aed' }}
                  />
                  <span style={{ fontSize: 15, color: '#334155', fontWeight: 500 }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>중요 여부</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isImportant}
                onChange={e => setIsImportant(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#dc2626' }}
              />
              <span style={{ fontSize: 15, color: '#dc2626', fontWeight: 700 }}>중요 알림으로 표시</span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>알림 제목</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="알림 제목을 입력해 주세요."
              style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 15, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>알림 내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="알림 내용을 입력해 주세요."
              style={{ width: '100%', padding: '16px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15, minHeight: 160, resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{ 
              padding: '16px', background: '#7c3aed', color: 'white', borderRadius: 8, 
              fontWeight: 800, fontSize: 16, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginTop: 16, transition: 'background 0.2s'
            }}
          >
            {isSubmitting ? '발송 중...' : '알림 발송하기'}
          </button>
        </form>
      </div>
      <div style={{ marginTop: 40 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 16 }}>최근 발송 이력</h3>
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#475569' }}>발송일</th>
                <th style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#475569' }}>기관명</th>
                <th style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#475569' }}>발송 대상</th>
                <th style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#475569' }}>제목</th>
                <th style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#475569' }}>중요 여부</th>
                <th style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#475569', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 15 }}>
                    발송 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                history.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: '#334155' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: '#334155' }}>
                      {item.organizations?.name || '알 수 없음'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: '#334155' }}>
                      {item.target_type === 'all' ? '모두에게' : 
                       item.target_type === 'org_admin' ? '기관관리자' : 
                       item.target_type === 'teacher' ? '선생님' : 
                       item.target_type === 'student' ? '학생' : item.target_type}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14, color: '#334155', fontWeight: 500 }}>
                      {item.title}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 14 }}>
                      {item.priority === 'high' ? (
                        <span style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', borderRadius: 4, fontWeight: 700, fontSize: 12 }}>
                          중요
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        disabled={isDeleting && deletingId === item.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: (isDeleting && deletingId === item.id) ? 'not-allowed' : 'pointer',
                          transition: 'background 0.2s',
                          opacity: (isDeleting && deletingId === item.id) ? 0.7 : 1
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                        {(isDeleting && deletingId === item.id) ? '삭제 중...' : '삭제'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400,
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ background: '#fee2e2', width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>알림을 삭제할까요?</h3>
            </div>
            
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, marginBottom: 24, marginTop: 0 }}>
              이 알림을 삭제하면 기관관리자, 선생님, 학생의 알림함에서도 함께 삭제됩니다.<br/>
              <strong>삭제한 알림은 복구할 수 없습니다.</strong>
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingId(null)
                }}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '12px 0', background: '#f1f5f9', color: '#475569',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  flex: 1, padding: '12px 0', background: '#dc2626', color: 'white',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 15,
                  cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.7 : 1
                }}
              >
                {isDeleting ? '삭제 중...' : '모두 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
