import { useState } from 'react'
import { LineChart, Search, Eye, Sparkles } from 'lucide-react'

interface StudentProgress {
  id: string
  name: string
  loginId: string
  progress: number
  activeStep: string
  lastActive: string
  completed: boolean
}

export default function ProgressPage() {
  const [progressData] = useState<StudentProgress[]>([
    { id: '1', name: '김철수', loginId: 'happy001', progress: 75, activeStep: '3단계: 툰 구성 및 채색', lastActive: '3분 전', completed: false },
    { id: '2', name: '이영희', loginId: 'happy002', progress: 100, activeStep: '완료: 최종 제출 완료', lastActive: '1시간 전', completed: true },
    { id: '3', name: '박재민', loginId: 'happy003', progress: 20, activeStep: '1단계: 콘티 시나리오 작성', lastActive: '1일 전', completed: false },
    { id: '4', name: '윤지민', loginId: 'happy004', progress: 90, activeStep: '4단계: 퀴즈 매핑 구성', lastActive: '3시간 전', completed: false }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null)

  const filteredData = progressData.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.loginId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <LineChart className="h-4.5 w-4.5 text-amber-500" />
            <span>학생 개인별 수강 진도율 모니터링</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">클래스 학생들의 주차별 교육 과정 완료 상태와 실시간 마지막 활성 시각을 추적합니다.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="학생 이름 또는 아이디 검색..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-850 text-xs text-white placeholder-slate-655 focus:border-amber-600 outline-none"
          />
        </div>
      </div>

      {/* Progress Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-850 overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[650px]">
          <thead>
            <tr className="text-slate-500 border-b border-slate-850 pb-2">
              <th className="py-3 font-semibold">학생명 (ID)</th>
              <th className="py-3 font-semibold">진도율 (%)</th>
              <th className="py-3 font-semibold">현재 진행 중인 학습 단계</th>
              <th className="py-3 font-semibold">최근 학습 시각</th>
              <th className="py-3 font-semibold">완료 여부</th>
              <th className="py-3 font-semibold text-right">작업물</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredData.map((p) => (
              <tr key={p.id} className="text-slate-400">
                <td className="py-4">
                  <span className="font-bold text-slate-200">{p.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono ml-2">({p.loginId})</span>
                </td>
                <td className="py-4 font-bold text-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="w-8">{p.progress}%</span>
                    <div className="h-1.5 w-24 bg-slate-950 rounded-full overflow-hidden shrink-0">
                      <div 
                        className={`h-full transition-all duration-500 ${p.completed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-4 text-slate-350">{p.activeStep}</td>
                <td className="py-4">{p.lastActive}</td>
                <td className="py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.completed ? 'bg-emerald-950/60 text-emerald-450' : 'bg-slate-950 text-slate-500'}`}>
                    {p.completed ? '이수 완료' : '학습 진행'}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button
                    onClick={() => setSelectedStudent(p)}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-amber-900 text-slate-450 hover:text-amber-400 cursor-pointer inline-flex items-center gap-1.5 text-xxs font-bold"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>작업물 보기</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Work Modal Panel */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-amber-400" />
                <span>{selectedStudent.name} 학생의 만화 컷보드</span>
              </h3>
              <button 
                onClick={() => setSelectedStudent(null)}
                className="text-xs text-slate-500 hover:text-slate-350 cursor-pointer font-bold"
              >
                닫기
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-500">
                학생 ID: <span className="text-slate-300 font-mono">{selectedStudent.loginId}</span> | 
                진도율: <span className="text-amber-400 font-semibold">{selectedStudent.progress}%</span>
              </p>

              {/* Mock Student comic cuts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
                  <div className="h-28 rounded-lg bg-amber-950/10 border border-amber-900/20 flex items-center justify-center font-bold text-[9px] text-amber-500 uppercase">
                    1컷: 스토리 도입
                  </div>
                  <p className="text-[10px] text-slate-400 italic">"어느 날, 우주 비행사 철수가 화성에 내렸습니다."</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
                  <div className="h-28 rounded-lg bg-blue-950/10 border border-blue-900/20 flex items-center justify-center font-bold text-[9px] text-blue-500 uppercase">
                    2컷: 문제 발생
                  </div>
                  <p className="text-[10px] text-slate-400 italic">"어라? 우주선 연료가 바닥났어요! 어떻게 돌아가지?"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
