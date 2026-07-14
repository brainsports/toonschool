import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { FileText, Plus, Trash2, Download } from 'lucide-react'
import {
  RESOURCE_ROLE_ORDER,
  RESOURCE_ROLE_LABELS,
  AUDIENCE_PRESETS,
  normalizeResourceRoles,
  audienceSummary,
  deriveLegacyTargetRole,
} from '../../resources/services/resourceService'

// 프리셋과 현재 선택이 같은 역할 집합인지 비교
function sameRoleSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((r) => b.includes(r))
}

export default function ResourceManagement() {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetRoles, setTargetRoles] = useState<string[]>([...RESOURCE_ROLE_ORDER])
  const [status, setStatus] = useState('published')
  const [importance, setImportance] = useState('normal')
  const [file, setFile] = useState<File | null>(null)
  const [audienceError, setAudienceError] = useState<string | null>(null)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
    setTargetRoles([...RESOURCE_ROLE_ORDER]) // 기본값: 전체 사용자
    setStatus('published')
    setImportance('normal')
    setFile(null)
    setAudienceError(null)
    setIsEditing(false)
    setEditId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (resource: any) => {
    setTitle(resource.title)
    setDescription(resource.description || '')
    setTargetRoles(normalizeResourceRoles(resource)) // 기존 공개 대상 정확히 복원(target_roles 우선, 레거시 target_role 호환)
    setStatus(resource.status || 'published')
    setImportance(resource.importance || 'normal')
    setFile(null)
    setAudienceError(null)
    setIsEditing(true)
    setEditId(resource.id)
    setIsModalOpen(true)
  }

  const toggleRole = (code: string) => {
    setAudienceError(null)
    setTargetRoles((prev) => (prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]))
  }

  const applyPreset = (preset: { key: string; roles: string[] }) => {
    setAudienceError(null)
    setTargetRoles(preset.key === 'custom' ? [] : [...preset.roles])
  }

  const isPresetActive = (preset: { key: string; roles: string[] }, roles: string[]): boolean => {
    if (preset.key === 'custom') {
      // 어느 프리셋에도 해당하지 않으면 '직접 선택' 활성
      return !AUDIENCE_PRESETS.some((o) => o.key !== 'custom' && sameRoleSet(o.roles, roles))
    }
    return sameRoleSet(preset.roles, roles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 공개 대상 필수 검증(인라인 안내)
    if (targetRoles.length === 0) {
      setAudienceError('자료를 공개할 대상을 한 명 이상 선택해 주세요.')
      return
    }
    setAudienceError(null)

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

      // target_roles(복수, source of truth) + target_role(레거시 호환 파생값)
      const target_role = deriveLegacyTargetRole(targetRoles)

      if (isEditing && editId) {
        const updateData: any = {
          title,
          description,
          target_roles: targetRoles,
          target_role,
          status,
          importance,
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
          target_roles: targetRoles,
          target_role,
          status,
          importance,
          file_path: fileInfo.path,
          file_name: fileInfo.name,
          file_size: fileInfo.size,
          file_type: fileInfo.type,
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

  const confirmDelete = async () => {
    if (!deleteConfirmId) return

    try {
      setIsDeleting(true)
      await superAdminService.softDeleteResource(deleteConfirmId)
      fetchData()
      setDeleteConfirmId(null)
    } catch (error: any) {
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleDownload = async (resource: any) => {
    try {
      if (resource.file_url) {
        window.open(resource.file_url, '_blank')
        return
      }

      if (resource.file_path) {
        const url = await superAdminService.getResourceDownloadUrl(resource.file_path)
        if (url) {
          window.open(url, '_blank')
        } else {
          alert('다운로드 링크를 생성할 수 없습니다.')
        }
        return
      }

      alert('다운로드 가능한 파일 경로가 없습니다.')
    } catch (error: any) {
      console.error('Download error:', error)
      alert('다운로드 중 오류가 발생했습니다.')
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
              {resources.map((resource) => {
                const roles = normalizeResourceRoles(resource)
                const fullList = roles.map((r) => RESOURCE_ROLE_LABELS[r]).join(', ')
                return (
                  <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(resource.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{resource.title}</div>
                      <div className="text-xs text-gray-500">{resource.file_name}</div>
                    </td>
                    <td
                      className="px-6 py-4 text-gray-900 font-medium cursor-help"
                      title={roles.length > 0 ? `공개 대상: ${fullList}` : '공개 대상 없음'}
                    >
                      {audienceSummary(roles)}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {resource.status === 'draft' ? '임시저장' :
                       resource.status === 'published' ? '공개' : '보관'}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {resource.importance === 'urgent' ? <span className="text-red-500 font-bold">긴급</span> :
                       resource.importance === 'important' ? <span className="text-[#6B4EFE] font-bold">중요</span> : '일반'}
                    </td>
                    <td className="px-6 py-4 text-center flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEditModal(resource)}
                        className="inline-flex items-center gap-1 p-2 text-[#6B4EFE] hover:bg-[#6B4EFE]/10 rounded-lg transition-colors"
                        title="수정"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(resource)}
                        className="inline-flex items-center gap-1 p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="다운로드"
                      >
                        <Download className="w-4 h-4" />
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
                )
              })}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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

              {/* 공개 대상 — 복수 역할 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">공개 대상</label>
                {/* 빠른 선택 버튼 */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {AUDIENCE_PRESETS.map((preset) => {
                    const active = isPresetActive(preset, targetRoles)
                    return (
                      <button
                        type="button"
                        key={preset.key}
                        onClick={() => applyPreset(preset)}
                        className={
                          'px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ' +
                          (active
                            ? 'bg-[#6B4EFE] text-white border-[#6B4EFE]'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-[#6B4EFE] hover:text-[#6B4EFE]')
                        }
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
                {/* 역할 체크박스(칩) */}
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {RESOURCE_ROLE_ORDER.map((code) => {
                    const checked = targetRoles.includes(code)
                    return (
                      <label
                        key={code}
                        className={
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer select-none transition-colors ' +
                          (checked
                            ? 'bg-[#6B4EFE]/10 text-[#6B4EFE] border-[#6B4EFE]'
                            : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400')
                        }
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={checked}
                          onChange={() => toggleRole(code)}
                        />
                        <span className={'w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ' + (checked ? 'bg-[#6B4EFE] border-[#6B4EFE] text-white' : 'border-gray-400')}>
                          {checked ? '✓' : ''}
                        </span>
                        {RESOURCE_ROLE_LABELS[code]}
                      </label>
                    )
                  })}
                </div>
                {/* 요약 */}
                <div className="text-xs text-gray-500">
                  선택됨: {targetRoles.length > 0 ? `${audienceSummary(targetRoles)} (${targetRoles.length}개 역할)` : '없음'}
                </div>
                {audienceError && (
                  <div className="text-xs text-red-500 mt-1 font-medium">{audienceError}</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
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

      <ConfirmModal
        open={!!deleteConfirmId}
        title="자료 삭제"
        description="이 자료를 정말 삭제하시겠습니까? 첨부 파일도 함께 삭제될 수 있습니다."
        confirmText={isDeleting ? '삭제 중...' : '삭제'}
        onConfirm={confirmDelete}
        onCancel={() => !isDeleting && setDeleteConfirmId(null)}
        variant="danger"
        loading={isDeleting}
      />
    </div>
  )
}
