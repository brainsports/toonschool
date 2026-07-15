/**
 * 툰스쿨 플립북 16:9 — 공통 파스텔 자연 배경.
 * 확정된 배경 에셋(pastel-landscape-background.png)을 페이지 전체에 덮는다.
 * - 인라인 SVG 재해석 금지(사용자 확정 에셋 사용).
 * - 글자/카드/버튼은 포함하지 않고 꽃·언덕·구름·나비만 배경.
 * - 이미지 로딩 전/실패 시 파스텔 하늘색(var(--flp-sky))이 먼저 표시되어 깜빡임/빈 화면 방지.
 * - pointer-events:none, 장식(arialabel) 처리.
 */
import bgUrl from '../../../../assets/flipbook/pastel-landscape-background.png'

export type FlipbookBackgroundVariant = 'default' | 'cover' | 'content' | 'quiet'

export default function FlipbookBackground({
  variant = 'default',
}: {
  variant?: FlipbookBackgroundVariant
}) {
  return (
    <div
      className={`flp-bg flp-bg--${variant}`}
      style={{ backgroundImage: `url(${bgUrl})` }}
      role="img"
      aria-label="파스텔 자연 배경(하늘, 구름, 초록 언덕, 들꽃, 나비)"
    />
  )
}
