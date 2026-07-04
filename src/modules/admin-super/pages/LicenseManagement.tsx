import { useState, useEffect } from 'react'
import { superAdminService } from '../services/superAdminService'
import { Ticket, ShieldCheck, Building2 } from 'lucide-react'

export default function LicenseManagement() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [middleAdmins, setMiddleAdmins] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [orgsData, adminsData] = await Promise.all([
        superAdminService.getAllOrganizations(),
        superAdminService.getMiddleAdmins()
      ])
      setOrganizations(orgsData)
      setMiddleAdmins(adminsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  // Calculate totals
  const totalMiddleLicenses = middleAdmins.reduce((sum, admin) => sum + (admin.license_total || 0), 0)
  const totalOrgLicenses = organizations.reduce((sum, org) => sum + (org.total_licenses || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Ticket className="w-7 h-7 text-[#6B4EFE]" />
          이용권 관리
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">총 배정된 이용권 (중간관리자)</p>
          <h3 className="text-2xl font-bold text-[#6B4EFE] mt-1">{totalMiddleLicenses.toLocaleString()}개</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">기관 사용 중 (기관 배정 합계)</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalOrgLicenses.toLocaleString()}개</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 font-medium">잔여 이용권</p>
          <h3 className="text-2xl font-bold text-green-600 mt-1">{(totalMiddleLicenses - totalOrgLicenses).toLocaleString()}개</h3>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gray-500" />
            중간관리자별 배정 현황
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold">중간관리자명</th>
                <th className="px-6 py-3 font-semibold text-right">총 배정 수</th>
                <th className="px-6 py-3 font-semibold text-right">기관 배정 수 (사용)</th>
                <th className="px-6 py-3 font-semibold text-right">남은 수</th>
                <th className="px-6 py-3 font-semibold text-center">사용기간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {middleAdmins.map((admin) => {
                const used = organizations
                  .filter(o => o.middle_admin_id === admin.profile_id)
                  .reduce((sum, o) => sum + (o.total_licenses || 0), 0)
                const remaining = (admin.license_total || 0) - used
                
                return (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{admin.display_name}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{admin.license_total?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-right text-gray-500">{used.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-[#6B4EFE]">{remaining.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-gray-500 text-xs">
                      {admin.license_start ? new Date(admin.license_start).toLocaleDateString() : '-'} <br/>
                      ~ {admin.license_end ? new Date(admin.license_end).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                )
              })}
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mt-6">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-500" />
            기관별 배정 현황
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold">기관명</th>
                <th className="px-6 py-3 font-semibold">담당 중간관리자</th>
                <th className="px-6 py-3 font-semibold text-right">배정 이용권</th>
                <th className="px-6 py-3 font-semibold text-center">사용기간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{org.name}</td>
                  <td className="px-6 py-4 text-gray-500">{org.profiles?.name || '미지정'}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {org.total_licenses?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500 text-xs">
                    {org.license_start_date ? new Date(org.license_start_date).toLocaleDateString() : '-'} <br/>
                    ~ {org.license_end_date ? new Date(org.license_end_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {organizations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    등록된 기관이 없습니다.
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
