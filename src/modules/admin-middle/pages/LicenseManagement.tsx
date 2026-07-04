import { useEffect, useState } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'
import OrgLicenseManageModal from '../components/OrgLicenseManageModal'
import type { MiddleOrganization } from '../types/middleAdmin'

const TOTAL_LICENSES = 500

export default function LicenseManagement() {
  const { profile } = useAuth()
  const [orgs, setOrgs] = useState<MiddleOrganization[]>([])
  const [loading, setLoading] = useState(true)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<MiddleOrganization | null>(null)

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!profile) return
      const orgsData = await middleAdminService.getOrganizations(profile.id)
      setOrgs(orgsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleManageClick = (org: MiddleOrganization) => {
    setSelectedOrg(org)
    setIsModalOpen(true)
  }

  const handleSaveLicense = async (orgId: string, data: { total_licenses: number, start_date: string, end_date: string, memo: string }) => {
    await middleAdminService.updateLicense(orgId, data)
    await loadData()
  }

  const getLicenseStatus = (start?: string | null, end?: string | null) => {
    if (!start || !end) return { text: '-', color: '#64748b', bg: '#f1f5f9' }
    const today = new Date()
    today.setHours(0,0,0,0)
    const startDate = new Date(start)
    startDate.setHours(0,0,0,0)
    const endDate = new Date(end)
    endDate.setHours(0,0,0,0)

    if (today < startDate) return { text: '대기', color: '#f59e0b', bg: '#fef3c7' }
    if (today > endDate) return { text: '만료', color: '#ef4444', bg: '#fee2e2' }
    
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 30) return { text: '만료 예정', color: '#ea580c', bg: '#ffedd5' }
    return { text: '사용 중', color: '#10b981', bg: '#d1fae5' }
  }

  const getRemainingDays = (end?: string | null) => {
    if (!end) return '-'
    const today = new Date()
    today.setHours(0,0,0,0)
    const endDate = new Date(end)
    endDate.setHours(0,0,0,0)
    
    if (today > endDate) return '만료됨'
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays}일 남음`
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>

  const usedLicenses = orgs.reduce((acc, o) => acc + (o.total_licenses || 0), 0)
  const remainingLicenses = TOTAL_LICENSES - usedLicenses

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>이용권 관리</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>전체 이용권</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', marginTop: 8 }}>{TOTAL_LICENSES}개</div>
        </div>
        <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>사용 이용권</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed', marginTop: 8 }}>{usedLicenses}개</div>
        </div>
        <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>남은 이용권</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#10b981', marginTop: 8 }}>{remainingLicenses}개</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>기관명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>배정 이용권</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>사용</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>남은 이용권</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>이용 시작일</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>이용 종료일</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>남은 기간</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>상태</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map(org => {
              const remaining = (org.total_licenses || 0) - (org.used_licenses || 0)
              const status = getLicenseStatus(org.license_start_date, org.license_end_date)
              return (
                <tr key={org.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1a1a2e' }}>{org.name}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{org.total_licenses || 0}</td>
                  <td style={{ padding: '16px 20px', color: '#dc2626', fontWeight: 600 }}>{org.used_licenses || 0}</td>
                  <td style={{ padding: '16px 20px', color: '#2563eb', fontWeight: 600 }}>{remaining}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{org.license_start_date ? org.license_start_date.replace(/-/g, '.') : '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{org.license_end_date ? org.license_end_date.replace(/-/g, '.') : '-'}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{getRemainingDays(org.license_end_date)}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      backgroundColor: status.bg, color: status.color
                    }}>
                      {status.text}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button 
                      onClick={() => handleManageClick(org)}
                      style={{ 
                        padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                        backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                    >
                      관리
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <OrgLicenseManageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        org={selectedOrg}
        onSave={handleSaveLicense}
      />
    </div>
  )
}
