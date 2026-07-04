import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { Users, UserCheck } from 'lucide-react'

export default function UserManagement() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  
  // Form state
  const [role, setRole] = useState('teacher')
  const [orgId, setOrgId] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersData, orgsData] = await Promise.all([
        superAdminService.getPendingUsers(),
        superAdminService.getAllOrganizations()
      ])
      setPendingUsers(usersData)
      setOrganizations(orgsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAssignModal = (user: any) => {
    setSelectedUser(user)
    setRole('teacher')
    setOrgId('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if ((role === 'org_admin' || role === 'teacher') && !orgId) {
      alert('소속 기관을 선택해주세요.')
      return
    }

    try {
      await superAdminService.assignUserRole(
        selectedUser.id,
        role,
        (role === 'org_admin' || role === 'teacher') ? orgId : null,
        null
      )
      alert('승인 및 배정이 완료되었습니다.')
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      alert(`오류가 발생했습니다: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-[#6B4EFE]" />
          사용자 승인/권한 관리
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">승인 대기자 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">가입일</th>
                <th className="px-6 py-4 font-semibold">이름</th>
                <th className="px-6 py-4 font-semibold">이메일</th>
                <th className="px-6 py-4 font-semibold">현재 역할</th>
                <th className="px-6 py-4 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 text-gray-500">미지정</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openAssignModal(user)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#6B4EFE] bg-[#F4F2FF] rounded-lg hover:bg-[#EAE6FF] transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      역할/소속 배정
                    </button>
                  </td>
                </tr>
              ))}
              {pendingUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    승인 대기 중인 사용자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">역할 및 소속 배정</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대상자</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 text-sm">
                  {selectedUser.name} ({selectedUser.email})
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">역할 배정</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="teacher">선생님</option>
                  <option value="org_admin">기관관리자</option>
                  <option value="middle_admin">중간관리자</option>
                </select>
              </div>

              {(role === 'org_admin' || role === 'teacher') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">소속 기관 선택</label>
                  <select 
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                  >
                    <option value="">기관을 선택해주세요</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} (담당: {org.profiles?.name || '미지정'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
    </div>
  )
}
