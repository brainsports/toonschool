// ──────────────────────────────────────────────
// 학생관리 페이지
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { Student, ClassRoom, LicenseInfo } from '../types'
import { deleteStudents, createStudent, moveStudentsToClass, fetchStudentsByCenterAndGrade } from '../services/studentService'
import { fetchLicenseInfo } from '../services/classService'
import LicenseCard from '../components/LicenseCard'
import CreateStudentModal from '../components/CreateStudentModal'
import ConfirmModal from '../components/ConfirmModal'

const GRADES = [1, 2, 3, 4, 5, 6]

export default function StudentManagementPage() {
  const { profile } = useAuth()
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [allClasses, setAllClasses] = useState<ClassRoom[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedGrade, setSelectedGrade] = useState(5)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveTargetClassId, setMoveTargetClassId] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchLicenseInfo().then(setLicense)
  }, [])

  useEffect(() => {
    if (profile) {
      const syntheticClasses = GRADES.map(g => ({
        id: `class-${g}`,
        name: `${g}학년 전체`,
        grade: g,
        studentCount: 0,
        teacherName: profile.name || '선생님',
      }))
      setAllClasses(syntheticClasses)
      setSelectedClassId('')
    }
  }, [profile])

  useEffect(() => {
    // 학년 탭 변경 시 선택 학급 초기화 ('전체' 보기)
    setSelectedClassId('')
  }, [selectedGrade])

  useEffect(() => {
    if (!profile?.center_id) return
    fetchStudentsByCenterAndGrade(profile.center_id, selectedGrade).then(data => {
      if (selectedClassId) {
        setStudents(data.filter(s => s.classId === selectedClassId))
      } else {
        setStudents(data)
      }
    })
  }, [selectedGrade, selectedClassId, profile?.center_id])

  const gradeClasses = allClasses.filter(c => c.grade === selectedGrade)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  const toggleAll = () => {
    setCheckedIds(checkedIds.size === students.length ? new Set() : new Set(students.map(s => s.id)))
  }

  const handleCreate = async (data: Parameters<typeof createStudent>[0]) => {
    const newStudent = await createStudent(data)
    if (!selectedClassId || newStudent.classId === selectedClassId) {
      setStudents(prev => [...prev, newStudent])
    }
    showToast(`${newStudent.name} 학생이 생성되었습니다.`)
  }

  const handleDelete = async () => {
    await deleteStudents([...checkedIds])
    setStudents(prev => prev.filter(s => !checkedIds.has(s.id)))
    setCheckedIds(new Set())
    showToast('학생이 삭제되었습니다.')
  }

  const handleMove = async () => {
    if (!moveTargetClassId) return
    const targetClass = allClasses.find(c => c.id === moveTargetClassId)
    if (!targetClass) return
    await moveStudentsToClass([...checkedIds], moveTargetClassId, targetClass.name)
    setStudents(prev => prev.filter(s => !checkedIds.has(s.id)))
    setCheckedIds(new Set())
    setShowMoveModal(false)
    showToast(`${targetClass.name}(으)로 이동되었습니다.`)
  }

  const btnBase: React.CSSProperties = {
    padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none',
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

      {license && <LicenseCard license={license} />}

      {/* 학년 탭 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
        {GRADES.map(g => (
          <button key={g} onClick={() => { setSelectedGrade(g); setCheckedIds(new Set()) }} style={{
            padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            border: '2px solid', transition: 'all 0.2s',
            borderColor: selectedGrade === g ? '#ff2778' : '#e5e7eb',
            background: selectedGrade === g ? '#fff0f6' : 'white',
            color: selectedGrade === g ? '#ff2778' : '#666',
          }}>{g}학년</button>
        ))}
      </div>

      {/* 학급 선택 드롭다운 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>학급 선택:</label>
        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} style={{
          padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb',
          fontSize: 14, cursor: 'pointer', background: 'white',
        }}>
          <option value="">전체</option>
          {gradeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{ fontSize: 13, color: '#aaa' }}>총 {students.length}명</span>
      </div>

      {/* 버튼 영역 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button style={{ ...btnBase, background: 'linear-gradient(90deg,#ff2778,#ff6baf)', color: 'white', boxShadow: '0 4px 12px rgba(255,39,120,0.3)' }}
          onClick={() => setShowCreate(true)}>+ 학생 생성</button>
        <button style={{ ...btnBase, background: 'white', color: '#555', border: '1.5px solid #e5e7eb' }}
          onClick={() => showToast('명단 다운로드는 추후 구현 예정입니다.')}>📥 명단 내려받기</button>
        {checkedIds.size > 0 && (
          <>
            <button style={{ ...btnBase, background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe' }}
              onClick={() => setShowMoveModal(true)}>🔀 학급이동 ({checkedIds.size})</button>
            <button style={{ ...btnBase, background: '#fee2e2', color: '#ef4444', border: '1.5px solid #fca5a5' }}
              onClick={() => setDeleteConfirm(true)}>🗑️ 삭제 ({checkedIds.size})</button>
          </>
        )}
      </div>

      {/* 학생 목록 표 */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 60px 100px 140px 120px',
          padding: '14px 20px', background: '#fafafa',
          borderBottom: '1.5px solid #f0f0f0', fontSize: 13, fontWeight: 700, color: '#666',
        }}>
          <div><input type="checkbox" checked={students.length > 0 && checkedIds.size === students.length} onChange={toggleAll} style={{ cursor: 'pointer' }} /></div>
          <div>번호</div>
          <div>이름</div>
          <div>아이디</div>
          <div>비밀번호</div>
        </div>

        {students.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 15 }}>
            등록된 학생이 없습니다.
            <br />
            <button onClick={() => setShowCreate(true)} style={{
              marginTop: 12, padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(90deg,#ff2778,#ff6baf)', color: 'white',
              fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>+ 학생 생성하기</button>
          </div>
        ) : (
          students.sort((a, b) => a.number - b.number).map((stu, idx) => (
            <div key={stu.id} style={{
              display: 'grid', gridTemplateColumns: '40px 60px 100px 140px 120px',
              padding: '13px 20px',
              borderBottom: idx < students.length - 1 ? '1px solid #f9f9f9' : 'none',
              alignItems: 'center',
              background: checkedIds.has(stu.id) ? '#fff0f6' : 'white',
            }}>
              <div><input type="checkbox" checked={checkedIds.has(stu.id)} onChange={() => toggleCheck(stu.id)} style={{ cursor: 'pointer' }} /></div>
              <div style={{ fontSize: 14, color: '#888' }}>{stu.number}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{stu.name}</div>
              <div style={{ fontSize: 13, color: '#555', fontFamily: 'monospace' }}>{stu.loginId}</div>
              <div style={{ fontSize: 13, color: '#aaa', fontFamily: 'monospace' }}>{stu.password}</div>
            </div>
          ))
        )}
      </div>

      {/* 학생 생성 모달 */}
      {showCreate && (
        <CreateStudentModal
          classes={allClasses}
          defaultClassId={selectedClassId}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <ConfirmModal
          title="학생 삭제"
          message={`선택한 ${checkedIds.size}명의 학생을 삭제하시겠습니까?\n삭제된 학생 데이터는 복구할 수 없습니다.`}
          confirmLabel="삭제"
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(false)}
          danger
        />
      )}

      {/* 학급이동 모달 */}
      {showMoveModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowMoveModal(false)}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>학급이동</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>이동할 학급을 선택해 주세요.</p>
            <select value={moveTargetClassId} onChange={e => setMoveTargetClassId(e.target.value)} style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14,
            }}>
              <option value="">학급 선택...</option>
              {allClasses.filter(c => c.id !== selectedClassId).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowMoveModal(false)} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb',
                background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer',
              }}>취소</button>
              <button onClick={handleMove} disabled={!moveTargetClassId} style={{
                flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                background: moveTargetClassId ? 'linear-gradient(90deg,#2563eb,#60a5fa)' : '#e5e7eb',
                color: 'white', fontWeight: 700, cursor: moveTargetClassId ? 'pointer' : 'not-allowed',
              }}>이동하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
