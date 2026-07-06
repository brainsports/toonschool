import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // 1. 요청 검증 (Super Admin 권한 확인 등)
    const authHeader = req.headers.get('Authorization')!
    // 클라이언트에서 넘긴 token으로 사용자 확인 후, role이 super_admin인지 확인하는 로직 필요

    const { name, email, password, licenseTotal, licenseStart, licenseEnd, status } = await req.json()

    // 2. Admin API용 Supabase Client 생성
    // 프론트엔드 코드에는 절대 service_role_key가 노출되면 안 됨
    // Edge Function 환경변수(SUPABASE_SERVICE_ROLE_KEY)를 통해 안전하게 초기화
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 3. Auth 유저 생성 (Admin API)
    // admin.createUser는 이메일 중복 시 즉시 오류를 반환하며 rate limit에 상대적으로 자유로움
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'middle_admin' }
    })

    if (authError) {
      throw authError
    }

    const userId = authData.user.id

    // 4. profiles 테이블 저장
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      email: email,
      name: name,
      role: 'middle_admin',
      status: status || 'active',
      plan_type: 'free',
      monthly_quota: 0
    })

    if (profileError) throw profileError

    // 5. middle_admins 테이블 저장
    const { error: middleAdminError } = await supabaseAdmin.from('middle_admins').insert({
      profile_id: userId,
      display_name: name,
      status: status || 'active',
      license_total: licenseTotal || 0,
      license_start: licenseStart || new Date().toISOString(),
      license_end: licenseEnd || new Date().toISOString()
    })

    if (middleAdminError) throw middleAdminError

    return new Response(JSON.stringify({ success: true, user: authData.user }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
