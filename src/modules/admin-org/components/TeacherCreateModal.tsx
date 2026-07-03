import React, { useState } from 'react'

interface TeacherCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    email: string
    tempPassword: string
    assigned_class: string
    initial_licenses: number
    memo: string
    license_start_date?: string
    license_end_date?: string
  }) => Promise<void>
}

export default function TeacherCreateModal({ isOpen, onClose, onSubmit }: TeacherCreateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tempPassword: '',
    assigned_class: '',
    initial_licenses: 0,
    memo: '',
    license_start_date: '',
    license_end_date: ''
  })
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.tempPassword) {
      alert("이름, 아이디/이메일, 임시 비밀번호는 필수입니다.")
      return
    }
    if (formData.initial_licenses < 0) {
      alert("배정할 이용권 수는 0 이상이어야 합니다.")
      return
    }

    try {
      setLoading(true)
      await onSubmit({
        ...formData,
        license_start_date: formData.license_start_date || undefined,
        license_end_date: formData.license_end_date || undefined
      })
      alert("선생님을 추가했어요.")
      onClose()
      setFormData({ name: '', email: '', tempPassword: '', assigned_class: '', initial_licenses: 0, memo: '', license_start_date: '', license_end_date: '' })
    } catch (err: any) {
      alert(`저장 중 문제가 생겼어요. 다시 확인해 주세요.\n(${err.message})`)
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
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' }}>선생님 추가하기</h2>
        
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>선생님 이름 *</label>
          <input 
            style={inputStyle}
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="홍길동"
            required
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>로그인 아이디 또는 이메일 *</label>
          <input 
            style={inputStyle}
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
            placeholder="teacher@example.com"
            required
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>임시 비밀번호 *</label>
          <input 
            style={inputStyle}
            type="text"
            value={formData.tempPassword}
            onChange={(e) => setFormData(p => ({ ...p, tempPassword: e.target.value }))}
            placeholder="임시 비밀번호 입력"
            required
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>담당 학급</label>
          <input 
            style={inputStyle}
            value={formData.assigned_class}
            onChange={(e) => setFormData(p => ({ ...p, assigned_class: e.target.value }))}
            placeholder="예: 1학년 1반"
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>배정할 이용권 수</label>
          <input 
            style={inputStyle}
            type="number"
            min={0}
            value={formData.initial_licenses}
            onChange={(e) => setFormData(p => ({ ...p, initial_licenses: parseInt(e.target.value) || 0 }))}
          />

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
            placeholder="관리자용 메모를 입력하세요."
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
              {loading ? '추가 중...' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
