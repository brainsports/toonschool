// ──────────────────────────────────────────────
// 서비스 - 선생님 (현재 mock, 추후 Supabase 연결)
// TODO: supabase.from('profiles').select().eq('role','teacher') 연결
// ──────────────────────────────────────────────
import type { Teacher, OrgInfo } from '../types'
import { MOCK_TEACHERS, MOCK_ORG_INFO } from '../data/mockTeachers'

export async function fetchTeachers(): Promise<Teacher[]> {
  return Promise.resolve([...MOCK_TEACHERS])
}

export async function fetchOrgInfo(): Promise<OrgInfo> {
  return Promise.resolve({ ...MOCK_ORG_INFO })
}

export async function createTeacher(data: Omit<Teacher, 'id' | 'joinedAt' | 'classIds' | 'classNames'>): Promise<Teacher> {
  // TODO: supabase.auth.admin.createUser + profiles.insert
  const newTeacher: Teacher = {
    ...data,
    id: `tea-${Date.now()}`,
    joinedAt: new Date().toLocaleDateString('ko-KR'),
    classIds: [],
    classNames: [],
  }
  MOCK_TEACHERS.push(newTeacher)
  return newTeacher
}

export async function deleteTeachers(ids: string[]): Promise<void> {
  // TODO: supabase.auth.admin.deleteUser
  ids.forEach(id => {
    const idx = MOCK_TEACHERS.findIndex(t => t.id === id)
    if (idx !== -1) MOCK_TEACHERS.splice(idx, 1)
  })
}

export async function resetPassword(teacherId: string, _newPw: string): Promise<void> {
  // TODO: supabase.auth.admin.updateUserById(teacherId, { password: newPw })
  console.log('비밀번호 초기화:', teacherId)
}

export async function updateOrgInfo(data: Partial<OrgInfo>): Promise<void> {
  // TODO: supabase.from('organizations').update(data)...
  Object.assign(MOCK_ORG_INFO, data)
}
