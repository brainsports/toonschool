// ──────────────────────────────────────────────
// 학생 만화 생성 사용 기록 모달 + 예약 해제 / 1회 복원
// ──────────────────────────────────────────────
import { useEffect, useState } from 'react'
import {
  getStudentUsageRecords,
  releaseComicReservation,
  restoreComicQuota,
  isQuotaError,
  type UsageRecord,
} from '../../../shared/lib/comicQuota'

interface Props {
  open: boolean
  studentId: string
  studentName: string
  onClose: () => void
  onChanged?: () => void
}

const STATUS_LABEL: Record<string, string> = {
  reserved: '생성 중(예약)',
  completed: '사용 완료',
  released: '해제됨(미차감)',
  restored: '복원됨',
}

export default function StudentUsageRecordModal({ open, studentId, studentName, onClose, onChanged }: Props) {
  const [records, setRecords] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState<null | { type: 'release' | 'restore'; record: UsageRecord }>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open || !studentId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getStudentUsageRecords(studentId).then((r) => { setRecords(r); setLoading(false) })
  }, [open, studentId])

  const refresh = () => {
    getStudentUsageRecords(studentId).then(setRecords)
    onChanged?.()
  }

  const openConfirm = (type: 'release' | 'restore', record: UsageRecord) => {
    setConfirm({ type, record })
    setReason('')
    setErr('')
  }

  const handleConfirm = async () => {
    if (!confirm || !reason.trim()) return
    setBusy(true)
    setErr('')
    const r =
      confirm.type === 'release'
        ? await releaseComicReservation({ studentId, comicId: confirm.record.comic_id, reason: reason.trim() })
        : await restoreComicQuota({ studentId, comicId: confirm.record.comic_id, reason: reason.trim() })
    setBusy(false)
    if (isQuotaError(r)) {
      setErr(r.message)
      return
    }
    setConfirm(null)
    setReason('')
    refresh()
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: 660, maxWidth: '94vw', maxHeight: '90vh', overflow: 'auto', padding: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>만화 생성 사용 기록</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{studentName} 학생</div>

        {loading && <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>불러오는 중…</div>}
        {!loading && records.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>사용 기록이 없습니다.</div>
        )}

        {!loading && records.length > 0 && (
          <div style={{ marginTop: 16, border: '1px solid #f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
            {records.map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
                  padding: '12px 14px', alignItems: 'center',
                  borderBottom: i < records.length - 1 ? '1px solid #f7f7f7' : 'none',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{r.title || `작품 ${r.comic_id.slice(0, 8)}`}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {r.usage_year}.{r.usage_month} · comic {r.comic_id.slice(0, 8)}{r.generation_job_id ? ` · job ${r.generation_job_id.slice(0, 8)}` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {r.status === 'completed' && r.completed_at ? `완료 ${new Date(r.completed_at).toLocaleString()}`
                      : r.status === 'released' && r.released_at ? `해제 ${new Date(r.released_at).toLocaleString()}`
                      : r.reserved_at ? `예약 ${new Date(r.reserved_at).toLocaleString()}` : ''}
                    {r.release_reason ? ` · 사유: ${r.release_reason}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span
                    style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: r.status === 'completed' ? '#dbeafe' : r.status === 'reserved' ? '#fef3c7' : r.status === 'released' ? '#f3f4f6' : '#ede9fe',
                      color: r.status === 'completed' ? '#1d4ed8' : r.status === 'reserved' ? '#b45309' : r.status === 'released' ? '#6b7280' : '#6d28d9',
                    }}
                  >
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                  {r.status === 'reserved' && (
                    <button
                      onClick={() => openConfirm('release', r)}
                      style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >예약 해제</button>
                  )}
                  {r.status === 'completed' && (
                    <button
                      onClick={() => openConfirm('restore', r)}
                      style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >1회 복원</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>닫기</button>
        </div>

        {confirm && (
          <div
            onClick={() => !busy && setConfirm(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 24, width: 420, maxWidth: '92vw' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>
                {confirm.type === 'release' ? '예약 해제' : '횟수 1회 복원'}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
                {confirm.type === 'release'
                  ? '해당 작품의 생성 예약을 해제합니다. 예약만 해제되며 완료된 사용량은 변경되지 않습니다.'
                  : '해당 작품의 사용 완료 1회를 복원합니다. 복원 시 해당 작품의 기록이 restored로 변경됩니다.'}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                작품: {confirm.record.title || confirm.record.comic_id.slice(0, 8)}
              </div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 14, marginBottom: 6 }}>사유(필수)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={confirm.type === 'restore' ? '예: 시스템 오류로 잘못 차감됨' : '예: 오래된/실패한 예약 정리'}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
              />
              {err && <div style={{ marginTop: 8, fontSize: 12, color: '#ef4444' }}>{err}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => setConfirm(null)} disabled={busy} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>취소</button>
                <button
                  onClick={handleConfirm}
                  disabled={busy || !reason.trim()}
                  style={{
                    flex: 1.4, padding: '10px 0', borderRadius: 10, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: busy ? '#9ca3af' : confirm.type === 'release' ? 'linear-gradient(90deg,#f97316,#fb923c)' : 'linear-gradient(90deg,#16a34a,#22c55e)',
                    opacity: busy || !reason.trim() ? 0.6 : 1,
                  }}
                >{busy ? '처리 중…' : confirm.type === 'release' ? '해제하기' : '복원하기'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
