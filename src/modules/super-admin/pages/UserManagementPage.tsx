import { useState } from 'react'
import { Users2, Search } from 'lucide-react'

interface UserAccount {
  id: string
  name: string
  email: string
  role: 'super_admin' | 'center_admin' | 'student' | 'free_user'
  plan: 'free' | 'premium'
  usage: number
  maxUsage: number
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>([
    { id: '1', name: '김철수', email: 'chulsoo@seocho-m.ms.kr', role: 'student', plan: 'free', usage: 2, maxUsage: 3 },
    { id: '2', name: '이영희', email: 'younghee@seocho-m.ms.kr', role: 'student', plan: 'free', usage: 3, maxUsage: 3 },
    { id: '3', name: '박민우 선생님', email: 'minwoo@seocho-m.ms.kr', role: 'center_admin', plan: 'premium', usage: 48, maxUsage: 500 },
    { id: '4', name: '홍길동', email: 'gildong@gmail.com', role: 'free_user', plan: 'free', usage: 1, maxUsage: 3 },
    { id: '5', name: '최재형 최고관리자', email: 'admin@toonschool.kr', role: 'super_admin', plan: 'premium', usage: 120, maxUsage: 9999 }
  ])

  const [searchQuery, setSearchQuery] = useState('')

  // Handle Updates
  const changeRole = (id: string, role: any) => {
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, role } : u))
    )
  }

  const changePlan = (id: string, plan: any) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const maxUsage = plan === 'premium' ? 500 : 3
          return { ...u, plan, maxUsage }
        }
        return u
      })
    )
  }

  // Filtered list
  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header section with Search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users2 className="h-4.5 w-4.5 text-rose-500" />
            <span>회원 계정 및 권한 총괄 관리</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">전체 가입자 현황 조회 및 계정 권한/플랜 상태 설정 페이지입니다.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름 또는 이메일 검색..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-850 text-xs text-white placeholder-slate-650 focus:border-rose-600 outline-none transition-all"
          />
        </div>
      </div>

      {/* Users directory table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-850 overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[700px]">
          <thead>
            <tr className="text-slate-500 border-b border-slate-850 pb-2">
              <th className="py-3 font-semibold">이름</th>
              <th className="py-3 font-semibold">이메일</th>
              <th className="py-3 font-semibold">계정 권한 (Role)</th>
              <th className="py-3 font-semibold">구독 플랜 (Plan)</th>
              <th className="py-3 font-semibold">월간 AI 사용량 (Tasks)</th>
              <th className="py-3 font-semibold text-right">보안 식별코드</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="text-slate-400">
                <td className="py-4 font-bold text-slate-200">{u.name}</td>
                <td className="py-4 font-mono text-[10px] text-slate-450">{u.email}</td>
                <td className="py-4">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value as any)}
                    className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-slate-350 text-[10px] outline-none focus:border-rose-600"
                  >
                    <option value="free_user">일반 무료회원 (free_user)</option>
                    <option value="student">학생 수강생 (student)</option>
                    <option value="center_admin">기관 관리자 (center_admin)</option>
                    <option value="super_admin">최고 관리자 (super_admin)</option>
                  </select>
                </td>
                <td className="py-4">
                  <select
                    value={u.plan}
                    onChange={(e) => changePlan(u.id, e.target.value as any)}
                    className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-slate-350 text-[10px] outline-none focus:border-rose-600"
                  >
                    <option value="free">FREE</option>
                    <option value="premium">PREMIUM</option>
                  </select>
                </td>
                <td className="py-4">
                  <div className="space-y-1 max-w-[120px]">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span>{u.usage} / {u.maxUsage === 9999 ? '무제한' : `${u.maxUsage}회`}</span>
                      <span>{Math.min(100, Math.round((u.usage / u.maxUsage) * 100))}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${u.usage >= u.maxUsage ? 'bg-rose-500' : 'bg-purple-500'}`} 
                        style={{ width: `${Math.min(100, (u.usage / u.maxUsage) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right font-mono text-[9px] text-slate-600 select-all">
                  USER-UID-00{u.id}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                  일치하는 회원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
