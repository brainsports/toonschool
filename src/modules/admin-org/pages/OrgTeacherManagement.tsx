import { useEffect, useState } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import type { OrgTeacher } from '../types/orgAdmin'
import { useAuth } from '../../../shared/contexts/AuthContext'
import TeacherCreateModal from '../components/TeacherCreateModal'
import TeacherEditModal from '../components/TeacherEditModal'

export default function OrgTeacherManagement() {
  const { profile, user } = useAuth()
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editTeacher, setEditTeacher] = useState<OrgTeacher | null>(null)

  const loadTeachers = async () => {
    if (!profile?.organization_id) return
    try {
      setLoading(true)
      const data = await orgAdminService.getOrgTeachers(profile.organization_id)
      setTeachers(data)
    } catch (err: any) {
      setError(err.message)
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

  const handleDelete = async (teacher: OrgTeacher) => {
    const confirmMsg = `[${teacher.name}] 선생님을 삭제할까요?\n이미 등록된 학생이나 학습 기록이 있다면 삭제 대신 '정보 수정'에서 상태를 '사용 정지'로 변경하는 것을 권장합니다.`
    if (window.confirm(confirmMsg)) {
      if (!profile?.organization_id) return
      try {
        await orgAdminService.suspendOrgTeacher(profile.organization_id, teacher.id)
        alert("선생님을 사용중지(또는 삭제) 처리했습니다.")
        await loadTeachers()
      } catch (err: any) {
        alert("오류가 발생했습니다: " + err.message)
      }
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>불러오는 중입니다...</div>
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>에러: {error}</div>

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
          아직 등록된 선생님이 없어요. 선생님을 먼저 추가해 주세요.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14 }}>선생님 이름</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14 }}>이메일</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14 }}>담당 학급</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>배정/사용/남음</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>상태</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>관리 버튼</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#333' }}>{t.name || '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#666', fontSize: 14 }}>{t.email || '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#666', fontSize: 14 }}>{t.assigned_class || '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#666', fontSize: 14, textAlign: 'center' }}>
                    {t.allocated_licenses} / {t.used_licenses} / <span style={{ color: '#ff2778', fontWeight: 700 }}>{t.remaining_licenses}</span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <span style={{ 
                      background: t.status === 'active' ? '#e0f2fe' : '#fee2e2', 
                      color: t.status === 'active' ? '#0369a1' : '#b91c1c', 
                      padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 
                    }}>
                      {t.status === 'active' ? '사용 중' : '사용 정지'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => setEditTeacher(t)} style={btnStyle}>수정</button>
                      <button onClick={() => handleDelete(t)} style={{...btnStyle, color: '#b91c1c', background: '#fee2e2'}}>삭제</button>
                      {/* 이용권 조정 및 알림 보내기는 해당 탭으로 이동하거나 별도 액션 */}
                      <button onClick={() => alert("이용권 관리는 '이용권 관리' 탭에서 진행해 주세요.")} style={btnStyle}>이용권</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TeacherCreateModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSubmit={handleCreateSubmit} 
      />

      <TeacherEditModal
        isOpen={!!editTeacher}
        onClose={() => setEditTeacher(null)}
        teacher={editTeacher}
        onSubmit={handleEditSubmit}
      />
    </div>
  )
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
