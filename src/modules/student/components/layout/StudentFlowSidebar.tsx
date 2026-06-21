import { Check } from 'lucide-react'

export type FlowStepKey = 'unit' | 'topic' | 'script' | 'frontCover' | 'comic' | 'full' | 'summary' | 'quiz' | 'backCover' | 'complete'

interface FlowStep {
  key: FlowStepKey
  label: string
  icon: string
}

const steps: FlowStep[] = [
  { key: 'unit', label: '어떤 공부 할까?', icon: '📚' },
  { key: 'topic', label: '무엇을 그릴까?', icon: '✨' },
  { key: 'script', label: '대본 만들기', icon: '📝' },
  { key: 'frontCover', label: '앞표지 만들기', icon: '📘' },
  { key: 'comic', label: '뚝딱 만화 만들기', icon: '💬' },
  { key: 'full', label: '모아보기', icon: '🖼️' },
  { key: 'summary', label: '알짜배기 정리', icon: '📝' },
  { key: 'quiz', label: '팡팡! 퀴즈', icon: '❓' },
  { key: 'backCover', label: '뒷표지 꾸미기', icon: '🎨' },
  { key: 'complete', label: '짜잔! 책 완성 👑', icon: '🏆' }
]

interface StudentFlowSidebarProps {
  currentStep: FlowStepKey
  completedSteps?: FlowStepKey[]
  theme?: 'light' | 'dark'
}

export default function StudentFlowSidebar({ currentStep, completedSteps = [], theme = 'light' }: StudentFlowSidebarProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  const isDark = theme === 'dark'

  return (
    <div className={`flex flex-col gap-2 w-full max-w-[200px] ${isDark ? 'bg-transparent p-4' : 'bg-transparent p-4'}`}>
      <div className="flex items-center justify-center gap-1.5 mb-2 px-2">
        <span className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-purple-300' : 'bg-purple-400'}`}></span>
        <h3 className={`text-xs font-jua tracking-wider ${isDark ? 'text-purple-300' : 'text-purple-500'}`}>
          작품 제작 흐름
        </h3>
      </div>
      
      <div className="flex flex-col gap-1.5">
        {steps.map((step, index) => {
          const isCurrent = step.key === currentStep
          const isCompleted = completedSteps.includes(step.key) || index < currentIndex
          const isUpcoming = !isCurrent && !isCompleted

          return (
            <div key={step.key} className="relative flex flex-col">
              <div className={`
                flex items-center gap-3 px-3 py-2.5 rounded-[1.25rem] transition-all relative z-10
                ${isCurrent 
                  ? (isDark ? 'bg-purple-600/50 text-white shadow-[0_0_15px_rgba(167,139,250,0.5)] border border-purple-400/50 scale-105 my-1' : 'bg-purple-500 text-white shadow-sm scale-105 my-1') 
                  : ''}
                ${isCompleted 
                  ? (isDark ? 'text-slate-300 bg-white/5 border border-white/10' : 'text-slate-600 bg-slate-50 border border-slate-100') 
                  : ''}
                ${isUpcoming 
                  ? (isDark ? 'text-slate-400 border border-transparent' : 'text-slate-400 border border-transparent') 
                  : ''}
              `}>
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0
                  ${isCurrent ? (isDark ? 'bg-white/10' : 'bg-white/20') : (isDark ? 'bg-white/5' : 'bg-white shadow-sm')}
                  ${isUpcoming ? 'opacity-75' : ''}
                `}>
                  {isCompleted && !isCurrent ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[4]" />
                  ) : (
                    <span className={isCurrent ? 'animate-bounce-gentle select-none' : 'select-none'}>{step.icon}</span>
                  )}
                </div>
                <span className={`text-base font-jua leading-snug break-keep ${isCurrent ? 'text-white' : ''}`}>
                  {step.label}
                </span>
              </div>
              
              {/* 연결선 */}
              {index < steps.length - 1 && (
                <div className="w-full flex justify-center py-1">
                  <div className={`w-1 h-3 rounded-full ${isCompleted ? (isDark ? 'bg-purple-400/50' : 'bg-purple-200') : (isDark ? 'bg-white/10' : 'bg-slate-100')}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
