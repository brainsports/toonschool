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

// best-effort 정리 헬퍼 (FK 충돌 방지용). 실패해도 흐름을 멈추지 않는다.
const cleanup = async (label: string, action: () => Promise<unknown>) => {
  try {
    await action()
  } catch (err) {
    console.warn(`[admin-manage-user] cleanup failed: ${label}`, err)
  }
}

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

  // 서비스 롤 키는 Edge Function 환경(Deno.env)에서만 사용. 프런트에 노출 금지.
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new RequestError('서버 설정이 올바르지 않습니다.', 500)
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. 호출자 JWT 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new RequestError('로그인이 필요합니다.', 401)
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: verifyError } = await adminClient.auth.getUser(token)
    if (verifyError || !callerUser) {
      throw new RequestError('로그인이 만료되었습니다.', 401)
    }

    // 2. 호출자 역할 확인 (super_admin만)
    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', callerUser.id)
      .single()

    if (callerProfileError || !callerProfile) {
      throw new RequestError('관리자 권한 정보를 확인할 수 없습니다.', 403)
    }
    if (!['super_admin', 'superadmin'].includes(callerProfile.role)) {
      throw new RequestError('회원을 삭제할 권한이 없습니다.', 403)
    }

    // 3. 요청 바디 검증
    const body = await req.json().catch(() => ({}))
    const targetUserId = body.targetUserId
    const confirmEmail = typeof body.confirmEmail === 'string' ? body.confirmEmail.trim().toLowerCase() : ''

    if (!targetUserId || typeof targetUserId !== 'string') {
      throw new RequestError('삭제할 회원의 ID가 올바르지 않습니다.', 400)
    }

    // 4. 자기 자신 삭제 차단
    if (targetUserId === callerUser.id) {
      throw new RequestError('자기 자신의 계정은 삭제할 수 없습니다.', 403)
    }

    // 5. 대상 사용자 조회
    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('id, email, name, role, status, organization_id')
      .eq('id', targetUserId)
      .maybeSingle()

    if (targetError) {
      console.error('[admin-manage-user] target fetch error:', targetError)
      throw new RequestError('회원 정보를 조회하는 중 오류가 발생했습니다.', 500)
    }
    if (!targetProfile) {
      throw new RequestError('이미 삭제되었거나 존재하지 않는 회원입니다.', 404)
    }

    // 6. 다른 슈퍼관리자 삭제 강한 보호 (마지막 슈퍼관리자 포함)
    if (['super_admin', 'superadmin'].includes(targetProfile.role)) {
      throw new RequestError('다른 슈퍼관리자 계정은 이 기능으로 삭제할 수 없습니다.', 403)
    }

    // 7. 이메일 확인 입력 검증 (UI에서 동일 이메일 입력 시에만 허용)
    const targetEmail = (targetProfile.email || '').toLowerCase()
    if (!confirmEmail || confirmEmail !== targetEmail) {
      throw new RequestError('대상 회원의 이메일과 일치하지 않습니다.', 400)
    }

    console.log(`[admin-manage-user] delete ${targetEmail} (${targetUserId}) by super_admin ${callerUser.id}`)

    // 8. NO ACTION FK 들을 미리 정리하여 auth.users 삭제가 막히지 않도록 한다.
    //    (CASCADE/SET NULL 항목은 auth.admin.deleteUser 이후 자동 처리됨)
    // license_logs.actor_id 는 NOT NULL 이므로 행 삭제. target_id 는 NULL 화(이력 보존).
    await cleanup('license_logs(actor)', () =>
      adminClient.from('license_logs').delete().eq('actor_id', targetUserId))
    await cleanup('license_logs(target)', () =>
      adminClient.from('license_logs').update({ target_id: null }).eq('target_id', targetUserId))

    await cleanup('license_allocations', () =>
      adminClient.from('license_allocations').delete().or(`from_user_id.eq.${targetUserId},to_user_id.eq.${targetUserId}`))

    await cleanup('org_admin_notification_status', () =>
      adminClient.from('org_admin_notification_status').delete().eq('org_admin_id', targetUserId))
    await cleanup('teacher_notification_status', () =>
      adminClient.from('teacher_notification_status').delete().eq('teacher_id', targetUserId))
    await cleanup('org_notification_reads', () =>
      adminClient.from('org_notification_reads').delete().eq('user_id', targetUserId))
    await cleanup('student_notification_hidden', () =>
      adminClient.from('student_notification_hidden').delete().eq('student_id', targetUserId))

    // org_notifications: sender/target 참조 행 삭제 (의존 상태행을 먼저 지운 뒤)
    await cleanup('org_notifications', () =>
      adminClient.from('org_notifications').delete()
        .or(`sender_id.eq.${targetUserId},target_user_id.eq.${targetUserId},target_teacher_id.eq.${targetUserId}`))

    // admin_resources.created_by / uploaded_by 는 작성자 정보만 NULL 화(자료 보존)
    await cleanup('admin_resources.created_by', () =>
      adminClient.from('admin_resources').update({ created_by: null }).eq('created_by', targetUserId))

    // audit_logs.actor_id NULL 화 (이력 보존)
    await cleanup('audit_logs.actor', () =>
      adminClient.from('audit_logs').update({ actor_id: null }).eq('actor_id', targetUserId))

    // source_documents.uploaded_by NULL 화
    await cleanup('source_documents.uploaded_by', () =>
      adminClient.from('source_documents').update({ uploaded_by: null }).eq('uploaded_by', targetUserId))

    // students.id 는 profiles 과 FK 가 없으므로 별도 삭제
    await cleanup('students', () =>
      adminClient.from('students').delete().eq('id', targetUserId))

    // 9. 감사 로그 먼저 기록 (actor 는 호출자)
    await cleanup('audit_logs(delete)', () =>
      adminClient.from('audit_logs').insert([{
        actor_id: callerUser.id,
        action: 'DELETE_MEMBER',
        target_table: 'auth.users',
        target_id: targetUserId,
        before_data: { email: targetEmail, name: targetProfile.name, role: targetProfile.role, status: targetProfile.status },
        after_data: { deleted: true }
      }]))

    // 10. auth.users 삭제 → profiles(middle_admins, 학생 보상/성장/출석 테이블 등) CASCADE
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(targetUserId)
    if (authDeleteError) {
      console.error('[admin-manage-user] auth delete error:', authDeleteError)
      throw new RequestError('회원 계정 삭제에 실패했습니다. (연관 데이터를 확인 중입니다.)', 500)
    }

    console.log(`[admin-manage-user] successfully deleted ${targetUserId}`)

    return new Response(
      JSON.stringify({ success: true, deletedUserId: targetUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    const status = error instanceof RequestError ? error.status : 500
    const message = error?.message || '회원 삭제 중 서버 오류가 발생했습니다.'
    console.error(`[admin-manage-user] Error (${status}):`, message)
    return new Response(
      JSON.stringify({ error: message, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})
