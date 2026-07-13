// 꿈의 정원 배경 위로 "꽃비"가 내리는 효과.
//
// 설계 의도
// - 단일 <canvas> 1개로 가볍게 구현 (DOM 파티클을 다수 만들지 않음 → repaint/합성 비용 최소)
// - pointer-events:none → 아이템 클릭·드래그·자동배치·버튼 등 모든 상호작용 간섭 없음
// - z-index 25 (.dream-garden-petals): 배경(1)·정원 아이템(20) 위, 좌측 정보 패널(35)·토스트(50)·편집 팝오버(150) 아래
//   → 정원 장면 위로 꽃잎이 흩날리되, 주요 텍스트·컨트롤 가독성은 그대로 유지
// - prefers-reduced-motion 환경에서는 애니메이션을 비활성화(정지) → 멀미/피로 예방
// - 탭이 백그라운드로 가면 rAF를 멈춰 CPU/GPU 절약
// - 뷰포트 너비에 비례해 꽃잎 수를 조절(데스크톱/태블릿/모바일 대응)
//
// 가시성 강화(500%+)
// - 파티클 수를 대폭 늘리고(데스크톱 기존 26 → 최대 140), 3단계 티어로 입체감 부여
//   · 미세 꽃가루(다수): 아주 작은 점, 낮은 투명도 — 배경 질감 역할
//   · 일반 꽃잎(다수): 작은 타원, 중간 투명도 — 꽃비의 주축
//   · 전경 꽃잎(소수): 약간 더 또렷한 타원, 높은 투명도 — 시선을 끄는 포인트
// - 밝은 정원 배경에 묻히지 않도록 색은 300레벨 파스텔(동화풍 유지) + 투명도 범위 상향
// - 속도·흔들림 폭/주기에 폭넓은 랜덤성 → 자연스러운 층과 바람 느낌
import { useEffect, useRef } from 'react'

// 동화풍 정원에 어울리되 밝은 배경 위에서도 또렷이 보이는 파스텔 색 묶음.
// 300레벨(분홍·앰버·하늘·보라)은 가시성 담당, 200레벨/흰색은 은은함 담당.
const PETAL_COLORS = [
  '#f9a8d4', // 분홍 (rose-300)
  '#fbcfe8', // 연분홍 (pink-200)
  '#fda4af', // 살구분홍 (rose-300 계열)
  '#fcd34d', // 연노랑/앰버 (amber-300)
  '#fde68a', // 옅은 노랑 (amber-200)
  '#93c5fd', // 연하늘 (blue-300)
  '#bfdbfe', // 옅은 하늘 (blue-200)
  '#c4b5fd', // 연보라 (violet-300)
  '#ffffff', // 흰색
]

type Petal = {
  baseX: number // 흔들림 중심 x (좌표)
  x: number // 이번 프레임 렌더링 위치 x (baseX + sin offset)
  y: number
  size: number // 꽃잎 장축 반지름(px)
  speedY: number // 낙하 속도(px/frame@60fps 기준, dt로 보정)
  swayAmp: number // 좌우 흔들림 폭(px)
  swayFreq: number // 흔들림 각속도(rad/ms)
  swayPhase: number // 위상 오프셋 → 자연스러운 랜덤성
  rotation: number // 현재 회전각(rad)
  rotSpeed: number // 회전 속도(rad/frame)
  color: string
  alpha: number // 투명도
  shape: number // 0: 꽃잎(타원), 1: 꽃가루(작은 원)
}

// 꽃잎 1개 생성. tier별로 크기·투명도·속도·흔들림을 차등화해 입체감을 준다.
// atTop=true면 화면 위쪽에서 새로 들어오는 꽃잎(재생성), false면 초기 배치(전체 화면 분산).
function createPetal(width: number, height: number, atTop: boolean): Petal {
  // 종류 비율: 미세 꽃가루 45% / 일반 꽃잎 45% / 전경 꽃잎 10%.
  const r = Math.random()
  let size: number
  let alpha: number
  let speedY: number
  let swayAmp: number
  let shape: number

  if (r < 0.45) {
    // 미세 꽃가루: 아주 작은 둥근 점, 낮은 투명도, 느린 부유.
    size = 1 + Math.random() * 1.5
    alpha = 0.35 + Math.random() * 0.25
    speedY = 0.2 + Math.random() * 0.35
    swayAmp = 3 + Math.random() * 8
    shape = 1
  } else if (r < 0.9) {
    // 일반 꽃잎: 작은 타원, 중간 투명도, 보통 속도.
    size = 2.5 + Math.random() * 2.5
    alpha = 0.6 + Math.random() * 0.22
    speedY = 0.45 + Math.random() * 0.4
    swayAmp = 8 + Math.random() * 18
    shape = 0
  } else {
    // 전경 꽃잎: 약간 더 또렷한 타원, 높은 투명도, 살짝 빠른 속도.
    size = 4 + Math.random() * 3.5
    alpha = 0.85 + Math.random() * 0.13
    speedY = 0.7 + Math.random() * 0.5
    swayAmp = 12 + Math.random() * 22
    shape = 0
  }

  // 약 15%는 거의 수직으로 낙하(흔들림 최소) → 움직임 다양성.
  if (Math.random() < 0.15) swayAmp *= 0.15

  return {
    baseX: Math.random() * width,
    x: 0,
    // 초기 배치는 화면 전체 높이에 고르게 → 페이지 진입 즉시 꽃잎이 보임.
    // 재생성(atTop)은 화면 위쪽에서 랜덤 오프셋과 함께 들어옴.
    y: atTop ? -size - Math.random() * 80 : Math.random() * height,
    size,
    speedY,
    swayAmp,
    swayFreq: 0.0004 + Math.random() * 0.0014,
    swayPhase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
    alpha,
    shape,
  }
}

// 뷰포트 너비에 비례한 꽃잎 수. 가로 1000px 기준 약 75개.
// 반응형: 모바일 ~30, 태블릿 ~58, 데스크톱 ~140 (기존 대비 약 5배).
function computeCount(width: number): number {
  const base = Math.round((width / 1000) * 75)
  return Math.max(18, Math.min(140, base))
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
        // 꽃가루: 아주 작은 둥근 점(렌더링 비용이 가장 낮은 단순 원).
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
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

        // 아래로 완전히 벗어나면 맨 위에서 새 꽃잎처럼 재생성 → 꽃비가 끊기지 않음.
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
