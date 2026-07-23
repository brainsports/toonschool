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

// 선생님별 격리된 학생 목록 조회(student-by-teacher Edge Function 사용).
// 서버가 호출자 역할에 따라 스코핑한다(teacher: 본인 생성/담당학급, org_admin: 기관, super_admin: 전체).
// center_id 가 없어도 기관 전체로 누수되지 않는다. 신규 선생님은 빈 목록.
export async function fetchStudentsByTeacher(grade: number): Promise<Student[]> {
  const { data, error } = await supabase.functions.invoke('student-by-teacher', {
    body: { grade },
  })

  if (error) {
    let errorMessage = '학생 목록을 불러오지 못했습니다.'
    let status = 0
    try {
      const ctx = (error as any)?.context
      if (ctx?.status) status = ctx.status
      if (ctx && typeof ctx.clone === 'function') {
        const errBody = await ctx.clone().json()
        errorMessage = errBody?.message || errBody?.error || errorMessage
      }
    } catch { /* ignore */ }

    if (errorMessage === 'Edge Function returned a non-2xx status code' || !errorMessage) {
      if (status === 401) errorMessage = '로그인이 만료되었습니다. 다시 로그인해 주세요.'
      else if (status === 403) errorMessage = '조회 권한이 없습니다.'
      else errorMessage = '학생 목록을 불러오는 중 오류가 발생했습니다.'
    }
    console.error(`[fetchStudentsByTeacher] Error (${status}):`, errorMessage)
    throw new Error(errorMessage)
  }

  if (!data?.success) {
    throw new Error(data?.message || '학생 목록을 불러오지 못했습니다.')
  }

  return (data.students || []) as Student[]
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

export async function deleteStudent(studentId: string): Promise<{ success: boolean, deletedStudentId?: string }> {
  const { data: responseData, error } = await supabase.functions.invoke('delete-student-by-teacher', {
    body: { studentId }
  })

  if (error) {
    let errorMessage = '학생 삭제에 실패했습니다.'
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
          errorMessage = error.message || '학생 삭제에 실패했습니다.'
        }
      }
    } else {
      errorMessage = error.message || '학생 삭제에 실패했습니다.'
    }

    console.error(`[deleteStudent] Error (${status}):`, errorMessage)

    if (errorMessage.includes('Edge Function returned a non-2xx status code') || errorMessage === '학생 삭제에 실패했습니다.') {
      if (status === 404) errorMessage = '학생 삭제 함수가 배포되지 않았거나 존재하지 않는 학생입니다.'
      else if (status === 401) errorMessage = '로그인이 만료되었습니다.'
      else if (status === 403) errorMessage = '삭제 권한이 없거나 보호된 계정입니다.'
      else if (status === 500) errorMessage = '서버 내부 오류가 발생했습니다.'
    }

    throw new Error(errorMessage)
  }

  if (responseData?.error) {
    throw new Error(responseData.error)
  }

  return responseData
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

// 학생 정보 수정(이름·비밀번호·소속학급·학생별 절대 월 만화 한도) — update-student-by-teacher EF.
// 서버가 담당 교사(학급 우선, created_by 보조) 검증과 대상 학급 소유권 검증을 수행한다.
// monthlyQuotaOverride: number(4/8/20 절대 설정) | null(학급 기본으로 되돌림) | undefined(변경 안 함).
export interface UpdateStudentInput {
  studentId: string
  name?: string
  newPassword?: string
  classId?: string | null
  monthlyQuotaOverride?: number | null
}

export async function updateStudentByTeacher(data: UpdateStudentInput): Promise<{
  updated: Record<string, boolean>
  passwordChanged: boolean
  partial_success?: boolean
  message?: string
}> {
  const body: Record<string, unknown> = { studentId: data.studentId }
  if (Object.prototype.hasOwnProperty.call(data, 'name')) body.name = data.name
  if (Object.prototype.hasOwnProperty.call(data, 'newPassword')) body.newPassword = data.newPassword
  if (Object.prototype.hasOwnProperty.call(data, 'classId')) body.classId = data.classId
  if (Object.prototype.hasOwnProperty.call(data, 'monthlyQuotaOverride')) body.monthlyQuotaOverride = data.monthlyQuotaOverride

  const { data: resp, error } = await supabase.functions.invoke('update-student-by-teacher', { body })

  if (error) {
    let message = '학생 정보를 수정하지 못했습니다.'
    let status = 0
    try {
      const ctx = (error as any)?.context
      if (ctx?.status) status = ctx.status
      if (ctx && typeof ctx.clone === 'function') {
        const errBody = await ctx.clone().json()
        message = errBody?.message || errBody?.error || message
      }
    } catch { /* ignore */ }
    if (status === 401) message = '로그인이 만료되었습니다. 다시 로그인해 주세요.'
    else if (status === 403) message = message || '수정 권한이 없습니다.'
    console.error(`[updateStudentByTeacher] Error (${status}):`, message)
    throw new Error(message)
  }

  if (!resp?.success) {
    throw new Error(resp?.message || '학생 정보를 수정하지 못했습니다.')
  }

  return {
    updated: resp.updated || {},
    passwordChanged: !!resp.passwordChanged,
    partial_success: resp.partial_success,
    message: resp.message,
  }
}
