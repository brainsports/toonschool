import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { Edit2, Users, Plus, Building2 } from 'lucide-react'

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  
  // Edit Form state
  const [status, setStatus] = useState('active')

  // Create Form state
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createOrganizationId, setCreateOrganizationId] = useState('')
  const [createStatus, setCreateStatus] = useState('active')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [teachersData, orgsData] = await Promise.all([
        superAdminService.getTeachers(),
        superAdminService.getAllOrganizations()
      ])
      setTeachers(teachersData)
      setOrganizations(orgsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (teacher: any) => {
    setSelectedTeacher(teacher)
    setStatus(teacher.status || 'active')
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setCreateName('')
    setCreateEmail('')
    setCreatePassword('')
    setCreateOrganizationId('')
    setCreateStatus('active')
    setIsCreateModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return

    try {
      await superAdminService.updateTeacherStatus(selectedTeacher.id, status)
      alert('설정이 저장되었습니다.')
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createEmail || !createPassword || !createName || !createOrganizationId) {
      alert('이름, 이메일, 비밀번호, 소속 기관을 모두 입력 또는 선택해 주세요.')
      return
    }

    try {
      await superAdminService.createTeacher({
        name: createName,
        email: createEmail,
        password: createPassword,
        organization_id: createOrganizationId,
        status: createStatus
      })
      alert('신규 선생님이 성공적으로 추가되었습니다.')
      setIsCreateModalOpen(false)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-[#6B4EFE]" />
          선생님 관리
        </h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-xl hover:bg-[#5839F6] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          신규 선생님 추가
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">이름</th>
                <th className="px-6 py-4 font-semibold">이메일</th>
                <th className="px-6 py-4 font-semibold">담당 중간관리자</th>
                <th className="px-6 py-4 font-semibold">소속 기관</th>
                <th className="px-6 py-4 font-semibold text-center">상태</th>
                <th className="px-6 py-4 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{teacher.name || '이름 없음'}</td>
                  <td className="px-6 py-4 text-gray-500">{teacher.email || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{teacher.organization?.middle_admin_name || '-'}</td>
                  <td className="px-6 py-4 text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {teacher.organization?.name || '소속 없음'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {teacher.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openEditModal(teacher)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#6B4EFE] bg-[#F4F2FF] rounded-lg hover:bg-[#EAE6FF] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      설정
                    </button>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    등록된 선생님이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">선생님 상태 설정</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input 
                  type="text" 
                  value={selectedTeacher.name || '이름 없음'} 
                  disabled 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input 
                  type="text" 
                  value={selectedTeacher.email || '-'} 
                  disabled 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소속 기관</label>
                <input 
                  type="text" 
                  value={selectedTeacher.organization?.name || '-'} 
                  disabled 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태 (중단/활성)</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성 (중단)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-lg hover:bg-[#5839F6]"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">신규 선생님 추가</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input 
                  type="text" 
                  value={createName} 
                  onChange={(e) => setCreateName(e.target.value)}
                  required
                  placeholder="예) 김교사"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input 
                  type="email" 
                  value={createEmail} 
                  onChange={(e) => setCreateEmail(e.target.value)}
                  required
                  placeholder="teacher@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">초기 비밀번호</label>
                <input 
                  type="text" 
                  value={createPassword} 
                  onChange={(e) => setCreatePassword(e.target.value)}
                  required
                  placeholder="영문, 숫자 포함 8자 이상 권장"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소속 기관</label>
                <select 
                  value={createOrganizationId}
                  onChange={(e) => setCreateOrganizationId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="">기관을 선택해주세요</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.profiles?.name ? `(${org.profiles.name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select 
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-lg hover:bg-[#5839F6]"
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
