// ──────────────────────────────────────────────
// 서비스 - 학급 (Supabase 연결)
// ──────────────────────────────────────────────
import type { ClassRoom, UnitSetting, LicenseInfo } from '../types'
import { MOCK_CLASSES } from '../data/mockClasses'
import { supabase } from '../../../shared/lib/supabase'

export async function fetchClasses(): Promise<ClassRoom[]> {
  return Promise.resolve([...MOCK_CLASSES])
}

// 학급 목록 조회 — 선생님별 데이터 격리.
// 핵심: 같은 organization_id 라는 이유로 기관 전체 학급을 반환하지 않는다.
// teacher 역할은 반드시 teacher_id(=본인 profile id)로 소유 학급만 조회한다.
// teacherId 를 넘기면 PostgREST 가 SQL WHERE 에 teacher_id 조건을 추가해
// DB 단에서 소유권 필터링을 수행한다(프런트엔드 숨김이 아님).
export async function fetchClassesByOrganizationAndGrade(
  organizationId: string,
  grade: number,
  teacherId?: string,
): Promise<ClassRoom[]> {
  let query = supabase
    .from('classes')
    .select('*, teacher:profiles!classes_teacher_id_fkey(name)')
    .eq('organization_id', organizationId)
    .eq('grade', grade)
    .eq('status', 'active')

  // 선생님은 본인 소유 학급(teacher_id = 본인)만 조회.
  // teacherId 가 없는 레거시 학급은 어떤 선생님에게도 노출되지 않는다(소유 불분명).
  if (teacherId) {
    query = query.eq('teacher_id', teacherId)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch classes:', error)
    throw error
  }

  return (data || []).map(cls => ({
    id: cls.id,
    grade: cls.grade,
    name: cls.name,
    studentCount: cls.student_count || 0,
    teacherId: cls.teacher_id,
    teacherName: cls.teacher?.name || undefined,
  }))
}

// 현재 선생님의 전체 학급(모든 학년, active) 조회 — 선생님 말씀/알림 메뉴에서
// 수신 학급을 선택할 때 사용. teacher_id = 본인 으로 DB 단 격리.
export async function fetchClassesByTeacher(teacherId: string): Promise<ClassRoom[]> {
  if (!teacherId) return []

  const { data, error } = await supabase
    .from('classes')
    .select('*, teacher:profiles!classes_teacher_id_fkey(name)')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
    .order('grade', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch classes by teacher:', error)
    throw error
  }

  return (data || []).map(cls => ({
    id: cls.id,
    grade: cls.grade,
    name: cls.name,
    studentCount: cls.student_count || 0,
    teacherId: cls.teacher_id,
    teacherName: cls.teacher?.name || undefined,
  }))
}

export async function createClassService(data: {
  organization_id: string;
  name: string;
  grade: number;
  homeroom?: string | null;
  teacher_id?: string | null;
  status?: string;
}): Promise<any> {
  const { data: newClass, error } = await supabase
    .from('classes')
    .insert([{ ...data, status: data.status || 'active' }])
    .select()
    .single()

  if (error) {
    console.error('Failed to create class:', error)
    throw error
  }

  return newClass
}

export async function fetchLicenseInfo(
  profileId?: string,
  centerId?: string,
  role?: string,
): Promise<LicenseInfo | null> {
  if (!profileId) return null

  try {
    let assignedCount = 0
    let usedCount = 0
    let startDate = ''
    let endDate = ''

    const { data: allocation, error: allocError } = await supabase
      .from('license_allocations')
      .select('quantity, license_start_date, license_end_date')
      .eq('to_user_id', profileId)
      .single()

    if (allocError && allocError.code !== 'PGRST116') {
      console.error('Failed to fetch license allocation:', allocError)
    }

    if (allocation) {
      assignedCount = allocation.quantity || 0
      startDate = allocation.license_start_date ? allocation.license_start_date.split('T')[0].replace(/-/g, '.') : ''
      endDate = allocation.license_end_date ? allocation.license_end_date.split('T')[0].replace(/-/g, '.') : ''
    }

    // 사용량(usedSlots): 선생님은 본인 소유 학생수만 카운트한다.
    // 기관 전체(center_id) 카운트는 타 선생님 학생까지 집계되어 누수가 된다.
    // student-by-teacher 격리 기준(created_by=본인 OR 본인 소유 학급 배정)과 동일하게 계산.
    if (role === 'teacher') {
      usedCount = await countStudentsOwnedByTeacher(profileId)
    } else if (centerId) {
      const { count: studentCount, error: studentError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('center_id', centerId)
        .eq('status', 'active')

      if (!studentError && studentCount !== null) {
        usedCount = studentCount
      }
    }

    return {
      plan: '이용권', // 기관에서 배정한 이용권
      startDate: startDate,
      endDate: endDate,
      totalSlots: assignedCount,
      usedSlots: usedCount,
    }
  } catch (err) {
    console.error('Failed to fetch license info:', err)
    return null
  }
}

// 선생님 소유 학생 수 — created_by=본인 OR 본인 소유 학급(class_id) 배정 학생.
// student-by-teacher EF 의 teacher 스코프와 동일 기준. 라이선스 사용량 계산에 사용.
async function countStudentsOwnedByTeacher(teacherId: string): Promise<number> {
  try {
    const { data: myClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('status', 'active')
    const classIds = (myClasses || []).map((c: { id: string }) => c.id).filter(Boolean)

    let query = supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    if (classIds.length > 0) {
      query = query.or(`created_by.eq.${teacherId},class_id.in.(${classIds.join(',')})`)
    } else {
      query = query.eq('created_by', teacherId)
    }

    const { count, error } = await query
    if (error) {
      console.error('Failed to count teacher students:', error)
      return 0
    }
    return count || 0
  } catch (err) {
    console.error('Failed to count teacher students:', err)
    return 0
  }
}

// 학급 삭제 안전성 검사 — 대상 학급에 소속된 활성 학생 수.
// 학생이 있으면 학급 삭제를 차단한다(학생 데이터 보호).
// 조회 자체가 실패하면 안전하게 삭제를 막기 위해 에러를 던진다.
export async function countStudentsInClasses(classIds: string[]): Promise<number> {
  if (!classIds.length) return 0
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .in('class_id', classIds)
    .eq('status', 'active')

  if (error) {
    console.error('Failed to count students in classes:', error)
    throw error
  }
  return count || 0
}

export async function updateUnitSetting(classId: string, setting: UnitSetting): Promise<void> {
  // TODO: supabase.from('class_unit_settings').upsert(...)
  const idx = MOCK_CLASSES.findIndex(c => c.id === classId)
  if (idx !== -1) MOCK_CLASSES[idx].unitSetting = setting
}

// 학급 삭제(소프트 삭제: status -> 'inactive').
// 학생 계정/작품/평가/보상/출결은 전혀 건드리지 않는다(classes 행의 status 만 변경).
// teacherId 를 넘기면 WHERE 에 teacher_id 조건이 추가되어 본인 소유 학급만 비활성화된다
// (서버/DB 단 소유권 강제 — 타 선생님 학급 id 를 넘겨도 0행 갱신).
// 반환값: 실제 비활성화된 학급 수.
export async function deleteClasses(ids: string[], teacherId?: string): Promise<number> {
  if (!ids.length) return 0

  let query = supabase
    .from('classes')
    .update({ status: 'inactive' })
    .in('id', ids)

  if (teacherId) {
    query = query.eq('teacher_id', teacherId)
  }

  const { data, error } = await query.select('id')

  if (error) {
    console.error('Failed to delete classes:', error)
    throw error
  }

  return data?.length ?? 0
}
