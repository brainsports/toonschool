import { useEffect, useState } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import type { OrgDashboardStats } from '../types/orgAdmin'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { formatDate, getLicenseStatus } from '../utils/dateUtils'

export default function OrgAdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<OrgDashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStats() {
      if (!profile?.organization_id) return
      try {
        setLoading(true)
        const data = await orgAdminService.getOrgAdminDashboard(profile.organization_id)
        setStats(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [profile])

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>불러오는 중입니다...</div>
  }

  if (error || !stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>데이터를 불러올 수 없습니다. ({error})</div>
  }

  const licenseStatus = stats ? getLicenseStatus(stats.licenseStartDate, stats.licenseEndDate) : null
  const periodText = stats?.licenseStartDate && stats?.licenseEndDate 
    ? `${formatDate(stats.licenseStartDate)} ~ ${formatDate(stats.licenseEndDate)}` 
    : '기간 미설정'

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>
        {stats.orgName} 대시보드
      </h1>

      {/* 이용권 기간 안내 영역 */}
      {licenseStatus && (
        <div style={{
          background: licenseStatus.statusBg,
          border: `1px solid ${licenseStatus.statusColor}33`,
          borderRadius: 12,
          padding: '16px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: licenseStatus.statusColor, margin: 0 }}>기관 이용권 현황</h3>
              <span style={{ 
                background: licenseStatus.statusColor, 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: 12, 
                fontSize: 12, 
                fontWeight: 600 
              }}>
                {licenseStatus.statusText}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: '#444' }}>
              <span style={{ fontWeight: 600 }}>이용기간:</span> {periodText} 
              <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
              <span style={{ fontWeight: 600 }}>남은 기간:</span> {licenseStatus.remainingDaysText}
            </p>
          </div>
        </div>
      )}

      {/* 통계 카드 그리드 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <StatCard title="전체 이용권 수" value={stats.totalLicenses} color="#4f46e5" />
        <StatCard title="배정한 이용권 수" value={stats.allocatedLicenses} color="#059669" />
        <StatCard title="사용 중인 이용권 수" value={stats.usedLicenses} color="#ea580c" />
        <StatCard title="남은 이용권 수" value={stats.remainingLicenses} color="#ff2778" />
        
        <StatCard title="우리 기관 선생님" value={`${stats.teacherCount}명`} color="#1a1a2e" />
        <StatCard title="우리 기관 학생" value={`${stats.studentCount}명`} color="#1a1a2e" />
        <StatCard title="최근 보낸 알림" value={`${stats.recentNotificationCount}건`} color="#6b7280" />
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: { title: string, value: string | number, color: string }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      border: '1px solid #eee'
    }}>
      <div style={{ fontSize: 14, color: '#666', fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  )
}
