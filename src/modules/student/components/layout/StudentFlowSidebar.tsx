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
  { key: 'backCover', label: '뒤표지 꾸미기', icon: '🎨', path: '/student/back-cover' },
  { key: 'viewer', label: '만화보기', icon: '🖼️', path: '/student/comic/read' }
]

interface StudentFlowSidebarProps {
  currentStep: FlowStepKey
  completedSteps?: FlowStepKey[]
  theme?: 'light' | 'dark'
}

export default function StudentFlowSidebar({ currentStep, completedSteps = [] }: StudentFlowSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const currentIndex = steps.findIndex(s => s.key === currentStep)


  return (
    <div className="flex flex-col gap-2 w-full h-full p-4 bg-transparent">
      <div className="flex items-center justify-center gap-1.5 mb-4 px-2">
        <span className="w-2 h-2 rounded-full animate-pulse bg-purple-400"></span>
        <h3 className="text-xs font-jua tracking-wider text-purple-400">
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
                ${step.path ? 'cursor-pointer hover:scale-[1.02]' : ''}
                ${isCurrent 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-[0_0_15px_rgba(167,139,250,0.4)] border border-purple-400/50 scale-105 my-1' 
                  : ''}
                ${isCompleted && !isCurrent
                  ? 'text-[#1f2433] bg-white border border-[#d9deea] shadow-sm' 
                  : ''}
                ${isUpcoming 
                  ? 'text-slate-400 bg-white/5 border border-transparent' 
                  : ''}
              `}>
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0
                  ${isCurrent ? 'bg-white/20' : ''}
                  ${isCompleted && !isCurrent ? 'bg-[#f3f4f7]' : ''}
                  ${isUpcoming ? 'bg-black/20 opacity-75' : ''}
                `}>
                  {isCompleted && !isCurrent ? (
                    <Check className="w-4 h-4 text-[#00c48c] stroke-[4]" />
                  ) : (
                    <span className={isCurrent ? 'animate-bounce-gentle select-none' : 'select-none'}>{step.icon}</span>
                  )}
                </div>
                <span className={`text-[15px] font-jua leading-snug break-keep ${isCurrent ? 'text-white' : ''}`}>
                  {index + 1} {step.label}
                </span>
              </div>
              
              {/* 연결선 */}
              {index < steps.length - 1 && (
                <div className="w-full flex justify-center py-1">
                  <div className={`w-1 h-3 rounded-full ${isCompleted ? 'bg-purple-400/50' : 'bg-white/10'}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
