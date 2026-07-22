import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, BookMarked } from 'lucide-react'
import StudentPageShell from './StudentPageShell'
import StudentFlowSidebar, { type FlowStepKey } from './StudentFlowSidebar'

interface StudentWorkspaceLayoutProps {
  currentStep: FlowStepKey
  completedSteps?: FlowStepKey[]
  children: ReactNode
  
  // Header options
  title?: string
  subtitle?: ReactNode
  onBack?: () => void
  showBackButton?: boolean
  
  // Right top actions
  actionButtons?: ReactNode
  
  // Center top content
  centerContent?: ReactNode

  bgVariant?: 'default' | 'pastel' | 'space'
}

export default function StudentWorkspaceLayout({
  currentStep,
  completedSteps = [],
  children,
  title,
  subtitle,
  onBack,
  showBackButton = true,
  actionButtons,
  centerContent,
  bgVariant = 'pastel'
}: StudentWorkspaceLayoutProps) {
  const navigate = useNavigate()
  return (
    <StudentPageShell bgVariant={bgVariant} maxWidth="full">
      <div className="student-editor-workspace">
        {/* 모바일/태블릿 세로 모드 상단 스텝퍼 (lg 미만에서 표시) */}
        <div className="lg:hidden w-full bg-[#134B4C] border-b border-[#0f3a3b] shadow-sm z-30 shrink-0">
          <StudentFlowSidebar 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
            theme="dark"
            orientation="horizontal"
          />
        </div>

        {/* Left Sidebar (PC 및 태블릿 가로 모드 - lg 이상에서 표시) */}
        <div className="hidden lg:block shrink-0 w-[var(--student-layout-sidebar-width,200px)] h-full bg-[#134B4C] border-r border-[#0f3a3b] shadow-[6px_0_18px_rgba(15,58,59,0.18)] overflow-y-auto z-30">
          <StudentFlowSidebar 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
            theme="dark"
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[var(--student-color-app-bg,#f3f4f7)]">
          {/* Top Header Bar */}
          <div className="student-editor-header">
            {/* Left Title Area */}
            <div className="flex items-center gap-[16px] min-w-0">
              {showBackButton ? (
                <button 
                  onClick={onBack ? onBack : () => navigate(-1)}
                  className="btn-editor-prev !p-2 !rounded-xl"
                  title="이전으로"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              ) : (
                <div className="w-10 h-10 shrink-0 pointer-events-none" />
              )}
              {(title || subtitle) && (
                <div className="flex flex-col min-w-0">
                  {title && <h1 className="text-xl md:text-2xl font-jua text-[#1f2433] drop-shadow-sm truncate m-0 leading-tight">{title}</h1>}
                  {subtitle && <div className="text-xs md:text-sm font-bold text-[#7b8190] truncate mt-1">{subtitle}</div>}
                </div>
              )}
            </div>

            {/* Center Content */}
            {centerContent && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center shrink-0 pointer-events-none whitespace-nowrap">
                {centerContent}
              </div>
            )}

            {/* Right Action Buttons — '나의 단어장'(공통) + 페이지별 작업 버튼.
                상태 보호: 기존 뒤로가기(navigate(-1))와 같은 언마운트 시맨틱이므로
                localStorage 기반 복원으로 기존 흐름을 유지하며, 새 경고창은 두지 않는다. */}
            <div className="flex items-center gap-3 flex-wrap shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => navigate('/student/vocabulary')}
                title="나의 단어장"
                aria-label="나의 단어장"
                className="px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50/70 text-sky-700 text-sm font-bold hover:bg-sky-100 hover:border-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 flex items-center gap-1.5"
              >
                <BookMarked className="w-4 h-4" /> <span className="hidden sm:inline">나의 단어장</span>
              </button>
              {actionButtons}
            </div>
          </div>

          {/* Children Content (Canvas, ToolPanel, etc.) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
            {children}
          </div>
        </div>
      </div>
    </StudentPageShell>
  )
}
