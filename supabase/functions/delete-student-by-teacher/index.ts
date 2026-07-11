import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

class RequestError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

// 보호해야 할 학생 계정 ID 또는 로그인 아이디 목록
const PROTECTED_LOGIN_IDS = ['happy003', 'seondeok', 'jeongyakmo', 'test', 'demo']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: '허용되지 않은 요청 방식입니다.', message: '허용되지 않은 요청 방식입니다.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new RequestError('서버 설정이 올바르지 않습니다.', 500)
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new RequestError('로그인이 필요합니다.', 401)
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: verifyError } = await adminClient.auth.getUser(token)

    if (verifyError || !callerUser) {
      throw new RequestError('로그인이 만료되었습니다.', 401)
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('id, role, organization_id, center_id')
      .eq('id', callerUser.id)
      .single()

    if (callerProfileError || !callerProfile) {
      console.error('[delete-student] caller profile fetch error:', callerProfileError)
      throw new RequestError('관리자 권한 정보를 확인할 수 없습니다.', 403)
    }

    // 권한 확인 (teacher, org_admin, super_admin)
    if (!['teacher', 'org_admin', 'super_admin'].includes(callerProfile.role)) {
      throw new RequestError('학생 계정을 삭제할 권한이 없습니다.', 403)
    }

    const body = await req.json()
    const studentId = body.studentId

    if (!studentId || typeof studentId !== 'string') {
      throw new RequestError('삭제할 학생의 ID가 올바르지 않습니다.')
    }

    // 본인 삭제 불가
    if (studentId === callerUser.id) {
      throw new RequestError('자기 자신의 계정은 삭제할 수 없습니다.', 403)
    }

    // 삭제 대상 학생 정보 조회
    const { data: studentData, error: studentError } = await adminClient
      .from('students')
      .select('id, login_id, center_id, organization_id')
      .eq('id', studentId)
      .single()

    if (studentError || !studentData) {
      // 이미 삭제된 경우 처리
      if (studentError?.code === 'PGRST116') {
         throw new RequestError('이미 삭제되었거나 존재하지 않는 학생입니다.', 404)
      }
      console.error('[delete-student] student fetch error:', studentError)
      throw new RequestError('학생 정보를 조회할 수 없습니다.', 500)
    }

    // 보호 계정 확인
    if (PROTECTED_LOGIN_IDS.includes(studentData.login_id)) {
      throw new RequestError('해당 테스트용/보호된 학생 계정은 삭제할 수 없습니다.', 403)
    }

    // 다른 선생님/기관의 학생인지 권한 교차 검증 (super_admin은 패스)
    if (callerProfile.role !== 'super_admin') {
      const isSameOrg = callerProfile.organization_id === studentData.organization_id
      const isSameCenter = callerProfile.center_id === studentData.center_id
      
      if (!isSameOrg && !isSameCenter) {
        throw new RequestError('담당 기관 또는 학급 소속 학생만 삭제할 수 있습니다.', 403)
      }
    }

    console.log(`[delete-student] Starting deletion for student: ${studentData.login_id} (${studentId}) by ${callerProfile.role} (${callerUser.id})`)

    // 외래키 제약조건에 대비해 연관 데이터들을 수동 삭제 시도 (에러 발생해도 무시, CASCADE 기대)
    const tablesToDeleteFrom = [
      'student_gardens',
      'student_items',
      'student_attendance_logs',
      'student_growth_evaluations',
      'student_notification_hidden',
      'student_message_hidden'
    ]

    for (const table of tablesToDeleteFrom) {
      try {
        await adminClient.from(table).delete().eq('student_id', studentId)
      } catch (err) {
        console.warn(`[delete-student] Failed to delete from ${table}:`, err)
      }
    }

    // toon_projects 삭제 (user_id 기반)
    try {
      await adminClient.from('toon_projects').delete().eq('user_id', studentId)
    } catch(err) {
      console.warn(`[delete-student] Failed to delete from toon_projects:`, err)
    }

    // students 테이블 레코드 삭제
    const { error: deleteStudentError } = await adminClient
      .from('students')
      .delete()
      .eq('id', studentId)

    if (deleteStudentError) {
      console.error('[delete-student] students delete error:', deleteStudentError)
      throw new RequestError('학생 정보를 삭제하는 데 실패했습니다.', 500)
    }

    // profiles 테이블 레코드 삭제
    const { error: deleteProfileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', studentId)
      
    if (deleteProfileError) {
      console.error('[delete-student] profiles delete error:', deleteProfileError)
      // ignore, proceed to delete auth user
    }

    // auth.users 레코드 삭제
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(studentId)
    
    if (authDeleteError) {
      console.error('[delete-student] auth user delete error:', authDeleteError)
      // 에러가 나더라도 이미 students에서 지웠으므로 목록에서는 사라질 수 있지만, 완전삭제를 위해 실패 보고
      throw new RequestError('사용자 계정을 삭제하는 데 실패했습니다.', 500)
    }

    console.log(`[delete-student] Successfully deleted student ${studentId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedStudentId: studentId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    const status = error instanceof RequestError ? error.status : 500
    const message = error?.message || '학생 삭제 중 서버 오류가 발생했습니다.'
    console.error(`[delete-student] Error (${status}):`, message)

    return new Response(
      JSON.stringify({ error: message, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})
