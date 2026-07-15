/**
 * 툰스쿨 플립북 16:9 — 공통 페이지 프레임.
 *
 * 핵심 원칙(사용자 확정):
 *  - 논리 페이지 크기는 항상 1600×900(16:9). 페이지 내부는 논리 좌표로 설계한다.
 *  - 화면 표시용 scale 은 이 프레임에서 **한 번만** 계산한다(부모 컨테이너에 맞춤).
 *    → 기존 currentZoom → PageWrapper scale → 페이지 내부 scale 의 중복 스케일링 구조를
 *      제거하기 위한 기반. Stage 5 에서 기존 scale 들을 이 프레임으로 통합한다.
 *  - 최초 렌더링부터 aspect-ratio 와 논리 크기를 확보해 페이지 크기 튐을 방지한다.
 *
 * captureMode=true 면 1600×900 고정(scale 없음)으로 렌더링하여 html2canvas/PDF 캡처에 동일 논리 크기를 제공한다.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import FlipbookBackground, { type FlipbookBackgroundVariant } from './FlipbookBackground'

export const FLIPBOOK_LANDSCAPE_WIDTH = 1600
export const FLIPBOOK_LANDSCAPE_HEIGHT = 900

export interface FlipbookPageFrameProps {
  children: ReactNode
  className?: string
  backgroundVariant?: FlipbookBackgroundVariant
  /** true 면 1600×900 고정 캡처용 렌더(scaling 없음). */
  captureMode?: boolean
}

export default function FlipbookPageFrame({
  children,
  className,
  backgroundVariant = 'default',
  captureMode = false,
}: FlipbookPageFrameProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  // 측정 전엔 0 → 첫 paint 에서 1600×900 이 오버플로우하는 것을 막는다.
  // useLayoutEffect 가 paint 전에 실제 scale 로 덮어쓴다.
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    if (captureMode) return
    const el = rootRef.current
    if (!el) return
    const compute = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setScale(Math.min(rect.width / FLIPBOOK_LANDSCAPE_WIDTH, rect.height / FLIPBOOK_LANDSCAPE_HEIGHT))
      }
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [captureMode])

  if (captureMode) {
    return (
      <div
        ref={rootRef}
        className={`flp-frame-root flp-frame-root--capture ${className ?? ''}`}
        style={{ width: FLIPBOOK_LANDSCAPE_WIDTH, height: FLIPBOOK_LANDSCAPE_HEIGHT }}
      >
        <div className="flp-page" style={{ width: FLIPBOOK_LANDSCAPE_WIDTH, height: FLIPBOOK_LANDSCAPE_HEIGHT }}>
          <FlipbookBackground variant={backgroundVariant} />
          <div className="flp-content">{children}</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className={`flp-frame-root ${className ?? ''}`}>
      <div
        className="flp-page"
        style={{
          width: FLIPBOOK_LANDSCAPE_WIDTH,
          height: FLIPBOOK_LANDSCAPE_HEIGHT,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <FlipbookBackground variant={backgroundVariant} />
        <div className="flp-content">{children}</div>
      </div>
    </div>
  )
}
