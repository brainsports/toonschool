import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { Bell, Send, Trash2 } from 'lucide-react'
import ConfirmModal from '../../../shared/components/ConfirmModal'

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetRole, setTargetRole] = useState('all')
  const [priority, setPriority] = useState('normal')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await superAdminService.getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setTitle('')
    setContent('')
    setTargetRole('all')
    setPriority('normal')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await superAdminService.sendNotification({
        title,
        content,
        target_role: targetRole,
        priority
      })
      alert('알림이 발송되었습니다.')
      setIsModalOpen(false)
      fetchData()
    } catch (error: any) {
      alert(`오류가 발생했습니다: ${error.message}`)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await superAdminService.deleteNotification(deleteTarget.id)
      alert('알림이 삭제되었습니다.')
      fetchData()
    } catch (error: any) {
      alert(`알림 삭제 중 오류가 발생했습니다: ${error.message}`)
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-7 h-7 text-[#6B4EFE]" />
          알림 발송
        </h1>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#6B4EFE] rounded-xl hover:bg-[#5839F6] transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
          새 알림 보내기
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">발송일시</th>
                <th className="px-6 py-4 font-semibold">대상</th>
                <th className="px-6 py-4 font-semibold">중요도</th>
                <th className="px-6 py-4 font-semibold">제목</th>
                <th className="px-6 py-4 font-semibold">내용</th>
                <th className="px-6 py-4 font-semibold text-center w-24">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notifications.map((noti) => (
                <tr key={noti.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(noti.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">
                    {noti.target_type === 'all' ? '전체' :
                     noti.target_type === 'middle_admin' ? '전체 중간관리자' :
                     noti.target_type === 'org_admin' ? '전체 기관관리자' :
                     noti.target_type === 'teacher' ? '전체 선생님' : noti.target_type}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      noti.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      noti.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {noti.priority === 'urgent' ? '긴급' : noti.priority === 'high' ? '중요' : '일반'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{noti.title}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{noti.content}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setDeleteTarget(noti)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    발송된 알림이 없습니다.
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
              <h3 className="text-lg font-bold text-gray-900">새 알림 발송</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">발송 대상</label>
                  <select 
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                  >
                    <option value="all">전체 사용자</option>
                    <option value="middle_admin">전체 중간관리자</option>
                    <option value="org_admin">전체 기관관리자</option>
                    <option value="teacher">전체 선생님</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">중요도</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                  >
                    <option value="normal">일반</option>
                    <option value="high">중요</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="알림 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  placeholder="알림 내용을 입력하세요"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B4EFE] focus:border-[#6B4EFE] resize-none"
                />
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
                  <Send className="w-4 h-4" />
                  발송하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="알림 삭제"
        description="정말 이 알림을 삭제하시겠습니까?"
        confirmText="삭제"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
