import FlipPageChrome from '../FlipPageChrome'

type FlipStoryPageProps = {
  subject?: string
  unit?: string
  chipLabel: string
  icon: string
  title: string
  content: string
  highlightLabel?: string
  highlightText?: string
  questionText?: string
  pageNumber: number
  totalPages: number
}

/**
 * 생활 속 이야기(p8~10) — “탐험 기록 카드”.
 * 만화 페이지와 분위기를 달리: 핵심 내용(메인) + 읽기 포인트(강조) + 생각해 볼 질문(손글씨 스티키노트).
 */
export default function FlipStoryPage({
  subject,
  unit,
  chipLabel,
  icon,
  title,
  content,
  highlightLabel,
  highlightText,
  questionText,
  pageNumber,
  totalPages,
}: FlipStoryPageProps) {
  return (
    <FlipPageChrome
      subject={subject}
      unit={unit}
      chipLabel={chipLabel}
      chipTone="story"
      pageNumber={pageNumber}
      totalPages={totalPages}
    >
      <div className="fb-story">
        <div className="fb-story-head">
          <div className="fb-story-icon" aria-hidden="true">{icon}</div>
          <h2 className="fb-story-title">{title}</h2>
        </div>
        <div className="fb-story-body">
          <div className="fb-card fb-card-main">
            <div className="fb-card-label">📖 핵심 내용</div>
            <p className="fb-card-text">{content}</p>
          </div>
          <div className="fb-story-side">
            {highlightText && (
              <div className="fb-card fb-card-fact">
                <div className="fb-card-label">✨ {highlightLabel || '재미있는 사실'}</div>
                <p className="fb-card-text">{highlightText}</p>
              </div>
            )}
            {questionText && (
              <div className="fb-card fb-card-note">
                <div className="fb-card-label">✏️ 생각해 볼 질문</div>
                <p className="fb-card-text">{questionText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </FlipPageChrome>
  )
}
