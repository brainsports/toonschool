// 보상 배지 컴포넌트
interface StudentRewardBadgeProps {
  emoji: string
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: { wrapper: 'p-2.5 w-20 h-20', emoji: 'text-2xl', name: 'text-[10px]' },
  md: { wrapper: 'p-4 w-28 h-28', emoji: 'text-4xl', name: 'text-xs' },
  lg: { wrapper: 'p-6 w-36 h-36', emoji: 'text-6xl', name: 'text-sm' },
}

export default function StudentRewardBadge({
  emoji,
  name,
  size = 'md',
}: StudentRewardBadgeProps) {
  const s = sizeClasses[size]
  return (
    <div 
      className={`
        flex flex-col items-center justify-center gap-1.5 
        ${s.wrapper} 
        rounded-2xl border-3 border-black bg-gradient-to-br from-amber-100 to-yellow-200 
        shadow-[0_4px_0_rgba(0,0,0,0.2)] text-amber-950 font-black text-center
      `}
    >
      <span className={`${s.emoji} animate-bounce-gentle`}>{emoji}</span>
      <span className="leading-tight tracking-tight">{name}</span>
    </div>
  )
}
