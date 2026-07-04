import { useEffect, useState } from 'react'
import { orgAdminService } from '../services/orgAdminService'
import type { OrgDashboardStats, OrgNotification } from '../types/orgAdmin'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { formatDate, getLicenseStatus } from '../utils/dateUtils'
import OrgTeacherNotificationModal from '../components/OrgTeacherNotificationModal'
import OrgStudentNotificationModal from '../components/OrgStudentNotificationModal'

export default function OrgAdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<OrgDashboardStats | null>(null)
  const [notifications, setNotifications] = useState<OrgNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher')
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)

  const loadData = async () => {
    if (!profile?.organization_id) return
    console.log("[OrgAdminDashboard] Current Login Profile:", profile)
    console.log("[OrgAdminDashboard] Current organization_id:", profile.organization_id)
    try {
      setLoading(true)
      const statsData = await orgAdminService.getOrgAdminDashboard(profile.organization_id)
      console.log("[OrgAdminDashboard] loadData - final statsData:", statsData)
      setStats(statsData)
      const notisData = await orgAdminService.getSentOrgNotifications(profile.organization_id, profile.id)
      setNotifications(notisData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [profile])

  const handleDelete = async (id: string) => {
    if (!profile?.organization_id) return
    if (!window.confirm("이 알림을 삭제하시겠습니까?")) return
    
    try {
      await orgAdminService.deleteOrgNotification(profile.organization_id, id)
      alert("삭제되었습니다.")
      loadData()
    } catch (err: any) {
      alert("삭제 실패: " + err.message)
    }
  }

  if (loading && !stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>불러오는 중입니다...</div>
  }

  if (error || !stats) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>데이터를 불러올 수 없습니다. ({error})</div>
  }

  const licenseStatus = stats ? getLicenseStatus(stats.licenseStartDate, stats.licenseEndDate) : null
  const periodText = stats?.licenseStartDate && stats?.licenseEndDate 
    ? `${formatDate(stats.licenseStartDate)} ~ ${formatDate(stats.licenseEndDate)}` 
    : '기간 미설정'

  const teacherNotis = notifications.filter(n => ['all', 'specific_teacher', 'all_teachers'].includes(n.target_type))
  const studentNotis = notifications.filter(n => ['all_students', 'specific_student', 'specific_class'].includes(n.target_type))

  const currentNotis = activeTab === 'teacher' ? teacherNotis : studentNotis

  const getTargetLabel = (type: string) => {
    switch(type) {
      case 'all': case 'all_teachers': return '전체 선생님'
      case 'specific_teacher': return '특정 선생님'
      case 'all_students': return '전체 학생'
      case 'specific_class': return '특정 선생님 학생'
      case 'specific_student': return '특정 학생'
      default: return type
    }
  }

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

      {/* 통계 카드 그리드 1 (이용권/사용자) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 20
      }}>
        <StatCard title="전체 이용권 수" value={stats.totalLicenses} color="#4f46e5" />
        <StatCard title="남은 이용권 수" value={stats.remainingLicenses} color="#ff2778" />
        <StatCard title="우리 기관 선생님" value={`${stats.teacherCount}명`} color="#1a1a2e" />
        <StatCard title="우리 기관 학생" value={`${stats.studentCount}명`} color="#1a1a2e" />
      </div>

      {/* 통계 카드 그리드 2 (알림) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <StatCard title="전체 알림 발송 수" value={`${stats.totalNotificationCount}건`} color="#6b7280" />
        <StatCard title="선생님 알림 수" value={`${stats.teacherNotificationCount}건`} color="#3b82f6" />
        <StatCard title="학생 알림 수" value={`${stats.studentNotificationCount}건`} color="#10b981" />
        <StatCard title="최근 발송일" value={stats.lastNotificationDate ? new Date(stats.lastNotificationDate).toLocaleDateString() : '-'} color="#6b7280" />
      </div>

      {/* 알림 관리 영역 */}
      <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>알림 관리</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={() => setIsTeacherModalOpen(true)}
              style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              + 선생님 알림 보내기
            </button>
            <button 
              onClick={() => setIsStudentModalOpen(true)}
              style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              + 학생 알림 보내기
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #eee', marginBottom: 20 }}>
          <button 
            onClick={() => setActiveTab('teacher')}
            style={{ 
              background: 'none', border: 'none', padding: '12px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'teacher' ? '#3b82f6' : '#888',
              borderBottom: activeTab === 'teacher' ? '3px solid #3b82f6' : '3px solid transparent'
            }}
          >
            선생님 알림
          </button>
          <button 
            onClick={() => setActiveTab('student')}
            style={{ 
              background: 'none', border: 'none', padding: '12px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              color: activeTab === 'student' ? '#10b981' : '#888',
              borderBottom: activeTab === 'student' ? '3px solid #10b981' : '3px solid transparent'
            }}
          >
            학생 알림
          </button>
        </div>

        {/* 리스트 */}
        {currentNotis.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', fontSize: 14 }}>
            알림 내역이 없습니다.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th style={{ padding: '12px 16px', color: '#666', fontSize: 13, fontWeight: 600 }}>제목</th>
                <th style={{ padding: '12px 16px', color: '#666', fontSize: 13, fontWeight: 600 }}>수신 대상</th>
                <th style={{ padding: '12px 16px', color: '#666', fontSize: 13, fontWeight: 600 }}>발송일</th>
                <th style={{ padding: '12px 16px', color: '#666', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {currentNotis.map(n => (
                <tr key={n.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '16px', color: '#1a1a2e', fontSize: 14, fontWeight: 600 }}>
                    {n.title.length > 20 ? n.title.substring(0, 20) + '...' : n.title}
                    <div style={{ fontSize: 12, color: '#888', fontWeight: 400, marginTop: 4 }}>
                      {n.message.length > 30 ? n.message.substring(0, 30) + '...' : n.message}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#444', fontSize: 13 }}>{getTargetLabel(n.target_type)}</td>
                  <td style={{ padding: '16px', color: '#666', fontSize: 13 }}>{new Date(n.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(n.id)}
                      style={{ padding: '6px 12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <OrgTeacherNotificationModal 
        isOpen={isTeacherModalOpen} 
        onClose={() => setIsTeacherModalOpen(false)} 
        onSuccess={loadData} 
      />
      <OrgStudentNotificationModal 
        isOpen={isStudentModalOpen} 
        onClose={() => setIsStudentModalOpen(false)} 
        onSuccess={loadData} 
      />
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
      <div style={{ fontSize: 24, fontWeight: 800, color: color }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </div>
  )
}
