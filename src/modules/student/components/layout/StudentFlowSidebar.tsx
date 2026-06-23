import { Check } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export type FlowStepKey = 'unit' | 'topic' | 'script' | 'frontCover' | 'comic' | 'summary' | 'quiz' | 'backCover' | 'viewer' | 'complete'

interface FlowStep {
  key: FlowStepKey
  label: string
  icon: string
  path?: string
}

const steps: FlowStep[] = [
  { key: 'unit', label: '단원 선택', icon: '📚', path: '/student/select-unit' },
  { key: 'topic', label: '주제 만들기', icon: '✨', path: '/student/topic' },
  { key: 'script', label: '대본 만들기', icon: '📝', path: '/student/script' },
  { key: 'frontCover', label: '표지만들기', icon: '📘', path: '/student/front-cover' },
  { key: 'comic', label: '만화제작', icon: '💬', path: '/student/comic/full' },
  { key: 'summary', label: '단원 정리', icon: '📝', path: '/student/unit-summary' },
  { key: 'quiz', label: '퀴즈만들기', icon: '❓', path: '/student/quiz/intro' },
  { key: 'backCover', label: '뒤표지 꾸미기', icon: '🎨', path: '/student/back-cover' },
  { key: 'viewer', label: '만화보기', icon: '🖼️', path: '/student/comic/read' }
]

interface StudentFlowSidebarProps {
  currentStep: FlowStepKey
  completedSteps?: FlowStepKey[]
  theme?: 'light' | 'dark'
}

export default function StudentFlowSidebar({ currentStep, completedSteps = [], theme = 'light' }: StudentFlowSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
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
              <div 
                onClick={() => {
                  if (step.path) {
                    navigate(step.path, { state: location.state })
                  }
                }}
                className={`
                flex items-center gap-3 px-3 py-2.5 rounded-[1.25rem] transition-all relative z-10
                ${step.path ? 'cursor-pointer hover:bg-white/10' : ''}
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
