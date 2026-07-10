import type { Student } from '../types'
import { MOCK_STUDENTS } from '../data/mockStudents'
import { supabase } from '../../../shared/lib/supabase'

interface StudentScope {
  centerId?: string | null
  organizationId?: string | null
}

export async function fetchStudentsByClass(classId: string): Promise<Student[]> {
  return Promise.resolve(MOCK_STUDENTS.filter(s => s.classId === classId))
}

export async function fetchStudentsByGrade(grade: number): Promise<Student[]> {
  return Promise.resolve(MOCK_STUDENTS.filter(s => s.grade === grade))
}

function normalizeGradeValue(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function fetchStudentsByCenterAndGrade(
  centerId: string | null | undefined,
  grade: number,
  organizationId?: string | null,
): Promise<Student[]> {
  try {
    let query = supabase
      .from('students')
      .select('*')
      .eq('grade', `${grade}학년`)
      .eq('status', 'active')

    if (centerId) {
      query = query.eq('center_id', centerId)
    } else if (organizationId) {
      query = query.eq('organization_id', organizationId)
    } else {
      return []
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(item => {
      const normalizedGrade = normalizeGradeValue(item.grade, grade)
      return {
        id: item.id,
        name: item.name,
        loginId: item.login_id,
        password: item.temp_password || '******',
        classId: item.class_id || `class-${normalizedGrade}`,
        className: item.class_name || `${normalizedGrade}학년 전체`,
        grade: normalizedGrade,
        number: item.number || 0,
        createdAt: item.created_at || new Date().toISOString(),
      }
    })
  } catch (err) {
    console.error('Failed to fetch students by scope and grade:', err)
    return []
  }
}

export async function fetchStudentsByScopeAndGrade(scope: StudentScope, grade: number): Promise<Student[]> {
  return fetchStudentsByCenterAndGrade(scope.centerId, grade, scope.organizationId)
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const { data: responseData, error } = await supabase.functions.invoke('create-student', {
    body: {
      loginId: data.loginId,
      name: data.name,
      password: data.password,
      classId: data.classId,
      className: data.className,
      grade: data.grade,
      number: data.number
    }
  })

  if (error) {
    let errorMessage = '학생 생성에 실패했습니다.'
    let status = 500

    if ((error as any).context) {
      const response = (error as any).context
      if (response.status) {
        status = response.status
      }
      try {
        const clonedRes = response.clone()
        const errorBody = await clonedRes.json()
        if (errorBody && errorBody.error) {
          errorMessage = errorBody.error
        }
      } catch (e) {
        try {
          const clonedRes = response.clone()
          const errorBodyStr = await clonedRes.text()
          if (errorBodyStr) {
            try {
              const parsed = JSON.parse(errorBodyStr)
              if (parsed.error) errorMessage = parsed.error
            } catch {
              errorMessage = errorBodyStr
            }
          }
        } catch (e2) {
          errorMessage = error.message || '학생 생성에 실패했습니다.'
        }
      }
    } else {
      errorMessage = error.message || '학생 생성에 실패했습니다.'
    }

    console.error(`[createStudent] Error (${status}):`, errorMessage)

    if (errorMessage.includes('Edge Function returned a non-2xx status code') || errorMessage === '학생 생성에 실패했습니다.') {
      if (status === 404) errorMessage = '학생 생성 함수가 배포되지 않았습니다.'
      else if (status === 401) errorMessage = '관리자 로그인이 만료되었습니다.'
      else if (status === 403) errorMessage = '학생 계정 생성 권한이 없습니다.'
      else if (status === 409) errorMessage = '이미 사용 중인 학생 아이디입니다.'
      else if (status === 500) errorMessage = '서버 내부 오류가 발생했습니다.'
    }

    throw new Error(errorMessage)
  }

  if (responseData?.error) {
    throw new Error(responseData.error)
  }

  return {
    ...data,
    id: responseData.student.id,
    createdAt: new Date().toLocaleDateString('ko-KR').replace(/\./g, '.').trim(),
  }
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  const idx = MOCK_STUDENTS.findIndex(s => s.id === id)
  if (idx !== -1) Object.assign(MOCK_STUDENTS[idx], data)
}

export async function deleteStudents(ids: string[]): Promise<void> {
  ids.forEach(id => {
    const idx = MOCK_STUDENTS.findIndex(s => s.id === id)
    if (idx !== -1) MOCK_STUDENTS.splice(idx, 1)
  })
}

export async function moveStudentsToClass(studentIds: string[], targetClassId: string, targetClassName: string): Promise<void> {
  studentIds.forEach(id => {
    const student = MOCK_STUDENTS.find(s => s.id === id)
    if (student) {
      student.classId = targetClassId
      student.className = targetClassName
    }
  })
}
