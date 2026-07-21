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

// 데모 계정 AI 생성 일일 한도 적용.
// 호출자가 데모(is_demo=true)인 경우에만 increment_demo_usage RPC 로 일일 사용량을 1 증가시킨다.
// 한도 초과(RPC 가 DEMO_LIMIT_EXCEEDED 예외를 던지는 경우) → code 'DEMO_LIMIT' 예외를 던져
// 호출 측이 즉시 사용자 안내 메시지를 반환하도록 한다. 일반 사용자는 아무 동작 없이 통과.
export async function enforceDemoUsageLimit(
  adminClient: SupabaseClient,
  userId: string,
  limitType: 'mindmap' | 'image',
  limit: number
): Promise<void> {
  const { data: profile } = await adminClient
    .from('profiles')
    .select('is_demo')
    .eq('id', userId)
    .maybeSingle()
  if (!profile || profile.is_demo !== true) return // 일반 사용자 → 제한 없음
  const { error } = await adminClient.rpc('increment_demo_usage', {
    p_account_id: userId,
    p_limit_type: limitType,
    p_limit: limit,
  })
  if (error) {
    throw Object.assign(new Error('demo limit exceeded'), { code: 'DEMO_LIMIT' })
  }
}
