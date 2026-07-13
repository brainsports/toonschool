// 선생님 학생관리 목록 조회 — 선생님별 데이터 격리.
// 핵심: 같은 center_id/organization_id 라는 이유로 기관 전체 학생을 반환하지 않는다.
//  - teacher     : 본인이 생성한 학생(students.created_by) 또는 본인 소유 학급(classes.teacher_id)에 배정된 학생만
//  - org_admin   : 자신의 기관(organization_id) 학생
//  - middle_admin: 자신이 관리하는 기관의 학생
//  - super_admin : 전체
// 신규 선생님은 created_by/담당학급이 없으므로 빈 목록(200)을 반환한다. center_id 누락시 500 금지.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'
import { successResponse, handleCaughtError, RequestError } from '../_shared/errors.ts'
import { createAdminClient, resolveCaller, getCallerProfile } from '../_shared/client.ts'

const TAG = 'student-by-teacher'

const parseGrade = (raw: unknown, fallback = 0): number => {
  const n = Number.parseInt(String(raw ?? '').replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

const toStudentShape = (row: Record<string, unknown>, index: number) => {
  const grade = parseGrade(row.grade, 0)
  return {
    id: row.id,
    name: row.name,
    loginId: row.login_id,
    password: row.temp_password || '******',
    classId: row.class_id || (grade ? `class-${grade}` : ''),
    className: grade ? `${grade}학년 전체` : '',
    grade,
    number: index + 1,
    createdAt: row.created_at || null,
  }
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
    const profile = await getCallerProfile(adminClient, callerUser.id)

    const inactive = ['suspended', 'deleted', 'inactive']
    if (profile.status && inactive.includes(profile.status)) {
      throw new RequestError('비활성화된 계정은 이 작업을 수행할 수 없습니다.', 403, 'FORBIDDEN')
    }

    const body = await req.json().catch(() => ({}))
    const grade = typeof body.grade === 'number' ? body.grade : Number.parseInt(body.grade, 10)
    const role = profile.role

    let query = adminClient.from('students').select('*').eq('status', 'active')
    if (Number.isFinite(grade) && grade > 0) {
      query = query.eq('grade', `${grade}학년`)
    }

    if (role === 'teacher') {
      // 1) 본인 소유 학급 id
      const { data: myClasses } = await adminClient
        .from('classes')
        .select('id')
        .eq('teacher_id', callerUser.id)
      const classIds = (myClasses || []).map((c: { id: string }) => c.id).filter(Boolean)
      // 2) 본인이 생성한 학생 OR 소유 학급 배정 학생
      const orParts = [`created_by.eq.${callerUser.id}`]
      if (classIds.length > 0) {
        orParts.push(`class_id.in.(${classIds.join(',')})`)
      }
      query = query.or(orParts.join(','))
    } else if (role === 'org_admin') {
      if (!profile.organization_id) {
        return successResponse({ students: [], total: 0, message: '조회된 학생이 없습니다.' })
      }
      query = query.eq('organization_id', profile.organization_id)
    } else if (role === 'middle_admin') {
      // 자신이 관리하는 기관들의 학생
      const { data: myOrgs, error: orgErr } = await adminClient
        .from('organizations')
        .select('id')
        .eq('middle_admin_id', callerUser.id)
      if (orgErr) {
        console.error(`[${TAG}] middle_admin orgs error:`, orgErr)
      }
      const orgIds = (myOrgs || []).map((o: { id: string }) => o.id)
      if (orgIds.length === 0) {
        return successResponse({ students: [], total: 0, message: '조회된 학생이 없습니다.' })
      }
      query = query.in('organization_id', orgIds)
    } else if (role === 'super_admin' || role === 'superadmin') {
      // 전체 조회
    } else {
      // 그 외 역할은 빈 목록(노출 금지)
      return successResponse({ students: [], total: 0, message: '조회된 학생이 없습니다.' })
    }

    const { data, error: queryError } = await query.order('created_at', { ascending: true })
    if (queryError) {
      console.error(`[${TAG}] query error:`, queryError)
      throw new RequestError('학생 목록을 불러오는 중 오류가 발생했습니다.', 500, 'INTERNAL_ERROR')
    }

    const students = (data || []).map(toStudentShape)
    return successResponse({ students, total: students.length, message: '학생 목록을 불러왔습니다.' })
  } catch (error: unknown) {
    return handleCaughtError(TAG, error, '학생 목록을 불러오는 중 오류가 발생했습니다.')
  }
})
