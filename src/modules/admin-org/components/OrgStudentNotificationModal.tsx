import React, { useState, useEffect, useMemo } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { OrgTeacher } from '../types/orgAdmin'

interface OrgStudentNotificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function OrgStudentNotificationModal({ isOpen, onClose, onSuccess }: OrgStudentNotificationModalProps) {
  const { profile, user } = useAuth()
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])
  const [students, setStudents] = useState<any[]>([])
  
  const [targetType, setTargetType] = useState<'all_students' | 'specific_class' | 'specific_student'>('all_students')
  const [targetTeacherId, setTargetTeacherId] = useState('')
  const [targetStudentId, setTargetStudentId] = useState('')
  const [searchStudentTerm, setSearchStudentTerm] = useState('')
  
  const [category, setCategory] = useState('notice')
  const [priority, setPriority] = useState<'normal' | 'high'>('normal')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [noticeDate, setNoticeDate] = useState(getLocalDateString())
  const [isPublic, setIsPublic] = useState(true)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && profile?.organization_id) {
      orgAdminService.getOrgTeachers(profile.organization_id).then(setTeachers).catch(console.error)
      orgAdminService.getOrgStudents(profile.organization_id).then(setStudents).catch(console.error)
    }
  }, [isOpen, profile])

  const filteredStudents = useMemo(() => {
    if (!searchStudentTerm.trim()) return students;
    return students.filter(s => s.name.includes(searchStudentTerm.trim()));
  }, [students, searchStudentTerm]);

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.organization_id || !user) return

    if (!title.trim() || !message.trim()) {
      setError("제목과 내용을 입력해 주세요.")
      return
    }

    if (targetType === 'specific_class' && !targetTeacherId) {
      setError("대상이 될 선생님을 선택해 주세요.")
      return
    }
    
    if (targetType === 'specific_student' && !targetStudentId) {
      setError("대상이 될 학생을 선택해 주세요.")
      return
    }

    setError(null)
    try {
      setLoading(true)
      await orgAdminService.sendOrgNotification(profile.organization_id, user.id, {
        targetType: targetType,
        targetTeacherId: targetType === 'specific_class' ? targetTeacherId : undefined,
        targetUserId: targetType === 'specific_student' ? targetStudentId : undefined,
        title: title.trim(),
        message: message.trim(),
        priority: priority,
        category: category,
        noticeDate: noticeDate,
        isPublic: isPublic
      })
      alert("학생 알림을 보냈습니다.")
      onSuccess()
      onClose()
      
      // Reset
      setTargetType('all_students')
      setTargetTeacherId('')
      setTargetStudentId('')
      setSearchStudentTerm('')
      setCategory('notice')
      setPriority('normal')
      setTitle('')
      setMessage('')
      setNoticeDate(getLocalDateString())
      setIsPublic(true)
    } catch (err: any) {
      setError(`발송 중 오류가 발생했습니다: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getStudentTeacherName = (centerId: string) => {
    const teacher = teachers.find(t => t.assigned_class === centerId);
    return teacher ? teacher.name : '선생님 미지정';
  };

  const inputStyle = {
    padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd',
    fontSize: 15, fontFamily: 'inherit', outline: 'none', background: 'white', width: '100%'
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: 20, width: 500, maxWidth: '90%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>학생 알림 보내기</h3>
        </div>
        
        <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          {error && <div style={{ color: '#ef4444', fontSize: 13, background: '#fee2e2', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>받는 대상 *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#333' }}>
                <input 
                  type="radio" 
                  checked={targetType === 'all_students'} 
                  onChange={() => setTargetType('all_students')} 
                />
                전체 학생
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#333' }}>
                <input 
                  type="radio" 
                  checked={targetType === 'specific_class'} 
                  onChange={() => setTargetType('specific_class')} 
                />
                특정 선생님의 학생 전체
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#333' }}>
                <input 
                  type="radio" 
                  checked={targetType === 'specific_student'} 
                  onChange={() => setTargetType('specific_student')} 
                />
                특정 학생
              </label>
            </div>
          </div>

          {targetType === 'specific_class' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>선생님 선택 *</label>
              <select 
                style={inputStyle}
                value={targetTeacherId}
                onChange={(e) => setTargetTeacherId(e.target.value)}
              >
                <option value="">선택해 주세요</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.assigned_class || '학급미지정'})</option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'specific_student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>학생 선택 *</label>
              <input 
                type="text" 
                placeholder="학생 이름 검색..." 
                value={searchStudentTerm}
                onChange={e => setSearchStudentTerm(e.target.value)}
                style={{ ...inputStyle, marginBottom: 8 }}
              />
              <select 
                style={inputStyle}
                value={targetStudentId}
                onChange={(e) => setTargetStudentId(e.target.value)}
              >
                <option value="">학생을 선택해 주세요</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} / {s.grade ? `${s.grade}학년` : '학년미상'} / {s.center_id || '학급미상'} / {getStudentTeacherName(s.center_id)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>알림 카테고리</label>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={inputStyle}
            >
              <option value="notice">공지</option>
              <option value="info">안내</option>
              <option value="homework">과제</option>
              <option value="event">행사</option>
              <option value="urgent">긴급</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>중요도 *</label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  value="normal" 
                  checked={priority === 'normal'}
                  onChange={() => setPriority('normal')}
                /> 일반
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>
                <input 
                  type="radio" 
                  value="high" 
                  checked={priority === 'high'}
                  onChange={() => setPriority('high')}
                /> 중요
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>제목 *</label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              style={inputStyle}
              maxLength={50}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>내용 *</label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)}
              placeholder="내용을 입력하세요."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              maxLength={500}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>날짜</label>
            <input 
              type="date" 
              value={noticeDate} 
              onChange={e => setNoticeDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input 
              type="checkbox" 
              id="publish-toggle-org-noti"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="publish-toggle-org-noti" style={{ fontSize: 14, fontWeight: 600, color: '#333', cursor: 'pointer' }}>
              공개 (체크 시 학생 알림함에 노출)
            </label>
          </div>
        </div>

        <div style={{
          padding: '20px 30px', background: '#fafafa', borderTop: '1px solid #f0f0f0',
          borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
          display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0
        }}>
          <button 
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: 'white', color: '#666', border: '1px solid #ddd', cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: '#8b5cf6', color: 'white', border: 'none', cursor: loading ? 'wait' : 'pointer',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            {loading ? '보내는 중...' : '보내기'}
          </button>
        </div>
      </div>
    </div>
  )
}
