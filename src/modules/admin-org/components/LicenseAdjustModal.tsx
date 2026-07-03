import React, { useState } from 'react'
import type { OrgTeacher } from '../types/orgAdmin'

interface LicenseAdjustModalProps {
  isOpen: boolean
  onClose: () => void
  teacher: OrgTeacher | null
  mode: 'allocate' | 'revoke'
  onSubmit: (teacherId: string, quantity: number, memo: string) => Promise<void>
}

export default function LicenseAdjustModal({ isOpen, onClose, teacher, mode, onSubmit }: LicenseAdjustModalProps) {
  const [quantity, setQuantity] = useState(0)
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen || !teacher) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (quantity <= 0) {
      alert("0보다 큰 수량을 입력해 주세요.")
      return
    }

    if (mode === 'revoke') {
      const revocable = teacher.remaining_licenses
      if (quantity > revocable) {
        alert("회수할 수 있는 수량을 초과했습니다.")
        return
      }
    }

    const confirmMsg = `이용권을 ${mode === 'allocate' ? '추가 배정' : '회수'}할까요? 변경된 내용은 운영 기록에 저장됩니다.`
    if (!window.confirm(confirmMsg)) return

    try {
      setLoading(true)
      await onSubmit(teacher.id, quantity, memo)
      alert(`이용권을 ${mode === 'allocate' ? '나눠줬어요.' : '회수했어요.'}`)
      onClose()
      setQuantity(0)
      setMemo('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 16, fontSize: 14
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#1a1a2e' }}>
          {mode === 'allocate' ? '이용권 추가 배정' : '이용권 회수'}
        </h2>
        
        <div style={{ marginBottom: 20, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
          <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#555' }}>대상: <strong>{teacher.name}</strong> 선생님</p>
          <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#555' }}>현재 배정 수량: <strong>{teacher.allocated_licenses}</strong>장</p>
          {mode === 'revoke' && (
            <p style={{ margin: 0, fontSize: 14, color: '#ff2778', fontWeight: 600 }}>회수 가능 수량: {teacher.remaining_licenses}장</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>
            {mode === 'allocate' ? '추가할 수량 *' : '회수할 수량 *'}
          </label>
          <input 
            style={inputStyle}
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            required
          />

          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 4 }}>메모</label>
          <textarea 
            style={{ ...inputStyle, minHeight: 60, resize: 'none' }}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="변경 사유를 입력하세요"
          />

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
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
              {loading ? '처리 중...' : '확인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
