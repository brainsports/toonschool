// 수퍼관리자 → 중간관리자 생성.
// profiles는 이미 upsert(onConflict:'id')를 사용해 트리거 충돌을 피하고 있어 정상 동작하지만,
// 신뢰성 보강: 호출자 상태 검증, middle_admins 저장 실패 시 보상 롤백(고아 프로필 방지),
// 표준 상태 코드/응답, 중간관리자 중복 row 방지(profile_id 기반 upsert).
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

const TAG = 'create-admin-user'

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
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const status = body.status || 'active'
    const licenseTotal = Number(body.licenseTotal ?? 0) || 0
    const licenseStart = body.licenseStart || null
    const licenseEnd = body.licenseEnd || null

    if (!name) throw new RequestError('이름을 입력해 주세요.')
    if (!email) throw new RequestError('이메일을 입력해 주세요.')
    if (!password) throw new RequestError('비밀번호를 입력해 주세요.')

    // 중복 이메일 확인(role별 안내) → 409
    const { data: existing, error: dupError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .limit(1)
    if (dupError) {
      console.error(`[${TAG}] dup check error:`, dupError)
      throw new RequestError('계정 생성 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }
    if (existing && existing.length > 0) {
      const r = existing[0].role
      const msg =
        r === 'super_admin' || r === 'superadmin'
          ? '이미 수퍼관리자로 등록된 이메일입니다.'
          : r === 'middle_admin'
          ? '이미 중간관리자로 등록된 이메일입니다.'
          : '이미 등록된 이메일입니다. 다른 이메일을 입력해 주세요.'
      throw new RequestError(msg, 409, 'DUPLICATE_EMAIL')
    }

    // 반쪽 계정(auth는 있고 profile은 없는 상태)이 있으면 재사용, 없으면 신규 생성.
    let userId: string
    let createdAuthUser = false
    const { data: existingAuthId, error: rpcError } = await adminClient.rpc('get_auth_user_id_by_email', {
      p_email: email,
    })
    if (!rpcError && existingAuthId) {
      userId = existingAuthId
    } else {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'middle_admin' },
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

    // profiles upsert(트리거가 만든 free_user 행을 middle_admin으로 덮어쓰기)
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          name,
          role: 'middle_admin',
          status,
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

    // middle_admins 행 보장(profile_id에 unique가 없으므로 있으면 갱신, 없으면 삽입 → 중복 row 방지)
    const { data: existingMA, error: maLookupError } = await adminClient
      .from('middle_admins')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle()
    if (maLookupError) {
      console.error(`[${TAG}] middle_admins lookup error:`, maLookupError)
    }
    const maPayload = {
      profile_id: userId,
      display_name: name,
      status,
      license_total: licenseTotal,
      license_start: licenseStart || new Date().toISOString(),
      license_end: licenseEnd || new Date().toISOString(),
    }
    const maResult = existingMA
      ? await adminClient.from('middle_admins').update(maPayload).eq('profile_id', userId)
      : await adminClient.from('middle_admins').insert(maPayload)
    if (maResult.error) {
      console.error(`[${TAG}] middle_admins save error:`, JSON.stringify(maResult.error, null, 2))
      // 보상 롤백: 이번에 만든 auth 사용자면 삭제(profile/middle_admins는 CASCADE).
      // 기존 반쪽 계정이면 auth는 두고, 이번에 설정한 role만 롤백하지 않는다(데이터 보존 우선).
      if (createdAuthUser) {
        await safeRollback(TAG, 'delete auth user', () => adminClient.auth.admin.deleteUser(userId))
      }
      throw new RequestError('중간관리자 정보 저장 중 오류가 발생했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }

    return successResponse({
      userId,
      role: 'middle_admin',
      message: '중간관리자가 등록되었습니다.',
    })
  } catch (error: unknown) {
    return handleCaughtError(TAG, error, '중간관리자 계정 생성 중 오류가 발생했습니다.')
  }
})
