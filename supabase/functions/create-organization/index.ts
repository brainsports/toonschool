import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 서버 설정이 누락되었습니다.')
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 1. 요청한 사용자가 수퍼관리자인지 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('인증 헤더가 없습니다. 수퍼관리자만 접근 가능합니다.')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: verifyError } = await adminClient.auth.getUser(token)
    
    if (verifyError || !callerUser) {
      throw new Error('유효하지 않은 인증 토큰입니다.')
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single()

    if (callerProfileError || callerProfile.role !== 'super_admin') {
      throw new Error('수퍼관리자 권한이 필요합니다.')
    }

    // 2. 요청 데이터 파싱
    const body = await req.json()
    const { name, adminName, adminEmail, adminPassword, middleAdminId, totalLicenses, startDate, endDate } = body
    const cleanEmail = adminEmail.trim().toLowerCase()

    if (!name || !adminName || !cleanEmail || !adminPassword || !middleAdminId) {
      throw new Error('필수 정보가 누락되었습니다.')
    }

    // 3. 이메일 중복 확인 (profiles 기준)
    const { data: existingProfiles, error: checkError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('email', cleanEmail)
      
    if (checkError) {
      throw new Error('이메일 중복 확인 중 오류가 발생했습니다.')
    }
    
    if (existingProfiles && existingProfiles.length > 0) {
      throw new Error('이미 등록된 이메일입니다. 다른 이메일을 입력해 주세요.')
    }

    // 4. Auth 사용자 생성 (기관관리자)
    let targetUserId = null

    // 기존 Auth에 사용자가 있는지 먼저 확인 시도 (migration sql의 내부 함수 호출)
    const { data: existingAuthUserId, error: rpcError } = await adminClient.rpc('get_auth_user_id_by_email', {
      p_email: cleanEmail
    })

    if (!rpcError && existingAuthUserId) {
      targetUserId = existingAuthUserId
    } else {
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          name: adminName,
          role: 'org_admin'
        }
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          throw new Error('이미 가입된 Auth 계정입니다. 그러나 사용자 조회를 실패했습니다.')
        }
        throw new Error(`계정 생성 실패: ${authError.message}`)
      }
      
      targetUserId = authData.user.id
    }

    // 5. profiles 생성 (organization_id는 나중에 연결하거나 빈 값으로 먼저 생성)
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: targetUserId,
        email: cleanEmail,
        name: adminName,
        role: 'org_admin',
        status: 'active',
        plan_type: 'free',
        monthly_quota: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (profileError) {
      throw new Error(`profiles 정보 저장 실패: ${profileError.message}`)
    }

    // 6. organizations 생성
    const { data: orgData, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: name,
        middle_admin_id: middleAdminId,
        total_licenses: totalLicenses || 0,
        license_start_date: startDate || new Date().toISOString(),
        license_end_date: endDate || new Date().toISOString(),
        status: 'active'
      })
      .select('id')
      .single()

    if (orgError) {
      throw new Error(`organizations 정보 저장 실패: ${orgError.message}`)
    }

    const newOrgId = orgData.id

    // 7. profiles 에 organization_id 업데이트
    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({ organization_id: newOrgId })
      .eq('id', targetUserId)

    if (profileUpdateError) {
      throw new Error(`기관관리자 프로필에 기관 정보 연결 실패: ${profileUpdateError.message}`)
    }

    // 성공 반환
    return new Response(
      JSON.stringify({ success: true, organizationId: newOrgId, adminUserId: targetUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
