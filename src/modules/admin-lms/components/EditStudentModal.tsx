// 학생 정보 수정 모달: 이름 · 아이디(읽기전용) · 소속 학급 · 만화 생성 한도 · 새 비밀번호(선택).
// update-student-by-teacher EF 호출 — 서버가 담당 교사·대상 학급 소유권을 검증.
import { useState, useEffect } from 'react'
import { supabase } from '../../../shared/lib/supabase'
import { updateStudentByTeacher, type UpdateStudentInput } from '../services/studentService'
import type { Student, ClassRoom } from '../types'

const QUOTA_OPTIONS: { value: number; label: string; sub: string }[] = [
  { value: 4, label: '주 1회', sub: '월 4회' },
  { value: 8, label: '주 2회', sub: '월 8회' },
  { value: 20, label: '주 5회', sub: '월 20회' },
]

interface Props {
  student: Student
  classes: ClassRoom[]
  onClose: () => void
  onSaved: () => void
}

export default function EditStudentModal({ student, classes, onClose, onSaved }: Props) {
  const [name, setName] = useState(student.name)
  const [classId, setClassId] = useState(student.classId || '')
  const [quota, setQuota] = useState<number | 'default'>('default')
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [info, setInfo] = useState<{ override: number | null; final: number; hasClass: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.rpc('get_student_quota_status', { p_student_id: student.id })
      if (cancelled) return
      if (data) {
        setInfo({ override: data.monthly_quota_override ?? null, final: data.final_limit, hasClass: !!data.has_class_setting })
        setQuota(data.monthly_quota_override != null ? data.monthly_quota_override : 'default')
      } else {
        setInfo(null)
        setQuota('default')
      }
    })()
    return () => { cancelled = true }
  }, [student.id])

  const effectiveLabel =
    info?.override != null ? `현재 적용: 월 ${info.override}회 · 학생 개별 설정`
    : info?.hasClass ? `현재 적용: 월 ${info?.final ?? 8}회 · 학급 기본`
    : `현재 적용: 월 ${info?.final ?? 8}회 · 기본`

  const handleSave = async () => {
    if (!name.trim()) { setToast('이름을 입력해 주세요.'); return }
    if (newPassword && newPassword.length < 4) { setToast('비밀번호는 4자 이상이어야 합니다.'); return }
    setSaving(true)
    try {
      const payload: UpdateStudentInput = { studentId: student.id }
      if (name.trim() !== student.name) payload.name = name.trim()
      if (classId !== (student.classId || '')) payload.classId = classId || null
      const quotaValue = quota === 'default' ? null : quota
      const initialQuota = info?.override ?? null
      if (quotaValue !== initialQuota) payload.monthlyQuotaOverride = quotaValue
      if (newPassword) payload.newPassword = newPassword

      if (Object.keys(payload).length <= 1) {
        setToast('변경된 항목이 없습니다.')
        setSaving(false)
        return
      }
      const res = await updateStudentByTeacher(payload)
      setToast(res.partial_success ? (res.message || '저장되었습니다.') : (res.message || '학생 정보가 수정되었습니다.'))
      setTimeout(() => { onSaved(); onClose() }, 800)
    } catch (e: any) {
      setToast(e.message || '수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const cardStyle = (selected: boolean): React.CSSProperties => ({
    flex: 1, minWidth: 90, padding: '14px 8px', borderRadius: 14, cursor: 'pointer',
    border: selected ? '2px solid #ff2778' : '1.5px solid #e5e7eb',
    background: selected ? '#fff0f6' : 'white', textAlign: 'center', transition: 'all 0.15s',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16,
    }} onClick={() => !saving && onClose()}>
      <div style={{
        background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 4px', color: '#1a1a2e' }}>학생 정보 수정</h3>
        <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 20px' }}>{effectiveLabel}</p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>학생 이름</label>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>아이디</label>
          <input value={student.loginId} readOnly
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #f0f0f0', fontSize: 14, boxSizing: 'border-box', background: '#fafafa', color: '#999', fontFamily: 'monospace' }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>소속 학급</label>
          <select value={classId} onChange={e => setClassId(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', background: 'white' }}>
            <option value="">학급 미배정</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p style={{ fontSize: 11, color: '#bbb', margin: '6px 0 0' }}>내가 담당하는 학급만 표시됩니다.</p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 8 }}>만화 생성 한도</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {QUOTA_OPTIONS.map(opt => (
              <div key={opt.value} style={cardStyle(quota === opt.value)} onClick={() => setQuota(opt.value)}>
                <div style={{ fontSize: 14, fontWeight: 700, color: quota === opt.value ? '#ff2778' : '#333' }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{opt.sub}</div>
              </div>
            ))}
          </div>
          <div style={cardStyle(quota === 'default')} onClick={() => setQuota('default')}>
            <span style={{ fontSize: 13, fontWeight: 600, color: quota === 'default' ? '#ff2778' : '#666' }}>학급 기본값 사용</span>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>새 비밀번호 <span style={{ color: '#bbb', fontWeight: 400 }}>(선택)</span></label>
          <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="비워두면 기존 비밀번호 유지"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {toast && <div style={{ fontSize: 12, color: '#ff2778', marginBottom: 12, textAlign: 'center' }}>{toast}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => !saving && onClose()} disabled={saving}
            style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb', background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer' }}>취소</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(90deg,#ff2778,#ff6baf)', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
