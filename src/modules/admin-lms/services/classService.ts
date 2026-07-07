// ──────────────────────────────────────────────
// 서비스 - 학급 (Supabase 연결)
// ──────────────────────────────────────────────
import type { ClassRoom, UnitSetting, LicenseInfo } from '../types'
import { MOCK_CLASSES } from '../data/mockClasses'
import { supabase } from '../../../shared/lib/supabase'

export async function fetchClasses(): Promise<ClassRoom[]> {
  return Promise.resolve([...MOCK_CLASSES])
}

export async function fetchClassesByOrganizationAndGrade(organizationId: string, grade: number): Promise<ClassRoom[]> {
  const { data, error } = await supabase
    .from('classes')
    .select('*, teacher:profiles!classes_teacher_id_fkey(name)')
    .eq('organization_id', organizationId)
    .eq('grade', grade)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

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
    // Note: The relationship name might be different depending on schema.
    // If profiles!classes_teacher_id_fkey fails, we fallback to just teacher_id or fetch names separately.
    // Assuming profiles!teacher_id(name) or similar based on standard setup.
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

export async function fetchLicenseInfo(profileId?: string, centerId?: string): Promise<LicenseInfo | null> {
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

    if (centerId) {
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

export async function updateUnitSetting(classId: string, setting: UnitSetting): Promise<void> {
  // TODO: supabase.from('class_unit_settings').upsert(...)
  const idx = MOCK_CLASSES.findIndex(c => c.id === classId)
  if (idx !== -1) MOCK_CLASSES[idx].unitSetting = setting
}

export async function deleteClasses(ids: string[]): Promise<void> {
  const { error } = await supabase
    .from('classes')
    .update({ status: 'inactive' })
    .in('id', ids)

  if (error) {
    console.error('Failed to delete classes:', error)
    throw error
  }
}
