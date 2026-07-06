import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { Edit2, Users, Plus, Building2, Ticket, Ban, Play, Trash2 } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)
  
  // Edit Form state
  const [status, setStatus] = useState('active')
  const [licenseTotal, setLicenseTotal] = useState(0)
  const [licenseStart, setLicenseStart] = useState('')
  const [licenseEnd, setLicenseEnd] = useState('')

  // Create Form state
  const [createName, setCreateName] = useState('')
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createOrganizationId, setCreateOrganizationId] = useState('')
  const [createStatus, setCreateStatus] = useState('active')
  const [createLicenseTotal, setCreateLicenseTotal] = useState(0)
  const [createLicenseStart, setCreateLicenseStart] = useState('')
  const [createLicenseEnd, setCreateLicenseEnd] = useState('')

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
      const [teachersData, orgsData] = await Promise.all([
        superAdminService.getTeachers(),
        superAdminService.getAllOrganizations()
      ])
      // Filter out deleted teachers
      setTeachers(teachersData.filter(t => t.status !== 'deleted'))
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
    setLicenseTotal(teacher.allocated_licenses || 0)
    
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return d.toISOString().split('T')[0]
    }
    
    setLicenseStart(formatDate(teacher.license_start_date))
    setLicenseEnd(formatDate(teacher.license_end_date))
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setCreateName('')
    setCreateEmail('')
    setCreatePassword('')
    setCreateOrganizationId('')
    setCreateStatus('active')
    setCreateLicenseTotal(0)
    setCreateLicenseStart('')
    setCreateLicenseEnd('')
    setIsCreateModalOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return

    setConfirmConfig({
      open: true,
      title: '선생님 정보를 변경하시겠습니까?',
      description: '상태 및 배정 이용권 설정이 즉시 반영됩니다.',
      confirmText: '변경하기',
      variant: 'warning',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.updateTeacherStatus(selectedTeacher.id, status)
          await superAdminService.updateTeacherLicense(
            selectedTeacher.id,
            selectedTeacher.organization_id,
            licenseTotal,
            licenseStart ? new Date(licenseStart).toISOString() : new Date().toISOString(),
            licenseEnd ? new Date(licenseEnd).toISOString() : new Date().toISOString()
          )
          setIsModalOpen(false)
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
        status: createStatus,
        licenseTotal: createLicenseTotal,
        licenseStart: createLicenseStart ? new Date(createLicenseStart).toISOString() : null,
        licenseEnd: createLicenseEnd ? new Date(createLicenseEnd).toISOString() : null
      })
      alert('신규 선생님이 성공적으로 추가되었습니다.')
      setIsCreateModalOpen(false)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const handleStatusChange = (teacher: any, newStatus: 'active' | 'inactive') => {
    const isSuspend = newStatus === 'inactive'
    setConfirmConfig({
      open: true,
      title: isSuspend ? '정말 이 선생님의 이용을 정지하시겠습니까?' : '정말 이 선생님의 이용을 다시 시작하시겠습니까?',
      description: isSuspend ? '이 선생님 계정은 더 이상 서비스를 이용할 수 없습니다.' : '이 선생님 계정은 다시 서비스를 이용할 수 있습니다.',
      confirmText: isSuspend ? '이용정지' : '이용개시',
      variant: 'warning',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.updateTeacherStatus(teacher.id, newStatus)
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

  const handleDelete = (teacher: any) => {
    setConfirmConfig({
      open: true,
      title: '정말 이 선생님을 삭제하시겠습니까?',
      description: '이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      variant: 'danger',
      onConfirm: async () => {
        setIsConfirming(true)
        try {
          await superAdminService.deleteTeacher(teacher.id)
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
                <th className="px-6 py-4 font-semibold text-right">배정 이용권</th>
                <th className="px-6 py-4 font-semibold text-center">이용기간</th>
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
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {teacher.allocated_licenses?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500 text-xs">
                    {teacher.license_start_date ? new Date(teacher.license_start_date).toLocaleDateString() : '-'} <br/>
                    ~ {teacher.license_end_date ? new Date(teacher.license_end_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {teacher.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(teacher)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#6B4EFE] bg-[#F4F2FF] rounded-lg hover:bg-[#EAE6FF] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        설정
                      </button>
                      {teacher.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(teacher, 'inactive')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                          이용정지
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(teacher, 'active')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          이용개시
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(teacher)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
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
              <h3 className="text-lg font-bold text-gray-900">선생님 설정</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select 
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성 (중단)</option>
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
              <h3 className="text-lg font-bold text-gray-900">신규 선생님 추가</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                  className="px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-lg hover:bg-[#5839F6]"
                >
                  생성하기
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
