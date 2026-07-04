import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import type { SuperDashboardStats } from '../services/superAdminService'
import {
  Users,
  Building2,
  Ticket,
  Bell,
  FileText,
  ShieldCheck
} from 'lucide-react'

export default function SuperDashboard() {
  const [stats, setStats] = useState<SuperDashboardStats | null>(null)
  const [middleAdmins, setMiddleAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [statsData, adminsData] = await Promise.all([
        superAdminService.getDashboardStats(),
        superAdminService.getMiddleAdmins()
      ])
      setStats(statsData)
      setMiddleAdmins(adminsData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">수퍼관리자 대시보드</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 중간관리자 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">중간관리자</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{stats?.middle_admins.total}</h3>
              <span className="text-xs text-green-600 font-medium">활성 {stats?.middle_admins.active}</span>
            </div>
          </div>
        </div>

        {/* 기관관리자 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">기관관리자</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{stats?.org_admins.total}</h3>
              {stats?.org_admins.pending ? (
                <span className="text-xs text-orange-500 font-medium">대기 {stats.org_admins.pending}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* 선생님 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">선생님</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900">{stats?.teachers.total}</h3>
              {stats?.teachers.pending ? (
                <span className="text-xs text-orange-500 font-medium">대기 {stats.teachers.pending}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* 이용권 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">전체 이용권</p>
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-gray-900">{stats?.licenses.total}</h3>
              <div className="text-xs text-gray-500 mt-1">
                사용: {stats?.licenses.used} | 남은 수: {stats?.licenses.remaining}
              </div>
            </div>
          </div>
        </div>

        {/* 알림 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">최근 30일 알림</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.notifications.recent_count}</h3>
          </div>
        </div>

        {/* 자료실 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-cyan-100 text-cyan-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">등록 자료 수</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.resources.total}</h3>
          </div>
        </div>
      </div>

      {/* 현재 중간관리자 현황 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">현재 중간관리자 현황</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">중간관리자명</th>
                <th className="px-6 py-3 font-medium">이메일</th>
                <th className="px-6 py-3 font-medium">배정 이용권</th>
                <th className="px-6 py-3 font-medium">사용기간</th>
                <th className="px-6 py-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {middleAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{admin.display_name}</td>
                  <td className="px-6 py-4 text-gray-500">{admin.profiles?.email}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{admin.license_total}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {admin.license_start ? new Date(admin.license_start).toLocaleDateString() : '-'} ~ 
                    {admin.license_end ? new Date(admin.license_end).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {admin.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                </tr>
              ))}
              {middleAdmins.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    등록된 중간관리자가 없습니다.
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
