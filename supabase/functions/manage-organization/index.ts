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
    const { action, orgId } = body

    if (!action || !orgId) {
      throw new Error('필수 정보(action, orgId)가 누락되었습니다.')
    }

    if (action === 'update') {
      const { name, middleAdminId, totalLicenses, startDate, endDate, adminUserId, adminName, adminEmail } = body
      const cleanEmail = adminEmail.trim().toLowerCase()

      // 1. organizations 업데이트
      const { error: orgError } = await adminClient
        .from('organizations')
        .update({
          name: name,
          middle_admin_id: middleAdminId,
          total_licenses: totalLicenses,
          license_start_date: startDate,
          license_end_date: endDate
        })
        .eq('id', orgId)

      if (orgError) {
        throw new Error(`organizations 정보 수정 실패: ${orgError.message}`)
      }

      if (adminUserId && adminEmail) {
        // 이메일 변경 확인
        const { data: existingProfile } = await adminClient.from('profiles').select('email').eq('id', adminUserId).single()
        
        if (existingProfile && existingProfile.email !== cleanEmail) {
          // 중복 확인
          const { data: checkEmail } = await adminClient.from('profiles').select('id').eq('email', cleanEmail).neq('id', adminUserId)
          if (checkEmail && checkEmail.length > 0) {
            throw new Error('이미 사용 중인 이메일입니다.')
          }

          // Auth 업데이트
          const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(adminUserId, { email: cleanEmail })
          if (authUpdateError) {
            throw new Error(`인증 이메일 수정 실패: ${authUpdateError.message}`)
          }
        }

        // profiles 업데이트
        const { error: profileUpdateError } = await adminClient
          .from('profiles')
          .update({ name: adminName, email: cleanEmail })
          .eq('id', adminUserId)

        if (profileUpdateError) {
          throw new Error(`프로필 수정 실패: ${profileUpdateError.message}`)
        }
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } else if (action === 'updateStatus') {
      const { status } = body

      // organizations 상태 변경
      const { error: orgError } = await adminClient
        .from('organizations')
        .update({ status })
        .eq('id', orgId)

      if (orgError) throw new Error(`organizations 상태 수정 실패: ${orgError.message}`)

      // 관련된 org_admin profiles 상태 변경
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ status })
        .eq('organization_id', orgId)
        .eq('role', 'org_admin')

      if (profileError) throw new Error(`기관관리자 상태 수정 실패: ${profileError.message}`)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } else if (action === 'delete') {
      // Soft delete: status를 'deleted'나 'inactive'로 변경
      const { error: orgError } = await adminClient
        .from('organizations')
        .update({ status: 'deleted' })
        .eq('id', orgId)

      if (orgError) throw new Error(`기관 삭제 실패: ${orgError.message}`)

      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ status: 'deleted' })
        .eq('organization_id', orgId)
        .eq('role', 'org_admin')

      if (profileError) throw new Error(`기관관리자 삭제 상태 수정 실패: ${profileError.message}`)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

    } else {
      throw new Error('알 수 없는 action입니다.')
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
