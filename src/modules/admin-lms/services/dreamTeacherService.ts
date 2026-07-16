/**
 * 교사용 꿈 성장 서비스.
 *
 * 제약(PLAN.md §0.1):
 * - 학생 목록: 기존 student-by-teacher Edge Function(service_role)으로 교사 격리 스코핑. 운영 동작.
 * - 학생 점수(student_reward_stats): 본인 전용 RLS → 교사가 직접 읽을 수 없어 운영(마이그레이션 미적용)에선 빈 값.
 *   additive 마이그레이션(교사 읽기 RLS) 적용 시 점수가 표시된다. 화면은 fallback.
 * - 월간 칭찬 횟수: teacher_messages(class_key=`praise:{studentId}`)로 카운트. 운영 동작.
 */
import { supabase } from '../../../shared/lib/supabase'
import { fetchStudentsByTeacher } from './studentService'
import type { Student } from '../types'
import { getChapter } from '../../student/config/dreamProgressionConfig'
import { getMonthRange, studentIdFromClassKey } from '../../student/services/teacherPraiseService'

export interface StudentDreamRow {
  student: Student
  dreamScore: number | null
  activityScore: number | null
  level: number | null
  chapterTitle: string | null
  pointsToNextLevel: number | null
  monthlyPraiseCount: number
  available: boolean // 점수 데이터 사용 가능 여부
}

interface StatsRow {
  student_id: string
  dream_score: number | null
  activity_score: number | null
  dream_level: number | null
}

/**
 * 교사 담당 학생 + 꿈 점수/레벨 + 월간 칭찬 횟수.
 * @param teacherId 교사 profile id
 * @param grade 0 = 전체 학년
 */
export async function getTeacherStudentsDream(teacherId: string, grade = 0): Promise<StudentDreamRow[]> {
  const students = await fetchStudentsByTeacher(grade)
  if (students.length === 0) return []

  const ids = students.map((s) => s.id)

  // 점수(RLS 로 막히면 빈 → fallback). 단일 배치 쿼리.
  let statsMap = new Map<string, StatsRow>()
  let statsAvailable = false
  try {
    const { data: stats, error } = await supabase
      .from('student_reward_stats')
      .select('student_id, dream_score, activity_score, dream_level')
      .in('student_id', ids)
    if (!error && stats && stats.length > 0) {
      statsAvailable = true
      for (const r of stats as StatsRow[]) statsMap.set(r.student_id, r)
    }
  } catch {
    /* fallback */
  }

  // 월간 칭찬 횟수(teacher_messages — 운영 읽기 가능)
  const praiseMap = await getMonthlyPraiseCounts(teacherId)

  return students.map((student) => {
    const st = statsMap.get(student.id)
    const level = st?.dream_level ?? null
    const activityScore = st?.activity_score ?? null
    const dreamScore = st?.dream_score ?? null
    const chapter = level ? getChapter(level) : null
    const pointsToNextLevel =
      chapter && activityScore !== null && chapter.maxActivityScore !== null
        ? Math.max(0, chapter.maxActivityScore + 1 - activityScore)
        : null
    return {
      student,
      dreamScore,
      activityScore,
      level,
      chapterTitle: chapter?.chapterTitle ?? null,
      pointsToNextLevel,
      monthlyPraiseCount: praiseMap.get(student.id) ?? 0,
      available: statsAvailable && !!st,
    }
  })
}

/** 교사가 이번 달에 보낸 칭찬을 학생별로 집계. */
async function getMonthlyPraiseCounts(teacherId: string): Promise<Map<string, number>> {
  const { firstDay, nextFirstDay } = getMonthRange()
  const map = new Map<string, number>()
  try {
    const { data, error } = await supabase
      .from('teacher_messages')
      .select('class_key')
      .eq('teacher_id', teacherId)
      .like('class_key', 'praise:%')
      .gte('message_date', firstDay)
      .lt('message_date', nextFirstDay)
    if (error || !data) return map
    for (const row of data as { class_key: string }[]) {
      const sid = studentIdFromClassKey(row.class_key)
      if (sid) map.set(sid, (map.get(sid) ?? 0) + 1)
    }
  } catch {
    /* ignore */
  }
  return map
}
