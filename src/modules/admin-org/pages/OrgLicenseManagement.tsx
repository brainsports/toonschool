import { useEffect, useState } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import type { OrgTeacher, OrgDashboardStats } from '../types/orgAdmin'
import { useAuth } from '../../../shared/contexts/AuthContext'
import LicenseAdjustModal from '../components/LicenseAdjustModal'

export default function OrgLicenseManagement() {
  const { profile, user } = useAuth()
  const [stats, setStats] = useState<OrgDashboardStats | null>(null)
  const [teachers, setTeachers] = useState<OrgTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [adjustModal, setAdjustModal] = useState<{ isOpen: boolean, teacher: OrgTeacher | null, mode: 'allocate' | 'revoke' }>({
    isOpen: false, teacher: null, mode: 'allocate'
  })

  const loadData = async () => {
    if (!profile?.organization_id) return
    try {
      setLoading(true)
      const [statsData, teachersData] = await Promise.all([
        orgAdminService.getOrgAdminDashboard(profile.organization_id),
        orgAdminService.getOrgTeachers(profile.organization_id)
      ])
      setStats(statsData)
      setTeachers(teachersData)
    } catch (err: any) {
      setError(err.message)
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
  if (error || !stats) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>에러: {error}</div>

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>이용권 관리</h1>

      {/* 이용권 요약 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <SummaryCard label="기관 전체" value={stats.totalLicenses} />
        <SummaryCard label="선생님 배정" value={stats.allocatedLicenses} />
        <SummaryCard label="학생 사용" value={stats.usedLicenses} />
        <SummaryCard label="남은 이용권" value={stats.remainingLicenses} color="#ff2778" />
      </div>

      {teachers.length === 0 ? (
        <div style={{ background: 'white', padding: 60, borderRadius: 16, textAlign: 'center', color: '#888', border: '1px solid #eee' }}>
          이용권을 배정한 선생님이 아직 없어요. 선생님 메뉴에서 추가해 주세요.
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14 }}>선생님 이름</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14 }}>담당 학급</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>현재 배정 수량</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>학생 사용 수량</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>선생님 보유 잔여</th>
                <th style={{ padding: '16px 20px', fontWeight: 600, color: '#555', fontSize: 14, textAlign: 'center' }}>변경 버튼</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: '#333' }}>{t.name || '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#666', fontSize: 14 }}>{t.assigned_class || '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#333', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{t.allocated_licenses}</td>
                  <td style={{ padding: '16px 20px', color: '#666', fontSize: 15, textAlign: 'center' }}>{t.used_licenses}</td>
                  <td style={{ padding: '16px 20px', color: '#ff2778', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{t.remaining_licenses}</td>
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
              ))}
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

const btnStyle = {
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer'
}
