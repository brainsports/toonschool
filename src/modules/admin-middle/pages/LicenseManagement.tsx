import { useEffect, useState } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'

export default function LicenseManagement() {
  const { profile } = useAuth()
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>

  const totalAssigned = orgs.reduce((acc, o) => acc + (o.total_licenses || 0), 0)
  
  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>이용권 관리</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>전체 하위기관에 배정된 이용권</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#7c3aed', marginTop: 8 }}>{totalAssigned}개</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>기관명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>배정 이용권수</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>사용한 이용권수</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>남은 이용권수</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map(org => {
              const remaining = (org.total_licenses || 0) - (org.used_licenses || 0)
              return (
                <tr key={org.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1a1a2e' }}>{org.name}</td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{org.total_licenses || 0}</td>
                  <td style={{ padding: '16px 20px', color: '#dc2626', fontWeight: 600 }}>{org.used_licenses || 0}</td>
                  <td style={{ padding: '16px 20px', color: '#2563eb', fontWeight: 600 }}>{remaining}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
