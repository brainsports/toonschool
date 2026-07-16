/**
 * 툰스쿨 플립북 뷰어 — 모바일 터치(스와이프/탭) 페이지 이동 훅.
 * 학생 뷰어(StudentComicViewerPage)와 공유 뷰어(SharedComicViewerPage)에서 공용 사용.
 *
 *  - 가로 스와이프: 좌→우 스와이프 = 이전, 우→좌 스와이프 = 다음.
 *    세로 스크롤과 분리(수평 이동이 수직의 1.3배 이상, 45px 이상일 때만).
 *  - 탭(enableTap): 짧은 시간·작은 이동 터치 시 터치 위치의 좌/우로 이전/다음.
 *    단, 버튼/링크/입력 등 상호작용 요소(OX 버튼, 음소거 등)를 탭하면 페이지 이동이 일어나지 않는다.
 *  - 애니메이션 진행 중(isLocked)에는 이동을 무시한다(페이지 꼬임 방지).
 *  - touchmove 에 preventDefault 를 걸지 않아 세로 스크롤/핀치줌을 막지 않는다.
 */
import { useRef } from 'react'
import type { TouchEvent } from 'react'

export interface SwipeNavOptions {
  onNext: () => void
  onPrev: () => void
  isLocked: () => boolean
  /** 단일 페이지 모드처럼 클릭 영역이 없는 뷰어에서 탭으로 좌/우 이동을 허용. */
  enableTap?: boolean
}

export type SwipeHandlers = {
  onTouchStart: (e: TouchEvent) => void
  onTouchEnd: (e: TouchEvent) => void
}

export function useSwipeNavigation({ onNext, onPrev, isLocked, enableTap = false }: SwipeNavOptions): SwipeHandlers {
  const startRef = useRef<{ x: number; y: number; time: number; target: HTMLElement } | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) {
      startRef.current = null
      return
    }
    const t = e.touches[0]
    startRef.current = { x: t.clientX, y: t.clientY, time: Date.now(), target: e.target as HTMLElement }
  }

  const onTouchEnd = (e: TouchEvent) => {
    const s = startRef.current
    startRef.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)

    // 가로 스와이프(세로 스크롤과 분리)
    if (adx > 45 && adx > ady * 1.3) {
      if (isLocked()) return
      if (dx < 0) onNext()
      else onPrev()
      return
    }

    // 탭 → 좌/우 절반으로 이전/다음(상호작용 요소 제외)
    if (enableTap && adx < 12 && ady < 12 && Date.now() - s.time < 300) {
      if (isLocked()) return
      const interactive = s.target.closest('button, a, input, textarea, select, [role="button"], [data-no-nav]')
      if (interactive) return
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const relX = t.clientX - rect.left
      if (relX < rect.width / 2) onPrev()
      else onNext()
    }
  }

  return { onTouchStart, onTouchEnd }
}
