import { Users, CheckCircle, GraduationCap, Clock, Sparkles, ClipboardList } from 'lucide-react'

export default function CenterAdminDashboard() {
  const stats = [
    { label: '클래스 소속 학생 수', value: '48 명', icon: Users, color: 'text-amber-400 border-amber-900/40 bg-amber-950/20' },
    { label: '진행 중인 학생', value: '42 명', icon: Clock, color: 'text-blue-400 border-blue-900/40 bg-blue-950/20' },
    { label: '완료한 학생', value: '6 명', icon: CheckCircle, color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
    { label: '학습 평균 진도율', value: '74 %', icon: GraduationCap, color: 'text-purple-400 border-purple-900/40 bg-purple-950/20' },
  ]

  const recentStudents = [
    { name: '김철수', id: 'happy001', lastLogin: '3분 전', status: '학습 중' },
    { name: '이영희', id: 'happy002', lastLogin: '1시간 전', status: '과제 완료' },
    { name: '민서연', id: 'happy012', lastLogin: '3시간 전', status: '학습 중' }
  ]

  const recentTasks = [
    { student: '김철수', title: '인공지능의 데이터 매핑 과정', cutCount: '3 컷', date: '10분 전' },
    { student: '민서연', title: '나만의 기와집 짓기 스토리', cutCount: '4 컷', date: '3시간 전' },
    { student: '박재민', title: '뉴턴의 3가지 운동 법칙 정리', cutCount: '3 컷', date: '1일 전' }
  ]

  const pendingEvaluations = [
    { name: '이영희', id: 'happy002', task: '과제 3: 기승전결 만화 뼈대', date: '2026-06-02' },
    { name: '윤지민', id: 'happy005', task: '과제 2: 캐릭터 드로잉 기초', date: '2026-05-30' }
  ]

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="p-5 rounded-xl bg-slate-900 border border-slate-850 flex flex-col justify-between min-h-[110px]">
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

      {/* Grid of lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Connected Students */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
          <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>최근 접속 학생</span>
          </h3>
          <div className="space-y-3">
            {recentStudents.map((s) => (
              <div key={s.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-350 text-xs">{s.name}</h4>
                  <span className="text-[9px] text-slate-500 font-mono">{s.id}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">{s.lastLogin}</p>
                  <span className="text-[9px] text-slate-500 font-semibold">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-4">
          <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span>최근 학생 작업물</span>
          </h3>
          <div className="space-y-3">
            {recentTasks.map((t, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 flex justify-between items-center">
                <div className="overflow-hidden pr-2">
                  <h4 className="font-bold text-slate-350 text-xs truncate">{t.title}</h4>
                  <span className="text-[9px] text-slate-500 font-medium">제출자: {t.student} ({t.cutCount})</span>
                </div>
                <span className="text-[9px] text-slate-500 shrink-0 font-medium">{t.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evaluation Pending Students */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-4 text-xs">
          <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-purple-400" />
            <span>평가 대기 학생</span>
          </h3>
          <div className="space-y-3">
            {pendingEvaluations.map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-350">{p.name} <span className="text-[9px] text-slate-500 font-mono">({p.id})</span></h4>
                  <span className="text-[9px] text-slate-500">{p.date}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug truncate">{p.task}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
