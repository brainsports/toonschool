// ──────────────────────────────────────────────
// 학급관리 페이지
// ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { ClassRoom, LicenseInfo, UnitSetting } from '../types'
import { fetchLicenseInfo, updateUnitSetting, deleteClasses, fetchClassesByOrganizationAndGrade, createClassService, countStudentsInClasses } from '../services/classService'
import { CURRICULUM_UNITS } from '../data/mockClasses'
import LicenseCard from '../components/LicenseCard'
import UnitSettingModal from '../components/UnitSettingModal'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import CreateClassModal from '../components/CreateClassModal'
import ClassGenerationSettingModal from '../components/ClassGenerationSettingModal'
import { getClassQuotaSummary, COMIC_QUOTA_ENABLED } from '../../../shared/lib/comicQuota'

const GRADES = [1, 2, 3, 4, 5, 6]

export default function ClassManagementPage() {
  const { profile } = useAuth()
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [gradeClasses, setGradeClasses] = useState<ClassRoom[]>([])
  const [selectedGrade, setSelectedGrade] = useState(1)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [unitModalClass, setUnitModalClass] = useState<ClassRoom | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)             // 선택(다중) 삭제 확인
  const [deleteTargetClass, setDeleteTargetClass] = useState<ClassRoom | null>(null) // 단일 학급 삭제 대상
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toast, setToast] = useState('')
  const [quotaModalClass, setQuotaModalClass] = useState<ClassRoom | null>(null)
  const [quotaLabels, setQuotaLabels] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile?.id) {
      fetchLicenseInfo(profile.id, profile.center_id || undefined, profile.role).then(setLicense)
    }
  }, [profile?.id, profile?.center_id, profile?.role])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const loadClasses = () => {
    if (!profile?.organization_id) return
    // 선생님은 본인 소유 학급(teacher_id=본인)만 조회. 서버(DB) 단에서 격리.
    const teacherId = profile.role === 'teacher' ? profile.id : undefined
    fetchClassesByOrganizationAndGrade(profile.organization_id, selectedGrade, teacherId)
      .then(classes => {
        setGradeClasses(classes)
        // 만화 생성 한도 요약 배지(flag 켜져 있을 때만 조회)
        if (COMIC_QUOTA_ENABLED) {
          classes.forEach(async c => {
            const s = await getClassQuotaSummary(c.id)
            if (s) {
              setQuotaLabels(prev => ({ ...prev, [c.id]: `월 ${s.per_student_total}회` }))
            }
          })
        }
      })
      .catch(err => {
        console.error('Failed to load classes:', err)
        showToast('학급 목록을 불러오는 데 실패했습니다.')
      })
  }

  useEffect(() => {
    loadClasses()
  }, [profile?.organization_id, selectedGrade])

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

  // 학급 삭제 공통 로직: 학생 소속 여부 확인 -> 소유권 강제 소프트 삭제.
  // 학생이 한 명이라도 소속된 학급은 삭제를 차단하고 안내한다(학생 데이터 보호).
  // 삭제는 classes.status 를 'inactive' 로 변경하는 소프트 삭제이며 학생/작품/평가/보상/출결은 전혀 건드리지 않는다.
  const removeClasses = async (ids: string[], successMsg: string) => {
    if (!ids.length) return
    const studentCount = await countStudentsInClasses(ids)
    if (studentCount > 0) {
      showToast('이 학급에 소속된 학생이 있습니다. 학생을 다른 학급으로 이동하거나 학급 배정을 해제한 뒤 삭제해 주세요.')
      return
    }
    const teacherId = profile?.role === 'teacher' ? profile.id : undefined
    const deleted = await deleteClasses(ids, teacherId)
    if (deleted === 0) {
      showToast('학급을 삭제할 권한이 없거나 이미 삭제되었습니다.')
      return
    }
    setGradeClasses(prev => prev.filter(c => !ids.includes(c.id)))
    setCheckedIds(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.delete(id))
      return next
    })
    showToast(successMsg)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await removeClasses([...checkedIds], '선택한 학급이 삭제되었습니다.')
    } catch (err) {
      console.error('Failed to delete classes:', err)
      showToast('학급 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(false)
    }
  }

  const handleDeleteClass = async () => {
    if (!deleteTargetClass) return
    const target = deleteTargetClass
    setIsDeleting(true)
    try {
      await removeClasses([target.id], `'${target.name}' 학급이 삭제되었습니다.`)
    } catch (err) {
      console.error('Failed to delete class:', err)
      showToast('학급 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
      setDeleteTargetClass(null)
    }
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
      <div className="table-wrapper" style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ minWidth: '800px' }}>
          {/* 표 헤더 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 60px 1fr 160px 80px 380px',
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
              gridTemplateColumns: '40px 60px 1fr 160px 80px 380px',
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
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {cls.name}
                  {cls.isDefault && (
                    <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>기본학급</span>
                  )}
                </div>
                {cls.teacherName && (
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>담당: {cls.teacherName}</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                {cls.unitSetting ? (
                  <span style={{
                    background: '#d1fae5', color: '#059669', padding: '3px 10px',
                    borderRadius: 99, fontSize: 12, fontWeight: 600,
                  }}>{cls.unitSetting.label}</span>
                ) : (
                  <span style={{ color: '#ccc', fontSize: 13 }}>미설정</span>
                )}
                {COMIC_QUOTA_ENABLED && quotaLabels[cls.id] && (
                  <span style={{
                    background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px',
                    borderRadius: 99, fontSize: 12, fontWeight: 600,
                  }}>{quotaLabels[cls.id]}</span>
                )}
              </div>
              <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#333' }}>
                {cls.studentCount}명
              </div>
              <div style={{ textAlign: 'center', display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setUnitModalClass(cls)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: '#fff0f6', color: '#ff2778', border: '1px solid #ffc6de', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>단원 설정</button>
                <button onClick={() => setQuotaModalClass(cls)} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>만화 생성 설정</button>
                {cls.isDefault ? (
                  <span style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: '#f3f4f6', color: '#9ca3af', border: '1px dashed #d1d5db',
                  }}>기본학급 · 삭제 불가</span>
                ) : (
                  <button onClick={() => setDeleteTargetClass(cls)} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}>학급 삭제</button>
                )}
              </div>
            </div>
          ))
        )}
        </div>
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

      {/* 선택(다중) 학급 삭제 확인 */}
      <ConfirmModal
        open={deleteConfirm}
        title="학급을 삭제할까요?"
        description={`선택한 ${checkedIds.size}개 학급을 삭제합니다. 삭제한 학급은 복구하기 어렵습니다.`}
        confirmText={isDeleting ? '삭제 중...' : '학급 삭제'}
        cancelText="취소"
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setDeleteConfirm(false)}
        variant="danger"
        loading={isDeleting}
      />

      {/* 단일 학급 삭제 확인 */}
      <ConfirmModal
        open={!!deleteTargetClass}
        title="학급을 삭제할까요?"
        description={deleteTargetClass ? `'${deleteTargetClass.name}' 학급을 삭제합니다. 삭제한 학급은 복구하기 어렵습니다.` : ''}
        confirmText={isDeleting ? '삭제 중...' : '학급 삭제'}
        cancelText="취소"
        onConfirm={handleDeleteClass}
        onCancel={() => !isDeleting && setDeleteTargetClass(null)}
        variant="danger"
        loading={isDeleting}
      />

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

      {/* 만화 생성 설정 모달 */}
      {quotaModalClass && (
        <ClassGenerationSettingModal
          open
          classId={quotaModalClass.id}
          className={quotaModalClass.name}
          grade={quotaModalClass.grade}
          onClose={() => setQuotaModalClass(null)}
          onSaved={() => {
            setQuotaModalClass(null)
            loadClasses()
          }}
        />
      )}
    </div>
  )
}
