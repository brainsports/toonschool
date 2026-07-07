import React, { useState } from 'react'

interface CreateClassModalProps {
  organizationId: string
  teacherId?: string
  defaultGrade?: number
  onClose: () => void
  onSuccess: () => void
  createClassService: (data: any) => Promise<any>
}

export default function CreateClassModal({
  organizationId,
  teacherId,
  defaultGrade = 1,
  onClose,
  onSuccess,
  createClassService
}: CreateClassModalProps) {
  const [grade, setGrade] = useState<number>(defaultGrade)
  const [name, setName] = useState('')
  const [homeroom, setHomeroom] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('학급명을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      await createClassService({
        organization_id: organizationId,
        name: name.trim(),
        grade,
        homeroom: homeroom.trim() || null,
        teacher_id: teacherId || null,
        status: 'active'
      })
      alert('학급이 생성되었습니다.')
      onSuccess()
      onClose()
    } catch (err: any) {
      alert(`학급 생성 실패: ${err.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: 16, width: 400, padding: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#1a1a2e' }}>+ 학급 생성</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#555' }}>학년</label>
            <select
              value={grade}
              onChange={e => setGrade(Number(e.target.value))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, outline: 'none'
              }}
            >
              {[1, 2, 3, 4, 5, 6].map(g => (
                <option key={g} value={g}>{g}학년</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#555' }}>학급명 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예) 3학년 학급반"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#555' }}>반 (선택)</label>
            <input
              type="text"
              value={homeroom}
              onChange={e => setHomeroom(e.target.value)}
              placeholder="반 이름 또는 비고"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd',
                fontSize: 15, outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1, padding: 12, borderRadius: 8, border: '1px solid #ddd', background: 'white',
                color: '#666', fontSize: 15, fontWeight: 600, cursor: 'pointer'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#ff2778',
                color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? '생성 중...' : '생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
