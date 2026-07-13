type FlipCoverPageProps = {
  subject?: string
  title: string
  subtitle?: string
  keywords?: string[]
  authorName?: string
  gradeClassInfo?: string
  createdDate?: string
  grade?: string
  coverImage?: string
  volumeLabel?: string
}

/**
 * 표지(p1) — 가장 자랑하고 싶은 화면이자 공유 썸네일.
 * 좌: 코랄→핑크→바이올렛 히어로 패널(제목/키워드/작가 스티커).
 * 우: 학생 대표 만화를 굵은 프레임으로 + VOL.1 배지.
 */
export default function FlipCoverPage({
  subject,
  title,
  subtitle,
  keywords,
  authorName,
  gradeClassInfo,
  createdDate,
  grade,
  coverImage,
  volumeLabel = 'VOL.1',
}: FlipCoverPageProps) {
  return (
    <div className="fb-page">
      <div className="fb-cover">
        <div className="fb-cover-hero">
          <span className="fb-cover-eyebrow">📚 TOONSCHOOL{subject ? ` · ${subject}` : ''}</span>
          <h1 className="fb-cover-title">{title}</h1>
          {subtitle && <p className="fb-cover-sub">{subtitle}</p>}
          {!!keywords?.length && (
            <div className="fb-keywords">
              {keywords.slice(0, 4).map((k) => <span key={k}>#{k}</span>)}
            </div>
          )}
          <div className="fb-author-card">
            <span className="fb-author-label">지은이</span>
            <span className="fb-author-name">{authorName || '나'}</span>
            <span className="fb-author-meta">{gradeClassInfo || grade || ''}</span>
            <span className="fb-author-meta">{createdDate ? `발행일 ${createdDate}` : ''}</span>
          </div>
        </div>
        <div className="fb-cover-art">
          <div className="fb-vol-badge">
            <div className="fb-vol-num">{volumeLabel}</div>
            <div className="fb-vol-label">MY TOON</div>
          </div>
          <div className="fb-frame">
            {coverImage ? (
              <img src={coverImage} alt={`${title} 대표 만화`} />
            ) : (
              <div className="fb-cover-empty" aria-label="표지 이미지 없음">🎨</div>
            )}
          </div>
          <div className="fb-ribbon">MY TOON BOOK</div>
        </div>
      </div>
    </div>
  )
}
