/**
 * 플립북 OX 퀴즈 답안 영구 저장 유틸.
 *
 * 목적:
 *  - 학생이 고른 OX 답안을 새로고침 / PWA 재실행 / 앱 종료 후에도 유지.
 *  - 작품(프로젝트)과 사용자(또는 익명 세션) 단위로 분리 → 다른 작품·다른 학생 섞임 방지.
 *  - 오프라인에서도 동작(서버 요청 없이 클라이언트 localStorage 사용).
 *
 * 저장 방식:
 *  - 기존 projectStorage(saveToStorage/loadFromStorage) 재사용(LZ 압축, QuotaExceeded 처리).
 *  - 스키마 버전(v) 으로 마이그레이션/파손 대응.
 *
 * 보안:
 *  - 민감정보(비밀번호·토큰·키)는 저장하지 않는다. 답안/정답/타임스탬프만 저장.
 */
import { loadFromStorage, saveToStorage } from './projectStorage'
import type { OxAnswer } from '../components/viewer/flipbookOxQuiz'

export { judgeOx } from '../components/viewer/flipbookOxQuiz'

export const FLIPBOOK_QUIZ_SCHEMA_VERSION = 1
const ANON_ID_KEY = 'toonschool:anon-viewer-id'

/** 단일 문항의 저장 레코드. */
export type StoredQuizAnswer = {
  /** 학생이 고른 답 */
  answer: OxAnswer
  /** 해당 문항의 실제 정답(저장 시점 기준) */
  correct: OxAnswer
  /** 정답 여부(answer === correct) */
  isCorrect: boolean
  /** 최초 답변 시각(ISO 문자열) */
  answeredAt: string
}

/** 저장소 전체 구조(스키마 버전 포함). */
export type QuizAnswerStore = {
  v: number
  answers: Record<number, StoredQuizAnswer>
}

/**
 * 익명 사용자용 1회 생성 안정 ID 반환(로그인하지 않은 기기에서 작품 분리용).
 * 실패 시 고정 폴백 문자열.
 */
function getOrCreateAnonymousId(): string {
  try {
    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      // crypto.randomUUID 가 있으면 사용, 없으면 시간+난수 조합.
      const rand =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      id = rand
      localStorage.setItem(ANON_ID_KEY, id)
    }
    return id
  } catch {
    return 'anon-fallback'
  }
}

/**
 * 저장 키 생성. userId·projectId 가 같으면 항상 동일한 키(작품·사용자 분리).
 * projectId 가 없으면 빈 문자열(아직 작품 로드 전 → 저장 보류).
 */
export function buildQuizAnswerKey(userId?: string | null, projectId?: string | null): string {
  if (!projectId) return ''
  const owner = userId || getOrCreateAnonymousId()
  return `toonschool:flipbook-quiz-answers:${owner}:${projectId}`
}

/** StoredQuizAnswer 배열을 렌더링용 선택 맵(Record<문제번호, 'O'|'X'>)으로 변환. */
export function toSelectionMap(
  answers: Record<number, StoredQuizAnswer>,
): Record<number, OxAnswer> {
  const out: Record<number, OxAnswer> = {}
  for (const [k, v] of Object.entries(answers)) {
    const num = Number(k)
    if (Number.isFinite(num) && v && (v.answer === 'O' || v.answer === 'X')) {
      out[num] = v.answer
    }
  }
  return out
}

/** 손상/스키마 불일치 여부 검증. 유효한 answers 맵만 반환, 아니면 빈 맵. */
export function loadQuizAnswers(key: string): Record<number, StoredQuizAnswer> {
  if (!key) return {}
  try {
    const store = loadFromStorage<QuizAnswerStore>(key)
    if (!store || typeof store !== 'object') return {}
    // 스키마 버전이 다르거나 구조가 다르면 과거 데이터 무시(안전).
    if (store.v !== FLIPBOOK_QUIZ_SCHEMA_VERSION) return {}
    const answers = store.answers
    if (!answers || typeof answers !== 'object') return {}
    const cleaned: Record<number, StoredQuizAnswer> = {}
    for (const [k, v] of Object.entries(answers)) {
      const num = Number(k)
      if (!Number.isFinite(num)) continue
      if (!v || typeof v !== 'object') continue
      const answer = (v as StoredQuizAnswer).answer
      const correct = (v as StoredQuizAnswer).correct
      if (answer !== 'O' && answer !== 'X') continue
      if (correct !== 'O' && correct !== 'X') continue
      cleaned[num] = {
        answer,
        correct,
        isCorrect: answer === correct,
        answeredAt: typeof (v as StoredQuizAnswer).answeredAt === 'string' ? (v as StoredQuizAnswer).answeredAt : '',
      }
    }
    return cleaned
  } catch {
    return {}
  }
}

/** answers 맵을 저장소로 저장(스키마 버전 포함). 실패해도 예외를 밖으로 전파하지 않는다. */
export function saveQuizAnswers(key: string, answers: Record<number, StoredQuizAnswer>): boolean {
  if (!key) return false
  const store: QuizAnswerStore = { v: FLIPBOOK_QUIZ_SCHEMA_VERSION, answers }
  try {
    return saveToStorage(key, store)
  } catch {
    // QuotaExceeded 등: 저장 실패가 화면 동작을 막지 않도록 조용히 무시.
    return false
  }
}
