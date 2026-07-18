/**
 * 꿈점수 서비스 — 본인 reward_logs 기반 점수 계산 + idempotent 보너스 기록.
 *
 * 설계(PLAN.md §12, §13):
 * - 점수는 본인 reward_logs(+items join) 의 순수 함수 → 운영(마이그레이션 미적용)에서 100% 동작.
 * - 5일 연속 출석(100), 레벨 달성 보너스(200), 레벨 심볼(0) 은 reward_logs 의 'event' 행으로 기록.
 *   reward_type='event' 는 운영 CHECK 제약에 허용되므로 별도 마이그레이션 없이 동작.
 * - 멱등성: reward_logs unique 인덱스(student_id, reward_type, source_id) + 사전 존재 조회.
 * - 레벨은 '총점(dreamScore)' 기준. 레벨 보너스(200점)도 달성에 기여하며,
 *   ensureLevelBonuses 가 멱등 루프로 연쇄를 수렴시킨다(MAX_LEVEL 초과 불가).
 * - student_reward_stats denorm 동기화는 best-effort(컬럼 미존재 시 에러 무시).
 */
import { supabase } from '../../../shared/lib/supabase'
import {
  DREAM_CHAPTERS,
  DreamIdempotencyKeys,
  EVENT_SOURCE_PREFIX,
  getLevelItems,
  levelFromScore,
  LEVEL_BONUS_POINTS,
  MAX_LEVEL,
  MIN_LEVEL,
} from '../config/dreamProgressionConfig'
import { computeDreamScore, type DreamScoreBreakdown, type RewardLogRow } from '../utils/dreamScore'

/** 본인 reward_logs(+items rarity join) 조회. */
export async function fetchRewardLogRows(studentId: string): Promise<RewardLogRow[]> {
  const { data, error } = await supabase
    .from('reward_logs')
    .select('id, reward_type, source_id, reward_date, item_id, points, created_at, item:items(rarity)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[dreamScoreService] fetchRewardLogRows failed:', error)
    return []
  }
  return (data ?? []) as unknown as RewardLogRow[]
}

/** reward_logs 에서 이미 기록된 'event' 보너스 source_id 집합 조회. */
async function fetchExistingEventSources(studentId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('reward_logs')
    .select('source_id')
    .eq('student_id', studentId)
    .eq('reward_type', 'event')
    .not('source_id', 'is', null)

  if (error) return new Set()
  return new Set((data ?? []).map((r: { source_id: string | null }) => r.source_id ?? ''))
}

/** idempotent event 행 삽입. 이미 존재하면 건너뛴다(사전 조회 + 23505 방어). */
async function insertEventIfMissing(
  studentId: string,
  sourceId: string,
  extra: { item_id?: string | null } = {},
): Promise<boolean> {
  const existing = await fetchExistingEventSources(studentId)
  if (existing.has(sourceId)) return false

  const { error } = await supabase.from('reward_logs').insert({
    student_id: studentId,
    reward_type: 'event',
    source_id: sourceId,
    reward_date: null,
    item_id: extra.item_id ?? null,
  })

  if (error) {
    // 23505 = unique violation(이미 지급됨) → 멱등 성공으로 간주
    if (error.code === '23505') return false
    // 그 외(예: RLS / CHECK)는 로그만 남기고 실패 처리(화면은 계산값으로 동작)
    console.error('[dreamScoreService] insertEventIfMissing failed:', sourceId, error)
    return false
  }
  return true
}

/**
 * 5일 연속 출석 보너스 보정.
 * student_attendance_logs 의 출석일을 순회하며, 연속 출석이 5의 배수에 도달할 때마다
 * 해당 마지막 날짜로 100점을 idempotent 게 기록한다.
 * @returns 새로 기록된 streak5 엔드포인트 날짜 목록
 */
export async function ensureStreak5Bonuses(studentId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('student_attendance_logs')
    .select('attendance_date')
    .eq('student_id', studentId)
    .order('attendance_date', { ascending: true })

  if (error || !data || data.length === 0) return []

  const dates = data.map((r: { attendance_date: string }) => r.attendance_date)
  const credited: string[] = []
  let streak = 0
  let prev: string | null = null

  for (const d of dates) {
    if (prev) {
      const gap = dayDiff(prev, d)
      streak = gap === 1 ? streak + 1 : 1 // 연속이면 +1, 끊기면 1로 리셋
    } else {
      streak = 1
    }
    prev = d

    // 5의 배수 도달 시 마다 보너스
    if (streak > 0 && streak % 5 === 0) {
      const sourceId = DreamIdempotencyKeys.streak5(d)
      const inserted = await insertEventIfMissing(studentId, sourceId)
      if (inserted) credited.push(d)
    }
  }
  return credited
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime()
  const db = new Date(b + 'T00:00:00Z').getTime()
  return Math.round((db - da) / 86_400_000)
}

/** 이미 기록된 레벨 보너스 중 가장 높은 레벨. */
export async function getMaxCreditedLevel(studentId: string): Promise<number> {
  const existing = await fetchExistingEventSources(studentId)
  let max = MIN_LEVEL - 1
  for (const sid of existing) {
    if (sid.startsWith(EVENT_SOURCE_PREFIX.level)) {
      const n = Number.parseInt(sid.slice(EVENT_SOURCE_PREFIX.level.length), 10)
      if (Number.isFinite(n)) max = Math.max(max, n)
    }
  }
  return max
}

export interface LevelUpResult {
  /** 이번에 새로 달성한 레벨들(오름차순) */
  newLevels: number[]
  /** 모달에 표시할 가장 높은 새 레벨(없으면 null) */
  topNewLevel: number | null
}

/**
 * 레벨 달성 보너스(200점) + 레벨 상징(0점) 보정.
 * 레벨은 '총점(dreamScore = activityScore + 레벨 보너스)' 기준.
 * 보너스를 지급하면 총점이 올라 레벨이 더 높아질 수 있으므로, 수렴할 때까지
 * 한 단계씩 idempotent 게 지급하며 다시 조회한다(MAX_LEVEL 초과 불가 → 반드시 수렴).
 */
export async function ensureLevelBonuses(studentId: string, activityScore: number): Promise<LevelUpResult> {
  const newLevels: number[] = []

  for (let guard = 0; guard < MAX_LEVEL + 2; guard++) {
    const maxCredited = await getMaxCreditedLevel(studentId)
    // 이미 기록된 레벨 보너스(2..maxCredited, 각 200점) 합산
    const bonusScore = Math.max(0, maxCredited - 1) * LEVEL_BONUS_POINTS
    const dreamScore = activityScore + bonusScore
    const currentLevel = levelFromScore(dreamScore)
    if (currentLevel <= maxCredited) break // 안정(더 지급할 레벨 없음)

    const lvl = maxCredited + 1
    // 레벨 1은 시작 레벨 → 보너스 대상 제외(심볼만)
    if (lvl > MIN_LEVEL) {
      await insertEventIfMissing(studentId, DreamIdempotencyKeys.levelBonus(lvl))
    }
    // 상징 아이템(0점) — 모든 레벨
    await insertEventIfMissing(studentId, DreamIdempotencyKeys.levelSymbol(lvl))
    newLevels.push(lvl)
  }

  return {
    newLevels,
    topNewLevel: newLevels.length > 0 ? newLevels[newLevels.length - 1] : null,
  }
}

/** 레벨 달성 축하 아이템: 각 레벨(2~currentLevel) 도달 시 해당 레벨 아이템 1개만 지급(전체 10개 아님). */
const LEVEL_ITEM_CELEBRATION_PREFIX = 'dream:levelitem:'
async function grantLevelCelebrationItems(studentId: string, currentLevel: number): Promise<void> {
  const existing = await fetchExistingEventSources(studentId)
  let granted = false

  for (let level = MIN_LEVEL + 1; level <= currentLevel; level++) {
    const sourceId = `${LEVEL_ITEM_CELEBRATION_PREFIX}${level}`
    if (existing.has(sourceId)) continue // 이미 축하 지급 완료

    // 해당 레벨의 아이템 목록(config 카탈로그)
    const specs = getLevelItems(level)
    if (specs.length === 0) {
      await insertEventIfMissing(studentId, sourceId) // 카탈로그 없음 → 마커만
      continue
    }

    // DB items 에서 code → id 매핑
    const codes = specs.map((s) => s.code)
    const { data: dbItems } = await supabase
      .from('items').select('id, code').in('code', codes)
    const codeToId = new Map<string, string>(
      (dbItems ?? []).map((r: { id: string; code: string }) => [r.code, r.id]),
    )
    if (codeToId.size === 0) {
      await insertEventIfMissing(studentId, sourceId) // DB에 아이템 없음 → 마커만
      continue
    }

    // 학생이 이미 보유한 item_id 집합
    const itemIds = Array.from(codeToId.values())
    const { data: ownedRows } = await supabase
      .from('student_items').select('item_id')
      .eq('student_id', studentId).in('item_id', itemIds)
    const ownedIds = new Set((ownedRows ?? []).map((r: { item_id: string }) => r.item_id))

    // 미보유 첫 번째 아이템 지급 (1개만)
    const unownedSpec = specs.find((s) => {
      const id = codeToId.get(s.code)
      return id && !ownedIds.has(id)
    })

    if (unownedSpec) {
      const itemId = codeToId.get(unownedSpec.code)!
      const { error } = await supabase.from('student_items').insert({
        student_id: studentId,
        item_id: itemId,
        source_type: 'event',
        source_id: sourceId,
        quantity: 1,
        is_new: true,
      })
      if (!error) granted = true
    }

    // 축하 완료 마커 (보유 여부와 무관하게 1회만)
    await insertEventIfMissing(studentId, sourceId)
  }

  if (granted && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('studentLootItemsChanged'))
  }
}

export interface DreamProgressResult extends DreamScoreBreakdown {
  /** 이번 호출에서 새로 달성(보너스/심볼이 막 기록된)한 레벨들. 레벨업 모달 1회 표시에 사용. */
  newlyAchievedLevels: number[]
}

// 학생별 in-flight 진행 상태 계산 중복제거.
// 여러 컴포넌트(셸/정원/보물지도)가 동시에 getDreamProgress 를 호출해
// 중복 insert(409)/중복 fetch 가 발생하는 것을 막는다.
const progressInFlight = new Map<string, Promise<DreamProgressResult>>()
const progressCache = new Map<string, { result: DreamProgressResult; ts: number }>()
const PROGRESS_CACHE_MS = 1500

/**
 * 학생의 꿈 진행 상태를 한 번에 계산.
 * streak5 / 레벨 보너스 보정을 수반하며, 보정이 일어났으면 재계산한다.
 * 새로 달성한 레벨(newlyAchievedLevels)을 함께 반환한다.
 * 동일 studentId 에 대한 동시 호출은 하나의 in-flight 요청으로 통합된다.
 */
export function getDreamProgress(studentId: string): Promise<DreamProgressResult> {
  if (!studentId) return Promise.resolve({ ...emptyBreakdown(), newlyAchievedLevels: [] })

  // 짧은 결과 캐시 — 연속 리마운트/이벤트 시 중복 계산/insert 억제
  const cached = progressCache.get(studentId)
  const nowTs = Date.now()
  if (cached && nowTs - cached.ts < PROGRESS_CACHE_MS) {
    return Promise.resolve({ ...cached.result, newlyAchievedLevels: [] }) // 캐시 히트 시 모달 미표시
  }

  const existing = progressInFlight.get(studentId)
  if (existing) return existing

  const p = computeDreamProgress(studentId).finally(() => {
    progressInFlight.delete(studentId)
  })
  progressInFlight.set(studentId, p)
  return p
}

async function computeDreamProgress(studentId: string): Promise<DreamProgressResult> {
  // 1) streak5 보너스 보정(append-only) — activityScore 에 영향
  await ensureStreak5Bonuses(studentId)

  // 2) 로그 조회 + 1차 계산
  let rows = await fetchRewardLogRows(studentId)
  let breakdown = computeDreamScore(rows)

  // 3) 레벨 보너스 보정(activityScore 기준) — bonusScore 에만 영향, activityScore 불변
  const levelUp = await ensureLevelBonuses(studentId, breakdown.activityScore)

  // 4) 보너스/심볼 행이 추가되었을 수 있으니 재조회 + 재계산(dreamScore 에 반영)
  rows = await fetchRewardLogRows(studentId)
  breakdown = computeDreamScore(rows)

  // 5) 레벨 달성 축하 아이템: 도달한 각 레벨(2~currentLevel)마다 해당 레벨 아이템 1개 지급.
  //    과거 전체 일괄 지급(10개)과 달리 1개만. 멱등(reward_logs marker dream:levelitem:{level}).
  await grantLevelCelebrationItems(studentId, breakdown.level)

  // 6) denorm 동기화(best-effort) — 랭킹/교사 조회용. 컬럼 미존재 시 무시.
  void syncDreamStats(studentId, breakdown)

  const result = { ...breakdown, newlyAchievedLevels: levelUp.newLevels }
  progressCache.set(studentId, { result, ts: Date.now() })
  return result
}

// denorm 동기화 가용성 캐시: 한 번 실패(컬럼 미존재 등)하면 이 세션에선 재시도하지 않는다.
// 운영(마이그레이션 미적용)에서 반복되는 400 콘솔 노이즈를 줄인다.
let denormAvailable: boolean | null = null

/** student_reward_stats 에 계산된 점수/레벨을 best-effort 로 기록. */
export async function syncDreamStats(
  studentId: string,
  breakdown: DreamScoreBreakdown,
): Promise<void> {
  if (denormAvailable === false) return // 이 세션에서는 사용 불가로 확인됨
  try {
    // ensure row exists (본인 insert 허용)
    const { error: upsertErr } = await supabase
      .from('student_reward_stats')
      .upsert({ student_id: studentId }, { onConflict: 'student_id', ignoreDuplicates: true })
    if (upsertErr && upsertErr.code !== '23505') {
      // ignore — fallback 모드
    }

    const { error } = await supabase
      .from('student_reward_stats')
      .update({
        dream_score: breakdown.dreamScore,
        activity_score: breakdown.activityScore,
        dream_level: breakdown.level,
      })
      .eq('student_id', studentId)

    if (error) {
      // 컬럼 미존재(42703/PGRST204) 또는 RLS → 이 세션에서 denorm 비활성화(재시도 억제)
      if (error.code === '42703' || error.code === 'PGRST204' || /could not find|does not exist/i.test(error.message)) {
        denormAvailable = false
      }
      if (import.meta.env.DEV) {
        console.info('[dreamScoreService] syncDreamStats skipped (column/RLS):', error.message)
      }
    } else {
      denormAvailable = true
    }
  } catch (err) {
    denormAvailable = false
    if (import.meta.env.DEV) console.info('[dreamScoreService] syncDreamStats exception:', err)
  }
}

/** 본인이 해제한(도달한) 레벨 목록 → 배경 선택 가능 목록. */
export async function getUnlockedLevels(studentId: string): Promise<number[]> {
  const breakdown = await getDreamProgress(studentId)
  const maxCredited = await getMaxCreditedLevel(studentId)
  const reached = Math.max(breakdown.level, maxCredited)
  const unlocked: number[] = []
  for (let l = MIN_LEVEL; l <= Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, reached)); l++) {
    unlocked.push(l)
  }
  return unlocked
}

export function getChapter(level: number) {
  const clamped = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level))
  return DREAM_CHAPTERS.find((c) => c.level === clamped) ?? DREAM_CHAPTERS[0]
}

function emptyBreakdown(): DreamScoreBreakdown {
  return {
    activityScore: 0,
    bonusScore: 0,
    dreamScore: 0,
    level: MIN_LEVEL,
    attendancePoints: 0,
    streak5Points: 0,
    comicCompletePoints: 0,
    teacherPraisePoints: 0,
    itemPoints: 0,
    specialMissionPoints: 0,
    levelBonusPoints: 0,
    attendanceCount: 0,
    streak5Count: 0,
    comicCompleteCount: 0,
    teacherPraiseCount: 0,
    itemCount: 0,
    specialMissionCount: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    nextLevel: 2,
    pointsToNextLevel: 1000,
    levelProgressRate: 0,
    scoredLogs: [],
  }
}
