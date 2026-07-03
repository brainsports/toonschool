import { useEffect, useState } from 'react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { middleAdminService } from '../services/middleAdminService'

export default function ClassManagement() {
  const { profile } = useAuth()
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) loadData()
  }, [profile])

  const loadData = async () => {
    setLoading(true)
    try {
      if (!profile) return
      // Placeholder for classes data, as classes table might not exist
      // In toonschool, classes are often represented by distinct class_names in students
      const students = await middleAdminService.getStudents(profile.id)
      
      const classMap = new Map<string, any>()
      students.forEach(s => {
        const key = `${s.organization_id}_${s.class_name}`
        if (!classMap.has(key)) {
          classMap.set(key, {
            id: key,
            org_name: s.org_name,
            grade_level: s.grade_level,
            class_name: s.class_name,
            teacher_name: s.teacher_name,
            student_count: 1,
            used_licenses: 0,
            remaining_licenses: 0
          })
        } else {
          classMap.get(key).student_count++
        }
      })
      
      setClasses(Array.from(classMap.values()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>로딩 중...</div>

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>학급 관리</h2>
      
      <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>기관명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>학년</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>학급명</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14 }}>학생 수</th>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {classes.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, color: '#334155' }}>{c.org_name}</td>
                <td style={{ padding: '16px 20px', color: '#64748b' }}>{c.grade_level}학년</td>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: '#1a1a2e' }}>{c.class_name}</td>
                <td style={{ padding: '16px 20px', color: '#64748b' }}>{c.student_count}명</td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <button style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                    보기
                  </button>
                </td>
              </tr>
            ))}
            {classes.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#888' }}>학급이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
