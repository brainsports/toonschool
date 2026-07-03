import { useEffect, useState } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import type { OrgDashboardStats } from '../types/orgAdmin'
import { useAuth } from '../../../shared/contexts/AuthContext'

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

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>
        {stats.orgName} 대시보드
      </h1>

      {/* 만료 예정 안내 영역 */}
      <div style={{
        background: '#fff0f6',
        border: '1px solid #ffd6e7',
        borderRadius: 12,
        padding: '16px 24px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ff2778', margin: '0 0 4px 0' }}>안내</h3>
          <p style={{ margin: 0, fontSize: 14, color: '#666' }}>기관 이용권 만료 기간을 확인하고 필요시 연장해 주세요.</p>
        </div>
      </div>

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
