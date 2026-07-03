import React, { useState, useEffect } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { OrgTeacher } from '../types/orgAdmin'
import { useNavigate } from 'react-router-dom'

export default function OrgNotificationSender() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])
  const [formData, setFormData] = useState({
    targetType: 'all' as 'all' | 'specific_teacher' | 'all_students' | 'specific_class' | 'specific_student',
    targetTeacherId: '',
    title: '',
    message: '',
    priority: 'normal' as 'normal' | 'high'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (profile?.organization_id) {
      orgAdminService.getOrgTeachers(profile.organization_id).then(setTeachers).catch(console.error)
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.organization_id || !user) return

    if (!formData.title || !formData.message) {
      alert("제목과 내용은 필수입니다.")
      return
    }

    if ((formData.targetType === 'specific_teacher' || formData.targetType === 'specific_class') && !formData.targetTeacherId) {
      alert("대상이 될 선생님을 선택해 주세요.")
      return
    }

    try {
      setLoading(true)
      await orgAdminService.sendOrgNotification(profile.organization_id, user.id, formData)
      alert("알림을 보냈어요.")
      navigate('/admin/org/notifications/sent')
    } catch (err: any) {
      alert(`발송 중 오류가 발생했습니다: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 20, fontSize: 14
  }
  const labelStyle = {
    display: 'block', fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginBottom: 6
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>알림 보내기</h1>

      <div style={{ background: 'white', padding: 32, borderRadius: 16, border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          선생님께 알림을 보낼 수 있어요.<br/>
          학생 알림은 학생 마이페이지 알림함에 표시됩니다.<br/>
          중요 알림은 알림함에서 더 눈에 띄게 표시됩니다.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>받는 대상 *</label>
          <select 
            style={inputStyle}
            value={formData.targetType}
            onChange={(e) => setFormData(p => ({ ...p, targetType: e.target.value as any }))}
          >
            <option value="all">선생님 전체</option>
            <option value="specific_teacher">특정 선생님</option>
            <option value="all_students">학생 전체</option>
            <option value="specific_class">특정 선생님 학급의 학생</option>
          </select>

          {(formData.targetType === 'specific_teacher' || formData.targetType === 'specific_class') && (
            <div style={{ marginBottom: 20 }}>
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
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="priority" 
                value="normal" 
                checked={formData.priority === 'normal'}
                onChange={() => setFormData(p => ({ ...p, priority: 'normal' }))}
              /> 일반
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#ff2778', fontWeight: 600 }}>
              <input 
                type="radio" 
                name="priority" 
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
            placeholder="알림 제목을 입력하세요 (최대 50자)"
            maxLength={50}
            required
          />

          <label style={labelStyle}>내용 *</label>
          <textarea 
            style={{ ...inputStyle, minHeight: 160, resize: 'vertical' }}
            value={formData.message}
            onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
            placeholder="알림 내용을 입력하세요 (최대 500자)"
            maxLength={500}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button 
              type="submit"
              disabled={loading}
              style={{
                background: '#ff2778', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
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
