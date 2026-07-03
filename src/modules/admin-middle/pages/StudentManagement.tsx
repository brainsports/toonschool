import { useEffect, useState } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'

export default function StudentManagement() {
  const { profile } = useAuth()
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!profile) return
      const data = await middleAdminService.getStudents(profile.id)
      setStudents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>학생 관리</h2>
      
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>기관명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>학생명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>학년</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>학급</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>아이디</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, color: '#334155' }}>{s.org_name}</td>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1a1a2e' }}>{s.display_name}</td>
                <td style={{ padding: '16px 20px', color: '#64748b' }}>{s.grade_level}학년</td>
                <td style={{ padding: '16px 20px', color: '#64748b' }}>{s.class_name}</td>
                <td style={{ padding: '16px 20px', color: '#64748b' }}>{s.login_id}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#888' }}>학생이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
