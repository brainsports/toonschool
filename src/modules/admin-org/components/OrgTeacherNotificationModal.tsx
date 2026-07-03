import React, { useState, useEffect } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { OrgTeacher } from '../types/orgAdmin'

interface OrgTeacherNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function OrgTeacherNotificationModal({ isOpen, onClose, onSuccess }: OrgTeacherNotificationModalProps) {
  const { profile, user } = useAuth()
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])
  const [formData, setFormData] = useState({
    targetType: 'all_teachers' as 'all_teachers' | 'specific_teacher',
    targetTeacherId: '',
    title: '',
    message: '',
    priority: 'normal' as 'normal' | 'high'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && profile?.organization_id) {
      orgAdminService.getOrgTeachers(profile.organization_id).then(setTeachers).catch(console.error)
    }
  }, [isOpen, profile])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.organization_id || !user) return

    if (!formData.title || !formData.message) {
      alert("제목과 내용은 필수입니다.")
      return
    }

    if (formData.targetType === 'specific_teacher' && !formData.targetTeacherId) {
      alert("대상이 될 선생님을 선택해 주세요.")
      return
    }

    try {
      setLoading(true)
      await orgAdminService.sendOrgNotification(profile.organization_id, user.id, {
        targetType: formData.targetType,
        targetTeacherId: formData.targetType === 'specific_teacher' ? formData.targetTeacherId : undefined,
        title: formData.title,
        message: formData.message,
        priority: formData.priority
      })
      alert("선생님 알림을 보냈습니다.")
      onSuccess()
      onClose()
      setFormData({
        targetType: 'all_teachers',
        targetTeacherId: '',
        title: '',
        message: '',
        priority: 'normal'
      })
    } catch (err: any) {
      alert(`발송 중 오류가 발생했습니다: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 16, fontSize: 14
  }
  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 6
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 500,
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: '#1a1a2e' }}>선생님 알림 보내기</h2>
        
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>받는 대상 *</label>
          <select 
            style={inputStyle}
            value={formData.targetType}
            onChange={(e) => setFormData(p => ({ ...p, targetType: e.target.value as any, targetTeacherId: '' }))}
          >
            <option value="all_teachers">선생님 전체</option>
            <option value="specific_teacher">특정 선생님</option>
          </select>

          {formData.targetType === 'specific_teacher' && (
            <div>
              <label style={labelStyle}>선생님 선택 *</label>
              <select 
                style={inputStyle}
                value={formData.targetTeacherId}
                onChange={(e) => setFormData(p => ({ ...p, targetTeacherId: e.target.value }))}
              >
                <option value="">선택해 주세요</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.assigned_class || '학급미지정'})</option>
                ))}
              </select>
            </div>
          )}
          
          <label style={labelStyle}>중요도 *</label>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="priority_t" 
                value="normal" 
                checked={formData.priority === 'normal'}
                onChange={() => setFormData(p => ({ ...p, priority: 'normal' }))}
              /> 일반
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#ff2778', fontWeight: 600 }}>
              <input 
                type="radio" 
                name="priority_t" 
                value="high" 
                checked={formData.priority === 'high'}
                onChange={() => setFormData(p => ({ ...p, priority: 'high' }))}
              /> 중요
            </label>
          </div>

          <label style={labelStyle}>제목 *</label>
          <input 
            style={inputStyle}
            value={formData.title}
            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
            placeholder="알림 제목을 입력하세요"
            maxLength={50}
            required
          />

          <label style={labelStyle}>내용 *</label>
          <textarea 
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }}
            value={formData.message}
            onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
            placeholder="알림 내용을 입력하세요"
            maxLength={500}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd', background: 'white', fontWeight: 600, cursor: 'pointer' }}
            >
              취소
            </button>
            <button 
              type="submit"
              disabled={loading}
              style={{
                background: '#1a1a2e', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '보내는 중...' : '보내기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
