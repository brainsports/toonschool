// ──────────────────────────────────────────────
// 선생님관리 페이지
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import type { Teacher, OrgInfo } from '../types'
import { fetchTeachers, fetchOrgInfo, createTeacher, deleteTeachers, resetPassword } from '../services/teacherService'
import ConfirmModal from '../components/ConfirmModal'

export default function TeacherManagementPage() {
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [toast, setToast] = useState('')
  const [newName, setNewName] = useState('')
  const [newId, setNewId] = useState('')
  const [newPw, setNewPw] = useState('')

  useEffect(() => {
    fetchOrgInfo().then(setOrgInfo)
    fetchTeachers().then(setTeachers)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const handleCopyCode = () => {
    if (!orgInfo) return
    navigator.clipboard.writeText(orgInfo.linkCode).catch(() => {})
    showToast('연동 코드가 복사되었습니다.')
  }

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleAll = () => {
    setCheckedIds(checkedIds.size === teachers.length ? new Set() : new Set(teachers.map(t => t.id)))
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newId.trim() || !newPw.trim()) {
      showToast('이름, 아이디, 비밀번호를 모두 입력해 주세요.')
      return
    }
    const t = await createTeacher({ name: newName.trim(), loginId: newId.trim() })
    setTeachers(prev => [...prev, t])
    setNewName(''); setNewId(''); setNewPw('')
    setShowCreate(false)
    showToast(`${t.name} 선생님이 생성되었습니다.`)
  }

  const handleDelete = async () => {
    // 담당 학급 있는 선생님 확인
    const withClasses = teachers.filter(t => checkedIds.has(t.id) && t.classIds.length > 0)
    if (withClasses.length > 0) {
      showToast(`⚠️ ${withClasses.map(t => t.name).join(', ')} 선생님은 담당 학급이 있어 삭제 전 학급을 먼저 해제해 주세요.`)
      return
    }
    await deleteTeachers([...checkedIds])
    setTeachers(prev => prev.filter(t => !checkedIds.has(t.id)))
    setCheckedIds(new Set())
    showToast('선생님이 삭제되었습니다.')
  }

  const handleResetPw = async (teacher: Teacher) => {
    await resetPassword(teacher.id, '0000')
    showToast(`${teacher.name} 선생님의 비밀번호가 0000으로 초기화되었습니다.`)
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none',
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: 'white', padding: '12px 24px',
          borderRadius: 99, fontSize: 14, fontWeight: 600, zIndex: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: '80vw', textAlign: 'center',
        }}>{toast}</div>
      )}

      {/* 기관 정보 카드 */}
      {orgInfo && (
        <div style={{
          background: 'linear-gradient(135deg,#fff0f6,#fdf4ff)',
          border: '1.5px solid #ffc6de', borderRadius: 16, padding: '20px 28px',
          marginBottom: 24, boxShadow: '0 2px 12px rgba(255,39,120,0.08)',
          display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#ff2778', fontWeight: 700, marginBottom: 4 }}>사용 기관명</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e' }}>{orgInfo.name}</div>
          </div>
          <div style={{ width: 1, height: 40, background: '#ffc6de' }} />
          <div>
            <div style={{ fontSize: 12, color: '#ff2778', fontWeight: 700, marginBottom: 4 }}>선생님 연동 코드</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed', letterSpacing: 2, fontFamily: 'monospace' }}>
                {orgInfo.linkCode}
              </span>
              <button onClick={handleCopyCode} style={{
                padding: '6px 14px', borderRadius: 8, border: '1.5px solid #7c3aed',
                background: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>복사</button>
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>선생님이 회원가입 시 이 코드를 입력합니다</div>
          </div>
        </div>
      )}

      {/* 버튼 영역 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setShowCreate(true)} style={{
          padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          background: 'linear-gradient(90deg,#ff2778,#ff6baf)', color: 'white',
          boxShadow: '0 4px 12px rgba(255,39,120,0.3)',
        }}>+ 선생님 생성</button>
        <button onClick={() => showToast('엑셀 다운로드는 추후 구현 예정입니다.')} style={{
          padding: '10px 18px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: 'white', color: '#555',
        }}>📥 명단 내려받기</button>
        {checkedIds.size > 0 && (
          <button onClick={() => setDeleteConfirm(true)} style={{
            padding: '10px 18px', borderRadius: 10, border: '1.5px solid #fca5a5', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: '#fee2e2', color: '#ef4444',
          }}>🗑️ 선택 삭제 ({checkedIds.size})</button>
        )}
      </div>

      {/* 선생님 목록 표 */}
      <div className="table-wrapper" style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ minWidth: '600px' }}>
          {/* 표 헤더 */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 50px 100px 140px 100px 120px',
            padding: '14px 20px', background: '#fafafa',
            borderBottom: '1.5px solid #f0f0f0', fontSize: 13, fontWeight: 700, color: '#666',
          }}>
            <div><input type="checkbox" checked={teachers.length > 0 && checkedIds.size === teachers.length} onChange={toggleAll} style={{ cursor: 'pointer' }} /></div>
            <div>순번</div>
            <div>이름</div>
            <div>아이디</div>
            <div>가입일</div>
            <div style={{ textAlign: 'center' }}>비밀번호 초기화</div>
          </div>

        {teachers.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 15 }}>
            등록된 선생님이 없습니다.
          </div>
        ) : (
          teachers.map((tea, idx) => (
            <div key={tea.id} style={{
              display: 'grid', gridTemplateColumns: '40px 50px 100px 140px 100px 120px',
              padding: '14px 20px',
              borderBottom: idx < teachers.length - 1 ? '1px solid #f9f9f9' : 'none',
              alignItems: 'center',
              background: checkedIds.has(tea.id) ? '#fff0f6' : 'white',
            }}>
              <div><input type="checkbox" checked={checkedIds.has(tea.id)} onChange={() => toggleCheck(tea.id)} style={{ cursor: 'pointer' }} /></div>
              <div style={{ fontSize: 14, color: '#888' }}>{idx + 1}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{tea.name}</div>
                {tea.classNames.length > 0 && (
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{tea.classNames.join(', ')}</div>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#555', fontFamily: 'monospace' }}>{tea.loginId}</div>
              <div style={{ fontSize: 13, color: '#aaa' }}>{tea.joinedAt}</div>
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => handleResetPw(tea)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', cursor: 'pointer',
                }}>초기화</button>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* 선생님 생성 모달 */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowCreate(false)}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 20px' }}>선생님 생성하기</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>이름</label>
                <input type="text" placeholder="선생님 이름" value={newName} onChange={e => setNewName(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>아이디</label>
                <input type="text" placeholder="예: teacher01" value={newId} onChange={e => setNewId(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#444', display: 'block', marginBottom: 6 }}>초기 비밀번호</label>
                <input type="text" placeholder="초기 비밀번호" value={newPw} onChange={e => setNewPw(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowCreate(false)} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb',
                background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer',
              }}>취소</button>
              <button onClick={handleCreate} style={{
                flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(90deg,#ff2778,#ff6baf)', color: 'white', fontWeight: 700, cursor: 'pointer',
              }}>선생님 생성</button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <ConfirmModal
          title="선생님 삭제"
          message={`선택한 ${checkedIds.size}명의 선생님 계정을 삭제하시겠습니까?`}
          confirmLabel="삭제"
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(false)}
          danger
        />
      )}
    </div>
  )
}
