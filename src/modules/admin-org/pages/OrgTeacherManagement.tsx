import { useEffect, useState } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import type { OrgTeacher } from '../types/orgAdmin'
import { useAuth } from '../../../shared/contexts/AuthContext'
import TeacherCreateModal from '../components/TeacherCreateModal'
import TeacherEditModal from '../components/TeacherEditModal'
import { formatDate, getLicenseStatus } from '../utils/dateUtils'
import TeacherNotificationModal from '../components/TeacherNotificationModal'
import ConfirmModal from '../../../shared/components/ConfirmModal'

type LoadError = 'NO_ORG' | 'LOAD_FAILED' | null

export default function OrgTeacherManagement() {
  const { profile, user } = useAuth()
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<LoadError>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTeacher, setEditTeacher] = useState<OrgTeacher | null>(null)
  const [notifyTeacher, setNotifyTeacher] = useState<OrgTeacher | null>(null)
  
  const [deleteConfirmTeacher, setDeleteConfirmTeacher] = useState<OrgTeacher | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadTeachers = async () => {
    if (!profile?.organization_id) {
      setError('NO_ORG')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await orgAdminService.getOrgTeachers(profile.organization_id)
      setTeachers(data)
    } catch (err) {
      console.error('[OrgTeacherManagement] loadTeachers failed', err)
      setError('LOAD_FAILED')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [profile])

  const handleCreateSubmit = async (data: any) => {
    if (!profile?.organization_id || !user) return
    await orgAdminService.createTeacherForOrg(profile.organization_id, user.id, data)
    await loadTeachers()
  }

  const handleEditSubmit = async (teacherId: string, data: any) => {
    if (!profile?.organization_id) return
    await orgAdminService.updateOrgTeacher(profile.organization_id, teacherId, data)
    await loadTeachers()
  }

  const confirmDelete = async () => {
    if (!deleteConfirmTeacher || !profile?.organization_id) return

    try {
      setIsDeleting(true)
      await orgAdminService.suspendOrgTeacher(profile.organization_id, deleteConfirmTeacher.id)
      alert('선생님 상태를 변경했습니다.')
      await loadTeachers()
      setDeleteConfirmTeacher(null)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDelete = (teacher: OrgTeacher) => {
    setDeleteConfirmTeacher(teacher)
  }

  const handleNotifySubmit = async (title: string, content: string) => {
    if (!profile?.organization_id || !user || !notifyTeacher) return
    await orgAdminService.sendOrgNotification(profile.organization_id, user.id, {
      targetType: 'specific_teacher',
      targetTeacherId: notifyTeacher.id,
      title,
      message: content,
      priority: 'normal'
    })
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>불러오는 중입니다...</div>
  if (error === 'NO_ORG') return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>소속 기관 정보를 확인할 수 없습니다.</div>
  if (error === 'LOAD_FAILED') return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>선생님 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>선생님 관리</h1>
        <button
          onClick={() => setIsCreateOpen(true)}
          style={{ background: '#ff2778', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          + 선생님 추가하기
        </button>
      </div>

      {teachers.length === 0 ? (
        <div style={{ background: 'white', padding: 60, borderRadius: 16, textAlign: 'center', color: '#888', border: '1px solid #eee' }}>
          아직 등록된 선생님이 없어요.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={thStyle}>선생님 이름</th>
                <th style={thStyle}>이메일</th>
                <th style={thStyle}>담당 학급</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>담당 학생 수</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>배정 / 학생 사용 / 남은 수</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>이용 기간</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>상태</th>
                <th style={{ ...thStyle, textAlign: 'center', width: 200, whiteSpace: 'nowrap' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => {
                const licenseStatus = getLicenseStatus(t.license_start_date, t.license_end_date)
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#333' }}>{t.name || '-'}</td>
                    <td style={{ padding: '16px 20px', color: '#666', fontSize: 14 }}>{t.email || '-'}</td>
                    <td style={{ padding: '16px 20px', color: '#666', fontSize: 14 }}>{t.assigned_class || '미지정'}</td>
                    <td style={{ padding: '16px 20px', color: '#333', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{t.student_count || 0}</td>
                    <td style={{ padding: '16px 20px', color: '#666', fontSize: 14, textAlign: 'center' }}>
                      {t.allocated_licenses} / {t.used_licenses} / <span style={{ color: '#ff2778', fontWeight: 700 }}>{t.remaining_licenses}</span>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#666', fontSize: 13, textAlign: 'center' }}>
                      {t.license_start_date && t.license_end_date ? `${formatDate(t.license_start_date)} ~ ${formatDate(t.license_end_date)}` : '미지정'}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{ background: licenseStatus.statusBg, color: licenseStatus.statusColor, padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                        {t.status === 'active' ? licenseStatus.statusText : '사용 정지'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => setEditTeacher(t)} style={btnStyle}>수정</button>
                        <button onClick={() => handleDelete(t)} style={{ ...btnStyle, color: '#b91c1c', background: '#fee2e2' }}>정지</button>
                        <button onClick={() => setNotifyTeacher(t)} style={btnStyle}>알림</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <TeacherCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSubmit={handleCreateSubmit} />
      <TeacherEditModal isOpen={!!editTeacher} onClose={() => setEditTeacher(null)} teacher={editTeacher} onSubmit={handleEditSubmit} />
      <TeacherNotificationModal isOpen={!!notifyTeacher} onClose={() => setNotifyTeacher(null)} teacher={notifyTeacher} onSubmit={handleNotifySubmit} />
      
      <ConfirmModal
        open={!!deleteConfirmTeacher}
        title="선생님 정지"
        description={`[${deleteConfirmTeacher?.name || deleteConfirmTeacher?.email || '선생님'}] 선생님을 사용 정지 처리할까요?`}
        confirmText={isDeleting ? '처리 중...' : '정지'}
        onConfirm={confirmDelete}
        onCancel={() => !isDeleting && setDeleteConfirmTeacher(null)}
        variant="warning"
        loading={isDeleting}
      />
    </div>
  )
}

const thStyle = {
  padding: '16px 20px',
  fontWeight: 600,
  color: '#555',
  fontSize: 14
}

const btnStyle = {
  padding: '6px 10px',
  borderRadius: 6,
  border: 'none',
  background: '#f1f5f9',
  color: '#475569',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
}