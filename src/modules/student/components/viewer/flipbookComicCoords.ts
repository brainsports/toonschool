/**
 * 만화 씬 오버레이 좌표 변환 유틸.
 *
 * 만화 편집 요소(ComicCutElement)는 1400×1025 논리 좌표계에 저장된다.
 *  - 편집기: ComicCanvas.CANVAS_WIDTH = 1400 (comic-editor/ComicCanvas.tsx:21)
 *  - 운영 뷰어: 씬 오버레이 설계 캔버스 1400×1025 (viewer/pages/FlipComicPage.tsx:74,110)
 *
 * 새 16:9 페이지에서도 동일 좌표계(1400×1025)를 보존하면 요소 위치가 운영 뷰어와 동일하게 유지된다.
 * 좌표 변환은 렌더링 단계에서만 수행한다(localStorage 데이터는 수정하지 않는다).
 */

/** 만화 씬 소스 좌표계 폭(운영 뷰어/편집기 기준). */
export const SOURCE_COMIC_WIDTH = 1400
/** 만화 씬 소스 좌표계 높이. */
export const SOURCE_COMIC_HEIGHT = 1025
/** 씬 비율(1400:1025 ≈ 1.366). */
export const SOURCE_COMIC_RATIO = SOURCE_COMIC_WIDTH / SOURCE_COMIC_HEIGHT

/** 씬 프레임 테두리 두께(px). 운영 뷰어(10px×2)와 동일 기준. */
export const COMIC_FRAME_BORDER = 10

/**
 * 컨테이너 크기에 맞춰 씬 비율(1400:1025)을 유지하는 프레임 폭을 계산한다.
 * 운영 FlipComicPage 의 measure() 와 동일 로직: min(sw, sh * 1400/1025).
 */
export function computeComicFrameWidth(containerW: number, containerH: number): number {
  if (containerW <= 0 || containerH <= 0) return 0
  return Math.min(containerW, containerH * SOURCE_COMIC_RATIO)
}

/**
 * 프레임 폭으로부터 오버레이 scale을 계산한다(테두리 제외한 콘텐츠 폭 기준).
 * 운영 FlipComicPage 의 (frameWidth-20)/1400 과 동일 기준.
 */
export function computeComicScale(frameWidth: number): number {
  const contentWidth = frameWidth - COMIC_FRAME_BORDER * 2
  return contentWidth > 0 ? contentWidth / SOURCE_COMIC_WIDTH : 0
}
