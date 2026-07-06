import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { Edit2, ShieldCheck, Ticket, Plus, Ban, Play, Trash2 } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'

export default function MiddleAdminManagement() {
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null)
  
  // Edit Form state
  const [licenseTotal, setLicenseTotal] = useState(0)
  const [licenseStart, setLicenseStart] = useState('')
  const [licenseEnd, setLicenseEnd] = useState('')
  const [status, setStatus] = useState('active')

  // Create Form state
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createLicenseTotal, setCreateLicenseTotal] = useState(0)
  const [createLicenseStart, setCreateLicenseStart] = useState('')
  const [createLicenseEnd, setCreateLicenseEnd] = useState('')
  const [createStatus, setCreateStatus] = useState('active')

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
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const data = await superAdminService.getMiddleAdmins()
      setAdmins(data)
    } catch (error) {
      console.error('Failed to fetch middle admins:', error)
      alert('중간관리자 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (admin: any) => {
    setSelectedAdmin(admin)
    setLicenseTotal(admin.license_total || 0)
    
    // Format dates to YYYY-MM-DD
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return d.toISOString().split('T')[0]
    }
    
    setLicenseStart(formatDate(admin.license_start))
    setLicenseEnd(formatDate(admin.license_end))
    setStatus(admin.status || 'active')
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setCreateName('')
    setCreateEmail('')
    setCreatePassword('')
    setCreateLicenseTotal(0)
    setCreateLicenseStart('')
    setCreateLicenseEnd('')
    setCreateStatus('active')
    setIsCreateModalOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAdmin) return

    setConfirmConfig({
      open: true,
      title: '이용권 정보를 변경하시겠습니까?',
      description: '변경된 이용권 수량과 사용기간이 즉시 반영됩니다.',
      confirmText: '변경하기',
      variant: 'warning',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.updateMiddleAdminLicense(
            selectedAdmin.id,
            licenseTotal,
            licenseStart ? new Date(licenseStart).toISOString() : new Date().toISOString(),
            licenseEnd ? new Date(licenseEnd).toISOString() : new Date().toISOString(),
            status
          )
          setIsModalOpen(false)
          fetchAdmins()
        } catch (error: any) {
          alert(error.message)
        } finally {
          setIsConfirming(false)
          closeConfirm()
        }
      }
    })
  }

  const handleStatusChange = (admin: any, newStatus: 'active' | 'inactive') => {
    const isSuspend = newStatus === 'inactive'
    setConfirmConfig({
      open: true,
      title: isSuspend ? '정말 이용을 정지하시겠습니까?' : '정말 이용을 재개하시겠습니까?',
      description: isSuspend ? '이 계정은 더 이상 서비스를 이용할 수 없습니다.' : '이 계정은 다시 서비스를 이용할 수 있습니다.',
      confirmText: isSuspend ? '이용정지' : '이용재개',
      variant: 'warning',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.updateMiddleAdminStatus(admin.id, newStatus)
          fetchAdmins()
        } catch (error: any) {
          alert(error.message)
        } finally {
          setIsConfirming(false)
          closeConfirm()
        }
      }
    })
  }

  const handleDelete = (admin: any) => {
    setConfirmConfig({
      open: true,
      title: '정말 삭제하시겠습니까?',
      description: '삭제된 데이터는 복구하기 어려울 수 있습니다.',
      confirmText: '삭제',
      variant: 'danger',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.deleteMiddleAdmin(admin.id)
          fetchAdmins()
        } catch (error: any) {
          alert(error.message)
        } finally {
          setIsConfirming(false)
          closeConfirm()
        }
      }
    })
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createEmail || !createPassword || !createName) {
      alert('이름, 이메일, 비밀번호를 모두 입력해 주세요.')
      return
    }

    try {
      setIsCreating(true)
      await superAdminService.createMiddleAdmin({
        name: createName,
        email: createEmail,
        password: createPassword,
        licenseTotal: createLicenseTotal,
        licenseStart: createLicenseStart ? new Date(createLicenseStart).toISOString() : new Date().toISOString(),
        licenseEnd: createLicenseEnd ? new Date(createLicenseEnd).toISOString() : new Date().toISOString(),
        status: createStatus
      })
      alert('신규 중간관리자가 성공적으로 추가되었습니다.')
      setIsCreateModalOpen(false)
      fetchAdmins()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-[#6B4EFE]" />
          중간관리자 관리
        </h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-xl hover:bg-[#5839F6] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          중간관리자 추가
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">이름</th>
                <th className="px-6 py-4 font-semibold">이메일</th>
                <th className="px-6 py-4 font-semibold text-center">상태</th>
                <th className="px-6 py-4 font-semibold text-right">배정 이용권</th>
                <th className="px-6 py-4 font-semibold text-center">사용기간</th>
                <th className="px-6 py-4 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{admin.profiles?.name || admin.display_name || '이름 없음'}</td>
                  <td className="px-6 py-4 text-gray-500">{admin.profiles?.email || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {admin.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {admin.license_total?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500 text-xs">
                    {admin.license_start ? new Date(admin.license_start).toLocaleDateString() : '-'} <br/>
                    ~ {admin.license_end ? new Date(admin.license_end).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(admin)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#6B4EFE] bg-[#F4F2FF] rounded-lg hover:bg-[#EAE6FF] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        설정
                      </button>
                      {admin.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(admin, 'inactive')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          이용정지
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(admin, 'active')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          이용재개
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(admin)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    등록된 중간관리자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">중간관리자 설정</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input 
                  type="text" 
                  value={selectedAdmin.profiles?.name || selectedAdmin.display_name || '이름 없음'} 
                  disabled 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input 
                  type="text" 
                  value={selectedAdmin.profiles?.email || '-'} 
                  disabled 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1">
                  <Ticket className="w-4 h-4 text-[#6B4EFE]" />
                  이용권 설정
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">배정 수량</label>
                    <input 
                      type="number" 
                      min="0"
                      value={licenseTotal}
                      onChange={(e) => setLicenseTotal(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                      <input 
                        type="date" 
                        required
                        value={licenseStart}
                        onChange={(e) => setLicenseStart(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                      <input 
                        type="date" 
                        required
                        value={licenseEnd}
                        onChange={(e) => setLicenseEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                      />
                    </div>
                  </div>
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
              <h3 className="text-lg font-bold text-gray-900">신규 중간관리자 추가</h3>
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
                  placeholder="예) 홍길동"
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
                  placeholder="admin@example.com"
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

              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1">
                  <Ticket className="w-4 h-4 text-[#6B4EFE]" />
                  초기 이용권 배정
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">배정 수량</label>
                    <input 
                      type="number" 
                      min="0"
                      value={createLicenseTotal}
                      onChange={(e) => setCreateLicenseTotal(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                      <input 
                        type="date" 
                        required
                        value={createLicenseStart}
                        onChange={(e) => setCreateLicenseStart(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                      <input 
                        type="date" 
                        required
                        value={createLicenseEnd}
                        onChange={(e) => setCreateLicenseEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                      />
                    </div>
                  </div>
                </div>
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
                  disabled={isCreating}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    isCreating ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6B4EFE] hover:bg-[#5839F6]'
                  }`}
                >
                  {isCreating ? '생성 중...' : '생성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Modal */}
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
