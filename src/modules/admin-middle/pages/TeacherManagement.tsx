import { useEffect, useState } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'

export default function TeacherManagement() {
  const { profile } = useAuth()
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!profile) return
      const data = await middleAdminService.getTeachers(profile.id)
      setTeachers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>선생님 관리</h2>
      
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>기관명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>선생님명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>담당 학급</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>상태</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, color: '#334155' }}>{t.org_name}</td>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1a1a2e' }}>{t.name || t.email}</td>
                <td style={{ padding: '16px 20px', color: '#64748b' }}>{t.class_name}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{ 
                    padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: t.status === 'active' ? '#dcfce7' : '#f1f5f9',
                    color: t.status === 'active' ? '#166534' : '#475569'
                  }}>
                    {t.status === 'active' ? '사용중' : '대기/기타'}
                  </span>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#888' }}>선생님이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
