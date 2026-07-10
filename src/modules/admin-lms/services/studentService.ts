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
    // 참고: assignment_status 필터는 요구사항에 없으므로 추가하지 않음 (status='active' 만 검사)

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
      else if (status === 403) errorMessage = '조직 관리자 권한이 없습니다.'
      else if (status === 409) errorMessage = '이미 사용 중인 로그인 아이디입니다.'
      else if (status === 500) errorMessage = '서버 내부 오류가 발생했습니다.'
    }

    throw new Error(errorMessage)
  }

  if (responseData?.error) {
    throw new Error(responseData.error)
  }

  // Assuming responseData.student contains the created student details with id
  return {
    ...data,
    id: responseData.student.id,
    createdAt: new Date().toLocaleDateString('ko-KR').replace(/\./g, '.').trim(),
  }
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  // TODO: supabase.from('profiles').update(data).eq('id', id)
  // 학생이 배정/수정될 때 선생님의 organization_id로 profiles.organization_id 도 업데이트 되도록 처리 필요
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
  // TODO: 이동하려는 학급/선생님의 organization_id도 조회하여 profiles.organization_id에 함께 넣어주도록 처리
  studentIds.forEach(id => {
    const student = MOCK_STUDENTS.find(s => s.id === id)
    if (student) {
      student.classId = targetClassId
      student.className = targetClassName
    }
  })
}
