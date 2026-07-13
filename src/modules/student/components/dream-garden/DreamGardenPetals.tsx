// 꿈의 정원 배경 위에 아주 작고 은은한 "꽃비"가 내리는 효과.
//
// 설계 의도
// - 단일 <canvas> 1개로 가볍게 구현 (DOM 파티클을 다수 만들지 않음 → repaint/합성 비용 최소)
// - pointer-events:none → 아이템 클릭·드래그·자동배치·버튼 등 모든 상호작용 간섭 없음
// - z-index 25 (.dream-garden-petals): 배경(1)·정원 아이템(20) 위, 좌측 정보 패널(35)·토스트(50)·편집 팝오버(150) 아래
//   → 정원 장면 위로 꽃잎이 흩날리되, 주요 텍스트·컨트롤 가독성은 그대로 유지
// - prefers-reduced-motion 환경에서는 애니메이션을 비활성화(정지) → 멀미/피로 예방
// - 탭이 백그라운드로 가면 rAF를 멈춰 CPU/GPU 절약
// - 뷰포트 너비에 비례해 꽃잎 수를 조절(데스크톱/태블릿/모바일 대응), 밀도는 낮게 유지
import { useEffect, useRef } from 'react'

// 동화풍 정원에 어울리는 은은한 색 묶음 (분홍·연노랑·연하늘·흰색 계열).
const PETAL_COLORS = [
  '#fce7f3', // 연분홍
  '#fbcfe8', // 분홍
  '#f5d0fe', // 연보라분홍
  '#fde68a', // 연노랑
  '#dbeafe', // 연하늘
  '#ffffff', // 흰색
]

type Petal = {
  baseX: number // 흔들림 중심 x (좌표)
  x: number // 이번 프레임 렌더링 위치 x (baseX + sin offset)
  y: number
  size: number // 꽃잎 장축 반지름(px) — 매우 작게
  speedY: number // 낙하 속도(px/frame@60fps 기준, dt로 보정)
  swayAmp: number // 좌우 흔들림 폭(px)
  swayFreq: number // 흔들림 각속도(rad/ms)
  swayPhase: number // 위상 오프셋 → 자연스러운 랜덤성
  rotation: number // 현재 회전각(rad)
  rotSpeed: number // 회전 속도(rad/frame)
  color: string
  alpha: number // 은은함
  shape: number // 0: 꽃잎(타원), 1: 꽃가루(작은 원)
}

function createPetal(width: number, height: number, atTop: boolean): Petal {
  // 크기 매우 작게 유지: 장축 반지름 2~6px (지름 4~12px).
  const size = 2 + Math.random() * 4
  return {
    baseX: Math.random() * width,
    x: 0,
    y: atTop ? -size - Math.random() * 60 : Math.random() * height,
    size,
    // 느린 낙하. 약간씩 속도를 달리해 자연스러운 층이 생기도록.
    speedY: 0.18 + Math.random() * 0.4,
    swayAmp: 5 + Math.random() * 16,
    swayFreq: 0.0006 + Math.random() * 0.0012,
    swayPhase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.015,
    color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
    alpha: 0.35 + Math.random() * 0.4,
    shape: Math.random() < 0.78 ? 0 : 1,
  }
}

// 뷰포트 너비에 비례한 꽃잎 수. 밀도는 낮게 — 가로 1000px 기준 약 16개.
// 최소 6, 최대 26으로 묶어 저사양/대화면 모두 무리 없게.
function computeCount(width: number): number {
  const base = Math.round((width / 1000) * 16)
  return Math.max(6, Math.min(26, base))
}

export default function DreamGardenPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    // prefers-reduced-motion 환경에서는 효과를 비활성화한다.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    let width = 0
    let height = 0
    let petals: Petal[] = []
    let rafId = 0
    let running = true
    let lastTs = 0

    const setup = () => {
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      // devicePixelRatio는 2로 캡 — 고DPI에서도 선명하되 비용을 억제.
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = computeCount(width)
      petals = []
      for (let i = 0; i < count; i++) {
        petals.push(createPetal(width, height, false))
      }
    }

    const drawPetal = (p: Petal) => {
      ctx.save()
      ctx.globalAlpha = p.alpha
      ctx.fillStyle = p.color
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      if (p.shape === 0) {
        // 꽃잎: 얇은 타원 형태.
        ctx.beginPath()
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // 꽃가루: 아주 작은 둥근 점.
        ctx.beginPath()
        ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }

    const step = (ts: number) => {
      if (!running) return
      if (!lastTs) lastTs = ts
      // 프레임 간격 보정(60fps 기준 1). 탭 복귀 후 과도한 이동을 막기 상한 2.5.
      const dt = Math.min(2.5, (ts - lastTs) / (1000 / 60))
      lastTs = ts

      ctx.clearRect(0, 0, width, height)

      for (const p of petals) {
        p.y += p.speedY * dt
        p.rotation += p.rotSpeed * dt
        // baseX를 중심으로 sin 좌우 흔들림. 옆으로 빠져나가지 않아 별도 랩핑 불필요.
        p.x = p.baseX + Math.sin(ts * p.swayFreq + p.swayPhase) * p.swayAmp

        // 아래로 완전히 벗어나면 맨 위에서 새 꽃잎처럼 재생성.
        if (p.y - p.size > height) {
          Object.assign(p, createPetal(width, height, true))
        }

        drawPetal(p)
      }

      rafId = requestAnimationFrame(step)
    }

    setup()
    rafId = requestAnimationFrame(step)

    // 리사이즈 대응(디바운스). 밀도/캔버스 크기를 다시 맞춘다.
    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(setup, 150)
    })
    ro.observe(canvas)

    // 탭이 숨겨지면 애니메이션 정지 → CPU/GPU 절약. 복귀 시 재개.
    const onVisibility = () => {
      if (document.hidden) {
        running = false
        cancelAnimationFrame(rafId)
        lastTs = 0
      } else if (!running) {
        running = true
        lastTs = 0
        rafId = requestAnimationFrame(step)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    // 런타임 중 reduced-motion이 켜지면 즉시 정지·화면 비움.
    const onMotionChange = () => {
      if (reducedMotion.matches) {
        running = false
        cancelAnimationFrame(rafId)
        ctx.clearRect(0, 0, width, height)
      }
    }
    reducedMotion.addEventListener('change', onMotionChange)

    return () => {
      running = false
      cancelAnimationFrame(rafId)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      reducedMotion.removeEventListener('change', onMotionChange)
      window.clearTimeout(resizeTimer)
    }
  }, [])

  return <canvas ref={canvasRef} className="dream-garden-petals" aria-hidden="true" />
}
