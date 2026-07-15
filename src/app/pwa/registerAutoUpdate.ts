/**
 * PWA 강제 자동 업데이트 — "새 배포 후에도 사용자 브라우저가 구 버전(구 UI)을 계속 보여주는"
 * 현상을 근본적으로 해결한다.
 *
 * 배경(실제로 발생한 장애):
 *  - vite-plugin-pwa 의 registerType:'autoUpdate' 는 새 서비스워커(SW)를 백그라운드에서
 *    갱신(skipWaiting)하지만, **페이지를 자동 새로고침하지 않는다.**
 *  - 그래서 새 배포 후에도 기존 탭/설치된 PWA 는 구 캐시(구 컴포넌트·구 레이아웃)를
 *    계속 렌더링한다. 운영 사이트 코드는 이미 파스텔 16:9 로 정상인데도 사용자 화면만
 *    구 버전으로 보이는 현상이 바로 이것이다.
 *
 * 이 모듈이 보장하는 것 (사용자 요구사항 #10 반영):
 *  1. 새 배포 감지          — navigator.serviceWorker 'updatefound'
 *  2. 서비스워커 즉시 업데이트 — 대기 중 SW 에게 SKIP_WAITING 전파
 *  3. 오래된 캐시 삭제       — Workbox cleanupOutdatedCaches(vite.config) + 활성화 즉시 제어
 *  4. 새 버전 적용 후 자동 새로고침 — 'controllerchange' 시 1회 reload
 *  5. 무한 새로고침 방지      — (a) 기존 사용자의 "업데이트"일 때만 리로드,
 *                              (b) 직전 리로드 후 쿨다운 이내 재발생 시 reload 생략
 *
 * 핵심 분기(무한/불필요 리로드 방지):
 *  - 첫 방문(controller 없음): SW 가 처음 설치되며 controllerchange 가 발생하지만
 *    "업데이트"가 아니므로 리로드하지 않는다.
 *  - 기존 사용자의 업데이트(controller 있음 + 새 SW 도착): 1회만 리로드.
 *
 * 주의: dev(vite 개발 서버)에서는 동작하지 않는다(SW 미생성). 프로덕션 빌드에서만 동작.
 */
const RELOAD_FLAG_KEY = '__pwa_auto_reload_at__'
// 비정상 다중 발생(예: SW 버그, 연속 배포) 시의 안전망. 같은 세션에서 직전 리로드 후
// 이 시간 이내에 다시 리로드가 시도되면 생략한다.
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

/** 새 SW 가 활성화되면 페이지를 1회 새로고침한다(무한 새로고침 방지 포함). */
function reloadOnce(): void {
  if (shouldSkipReload()) return
  markReloaded()
  window.location.reload()
}

/**
 * PWA 자동 업데이트를 등록한다. main.tsx 에서 앱 진입 시 1회 호출한다.
 * 프로덕션에서만 동작하며, 실패해도 앱 자체 동작에는 영향을 주지 않는다(캐치 후 무시).
 */
export function registerPwaAutoUpdate(): void {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  // dev 서버에서는 SW 가 생성되지 않으므로 등록을 건너뛴다.
  if (import.meta.env.DEV) return

  // 페이지 로드 시 이미 SW 가 제어하고 있었는지.
  // 기존 사용자(컨트롤러 있음)가 새 SW 로 교체되는 경우에만 리로드가 필요하다.
  const hadControllerAtLoad = !!navigator.serviceWorker.controller
  // updatefound 로 "실제로 새 버전이 도착한" 경우에만 켜는 플래그.
  let newVersionArrived = false

  // (4) 새 SW 가 제어권을 잡으면(controllerchange), 기존 사용자의 업데이트인 경우 1회 리로드.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtLoad || !newVersionArrived) return
    reloadOnce()
  })

  // (1)(2) SW 등록 + 대기 중 새 SW 가 있으면 즉시 SKIP_WAITING 전파.
  void navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      const activateWaiting = () => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }
      activateWaiting()
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') {
            // 새 SW 가 대기 상태(installed)에 도달.
            // 이미 컨트롤러가 있었다면(기존 사용자) 이것은 "새 버전 도착"이다.
            if (navigator.serviceWorker.controller) {
              newVersionArrived = true
            }
            activateWaiting()
          }
        })
      })
    })
    .catch(() => {
      // SW 등록 실패는 앱 기능에 치명적이지 않으므로 무시한다.
    })
}
