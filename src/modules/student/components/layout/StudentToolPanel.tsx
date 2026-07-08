import { type ReactNode } from 'react'

interface StudentToolPanelProps {
  children: ReactNode
  className?: string
  width?: string
}

export default function StudentToolPanel({ children, className = '', width = 'var(--student-layout-tool-panel-width,320px)' }: StudentToolPanelProps) {
  return (
    <div 
      className={`student-editor-tool-dock ${className}`}
      style={width ? { width } : undefined}
    >
      {children}
    </div>
  )
}
