// 공개 체험(데모) 자동 로그인 서비스.
// 홈페이지 체험 버튼 → demo-login Edge Function 호출 → 서버가 데모 계정으로 세션 발급 →
// 클라이언트가 setSession 으로 세션 확립. 비밀번호는 프런트에 절대 노출되지 않는다.
import { supabase } from './supabase'
import {
  isDemoLoginEnabled,
  setDemoSessionRole,
  clearDemoSession,
  type DemoRole,
} from './demoSession'

export class DemoLoginError extends Error {}

const ROLE_REDIRECT: Record<DemoRole, string> = {
  student: '/student/mypage',
  teacher: '/admin/lms/classes',
}

type DemoLoginResponse = {
  success?: boolean
  message?: string
  redirectTo?: string
  session?: {
    access_token: string
    refresh_token: string
    expires_in?: number
  }
}

// 기존 일반 세션이 있으면 안전하게 종료한 뒤 데모 세션으로 교체한다.
// (역할 섞임 방지. 호출 측은 이미 사용자에게 전환 확인을 받았다고 가정.)
async function clearExistingSession() {
  const { data } = await supabase.auth.getSession()
  if (data.session) {
    await supabase.auth.signOut()
    clearDemoSession()
  }
}

// 지정한 역할의 데모 계정으로 자동 로그인.
// 성공 시 { redirectTo } 반환. 실패 시 DemoLoginError throw.
export async function startDemo(role: DemoRole): Promise<{ redirectTo: string }> {
  if (!isDemoLoginEnabled()) {
    throw new DemoLoginError('지금은 체험 기능이 준비 중이에요. 잠시 후 다시 시도해 주세요.')
  }

  await clearExistingSession()

  const { data, error } = await supabase.functions.invoke<DemoLoginResponse>('demo-login', {
    body: { role },
  })

  if (error || !data || data.success === false) {
    const msg = data?.message || '체험을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'
    throw new DemoLoginError(msg)
  }

  const session = data.session
  if (!session?.access_token || !session?.refresh_token) {
    throw new DemoLoginError('체험 계정에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }

  const { error: setErr } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })
  if (setErr) {
    throw new DemoLoginError('체험 계정에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }

  setDemoSessionRole(role)
  const redirectTo = data.redirectTo || ROLE_REDIRECT[role]
  return { redirectTo }
}
