import type { ReactNode } from 'react'
import StudentPageShell from './StudentPageShell'
import StudentFlowSidebar, { type FlowStepKey } from './StudentFlowSidebar'

interface StudentCreationLayoutProps {
  currentStep: FlowStepKey
  completedSteps?: FlowStepKey[]
  children: ReactNode
  bgVariant?: 'default' | 'purple' | 'sky' | 'blue' | 'space'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export default function StudentCreationLayout({
  currentStep,
  completedSteps = [],
  children,
  bgVariant = 'default',
  maxWidth = 'lg'
}: StudentCreationLayoutProps) {
  return (
    <StudentPageShell bgVariant={bgVariant} maxWidth={maxWidth}>
      <div className="flex w-full min-h-[80vh] items-start pt-6 md:pt-12 relative max-w-6xl mx-auto">
        <div className="hidden md:block w-[200px] shrink-0 fixed left-0 top-24 bottom-0 h-[calc(100vh-6rem)] bg-[#05030A]/95 z-30 pl-4 pt-2 overflow-y-auto">
          <StudentFlowSidebar 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
            theme={bgVariant === 'space' ? 'dark' : 'light'}
          />
        </div>

        {/* 중앙 핵심 콘텐츠 영역 */}
        <div className={`flex-1 w-full mx-auto flex flex-col gap-6 pl-0 md:pl-8
          ${maxWidth === 'sm' ? 'max-w-xl' : 
            maxWidth === 'md' ? 'max-w-2xl' : 
            maxWidth === 'lg' ? 'max-w-3xl' : 
            maxWidth === 'xl' ? 'max-w-4xl' : 
            maxWidth === '2xl' ? 'max-w-5xl' : 
            'max-w-[1200px]'}
        `}>
          {children}
        </div>
      </div>
    </StudentPageShell>
  )
}
