import { useState } from 'react'
import { Settings, Save, CheckCircle2, Sliders, ToggleLeft, ToggleRight } from 'lucide-react'

interface PlanPolicy {
  key: string
  name: string
  monthlyTasks: number
  deployLinks: number
  maxStudents: number
  analytics: boolean
  watermark: boolean
}

export default function PlanManagementPage() {
  const [policies, setPolicies] = useState<PlanPolicy[]>([
    { key: 'free', name: 'Free Plan (무료 기본)', monthlyTasks: 3, deployLinks: 1, maxStudents: 0, analytics: false, watermark: true },
    { key: 'premium', name: 'Premium Plan (개인 유료)', monthlyTasks: 500, deployLinks: 50, maxStudents: 0, analytics: true, watermark: false },
    { key: 'institution', name: 'Institution Plan (기관 전용)', monthlyTasks: 5000, deployLinks: 1000, maxStudents: 500, analytics: true, watermark: false }
  ])

  const [notification, setNotification] = useState<string | null>(null)

  const handleSave = (key: string) => {
    const planName = policies.find(p => p.key === key)?.name
    setNotification(`${planName} 정책 설정이 성공적으로 저장되었습니다!`)
    setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  const updatePolicyField = (key: string, field: keyof PlanPolicy, value: any) => {
    setPolicies(prev =>
      prev.map(p => (p.key === key ? { ...p, [field]: value } : p))
    )
  }

  return (
    <div className="space-y-6">
      {/* Header section with Notification banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Settings className="h-4.5 w-4.5 text-rose-500" />
            <span>서비스 요금제 정책 세부 설정</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">요금제 등급별 AI 작업 횟수, 학생 한도, 워터마크 비활성화 권한을 관리합니다.</p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/40 text-emerald-450 text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Plan policies configuration panels */}
      <div className="space-y-6">
        {policies.map((p) => (
          <div key={p.key} className="p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-rose-400" />
                <span>{p.name}</span>
              </h3>
              <button
                onClick={() => handleSave(p.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition-all cursor-pointer"
              >
                <Save className="h-3 w-3" />
                <span>정책 저장</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold">월간 AI 작업 생성 수 제한</label>
                <input
                  type="number"
                  value={p.monthlyTasks}
                  onChange={(e) => updatePolicyField(p.key, 'monthlyTasks', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 font-mono focus:border-rose-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold">배포 링크 발행 최대 개수</label>
                <input
                  type="number"
                  value={p.deployLinks}
                  onChange={(e) => updatePolicyField(p.key, 'deployLinks', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 font-mono focus:border-rose-600 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold">클래스당 최대 학생 수 제한 (0인 경우 미지원)</label>
                <input
                  type="number"
                  value={p.maxStudents}
                  onChange={(e) => updatePolicyField(p.key, 'maxStudents', parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 font-mono focus:border-rose-600 outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-semibold">고급 학생 성취도 분석 대시보드</span>
                <button
                  type="button"
                  onClick={() => updatePolicyField(p.key, 'analytics', !p.analytics)}
                  className="text-rose-500 focus:outline-none"
                >
                  {p.analytics ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-slate-700" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-semibold">워터마크 출력 강제 여부 (활성화 시 만화에 로고 출력)</span>
                <button
                  type="button"
                  onClick={() => updatePolicyField(p.key, 'watermark', !p.watermark)}
                  className="text-rose-500 focus:outline-none"
                >
                  {p.watermark ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7 text-slate-700" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
