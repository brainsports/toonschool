import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { FileText, Plus, Trash2 } from 'lucide-react'

export default function ResourceManagement() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetRole, setTargetRole] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await superAdminService.getResources()
      setResources(data)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setTitle('')
    setDescription('')
    setTargetRole('all')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await superAdminService.createResource({
        title,
        description,
        target_role: targetRole,
        file_path: `/storage/dummy/${Date.now()}.pdf` // In a real app, upload file first
      })
      alert('자료가 등록되었습니다.')
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      alert(`오류가 발생했습니다: ${error.message}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 자료를 삭제하시겠습니까? (휴지통 이동)')) return
    
    try {
      await superAdminService.softDeleteResource(id)
      alert('삭제되었습니다.')
      fetchData()
    } catch (error: any) {
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-[#6B4EFE]" />
          자료실 관리
        </h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-xl hover:bg-[#5839F6] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          새 자료 등록
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">등록일</th>
                <th className="px-6 py-4 font-semibold">제목</th>
                <th className="px-6 py-4 font-semibold">설명</th>
                <th className="px-6 py-4 font-semibold">공개 대상</th>
                <th className="px-6 py-4 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{resource.title}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{resource.description}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {resource.target_role === 'all' ? '전체' :
                     resource.target_role === 'middle_admin' ? '중간관리자' :
                     resource.target_role === 'org_admin' ? '기관관리자' :
                     resource.target_role === 'teacher' ? '선생님' : resource.target_role}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="inline-flex items-center gap-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {resources.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    등록된 자료가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-900">새 자료 등록</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="자료 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="자료에 대한 간단한 설명을 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공개 대상</label>
                <select 
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="all">전체 사용자</option>
                  <option value="middle_admin">중간관리자 전용</option>
                  <option value="org_admin">기관관리자 전용</option>
                  <option value="teacher">선생님 전용</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">파일 (시뮬레이션)</label>
                <div className="w-full px-3 py-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-sm text-gray-500">
                  실제 파일 업로드는 Storage 연동 후 가능합니다. (현재 더미 데이터로 등록됨)
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-lg hover:bg-[#5839F6]"
                >
                  <Plus className="w-4 h-4" />
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
