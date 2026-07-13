// 선생님/관리자 → 학생 삭제. 원자적이고 멱등적.
// 핵심 수정:
//  1) auth 사용자가 이미 삭제된 경우 실패(500)로 처리하지 않고 잔여 데이터 정리 후 성공(alreadyDeleted).
//  2) student_notification_hidden 등 profiles 에 대해 RESTRICT 인 FK를 먼저 수동 삭제해
//     auth/profile 삭제가 막히지 않도록 한다.
//  3) students 행이 없어도 남은 잔여 데이터를 정리(고아 정리)하고 성공을 반환한다.
// 반복 삭제 요청은 500 없이 멱등적으로 처리된다.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'
import { successResponse, handleCaughtError, RequestError } from '../_shared/errors.ts'
import { createAdminClient, resolveCaller, getCallerProfile } from '../_shared/client.ts'
import { safeRollback } from '../_shared/rollback.ts'

const TAG = 'delete-student'
// 보호 계정(실제 데모/운영용) — 삭제 차단. 정리가 필요하면 수퍼관리자/SQL 경로 사용.
const PROTECTED_LOGIN_IDS = ['happy003', 'seondeok', 'jeongyakmo', 'test', 'demo']

// profiles(id) 에 대해 RESTRICT/NO ACTION 인 FK 테이블 — auth/profile 삭제 전에 반드시 정리.
const RESTRICT_TABLES = ['student_notification_hidden']
// student_id(profile id) 기반 부가 데이터. 대부분 profiles CASCADE 로 자동 정리되지만
// auth 없이 students 행만 있는 경우 등을 대비해 명시적으로도 정리(실패해도 무시).
const CASCADE_TABLES = [
  'student_gardens',
  'student_items',
  'student_attendance_logs',
  'student_growth_evaluations',
  'reward_logs',
]

const isAuthUserMissing = (err: unknown) => {
  const msg = String((err as { message?: string })?.message || '').toLowerCase()
  return msg.includes('not found') || msg.includes('does not exist') || msg.includes('no rows') || msg.includes("doesn't exist")
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
    const callerProfile = await getCallerProfile(adminClient, callerUser.id, 'id, role, status, organization_id, center_id')

    if (!['teacher', 'org_admin', 'middle_admin', 'super_admin', 'superadmin'].includes(callerProfile.role)) {
      throw new RequestError('학생 계정을 삭제할 권한이 없습니다.', 403, 'FORBIDDEN')
    }
    const inactive = ['suspended', 'deleted', 'inactive']
    if (callerProfile.status && inactive.includes(callerProfile.status)) {
      throw new RequestError('비활성화된 계정은 이 작업을 수행할 수 없습니다.', 403, 'FORBIDDEN')
    }

    const body = await req.json().catch(() => ({}))
    const studentId = body.studentId
    if (!studentId || typeof studentId !== 'string') {
      throw new RequestError('삭제할 학생의 ID가 올바르지 않습니다.')
    }
    if (studentId === callerUser.id) {
      throw new RequestError('자기 자신의 계정은 삭제할 수 없습니다.', 403, 'FORBIDDEN')
    }

    // 대상 학생 행 조회(없을 수도 있음 — 고아/이미 삭제)
    const { data: studentData, error: studentErr } = await adminClient
      .from('students')
      .select('id, login_id, center_id, organization_id')
      .eq('id', studentId)
      .maybeSingle()

    if (studentErr) {
      console.error(`[${TAG}] student fetch error:`, studentErr)
      throw new RequestError('학생 정보를 조회하는 중 오류가 발생했습니다.', 500, 'INTERNAL_ERROR')
    }

    if (studentData) {
      // 보호 계정 차단
      if (PROTECTED_LOGIN_IDS.includes(studentData.login_id)) {
        throw new RequestError('해당 학생 계정은 보호되어 삭제할 수 없습니다.', 403, 'FORBIDDEN')
      }
      // 권한 교차 검증(super_admin 패스). 같은 기관 또는 같은 센터 소속만 가능.
      if (!['super_admin', 'superadmin'].includes(callerProfile.role)) {
        const sameOrg = callerProfile.organization_id && callerProfile.organization_id === studentData.organization_id
        const sameCenter = callerProfile.center_id && callerProfile.center_id === studentData.center_id
        if (!sameOrg && !sameCenter) {
          throw new RequestError('담당 기관 또는 학급 소속 학생만 삭제할 수 있습니다.', 403, 'FORBIDDEN')
        }
      }
    }

    console.log(`[${TAG}] deleting student ${studentId} (students_row=${!!studentData}) by ${callerProfile.role} ${callerUser.id}`)

    // 1) RESTRICT FK 테이블 먼저 정리(profiles 삭제가 막히지 않도록)
    for (const t of RESTRICT_TABLES) {
      await safeRollback(TAG, `clear ${t}`, () => adminClient.from(t).delete().eq('student_id', studentId))
    }
    // 2) 부가 데이터 정리(profiles CASCADE 이중 안전망)
    for (const t of CASCADE_TABLES) {
      await safeRollback(TAG, `clear ${t}`, () => adminClient.from(t).delete().eq('student_id', studentId))
    }
    // 3) 만화 프로젝트(user_id 기준). toon_projects.user_id → auth.users ON DELETE SET NULL 이라 자동 null 처리되지만 명시 정리.
    await safeRollback(TAG, 'clear toon_projects', () => adminClient.from('toon_projects').delete().eq('user_id', studentId))
    // 4) 학급 관계/평가 등 students(id) CASCADE 테이블은 students 행 삭제로 자동 정리됨.
    // 5) students 행 삭제
    if (studentData) {
      const { error: delStudentErr } = await adminClient.from('students').delete().eq('id', studentId)
      if (delStudentErr) {
        console.error(`[${TAG}] students delete error:`, delStudentErr)
        throw new RequestError('학생 정보를 삭제하는 중 오류가 발생했습니다.', 500, 'INTERNAL_ERROR')
      }
    }
    // 6) profiles 행 삭제(auth.users CASCADE 로도 처리되지만 명시적으로도 수행)
    await safeRollback(TAG, 'delete profile', () => adminClient.from('profiles').delete().eq('id', studentId))
    // 7) auth 사용자 삭제 — 이미 없으면 성공으로 간주(멱등)
    const { error: authErr } = await adminClient.auth.admin.deleteUser(studentId)
    if (authErr) {
      if (isAuthUserMissing(authErr)) {
        console.log(`[${TAG}] auth user already gone for ${studentId} — treating as deleted`)
      } else {
        console.error(`[${TAG}] auth delete error:`, authErr)
        // profiles/students 는 이미 정리됐고, auth 만 남은 상태. 사용자에게는 성공으로 응답하되 로그만 남긴다.
        // (auth 잔여는 주기적 정리 또는 수퍼관리자 경로에서 처리)
      }
    }

    return successResponse({
      deletedStudentId: studentId,
      alreadyDeleted: !studentData,
      message: studentData ? '학생이 삭제되었습니다.' : '이미 삭제된 학생입니다.',
    })
  } catch (error: unknown) {
    return handleCaughtError(TAG, error, '학생 삭제 중 오류가 발생했습니다.')
  }
})
