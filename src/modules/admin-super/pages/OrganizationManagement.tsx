import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { Building2, Plus } from 'lucide-react'

export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [middleAdmins, setMiddleAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [middleAdminId, setMiddleAdminId] = useState('')
  const [totalLicenses, setTotalLicenses] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [orgsData, adminsData] = await Promise.all([
        superAdminService.getAllOrganizations(),
        superAdminService.getMiddleAdmins()
      ])
      setOrganizations(orgsData)
      setMiddleAdmins(adminsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setName('')
    setAdminName('')
    setAdminEmail('')
    setAdminPassword('')
    setMiddleAdminId('')
    setTotalLicenses(0)
    setStartDate('')
    setEndDate('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!middleAdminId) {
      alert('담당 중간관리자를 선택해주세요.')
      return
    }

    try {
      await superAdminService.createOrganization({
        name,
        adminName,
        adminEmail,
        adminPassword,
        middleAdminId,
        totalLicenses,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString()
      })
      alert('기관이 생성되었습니다.')
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
          <Building2 className="w-7 h-7 text-[#6B4EFE]" />
          기관 관리
        </h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-xl hover:bg-[#5839F6] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          새 기관 추가
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">기관명</th>
                <th className="px-6 py-4 font-semibold">담당 중간관리자</th>
                <th className="px-6 py-4 font-semibold text-right">배정 이용권</th>
                <th className="px-6 py-4 font-semibold text-center">사용기간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{org.name}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {org.middle_admin?.display_name || org.middle_admin?.profile?.name || org.middle_admin?.profile?.email || '미지정'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {org.total_licenses?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500 text-xs">
                    {org.license_start_date ? new Date(org.license_start_date).toLocaleDateString() : '-'} <br/>
                    ~ {org.license_end_date ? new Date(org.license_end_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {organizations.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    등록된 기관이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">새 기관 추가</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기관명</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="예) 강남초등학교"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기관관리자 이름</label>
                <input 
                  type="text" 
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                  placeholder="예) 홍길동"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기관관리자 이메일</label>
                <input 
                  type="email" 
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  placeholder="예) admin@school.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">기관관리자 초기 비밀번호</label>
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="6자 이상 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당 중간관리자</label>
                <select 
                  value={middleAdminId}
                  onChange={(e) => setMiddleAdminId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="">중간관리자를 선택해주세요</option>
                  {middleAdmins.map((admin) => (
                    <option key={admin.id} value={admin.profile_id}>
                      {admin.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배정 이용권 수</label>
                <input 
                  type="number" 
                  min="0"
                  value={totalLicenses}
                  onChange={(e) => setTotalLicenses(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input 
                    type="date" 
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input 
                    type="date" 
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                  />
                </div>
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
                  기관 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
