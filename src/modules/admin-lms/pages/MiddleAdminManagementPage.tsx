import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import MiddleAdminCreateModal from '../components/MiddleAdminCreateModal'

export default function MiddleAdminManagementPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const data = await superAdminService.getMiddleAdmins()
      setAdmins(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>불러오는 중입니다...</div>
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: 'red' }}>에러: {error}</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', margin: 0 }}>중간관리자 관리</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: '#0056b3', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
        >
          + 중간관리자 추가
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        {admins.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
            등록된 중간관리자가 없습니다.
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ minWidth: '700px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <tr>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#666' }}>이름</th>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#666' }}>이메일</th>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#666' }}>배정된 기관 수</th>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#666' }}>상태</th>
                  <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#666' }}>생성일</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
                      {admin.name || '이름 없음'}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: '#555' }}>
                      {admin.email}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: '#555' }}>
                      {admin.assigned_orgs?.length || 0}개
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        {admin.assigned_orgs?.slice(0, 2).map((o: any) => o.name).join(', ')}
                        {(admin.assigned_orgs?.length || 0) > 2 ? ' ...' : ''}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: admin.status === 'active' ? '#e3fce1' : '#ffe1e1',
                        color: admin.status === 'active' ? '#0b821a' : '#c91414'
                      }}>
                        {admin.status === 'active' ? '정상' : '사용정지'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 14, color: '#888' }}>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MiddleAdminCreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadAdmins} 
      />
    </div>
  )
}
