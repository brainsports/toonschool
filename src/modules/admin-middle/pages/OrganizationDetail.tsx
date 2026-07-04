import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'
import type { MiddleOrganization } from '../types/middleAdmin'

export default function OrganizationDetail() {
  const { organizationId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  
  const [org, setOrg] = useState<MiddleOrganization | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('status')

  useEffect(() => {
    if (profile && organizationId) {
      loadOrgData()
    }
  }, [profile, organizationId])

  const loadOrgData = async () => {
    setLoading(true)
    try {
      if (!organizationId) return
      const data = await middleAdminService.getOrganizationDetail(organizationId)
      setOrg(data)
    } catch (error) {
      console.error('Error loading org detail:', error)
      alert('데이터를 불러오는데 실패했습니다.')
      navigate('/manager/organizations')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>
  if (!org) return <div style={{ padding: 40, textAlign: 'center' }}>기관 정보를 찾을 수 없습니다.</div>

  const remainingLicenses = (org.total_licenses || 0) - (org.used_licenses || 0)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/manager/organizations')}
          style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          ← 뒤로
        </button>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>{org.name}</h2>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <SummaryCard title="전체 이용권" value={org.total_licenses || 0} />
        <SummaryCard title="사용 이용권" value={org.used_licenses || 0} color="#dc2626" />
        <SummaryCard title="남은 이용권" value={remainingLicenses} color="#2563eb" />
        <SummaryCard title="선생님 수" value={org.teacher_count || 0} />
        <SummaryCard title="학생 수" value={org.student_count || 0} />
        <SummaryCard title="학급 수" value={org.class_count || 0} />
      </div>

      {/* 탭 네비게이션 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {[
          { id: 'status', label: '기관 현황' },
          { id: 'classes', label: '학급' },
          { id: 'teachers', label: '선생님' },
          { id: 'students', label: '학생' },
          { id: 'licenses', label: '이용권' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              background: activeTab === tab.id ? 'white' : 'transparent',
              border: 'none',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              fontSize: 15,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? '#7c3aed' : '#64748b',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '3px solid #7c3aed' : '3px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 내용 영역 */}
      <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', minHeight: 400 }}>
        {activeTab === 'status' && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>기관 상세 현황</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InfoRow label="기관명" value={org.name} />
                <InfoRow label="기관관리자 이름" value={org.manager_name || '미지정'} />
                <InfoRow label="기관관리자 이메일" value={org.manager_email || '-'} />
                <InfoRow label="최근 알림 발송일" value="-" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InfoRow label="전체 이용권" value={`${org.total_licenses || 0}개`} />
                <InfoRow label="사용 이용권" value={`${org.used_licenses || 0}개`} valueColor="#dc2626" />
                <InfoRow label="남은 이용권" value={`${remainingLicenses}개`} valueColor="#2563eb" />
                <InfoRow 
                  label="이용권 사용률" 
                  value={org.total_licenses ? `${Math.round(((org.used_licenses || 0) / org.total_licenses) * 100)}%` : '0%'} 
                />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'classes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>소속 학급 목록</h3>
              <span style={{ fontSize: 14, color: '#64748b' }}>총 {org.class_count || 0}개</span>
            </div>
            {org.class_count > 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
                학급 목록 데이터를 불러오는 중이거나 현재 화면에 표시할 수 있도록 준비 중입니다.
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>등록된 학급이 없습니다.</div>
            )}
          </div>
        )}
        {activeTab === 'teachers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>소속 선생님 목록</h3>
              <span style={{ fontSize: 14, color: '#64748b' }}>총 {org.teacher_count || 0}명</span>
            </div>
            {org.teacher_count > 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
                선생님 목록 데이터를 불러오는 중이거나 현재 화면에 표시할 수 있도록 준비 중입니다.
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>등록된 선생님이 없습니다.</div>
            )}
          </div>
        )}
        {activeTab === 'students' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>소속 학생 목록</h3>
              <span style={{ fontSize: 14, color: '#64748b' }}>총 {org.student_count || 0}명</span>
            </div>
            {org.student_count > 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
                학생 목록 데이터를 불러오는 중이거나 현재 화면에 표시할 수 있도록 준비 중입니다.
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>등록된 학생이 없습니다.</div>
            )}
          </div>
        )}
        {activeTab === 'licenses' && (
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>이용권 할당 이력</h3>
            <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 8 }}>
              이용권 할당 내역을 불러오고 있습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ title, value, color = '#1a1a2e' }: { title: string, value: number, color?: string }) {
  return (
    <div style={{ background: 'white', padding: '20px', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}

function InfoRow({ label, value, valueColor = '#1a1a2e' }: { label: string, value: string | number, valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f8fafc' }}>
      <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>{label}</span>
      <span style={{ color: valueColor, fontSize: 15, fontWeight: 700 }}>{value}</span>
    </div>
  )
}
