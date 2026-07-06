import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { FileText, Plus, Trash2 } from 'lucide-react'

export default function ResourceManagement() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetRole, setTargetRole] = useState('all')
  const [status, setStatus] = useState('published')
  const [importance, setImportance] = useState('normal')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
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
    setStatus('published')
    setImportance('normal')
    setFile(null)
    setIsEditing(false)
    setEditId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (resource: any) => {
    setTitle(resource.title)
    setDescription(resource.description || '')
    setTargetRole(resource.target_role)
    setStatus(resource.status || 'published')
    setImportance(resource.importance || 'normal')
    setFile(null)
    setIsEditing(true)
    setEditId(resource.id)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!isEditing && !file) {
        alert('파일을 선택해주세요.')
        return
      }

      setLoading(true)

      let fileInfo = null
      if (file) {
        fileInfo = await superAdminService.uploadResourceFile(file)
      }

      if (isEditing && editId) {
        const updateData: any = {
          title,
          description,
          target_role: targetRole,
          status,
          importance
        }
        if (fileInfo) {
          updateData.file_path = fileInfo.path
          updateData.file_name = fileInfo.name
          updateData.file_size = fileInfo.size
          updateData.file_type = fileInfo.type
        }
        await superAdminService.updateResource(editId, updateData)
        alert('자료가 수정되었습니다.')
      } else if (fileInfo) {
        await superAdminService.createResource({
          title,
          description,
          target_role: targetRole,
          status,
          importance,
          file_path: fileInfo.path,
          file_name: fileInfo.name,
          file_size: fileInfo.size,
          file_type: fileInfo.type
        })
        alert('자료가 등록되었습니다.')
      }

      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      alert(`오류가 발생했습니다: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 자료를 삭제하시겠습니까?')) return
    
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
                <th className="px-6 py-4 font-semibold">제목/파일명</th>
                <th className="px-6 py-4 font-semibold">공개 대상</th>
                <th className="px-6 py-4 font-semibold">상태</th>
                <th className="px-6 py-4 font-semibold">중요도</th>
                <th className="px-6 py-4 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {resources.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{resource.title}</div>
                    <div className="text-xs text-gray-500">{resource.file_name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {resource.target_role === 'all' ? '전체' :
                     resource.target_role === 'middle_admin' ? '중간관리자' :
                     resource.target_role === 'org_admin' ? '기관관리자' :
                     resource.target_role === 'teacher' ? '선생님' : 
                     resource.target_role === 'student' ? '학생' : resource.target_role}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {resource.status === 'draft' ? '임시저장' :
                     resource.status === 'published' ? '공개' : '보관'}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {resource.importance === 'urgent' ? <span className="text-red-500 font-bold">긴급</span> :
                     resource.importance === 'important' ? <span className="text-[#6B4EFE] font-bold">중요</span> : '일반'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openEditModal(resource)}
                      className="inline-flex items-center gap-1 p-2 text-[#6B4EFE] hover:bg-[#6B4EFE]/10 rounded-lg transition-colors mr-2"
                      title="수정"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? '자료 수정' : '새 자료 등록'}
              </h3>
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

              <div className="grid grid-cols-2 gap-4">
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
                    <option value="student">학생 전용</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                  >
                    <option value="draft">임시저장 (비공개)</option>
                    <option value="published">공개</option>
                    <option value="archived">보관</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">중요도</label>
                <select 
                  value={importance}
                  onChange={(e) => setImportance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                >
                  <option value="normal">일반</option>
                  <option value="important">중요</option>
                  <option value="urgent">긴급</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  파일 {isEditing && '(변경시에만 선택)'}
                </label>
                <input 
                  type="file" 
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-lg hover:bg-[#5839F6] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {isEditing ? '수정하기' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
