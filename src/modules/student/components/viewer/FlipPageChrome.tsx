import type { ReactNode } from 'react'

export type FlipChipTone = 'comic' | 'story' | 'quiz'

type FlipPageChromeProps = {
  subject?: string
  unit?: string
  chipLabel: string
  chipTone: FlipChipTone
  chipCount?: string
  pageNumber: number
  totalPages: number
  /** 추가로 fb-page 에 붙일 보조 클래스 */
  pageClass?: string
  children: ReactNode
}

/**
 * 만화/이야기/퀴즈 등 “본문” 페이지의 공통 크롬.
 * 상단 진행바 + 과목/단원 헤더 + 페이지 종류 칩 + 하단 페이지 번호를 묶어 제공.
 * 표지·뒤표지는 자체 레이아웃을 사용하므로 이 크롬을 쓰지 않는다.
 */
export default function FlipPageChrome({
  subject,
  unit,
  chipLabel,
  chipTone,
  chipCount,
  pageNumber,
  totalPages,
  pageClass,
  children,
}: FlipPageChromeProps) {
  const pct = totalPages > 0 ? Math.min(100, Math.max(0, (pageNumber / totalPages) * 100)) : 0
  return (
    <div className={`fb-page ${pageClass ?? ''}`}>
      <div className="fb-progress" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </div>
      <div className="fb-chrome">
        <div className="fb-subject-row">
          <span className="fb-subject-dot" aria-hidden="true" />
          {subject && <span className="fb-subject-name">{subject}</span>}
          {unit && <span className="fb-unit" title={unit}>{unit}</span>}
        </div>
        <span className={`fb-chip is-${chipTone}`}>
          {chipLabel}
          {chipCount && <span className="fb-chip-count">{chipCount}</span>}
        </span>
      </div>
      {children}
      <div className="fb-pageno" aria-hidden="true">- {pageNumber} -</div>
    </div>
  )
}
