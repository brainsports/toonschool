import { supabase } from '../../../shared/lib/supabase'

export interface StudentAttendanceRecord {
  id: string
  student_id: string
  attendance_date: string
  created_at: string
}

function getKoreaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getCurrentAttendanceMonth(date = new Date()) {
  const today = getKoreaDateKey(date)
  const [year, month] = today.split('-').map(Number)
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonthFirstDay = `${nextMonthYear}-${String(nextMonth).padStart(2, '0')}-01`
  
  const lastDate = new Date(year, month, 0).getDate()
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`

  return { year, month, firstDay, lastDay, today, nextMonthFirstDay }
}

export async function ensureTodayAttendance(studentId: string) {
  const { today } = getCurrentAttendanceMonth()

  const { error } = await supabase
    .from('student_attendance_logs')
    .insert({
      student_id: studentId,
      attendance_date: today,
    })

  if (error && error.code !== '23505') {
    console.error('[studentAttendanceService] 오늘 출석 기록 실패:', error)
    throw error
  }

  return today
}

export async function getMonthlyAttendance(studentId: string, date = new Date()): Promise<StudentAttendanceRecord[]> {
  const { firstDay, nextMonthFirstDay } = getCurrentAttendanceMonth(date)

  const { data, error } = await supabase
    .from('student_attendance_logs')
    .select('id, student_id, attendance_date, created_at')
    .eq('student_id', studentId)
    .gte('attendance_date', firstDay)
    .lt('attendance_date', nextMonthFirstDay)
    .order('attendance_date', { ascending: true })

  if (error) {
    console.error('[studentAttendanceService] 이번 달 출석 조회 실패:', error)
    throw error
  }
  return (data ?? []) as StudentAttendanceRecord[]
}

export async function getTotalAttendanceCount(studentId: string): Promise<number> {
  const { data, error } = await supabase
    .from('student_attendance_logs')
    .select('attendance_date')
    .eq('student_id', studentId)

  if (error) {
    console.error('[studentAttendanceService] 총 출석일수 조회 실패:', error)
    throw error
  }
  return data ? data.length : 0
}

export async function getAttendanceRewardItemCount(studentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('student_items')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('source_type', 'attendance')

  if (error) throw error
  return count ?? 0
}