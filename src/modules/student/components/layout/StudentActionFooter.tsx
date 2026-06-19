// 하단 고정 액션 버튼 영역 공통 컴포넌트
import React from 'react'

interface StudentActionFooterProps {
  children: React.ReactNode
  sticky?: boolean
  className?: string
}

export default function StudentActionFooter({
  children,
  sticky = false,
  className = '',
}: StudentActionFooterProps) {
  return (
    <div
      className={`
        mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 py-4 px-6 rounded-3xl
        ${
          sticky 
            ? 'sticky bottom-4 bg-slate-900/90 backdrop-blur-md border-3 border-black shadow-[0_8px_0_rgba(0,0,0,0.5)] z-40' 
            : 'bg-black/30 border-2 border-white/5'
        } 
        ${className}
      `}
    >
      {children}
    </div>
  )
}
