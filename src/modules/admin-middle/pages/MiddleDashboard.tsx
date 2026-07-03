import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'
import type { MiddleDashboardStats, MiddleOrganization } from '../types/middleAdmin'

export default function MiddleDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<MiddleDashboardStats | null>(null)
  const [orgs, setOrgs] = useState<MiddleOrganization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadData()
    }
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!profile) return
      const [statsData, orgsData] = await Promise.all([
        middleAdminService.getDashboardStats(profile.id),
        middleAdminService.getOrganizations(profile.id)
      ])
      setStats(statsData)
      setOrgs(orgsData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>로딩 중...</div>
  }

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>중간관리자 대시보드</h2>

      {/* 요약 카드 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        <StatCard title="전체 테스트기관" value={stats?.totalOrgs || 0} color="#7c3aed" suffix="개" />
        <StatCard title="전체 이용권" value={stats?.totalLicenses || 0} color="#059669" suffix="개" />
        <StatCard title="사용한 이용권" value={stats?.usedLicenses || 0} color="#dc2626" suffix="개" />
        <StatCard title="남은 이용권" value={stats?.remainingLicenses || 0} color="#2563eb" suffix="개" />
        <StatCard title="전체 선생님" value={stats?.totalTeachers || 0} color="#d97706" suffix="명" />
        <StatCard title="전체 학생" value={stats?.totalStudents || 0} color="#db2777" suffix="명" />
        <StatCard title="전체 학급" value={stats?.totalClasses || 0} color="#4f46e5" suffix="개" />
      </div>

      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>테스트기관 현황</h3>
      
      {/* 표 영역 */}
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>테스트기관명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>전체 이용권</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>사용 이용권</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>남은 이용권</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>선생님 수</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>학생 수</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>학급 수</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                  등록된 테스트기관이 없습니다.
                </td>
              </tr>
            ) : (
              orgs.map(org => {
                const remaining = (org.total_licenses || 0) - (org.used_licenses || 0)
                return (
                  <tr key={org.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '16px 20px' }}>
                      <Link to={`/manager/organizations/${org.id}`} style={{ color: '#1a1a2e', fontWeight: 700, textDecoration: 'none' }}>
                        {org.name}
                      </Link>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#334155', fontWeight: 500 }}>{org.total_licenses || 0}</td>
                    <td style={{ padding: '16px 20px', color: '#dc2626', fontWeight: 600 }}>{org.used_licenses || 0}</td>
                    <td style={{ padding: '16px 20px', color: '#2563eb', fontWeight: 600 }}>{remaining}</td>
                    <td style={{ padding: '16px 20px', color: '#334155' }}>{org.teacher_count || 0}</td>
                    <td style={{ padding: '16px 20px', color: '#334155' }}>{org.student_count || 0}</td>
                    <td style={{ padding: '16px 20px', color: '#334155' }}>{org.class_count || 0}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <Link 
                        to={`/manager/organizations/${org.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '6px 16px',
                          background: '#eff6ff',
                          color: '#2563eb',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'background 0.2s'
                        }}
                      >
                        보기
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({ title, value, color, suffix }: { title: string, value: number | string, color: string, suffix: string }) {
  return (
    <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 600 }}>{suffix}</span>
      </div>
    </div>
  )
}
