import { useEffect, useState } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import type { OrgTeacher, OrgDashboardStats } from '../types/orgAdmin'
import { useAuth } from '../../../shared/contexts/AuthContext'
import LicenseAdjustModal from '../components/LicenseAdjustModal'

type LoadError = 'NO_ORG' | 'LOAD_FAILED' | null

export default function OrgLicenseManagement() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState<OrgDashboardStats | null>(null)
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<LoadError>(null)

  const [adjustModal, setAdjustModal] = useState<{ isOpen: boolean, teacher: OrgTeacher | null, mode: 'allocate' | 'revoke' }>({
    isOpen: false,
    teacher: null,
    mode: 'allocate'
  })

  const loadData = async () => {
    if (!profile?.organization_id) {
      setError('NO_ORG')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const overview = await orgAdminService.getOrgLmsOverview(profile.organization_id)
      const [statsData, teachersData] = await Promise.all([
        orgAdminService.getOrgAdminDashboard(profile.organization_id),
        Promise.resolve((overview.teachers || []).map((teacher) => ({
          ...teacher,
          allocated_licenses: teacher.allocated_licenses || 0,
          used_licenses: teacher.used_licenses || 0,
          remaining_licenses: teacher.remaining_licenses || 0,
          student_count: teacher.student_count || 0,
          status: teacher.status || 'active',
          assigned_class: teacher.assigned_class || teacher.center_id || undefined
        })))
      ])
      setStats(statsData)
      setTeachers(teachersData)
    } catch (err) {
      console.error('[OrgLicenseManagement] loadData failed', err)
      setError('LOAD_FAILED')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile])

  const handleAdjustSubmit = async (teacherId: string, quantity: number, memo: string) => {
    if (!profile?.organization_id || !user) return
    if (adjustModal.mode === 'allocate') {
      await orgAdminService.allocateTeacherLicense(profile.organization_id, user.id, teacherId, quantity, memo)
    } else {
      await orgAdminService.revokeTeacherLicense(profile.organization_id, user.id, teacherId, quantity, memo)
    }
    await loadData()
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>불러오는 중입니다...</div>
  if (error === 'NO_ORG') return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>소속 기관 정보를 확인할 수 없습니다.</div>
  if (error === 'LOAD_FAILED' || !stats) return <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>이용권 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>이용권 관리</h1>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <SummaryCard label="기관 전체" value={stats.totalLicenses} />
        <SummaryCard label="선생님 배정" value={stats.allocatedLicenses} />
        <SummaryCard label="학생 사용" value={stats.usedLicenses} />
        <SummaryCard label="남은 이용권" value={stats.remainingLicenses} color="#ff2778" />
      </div>

      {teachers.length === 0 ? (
        <div style={{ background: 'white', padding: 60, borderRadius: 16, textAlign: 'center', color: '#888', border: '1px solid #eee' }}>
          이용권을 배정한 선생님이 아직 없어요.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={thStyle}>선생님 이름</th>
                <th style={thStyle}>담당 학급</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>배정 이용권</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>소속 학생 수</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>학생 사용 수</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>남은 수</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>사용률</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => {
                const usageRate = t.allocated_licenses > 0 ? Math.round((t.used_licenses / t.allocated_licenses) * 100) : 0
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: '#333' }}>{t.name || '-'}</td>
                    <td style={{ padding: '16px 20px', color: '#666', fontSize: 14 }}>{t.assigned_class || '미지정'}</td>
                    <td style={{ padding: '16px 20px', color: '#333', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{t.allocated_licenses}</td>
                    <td style={{ padding: '16px 20px', color: '#666', fontSize: 15, textAlign: 'center' }}>{t.student_count || 0}</td>
                    <td style={{ padding: '16px 20px', color: '#666', fontSize: 15, textAlign: 'center' }}>{t.used_licenses}</td>
                    <td style={{ padding: '16px 20px', color: '#ff2778', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{t.remaining_licenses}</td>
                    <td style={{ padding: '16px 20px', color: '#333', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{usageRate}%</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => setAdjustModal({ isOpen: true, teacher: t, mode: 'allocate' })}
                          style={{ ...btnStyle, background: '#e0f2fe', color: '#0369a1' }}
                        >추가 배정</button>
                        <button
                          onClick={() => setAdjustModal({ isOpen: true, teacher: t, mode: 'revoke' })}
                          style={{ ...btnStyle, background: '#fee2e2', color: '#b91c1c' }}
                        >회수</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <LicenseAdjustModal
        isOpen={adjustModal.isOpen}
        onClose={() => setAdjustModal(p => ({ ...p, isOpen: false }))}
        teacher={adjustModal.teacher}
        mode={adjustModal.mode}
        onSubmit={handleAdjustSubmit}
      />
    </div>
  )
}

function SummaryCard({ label, value, color = '#1a1a2e' }: { label: string, value: number, color?: string }) {
  return (
    <div style={{ flex: 1, background: 'white', padding: 20, borderRadius: 12, border: '1px solid #eee', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ fontSize: 13, color: '#666', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value.toLocaleString()}</div>
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
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
}