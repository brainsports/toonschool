// ──────────────────────────────────────────────
// 관리자정보 페이지
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import type { OrgInfo } from '../types'
import { fetchOrgInfo, updateOrgInfo } from '../services/teacherService'

export default function AdminProfilePage() {
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null)
  const [orgName, setOrgName] = useState('')
  const [curriculum, setCurriculum] = useState('KR')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchOrgInfo().then(info => {
      setOrgInfo(info)
      setOrgName(info.name)
      setCurriculum(info.curriculum)
    })
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const pwMatch = newPw === confirmPw
  const canSave = orgName.trim() !== '' && (newPw === '' || pwMatch)

  const handleSave = async () => {
    if (!canSave) return
    if (newPw && !pwMatch) {
      showToast('비밀번호가 일치하지 않습니다.')
      return
    }
    setSaving(true)
    await updateOrgInfo({ name: orgName.trim(), curriculum })
    setSaving(false)
    showToast('관리자 정보가 저장되었습니다.')
    setNewPw('')
    setConfirmPw('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 15,
    border: '1.5px solid #e5e7eb', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8,
  }

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

      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        {/* 제목 */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>관리자 정보</h2>
          <p style={{ fontSize: 14, color: '#888', margin: 0 }}>기관 정보와 관리자 비밀번호를 수정할 수 있습니다.</p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 커리큘럼 설정 */}
            <div>
              <label style={labelStyle}>커리큘럼 설정</label>
              <select value={curriculum} onChange={e => setCurriculum(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="KR">🇰🇷 KR 한국</option>
                <option value="EN">🇺🇸 EN 영어 (미지원)</option>
              </select>
            </div>

            {/* 교육기관명 */}
            <div>
              <label style={labelStyle}>교육기관명</label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="기관명을 입력하세요"
                style={inputStyle}
              />
            </div>

            <div style={{ height: 1, background: '#f0f0f0' }} />

            {/* 새 관리자 비밀번호 */}
            <div>
              <label style={labelStyle}>새 관리자 비밀번호</label>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="변경하지 않으려면 비워 두세요"
                style={inputStyle}
              />
            </div>

            {/* 비밀번호 재확인 */}
            <div>
              <label style={labelStyle}>비밀번호 재확인</label>
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                style={{
                  ...inputStyle,
                  borderColor: confirmPw && !pwMatch ? '#ef4444' : '#e5e7eb',
                }}
              />
              {confirmPw && !pwMatch && (
                <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>
                  ⚠️ 비밀번호가 일치하지 않습니다.
                </p>
              )}
              {confirmPw && pwMatch && newPw && (
                <p style={{ fontSize: 12, color: '#22c55e', marginTop: 6 }}>
                  ✓ 비밀번호가 일치합니다.
                </p>
              )}
            </div>

            {/* 수정하기 버튼 */}
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                background: canSave && !saving
                  ? 'linear-gradient(90deg, #ff2778, #ff6baf)'
                  : '#e5e7eb',
                color: canSave && !saving ? 'white' : '#aaa',
                fontWeight: 700, fontSize: 16, cursor: canSave && !saving ? 'pointer' : 'not-allowed',
                boxShadow: canSave && !saving ? '0 4px 16px rgba(255,39,120,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
              {saving ? '저장 중...' : '수정하기'}
            </button>
          </div>
        </div>

        {/* 현재 기관 코드 표시 */}
        {orgInfo && (
          <div style={{
            marginTop: 20, background: '#f8fafc', borderRadius: 14,
            padding: '16px 20px', border: '1.5px dashed #e2e8f0',
          }}>
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>현재 연동 코드</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed', fontFamily: 'monospace', letterSpacing: 2 }}>
              {orgInfo.linkCode}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>선생님 회원가입 시 필요한 코드입니다</div>
          </div>
        )}
      </div>
    </div>
  )
}
