import { BarChart3, TrendingUp, Award, Clock, ArrowUpRight } from 'lucide-react'

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b border-slate-850 pb-5">
        <div className="h-12 w-12 rounded-xl bg-indigo-950/40 border border-indigo-800 flex items-center justify-center text-indigo-400">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">평가 분석 대시보드 (Analytics)</h1>
          <p className="text-xs text-slate-500 mt-1">학생들의 성취 지표, 제출율, 창의성 분석 스코어 카드를 조회합니다.</p>
        </div>
      </div>

      {/* Analytics score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-3">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>평균 창의성 점수</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black text-slate-100">88.4점</h2>
            <span className="text-emerald-500 text-xxs font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +1.2
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-3">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>주간 평균 학습 시간</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black text-slate-100">5.4 시간</h2>
            <span className="text-emerald-500 text-xxs font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +0.8
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-3">
          <div className="flex justify-between items-center text-slate-500 text-xs">
            <span>과제 완수율</span>
            <BarChart3 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black text-slate-100">92.6%</h2>
            <span className="text-slate-500 text-xxs font-semibold flex items-center gap-0.5">
              +0.0
            </span>
          </div>
        </div>
      </div>

      {/* SVG Chart visualization for premium design feel */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-slate-200">주간 학습 진척도 추이</h3>
            <p className="text-xxs text-slate-500">최근 5주간 학생들이 만화 컷을 분할하고 말풍선을 삽입한 빈도 분석</p>
          </div>
          <div className="flex items-center gap-1.5 text-xxs text-slate-400 font-medium px-2.5 py-1 rounded bg-slate-950 border border-slate-850 cursor-pointer">
            <span>세부 리포트 다운로드</span>
            <ArrowUpRight className="h-3 w-3" />
          </div>
        </div>

        {/* Custom SVG Chart */}
        <div className="w-full h-48 bg-slate-950/60 rounded-xl border border-slate-900 p-4 flex flex-col justify-between">
          <svg className="w-full h-36" viewBox="0 0 500 120" preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="60" x2="500" y2="60" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

            {/* Gradient Area */}
            <defs>
              <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M 0,120 L 0,80 L 100,65 L 200,90 L 300,50 L 400,35 L 500,20 L 500,120 Z" fill="url(#chart-grad)" />

            {/* Line */}
            <path 
              d="M 0,80 L 100,65 L 200,90 L 300,50 L 400,35 L 500,20" 
              fill="none" 
              stroke="#6366f1" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />

            {/* Interactive Dots */}
            <circle cx="100" cy="65" r="4.5" fill="#6366f1" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="200" cy="90" r="4.5" fill="#6366f1" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="300" cy="50" r="4.5" fill="#6366f1" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="400" cy="35" r="4.5" fill="#6366f1" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="500" cy="20" r="4.5" fill="#6366f1" stroke="#0f172a" strokeWidth="1.5" />
          </svg>
          <div className="flex justify-between text-slate-500 font-mono text-[10px] px-2">
            <span>1주차</span>
            <span>2주차</span>
            <span>3주차</span>
            <span>4주차</span>
            <span>5주차</span>
          </div>
        </div>
      </div>
    </div>
  )
}
