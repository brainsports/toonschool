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
  /** OX 퀴즈 답안 선택 직후 결과 효과음(정답=밝은 2음, 오답=부드러운 하강 2음). 음소거 시 무시. */
  playQuizResult: (isCorrect: boolean) => void
  /** "책 펼치기" 같은 최초 사용자 제스처에서 호출해 AudioContext 를 미리 생성·실행한다. 첫 넘김 소리 누락 방지. */
  primeAudio: () => void
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

  // "책 펼치기" 같은 최초 제스처에서 미리 AudioContext 를 만들어 실행한다.
  // 첫 넘김에서 맥락이 아직 실행 전이라 소리가 누락되는 것을 방지.
  const primeAudio = useCallback(() => {
    ensureCtx()
  }, [ensureCtx])

  /**
   * 종이 넘김 소리 재생.
   *  - 단일 노이즈가 아니라 짧은 노이즈 버스트 3개를 약간씩 어긋나게 겹쳐
   *    "사각사각" 종이 스치는 느낌을 낸다.
   *  - 고역통과+대역통과(2~4kHz, 종이 특유의 바스락 주파수)로 크리스피하게.
   *  - 음량은 또렷하게 들리면서도 부드러운 수준(피크 ~0.34).
   *  - ctx.currentTime 보다 살짝 뒤에 스케줄해 맥락이 실행 중이도록 여유를 둔다.
   */
  const playPageTurn = useCallback(() => {
    if (!soundEnabled) return
    const ctx = ensureCtx()
    if (!ctx) return
    try {
      const base = ctx.currentTime + 0.02
      const bursts = 3
      for (let b = 0; b < bursts; b++) {
        const start = base + b * (0.032 + Math.random() * 0.02)
        const dur = 0.07 + Math.random() * 0.045
        const frames = Math.max(1, Math.floor(ctx.sampleRate * dur))
        const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < frames; i++) {
          const tt = i / frames
          // 날카로운 어택 + 지수 감쇠(종이가 스치는 짧은 과정).
          const env = Math.min(1, tt * 45) * Math.pow(1 - tt, 2)
          data[i] = (Math.random() * 2 - 1) * env
        }
        const src = ctx.createBufferSource()
        src.buffer = buffer

        const highpass = ctx.createBiquadFilter()
        highpass.type = 'highpass'
        highpass.frequency.value = 850 + Math.random() * 250

        const bandpass = ctx.createBiquadFilter()
        bandpass.type = 'bandpass'
        bandpass.frequency.value = 2900 + Math.random() * 1200
        bandpass.Q.value = 0.7

        const gain = ctx.createGain()
        const peak = 0.34 + Math.random() * 0.06
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.004)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)

        src.connect(highpass)
        highpass.connect(bandpass)
        bandpass.connect(gain)
        gain.connect(ctx.destination)
        src.start(start)
        src.stop(start + dur + 0.02)
      }
    } catch {
      /* 효과음 재생 실패는 페이지 전환 기능에 영향을 주지 않는다. */
    }
  }, [soundEnabled, ensureCtx])

  /**
   * OX 퀴즈 결과 효과음.
   *  - 정답: 밝고 짧은 2음 상승(C5→E5) — "딩동" 느낌의 격려 사운드.
   *  - 오답: 부드럽고 짧은 2음 하강(E4→C4) — 꾸짖지 않는 차분한 안내.
   *  - 정현파(oscillator) + 짧은 ADSR 로 합성(오디오 파일 없음 → 404/저작권 이슈 없음).
   *  - 음소거이거나 AudioContext 확보 불가면 아무 일도 일어나지 않는다(퀴즈 기능에 영향 없음).
   */
  const playQuizResult = useCallback((isCorrect: boolean) => {
    if (!soundEnabled) return
    const ctx = ensureCtx()
    if (!ctx) return
    try {
      const notes = isCorrect ? [523.25, 659.25] : [329.63, 261.63] // C5/E5 or E4/C4
      const base = ctx.currentTime + 0.02
      const gap = 0.11
      notes.forEach((freq, i) => {
        const start = base + i * gap
        const dur = 0.16
        const osc = ctx.createOscillator()
        osc.type = isCorrect ? 'triangle' : 'sine'
        osc.frequency.value = freq
        const gain = ctx.createGain()
        const peak = isCorrect ? 0.3 : 0.24
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + dur + 0.02)
      })
    } catch {
      /* 결과 효과음 실패는 퀴즈 동작에 영향을 주지 않는다. */
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

  return { playPageTurn, playQuizResult, primeAudio, soundEnabled, toggleSound }
}
