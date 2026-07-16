/**
 * 레벨 달성 아이템 지급 서비스.
 *
 * 학생이 새 레벨에 도달하면 해당 레벨의 아이템(LEVEL_ITEM_CATALOG)을 자동 지급한다.
 *
 * 설계 원칙(PLAN.md §5, §13 준수):
 * - 점수 영향 0: 레벨 아이템은 student_items 에만 기록(reeward_logs 미사용).
 *   → dreamScore 계산에 관여하지 않아 연쇄 레벨업/점수 왜곡이 없다(레벨 상징 0점과 동일 선상).
 * - 멱등: source_id='dream:item:{level}:{code}' 로 (a)사전 조회 + (b)unique 인덱스(마이그레이션 적용 시) 이중 방어.
 * - DB 미의존: 레벨 아이템이 DB items 에 없으면(시드 마이그레이션 미적용) 조용히 건너뛴다.
 *   배경·레벨·점수는 DB 와 무관하게 동작하므로 기능이 멈추지 않는다.
 * - 자가 복구: student_items 삽입이 실패해도 reward_logs 앵커가 없으므로 다음 호출에 재시도된다.
 */
import { supabase } from '../../../shared/lib/supabase'
import {
  DreamIdempotencyKeys,
  getLevelItems,
  type LevelItemSpec,
} from '../config/dreamProgressionConfig'

export interface GrantedLevelItem {
  level: number
  code: string
  name: string
  itemId: string
}

/** code → id 매핑 조회(DB items). 시드 미적용이면 빈 맵. */
async function fetchItemIdMap(codes: string[]): Promise<Map<string, string>> {
  if (codes.length === 0) return new Map()
  const { data, error } = await supabase
    .from('items')
    .select('id, code')
    .in('code', codes)
  if (error) {
    if (import.meta.env.DEV) console.info('[dreamLevelItemService] fetchItemIdMap failed:', error.message)
    return new Map()
  }
  return new Map((data ?? []).map((r: { id: string; code: string }) => [r.code, r.id]))
}

/** 이미 보유한 레벨 아이템 source_id 집합 조회(중복 지급 방지). */
async function fetchOwnedLevelItemSources(
  studentId: string,
  sourceIds: string[],
): Promise<Set<string>> {
  if (sourceIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from('student_items')
    .select('source_id')
    .eq('student_id', studentId)
    .eq('source_type', 'event')
    .in('source_id', sourceIds)
  if (error) return new Set()
  return new Set((data ?? []).map((r: { source_id: string | null }) => r.source_id ?? ''))
}

/**
 * 새로 달성한 레벨들의 아이템을 지급한다.
 * @returns 새로 지급된(이번 호출에 INSERT 성공한) 아이템 목록.
 */
export async function ensureLevelItems(
  studentId: string,
  levels: number[],
): Promise<GrantedLevelItem[]> {
  if (!studentId || levels.length === 0) return []

  const targets: { level: number; spec: LevelItemSpec }[] = []
  for (const level of levels) {
    for (const spec of getLevelItems(level)) targets.push({ level, spec })
  }
  if (targets.length === 0) return []

  const codes = targets.map((t) => t.spec.code)
  const codeToId = await fetchItemIdMap(codes)
  if (codeToId.size === 0) return [] // 시드 미적용 → 레벨 아이템이 DB 에 없음, 조용히 스킵

  const sourceIds = targets.map((t) => DreamIdempotencyKeys.levelItem(t.level, t.spec.code))
  const owned = await fetchOwnedLevelItemSources(studentId, sourceIds)

  const granted: GrantedLevelItem[] = []
  for (const { level, spec } of targets) {
    const itemId = codeToId.get(spec.code)
    if (!itemId) continue // 이 code 가 아직 DB 에 없음
    const sourceId = DreamIdempotencyKeys.levelItem(level, spec.code)
    if (owned.has(sourceId)) continue // 이미 보유

    try {
      const { error } = await supabase.from('student_items').insert({
        student_id: studentId,
        item_id: itemId,
        source_type: 'event',
        source_id: sourceId,
        quantity: 1,
        is_new: true,
      })
      if (error) {
        // 23505 = unique 인덱스(마이그레이션 적용 시) 중복 → 멱등 성공으로 간주
        if (error.code === '23505') {
          owned.add(sourceId)
          continue
        }
        // RLS/CHECK/일시적 오류 → 이번엔 건너뛰고 다음 호출에 재시도(자가 복구)
        if (import.meta.env.DEV) {
          console.info('[dreamLevelItemService] insert failed (will retry):', spec.code, error.message)
        }
        continue
      }
      owned.add(sourceId)
      granted.push({ level, code: spec.code, name: spec.name, itemId })
    } catch (err) {
      if (import.meta.env.DEV) console.info('[dreamLevelItemService] insert exception:', spec.code, err)
    }
  }

  return granted
}
