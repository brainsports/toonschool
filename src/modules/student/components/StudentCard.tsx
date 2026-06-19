// 학생 UI 전용 카드 컴포넌트
import React from 'react'

interface StudentCardProps {
  children: React.ReactNode
  selected?: boolean
  onClick?: () => void
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function StudentCard({
  children,
  selected = false,
  onClick,
  className = '',
  padding = 'md',
}: StudentCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        card-game
        ${paddingClasses[padding]}
        ${selected ? 'card-game-selected' : ''}
        ${onClick ? 'card-game-interactive cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
