import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // CORS Preflight
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
    const { email, password, name, organization_id, status, licenseTotal, licenseStart, licenseEnd } = body
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password || !name || !organization_id) {
      throw new Error('이름, 이메일, 비밀번호, 소속 기관은 필수 항목입니다.')
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

    // 4. Auth 사용자 생성 (반쪽 계정 처리 포함)
    let targetUserId = null

    // 기존 Auth에 사용자가 있는지 먼저 확인 시도
    const { data: existingAuthUserId, error: rpcError } = await adminClient.rpc('get_auth_user_id_by_email', {
      p_email: cleanEmail
    })

    if (!rpcError && existingAuthUserId) {
      targetUserId = existingAuthUserId
    } else {
      // 없으면 신규 생성
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: name,
          role: 'teacher'
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

    // 5. profiles 생성 또는 upsert
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: targetUserId,
        email: cleanEmail,
        name: name,
        role: 'teacher',
        organization_id: organization_id,
        status: status || 'active',
        plan_type: 'free',
        monthly_quota: 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (profileError) {
      // 롤백 (가능하다면)
      throw new Error(`profiles 정보 저장 실패: ${profileError.message}`)
    }

    // 6. 이용권 배정
    if (licenseTotal > 0 || licenseStart || licenseEnd) {
      const { error: allocError } = await adminClient
        .from('license_allocations')
        .insert({
          organization_id: organization_id,
          to_user_id: targetUserId,
          quantity: licenseTotal || 0,
          license_start_date: licenseStart || null,
          license_end_date: licenseEnd || null
        })
      
      if (allocError) {
        console.error('[Teacher Create] License allocation error:', allocError)
        // 이용권 배정 실패를 치명적 오류로 간주하지 않고 넘길지, 아니면 예외로 던질지 결정.
        // 기존에도 에러만 로깅했으므로 유지하되 에러메시지는 클라이언트에 전달 가능하도록
        // throw new Error(`이용권 배정 정보 저장 실패: ${allocError.message}`)
      }
    }

    // 성공 반환
    return new Response(
      JSON.stringify({ success: true, userId: targetUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
