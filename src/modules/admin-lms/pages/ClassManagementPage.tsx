// ──────────────────────────────────────────────
// 학급관리 페이지
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { ClassRoom, LicenseInfo, UnitSetting } from '../types'
import { fetchLicenseInfo, updateUnitSetting, deleteClasses, fetchClassesByOrganizationAndGrade, createClassService } from '../services/classService'
import { CURRICULUM_UNITS } from '../data/mockClasses'
import LicenseCard from '../components/LicenseCard'
import UnitSettingModal from '../components/UnitSettingModal'
import ConfirmModal from '../components/ConfirmModal'
import TeacherMessageModal from '../components/TeacherMessageModal'
import NotificationWriteModal from '../components/NotificationWriteModal'
import CreateClassModal from '../components/CreateClassModal'

const GRADES = [1, 2, 3, 4, 5, 6]

export default function ClassManagementPage() {
  const { profile } = useAuth()
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [gradeClasses, setGradeClasses] = useState<ClassRoom[]>([])
  const [selectedGrade, setSelectedGrade] = useState(1)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [unitModalClass, setUnitModalClass] = useState<ClassRoom | null>(null)
  const [messageModalClass, setMessageModalClass] = useState<ClassRoom | null>(null)
  const [notificationModalClass, setNotificationModalClass] = useState<ClassRoom | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (profile?.id) {
      fetchLicenseInfo(profile.id, profile.center_id || undefined).then(setLicense)
    }
  }, [profile?.id, profile?.center_id])

  const loadClasses = () => {
    if (!profile?.organization_id) return
    fetchClassesByOrganizationAndGrade(profile.organization_id, selectedGrade)
      .then(classes => setGradeClasses(classes))
      .catch(err => {
        console.error('Failed to load classes:', err)
        showToast('학급 목록을 불러오는 데 실패했습니다.')
      })
  }

  useEffect(() => {
    loadClasses()
  }, [profile?.organization_id, selectedGrade])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (checkedIds.size === gradeClasses.length) {
      setCheckedIds(new Set())
    } else {
      setCheckedIds(new Set(gradeClasses.map(c => c.id)))
    }
  }

  const handleSaveUnit = async (setting: UnitSetting) => {
    await updateUnitSetting(setting.classId, setting)
    setGradeClasses(prev => prev.map(c => c.id === setting.classId ? { ...c, unitSetting: setting } : c))
    setUnitModalClass(null)
    showToast('단원 설정이 저장되었습니다.')
  }

  const handleDelete = async () => {
    await deleteClasses([...checkedIds])
    setGradeClasses(prev => prev.filter(c => !checkedIds.has(c.id)))
    setCheckedIds(new Set())
    showToast('선택한 학급이 삭제되었습니다.')
  }

  const btnBase: React.CSSProperties = {
    padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
  }

  return (
    <div>
      {/* 토스트 */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: 'white', padding: '12px 24px',
          borderRadius: 99, fontSize: 14, fontWeight: 600, zIndex: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {/* 이용권 카드 */}
      {license && <LicenseCard license={license} />}

      {/* 상단 버튼 영역 */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={{ ...btnBase, background: 'linear-gradient(90deg, #ff2778, #ff6baf)', color: 'white', boxShadow: '0 4px 12px rgba(255,39,120,0.3)' }}
          onClick={() => {
            if (!profile?.organization_id) {
              alert('소속 기관 정보(organization_id)가 없어 학급을 생성할 수 없습니다.')
              return
            }
            setShowCreateModal(true)
          }}>
          + 학급 생성
        </button>
        <button style={{ ...btnBase, background: 'white', color: '#555', border: '1.5px solid #e5e7eb' }}
          onClick={() => showToast('엑셀 다운로드는 추후 구현 예정입니다.')}>
          📥 학급/학생 다운로드
        </button>
        {checkedIds.size > 0 && (
          <button style={{ ...btnBase, background: '#fee2e2', color: '#ef4444', border: '1.5px solid #fca5a5' }}
            onClick={() => setDeleteConfirm(true)}>
            🗑️ 선택 삭제 ({checkedIds.size})
          </button>
        )}
      </div>

      {/* 학년 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
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

      {/* 학급 목록 표 */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {/* 표 헤더 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 60px 1fr 160px 80px 300px',
          padding: '14px 20px',
          background: '#fafafa',
          borderBottom: '1.5px solid #f0f0f0',
          fontSize: 13, fontWeight: 700, color: '#666',
        }}>
          <div>
            <input type="checkbox" checked={gradeClasses.length > 0 && checkedIds.size === gradeClasses.length}
              onChange={toggleAll} style={{ cursor: 'pointer' }} />
          </div>
          <div>학년</div>
          <div>학급명</div>
          <div>단원 제한 설정</div>
          <div style={{ textAlign: 'center' }}>학생 수</div>
          <div style={{ textAlign: 'center' }}>관리</div>
        </div>

        {gradeClasses.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 15 }}>
            {selectedGrade}학년 학급이 없습니다.
          </div>
        ) : (
          gradeClasses.map((cls, idx) => (
            <div key={cls.id} style={{
              display: 'grid',
              gridTemplateColumns: '40px 60px 1fr 160px 80px 300px',
              padding: '14px 20px',
              borderBottom: idx < gradeClasses.length - 1 ? '1px solid #f9f9f9' : 'none',
              alignItems: 'center',
              background: checkedIds.has(cls.id) ? '#fff0f6' : 'white',
              transition: 'background 0.2s',
            }}>
              <div>
                <input type="checkbox" checked={checkedIds.has(cls.id)}
                  onChange={() => toggleCheck(cls.id)} style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{cls.grade}학년</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{cls.name}</div>
                {cls.teacherName && (
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>담당: {cls.teacherName}</div>
                )}
              </div>
              <div>
                {cls.unitSetting ? (
                  <span style={{
                    background: '#d1fae5', color: '#059669', padding: '3px 10px',
                    borderRadius: 99, fontSize: 12, fontWeight: 600,
                  }}>{cls.unitSetting.label}</span>
                ) : (
                  <span style={{ color: '#ccc', fontSize: 13 }}>미설정</span>
                )}
              </div>
              <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#333' }}>
                {cls.studentCount}명
              </div>
              <div style={{ textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => setUnitModalClass(cls)} style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: '#fff0f6', color: '#ff2778', border: '1px solid #ffc6de', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>단원 설정</button>
                <button onClick={() => setMessageModalClass(cls)} style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: '#f0f9ff', color: '#0ea5e9', border: '1px solid #bae6fd', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>선생님 말씀</button>
                <button onClick={() => setNotificationModalClass(cls)} style={{
                  padding: '6px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: '#f3e8ff', color: '#8b5cf6', border: '1px solid #ddd6fe', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>알림함 쓰기</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 단원설정 모달 */}
      {unitModalClass && (
        <UnitSettingModal
          classRoom={unitModalClass}
          allUnits={CURRICULUM_UNITS}
          onSave={handleSaveUnit}
          onClose={() => setUnitModalClass(null)}
        />
      )}

      {/* 선생님 말씀 모달 */}
      {messageModalClass && (
        <TeacherMessageModal
          classRoom={messageModalClass}
          onClose={() => setMessageModalClass(null)}
          onSaved={() => {
            setMessageModalClass(null);
            showToast('선생님 말씀이 저장되었습니다.');
          }}
        />
      )}

      {/* 알림함 쓰기 모달 */}
      {notificationModalClass && (
        <NotificationWriteModal
          classRoom={notificationModalClass}
          onClose={() => setNotificationModalClass(null)}
          onSaved={() => {
            setNotificationModalClass(null);
            showToast('알림이 저장되었습니다.');
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <ConfirmModal
          title="학급 삭제"
          message={`선택한 ${checkedIds.size}개의 학급을 삭제하시겠습니까?\n실제 데이터는 비활성화(inactive) 처리됩니다.`}
          confirmLabel="삭제"
          onConfirm={handleDelete}
          onClose={() => setDeleteConfirm(false)}
          danger
        />
      )}

      {/* 학급 생성 모달 */}
      {showCreateModal && profile?.organization_id && (
        <CreateClassModal
          organizationId={profile.organization_id}
          teacherId={profile.role === 'teacher' ? profile.id : undefined}
          defaultGrade={selectedGrade}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadClasses}
          createClassService={createClassService}
        />
      )}
    </div>
  )
}
