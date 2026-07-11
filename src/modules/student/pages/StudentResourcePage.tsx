import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Calendar, Download, FileText, Trash2 } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import StudentPageShell from '../components/layout/StudentPageShell'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { resourceService, type InboxResource } from '../../resources/services/resourceService'

export default function StudentResourcePage() {
  const { profile } = useAuth()
  const [resources, setResources] = useState<InboxResource[]>([])
  const [hiddenResourceIds, setHiddenResourceIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmResource, setDeleteConfirmResource] = useState<InboxResource | null>(null)

  const hiddenStorageKey = `student-hidden-resources:${profile?.id ?? 'guest'}`

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(hiddenStorageKey)
      setHiddenResourceIds(saved ? JSON.parse(saved) : [])
    } catch {
      setHiddenResourceIds([])
    }
  }, [hiddenStorageKey])

  useEffect(() => {
    if (profile?.role) {
      fetchResources(profile.role)
    }
  }, [profile?.role])

  const visibleResources = useMemo(
    () => resources.filter((resource) => !hiddenResourceIds.includes(resource.id)),
    [hiddenResourceIds, resources]
  )

  const fetchResources = async (role: string) => {
    try {
      setLoading(true)
      const data = await resourceService.getInboxResources(role)
      setResources(data)
    } catch (error) {
      console.error('Failed to fetch student resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (resource: InboxResource) => {
    try {
      if (resource.file_url) {
        window.open(resource.file_url, '_blank')
        return
      }

      if (resource.file_path) {
        const url = await resourceService.getResourceDownloadUrl(resource.file_path)
        if (url) {
          window.open(url, '_blank')
        } else {
          alert('다운로드 링크를 만들 수 없어요.')
        }
        return
      }

      alert('다운로드할 파일이 없어요.')
    } catch (error) {
      console.error('Download error:', error)
      alert('다운로드 중 오류가 생겼어요.')
    }
  }

  const confirmHideResource = () => {
    if (!deleteConfirmResource) return

    const nextHiddenIds = Array.from(new Set([...hiddenResourceIds, deleteConfirmResource.id]))
    setHiddenResourceIds(nextHiddenIds)
    window.localStorage.setItem(hiddenStorageKey, JSON.stringify(nextHiddenIds))
    setDeleteConfirmResource(null)
  }

  const handleHideResource = (resource: InboxResource) => {
    setDeleteConfirmResource(resource)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <StudentPageShell activeTab="none" maxWidth="xl">
      <div className="flex-1 p-4 md:p-8 w-full max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-jua text-slate-800 tracking-wide flex items-center gap-2">
            <FileText className="w-8 h-8 text-purple-500" />
            자료실
          </h1>
          <p className="text-slate-500 mt-2 font-medium">선생님이 보내준 학습 자료를 확인하고 다운로드할 수 있어요.</p>
        </div>

        {loading ? (
          <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
            <div className="text-slate-400 font-medium animate-pulse">자료를 불러오는 중이에요...</div>
          </div>
        ) : visibleResources.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-md rounded-3xl p-12 text-center border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center">
            <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-jua text-slate-600">아직 볼 수 있는 자료가 없어요</h3>
            <p className="text-slate-400 mt-2">새 자료가 올라오면 이곳에서 확인할 수 있어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div className="flex gap-2 flex-wrap">
                    {resource.importance === 'urgent' && (
                      <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2.5 py-1 rounded-full">긴급</span>
                    )}
                    {resource.importance === 'important' && (
                      <span className="bg-amber-100 text-amber-600 text-xs font-bold px-2.5 py-1 rounded-full">중요</span>
                    )}
                    {resource.target_role === 'all' && (
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">공통</span>
                    )}
                  </div>
                  <div className="flex items-center text-slate-400 text-xs font-medium bg-slate-50 px-2 py-1 rounded-lg shrink-0">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(resource.created_at)}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-tight">{resource.title}</h3>

                <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-1">
                  {resource.description || '내용이 없어요.'}
                </p>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <button
                    onClick={() => handleDownload(resource)}
                    className="bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white border-2 border-purple-100 hover:border-purple-600 transition-all duration-300 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:shadow-md"
                  >
                    <Download className="w-5 h-5" />
                    다운로드
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHideResource(resource)}
                    className="w-12 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 border-2 border-slate-100 hover:border-rose-100 transition-all flex items-center justify-center"
                    title="자료 삭제"
                    aria-label="자료 삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteConfirmResource}
        title="자료 삭제"
        description="이 자료를 내 자료실에서 삭제할까요?"
        confirmText="삭제"
        onConfirm={confirmHideResource}
        onCancel={() => setDeleteConfirmResource(null)}
        variant="danger"
      />
    </StudentPageShell>
  )
}
