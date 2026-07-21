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

/**
 * 원본 정답 값이 'O'/'X' 로 판별 가능한 "신뢰할 수 있는" 값인지 검사.
 * - normalizeOxAnswer 는 알 수 없는 값을 기본값 'O' 로 바꿔버리기 때문에,
 *   정답 판정을 하기 전에 이 함수로 실제 데이터가 유효한 정답인지 먼저 확인해야
 *   학생에게 잘못된 정답을 보여주는 일을 막을 수 있다.
 * - null/undefined/빈 문자열/알 수 없는 토큰 → false.
 */
export function isKnownOxAnswer(raw: unknown): boolean {
  if (raw == null) return false
  const v = String(raw).trim().toUpperCase()
  if (!v) return false
  return TRUE_LIKE.has(v) || FALSE_LIKE.has(v)
}

/**
 * 두 OX 값이 같은지(정답 여부) 판정. 타입이 이미 보장된 값에 사용.
 */
export function judgeOx(selected: OxAnswer, correct: OxAnswer): boolean {
  return selected === correct
}
