/**
 * 꿈점수 계산 순수 함수. (부작용 없음 — 입력 reward_logs 로부터 모든 점수를 도출)
 *
 * 본 파일은 DB 접근을 하지 않는다. dreamScoreService 가 reward_logs(+items join) 를 가져와
 * 여기에 넘기면 점수 분해/레벨/주간·월간 집계를 반환한다.
 *
 * 핵심: 레벨 달성 보너스(200점)는 dreamScore 에 포함되지만 activityScore(레벨 판정용)에서는
 * 제외된다 → 보너스로 인한 연쇄 레벨업이 발생하지 않는다.
 */
import {
  ACTIVITY_SCORE_PER_LEVEL,
  DUPLICATE_ITEM_REPEAT_RATE,
  DREAM_CHAPTERS,
  EVENT_SOURCE_PREFIX,
  levelFromActivityScore,
  MAX_LEVEL,
  REWARD_EVENT_POINTS,
  type ItemRarity,
} from '../config/dreamProgressionConfig'

/** reward_logs 행(선택적으로 items join 포함). */
export interface RewardLogRow {
  id: string
  reward_type: string
  source_id: string | null
  reward_date: string | null
  item_id: string | null
  created_at: string
  item?: { rarity?: string | null } | null
}

export interface DreamScoreBreakdown {
  /** 레벨 판정용 실제 활동 점수(레벨 보너스 제외) */
  activityScore: number
  /** 레벨 달성 보너스 점수 */
  bonusScore: number
  /** 화면 표시 전체 누적 점수 = activityScore + bonusScore */
  dreamScore: number

  level: number

  // — 점수 구성 요소 —
  attendancePoints: number
  streak5Points: number
  comicCompletePoints: number
  teacherPraisePoints: number
  itemPoints: number
  specialMissionPoints: number
  levelBonusPoints: number

  // — 횟수 —
  attendanceCount: number
  streak5Count: number
  comicCompleteCount: number
  teacherPraiseCount: number
  itemCount: number
  specialMissionCount: number

  // — 기간 집계 —
  weeklyPoints: number
  monthlyPoints: number

  // — 레벨 진행 —
  nextLevel: number | null
  pointsToNextLevel: number
  levelProgressRate: number // 0~1 (현재 레벨 구간 내 진행률)

  // — 상세 내역용 최근 로그(점수가 부여된 것만) —
  scoredLogs: ScoredLogEntry[]
}

export interface ScoredLogEntry {
  id: string
  reward_type: string
  source_id: string | null
  created_at: string
  points: number
  label: string
  isBonus: boolean
}

function rarityOf(row: RewardLogRow): ItemRarity | null {
  const r = row.item?.rarity
  if (r === 'common' || r === 'uncommon' || r === 'rare' || r === 'epic' || r === 'legendary') {
    return r
  }
  return null
}

function isSameWeek(dateStr: string, now: Date): boolean {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false
  // 이번 주(월요일 시작) 판정
  const startOfWeek = new Date(now)
  const day = (startOfWeek.getDay() + 6) % 7 // 0=월
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(startOfWeek.getDate() - day)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)
  return d >= startOfWeek && d < endOfWeek
}

function isSameMonth(dateStr: string, now: Date): boolean {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function eventLabelFromSource(sourceId: string): { label: string; isBonus: boolean } | null {
  if (sourceId.startsWith(EVENT_SOURCE_PREFIX.streak5)) return { label: '5일 연속 출석', isBonus: false }
  if (sourceId.startsWith(EVENT_SOURCE_PREFIX.level)) return { label: '레벨 달성 보너스', isBonus: true }
  if (sourceId.startsWith(EVENT_SOURCE_PREFIX.symbol)) return { label: '레벨 상징 아이템', isBonus: false }
  if (sourceId.startsWith(EVENT_SOURCE_PREFIX.special)) return { label: '특별 미션', isBonus: false }
  return null
}

/**
 * reward_logs 배열로부터 점수 분해를 계산한다.
 * @param now 기준 시각(주간/월간 집계용). 기본 현재.
 */
export function computeDreamScore(rows: RewardLogRow[], now: Date = new Date()): DreamScoreBreakdown {
  const sorted = [...rows].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  let attendancePoints = 0
  let streak5Points = 0
  let comicCompletePoints = 0
  let teacherPraisePoints = 0
  let itemPoints = 0
  let specialMissionPoints = 0
  let levelBonusPoints = 0

  let attendanceCount = 0
  let streak5Count = 0
  let comicCompleteCount = 0
  let teacherPraiseCount = 0
  let itemCount = 0
  let specialMissionCount = 0

  let weeklyPoints = 0
  let monthlyPoints = 0
  const scoredLogs: ScoredLogEntry[] = []

  // 동일 아이템 중복 획득 추적(아이템 점수에만 적용)
  const itemFirstSeen = new Set<string>()

  const addScored = (
    row: RewardLogRow,
    pts: number,
    label: string,
    isBonus: boolean,
    counter: () => void,
  ) => {
    if (pts === 0) return // 0점(심볼 등)은 점수/내역에서 제외
    counter()
    if (isSameWeek(row.created_at, now)) weeklyPoints += pts
    if (isSameMonth(row.created_at, now)) monthlyPoints += pts
    scoredLogs.push({
      id: row.id,
      reward_type: row.reward_type,
      source_id: row.source_id,
      created_at: row.created_at,
      points: pts,
      label,
      isBonus,
    })
  }

  for (const row of sorted) {
    const rt = row.reward_type
    switch (rt) {
      case 'attendance': {
        const pts = REWARD_EVENT_POINTS.attendance
        attendancePoints += pts
        addScored(row, pts, '일일 출석', false, () => {
          attendanceCount++
        })
        break
      }
      case 'comic_complete': {
        const pts = REWARD_EVENT_POINTS.comicComplete
        comicCompletePoints += pts
        addScored(row, pts, '만화 작품 완성', false, () => {
          comicCompleteCount++
        })
        break
      }
      case 'teacher_reward': {
        const pts = REWARD_EVENT_POINTS.teacherPraise
        teacherPraisePoints += pts
        addScored(row, pts, '선생님 칭찬', false, () => {
          teacherPraiseCount++
        })
        break
      }
      case 'hidden_encounter':
      case 'lucky_reward': {
        // 아이템 등급 기반 점수(중복 25%)
        const rarity = rarityOf(row)
        const base =
          rarity === null
            ? REWARD_EVENT_POINTS.attendance // 등급 모르면 일반(50) 기본값
            : basePointsForRarity(rarity)
        const first = row.item_id ? !itemFirstSeen.has(row.item_id) : true
        if (row.item_id) itemFirstSeen.add(row.item_id)
        const pts = Math.round(base * (first ? 1 : DUPLICATE_ITEM_REPEAT_RATE))
        itemPoints += pts
        addScored(row, pts, '아이템 획득', false, () => {
          itemCount++
        })
        break
      }
      case 'event': {
        const sid = row.source_id ?? ''
        const parsed = eventLabelFromSource(sid)
        if (!parsed) break // 알 수 없는 event 무시
        if (sid.startsWith(EVENT_SOURCE_PREFIX.streak5)) {
          const pts = REWARD_EVENT_POINTS.streak5
          streak5Points += pts
          addScored(row, pts, parsed.label, parsed.isBonus, () => {
            streak5Count++
          })
        } else if (sid.startsWith(EVENT_SOURCE_PREFIX.level)) {
          const pts = REWARD_EVENT_POINTS.levelBonus
          levelBonusPoints += pts // bonusScore
          addScored(row, pts, parsed.label, parsed.isBonus, () => {
            /* 레벨 달성 횟수는 별도 미집계 */
          })
        } else if (sid.startsWith(EVENT_SOURCE_PREFIX.special)) {
          const pts = REWARD_EVENT_POINTS.specialMission
          specialMissionPoints += pts
          addScored(row, pts, parsed.label, parsed.isBonus, () => {
            specialMissionCount++
          })
        }
        // symbol 은 0점 → addScored 에서 제외
        break
      }
      default:
        break
    }
  }

  const activityScore =
    attendancePoints + streak5Points + comicCompletePoints + teacherPraisePoints + itemPoints + specialMissionPoints
  const bonusScore = levelBonusPoints
  const dreamScore = activityScore + bonusScore
  const level = levelFromActivityScore(activityScore)

  // 다음 레벨까지 남은 활동 점수 / 진행률
  const chapter = DREAM_CHAPTERS.find((c) => c.level === level) ?? DREAM_CHAPTERS[0]
  const levelStart = chapter.minActivityScore
  const levelEnd = chapter.maxActivityScore ?? null
  const isMax = level >= MAX_LEVEL
  const nextLevel = isMax ? null : level + 1
  const pointsToNextLevel = isMax ? 0 : Math.max(0, (chapter.maxActivityScore ?? 0) + 1 - activityScore)
  const span = levelEnd === null ? ACTIVITY_SCORE_PER_LEVEL : levelEnd - levelStart + 1
  const progressed = activityScore - levelStart
  const levelProgressRate = Math.max(0, Math.min(1, span > 0 ? progressed / span : 0))

  return {
    activityScore,
    bonusScore,
    dreamScore,
    level,
    attendancePoints,
    streak5Points,
    comicCompletePoints,
    teacherPraisePoints,
    itemPoints,
    specialMissionPoints,
    levelBonusPoints,
    attendanceCount,
    streak5Count,
    comicCompleteCount,
    teacherPraiseCount,
    itemCount,
    specialMissionCount,
    weeklyPoints,
    monthlyPoints,
    nextLevel,
    pointsToNextLevel,
    levelProgressRate,
    scoredLogs: scoredLogs.reverse(), // 최신순
  }
}

function basePointsForRarity(rarity: ItemRarity): number {
  switch (rarity) {
    case 'common':
      return 50
    case 'uncommon':
      return 80
    case 'rare':
      return 120
    case 'epic':
      return 200
    case 'legendary':
      return 300
    case 'symbol':
      return 0
  }
}
