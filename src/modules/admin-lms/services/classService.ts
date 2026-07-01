// ──────────────────────────────────────────────
// 서비스 - 학급 (현재 mock, 추후 Supabase 연결)
// TODO: supabase.from('classes') 조회로 교체
// ──────────────────────────────────────────────
import type { ClassRoom, UnitSetting } from '../types'
import { MOCK_CLASSES, MOCK_LICENSE } from '../data/mockClasses'

export async function fetchClasses(): Promise<ClassRoom[]> {
  return Promise.resolve([...MOCK_CLASSES])
}

export async function fetchClassesByGrade(grade: number): Promise<ClassRoom[]> {
  return Promise.resolve(MOCK_CLASSES.filter(c => c.grade === grade))
}

export async function fetchLicenseInfo() {
  return Promise.resolve({ ...MOCK_LICENSE })
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
