import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Database, Layout, ShieldAlert, Users, Compass, BarChart3, ChevronRight, Play } from 'lucide-react'
import { geminiClient } from '../shared/lib/gemini'

export default function Dashboard() {
  const [geminiStatus, setGeminiStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const modules = [
    {
      name: '슈퍼관리자 (Super Admin)',
      path: '/super-admin',
      desc: '플랫폼 전체 설정 및 센터 관리',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-950/40 border-rose-900/50 hover:border-rose-800'
    },
    {
      name: '기관관리자 (Center Admin)',
      path: '/center-admin',
      desc: '개별 소속 기관 및 클래스/강사 관리',
      icon: Layout,
      color: 'text-amber-400 bg-amber-950/40 border-amber-900/50 hover:border-amber-800'
    },
    {
      name: '학생 대시보드 (Student)',
      path: '/student',
      desc: '학생 학습 진도 및 과제 제출함',
      icon: Users,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50 hover:border-emerald-800'
    },
    {
      name: '툰 제작 에디터 (Toon Editor)',
      path: '/toon',
      desc: '웹툰 레이아웃 및 캔버스 저작 도구',
      icon: Compass,
      color: 'text-sky-400 bg-sky-950/40 border-sky-900/50 hover:border-sky-800'
    },
    {
      name: '평가 분석 (Analytics)',
      path: '/analytics',
      desc: '학생 학업 성취도 및 역량 분석 리포트',
      icon: BarChart3,
      color: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/50 hover:border-indigo-800'
    }
  ]

  const testGemini = async () => {
    setIsLoading(true)
    setGeminiStatus('Gemini API 호출 중...')
    const result = await geminiClient.generateText('웹툰 교육 플랫폼 "툰스쿨"에 대해 한 줄 격려 메시지를 작성해 줘.')
    setGeminiStatus(result)
    setIsLoading(false)
  }

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-purple-400/20 pointer-events-none">
          <Sparkles className="h-40 w-40" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>프레임워크 초기화 성공</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            툰스쿨 <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">개발 시작</span>
          </h1>
          <p className="text-slate-300 leading-relaxed text-sm md:text-base">
            React + Vite + TypeScript 기반의 툰스쿨 개발 대시보드에 오신 것을 환영합니다.
            각 모듈의 라우팅 체계가 구현되었으며 아래 카드들을 통해 개별 모듈 페이지로 직접 이동할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Gemini API Test Widget */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Database className="h-4 w-4 text-purple-400" />
            <span>Gemini API 연동 테스트</span>
          </h3>
          <p className="text-xs text-slate-500">
            .env.local에 입력된 GEMINI_API_KEY를 사용하여 연결 상태를 즉석에서 확인합니다.
          </p>
          {geminiStatus && (
            <div className="mt-4 p-3 rounded-lg bg-slate-950 text-purple-300 text-xs font-mono leading-relaxed border border-purple-950 max-w-xl">
              {geminiStatus}
            </div>
          )}
        </div>
        <button
          onClick={testGemini}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>API 호출 테스트</span>
        </button>
      </div>

      {/* Module Navigation Grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-200">설계된 기능 모듈 대시보드</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <Link 
                key={m.path}
                to={m.path}
                className="p-5 rounded-2xl bg-slate-900/40 border border-slate-850 hover:bg-slate-900/80 transition-all hover:translate-x-1 group flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-11 w-11 rounded-xl border flex items-center justify-center shrink-0 ${m.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">{m.name}</h3>
                    <p className="text-slate-500 text-xs mt-1">{m.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-slate-400 shrink-0 self-center transition-colors" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
