// 공개 체험(데모) 자동 로그인 Edge Function.
//
// 책임: role('student'|'teacher') 만 받아 → 서버 환경변수에 저장된 데모 계정 자격증명으로
//       signInWithPassword 수행 → access_token/refresh_token 을 클라이언트에 반환.
//       클라이언트는 supabase.auth.setSession(...) 으로 세션을 확립한다.
//
// 보안:
//   - 비밀번호는 Deno.env(Secret)에만 존재. 프런트 번들/응답/로그에 절대 노출 안 함.
//   - 임의 이메일/비밀번호 입력은 허용하지 않는다(role 만 허용).
//   - DEMO_* 자격증명이 실제 데모 계정(is_demo=true, 역할 일치)인지 서버에서 재확인(설정 오류 방어).
//   - IP+role+1시간 버킷 요청 제한(demo_login_rate_limits). 비정상 반복 호출 차단.
//   - 오류 응답은 친절한 한국어 메시지만. 내부 오류/토큰/비밀번호는 로그에도 출력하지 않는다.
//
// verify_jwt=false (공개 엔드포인트). config.toml 참고.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'

const TAG = 'demo-login'
const MAX_LOGINS_PER_HOUR = 30

const ROLE_REDIRECT: Record<string, string> = {
  student: '/student/mypage',
  teacher: '/admin/lms/classes',
}

const DEMO_CREDS: Record<string, { emailEnv: string; passwordEnv: string; role: string }> = {
  student: { emailEnv: 'DEMO_STUDENT_EMAIL', passwordEnv: 'DEMO_STUDENT_PASSWORD', role: 'student' },
  teacher: { emailEnv: 'DEMO_TEACHER_EMAIL', passwordEnv: 'DEMO_TEACHER_PASSWORD', role: 'teacher' },
}

function log(stage: string, fields: Record<string, unknown> = {}) {
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (/key|token|password|secret|authorization|email/i.test(k)) continue
    safe[k] = v
  }
  console.log([`[${TAG}]`, stage, ...Object.entries(safe).map(([k, v]) => `${k}=${v}`)].join(' | '))
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify({ success: true, ...body }), { headers: jsonHeaders, status: 200 })
const fail = (message: string, status = 400) =>
  new Response(JSON.stringify({ success: false, message }), { headers: jsonHeaders, status })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('허용되지 않은 요청 방식입니다.', 405)

  try {
    const body = await req.json().catch(() => ({}))
    const role = typeof body?.role === 'string' ? body.role : ''
    if (role !== 'student' && role !== 'teacher') {
      return fail('체험할 역할을 다시 선택해 주세요.')
    }

    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || serviceKey
    if (!url || !serviceKey) {
      log('configError', { note: 'missing supabase env' })
      return fail('체험 계정에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.', 500)
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1) 요청 제한(IP+role+1시간). x-forwarded-for 가 없으면 'unknown' 으로 묶음.
    const rawIp = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown'
    const ipHash = await sha256Hex(rawIp)
    const bucketHour = new Date().toISOString().slice(0, 13) + ':00:00.000Z'
    const { data: existingRow } = await admin
      .from('demo_login_rate_limits')
      .select('count')
      .eq('ip_hash', ipHash).eq('role', role).eq('bucket_hour', bucketHour)
      .maybeSingle()
    const currentCount = existingRow?.count ?? 0
    if (currentCount >= MAX_LOGINS_PER_HOUR) {
      log('rateLimited', { role })
      return fail('체험 요청이 너무 많아요. 잠시 후 다시 시도해 주세요.', 429)
    }
    await admin.from('demo_login_rate_limits').upsert(
      { ip_hash: ipHash, role, bucket_hour: bucketHour, count: currentCount + 1 },
      { onConflict: 'ip_hash,role,bucket_hour' }
    )

    // 2) 서버 자격증명 조회(Secret).
    const cred = DEMO_CREDS[role]
    const email = Deno.env.get(cred.emailEnv)
    const password = Deno.env.get(cred.passwordEnv)
    if (!email || !password) {
      log('configError', { note: 'missing demo cred', role })
      return fail('체험 계정이 아직 준비되지 않았어요. 잠시 후 다시 시도해 주세요.', 503)
    }

    // 3) 로그인(anon 클라이언트로 signInWithPassword → 세션 토큰 획득).
    const authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError || !signInData?.session) {
      log('signInFailed', { role, msg: String(signInError?.message || '').slice(0, 60) })
      return fail('체험 계정에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.', 502)
    }
    const session = signInData.session

    // 4) defense-in-depth: 이 계정이 실제 데모 계정(is_demo=true, 역할 일치)인지 확인.
    //    Secret 이 잘못된 운영 계정을 가리키는 경우 토큰을 반환하지 않는다.
    const { data: demoProfile } = await admin
      .from('profiles')
      .select('id, role, is_demo, status')
      .eq('id', session.user.id)
      .maybeSingle()
    if (!demoProfile || demoProfile.is_demo !== true || demoProfile.role !== cred.role) {
      log('demoCheckFailed', { role, isDemo: demoProfile?.is_demo, profileRole: demoProfile?.role })
      return fail('체험 계정 설정에 문제가 있어요. 잠시 후 다시 시도해 주세요.', 503)
    }
    if (demoProfile.status && ['suspended', 'deleted', 'inactive'].includes(demoProfile.status)) {
      log('demoInactive', { role, status: demoProfile.status })
      return fail('체험 계정이 일시적으로 사용할 수 없어요. 잠시 후 다시 시도해 주세요.', 503)
    }

    log('ok', { role, uid: String(session.user.id).slice(0, 8) })
    return ok({
      role,
      redirectTo: ROLE_REDIRECT[role],
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
      },
    })
  } catch (err) {
    log('unhandled', { msg: String((err as Error)?.message || '').slice(0, 80) })
    return fail('체험을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.', 500)
  }
})
