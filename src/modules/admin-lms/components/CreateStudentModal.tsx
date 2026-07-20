// ──────────────────────────────────────────────
// 학생 생성 모달 (선생님이 직접 아이디/비밀번호 부여)
// ──────────────────────────────────────────────
import { useState } from 'react'
import type { ClassRoom } from '../types'

const GRADES = [1, 2, 3, 4, 5, 6]

interface Props {
  classes: ClassRoom[]
  defaultClassId?: string
  defaultGrade?: number
  onSave: (data: { name: string; loginId: string; password: string; classId: string; className: string; grade: number; number: number }) => Promise<void>
  onClose: () => void
}

export default function CreateStudentModal({ classes, defaultClassId, defaultGrade, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [grade, setGrade] = useState<number>(defaultGrade ?? classes[0]?.grade ?? 1)
  const [classId, setClassId] = useState<string>(defaultClassId ?? '')
  const [number, setNumber] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 선택한 학년의 학급만 노출. 기본학급 자동 배정 옵션 포함.
  const gradeClasses = classes.filter(c => c.grade === grade)
  const selectedClass = classes.find(c => c.id === classId)

  const handleGradeChange = (g: number) => {
    setGrade(g)
    // 학년이 바뀌면 기존 학급 선택이 다른 학년이면 초기화(자동 배정으로)
    if (selectedClass && selectedClass.grade !== g) setClassId('')
  }

  const handleSubmit = async () => {
    if (!name.trim() || !loginId.trim() || !password.trim()) {
      alert('이름·아이디·비밀번호·학년을 모두 입력해 주세요.')
      return
    }
    if (!grade) {
      alert('학년을 선택해 주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        loginId: loginId.trim(),
        password,
        // classId 가 빈 문자열이면 부모에서 해당 학년 기본학급으로 자동 배정한다.
        classId,
        className: selectedClass?.name ?? '',
        grade,
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
          {/* 학년(필수) */}
          <div>
            <label style={labelStyle}>학년 <span style={{ color: '#ff2778' }}>*</span></label>
            <select value={grade} onChange={e => handleGradeChange(Number(e.target.value))} style={inputStyle}>
              {GRADES.map(g => (
                <option key={g} value={g}>{g}학년</option>
              ))}
            </select>
          </div>

          {/* 학급(선택) — 선택한 학년 학급만 표시. 미선택 시 기본학급 자동 배정 */}
          <div>
            <label style={labelStyle}>학급 <span style={{ color: '#bbb', fontWeight: 500 }}>(선택)</span></label>
            <select value={classId} onChange={e => setClassId(e.target.value)} style={inputStyle}>
              <option value="">기본학급 자동 배정</option>
              {gradeClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.isDefault ? ' (기본학급)' : ''}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              학급을 선택하지 않으면 {grade}학년 기본학급에 자동 배정됩니다.
            </p>
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
