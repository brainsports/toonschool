// 플립북 페이지 물리 크기(A4 가로 297:210). 학생 뷰어 스케일링과 PDF/공유 캡처가 함께 사용.
export const FLIPBOOK_PAGE_WIDTH = 1400
export const FLIPBOOK_PAGE_HEIGHT = 990
export const FLIPBOOK_PAGE_RATIO = 297 / 210

// landscapePageInfo 빌더가 생성하는 페이지 정보. 데이터 호환성을 위해 타입만 보존.
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
