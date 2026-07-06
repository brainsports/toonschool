import { useState, useEffect } from 'react'
import { FileText, Download, Calendar, AlertCircle } from 'lucide-react'
import { resourceService, type InboxResource } from '../services/resourceService'
import { useAuth } from '../../../shared/contexts/AuthContext'

export default function ResourceInbox() {
  const { profile } = useAuth()
  const [resources, setResources] = useState<InboxResource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.role) {
      fetchResources(profile.role)
    }
  }, [profile?.role])

  const fetchResources = async (role: string) => {
    try {
      setLoading(true)
      const data = await resourceService.getInboxResources(role)
      setResources(data)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-8 flex items-center justify-center">
        <div className="text-slate-400 font-medium animate-pulse">자료를 불러오는 중입니다...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-jua text-slate-800 tracking-wide flex items-center gap-2">
          <FileText className="w-8 h-8 text-purple-500" />
          자료실
        </h1>
        <p className="text-slate-500 mt-2 font-medium">관리자 선생님이 등록해주신 학습 자료를 확인하고 다운로드할 수 있어요.</p>
      </div>

      {resources.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-12 text-center border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
          <h3 className="text-lg font-jua text-slate-600">아직 등록된 자료가 없어요</h3>
          <p className="text-slate-400 mt-2">새로운 자료가 올라오면 이곳에서 확인할 수 있습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div 
              key={resource.id} 
              className="bg-white rounded-3xl p-6 border-2 border-slate-100 hover:border-purple-200 hover:shadow-lg transition-all duration-300 flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
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
                <div className="flex items-center text-slate-400 text-xs font-medium bg-slate-50 px-2 py-1 rounded-lg">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(resource.created_at)}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-tight">
                {resource.title}
              </h3>
              
              <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-1">
                {resource.description || '내용이 없습니다.'}
              </p>

              <button
                onClick={() => handleDownload(resource)}
                className="w-full bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white border-2 border-purple-100 hover:border-purple-600 transition-all duration-300 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 group-hover:shadow-md"
              >
                <Download className="w-5 h-5" />
                다운로드
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
