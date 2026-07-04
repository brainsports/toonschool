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

  useEffect(() => {
    if (profile) {
      middleAdminService.getOrganizations(profile.id).then(setOrgs)
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrgId) return alert('발송 대상 기관을 선택해 주세요.')
    if (!title.trim() || !content.trim()) return alert('제목과 내용을 모두 입력해 주세요.')

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from('org_notifications').insert({
        organization_id: selectedOrgId,
        sender_id: profile?.id,
        target_type: targetType,
        title,
        content,
        is_important: isImportant,
        created_at: new Date().toISOString()
      })

      if (error) throw error

      alert('알림이 발송되었습니다.')
      setTitle('')
      setContent('')
    } catch (err: any) {
      alert(err.message || '알림 발송에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
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
                { id: 'org_admin', label: '기관관리자 전체' },
                { id: 'all_teachers', label: '선생님 전체' },
                { id: 'all_students', label: '학생 전체' }
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
    </div>
  )
}
