import type { ReactNode } from 'react'
import StudentPageShell from './StudentPageShell'
import StudentFlowSidebar, { type FlowStepKey } from './StudentFlowSidebar'

interface StudentCreationLayoutProps {
  currentStep: FlowStepKey
  completedSteps?: FlowStepKey[]
  children: ReactNode
  bgVariant?: 'default' | 'purple' | 'sky' | 'blue' | 'space' | 'pastel'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export default function StudentCreationLayout({
  currentStep,
  completedSteps = [],
  children,
  bgVariant = 'default',
  maxWidth = 'lg'
}: StudentCreationLayoutProps) {
  const isFull = maxWidth === 'full';
  return (
    <StudentPageShell bgVariant={bgVariant} maxWidth={maxWidth}>
      <div className={`flex w-full items-stretch relative ${isFull ? 'flex-1 pt-0 overflow-hidden min-h-0' : 'min-h-[80vh] pt-6 md:pt-12 max-w-6xl mx-auto'}`}>
        {/* 사이드바 */}
        <div className={`hidden md:block shrink-0 bg-[#05030A]/95 z-30 overflow-y-auto ${isFull ? 'w-[180px] pl-2 pt-2 relative h-full' : 'w-[200px] pl-4 pt-2 fixed left-0 top-24 bottom-0'}`}>
          <StudentFlowSidebar 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
            theme={bgVariant === 'space' ? 'dark' : 'light'}
          />
        </div>

        {/* 중앙 핵심 콘텐츠 영역 */}
        <div className={`flex-1 w-full flex flex-col ${isFull ? 'max-w-none gap-0 mx-0 overflow-hidden min-h-0' : 'pl-0 md:pl-8 mx-auto gap-6'}
          ${!isFull && maxWidth === 'sm' ? 'max-w-xl' : 
            !isFull && maxWidth === 'md' ? 'max-w-2xl' : 
            !isFull && maxWidth === 'lg' ? 'max-w-3xl' : 
            !isFull && maxWidth === 'xl' ? 'max-w-4xl' : 
            !isFull && maxWidth === '2xl' ? 'max-w-5xl' : 
            !isFull ? 'max-w-[1200px]' : ''}
        `}>
          {children}
        </div>
      </div>
    </StudentPageShell>
  )
}
