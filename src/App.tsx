import { useState } from 'react'
import { Sparkles, Database, Layout, TrendingUp, Code, Compass, ArrowRight } from 'lucide-react'

function App() {
  const [clickCount, setClickCount] = useState(0)

  const techStack = [
    { name: 'React + Vite', icon: Layout, desc: 'Fast, modern frontend scaffolding', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800' },
    { name: 'Supabase', icon: Database, desc: 'Backend Auth & Database', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' },
    { name: 'Gemini API', icon: Sparkles, desc: 'Advanced AI features integration', color: 'text-purple-400 bg-purple-950/40 border-purple-800' },
    { name: 'Tailwind CSS v4', icon: Code, desc: 'Utility-first modern styling', color: 'text-pink-400 bg-pink-950/40 border-pink-800' },
    { name: 'React Router v7', icon: Compass, desc: 'Declarative routing structure', color: 'text-red-400 bg-red-950/40 border-red-800' },
    { name: 'Recharts', icon: TrendingUp, desc: 'Interactive charts & data visualization', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-800' }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 md:p-12 font-sans selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Background blobs for premium look */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="font-bold text-white text-lg">TS</span>
          </div>
          <span className="font-bold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">TOONSCHOOL</span>
        </div>
        <a 
          href="https://github.com/brainsports/toonschool" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sm font-medium transition-all hover:scale-105"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl flex flex-col items-center text-center my-12 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>성공적으로 초기화됨</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 leading-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            툰스쿨
          </span>{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
            개발 시작
          </span>
        </h1>

        <p className="text-slate-400 text-lg max-w-2xl mb-8 leading-relaxed">
          React, Vite, Supabase, Tailwind CSS 및 Gemini API가 결합된 툰스쿨 개발 환경 세팅이 완료되었습니다. 이제 웹툰 기반의 인터랙티브 교육 플랫폼을 만들어보세요.
        </p>

        {/* Counter to satisfy dynamic design and interactions */}
        <div className="mb-12">
          <button 
            onClick={() => setClickCount(prev => prev + 1)}
            className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            클릭하여 상태 변경해보기
            <span className="ml-3 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-white/20 rounded-md group-hover:bg-white/30 transition-colors">
              {clickCount}
            </span>
          </button>
        </div>

        {/* Tech Stack Grid */}
        <div className="w-full text-left">
          <h2 className="text-xl font-bold text-slate-300 mb-6 flex items-center gap-2">
            <span>구성된 개발 스택</span>
            <ArrowRight className="h-4 w-4 text-slate-500" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {techStack.map((tech) => {
              const Icon = tech.icon
              return (
                <div 
                  key={tech.name}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/80 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center mb-4 ${tech.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-base text-slate-200 group-hover:text-white transition-colors">{tech.name}</h3>
                    <p className="text-slate-500 text-xs mt-1 leading-normal">{tech.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl text-center text-slate-600 text-xs mt-12 z-10 border-t border-slate-900 pt-6">
        <p>© 2026 ToonSchool Development Team. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
