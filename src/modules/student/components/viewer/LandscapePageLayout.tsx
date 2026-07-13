import type { ReactNode } from 'react'

export const FLIPBOOK_PAGE_WIDTH = 1400
export const FLIPBOOK_PAGE_HEIGHT = 990
export const FLIPBOOK_PAGE_RATIO = 297 / 210

export type LandscapePageInfo = {
  pageType: string
  stageLabel?: string
  title: string
  description?: string
  keyQuestion?: string
  keywords?: string[]
  missionLabel?: string
  mission?: string
}

type LandscapePageLayoutProps = {
  info: LandscapePageInfo
  subject?: string
  unit?: string
  pageNumber: number
  totalPages: number
  children: ReactNode
  tone?: 'comic' | 'history' | 'current' | 'life' | 'quiz'
}

export default function LandscapePageLayout({
  info,
  subject,
  unit,
  pageNumber,
  totalPages,
  children,
  tone = 'comic',
}: LandscapePageLayoutProps) {
  return (
    <article className={`landscape-page landscape-page-${tone}`}>
      <aside className="landscape-info-panel">
        <div className="landscape-curriculum-row">
          {subject && <span>{subject}</span>}
          {unit && <span title={unit}>{unit}</span>}
        </div>
        <span className="landscape-page-type">{info.pageType}</span>
        {info.stageLabel && <p className="landscape-stage-label">{info.stageLabel}</p>}
        <h2 title={info.title}>{info.title}</h2>
        {info.description && <p className="landscape-description" title={info.description}>{info.description}</p>}
        {info.keyQuestion && (
          <section className="landscape-question">
            <span>핵심 질문</span>
            <p>{info.keyQuestion}</p>
          </section>
        )}
        {!!info.keywords?.length && (
          <div className="landscape-keywords" aria-label="핵심 낱말">
            {info.keywords.slice(0, 4).map((keyword) => <span key={keyword}>{keyword}</span>)}
          </div>
        )}
        {info.mission && (
          <section className="landscape-mission">
            <span>{info.missionLabel ?? '생각 미션'}</span>
            <p>{info.mission}</p>
          </section>
        )}
        <div className="landscape-progress">
          <span>{info.pageType}</span>
          <strong>{pageNumber} / {totalPages}</strong>
        </div>
      </aside>
      <section className="landscape-content-panel">{children}</section>
    </article>
  )
}
