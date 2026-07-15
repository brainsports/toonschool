/**
 * 툰스쿨 플립북 16:9 — 공통 콘텐츠 카드.
 * 따뜻한 흰색(또는 반투명) 카드에 연한 파스텔 테두리/그림자/둥근 모서리를 통일 적용.
 * tone 별 상단 얇은 액센트 바(.flp-card--{tone})로 페이지 주조색 표현.
 */
import type { CSSProperties, ReactNode } from 'react'

export type FlipbookCardTone = 'blue' | 'green' | 'yellow' | 'pink' | 'purple' | 'neutral'

export interface FlipbookContentCardProps {
  children: ReactNode
  tone?: FlipbookCardTone
  /** 살짝 더 투명한 카드(배경 장식이 은은하게 비치도록). */
  soft?: boolean
  className?: string
  style?: CSSProperties
}

export default function FlipbookContentCard({
  children,
  tone = 'neutral',
  soft = false,
  className,
  style,
}: FlipbookContentCardProps) {
  const classes = ['flp-card']
  if (tone !== 'neutral') classes.push(`flp-card--${tone}`)
  if (soft) classes.push('flp-card--soft')
  if (className) classes.push(className)
  return (
    <div className={classes.join(' ')} style={style}>
      {children}
    </div>
  )
}
