// ──────────────────────────────────────────────
// 서비스 - 학급 (현재 mock, 추후 Supabase 연결)
// TODO: supabase.from('classes') 조회로 교체
// ──────────────────────────────────────────────
import type { ClassRoom, UnitSetting, LicenseInfo } from '../types'
import { MOCK_CLASSES } from '../data/mockClasses'

import { supabase } from '../../../shared/lib/supabase'

export async function fetchClasses(): Promise<ClassRoom[]> {
  return Promise.resolve([...MOCK_CLASSES])
}

export async function fetchClassesByGrade(grade: number): Promise<ClassRoom[]> {
  return Promise.resolve(MOCK_CLASSES.filter(c => c.grade === grade))
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

export async function createClass(data: Omit<ClassRoom, 'id'>): Promise<ClassRoom> {
  // TODO: supabase.from('classes').insert(...)
  const newClass: ClassRoom = { ...data, id: `cls-${Date.now()}` }
  MOCK_CLASSES.push(newClass)
  return newClass
}

export async function deleteClasses(ids: string[]): Promise<void> {
  // TODO: supabase.from('classes').delete().in('id', ids)
  ids.forEach(id => {
    const idx = MOCK_CLASSES.findIndex(c => c.id === id)
    if (idx !== -1) MOCK_CLASSES.splice(idx, 1)
  })
}
