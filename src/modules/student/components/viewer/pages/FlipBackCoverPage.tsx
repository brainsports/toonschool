type FlipBackCoverPageProps = {
  workTitle: string
  authorName?: string
  gradeClassInfo?: string
  createdDate?: string
  heroImage?: string
  qrImage?: string
}

/**
 * 뒤표지(p16) — 표지와 같은 세계관의 “완성!” 축하 페이지.
 * 좌: 축하 스탬프 + 완성 타이틀 + 작품 정보 + “친구에게 자랑하기” CTA.
 * 우: 대표 만화(디밍) + 공유/QR 카드 오버레이.
 */
export default function FlipBackCoverPage({
  workTitle,
  authorName,
  gradeClassInfo,
  createdDate,
  heroImage,
  qrImage = '/images/toonschool/back-covers/back-cover-sns-default.webp',
}: FlipBackCoverPageProps) {
  return (
    <div className="fb-page">
      <div className="fb-back">
        <div className="fb-back-hero">
          <span className="fb-back-stamp">🎉 학습 완료</span>
          <h1 className="fb-back-title">오늘의 배움을<br />완성했어요!</h1>
          <p className="fb-back-cheer">끝까지 한 권을 만들어낸 나,<br />최고의 작가예요! 🌟</p>
          <p className="fb-back-work">{workTitle}</p>
          <div className="fb-back-meta">
            {authorName && <span>지은이 {authorName}</span>}
            {gradeClassInfo && <span>{gradeClassInfo}</span>}
            {createdDate && <span>완성일 {createdDate}</span>}
          </div>
          <div className="fb-back-cta">
            <span className="fb-cta-emoji" aria-hidden="true">📨</span>
            <div>
              <div className="fb-cta-title">내 만화책을 친구에게 자랑해요</div>
              <div className="fb-cta-sub">작품 링크를 복사해 보내보세요</div>
            </div>
          </div>
        </div>
        <div className="fb-back-art">
          {heroImage && <img className="fb-back-hero-img" src={heroImage} alt="작품 대표 만화" />}
          <div className="fb-back-share">
            <div className="fb-share-brand">TOONSCHOOL</div>
            <div className="fb-share-sub">작품 링크를 공유하고 다시 감상해 보세요</div>
            <img className="fb-share-qr" src={qrImage} alt="작품 공유 QR 카드" />
          </div>
        </div>
      </div>
    </div>
  )
}
