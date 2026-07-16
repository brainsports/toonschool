/**
 * 툰스쿨 플립북 — 책장 넘김(종이 한 장 회전) 공용 컴포넌트.
 * 학생 뷰어(StudentComicViewerPage)와 공유 뷰어(SharedComicViewerPage)가
 * **완전히 동일한** 넘김 애니메이션을 쓰도록 이 컴포넌트 하나로 통일한다.
 *
 * 구조: 넘어가는 종이 한 장 = 앞면(현재 면) + 뒷면(넘어갈 면).
 *  - 앞면: page-curl-wrapper-* (말림 반경·드롭 섀도우) + 말림 그라데이션/그림자/하이라이트 오버레이.
 *  - 뒷면: 제본선 그림자(page-shadow-overlay*).
 *  - 회전: .flipping-next/.flipping-prev (CSS keyframes, flipbook-flip.css).
 * 단일 페이지 모드에서는 한 장 전체가 중앙 축으로 회전한다.
 *
 * 페이지 내용(front/back)은 각 뷰어가 렌더 함수(renderPageSlot / renderHalf)로 전달한다.
 * 애니메이션 CSS 는 flipbook-flip.css(단일 소스)에 있다.
 */
import type { ReactNode } from 'react'

export interface BookFlipProps {
  direction: 'next' | 'prev'
  /** 단일 페이지 모드(모바일 세로). true 면 한 장 전체가 중앙 축으로 회전. */
  single: boolean
  /** 페이지 한 장 논리 폭/높이(px). */
  pageWidth: number
  pageHeight: number
  /** 앞면(현재 면) 콘텐츠. */
  front: ReactNode
  /** 뒷면(넘어갈 면) 콘텐츠. */
  back: ReactNode
}

export default function BookFlip({ direction, single, pageWidth, pageHeight, front, back }: BookFlipProps) {
  const isNext = direction === 'next'
  return (
    <div
      className={`flp-turn ${isNext ? 'flipping-next' : 'flipping-prev'}`}
      style={{
        position: 'absolute',
        top: 0,
        left: single ? 0 : (isNext ? pageWidth : 0),
        width: pageWidth,
        height: pageHeight,
        transformOrigin: single ? 'center center' : (isNext ? 'left center' : 'right center'),
        transformStyle: 'preserve-3d',
        zIndex: 30,
        pointerEvents: 'none',
      }}
    >
      {/* 앞면(현재 면): 컬 말림 + 그라데이션/그림자/하이라이트로 종이가 들리며 휘는 느낌 */}
      <div
        className={`flp-turn-face flp-turn-front ${isNext ? 'page-curl-wrapper-next' : 'page-curl-wrapper-prev'}`}
        style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden' }}
      >
        {front}
        <div className={`page-curl-overlay ${isNext ? 'next-curl-overlay' : 'prev-curl-overlay'}`} />
        <div className={`page-curl-overlay ${isNext ? 'next-curl-shadow' : 'prev-curl-shadow'}`} />
        <div className={`page-curl-overlay ${isNext ? 'next-curl-highlight' : 'prev-curl-highlight'}`} />
      </div>
      {/* 뒷면(넘어갈 면): 안착 시 중앙 제본선에 지는 그림자 */}
      <div
        className="flp-turn-face flp-turn-back"
        style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', overflow: 'hidden' }}
      >
        {back}
        <div className={isNext ? 'page-shadow-overlay-right' : 'page-shadow-overlay'} />
      </div>
    </div>
  )
}
