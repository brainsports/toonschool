import { NavLink, Outlet } from 'react-router-dom'
import { ShieldAlert, BarChart3, Building2, Users2, Settings } from 'lucide-react'

export default function SuperAdminLayout() {
  const adminLinks = [
    { name: '종합 대시보드', path: '/super-admin', end: true, icon: BarChart3 },
    { name: '기관(센터) 관리', path: '/super-admin/centers', end: false, icon: Building2 },
    { name: '회원 계정 관리', path: '/super-admin/users', end: false, icon: Users2 },
    { name: '요금제 정책 설정', path: '/super-admin/plans', end: false, icon: Settings }
  ]

  const activeTabStyle = 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-500/10 transition-all'
  const inactiveTabStyle = 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-450 hover:text-slate-200 text-xs font-semibold transition-all'

  return (
    <div className="space-y-6">
      {/* Top Banner indicating Super Admin context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/20 to-slate-900 border border-rose-950/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-950/50 border border-rose-900/50 flex items-center justify-center text-rose-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">슈퍼관리자 모드 (Super Admin Console)</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">전체 교육 기관, 회원 데이터베이스 제어 및 통합 분석 조회를 수행합니다.</p>
          </div>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-900 pb-4">
        {adminLinks.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              className={({ isActive }) => (isActive ? activeTabStyle : inactiveTabStyle)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.name}</span>
            </NavLink>
          )
        })}
      </div>

      {/* Sub Routing Page Target */}
      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  )
}
