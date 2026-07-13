// 기관관리자/수퍼관리자 → 선생님 생성.
// 핵심 수정: create-student와 동일하게 profiles를 upsert(onConflict:'id')로 저장하여
// on_auth_user_created 트리거와의 PK 충돌(500)을 해소한다.
// 소속 기관은 호출자 역할에 따라 서버에서 결정(org_admin은 자신의 기관, super_admin은 검증된 기관).
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
  isValidUUID,
} from '../_shared/client.ts'
import { safeRollback } from '../_shared/rollback.ts'

const TAG = 'create-teacher'
const PASSWORD_MIN_LENGTH = 6

const isValidDateValue = (v: unknown) => {
  if (typeof v !== 'string' || !v.trim()) return false
  return !Number.isNaN(new Date(v).getTime())
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
    const callerProfile = await getCallerProfile(adminClient, callerUser.id, 'id, role, status, organization_id')
    authorize(callerProfile, ['super_admin', 'superadmin', 'org_admin'])

    const body = await req.json().catch(() => ({}))
    const cleanEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const requestedOrgId = typeof body.organization_id === 'string' ? body.organization_id.trim() : ''
    const licenseTotal = Number(body.license_count ?? body.licenseTotal ?? body.initial_licenses ?? 0)
    const licenseStart = body.license_start_date ?? body.licenseStart ?? null
    const licenseEnd = body.license_end_date ?? body.licenseEnd ?? null

    if (!name) throw new RequestError('이름을 입력해 주세요.')
    if (!cleanEmail) throw new RequestError('이메일을 입력해 주세요.')
    if (!password) throw new RequestError('임시 비밀번호를 입력해 주세요.')
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new RequestError(`임시 비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
    }
    if (!Number.isInteger(licenseTotal) || licenseTotal < 0) {
      throw new RequestError('이용권 수는 0 이상의 정수여야 합니다.')
    }
    if (licenseStart && !isValidDateValue(licenseStart)) {
      throw new RequestError('이용권 시작일이 올바른 날짜가 아닙니다.')
    }
    if (licenseEnd && !isValidDateValue(licenseEnd)) {
      throw new RequestError('이용권 종료일이 올바른 날짜가 아닙니다.')
    }
    if (licenseStart && licenseEnd && new Date(licenseEnd) < new Date(licenseStart)) {
      throw new RequestError('이용권 종료일은 시작일보다 빠를 수 없습니다.')
    }

    // 소속 기관 결정. org_admin은 자신의 기관으로 강제(다른 기관 지정 차단).
    let organizationId: string
    if (callerProfile.role === 'org_admin') {
      if (!callerProfile.organization_id) {
        throw new RequestError('기관 정보가 없는 관리자 계정입니다.', 403, 'FORBIDDEN')
      }
      if (requestedOrgId && requestedOrgId !== callerProfile.organization_id) {
        throw new RequestError('다른 기관에는 선생님을 생성할 수 없습니다.', 403, 'FORBIDDEN')
      }
      organizationId = callerProfile.organization_id
    } else {
      // super_admin: 클라이언트가 보낸 기관 ID를 검증 후 사용.
      if (!requestedOrgId || !isValidUUID(requestedOrgId)) {
        throw new RequestError('소속 기관 정보가 필요합니다.')
      }
      const { data: org, error: orgErr } = await adminClient
        .from('organizations')
        .select('id')
        .eq('id', requestedOrgId)
        .maybeSingle()
      if (orgErr || !org) {
        throw new RequestError('유효하지 않은 기관입니다.', 400)
      }
      organizationId = requestedOrgId
    }

    // 중복 이메일 사전 확인(profiles + auth 반쪽 계정) → 409
    const { data: existing, error: dupError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1)
    if (dupError) {
      console.error(`[${TAG}] dup check error:`, dupError)
      throw new RequestError('계정 생성 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }
    if (existing && existing.length > 0) {
      throw new RequestError('이미 등록된 이메일입니다. 다른 이메일을 입력해 주세요.', 409, 'DUPLICATE_EMAIL')
    }
    const { data: existingAuthId, error: rpcError } = await adminClient.rpc('get_auth_user_id_by_email', {
      p_email: cleanEmail,
    })
    if (!rpcError && existingAuthId) {
      throw new RequestError('이미 등록된 이메일입니다. 다른 이메일을 입력해 주세요.', 409, 'DUPLICATE_EMAIL')
    }

    // Auth 계정 생성
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'teacher' },
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
    const userId = authData.user.id

    // profiles upsert(핵심 수정)
    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: userId,
        email: cleanEmail,
        name,
        role: 'teacher',
        organization_id: organizationId,
        status: body.status || 'active',
        plan_type: 'free',
        monthly_quota: 0,
        monthly_used: 0,
      },
      { onConflict: 'id' }
    )
    if (profileError) {
      console.error(`[${TAG}] profile upsert error:`, JSON.stringify(profileError, null, 2))
      await safeRollback(TAG, 'delete auth user', () => adminClient.auth.admin.deleteUser(userId))
      throw new RequestError('프로필 저장 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }

    // 이용권 배정(선택)
    if (licenseTotal > 0 || licenseStart || licenseEnd) {
      const { error: allocError } = await adminClient.from('license_allocations').insert({
        organization_id: organizationId,
        from_user_id: callerUser.id,
        to_user_id: userId,
        quantity: licenseTotal,
        license_start_date: licenseStart || null,
        license_end_date: licenseEnd || null,
      })
      if (allocError) {
        console.error(`[${TAG}] license allocation error:`, JSON.stringify(allocError, null, 2))
        // 보상 롤백
        await safeRollback(TAG, 'delete profile', () =>
          adminClient.from('profiles').delete().eq('id', userId)
        )
        await safeRollback(TAG, 'delete auth user', () => adminClient.auth.admin.deleteUser(userId))
        throw new RequestError('이용권 배정 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
      }
    }

    return successResponse({
      userId,
      role: 'teacher',
      organization_id: organizationId,
      message: '선생님이 등록되었습니다.',
    })
  } catch (error: unknown) {
    return handleCaughtError(TAG, error, '선생님 계정 생성 중 오류가 발생했습니다.')
  }
})
