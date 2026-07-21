// 공개 체험(데모) 세션 상태를 localStorage 로 관리하는 헬퍼.
// - 실제 인증은 Supabase 세션(profile.is_demo)이 단일 진실 원천.
// - localStorage 플래그는 UI(배너/온보딩 표시, 체험 종료) 보조용으로만 사용.
//   프로필이 데모가 아니면 이 플래그는 무시된다.

const ROLE_KEY = 'toonschool_demo_role'
const ONBOARDING_KEY = 'toonschool_demo_onboarding_dismissed'

export type DemoRole = 'student' | 'teacher'

export function isDemoLoginEnabled(): boolean {
  // 데모 자동 로그인 기능 on/off (운영 도메인에서만 켜는 것을 권장).
  // 기본값 false. Vercel env VITE_DEMO_LOGIN_ENABLED=true 로 켠다.
  return (import.meta.env.VITE_DEMO_LOGIN_ENABLED ?? 'false') === 'true'
}

export function setDemoSessionRole(role: DemoRole) {
  try {
    localStorage.setItem(ROLE_KEY, role)
  } catch {
    /* ignore */
  }
}

export function getDemoSessionRole(): DemoRole | null {
  try {
    const v = localStorage.getItem(ROLE_KEY)
    return v === 'student' || v === 'teacher' ? v : null
  } catch {
    return null
  }
}

export function clearDemoSession() {
  try {
    localStorage.removeItem(ROLE_KEY)
  } catch {
    /* ignore */
  }
}

// 역할별 체험 시작 안내 모달의 "오늘 그만 보기" 상태.
export function isDemoOnboardingDismissed(role: DemoRole): boolean {
  try {
    return localStorage.getItem(`${ONBOARDING_KEY}_${role}`) === '1'
  } catch {
    return false
  }
}

export function dismissDemoOnboarding(role: DemoRole) {
  try {
    localStorage.setItem(`${ONBOARDING_KEY}_${role}`, '1')
  } catch {
    /* ignore */
  }
}
