import React, { useState, useEffect } from 'react'

interface TeacherEditModalProps {
  isOpen: boolean
  onClose: () => void
  teacher: any | null
  onSubmit: (teacherId: string, data: {
    name: string
    assigned_class: string
    status: string
    memo: string
    license_start_date?: string
    license_end_date?: string
  }) => Promise<void>
}

export default function TeacherEditModal({ isOpen, onClose, teacher, onSubmit }: TeacherEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    assigned_class: '',
    status: 'active',
    memo: '',
    license_start_date: '',
    license_end_date: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        assigned_class: teacher.assigned_class || '',
        status: teacher.status || 'active',
        memo: teacher.memo || '',
        license_start_date: teacher.license_start_date ? teacher.license_start_date.split('T')[0] : '',
        license_end_date: teacher.license_end_date ? teacher.license_end_date.split('T')[0] : ''
      })
    }
  }, [teacher])

  if (!isOpen || !teacher) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      alert('선생님 이름을 입력해 주세요.')
      return
    }

    try {
      setLoading(true)
      await onSubmit(teacher.id, {
        ...formData,
        license_start_date: formData.license_start_date || undefined,
        license_end_date: formData.license_end_date || undefined
      })
      alert('선생님 정보가 성공적으로 수정되었습니다.')
      onClose()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    marginBottom: 16,
    fontSize: 14
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' }}>선생님 정보 수정</h2>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>선생님 이름 *</label>
          <input 
            style={inputStyle}
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            required
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>담당 학급</label>
          <input 
            style={inputStyle}
            value={formData.assigned_class}
            onChange={(e) => setFormData(p => ({ ...p, assigned_class: e.target.value }))}
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>상태</label>
          <select 
            style={inputStyle}
            value={formData.status}
            onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
          >
            <option value="active">사용 중</option>
            <option value="suspended">사용 정지</option>
            <option value="inactive">비활성화</option>
          </select>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>이용권 시작일</label>
              <input 
                style={inputStyle}
                type="date"
                value={formData.license_start_date}
                onChange={(e) => setFormData(p => ({ ...p, license_start_date: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>이용권 종료일</label>
              <input 
                style={inputStyle}
                type="date"
                value={formData.license_end_date}
                onChange={(e) => setFormData(p => ({ ...p, license_end_date: e.target.value }))}
              />
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>메모</label>
          <textarea 
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={formData.memo}
            onChange={(e) => setFormData(p => ({ ...p, memo: e.target.value }))}
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button 
              type="button" 
              onClick={onClose}
              style={{ flex: 1, padding: 12, background: '#f3f4f7', color: '#555', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              취소
            </button>
            <button 
              type="submit" 
              disabled={loading}
              style={{ flex: 1, padding: 12, background: '#ff2778', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
