import { Check, Lock } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { projectStorage } from '../../utils/projectStorage'
import type { StudentUnitSelection } from '../../types/studentCurriculum'

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

// '창작' 과목일 때만 바뀌는 라벨 오버라이드. 교과 라벨은 그대로 유지.
const CREATIVE_LABEL_OVERRIDE: Partial<Record<FlowStepKey, string>> = {
  unit: '창작 설정',
  summary: '이야기 정리',
}

interface StudentFlowSidebarProps {
  currentStep: FlowStepKey
  completedSteps?: FlowStepKey[]
  theme?: 'light' | 'dark'
  orientation?: 'vertical' | 'horizontal'
}

export default function StudentFlowSidebar({ currentStep, completedSteps = [], orientation = 'vertical' }: StudentFlowSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  // 현재 작품이 '창작' 과목인지 판별. location.state 의 selection 또는
  // projectId 로 불러온 저장 단원 정보를 통해 알아낸다(각 페이지에서 별도 전달 불필요).
  const isCreative = useMemo(() => {
    const state = location.state as any
    if (state?.selection?.subjectName === '창작') return true
    const pid = state?.projectId
    if (pid) {
      try {
        const unit = projectStorage.loadUnit<StudentUnitSelection>(pid)
        if (unit?.subjectName === '창작') return true
      } catch {
        // 저장 읽기 실패 시 교과 라벨 유지
      }
    }
    return false
  }, [location.state])

  // 창작일 때만 라벨을 오버라이드한 단계 목록.
  const displaySteps = useMemo(
    () =>
      isCreative
        ? steps.map((s) =>
            CREATIVE_LABEL_OVERRIDE[s.key] ? { ...s, label: CREATIVE_LABEL_OVERRIDE[s.key]! } : s
          )
        : steps,
    [isCreative]
  )

  const currentIndex = displaySteps.findIndex(s => s.key === currentStep)

  return (
    <div className={`flex w-full h-full bg-transparent ${orientation === 'horizontal' ? 'flex-row items-center overflow-x-auto py-2 px-4 gap-2 no-scrollbar' : 'flex-col pt-3 pb-2 px-2 gap-0'}`}>
      {/* 헤더 */}
      {orientation === 'vertical' && (
        <div className="flex items-center gap-1.5 mb-3 px-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
          <h3 className="text-xs font-jua tracking-wider text-pink-500">
            작품 제작 흐름
          </h3>
        </div>
      )}

      <div className={`flex ${orientation === 'horizontal' ? 'flex-row items-center min-w-max' : 'flex-col'}`}>
        {displaySteps.map((step, index) => {
          const isCurrent   = step.key === currentStep
          const isCompleted = completedSteps.includes(step.key) || index < currentIndex
          const isUpcoming  = !isCurrent && !isCompleted

          return (
            <div key={step.key} className={`relative flex ${orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col'}`}>
              {/* 단계 pill */}
              <div
                onClick={() => {
                  if ((isCompleted || isCurrent) && step.path) {
                    navigate(step.path, { state: location.state })
                  }
                }}
                className={[
                  'flex items-center rounded-2xl transition-all relative z-10',
                  orientation === 'horizontal' ? 'px-3 py-1.5 mx-0.5 gap-2' : 'px-3 py-2.5 mx-1 gap-2.5',
                  isCurrent    ? `flow-step-current cursor-pointer shadow-md ${orientation === 'horizontal' ? 'scale-[1.02]' : 'scale-[1.03] my-0.5'}` : '',
                  isCompleted && !isCurrent ? 'flow-step-completed cursor-pointer hover:scale-[1.02]' : '',
                  isUpcoming   ? 'flow-step-upcoming cursor-default' : '',
                ].join(' ')}
              >
                {/* 아이콘 영역 */}
                <div className={[
                  'rounded-xl flex items-center justify-center text-sm shrink-0',
                  orientation === 'horizontal' ? 'w-6 h-6' : 'w-7 h-7',
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
                  'font-jua leading-snug break-keep whitespace-nowrap',
                  orientation === 'horizontal' ? 'text-[12px]' : 'text-[14px]',
                  isCurrent    ? 'text-white' : '',
                  isCompleted && !isCurrent ? 'text-purple-700' : '',
                  isUpcoming   ? 'text-gray-400' : '',
                  // 모바일 가로 모드에서는 현재 단계나 완료 단계만 텍스트를 보이고 나머지는 아이콘만 보이게 할 수도 있으나,
                  // 사용자가 "기능을 삭제하지 말 것"을 요구했으므로 텍스트 유지
                ].join(' ')}>
                  {index + 1} {step.label}
                </span>
              </div>

              {/* 점선 연결선 */}
              {index < steps.length - 1 && (
                <div className={`flex justify-center ${orientation === 'horizontal' ? 'px-1' : 'py-0.5 mx-1'}`}>
                  <div className={[
                    'border-dashed',
                    orientation === 'horizontal' ? 'w-3 border-t-2' : 'h-3 border-l-2',
                    isCompleted ? 'border-purple-200' : 'border-gray-200',
                  ].join(' ')}
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
