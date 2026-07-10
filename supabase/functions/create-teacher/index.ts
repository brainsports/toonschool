import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const PASSWORD_MIN_LENGTH = 6

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

const isValidDateValue = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

const rollback = async (label: string, action: () => Promise<unknown>) => {
  try {
    await action()
  } catch (error) {
    console.error(`[create-teacher] rollback failed: ${label}`, error)
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
      throw new RequestError('로그인 정보가 유효하지 않습니다.', 401)
    }

    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from('profiles')
      .select('id, role, organization_id')
      .eq('id', callerUser.id)
      .single()

    if (callerProfileError || !callerProfile) {
      throw new RequestError('호출자 권한 정보를 확인할 수 없습니다.', 403)
    }

    if (callerProfile.role !== 'super_admin' && callerProfile.role !== 'org_admin') {
      throw new RequestError('선생님 계정을 생성할 권한이 없습니다.', 403)
    }

    const body = await req.json()
    const cleanEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const requestedOrgId = typeof body.organization_id === 'string' ? body.organization_id.trim() : ''
    const licenseTotalValue = body.license_count ?? body.licenseTotal ?? body.initial_licenses ?? 0
    const licenseTotal = Number(licenseTotalValue)
    const licenseStart = body.license_start_date ?? body.licenseStart ?? null
    const licenseEnd = body.license_end_date ?? body.licenseEnd ?? null

    if (!name) {
      throw new RequestError('이름을 입력해 주세요.')
    }

    if (!cleanEmail) {
      throw new RequestError('이메일을 입력해 주세요.')
    }

    if (!password) {
      throw new RequestError('임시 비밀번호를 입력해 주세요.')
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new RequestError(`임시 비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
    }

    if (!Number.isInteger(licenseTotal) || licenseTotal < 0) {
      throw new RequestError('이용권 수는 0 이상의 정수여야 합니다.')
    }

    if (licenseStart && !isValidDateValue(licenseStart)) {
      throw new RequestError('이용권 시작일이 올바른 날짜가 아닙니다.')
    }

    if (licenseEnd && !isValidDateValue(licenseEnd)) {
      throw new RequestError('이용권 종료일이 올바른 날짜가 아닙니다.')
    }

    if (licenseStart && licenseEnd && new Date(licenseEnd) < new Date(licenseStart)) {
      throw new RequestError('이용권 종료일은 시작일보다 빠를 수 없습니다.')
    }

    let organizationId = requestedOrgId

    if (callerProfile.role === 'org_admin') {
      if (!callerProfile.organization_id) {
        throw new RequestError('기관 정보가 없는 관리자 계정입니다.', 403)
      }

      if (requestedOrgId && requestedOrgId !== callerProfile.organization_id) {
        throw new RequestError('다른 기관에는 선생님을 생성할 수 없습니다.', 403)
      }

      organizationId = callerProfile.organization_id
    }

    if (!organizationId) {
      throw new RequestError('소속 기관 정보가 필요합니다.')
    }

    const { data: existingProfiles, error: profileCheckError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .limit(1)

    if (profileCheckError) {
      throw new RequestError('이메일 중복 확인 중 오류가 발생했습니다.', 500)
    }

    if (existingProfiles && existingProfiles.length > 0) {
      throw new RequestError('이미 가입된 이메일입니다. 다른 이메일을 입력해 주세요.', 409)
    }

    const { data: existingAuthUserId, error: authLookupError } = await adminClient.rpc('get_auth_user_id_by_email', {
      p_email: cleanEmail,
    })

    if (!authLookupError && existingAuthUserId) {
      throw new RequestError('이미 가입된 이메일입니다. 다른 이메일을 입력해 주세요.', 409)
    }

    let createdAuthUserId: string | null = null
    let profileCreated = false

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'teacher',
      },
    })

    if (authError || !authData.user) {
      const isDuplicate = authError?.message?.toLowerCase().includes('already') || authError?.message?.toLowerCase().includes('registered')
      throw new RequestError(
        isDuplicate ? '이미 가입된 이메일입니다. 다른 이메일을 입력해 주세요.' : '계정 생성 중 오류가 발생했습니다.',
        isDuplicate ? 409 : 500
      )
    }

    createdAuthUserId = authData.user.id

    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: createdAuthUserId,
        email: cleanEmail,
        name,
        role: 'teacher',
        organization_id: organizationId,
        status: body.status || 'active',
        plan_type: 'free',
        monthly_quota: 0,
      })

    if (profileError) {
      await rollback('delete auth user after profile insert failure', () =>
        adminClient.auth.admin.deleteUser(createdAuthUserId as string)
      )
      throw new RequestError('프로필 저장 중 오류가 발생했습니다.', 500)
    }

    profileCreated = true

    if (licenseTotal > 0 || licenseStart || licenseEnd) {
      const { error: allocError } = await adminClient
        .from('license_allocations')
        .insert({
          organization_id: organizationId,
          from_user_id: callerUser.id,
          to_user_id: createdAuthUserId,
          quantity: licenseTotal,
          license_start_date: licenseStart || null,
          license_end_date: licenseEnd || null,
        })

      if (allocError) {
        if (profileCreated) {
          await rollback('delete profile after license allocation failure', () =>
            adminClient.from('profiles').delete().eq('id', createdAuthUserId as string)
          )
        }
        await rollback('delete auth user after license allocation failure', () =>
          adminClient.auth.admin.deleteUser(createdAuthUserId as string)
        )
        throw new RequestError('이용권 배정 중 오류가 발생했습니다.', 500)
      }
    }

    return new Response(
      JSON.stringify({ success: true, userId: createdAuthUserId, role: 'teacher', organization_id: organizationId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    const status = error instanceof RequestError ? error.status : 400
    const message = error?.message || '선생님 계정 생성 중 오류가 발생했습니다.'

    return new Response(
      JSON.stringify({ error: message, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
    )
  }
})
