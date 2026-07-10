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

const rollback = async (label: string, action: () => Promise<unknown>) => {
  try {
    await action()
  } catch (error) {
    console.error(`[create-student] rollback failed: ${label}`, error)
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
      throw new RequestError('관리자 로그인이 만료되었습니다.', 401)
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('id, role, organization_id, center_id')
      .eq('id', callerUser.id)
      .single()

    if (callerProfileError || !callerProfile) {
      console.error('[create-student] caller profile fetch error:', callerProfileError)
      throw new RequestError('관리자 권한 정보를 확인할 수 없습니다.', 403)
    }

    // 선생님 또는 관리자만 학생을 생성할 수 있음
    if (!['teacher', 'org_admin', 'super_admin'].includes(callerProfile.role)) {
      throw new RequestError('학생 계정을 생성할 권한이 없습니다.', 403)
    }

    const body = await req.json()
    const loginId = typeof body.loginId === 'string' ? body.loginId.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const classId = body.classId || ''
    const className = body.className || ''
    const grade = body.grade || 1
    const number = body.number || 1
    
    // 학생은 내부 가상 이메일을 사용
    const cleanEmail = `${loginId}@student.toonschool.local`

    if (!name) throw new RequestError('이름을 입력해 주세요.')
    if (!loginId) throw new RequestError('아이디를 입력해 주세요.')
    if (!password) throw new RequestError('비밀번호를 입력해 주세요.')
    if (password.length < 4) throw new RequestError('비밀번호는 4자 이상이어야 합니다.')

    const organizationId = callerProfile.organization_id
    const centerId = callerProfile.center_id ?? null
    if (!organizationId) {
      throw new RequestError('기관 정보가 연결되지 않았습니다.', 400)
    }

    // 이메일(아이디) 중복 체크
    const { data: existingProfiles, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1)

    if (profileCheckError) {
      console.error('[create-student] profile check error:', profileCheckError)
      throw new RequestError('중복 확인 중 오류가 발생했습니다.', 500)
    }

    if (existingProfiles && existingProfiles.length > 0) {
      throw new RequestError('이미 사용 중인 아이디입니다.', 409)
    }

    let createdAuthUserId: string | null = null
    let profileCreated = false

    // Auth 계정 생성
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'student',
      },
    })

    if (authError || !authData.user) {
      console.error('[create-student] auth create error:', authError)
      const isDuplicate = authError?.message?.toLowerCase().includes('already') || authError?.message?.toLowerCase().includes('registered')
      throw new RequestError(
        isDuplicate ? '이미 사용 중인 아이디입니다.' : '계정 생성 중 오류가 발생했습니다.',
        isDuplicate ? 409 : 500
      )
    }

    createdAuthUserId = authData.user.id

    // profiles 추가
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: createdAuthUserId,
        email: cleanEmail,
        name,
        role: 'student',
        organization_id: organizationId,
        center_id: centerId,
        status: 'active',
        plan_type: 'free',
        monthly_quota: 0,
      })

    if (profileError) {
      console.error('[create-student] profile insert error (raw):', JSON.stringify(profileError, null, 2))
      await rollback('delete auth user after profile insert failure', () =>
        adminClient.auth.admin.deleteUser(createdAuthUserId as string)
      )
      throw new RequestError('프로필 저장 중 오류가 발생했습니다.', 500)
    }

    profileCreated = true

    // UUID 유효성 검사 (프론트에서 mock 데이터를 보낼 경우 대비)
    const isValidUUID = (uuid: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
    const validClassId = classId && isValidUUID(classId) ? classId : null

    // students 추가 (LMS에서 조회하기 위함)
    const { error: studentError } = await adminClient
      .from('students')
      .insert({
        id: createdAuthUserId,
        name,
        login_id: loginId,
        temp_password: password, 
        class_id: validClassId,
        grade: `${grade}\uD559\uB144`,
        center_id: centerId,
        organization_id: organizationId,
        status: 'active'
      })

    if (studentError) {
      console.error('[create-student] student insert error (raw):', JSON.stringify(studentError, null, 2))
      if (profileCreated) {
        await rollback('delete profile after student insert failure', () =>
          adminClient.from('profiles').delete().eq('id', createdAuthUserId as string)
        )
      }
      await rollback('delete auth user after student insert failure', () =>
        adminClient.auth.admin.deleteUser(createdAuthUserId as string)
      )
      throw new RequestError('학생 계정 저장에 실패했습니다.', 500)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        student: {
          id: createdAuthUserId,
          name,
          loginId,
          password,
          classId,
          className,
          grade,
          number
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    const status = error instanceof RequestError ? error.status : 400
    const message = error?.message || '학생 계정 생성 중 오류가 발생했습니다.'

    return new Response(
      JSON.stringify({ error: message, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})
