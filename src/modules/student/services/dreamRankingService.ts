/**
 * 우리 반 꿈점수 랭킹 서비스.
 *
 * 제약(PLAN.md §0.1): reward_logs / student_reward_stats RLS 는 본인 전용이므로
 * 클라이언트가 동급생의 점수를 직접 읽을 수 없다. 따라서 랭킹은
 *  - additive 마이그레이션(동급 읽기 RLS + denorm 점수)이 적용된 경우: 실제 동급생 점수로 동작.
 *  - 미적용(현재 운영): 데이터를 가져오지 못해 available=false → 화면이 fallback 표시.
 * 어떤 경우도 화면이 깨지지 않는다(PLAN.md §15/§19).
 */
import { supabase } from '../../../shared/lib/supabase'

export interface RankEntry {
  studentId: string
  name: string
  dreamScore: number
  activityScore: number
  level: number
  isMe: boolean
}

export interface RankResult {
  available: boolean
  entries: RankEntry[] // 정렬(내림차순), 동점 동일 순위
  myRank: number | null
  total: number
}

interface RawRow {
  id: string
  name: string | null
  stats: {
    dream_score: number | null
    activity_score: number | null
    dream_level: number | null
  } | null
}

function maskName(name: string): string {
  if (!name) return '학생'
  // 이름 일부 가리기(기존 별명이 있으면 그대로 사용). 2글자 미만이면 그대로.
  const safe = name.trim()
  if (safe.length <= 1) return safe
  if (safe.length === 2) return safe[0] + '*'
  return safe[0] + '*'.repeat(safe.length - 2) + safe[safe.length - 1]
}

/**
 * 같은 학급 동급생의 denorm 점수로 랭킹 구성.
 * 본인 students 행에서 class_id 를 얻어 동급생을 스코핑한다.
 */
export async function getClassRanking(myStudentId: string): Promise<RankResult> {
  // 1) 내 class_id (본인 students 행은 읽기 가능)
  const { data: me, error: meErr } = await supabase
    .from('students')
    .select('id, class_id')
    .eq('id', myStudentId)
    .maybeSingle()

  if (meErr || !me || !me.class_id) {
    return { available: false, entries: [], myRank: null, total: 0 }
  }

  // 2) 동급생 + denorm 점수 조인 (RLS 로 막히면 빈 배열 → fallback)
  const { data, error } = await supabase
    .from('students')
    .select('id, name, stats:student_reward_stats(dream_score, activity_score, dream_level)')
    .eq('class_id', me.class_id)

  if (error || !data || data.length === 0) {
    return { available: false, entries: [], myRank: null, total: 0 }
  }

  const rows = data as unknown as RawRow[]
  const entries: RankEntry[] = rows
    .map((r) => ({
      studentId: r.id,
      name: maskName(r.name ?? '학생'),
      dreamScore: Number(r.stats?.dream_score ?? 0),
      activityScore: Number(r.stats?.activity_score ?? 0),
      level: Number(r.stats?.dream_level ?? 1),
      isMe: r.id === myStudentId,
    }))
    .filter((e) => e.dreamScore > 0 || e.isMe) // 점수 없는 학생은 본인만

  // 정렬(내림차순) + 동점 동일 순위
  entries.sort((a, b) => b.dreamScore - a.dreamScore)
  let rank = 0
  let prevScore = Number.POSITIVE_INFINITY
  entries.forEach((e, i) => {
    if (e.dreamScore < prevScore) {
      rank = i + 1
      prevScore = e.dreamScore
    }
    ;(e as RankEntry & { rank: number }).rank = rank
  })

  const ranked = entries as (RankEntry & { rank: number })[]
  const myRank = ranked.find((e) => e.isMe)?.rank ?? null
  // 본인이 점수 0이어도 entries 에 포함되어 있음. 점수 있는 학생이 한 명도 없으면 fallback.
  const hasScoreData = entries.some((e) => e.dreamScore > 0)

  return {
    available: hasScoreData,
    entries: ranked,
    myRank,
    total: entries.length,
  }
}
