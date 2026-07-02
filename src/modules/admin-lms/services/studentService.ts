// ──────────────────────────────────────────────
// 서비스 - 학생 (현재 mock, 추후 Supabase 연결)
// TODO: supabase.from('students') 조회로 교체
// ──────────────────────────────────────────────
import type { Student } from '../types'
import { MOCK_STUDENTS } from '../data/mockStudents'
import { supabase } from '../../../shared/lib/supabase'

export async function fetchStudentsByClass(classId: string): Promise<Student[]> {
  return Promise.resolve(MOCK_STUDENTS.filter(s => s.classId === classId))
}

export async function fetchStudentsByGrade(grade: number): Promise<Student[]> {
  return Promise.resolve(MOCK_STUDENTS.filter(s => s.grade === grade))
}

export async function fetchStudentsByCenterAndGrade(centerId: string, grade: number): Promise<Student[]> {
  console.log('[fetchStudentsByCenterAndGrade] input -> centerId:', centerId, 'grade:', grade)
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('center_id', centerId)
      .eq('grade', `${grade}학년`)
      .eq('status', 'active')

    console.log('[fetchStudentsByCenterAndGrade] Supabase query result -> data:', data, 'error:', error)

    if (error) throw error

    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      loginId: item.login_id,
      password: item.password || '******',
      classId: item.class_id || `class-${parseInt(item.grade) || grade}`,
      className: item.class_name || `${parseInt(item.grade) || grade}학년 전체`,
      grade: parseInt(item.grade) || grade,
      number: item.number || 0,
      createdAt: item.created_at || new Date().toISOString(),
    }))
  } catch (err) {
    console.error('Failed to fetch students by center and grade:', err)
    return []
  }
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  // TODO: supabase.auth.admin.createUser + supabase.from('profiles').insert(...)
  const newStudent: Student = {
    ...data,
    id: `stu-${Date.now()}`,
    createdAt: new Date().toLocaleDateString('ko-KR').replace(/\./g, '.').trim(),
  }
  MOCK_STUDENTS.push(newStudent)
  return newStudent
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  // TODO: supabase.from('profiles').update(data).eq('id', id)
  const idx = MOCK_STUDENTS.findIndex(s => s.id === id)
  if (idx !== -1) Object.assign(MOCK_STUDENTS[idx], data)
}

export async function deleteStudents(ids: string[]): Promise<void> {
  // TODO: supabase.auth.admin.deleteUser + profiles
  ids.forEach(id => {
    const idx = MOCK_STUDENTS.findIndex(s => s.id === id)
    if (idx !== -1) MOCK_STUDENTS.splice(idx, 1)
  })
}

export async function moveStudentsToClass(studentIds: string[], targetClassId: string, targetClassName: string): Promise<void> {
  // TODO: supabase.from('profiles').update({ class_id: targetClassId })...
  studentIds.forEach(id => {
    const student = MOCK_STUDENTS.find(s => s.id === id)
    if (student) {
      student.classId = targetClassId
      student.className = targetClassName
    }
  })
}
