import { NavLink, Outlet } from 'react-router-dom'
import { GraduationCap, BarChart3, Users, LineChart, ShieldCheck } from 'lucide-react'

export default function CenterAdminLayout() {
  const adminLinks = [
    { name: '종합 대시보드', path: '/center-admin', end: true, icon: BarChart3 },
    { name: '학생 등록/관리', path: '/center-admin/students', end: false, icon: Users },
    { name: '학생 진도 조회', path: '/center-admin/progress', end: false, icon: LineChart },
    { name: '학업 평가 세팅', path: '/center-admin/evaluation', end: false, icon: ShieldCheck }
  ]

  const activeTabStyle = 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-650 text-white text-xs font-semibold shadow-md shadow-amber-500/10 transition-all'
  const inactiveTabStyle = 'flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-850 text-slate-450 hover:text-slate-200 text-xs font-semibold transition-all'

  return (
    <div className="space-y-6">
      {/* Top Banner indicating Center Admin context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/20 to-slate-900 border border-amber-950/30">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-400">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">기관관리자 모드 (Center Admin Console)</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">소속 학생 정보 등록, 주차별 만화 진도 조회 및 학업 발달 피드백을 작성합니다.</p>
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
