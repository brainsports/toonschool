import { supabase } from '../../../shared/lib/supabase'

export interface StudentAttendanceRecord {
  id: string
  student_id: string
  reward_date: string
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
  const lastDate = new Date(year, month, 0).getDate()
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`

  return { year, month, firstDay, lastDay, today }
}

export async function ensureTodayAttendance(studentId: string) {
  const { today } = getCurrentAttendanceMonth()

  const { error } = await supabase
    .from('reward_logs')
    .insert({
      student_id: studentId,
      reward_type: 'attendance',
      reward_date: today,
      source_id: null,
      item_id: null,
    })

  if (error && error.code !== '23505') {
    throw error
  }

  return today
}

export async function getMonthlyAttendance(studentId: string, date = new Date()): Promise<StudentAttendanceRecord[]> {
  const { firstDay, lastDay } = getCurrentAttendanceMonth(date)

  const { data, error } = await supabase
    .from('reward_logs')
    .select('id, student_id, reward_date, created_at')
    .eq('student_id', studentId)
    .eq('reward_type', 'attendance')
    .gte('reward_date', firstDay)
    .lte('reward_date', lastDay)
    .order('reward_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as StudentAttendanceRecord[]
}