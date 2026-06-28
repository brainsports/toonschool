import { type ReactNode } from 'react'

interface StudentToolPanelProps {
  children: ReactNode
  className?: string
  width?: string
}

export default function StudentToolPanel({ children, className = '', width = 'var(--student-layout-tool-panel-width,320px)' }: StudentToolPanelProps) {
  return (
    <div 
      className={`shrink-0 h-full bg-[var(--student-color-tool-panel-bg,#f8f9fc)] border-r border-[var(--student-color-border,#d9deea)] flex flex-col z-10 ${className}`}
      style={{ width }}
    >
      {children}
    </div>
  )
}
