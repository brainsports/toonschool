import { type ReactNode } from 'react'

interface StudentToolPanelProps {
  children: ReactNode
  className?: string
  width?: string
}

export default function StudentToolPanel({ children, className = '', width = 'var(--student-layout-tool-panel-width,320px)' }: StudentToolPanelProps) {
  return (
    <div 
      className={`student-editor-tool-dock shrink-0 w-full lg:w-[var(--panel-width)] ${className}`}
      style={{ '--panel-width': width } as any}
    >
      {children}
    </div>
  )
}
