/**
 * PWA 강제 자동 업데이트 — "새 배포 후에도 사용자 브라우저가 구 버전(구 UI)을 계속 보여주는"
 * 현상을 근본적으로 해결한다.
 *
 * 이 모듈이 보장하는 것 (사용자 요구사항 #10 반영):
 *  1. 새 배포 감지          — registerSW 의 onNeedRefresh 콜백
 *  2. 서비스워커 즉시 업데이트 — updateSW(true) 로 대기 중 SW 에게 SKIP_WAITING 전파
 *  3. 오래된 캐시 삭제       — Workbox cleanupOutdatedCaches(vite.config)
 *  4. 새 버전 적용 후 자동 새로고침 — vite-plugin-pwa 가 controllerchange 시 자동 reload
 *  5. 무한 새로고침 방지      — 직전 리로드 후 쿨다운 이내 재발생 시 reload 생략
 */
/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'

const RELOAD_FLAG_KEY = '__pwa_auto_reload_at__'
const RELOAD_COOLDOWN_MS = 30_000

function shouldSkipReload(): boolean {
  try {
    const prev = sessionStorage.getItem(RELOAD_FLAG_KEY)
    if (!prev) return false
    const age = Date.now() - Number(prev)
    return Number.isFinite(age) && age < RELOAD_COOLDOWN_MS
  } catch {
    return true // sessionStorage 접근 불가 상황에서는 리로드하지 않는다(안전)
  }
}

function markReloaded(): void {
  try {
    sessionStorage.setItem(RELOAD_FLAG_KEY, String(Date.now()))
  } catch {
    /* no-op */
  }
}

/**
 * PWA 자동 업데이트를 등록한다. main.tsx 에서 앱 진입 시 1회 호출한다.
 */
export function registerPwaAutoUpdate(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return

  try {
    // 이미 쿨다운 상태라면 서비스워커 등록 및 업데이트 진행을 무시하여 무한루프 방지
    if (shouldSkipReload()) {
      return
    }
  } catch {}

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // 새 서비스워커 대기 중 감지 (updatefound -> installed)
      if (shouldSkipReload()) return
      markReloaded()
      // updateSW(true)는 서비스워커에 { type: 'SKIP_WAITING' } 메시지를 보내고,
      // 새 워커가 활성화(controllerchange)되면 자동으로 페이지를 reload 한다.
      updateSW(true)
    },
    onOfflineReady() {
      // 오프라인 준비 완료
    }
  })
}
