/**
 * 선생님 칭찬 서비스 — 1회 50점, 학생 1명당 월 최대 3회(월 150점).
 *
 * 제약 기반 설계(PLAN.md §0.1):
 * reward_logs INSERT RLS 는 student_id = auth.uid() 이므로 교사가 학생 reward_logs 에 직접 쓸 수 없다.
 * 대신 **이미 운영에서 교사가 쓰고 학생이 읽을 수 있는 teacher_messages 채널**을 칭찬 전달에 사용하고,
 * 학생이 칭찬 메시지를 읽으면 **본인 reward_logs 에 50점을 자가 기록**한다.
 *   - 교사 작성: teacher_messages(class_key=`praise:{studentId}`) — INSERT RLS(auth.uid() not null) 통과
 *   - 학생 자가기록: reward_logs(reward_type='teacher_reward', source_id=`praise:{messageId}`)
 *     → 본인 INSERT 허용 + unique 인덱스로 자연 멱등
 *
 * 이렇게 하면 별도 마이그레이션/EF 없이 운영에서 칭찬이 동작한다.
 * 월 3회 제한은 교사가 생성 시 본인이 보낸 칭찬(teacher_messages)을 카운트해 적용한다.
 */
import { supabase } from '../../../shared/lib/supabase'
import { DreamIdempotencyKeys } from '../config/dreamProgressionConfig'
import { REWARD_EVENT_POINTS } from '../config/dreamProgressionConfig'

export const PRAISE_MONTHLY_LIMIT = 3
export const PRAISE_POINTS_PER = REWARD_EVENT_POINTS.teacherPraise // 50

export const PRAISE_REASONS = [
  '꾸준히 참여했어요.',
  '친구를 도와주었어요.',
  '끝까지 포기하지 않았어요.',
  '발표를 열심히 했어요.',
  '창의적인 생각을 했어요.',
] as const

export interface PraiseMessage {
  id: string
  teacher_id: string | null
  class_key: string
  title: string | null
  content: string
  message_date: string
  created_at: string
}

function praiseClassKey(studentId: string): string {
  return `praise:${studentId}`
}

function getMonthRange(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth()
  const firstDay = new Date(y, m, 1)
  const nextMonth = new Date(y, m + 1, 1)
  // YYYY-MM-DD (로컬)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { firstDay: fmt(firstDay), nextFirstDay: fmt(nextMonth), today: fmt(date) }
}

function studentIdFromClassKey(classKey: string): string | null {
  if (!classKey.startsWith('praise:')) return null
  return classKey.slice('praise:'.length)
}

/** 교사용: 특정 학생에게 이번 달 보낸 칭찬 횟수. */
export async function getMonthlyPraiseCountForStudent(
  teacherId: string,
  studentId: string,
): Promise<number> {
  const { firstDay, nextFirstDay } = getMonthRange()
  const { count, error } = await supabase
    .from('teacher_messages')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .eq('class_key', praiseClassKey(studentId))
    .gte('message_date', firstDay)
    .lt('message_date', nextFirstDay)

  if (error) {
    console.error('[teacherPraiseService] getMonthlyPraiseCountForStudent failed:', error)
    return 0
  }
  return count ?? 0
}

export interface CreatePraiseResult {
  ok: boolean
  status: 'granted' | 'limit_reached' | 'error'
  remaining: number
  message: string
  messageId?: string
}

/**
 * 교사용: 학생에게 칭찬 전송(50점). 월 3회 초과 시 차단.
 * teacher_messages 에 class_key=`praise:{studentId}` 로 기록한다.
 */
export async function createPraise(params: {
  teacherId: string
  studentId: string
  reason: string
}): Promise<CreatePraiseResult> {
  const { teacherId, studentId, reason } = params
  const { today } = getMonthRange()

  const used = await getMonthlyPraiseCountForStudent(teacherId, studentId)
  if (used >= PRAISE_MONTHLY_LIMIT) {
    return {
      ok: false,
      status: 'limit_reached',
      remaining: 0,
      message: `이번 달 칭찬을 모두 보냈어요(월 ${PRAISE_MONTHLY_LIMIT}회).`,
    }
  }

  const { data, error } = await supabase
    .from('teacher_messages')
    .insert({
      teacher_id: teacherId,
      class_key: praiseClassKey(studentId),
      center_id: null,
      title: '선생님 칭찬',
      content: reason,
      message_date: today,
      is_published: true,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[teacherPraiseService] createPraise failed:', error)
    return { ok: false, status: 'error', remaining: PRAISE_MONTHLY_LIMIT - used, message: '칭찬 전송에 실패했어요.' }
  }

  return {
    ok: true,
    status: 'granted',
    remaining: PRAISE_MONTHLY_LIMIT - used - 1,
    message: '칭찬을 보냈어요! 학생에게 50점이 전달됩니다.',
    messageId: data.id,
  }
}

/** 학생용: 나에게 온 칭찬 메시지 목록. */
export async function getPraiseMessagesForStudent(studentId: string): Promise<PraiseMessage[]> {
  const { data, error } = await supabase
    .from('teacher_messages')
    .select('id, teacher_id, class_key, title, content, message_date, created_at')
    .eq('class_key', praiseClassKey(studentId))
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[teacherPraiseService] getPraiseMessagesForStudent failed:', error)
    return []
  }
  return (data ?? []) as PraiseMessage[]
}

/**
 * 학생용: 아직 점수로 반영하지 않은 칭찬 메시지를 본인 reward_logs 에 자가 기록(+50).
 * source_id=`praise:{messageId}` unique 인덱스로 멱등.
 * @returns 새로 기록한 칭찬 개수
 */
export async function consumePraiseRewards(studentId: string): Promise<number> {
  const messages = await getPraiseMessagesForStudent(studentId)
  if (messages.length === 0) return 0

  // 이미 기록한 칭찬 source_id 집합
  const sourceIds = messages.map((m) => DreamIdempotencyKeys.teacherPraise(m.id))
  const { data: existing, error: existErr } = await supabase
    .from('reward_logs')
    .select('source_id')
    .eq('student_id', studentId)
    .eq('reward_type', 'teacher_reward')
    .in('source_id', sourceIds)

  if (existErr) {
    console.error('[teacherPraiseService] consume existing check failed:', existErr)
    return 0
  }
  const already = new Set((existing ?? []).map((r: { source_id: string | null }) => r.source_id ?? ''))

  let credited = 0
  for (const m of messages) {
    const sid = DreamIdempotencyKeys.teacherPraise(m.id)
    if (already.has(sid)) continue
    const { error } = await supabase.from('reward_logs').insert({
      student_id: studentId,
      reward_type: 'teacher_reward',
      source_id: sid,
      reward_date: null,
      item_id: null,
    })
    if (error) {
      if (error.code === '23505') continue // 멱등
      console.error('[teacherPraiseService] consume insert failed:', sid, error)
      continue
    }
    credited++
  }
  return credited
}

/** 내부 헬퍼 export (교사 대시보드에서 학생별 칭찬 카운트 표시용 class_key 생성). */
export { praiseClassKey, studentIdFromClassKey, getMonthRange }
