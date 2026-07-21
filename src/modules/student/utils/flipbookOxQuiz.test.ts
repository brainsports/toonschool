import { describe, it, expect } from 'vitest'
import { normalizeOxAnswer, isKnownOxAnswer, judgeOx } from '../components/viewer/flipbookOxQuiz'

describe('normalizeOxAnswer', () => {
  it("true-like 값을 'O'로 정규화한다", () => {
    expect(normalizeOxAnswer('O')).toBe('O')
    expect(normalizeOxAnswer('o')).toBe('O')
    expect(normalizeOxAnswer('0')).toBe('O')
    expect(normalizeOxAnswer(true)).toBe('O')
    expect(normalizeOxAnswer('TRUE')).toBe('O')
    expect(normalizeOxAnswer('맞음')).toBe('O')
    expect(normalizeOxAnswer('맞아요')).toBe('O')
  })

  it("false-like 값을 'X'로 정규화한다", () => {
    expect(normalizeOxAnswer('X')).toBe('X')
    expect(normalizeOxAnswer('x')).toBe('X')
    expect(normalizeOxAnswer(false)).toBe('X')
    expect(normalizeOxAnswer('FALSE')).toBe('X')
    expect(normalizeOxAnswer('틀림')).toBe('X')
    expect(normalizeOxAnswer('아니에요')).toBe('X')
  })

  it('null/빈 값/알 수 없는 값은 기본값 O로 둔다', () => {
    expect(normalizeOxAnswer(null)).toBe('O')
    expect(normalizeOxAnswer(undefined)).toBe('O')
    expect(normalizeOxAnswer('')).toBe('O')
    expect(normalizeOxAnswer('   ')).toBe('O')
    expect(normalizeOxAnswer('???')).toBe('O')
  })
})

describe('isKnownOxAnswer', () => {
  it('명확한 O/X 토큰은 신뢰 가능(true)', () => {
    expect(isKnownOxAnswer('O')).toBe(true)
    expect(isKnownOxAnswer('X')).toBe(true)
    expect(isKnownOxAnswer(true)).toBe(true)
    expect(isKnownOxAnswer(false)).toBe(true)
    expect(isKnownOxAnswer('0')).toBe(true)
    expect(isKnownOxAnswer('맞아요')).toBe(true)
    expect(isKnownOxAnswer('아니요')).toBe(true)
  })

  it('null/빈 값/알 수 없는 값은 신뢰 불가(false) → 정답 판정 보류', () => {
    expect(isKnownOxAnswer(null)).toBe(false)
    expect(isKnownOxAnswer(undefined)).toBe(false)
    expect(isKnownOxAnswer('')).toBe(false)
    expect(isKnownOxAnswer(1)).toBe(false) // 숫자 1은 토큰에 없음
    expect(isKnownOxAnswer('???')).toBe(false)
    expect(isKnownOxAnswer({})).toBe(false)
  })
})

describe('judgeOx', () => {
  it('선택과 정답이 같으면 true, 다르면 false', () => {
    expect(judgeOx('O', 'O')).toBe(true)
    expect(judgeOx('X', 'X')).toBe(true)
    expect(judgeOx('O', 'X')).toBe(false)
    expect(judgeOx('X', 'O')).toBe(false)
  })
})
