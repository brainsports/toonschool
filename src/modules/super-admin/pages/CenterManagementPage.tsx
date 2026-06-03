import { useState } from 'react'
import { Building2, Plus, ShieldCheck, ShieldAlert, Trash } from 'lucide-react'

interface Center {
  id: string
  name: string
  domain: string
  plan: '기관 전용' | '무료 플랜' | '프리미엄'
  status: '정상' | '정지'
  date: string
}

export default function CenterManagementPage() {
  const [centers, setCenters] = useState<Center[]>([
    { id: '1', name: '서초 미래중학교', domain: 'seocho-m.ms.kr', plan: '기관 전용', status: '정상', date: '2026-06-01' },
    { id: '2', name: '그린 IT 컴퓨터 아카데미', domain: 'green-academy.co.kr', plan: '기관 전용', status: '정상', date: '2026-05-28' },
    { id: '3', name: '대치 만화 아뜰리에', domain: 'daechi-toon.com', plan: '기관 전용', status: '정지', date: '2026-05-25' },
    { id: '4', name: '하늘 초등학교', domain: 'haneul.es.kr', plan: '무료 플랜', status: '정상', date: '2026-05-20' }
  ])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [newPlan, setNewPlan] = useState<'기관 전용' | '무료 플랜' | '프리미엄'>('기관 전용')

  // Actions
  const toggleStatus = (id: string) => {
    setCenters(prev =>
      prev.map(c => (c.id === id ? { ...c, status: c.status === '정상' ? '정지' : '정상' } : c))
    )
  }

  const changePlan = (id: string, plan: '기관 전용' | '무료 플랜' | '프리미엄') => {
    setCenters(prev =>
      prev.map(c => (c.id === id ? { ...c, plan } : c))
    )
  }

  const addCenter = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newDomain) return

    const newCenter: Center = {
      id: String(centers.length + 1),
      name: newName,
      domain: newDomain,
      plan: newPlan,
      status: '정상',
      date: new Date().toISOString().split('T')[0]
    }

    setCenters(prev => [...prev, newCenter])
    setNewName('')
    setNewDomain('')
    setIsModalOpen(false)
  }

  const deleteCenter = (id: string) => {
    setCenters(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header section with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="h-4.5 w-4.5 text-rose-500" />
            <span>교육 기관 (센터) 총괄 관리</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">툰스쿨 서비스를 도입한 학교 및 학원 관리 정보입니다.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>신규 기관 등록</span>
        </button>
      </div>

      {/* Main Centers List Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-850 overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[600px]">
          <thead>
            <tr className="text-slate-500 border-b border-slate-850 pb-2">
              <th className="py-3 font-semibold">기관명</th>
              <th className="py-3 font-semibold">연동 이메일 도메인</th>
              <th className="py-3 font-semibold">등록 일자</th>
              <th className="py-3 font-semibold">요금 플랜</th>
              <th className="py-3 font-semibold">이용 상태</th>
              <th className="py-3 font-semibold text-right">관리 작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {centers.map((c) => (
              <tr key={c.id} className="text-slate-400">
                <td className="py-4 font-bold text-slate-200">{c.name}</td>
                <td className="py-4 font-mono text-[10px] text-slate-500">{c.domain}</td>
                <td className="py-4">{c.date}</td>
                <td className="py-4">
                  <select
                    value={c.plan}
                    onChange={(e) => changePlan(c.id, e.target.value as any)}
                    className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-slate-350 text-[10px] outline-none focus:border-rose-600"
                  >
                    <option value="기관 전용">기관 전용</option>
                    <option value="프리미엄">프리미엄</option>
                    <option value="무료 플랜">무료 플랜</option>
                  </select>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.status === '정상' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/60 text-rose-400 border border-rose-900/30'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-4 text-right space-x-2">
                  <button
                    onClick={() => toggleStatus(c.id)}
                    className={`p-1.5 rounded-lg border text-xxs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                      c.status === '정상'
                        ? 'bg-rose-950/20 text-rose-455 border-rose-900/40 hover:bg-rose-900/30'
                        : 'bg-emerald-950/20 text-emerald-455 border-emerald-900/40 hover:bg-emerald-900/30'
                    }`}
                  >
                    {c.status === '정상' ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                    <span>{c.status === '정상' ? '정지' : '정상화'}</span>
                  </button>
                  <button
                    onClick={() => deleteCenter(c.id)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-rose-900 text-slate-500 hover:text-rose-400 cursor-pointer inline-flex items-center"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Center Modal Input Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form 
            onSubmit={addCenter}
            className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4 shadow-2xl relative"
          >
            <h3 className="font-bold text-slate-200 text-sm">신규 교육 기관 등록</h3>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">기관명</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 서울 디지털고등학교"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder-slate-600 focus:border-rose-600 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">이메일 도메인</label>
              <input
                type="text"
                required
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="예: seouldg.hs.kr"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder-slate-600 focus:border-rose-600 outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">요금제 형태</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white focus:border-rose-600 outline-none"
              >
                <option value="기관 전용">기관 전용 (기본)</option>
                <option value="프리미엄">프리미엄</option>
                <option value="무료 플랜">무료 플랜</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
              >
                등록하기
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
