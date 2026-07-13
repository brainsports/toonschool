import { useLayoutEffect, useRef, useState } from 'react'
import type { ComicCutElement, ComicCutEditData } from '../../editor/utils/comicStorage'
import FlipPageChrome from '../FlipPageChrome'

/** 만화 편집 요소(캐릭터/말풍선)를 읽기 전용으로 그려 주는 작은 컴포넌트. */
function ReadonlyElement({ el }: { el: ComicCutElement }) {
  const isBubble = el.type === 'speechBubble'
  const isChar = el.type === 'character'
  return (
    <div
      style={{
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: `rotate(${el.rotation || 0}deg) ${el.flipX ? 'scaleX(-1)' : ''}`,
        zIndex: el.zIndex,
        pointerEvents: 'none',
      }}
    >
      {isChar && el.imageUrl && (
        <img src={el.imageUrl} alt="character" className="w-full h-full object-contain" />
      )}
      {isBubble && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-white border-4 border-slate-800 rounded-3xl shadow-md" />
          <p
            className="relative z-10 text-slate-800 font-bold text-center px-4 leading-snug break-keep"
            style={{ fontSize: el.style?.fontSize || 16 }}
          >
            {el.text}
          </p>
        </div>
      )}
    </div>
  )
}

type FlipComicPageProps = {
  subject?: string
  unit?: string
  sceneTitle: string
  keyPoint?: string
  cutNum: number
  totalCuts: number
  data: ComicCutEditData | null
  pageNumber: number
  totalPages: number
}

/** 만화컷 페이지 — 만화 프레임이 페이지의 중심. 요소 정렬은 1400 설계폭 기준 유지. */
export default function FlipComicPage({
  subject,
  unit,
  sceneTitle,
  keyPoint,
  cutNum,
  totalCuts,
  data,
  pageNumber,
  totalPages,
}: FlipComicPageProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [frameWidth, setFrameWidth] = useState(0)

  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const sw = el.clientWidth
      const sh = el.clientHeight
      if (sw <= 0 || sh <= 0) return
      // 1400×1025(=343/251) 비율을 유지하며 스테이지에 꽉 차게
      const w = Math.min(sw, sh * (1400 / 1025))
      setFrameWidth(w)
    }
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // 프레임 콘텐츠 폭(테두리 10px×2 제외) 기준 스케일. 기존 렌더링과 동일 기준.
  const scale = frameWidth > 0 ? (frameWidth - 20) / 1400 : 0
  const hasBg = !!data?.backgroundImageUrl

  return (
    <FlipPageChrome
      subject={subject}
      unit={unit}
      chipLabel="만화컷"
      chipTone="comic"
      chipCount={`${cutNum} / ${totalCuts}`}
      pageNumber={pageNumber}
      totalPages={totalPages}
    >
      <div className="fb-comic">
        <div className="fb-scene-title" title={sceneTitle}>{sceneTitle}</div>
        <div className="fb-comic-stage" ref={stageRef}>
          {frameWidth > 0 && (
            <div className="fb-frame" style={{ width: frameWidth, height: frameWidth * (1025 / 1400) }}>
              {hasBg ? (
                <img className="fb-scene-img" src={data!.backgroundImageUrl} alt={`${cutNum}컷 만화 장면`} />
              ) : (
                <div className="fb-scene-empty">그림 준비 중</div>
              )}
              <div className="fb-scene-overlay">
                {scale > 0 && (
                  <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1400, height: 1025 }}>
                    {data?.elements?.map((el) => <ReadonlyElement key={el.id} el={el} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="fb-comic-foot">
          <div className="fb-key-point">
            <div className="fb-key-icon" aria-hidden="true">★</div>
            <div className="fb-key-text">{keyPoint || '이 장면에서 어떤 점이 궁금한지 생각해 보세요.'}</div>
          </div>
          <div className="fb-cut-dots" aria-hidden="true">
            {Array.from({ length: totalCuts }).map((_, i) => (
              <span key={i} className={`fb-dot${i < cutNum ? ' is-on' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </FlipPageChrome>
  )
}
