/**
 * OX 퀴즈 정닜 정규화 유틸.
 * 운영 OXQuestion.answer 는 'O' | 'X' 타입이지만, 렌더링 단계에서 안전하게 정규화한다
 * (소문자/기호/오타/빈 값 대응). 데이터 원본은 수정하지 않는다.
 */
export type OxAnswer = 'O' | 'X'

const TRUE_LIKE = new Set(['O', '0', '○', '◯', '●', 'T', 'TRUE', 'Y', 'YES', '맞음', '맞아요', '옳음'])
const FALSE_LIKE = new Set(['X', '×', '✗', '✘', 'F', 'FALSE', 'N', 'NO', '틀림', '아니요', '아니에요', '거짓'])

/**
 * 임의의 정답 값을 'O' | 'X' 로 정규화.
 * - null/undefined/빈 문자열/판별 불가 → 'O'(운영 `data.answer || 'O'` 기본값과 동일).
 */
export function normalizeOxAnswer(raw: unknown): OxAnswer {
  if (raw == null) return 'O'
  const v = String(raw).trim().toUpperCase()
  if (!v) return 'O'
  if (TRUE_LIKE.has(v)) return 'O'
  if (FALSE_LIKE.has(v)) return 'X'
  return 'O'
}
