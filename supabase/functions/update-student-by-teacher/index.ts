// 선생님/관리자 → 학생 정보 수정(이름·비밀번호·소속학급·학생별 절대 월 만화 한도).
// 담당 교사(학급 우선, created_by 보조) 검증을 서버에서 수행 — 프런트 필터에 의존하지 않는다.
// service_role 로 동작하며 verify_jwt=true 유정. 학생 소속 보호(1단계) 로직을 재사용·강화.
//
// 변경 순서/복구(부분 실패 방지):
//   1) 권한 검증(학생·대상 학급 소유권/기관)
//   2) DB 변경(name, class_id, monthly_quota_override) — 모두 성공해야 다음 단계
//   3) 비밀번호(선택): Auth.updateUser + students.temp_password
// Auth 와 DB 는 단일 트랜잭션으로 묶을 수 없으므로 DB 를 먼저 확정하고 비밀번호를 마지막에.
// 비밀번호 실패 시 DB 변경은 유지되며 partial_success=true 로 응답한다(완전 롤백 불가).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'
import { RequestError, successResponse, handleCaughtError } from '../_shared/errors.ts'
import { createAdminClient, resolveCaller, getCallerProfile } from '../_shared/client.ts'

const TAG = 'update-student'

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
    const callerProfile = await getCallerProfile(
      adminClient,
      callerUser.id,
      'id, role, status, organization_id, center_id'
    )

    if (!['teacher', 'org_admin', 'middle_admin', 'super_admin', 'superadmin'].includes(callerProfile.role)) {
      throw new RequestError('학생 정보를 수정할 권한이 없습니다.', 403, 'FORBIDDEN')
    }
    const inactive = ['suspended', 'deleted', 'inactive']
    if (callerProfile.status && inactive.includes(callerProfile.status)) {
      throw new RequestError('비활성화된 계정은 이 작업을 수행할 수 없습니다.', 403, 'FORBIDDEN')
    }

    const body = await req.json().catch(() => ({}))
    const studentId = typeof body.studentId === 'string' ? body.studentId : ''
    if (!studentId) throw new RequestError('학생 ID가 올바르지 않습니다.', 400, 'INVALID_INPUT')

    // 부분 변경 여부 플래그 (요청에 필드가 있으면 변경 대상)
    const hasName = Object.prototype.hasOwnProperty.call(body, 'name') && typeof body.name === 'string'
    const name = hasName ? body.name.trim() : ''
    const hasPassword = Object.prototype.hasOwnProperty.call(body, 'newPassword') && typeof body.newPassword === 'string'
    const newPassword = hasPassword ? body.newPassword : ''
    const hasClass = Object.prototype.hasOwnProperty.call(body, 'classId')
    const classId = hasClass ? (typeof body.classId === 'string' && body.classId ? body.classId : null) : undefined
    const hasQuota = Object.prototype.hasOwnProperty.call(body, 'monthlyQuotaOverride')
    const quotaRaw = hasQuota ? body.monthlyQuotaOverride : undefined
    // quotaRaw: number(4/8/20) → 절대 설정, null → 학급 기본 사용(override 해제)
    const monthlyQuotaOverride =
      quotaRaw === null || quotaRaw === undefined ? (quotaRaw === null ? null : undefined)
      : (Number.isFinite(Number(quotaRaw)) && Number(quotaRaw) > 0 ? Number(quotaRaw) : undefined)

    if (hasName && !name) throw new RequestError('이름을 입력해 주세요.', 400, 'INVALID_INPUT')
    if (hasPassword && newPassword.length < 4) {
      throw new RequestError('비밀번호는 4자 이상이어야 합니다.', 400, 'INVALID_INPUT')
    }
    if (hasQuota && monthlyQuotaOverride === undefined) {
      throw new RequestError('만화 생성 한도 값이 올바르지 않습니다.', 400, 'INVALID_INPUT')
    }
    if (!hasName && !hasPassword && !hasClass && !hasQuota) {
      throw new RequestError('변경할 항목이 없습니다.', 400, 'INVALID_INPUT')
    }

    // 대상 학생 조회
    const { data: student, error: sErr } = await adminClient
      .from('students')
      .select('id, name, class_id, created_by, organization_id, login_id, temp_password')
      .eq('id', studentId)
      .maybeSingle()
    if (sErr) {
      console.error(`[${TAG}] student fetch error:`, sErr)
      throw new RequestError('학생 정보를 조회하는 중 오류가 발생했습니다.', 500, 'INTERNAL_ERROR')
    }
    if (!student) throw new RequestError('존재하지 않는 학생입니다.', 404, 'STUDENT_NOT_FOUND')

    // 담당 교사 검증(학급 우선, created_by 보조) + 기관 일치
    const isSuper = ['super_admin', 'superadmin'].includes(callerProfile.role)
    if (!isSuper) {
      if (callerProfile.role === 'teacher') {
        let allowed = false
        if (student.class_id) {
          const { data: cls } = await adminClient
            .from('classes').select('id').eq('id', student.class_id).eq('teacher_id', callerUser.id).maybeSingle()
          allowed = !!cls
        } else {
          allowed = student.created_by === callerUser.id
        }
        if (!allowed) throw new RequestError('본인이 담당하는 학생만 수정할 수 있습니다.', 403, 'FORBIDDEN')
      } else {
        // org_admin/middle_admin: 같은 기관 범위
        const sameOrg = callerProfile.organization_id && callerProfile.organization_id === student.organization_id
        const sameCenter = callerProfile.center_id && callerProfile.center_id === student.center_id
        if (!sameOrg && !sameCenter) {
          throw new RequestError('담당 기관 소속 학생만 수정할 수 있습니다.', 403, 'FORBIDDEN')
        }
      }
    }

    // 대상 학급 검증(classId 변경 시): 본인 소유 + 같은 기관
    if (hasClass && classId) {
      const { data: targetClass, error: cErr } = await adminClient
        .from('classes').select('id, teacher_id, organization_id').eq('id', classId).maybeSingle()
      if (cErr) {
        console.error(`[${TAG}] target class lookup error:`, cErr)
        throw new RequestError('학생 정보를 수정하는 중 오류가 발생했습니다.', 500, 'INTERNAL_ERROR')
      }
      if (!targetClass) throw new RequestError('선택한 학급을 찾을 수 없습니다.', 400, 'CLASS_NOT_FOUND')
      if (!isSuper && callerProfile.role === 'teacher' && targetClass.teacher_id !== callerUser.id) {
        throw new RequestError('선택한 학급은 현재 선생님이 담당하는 학급이 아닙니다.', 403, 'CLASS_NOT_OWNED_BY_TEACHER')
      }
      if (targetClass.organization_id !== student.organization_id) {
        throw new RequestError('다른 기관 학급으로는 이동할 수 없습니다.', 403, 'CLASS_NOT_OWNED_BY_TEACHER')
      }
    }

    // --- DB 변경 (name, class_id, monthly_quota_override) ---
    const updated: Record<string, boolean> = {}

    if (hasName && name && name !== student.name) {
      const { error: e1 } = await adminClient.from('students').update({ name }).eq('id', studentId)
      if (e1) { console.error(`[${TAG}] students.name update:`, e1); throw new RequestError('이름 수정에 실패했습니다.', 500, 'INTERNAL_ERROR') }
      await adminClient.from('profiles').update({ name }).eq('id', studentId)
      updated.name = true
    }

    if (hasClass && classId && classId !== student.class_id) {
      const { error: e2 } = await adminClient.from('students').update({ class_id: classId }).eq('id', studentId)
      if (e2) { console.error(`[${TAG}] students.class_id update:`, e2); throw new RequestError('학급 변경에 실패했습니다.', 500, 'INTERNAL_ERROR') }
      updated.class = true
    }

    if (hasQuota) {
      // monthly_quota_override: number(절대) 또는 null(학급 기본). extra_quota 등 기존 값은 보존.
      const { error: e3 } = await adminClient.from('student_quota_overrides').upsert(
        { student_id: studentId, teacher_id: callerUser.id, monthly_quota_override: monthlyQuotaOverride },
        { onConflict: 'student_id' }
      )
      if (e3) { console.error(`[${TAG}] override upsert:`, e3); throw new RequestError('만화 한도 변경에 실패했습니다.', 500, 'INTERNAL_ERROR') }
      updated.quota = true
    }

    // --- 비밀번호 변경(선택, 마지막) ---
    // Auth 와 DB 단일 트랜잭션 불가 → DB 확정 후 비밀번호. 실패 시 DB 변경은 유지(partial).
    if (hasPassword && newPassword) {
      const { error: authErr } = await adminClient.auth.admin.updateUserById(studentId, { password: newPassword })
      if (authErr) {
        console.error(`[${TAG}] auth password update failed (DB changes kept):`, authErr)
        return successResponse(
          { updated, passwordChanged: false, partial_success: true,
            message: '이름·학급·한도는 변경되었으나 비밀번호 변경에 실패했습니다. 비밀번호를 다시 시도해 주세요.' },
          200
        )
      }
      const { error: tpErr } = await adminClient.from('students').update({ temp_password: newPassword }).eq('id', studentId)
      if (tpErr) console.error(`[${TAG}] temp_password sync failed (auth updated):`, tpErr)
      updated.password = true
    }

    return successResponse({
      updated,
      passwordChanged: !!updated.password,
      message: '학생 정보가 수정되었습니다.',
    })
  } catch (error: unknown) {
    return handleCaughtError(TAG, error, '학생 정보를 수정하는 중 오류가 발생했습니다.')
  }
})
