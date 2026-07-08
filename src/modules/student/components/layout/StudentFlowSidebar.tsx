import { Check, Lock } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export type FlowStepKey = 'unit' | 'topic' | 'script' | 'frontCover' | 'comic' | 'summary' | 'quiz' | 'backCover' | 'viewer' | 'complete'

interface FlowStep {
  key: FlowStepKey
  label: string
  icon: string
  path?: string
}

const steps: FlowStep[] = [
  { key: 'unit',       label: '단원 선택',    icon: '📚', path: '/student/select-unit' },
  { key: 'topic',      label: '주제 만들기',  icon: '✨', path: '/student/topic' },
  { key: 'script',     label: '대본 만들기',  icon: '📝', path: '/student/script' },
  { key: 'frontCover', label: '표지만들기',   icon: '📘', path: '/student/front-cover' },
  { key: 'comic',      label: '만화제작',     icon: '💬', path: '/student/comic/full' },
  { key: 'summary',    label: '단원 정리',    icon: '📝', path: '/student/unit-summary' },
  { key: 'backCover',  label: '뒤표지 꾸미기',icon: '🎨', path: '/student/back-cover' },
  { key: 'viewer',     label: '만화보기',     icon: '🖼️', path: '/student/comic/read' },
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
    <div className="flex flex-col gap-0 w-full h-full py-4 px-2 bg-transparent">
      {/* 헤더 */}
      <div className="flex items-center gap-1.5 mb-4 px-2">
        <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
        <h3 className="text-xs font-jua tracking-wider text-pink-500">
          작품 제작 흐름
        </h3>
      </div>

      <div className="flex flex-col">
        {steps.map((step, index) => {
          const isCurrent   = step.key === currentStep
          const isCompleted = completedSteps.includes(step.key) || index < currentIndex
          const isUpcoming  = !isCurrent && !isCompleted

          return (
            <div key={step.key} className="relative flex flex-col">
              {/* 단계 pill */}
              <div
                onClick={() => {
                  if ((isCompleted || isCurrent) && step.path) {
                    navigate(step.path, { state: location.state })
                  }
                }}
                className={[
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-2xl transition-all relative z-10 mx-1',
                  isCurrent    ? 'flow-step-current cursor-pointer scale-[1.03] my-0.5 shadow-md' : '',
                  isCompleted && !isCurrent ? 'flow-step-completed cursor-pointer hover:scale-[1.02]' : '',
                  isUpcoming   ? 'flow-step-upcoming cursor-default' : '',
                ].join(' ')}
              >
                {/* 아이콘 영역 */}
                <div className={[
                  'w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0',
                  isCurrent    ? 'bg-white/25' : '',
                  isCompleted && !isCurrent ? 'bg-purple-100' : '',
                  isUpcoming   ? 'bg-gray-200/60' : '',
                ].join(' ')}>
                  {isCompleted && !isCurrent ? (
                    <Check className="w-3.5 h-3.5 text-purple-600 stroke-[3.5]" />
                  ) : isUpcoming ? (
                    <Lock className="w-3 h-3 text-gray-400 stroke-[2.5]" />
                  ) : (
                    <span className={isCurrent ? 'animate-bounce-gentle select-none' : 'select-none'}>
                      {step.icon}
                    </span>
                  )}
                </div>

                {/* 텍스트 */}
                <span className={[
                  'text-[14px] font-jua leading-snug break-keep',
                  isCurrent    ? 'text-white' : '',
                  isCompleted && !isCurrent ? 'text-purple-700' : '',
                  isUpcoming   ? 'text-gray-400' : '',
                ].join(' ')}>
                  {index + 1} {step.label}
                </span>
              </div>

              {/* 점선 연결선 */}
              {index < steps.length - 1 && (
                <div className="flex justify-center py-0.5 mx-1">
                  <div className={[
                    'w-px border-l-2 border-dashed',
                    isCompleted ? 'border-purple-200' : 'border-gray-200',
                  ].join(' ')}
                    style={{ height: '12px' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
