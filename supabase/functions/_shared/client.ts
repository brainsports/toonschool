// Supabase Admin(service_role) 클라이언트 생성 + 호출자 검증 헬퍼.
// service_role 키는 Edge Function 환경변수(Deno.env)에서만 사용하며 프런트에 절대 노출하지 않는다.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { RequestError } from './errors.ts'

export function createAdminClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) {
    throw new RequestError('서버 설정이 올바르지 않습니다.', 500, 'SERVER_CONFIG')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Authorization 헤더에서 JWT를 꺼내 호출자 user를 검증한다.
export async function resolveCaller(adminClient: SupabaseClient, authHeader: string | null) {
  if (!authHeader) {
    throw new RequestError('로그인이 필요합니다.', 401, 'UNAUTHORIZED')
  }
  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await adminClient.auth.getUser(token)
  if (error || !data.user) {
    throw new RequestError('로그인이 만료되었습니다. 다시 로그인해 주세요.', 401, 'UNAUTHORIZED')
  }
  return data.user
}

// 호출자 profiles 행 조회. 존재하지 않으면 권한 오류.
export async function getCallerProfile(
  adminClient: SupabaseClient,
  userId: string,
  select = 'id, role, status, organization_id, center_id'
) {
  const { data, error } = await adminClient
    .from('profiles')
    .select(select)
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) {
    throw new RequestError('관리자 권한 정보를 확인할 수 없습니다.', 403, 'FORBIDDEN')
  }
  return data as {
    id: string
    role: string
    status: string | null
    organization_id: string | null
    center_id: string | null
  }
}

// 역할 검증 + 활성 상태 검증.
// status는 'active'만 허용하는 대신, 명백히 비활성(suspended/deleted/inactive)만 차단한다.
// (pending 등 과도기 상태를 가진 정상 관리자를 잠그지 않기 위함)
export function authorize(profile: { role: string; status: string | null }, allowedRoles: string[]) {
  if (!allowedRoles.includes(profile.role)) {
    throw new RequestError('이 계정을 생성할 권한이 없습니다.', 403, 'FORBIDDEN')
  }
  const inactive = ['suspended', 'deleted', 'inactive']
  if (profile.status && inactive.includes(profile.status)) {
    throw new RequestError('비활성화된 계정은 이 작업을 수행할 수 없습니다.', 403, 'FORBIDDEN')
  }
}

// UUID 형식 검증. 프런트에서 잘못된/mock ID가 들어오는 것을 방지.
export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
}
