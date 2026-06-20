import React from 'react'

interface StudentPrimaryActionButtonProps {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export default function StudentPrimaryActionButton({ 
  onClick, 
  disabled = false, 
  children, 
  className = '' 
}: StudentPrimaryActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-full min-h-[72px] text-xl md:text-2xl font-jua rounded-full transition-all 
        ${disabled ? 'btn-neon-disabled' : 'btn-neon-purple'} 
        ${className}`}
    >
      {children}
    </button>
  )
}
