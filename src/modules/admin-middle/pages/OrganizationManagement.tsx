import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'
import type { MiddleOrganization } from '../types/middleAdmin'
import OrganizationFormModal from '../components/OrganizationFormModal'

export default function OrganizationManagement() {
  const { profile } = useAuth()
  const [orgs, setOrgs] = useState<MiddleOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<MiddleOrganization | undefined>(undefined)

  useEffect(() => {
    if (profile) loadOrgs()
  }, [profile])

  const loadOrgs = async () => {
    setLoading(true)
    try {
      if (!profile) return
      const orgsData = await middleAdminService.getOrganizations(profile.id)
      setOrgs(orgsData)
    } catch (error) {
      console.error('Error loading orgs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (orgId: string) => {
    if (!window.confirm('정말 이 테스트기관을 삭제하시겠습니까? 소속된 사용자가 있다면 실패할 수 있습니다. 가급적 수정에서 비활성화를 권장합니다.')) return
    
    try {
      await middleAdminService.deleteOrganization(orgId)
      alert('삭제되었습니다.')
      loadOrgs()
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>테스트기관 관리</h2>
        <button 
          onClick={() => { setSelectedOrg(undefined); setIsModalOpen(true) }}
          style={{ padding: '10px 20px', background: '#7c3aed', color: 'white', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          테스트기관 추가
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>테스트기관명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>전체 이용권</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>사용 이용권</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>상태</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                  등록된 테스트기관이 없습니다.
                </td>
              </tr>
            ) : (
              orgs.map(org => (
                <tr key={org.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <Link to={`/manager/organizations/${org.id}`} style={{ color: '#1a1a2e', fontWeight: 700, textDecoration: 'none' }}>
                      {org.name}
                    </Link>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#334155' }}>{org.total_licenses || 0}</td>
                  <td style={{ padding: '16px 20px', color: '#dc2626' }}>{org.used_licenses || 0}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: 20, 
                      fontSize: 12, 
                      fontWeight: 700,
                      background: org.status === 'active' ? '#dcfce7' : '#fee2e2',
                      color: org.status === 'active' ? '#166534' : '#991b1b'
                    }}>
                      {org.status === 'active' ? '사용중' : '비활성'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <Link 
                        to={`/manager/organizations/${org.id}`}
                        style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                      >
                        상세
                      </Link>
                      <button 
                        onClick={() => { setSelectedOrg(org); setIsModalOpen(true) }}
                        style={{ padding: '6px 12px', background: '#f3f4f6', color: '#4b5563', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDelete(org.id)}
                        style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && profile && (
        <OrganizationFormModal
          middleAdminId={profile.id}
          existingOrg={selectedOrg}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false)
            loadOrgs()
          }}
        />
      )}
    </div>
  )
}
