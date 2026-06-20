import React from 'react'

interface StudentInnerPanelProps {
  children: React.ReactNode
  className?: string
}

export default function StudentInnerPanel({ children, className = '' }: StudentInnerPanelProps) {
  return (
    <div className={`w-full min-h-[140px] flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 p-6 text-center text-base md:text-lg text-slate-300 leading-relaxed font-bold ${className}`}>
      {children}
    </div>
  )
}
