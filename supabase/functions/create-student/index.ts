// 선생님/기관관리자 → 학생 생성.
// 핵심 수정: auth.users 생성 시 on_auth_user_created 트리거가 profiles 행을 먼저 만들므로
// EF에서 plain INSERT 하면 PK 중복(500)이 발생한다. 따라서 upsert(onConflict:'id')로
// 트리거가 만든 free_user 프로필을 올바른 역할/소속으로 덮어쓴다.
// 모든 DB 단계는 service_role로 처리하고, 중간 실패 시 Auth/프로필을 보상 롤백한다.
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

const TAG = 'create-student'

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
    const callerProfile = await getCallerProfile(adminClient, callerUser.id)
    authorize(callerProfile, ['teacher', 'org_admin', 'super_admin'])

    const body = await req.json().catch(() => ({}))
    const loginId = typeof body.loginId === 'string' ? body.loginId.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const classId = typeof body.classId === 'string' ? body.classId : ''
    const className = typeof body.className === 'string' ? body.className : ''
    const grade = body.grade ?? 1
    const number = body.number ?? 1

    if (!name) throw new RequestError('이름을 입력해 주세요.')
    if (!loginId) throw new RequestError('아이디를 입력해 주세요.')
    if (!/^[a-z0-9._-]{3,30}$/.test(loginId)) {
      throw new RequestError('아이디는 영문 소문자/숫자 3~30자로 입력해 주세요.')
    }
    if (!password) throw new RequestError('비밀번호를 입력해 주세요.')
    if (password.length < 4) throw new RequestError('비밀번호는 4자 이상이어야 합니다.')

    // 소속은 클라이언트가 보낸 값으로 믿지 않고 서버의 호출자 프로필에서 결정한다.
    const organizationId = callerProfile.organization_id
    const centerId = callerProfile.center_id ?? null
    if (!organizationId) {
      throw new RequestError('기관 정보가 연결되지 않았습니다.', 400)
    }

    // 학생은 외부 노출되지 않는 내부 가상 이메일을 사용한다.
    const cleanEmail = `${loginId}@student.toonschool.local`

    // 중복 아이디(이메일) 사전 확인 → 409
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
      throw new RequestError('이미 사용 중인 아이디입니다.', 409, 'DUPLICATE_LOGIN_ID')
    }

    // Auth 계정 생성
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'student' },
    })
    if (authError || !authData.user) {
      console.error(`[${TAG}] auth create error:`, authError)
      const msg = (authError?.message || '').toLowerCase()
      const isDuplicate = msg.includes('already') || msg.includes('registered')
      throw new RequestError(
        isDuplicate ? '이미 사용 중인 아이디입니다.' : '계정 생성 중 오류가 발생했습니다.',
        isDuplicate ? 409 : 500,
        isDuplicate ? 'DUPLICATE_LOGIN_ID' : 'ACCOUNT_CREATION_FAILED'
      )
    }

    const userId = authData.user.id

    // profiles upsert: 트리거가 이미 만든 행이 있으면 역할/소속으로 덮어쓴다(핵심 수정).
    const { error: profileError } = await adminClient.from('profiles').upsert(
      {
        id: userId,
        email: cleanEmail,
        name,
        role: 'student',
        organization_id: organizationId,
        center_id: centerId,
        status: 'active',
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

    // students 행 추가(LMS 조회용). students.id 는 profiles 과 FK가 없으므로 별도 저장.
    const validClassId = classId && isValidUUID(classId) ? classId : null
    const { error: studentError } = await adminClient.from('students').insert({
      id: userId,
      name,
      login_id: loginId,
      temp_password: password,
      class_id: validClassId,
      grade: `${grade}학년`,
      center_id: centerId,
      organization_id: organizationId,
      status: 'active',
    })
    if (studentError) {
      console.error(`[${TAG}] student insert error:`, JSON.stringify(studentError, null, 2))
      // 보상 롤백: 프로필 + Auth 사용자 제거(고아 계정 방지)
      await safeRollback(TAG, 'delete profile', () =>
        adminClient.from('profiles').delete().eq('id', userId)
      )
      await safeRollback(TAG, 'delete auth user', () => adminClient.auth.admin.deleteUser(userId))
      throw new RequestError('학생 계정 저장에 실패했습니다.', 500, 'ACCOUNT_CREATION_FAILED')
    }

    return successResponse({
      userId,
      role: 'student',
      message: '학생이 등록되었습니다.',
      student: { id: userId, name, loginId, password, classId, className, grade, number },
    })
  } catch (error: unknown) {
    return handleCaughtError(TAG, error, '학생 계정 생성 중 오류가 발생했습니다.')
  }
})
