import { supabase } from '../../../shared/lib/supabase'

export interface InboxResource {
  id: string
  title: string
  description: string | null
  file_path: string
  file_name: string | null
  file_size: number | null
  file_type: string | null
  file_url?: string | null
  target_role: string
  target_roles?: string[] | null
  status: string
  importance: string
  created_at: string
}

// ── 공개 대상 역할 도메인 ──
// 화면 한글 라벨과 코드. target_roles(text[])의 원소로 사용.
export const RESOURCE_ROLE_ORDER = ['student', 'teacher', 'org_admin', 'middle_admin', 'super_admin'] as const
export type ResourceRoleCode = typeof RESOURCE_ROLE_ORDER[number]

export const RESOURCE_ROLE_LABELS: Record<string, string> = {
  student: '학생',
  teacher: '선생님',
  org_admin: '기관관리자',
  middle_admin: '중간관리자',
  super_admin: '수퍼관리자',
}

// 빠른 선택 프리셋
export const AUDIENCE_PRESETS: { key: string; label: string; roles: string[] }[] = [
  { key: 'all', label: '전체 사용자', roles: [...RESOURCE_ROLE_ORDER] },
  { key: 'no-student', label: '학생 제외', roles: ['teacher', 'org_admin', 'middle_admin', 'super_admin'] },
  { key: 'no-teacher', label: '선생님 제외', roles: ['student', 'org_admin', 'middle_admin', 'super_admin'] },
  { key: 'admin-only', label: '관리자 전용', roles: ['org_admin', 'middle_admin', 'super_admin'] },
  { key: 'custom', label: '직접 선택', roles: [] },
]

// 자료의 공개 대상 역할 배열을 정규화.
// target_roles(복수, source of truth) 우선 → 없으면 레거시 target_role(단일)에서 변환.
// 기존 자료(target_role만 있는) 하위 호환.
export function normalizeResourceRoles(resource: { target_roles?: string[] | null; target_role?: string | null }): string[] {
  if (Array.isArray(resource.target_roles) && resource.target_roles.length > 0) {
    return resource.target_roles
  }
  const tr = resource.target_role
  if (!tr) return []
  if (tr === 'all') return [...RESOURCE_ROLE_ORDER]
  return [tr]
}

// 역할 배열 → 요약 문구(목록/라벨 표시용).
export function audienceSummary(roles: string[]): string {
  const ordered = RESOURCE_ROLE_ORDER.filter((r) => roles.includes(r))
  const labels = ordered.map((r) => RESOURCE_ROLE_LABELS[r])
  if (ordered.length === 0) return '미선택'
  if (ordered.length === RESOURCE_ROLE_ORDER.length) return '전체 사용자'
  if (!ordered.includes('student') && ordered.length === RESOURCE_ROLE_ORDER.length - 1) return '학생 제외'
  if (!ordered.includes('teacher') && ordered.length === RESOURCE_ROLE_ORDER.length - 1) return '선생님 제외'
  if (!ordered.includes('student') && !ordered.includes('teacher') && ordered.length === 3) return '관리자 전용'
  if (labels.length <= 2) return labels.join(' · ')
  return `${labels[0]} 외 ${labels.length - 1}개`
}

// 선택 역할 → 레거시 target_role(단일, CHECK 제약 호환값) 도출.
// target_roles가 source of truth 이므로 target_role은 보조/하위호환용.
export function deriveLegacyTargetRole(roles: string[]): string {
  if (roles.length === 0) return 'all'
  if (RESOURCE_ROLE_ORDER.every((r) => roles.includes(r))) return 'all'
  // CHECK 허용값 중 선택된 첫 역할 (super_admin은 CHECK에 없어 제외)
  const allowed = ['student', 'teacher', 'org_admin', 'middle_admin']
  for (const r of RESOURCE_ROLE_ORDER) {
    if (roles.includes(r) && allowed.includes(r)) return r
  }
  return 'all'
}

// 로그인 역할이 자료 공개 대상에 포함되는지 여부.
function isResourceVisibleToRole(resource: InboxResource, role: string): boolean {
  const roles = normalizeResourceRoles(resource)
  if (roles.includes('all')) return true
  return roles.includes(role)
}

export const resourceService = {
  // 역할별 자료실 조회. target_roles 컬럼 존재 여부와 무관하게 동작(방어적).
  // 1차: DB 단 필터(target_role + target_roles). target_roles 컬럼이 있으면 효율적.
  // 2차(방어): target_roles 미지원/쿼리 실패 시 전체 조회 후 서비스 단에서 역할 필터.
  async getInboxResources(role: string): Promise<InboxResource[]> {
    // 1차
    try {
      const { data, error } = await supabase
        .from('admin_resources')
        .select('*')
        .eq('status', 'published')
        .is('deleted_at', null)
        .or(`target_role.in.("all","${role}"),target_roles.cs.{"all"},target_roles.cs.{"${role}"}`)
        .order('created_at', { ascending: false })

      if (!error && data) {
        return (data as InboxResource[]).filter((r) => isResourceVisibleToRole(r, role))
      }
    } catch (e) {
      console.error('[resourceService] 1차 조회 실패, 2차 방어 조회로 전환:', e)
    }

    // 2차(방어)
    const { data, error } = await supabase
      .from('admin_resources')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inbox resources:', error)
      throw error
    }

    return (data as InboxResource[]).filter((r) => isResourceVisibleToRole(r, role))
  },

  async getResourceDownloadUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('admin-resources')
      .createSignedUrl(filePath, 3600) // 1시간 유효

    if (!error && data?.signedUrl) {
      return data.signedUrl
    }

    // signed URL 생성이 안 될 경우 public URL로 폴백
    const { data: publicData } = supabase.storage
      .from('admin-resources')
      .getPublicUrl(filePath)

    if (publicData?.publicUrl) {
      return publicData.publicUrl
    }

    throw new Error('다운로드 링크를 생성할 수 없습니다.')
  },
}
