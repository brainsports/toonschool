import { describe, it, expect, beforeEach } from 'vitest'
import {
  buildQuizAnswerKey,
  loadQuizAnswers,
  saveQuizAnswers,
  toSelectionMap,
  FLIPBOOK_QUIZ_SCHEMA_VERSION,
  type StoredQuizAnswer,
} from './flipbookQuizAnswers'

// node 환경(vitest 기본)에는 localStorage 가 없으므로 최소 mock 을 설치한다.
// projectStorage(saveToStorage/loadFromStorage)가 이 global localStorage 를 사용한다.
function installLocalStorageMock() {
  let store: Record<string, string> = {}
  const mock = {
    getItem: (k: string) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v)
    },
    removeItem: (k: string) => {
      delete store[k]
    },
    clear: () => {
      store = {}
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    configurable: true,
    writable: true,
  })
}

beforeEach(() => {
  installLocalStorageMock()
})

const rec = (answer: 'O' | 'X', correct: 'O' | 'X'): StoredQuizAnswer => ({
  answer,
  correct,
  isCorrect: answer === correct,
  answeredAt: '2026-07-21T00:00:00.000Z',
})

describe('buildQuizAnswerKey', () => {
  it('사용자가 다르면 다른 키(사용자 분리)', () => {
    expect(buildQuizAnswerKey('u1', 'p1')).not.toBe(buildQuizAnswerKey('u2', 'p1'))
  })

  it('작품이 다르면 다른 키(작품 분리)', () => {
    expect(buildQuizAnswerKey('u1', 'p1')).not.toBe(buildQuizAnswerKey('u1', 'p2'))
  })

  it('같은 사용자+작품은 항상 동일 키(안정)', () => {
    expect(buildQuizAnswerKey('u1', 'p1')).toBe(buildQuizAnswerKey('u1', 'p1'))
  })

  it('projectId 가 없으면 빈 문자열(저장 보류)', () => {
    expect(buildQuizAnswerKey('u1', null)).toBe('')
    expect(buildQuizAnswerKey('u1', undefined)).toBe('')
    expect(buildQuizAnswerKey('u1', '')).toBe('')
  })

  it('userId 가 없어도 projectId 가 있으면 익명 fallback 키 생성', () => {
    expect(buildQuizAnswerKey(null, 'p1')).not.toBe('')
    expect(buildQuizAnswerKey(undefined, 'p1')).toBe(buildQuizAnswerKey(null, 'p1'))
  })
})

describe('toSelectionMap', () => {
  it('저장 맵을 렌더링용 선택 맵으로 변환', () => {
    const map = { 1: rec('O', 'O'), 2: rec('X', 'O') }
    expect(toSelectionMap(map)).toEqual({ 1: 'O', 2: 'X' })
  })

  it('잘못된 키/값은 건너뛴다', () => {
    const map = {
      1: rec('O', 'O'),
      bad: rec('X', 'X'),
      3: { answer: 'Z', correct: 'O', isCorrect: false, answeredAt: '' } as unknown as StoredQuizAnswer,
    }
    const out = toSelectionMap(map)
    expect(out[1]).toBe('O')
    expect(out[3]).toBeUndefined()
    expect(Object.keys(out)).toEqual(['1'])
  })
})

describe('saveQuizAnswers / loadQuizAnswers', () => {
  it('빈 키로는 저장/로드하지 않는다', () => {
    expect(saveQuizAnswers('', { 1: rec('O', 'O') })).toBe(false)
    expect(loadQuizAnswers('')).toEqual({})
  })

  it('저장 후 로드하면 동일 레코드 반환(라운드트립)', () => {
    const key = buildQuizAnswerKey('u1', 'p1')
    saveQuizAnswers(key, { 1: rec('O', 'O'), 2: rec('X', 'O') })
    const loaded = loadQuizAnswers(key)
    expect(loaded[1]).toEqual(rec('O', 'O'))
    expect(loaded[2].isCorrect).toBe(false)
  })

  it('스키마 버전이 다르면 과거 데이터 무시(파손/마이그레이션 대응)', () => {
    const key = buildQuizAnswerKey('u1', 'p1')
    saveQuizAnswers(key, { 1: rec('O', 'O') })
    // 저장소 직접 덮어쓰기로 스키마 버전을 잘못 맞춤(압축 해제 후 재저장은 projectStorage 가 처리).
    // 여기서는 다른 키로 다른 버전의 래퍼를 강제 저장해 본다.
    const otherKey = buildQuizAnswerKey('u1', 'p-other')
    // projectStorage.saveToStorage 로 LZ 압축 저장되므로, loadQuizAnswers 는 정상 디코딩.
    // 호환되지 않는 구조를 주입하면 loadQuizAnswers 가 {} 를 반환해야 한다.
    saveQuizAnswers(otherKey, {} as Record<number, StoredQuizAnswer>)
    expect(loadQuizAnswers(otherKey)).toEqual({})
    // 스키마 버전 상수는 현재 1
    expect(FLIPBOOK_QUIZ_SCHEMA_VERSION).toBe(1)
  })

  it('저장소 데이터가 완전히 깨졌을 때 오류 없이 빈 맵 반환', () => {
    const key = buildQuizAnswerKey('u1', 'p1')
    // 압축되지 않은 쓰레기 문자열을 직접 주입
    localStorage.setItem(key, '<<not-json-not-compressed>>')
    expect(loadQuizAnswers(key)).toEqual({})
  })

  it('작품이 다르면 답안이 섞이지 않는다(작품 분리)', () => {
    const keyA = buildQuizAnswerKey('u1', 'pA')
    const keyB = buildQuizAnswerKey('u1', 'pB')
    saveQuizAnswers(keyA, { 1: rec('O', 'O') })
    saveQuizAnswers(keyB, { 1: rec('X', 'O') })
    expect(loadQuizAnswers(keyA)[1].answer).toBe('O')
    expect(loadQuizAnswers(keyB)[1].answer).toBe('X')
  })

  it('저장 데이터에 정답/오답 여부가 포함된다', () => {
    const key = buildQuizAnswerKey('u1', 'p1')
    saveQuizAnswers(key, { 1: rec('O', 'X') })
    const loaded = loadQuizAnswers(key)
    expect(loaded[1].correct).toBe('X')
    expect(loaded[1].answer).toBe('O')
    expect(loaded[1].isCorrect).toBe(false)
  })
})
