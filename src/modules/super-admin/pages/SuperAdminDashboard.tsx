import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts'
import { Building, Users, Sparkles, Share2 } from 'lucide-react'

export default function SuperAdminDashboard() {
  // Mock metrics
  const stats = [
    { label: '전체 기관 수', value: '24 개', icon: Building, color: 'text-amber-400 border-amber-900/40 bg-amber-950/20' },
    { label: '전체 회원 계정 수', value: '1,845 명', icon: Users, color: 'text-purple-400 border-purple-900/40 bg-purple-950/20' },
    { label: '수강 학생 수', value: '1,420 명', icon: Users, color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
    { label: 'AI 생성 작업 수', value: '4,820 회', icon: Sparkles, color: 'text-blue-400 border-blue-900/40 bg-blue-950/20' },
    { label: '배포 링크 수', value: '1,180 건', icon: Share2, color: 'text-pink-400 border-pink-900/40 bg-pink-950/20' }
  ]

  // Mock data for Recharts - Monthly AI Toon generation count
  const monthlyData = [
    { month: '1월', 생성수: 450, 배포수: 120 },
    { month: '2월', 생성수: 620, 배포수: 180 },
    { month: '3월', 생성수: 890, 배포수: 250 },
    { month: '4월', 생성수: 1240, 배포수: 380 },
    { month: '5월', 생성수: 1620, 배포수: 540 }
  ]

  // Mock data for Recharts - Paid vs Free distribution
  const ratioData = [
    { name: '무료 회원 (Free)', value: 865, color: '#6366f1' },
    { name: '유료 회원 (Premium)', value: 420, color: '#ec4899' },
    { name: '기관 전용 (Institution)', value: 560, color: '#f59e0b' }
  ]

  // Mock logs
  const recentCenters = [
    { name: '서초 미래중학교', domain: 'seocho-m.ms.kr', date: '2026-06-01', plan: '기관 전용', status: '정상' },
    { name: '그린 IT 컴퓨터 아카데미', domain: 'green-academy.co.kr', date: '2026-05-28', plan: '기관 전용', status: '정상' },
    { name: '대치 만화 아뜰리에', domain: 'daechi-toon.com', date: '2026-05-25', plan: '기관 전용', status: '정지' }
  ]

  const recentTasks = [
    { id: '108', user: 'studentA@seocho-m.ms.kr', type: 'AI 툰 생성', date: '5분 전', status: '성공' },
    { id: '107', user: 'tutorB@green-academy.co.kr', type: '시나리오 정리', date: '12분 전', status: '성공' },
    { id: '106', user: 'free_user_12@gmail.com', type: '퀴즈 생성', date: '45분 전', status: '오류' }
  ]

  return (
    <div className="space-y-8">
      {/* 1. Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="p-4 rounded-xl bg-slate-900 border border-slate-850 flex flex-col justify-between min-h-[110px]">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium">{s.label}</span>
                <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${s.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-100 mt-2">{s.value}</h3>
            </div>
          )
        })}
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">월별 학습툰 생성 및 링크 배포 추이</h3>
            <p className="text-xxs text-slate-500">인공지능 도구(만화/텍스트 정리/퀴즈)의 총 누적 생성 빈도입니다.</p>
          </div>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} />
                <YAxis stroke="#64748b" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                <Legend iconType="circle" />
                <Bar dataKey="생성수" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="배포수" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-200">전체 회원 등급별 점유율</h3>
            <p className="text-xxs text-slate-500">무료 플랜과 결제 요금제를 이용 중인 회원 비율입니다.</p>
          </div>
          <div className="h-44 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratioData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ratioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-500">전체 회원</span>
              <span className="text-base font-bold text-slate-200">1,845명</span>
            </div>
          </div>
          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-850">
            {ratioData.map((d) => (
              <div key={d.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-2 text-slate-400">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="text-slate-300 font-bold">{d.value}명</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Log lists (Tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent signup centers */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Building className="h-4 w-4 text-amber-400" />
            <span>최근 신규 등록 기관</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-850 pb-2">
                  <th className="py-2 font-semibold">기관명</th>
                  <th className="py-2 font-semibold">도메인</th>
                  <th className="py-2 font-semibold">요금제</th>
                  <th className="py-2 font-semibold text-right">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {recentCenters.map((c) => (
                  <tr key={c.name} className="text-slate-400">
                    <td className="py-3 font-semibold text-slate-250">{c.name}</td>
                    <td className="py-3 font-mono text-[10px]">{c.domain}</td>
                    <td className="py-3">{c.plan}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === '정상' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950 text-rose-400 border border-rose-900/30'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent task creations */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>최근 생성 작업 모니터링</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-850 pb-2">
                  <th className="py-2 font-semibold">계정 이메일</th>
                  <th className="py-2 font-semibold">작업 유형</th>
                  <th className="py-2 font-semibold">시간</th>
                  <th className="py-2 font-semibold text-right">결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {recentTasks.map((t) => (
                  <tr key={t.id} className="text-slate-400">
                    <td className="py-3 font-medium text-slate-250 truncate max-w-[140px]">{t.user}</td>
                    <td className="py-3">{t.type}</td>
                    <td className="py-3 text-slate-500">{t.date}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === '성공' ? 'text-emerald-450' : 'text-rose-450'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
