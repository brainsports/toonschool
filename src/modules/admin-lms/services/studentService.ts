// ──────────────────────────────────────────────
// 서비스 - 학생 (현재 mock, 추후 Supabase 연결)
// TODO: supabase.from('students') 조회로 교체
// ──────────────────────────────────────────────
import type { Student } from '../types'
import { MOCK_STUDENTS } from '../data/mockStudents'

export async function fetchStudentsByClass(classId: string): Promise<Student[]> {
  return Promise.resolve(MOCK_STUDENTS.filter(s => s.classId === classId))
}

export async function fetchStudentsByGrade(grade: number): Promise<Student[]> {
  return Promise.resolve(MOCK_STUDENTS.filter(s => s.grade === grade))
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
