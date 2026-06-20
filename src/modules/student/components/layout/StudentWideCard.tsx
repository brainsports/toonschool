import React from 'react'

interface StudentWideCardProps {
  children: React.ReactNode
  className?: string
}

export default function StudentWideCard({ children, className = '' }: StudentWideCardProps) {
  return (
    <div className={`w-full max-w-[1200px] mx-auto card-glass px-8 py-8 md:px-10 md:py-10 min-h-[220px] ${className}`}>
      {children}
    </div>
  )
}
