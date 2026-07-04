import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { History } from 'lucide-react'

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const data = await superAdminService.getAuditLogs()
      setLogs(data)
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'ASSIGN_ROLE': return '권한 배정'
      case 'UPDATE_MIDDLE_ADMIN': return '중간관리자 수정'
      case 'DELETE_RESOURCE': return '자료 삭제'
      default: return action
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-7 h-7 text-[#6B4EFE]" />
          운영 로그
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">발생일시</th>
                <th className="px-6 py-4 font-semibold">수행자</th>
                <th className="px-6 py-4 font-semibold">작업 구분</th>
                <th className="px-6 py-4 font-semibold">대상</th>
                <th className="px-6 py-4 font-semibold">변경 내역</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {log.profiles?.name || log.profiles?.email || '시스템'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {getActionLabel(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-medium">
                    {log.target_table}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-mono max-w-xs overflow-hidden">
                    {log.action === 'ASSIGN_ROLE' && log.after_data && (
                      <div>역할: {log.after_data.role}</div>
                    )}
                    {log.action === 'UPDATE_MIDDLE_ADMIN' && log.after_data && (
                      <div>이용권: {log.after_data.license_total}개</div>
                    )}
                    {log.action === 'DELETE_RESOURCE' && (
                      <div>자료 ID: {log.target_id}</div>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    운영 로그가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
