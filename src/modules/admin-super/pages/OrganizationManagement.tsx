import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { Building2, Plus, Edit2, Ban, Play, Trash2 } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'

export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [middleAdmins, setMiddleAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [middleAdminId, setMiddleAdminId] = useState('')
  const [totalLicenses, setTotalLicenses] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Confirm Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean
    title: string
    description: string
    confirmText?: string
    variant?: 'warning' | 'danger' | 'default'
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {}
  })
  const [isConfirming, setIsConfirming] = useState(false)

  const closeConfirm = () => setConfirmConfig(prev => ({ ...prev, open: false }))

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

  const openEditModal = (org: any) => {
    setSelectedOrg(org)
    setName(org.name || '')
    setAdminName(org.org_admin?.name || '')
    setAdminEmail(org.org_admin?.email || '')
    setMiddleAdminId(org.middle_admin_id || '')
    setTotalLicenses(org.total_licenses || 0)
    
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      return d.toISOString().split('T')[0]
    }
    
    setStartDate(formatDate(org.license_start_date))
    setEndDate(formatDate(org.license_end_date))
    setIsEditModalOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrg) return
    if (!middleAdminId) {
      alert('담당 중간관리자를 선택해주세요.')
      return
    }

    setConfirmConfig({
      open: true,
      title: '기관 정보를 수정하시겠습니까?',
      description: '변경된 정보가 즉시 반영됩니다.',
      confirmText: '수정하기',
      variant: 'warning',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.updateOrganization({
            orgId: selectedOrg.id,
            name,
            adminUserId: selectedOrg.org_admin?.id,
            adminName,
            adminEmail,
            middleAdminId,
            totalLicenses,
            startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : new Date().toISOString()
          })
          setIsEditModalOpen(false)
          fetchData()
        } catch (error: any) {
          alert(`오류가 발생했습니다: ${error.message}`)
        } finally {
          setIsConfirming(false)
          closeConfirm()
        }
      }
    })
  }

  const handleStatusChange = (org: any, newStatus: 'active' | 'inactive' | 'suspended') => {
    const isSuspend = newStatus !== 'active'
    setConfirmConfig({
      open: true,
      title: isSuspend ? '정말 이 기관을 이용정지하시겠습니까?' : '정말 이 기관을 이용재개하시겠습니까?',
      description: isSuspend ? '이 기관 및 기관관리자는 더 이상 서비스를 이용할 수 없습니다.' : '이 기관은 다시 서비스를 이용할 수 있습니다.',
      confirmText: isSuspend ? '이용정지' : '이용재개',
      variant: 'warning',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.updateOrganizationStatus(org.id, newStatus)
          fetchData()
        } catch (error: any) {
          alert(error.message)
        } finally {
          setIsConfirming(false)
          closeConfirm()
        }
      }
    })
  }

  const handleDelete = (org: any) => {
    setConfirmConfig({
      open: true,
      title: '정말 이 기관을 삭제하시겠습니까?',
      description: '이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'danger',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.deleteOrganization(org.id)
          fetchData()
        } catch (error: any) {
          alert(error.message)
        } finally {
          setIsConfirming(false)
          closeConfirm()
        }
      }
    })
  }

  const formatToKoreanDate = (dateStr: string) => {
    if (!dateStr) return '미지정'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '미지정'
    return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
  }

  const renderModalForm = (isEdit: boolean) => {
    return (
      <>
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

        {!isEdit && (
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
        )}

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
              <option key={admin.id} value={admin.id}>
                {admin.display_name || admin.profiles?.name || admin.profiles?.email}
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
      </>
    )
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
                <th className="px-6 py-4 font-semibold whitespace-nowrap">기관명</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">기관관리자 이름</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">기관관리자 이메일</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">담당 중간관리자</th>
                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">상태</th>
                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">배정 이용권</th>
                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">사용 이용권</th>
                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">사용기간</th>
                <th className="px-6 py-4 font-semibold text-center whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{org.name || '미지정'}</td>
                  <td className="px-6 py-4 text-gray-500">{org.org_admin?.name || '미지정'}</td>
                  <td className="px-6 py-4 text-gray-500">{org.org_admin?.email || '미지정'}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {org.middle_admin?.display_name || org.middle_admin?.profile?.name || org.middle_admin?.profile?.email || '미지정'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      org.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {org.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {org.total_licenses?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-500">
                    {org.used_licenses?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500 text-xs whitespace-nowrap">
                    {formatToKoreanDate(org.license_start_date)} <br/>
                    ~ {formatToKoreanDate(org.license_end_date)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(org)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#6B4EFE] bg-[#F4F2FF] rounded-lg hover:bg-[#EAE6FF] transition-colors whitespace-nowrap"
                      >
                        <Edit2 className="w-4 h-4" />
                        설정
                      </button>
                      {org.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(org, 'suspended')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors whitespace-nowrap"
                        >
                          <Ban className="w-4 h-4" />
                          이용정지
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(org, 'active')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
                        >
                          <Play className="w-4 h-4" />
                          이용재개
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(org)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {organizations.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
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
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">새 기관 추가</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              {renderModalForm(false)}

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

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">기관 설정</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto">
              {renderModalForm(true)}

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
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

      <ConfirmModal
        open={confirmConfig.open}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={confirmConfig.confirmText}
        variant={confirmConfig.variant}
        loading={isConfirming}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />
    </div>
  )
}
