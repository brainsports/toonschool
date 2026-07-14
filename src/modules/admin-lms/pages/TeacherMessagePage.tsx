// ──────────────────────────────────────────────
// 선생님 말씀 메뉴 페이지
// 본문에서 발송 대상(전체/학년/학급)을 먼저 선택하고 작성 모달을 연다.
// 대상 선택은 TeacherRecipientSelector 공통 컴포넌트가 담당(본인 학급/학생만).
// ──────────────────────────────────────────────
import { useState, useCallback } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import TeacherRecipientSelector, { type Recipient } from '../components/TeacherRecipientSelector'
import TeacherMessageModal from '../components/TeacherMessageModal'

export default function TeacherMessagePage() {
  const { profile } = useAuth()
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleChange = useCallback((r: Recipient | null) => setRecipient(r), [])

  const canWrite = !!recipient && recipient.count > 0

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: 'white', padding: '12px 24px',
          borderRadius: 99, fontSize: 14, fontWeight: 600, zIndex: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      <div style={{ background: 'white', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>💬 선생님 말씀</h2>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>
          담당 학생에게 전달할 선생님 말씀을 작성합니다. 전체, 학년 또는 학급별로 대상을 선택할 수 있습니다.
        </p>
      </div>

      {profile?.id && profile.role === 'teacher' ? (
        <>
          <TeacherRecipientSelector teacherId={profile.id} accent="pink" onChange={handleChange} />

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setOpenModal(true)}
              disabled={!canWrite}
              style={{
                padding: '12px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, border: 'none', cursor: canWrite ? 'pointer' : 'not-allowed',
                background: canWrite ? 'linear-gradient(90deg,#ff2778,#ff6baf)' : '#e5e7eb',
                color: 'white', boxShadow: canWrite ? '0 4px 12px rgba(255,39,120,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              말씀 작성하기
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 15, background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          선생님 계정에서만 사용할 수 있습니다.
        </div>
      )}

      {openModal && recipient && (
        <TeacherMessageModal
          recipient={recipient}
          onClose={() => setOpenModal(false)}
          onSaved={() => {
            setOpenModal(false)
            showToast('선생님 말씀이 저장되었습니다.')
          }}
        />
      )}
    </div>
  )
}
