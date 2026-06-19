// 학생 UI 전용 큰 버튼 컴포넌트
import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning' | 'danger'

interface StudentBigButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: ButtonVariant
  disabled?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  emoji?: string
  className?: string
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-game-purple',
  secondary: 'btn-game-blue',
  ghost: 'bg-slate-100 text-slate-700 border-3 border-slate-300 shadow-[0_4px_0_#94a3b8] hover:bg-slate-200 active:translate-y-[4px] active:shadow-[0_0px_0_#94a3b8]',
  success: 'btn-game-green',
  warning: 'btn-game-yellow',
  danger: 'btn-game-red',
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm rounded-xl border-2',
  md: 'px-6 py-3.5 text-base rounded-2xl border-3',
  lg: 'px-10 py-5 text-xl rounded-3xl border-3',
}

export default function StudentBigButton({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  size = 'lg',
  emoji,
  className = '',
}: StudentBigButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        btn-game-3d font-jua tracking-wider transition-all duration-100
        flex items-center justify-center gap-2
        ${disabled ? 'btn-game-disabled' : variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {emoji && <span className="text-2xl animate-bounce-gentle">{emoji}</span>}
      <span>{children}</span>
    </button>
  )
}
