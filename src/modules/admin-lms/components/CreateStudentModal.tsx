// ──────────────────────────────────────────────
// 학생 생성 모달 (선생님이 직접 아이디/비밀번호 부여)
// ──────────────────────────────────────────────
import { useState } from 'react'
import type { ClassRoom } from '../types'

interface Props {
  classes: ClassRoom[]
  defaultClassId?: string
  onSave: (data: { name: string; loginId: string; password: string; classId: string; className: string; grade: number; number: number }) => Promise<void>
  onClose: () => void
}

export default function CreateStudentModal({ classes, defaultClassId, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [classId, setClassId] = useState(defaultClassId ?? (classes[0]?.id ?? ''))
  const [number, setNumber] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedClass = classes.find(c => c.id === classId)

  const handleSubmit = async () => {
    if (!name.trim() || !loginId.trim() || !password.trim() || !classId) {
      alert('모든 항목을 입력해 주세요.')
      return
    }
    
    setIsSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        loginId: loginId.trim(),
        password,
        classId,
        className: selectedClass?.name ?? '',
        grade: selectedClass?.grade ?? 1,
        number,
      })
      onClose()
    } catch (error: any) {
      alert(error.message || '학생 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box',
    outline: 'none', transition: 'border-color 0.2s',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>학생 생성하기</h2>
        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 24 }}>선생님이 직접 아이디와 비밀번호를 설정합니다</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 학급 선택 */}
          <div>
            <label style={labelStyle}>학급</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} style={inputStyle}>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 번호 */}
          <div>
            <label style={labelStyle}>번호</label>
            <input
              type="number" min={1} max={50}
              value={number} onChange={e => setNumber(Number(e.target.value))}
              style={inputStyle} />
          </div>

          {/* 이름 */}
          <div>
            <label style={labelStyle}>이름</label>
            <input
              type="text" placeholder="학생 이름"
              value={name} onChange={e => setName(e.target.value)}
              style={inputStyle} />
          </div>

          {/* 아이디 */}
          <div>
            <label style={labelStyle}>아이디</label>
            <input
              type="text" placeholder="예: student01"
              value={loginId} onChange={e => setLoginId(e.target.value)}
              style={inputStyle} />
          </div>

          {/* 비밀번호 */}
          <div>
            <label style={labelStyle}>비밀번호</label>
            <input
              type="text" placeholder="예: 1234"
              value={password} onChange={e => setPassword(e.target.value)}
              style={inputStyle} />
            <p style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>학생이 직접 로그인할 때 사용하는 비밀번호입니다.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} disabled={isSubmitting} style={{
            flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #e5e7eb',
            background: 'white', color: '#555', fontWeight: 600, fontSize: 15, cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1
          }}>취소</button>
          <button onClick={handleSubmit} disabled={isSubmitting} style={{
            flex: 2, padding: '12px 0', borderRadius: 12, border: 'none',
            background: isSubmitting ? '#9ca3af' : 'linear-gradient(90deg, #ff2778, #ff6baf)',
            color: 'white', fontWeight: 700, fontSize: 15, cursor: isSubmitting ? 'not-allowed' : 'pointer',
            boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(255,39,120,0.3)',
          }}>{isSubmitting ? '생성 중...' : '학생 생성'}</button>
        </div>
      </div>
    </div>
  )
}
