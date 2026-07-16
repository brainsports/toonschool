/**
 * 툰스쿨 플립북 — 책장 넘김 효과음(종이 스치는 소리) 훅.
 *
 * 설계 의도(사용자 요구 반영):
 *  - "실제 종이가 사각거리며 넘어가는 느낌"의 짧고 부드러운 효과음.
 *  - 저작권 문제가 없도록 오디오 파일을 쓰지 않고 Web Audio API 로 **합성**한다.
 *    → 파일 404/로딩 지연/저작권 이슈가 원천적으로 없다.
 *  - AudioContext(비용이 큰 단일 객체)는 최초 재생 시 1회만 생성해 재사용(페이지마다 새로 만들지 않음).
 *  - 브라우저 자동재생 정책: 실제 사용자 조작(버튼/키보드 클릭) 안에서 처음 호출되므로
 *    AudioContext 생성 + resume() 이 허용된다. resume()/재생 실패해도 조용히 무시(페이지 이동과 무관).
 *  - 음소거 상태는 localStorage 에 저장(기본값 = 소리 켜짐).
 *
 * 학생 뷰어(StudentComicViewerPage)와 공유 뷰어(SharedComicViewerPage) 양쪽에서 사용한다.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'toonschool:viewer:pageTurnSound'

function readStoredEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    // '0' 만 끄기. 그 외(미설정 첫 방문 포함) = 켜짐(기본값).
    return v !== '0'
  } catch {
    return true
  }
}

export interface PageTurnSoundApi {
  /** 책장 넘김 효과음을 재생한다. 음소거 상태거나 오디오를 쓸 수 없으면 아무 일도 일어나지 않는다. */
  playPageTurn: () => void
  /** 효과음 사용 여부. */
  soundEnabled: boolean
  /** 효과음 켜기/끄기 토글. localStorage 에 반영된다. */
  toggleSound: () => void
}

export function usePageTurnSound(): PageTurnSoundApi {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(readStoredEnabled)
  const ctxRef = useRef<AudioContext | null>(null)

  // 설정 유지
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, soundEnabled ? '1' : '0')
    } catch {
      /* 저장 실패는 무시(시크릿 모드 등) */
    }
  }, [soundEnabled])

  const toggleSound = useCallback(() => setSoundEnabled((v) => !v), [])

  /**
   * AudioContext 를(단일 객체로) 확보한다. 최초 호출 시 생성하고, 일시정지면 resume 한다.
 *  오류 시 null 반환(효과음은 기능에 영향을 주지 않으므로 조용히 실패).
   */
  const ensureCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    try {
      if (!ctxRef.current) {
        const AC: typeof AudioContext | undefined =
          window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AC) return null
        ctxRef.current = new AC()
      }
      const ctx = ctxRef.current
      if (ctx.state === 'suspended') {
        // 사용자 제스처 안에서 호출되므로 resume 이 허용된다. Promise 실패는 무시.
        void ctx.resume().catch(() => {})
      }
      return ctx
    } catch {
      return null
    }
  }, [])

  const playPageTurn = useCallback(() => {
    if (!soundEnabled) return
    const ctx = ensureCtx()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const dur = 0.34

      // --- 종이 스치는 소리 = 포락선(-envelope)이 빠르게 감쇠하는 필터링 노이즈 ---
      const frames = Math.max(1, Math.floor(ctx.sampleRate * dur))
      const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < frames; i++) {
        const t = i / frames
        // 앞쪽에서 살짝 일어나다 곧바로 부드럽게 사라지는 포락선.
        const env = Math.pow(1 - t, 1.5) * Math.min(1, t * 18)
        data[i] = (Math.random() * 2 - 1) * env
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      // 대역통과 필터 중심주파수를 쓸어내려 "휙" 하는 종이 넘김 느낌. 매번 미세하게 다르게.
      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.Q.value = 0.8
      const f0 = 680 + Math.random() * 220
      const f1 = 2600 + Math.random() * 700
      bandpass.frequency.setValueAtTime(f0, now)
      bandpass.frequency.exponentialRampToValueAtTime(f1, now + dur * 0.65)

      // 고역은 누르지 않게(귀에 거슬리지 않도록).
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 4300

      // 전체 음량은 낮고 부드럽게(어린이에게 부담 없는 수준).
      const gain = ctx.createGain()
      const peak = 0.15 + Math.random() * 0.04
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.018)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)

      noise.connect(bandpass)
      bandpass.connect(lowpass)
      lowpass.connect(gain)
      gain.connect(ctx.destination)
      noise.start(now)
      noise.stop(now + dur + 0.02)
    } catch {
      /* 효과음 재생 실패는 페이지 전환 기능에 영향을 주지 않는다. */
    }
  }, [soundEnabled, ensureCtx])

  // 언마운트 시 AudioContext 정리(메모리 누수 방지).
  useEffect(() => {
    const ctx = ctxRef.current
    return () => {
      try {
        void ctx?.close()
      } catch {
        /* 무시 */
      }
    }
  }, [])

  return { playPageTurn, soundEnabled, toggleSound }
}
