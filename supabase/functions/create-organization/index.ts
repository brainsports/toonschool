// 수퍼관리자 → 기관 + 기관관리자(org_admin) 계정 생성.
// profiles upsert는 이미 동작한다. 신뢰성 보강: 호출자 상태 검증, 기관 생성/프로필 연결 실패 시
// 보상 롤백(고아 방지), 표준 상태 코드/응답. status='active'는 organizations CHECK에 부합.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'
import {
  RequestError,
  successResponse,
  handleCaughtError,
} from '../_shared/errors.ts'
import {
  createAdminClient,
  resolveCaller,
  getCallerProfile,
  authorize,
} from '../_shared/client.ts'
import { safeRollback } from '../_shared/rollback.ts'

const TAG = 'create-organization'

// middleAdminId로 전달된 값이 middle_admins.id 또는 profile_id 중 어느 것이든 profile_id로 정규화.
async function resolveMiddleAdminProfileId(
  adminClient: ReturnType<typeof createAdminClient>,
  middleAdminId: string
): Promise<string | null> {
  if (!middleAdminId) return null
  // 1) middle_admins.id 로 조회
  const { data: byId, error: e1 } = await adminClient
    .from('middle_admins')
    .select('profile_id')
    .eq('id', middleAdminId)
    .maybeSingle()
  if (e1) throw new RequestError('중간관리자 조회 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
  if (byId?.profile_id) return byId.profile_id
  // 2) profile_id 자체인지 확인
  const { data: profile, error: e2 } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', middleAdminId)
    .maybeSingle()
  if (e2) throw new RequestError('중간관리자 확인 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
  if (profile && (profile.role === 'middle_admin')) return profile.id
  throw new RequestError('유효한 중간관리자를 찾을 수 없습니다.', 400)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, code: 'INVALID_INPUT', message: '허용되지 않은 요청 방식입니다.' }),
      { headers: jsonHeaders, status: 405 }
    )
  }

  try {
    const adminClient = createAdminClient()
    const callerUser = await resolveCaller(adminClient, req.headers.get('Authorization'))
    const callerProfile = await getCallerProfile(adminClient, callerUser.id, 'id, role, status')
    authorize(callerProfile, ['super_admin', 'superadmin'])

    const body = await req.json().catch(() => ({}))
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const adminName = typeof body.adminName === 'string' ? body.adminName.trim() : ''
    const adminEmail = typeof body.adminEmail === 'string' ? body.adminEmail.trim().toLowerCase() : ''
    const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword : ''
    const middleAdminId = typeof body.middleAdminId === 'string' ? body.middleAdminId : ''
    const totalLicenses = Number(body.totalLicenses ?? 0) || 0
    const startDate = body.startDate || new Date().toISOString()
    const endDate = body.endDate || new Date().toISOString()

    if (!name) throw new RequestError('기관명을 입력해 주세요.')
    if (!adminName) throw new RequestError('기관관리자 이름을 입력해 주세요.')
    if (!adminEmail) throw new RequestError('기관관리자 이메일을 입력해 주세요.')
    if (!adminPassword) throw new RequestError('기관관리자 비밀번호를 입력해 주세요.')

    const resolvedMiddleAdminId = await resolveMiddleAdminProfileId(adminClient, middleAdminId)

    // 중복 이메일 확인 → 409
    const { data: existing, error: dupError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .limit(1)
    if (dupError) {
      console.error(`[${TAG}] dup check error:`, dupError)
      throw new RequestError('계정 생성 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }
    if (existing && existing.length > 0) {
      throw new RequestError('이미 등록된 이메일입니다. 다른 이메일을 입력해 주세요.', 409, 'DUPLICATE_EMAIL')
    }

    // 반쪽 계정 재사용 또는 신규 auth 생성
    let userId: string
    let createdAuthUser = false
    const { data: existingAuthId, error: rpcError } = await adminClient.rpc('get_auth_user_id_by_email', {
      p_email: adminEmail,
    })
    if (!rpcError && existingAuthId) {
      userId = existingAuthId
    } else {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName, role: 'org_admin' },
      })
      if (authError || !authData.user) {
        console.error(`[${TAG}] auth create error:`, authError)
        const msg = (authError?.message || '').toLowerCase()
        const isDuplicate = msg.includes('already') || msg.includes('registered')
        throw new RequestError(
          isDuplicate ? '이미 등록된 이메일입니다. 다른 이메일을 입력해 주세요.' : '계정 생성 중 오류가 발생했습니다.',
          isDuplicate ? 409 : 500,
          isDuplicate ? 'DUPLICATE_EMAIL' : 'ACCOUNT_CREATION_FAILED'
        )
      }
      userId = authData.user.id
      createdAuthUser = true
    }

    // profiles upsert(org_admin)
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: adminEmail,
          name: adminName,
          role: 'org_admin',
          status: 'active',
          plan_type: 'free',
          monthly_quota: 0,
          monthly_used: 0,
        },
        { onConflict: 'id' }
      )
    if (profileError) {
      console.error(`[${TAG}] profile upsert error:`, JSON.stringify(profileError, null, 2))
      if (createdAuthUser) {
        await safeRollback(TAG, 'delete auth user', () => adminClient.auth.admin.deleteUser(userId))
      }
      throw new RequestError('프로필 저장 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }

    // organizations 생성
    const { data: orgData, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name,
        admin_profile_id: userId,
        middle_admin_id: resolvedMiddleAdminId,
        total_licenses: totalLicenses,
        license_start_date: startDate,
        license_end_date: endDate,
        status: 'active',
      })
      .select('id')
      .single()
    if (orgError || !orgData) {
      console.error(`[${TAG}] organizations insert error:`, JSON.stringify(orgError, null, 2))
      if (createdAuthUser) {
        await safeRollback(TAG, 'delete auth user', () => adminClient.auth.admin.deleteUser(userId))
      }
      throw new RequestError('기관 생성 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }
    const newOrgId = orgData.id

    // 기관관리자 프로필에 organization_id 연결
    const { error: linkError } = await adminClient
      .from('profiles')
      .update({ organization_id: newOrgId })
      .eq('id', userId)
    if (linkError) {
      console.error(`[${TAG}] profile link error:`, JSON.stringify(linkError, null, 2))
      // 보상 롤백: 방금 만든 기관 삭제 + (이번에 만든 auth면) 사용자 삭제
      await safeRollback(TAG, 'delete organization', () =>
        adminClient.from('organizations').delete().eq('id', newOrgId)
      )
      if (createdAuthUser) {
        await safeRollback(TAG, 'delete auth user', () => adminClient.auth.admin.deleteUser(userId))
      }
      throw new RequestError('기관 연결 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }

    return successResponse({
      userId,
      role: 'org_admin',
      organizationId: newOrgId,
      adminUserId: userId,
      message: '기관과 기관관리자가 등록되었습니다.',
    })
  } catch (error: unknown) {
    return handleCaughtError(TAG, error, '기관 생성 중 오류가 발생했습니다.')
  }
})
