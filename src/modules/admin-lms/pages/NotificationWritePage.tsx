// ──────────────────────────────────────────────
// 알림함 쓰기 메뉴 페이지 (학급관리에서 이동)
// 본인 소유 학급만 선택 가능. 작성 로직은 기존 NotificationWriteModal 을 그대로 재사용.
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { ClassRoom } from '../types'
import { fetchClassesByTeacher } from '../services/classService'
import NotificationWriteModal from '../components/NotificationWriteModal'

export default function NotificationWritePage() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    // 선생님 본인 소유 학급만 조회(teacher_id=본인, DB 단 격리).
    if (profile?.id && profile.role === 'teacher') {
      fetchClassesByTeacher(profile.id)
        .then(list => {
          setClasses(list)
          if (list.length > 0) setSelectedClassId(list[0].id)
        })
        .catch(err => {
          console.error('Failed to load classes:', err)
          showToast('학급 목록을 불러오지 못했습니다.')
        })
    }
  }, [profile?.id, profile?.role])

  const selectedClass = classes.find(c => c.id === selectedClassId) || null

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

      <div style={{ background: 'white', borderRadius: 16, padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>🔔 알림함 쓰기</h2>
        <p style={{ fontSize: 14, color: '#888', margin: 0 }}>담당 학급에 보낼 알림을 작성합니다. 본인 학급만 선택할 수 있어요.</p>
      </div>

      {classes.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 15, background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          담당 학급이 없습니다. 학급관리에서 학급을 먼저 생성해 주세요.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>학급 선택</label>
          <select
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, cursor: 'pointer', background: 'white' }}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.grade}학년 {c.name}</option>)}
          </select>
          <button
            onClick={() => setOpenModal(true)}
            disabled={!selectedClass}
            style={{
              padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer',
              background: selectedClass ? '#8b5cf6' : '#e5e7eb',
              color: 'white', boxShadow: selectedClass ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
            }}
          >
            작성하기
          </button>
        </div>
      )}

      {openModal && selectedClass && (
        <NotificationWriteModal
          classRoom={selectedClass}
          onClose={() => setOpenModal(false)}
          onSaved={() => {
            setOpenModal(false)
            showToast('알림이 저장되었습니다.')
          }}
        />
      )}
    </div>
  )
}
