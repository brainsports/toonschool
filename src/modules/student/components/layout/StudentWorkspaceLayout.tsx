import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
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
        {/* Left Sidebar */}
        <div className="hidden md:block shrink-0 w-[var(--student-layout-sidebar-width,200px)] h-full bg-[#134B4C] border-r border-[#0f3a3b] shadow-[6px_0_18px_rgba(15,58,59,0.18)] overflow-y-auto z-30">
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
                  {title && <h1 className="text-2xl font-jua text-[#1f2433] drop-shadow-sm truncate m-0 leading-tight">{title}</h1>}
                  {subtitle && <div className="text-sm font-bold text-[#7b8190] truncate mt-1">{subtitle}</div>}
                </div>
              )}
            </div>

            {/* Center Content */}
            {centerContent && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center shrink-0 pointer-events-none whitespace-nowrap">
                {centerContent}
              </div>
            )}

            {/* Right Action Buttons */}
            {actionButtons && (
              <div className="flex items-center gap-3 flex-wrap shrink-0 relative z-10">
                {actionButtons}
              </div>
            )}
          </div>

          {/* Children Content (Canvas, ToolPanel, etc.) */}
          <div className="flex-1 flex overflow-hidden relative">
            {children}
          </div>
        </div>
      </div>
    </StudentPageShell>
  )
}
