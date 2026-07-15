/**
 * 툰스쿨 플립북 16:9 — Stage 2/3/4 검증용 미리보기 페이지(공개 라우트).
 * 표지 + 만화 6 + 스토리 3 + 퀴즈 5 + 뒤표지를 탭(또는 ?page=)으로 전환하며 렌더.
 *  - Stage 1 매퍼(mapViewerPages)로 페이지 모델 생성 → 각 파스텔 컴포넌트 렌더.
 *  - scale 측정(t0/100ms/1000ms/imgLoaded) + 대표 요소 위치 측정 → window.__FLP_MEASURE.
 *  - html2canvas 단일 캡처(1600×900) → window.__FLP_CAPTURE.
 *  - 퀴즈 정답 노출 정책 = 운영과 동일(선택 후 정답/해설 노출). quizAnswers 로 선택 상태 관리.
 * Stage 5(뷰어 통합) 이후 제거.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import FlipbookPageFrame, {
  type FlipbookPageFrameProps,
} from '../components/viewer/FlipbookPageFrame'
import FlipCoverPagePastel from '../components/viewer/pages/FlipCoverPagePastel'
import FlipComicPagePastel from '../components/viewer/pages/FlipComicPagePastel'
import FlipStoryPagePastel from '../components/viewer/pages/FlipStoryPagePastel'
import FlipQuizPagePastel from '../components/viewer/pages/FlipQuizPagePastel'
import FlipBackCoverPagePastel from '../components/viewer/pages/FlipBackCoverPagePastel'
import { mapViewerPages } from '../components/viewer/flipbookPageMapper'
import type { FlipbookPage } from '../components/viewer/flipbookPageModel'
import type { OxAnswer } from '../components/viewer/flipbookOxQuiz'
import { buildSampleViewerPages, sampleCtx } from './flipbookStageSampleData'
import bgUrl from '../../../assets/flipbook/pastel-landscape-background.png'
import '../styles/flipbook-landscape-pastel.css'

const PAGE_KEYS = [
  'cover', 'comic1', 'comic2', 'comic3', 'comic4', 'comic5', 'comic6',
  'story1', 'story2', 'story3',
  'quiz1', 'quiz2', 'quiz3', 'quiz4', 'quiz5',
  'backcover',
] as const
type PageKey = (typeof PAGE_KEYS)[number]

function pageFromQuery(): PageKey {
  const q = new URLSearchParams(window.location.search).get('page') ?? ''
  return (PAGE_KEYS as readonly string[]).includes(q) ? (q as PageKey) : 'cover'
}

function tabLabel(k: PageKey, i: number): string {
  if (k === 'cover') return '표지'
  if (k === 'backcover') return '뒤표지'
  if (k.startsWith('comic')) return `${i}컷`
  if (k.startsWith('story')) return `이야기 ${k.slice(5)}`
  if (k.startsWith('quiz')) return `퀴즈 ${k.slice(4)}`
  return String(i)
}

type Measure = { label: string; pageW: number; pageH: number; scale: number; markX?: number; markY?: number }
type CaptureResult = { ok: true; width: number; height: number } | { ok: false; error: string }

export default function FlipbookLandscapePreviewPage() {
  const pages = useMemo<FlipbookPage[]>(() => mapViewerPages(buildSampleViewerPages(), sampleCtx), [])
  const [active, setActive] = useState<PageKey>(() => pageFromQuery())
  const activeIndex = PAGE_KEYS.indexOf(active)
  const page = pages[activeIndex]
  const [quizAnswers, setQuizAnswers] = useState<Record<number, OxAnswer>>({})
  // 캡처 검증용: ?reveal=1 이면 현재 퀴즈의 정답을 미리 노출(운영 "선택 후 정답 노출" 정책의 정답 상태 재현).
  const reveal = useMemo(() => new URLSearchParams(window.location.search).get('reveal') === '1', [])

  const screenRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const [measures, setMeasures] = useState<Measure[]>([])
  const [capture, setCapture] = useState<CaptureResult | null>(null)
  const [captureImg, setCaptureImg] = useState<string | null>(null)

  // ?page= 가 바뀌면(뒤/앞으로) 활성 페이지 동기화
  useEffect(() => {
    const onPop = () => setActive(pageFromQuery())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    const w = window as Window & { __FLP_MEASURE?: Measure[] }
    const root = screenRef.current
    const record = (label: string) => {
      const pageEl = root?.querySelector('.flp-page') as HTMLElement | null
      const rect = pageEl?.getBoundingClientRect()
      const markEl =
        (root?.querySelector('.flp-char-img') as HTMLElement | null) ||
        (root?.querySelector('.flp-bubble') as HTMLElement | null) ||
        (root?.querySelector('.flp-card') as HTMLElement | null)
      const mr = markEl?.getBoundingClientRect()
      const snap: Measure = {
        label,
        pageW: rect ? Math.round(rect.width) : 0,
        pageH: rect ? Math.round(rect.height) : 0,
        scale: rect && rect.width ? Math.round((rect.width / 1600) * 1000) / 1000 : 0,
        markX: mr ? Math.round(mr.left) : undefined,
        markY: mr ? Math.round(mr.top) : undefined,
      }
      setMeasures((prev) => {
        const next = [...prev, snap]
        w.__FLP_MEASURE = next
        return next
      })
    }
    const raf = requestAnimationFrame(() => record('t0'))
    const t100 = window.setTimeout(() => record('100ms'), 100)
    const t1000 = window.setTimeout(() => record('1000ms'), 1000)
    const img = new Image()
    img.onload = () => record('imgLoaded')
    img.src = bgUrl
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t100)
      window.clearTimeout(t1000)
    }
  }, [active])

  useEffect(() => {
    const w = window as Window & { __FLP_CAPTURE?: CaptureResult }
    let cancelled = false
    const run = async () => {
      const node = captureRef.current?.querySelector('.flp-page') as HTMLElement | null
      if (!node) return
      try {
        await document.fonts.ready
        await new Promise<void>((res) => {
          const im = new Image()
          im.onload = () => res()
          im.onerror = () => res()
          im.src = bgUrl
        })
        const canvas = await html2canvas(node, {
          backgroundColor: '#dff4ff',
          useCORS: true,
          allowTaint: true,
          scale: 1,
          width: 1600,
          height: 900,
          windowWidth: 1600,
          windowHeight: 900,
        })
        if (cancelled) return
        const url = canvas.toDataURL('image/png')
        const result: CaptureResult = { ok: true, width: canvas.width, height: canvas.height }
        setCapture(result)
        setCaptureImg(url)
        w.__FLP_CAPTURE = result
      } catch (e) {
        if (cancelled) return
        const result: CaptureResult = { ok: false, error: e instanceof Error ? e.message : String(e) }
        setCapture(result)
        w.__FLP_CAPTURE = result
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [active, quizAnswers])

  const frameProps: Pick<FlipbookPageFrameProps, 'backgroundVariant'> = {
    backgroundVariant: active === 'cover' || active === 'backcover' ? 'cover' : 'content',
  }

  const storyNumber = active.startsWith('story') ? Number(active.slice(5)) : 1

  function renderBody(p: FlipbookPage) {
    switch (p.type) {
      case 'cover':
        return <FlipCoverPagePastel model={p} />
      case 'comic':
        return <FlipComicPagePastel model={p} />
      case 'story':
        return <FlipStoryPagePastel model={p} storyNumber={storyNumber} totalStories={3} />
      case 'quiz':
        return (
          <FlipQuizPagePastel
            model={p}
            totalQuestions={5}
            selectedAnswer={reveal ? p.answer : quizAnswers[p.quizNumber]}
            onSelect={reveal ? undefined : (a: OxAnswer) => setQuizAnswers((prev) => ({ ...prev, [p.quizNumber]: a }))}
          />
        )
      case 'back-cover':
        return <FlipBackCoverPagePastel model={p} />
      default:
        return null
    }
  }

  return (
    <div className="flp-preview-shell">
      <div className="flp-preview-tabs" role="tablist" aria-label="미리보기 페이지">
        {PAGE_KEYS.map((k, i) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={k === active}
            className={`flp-preview-tab${k === active ? ' is-active' : ''}`}
            onClick={() => setActive(k)}
          >
            {tabLabel(k, i)}
          </button>
        ))}
      </div>

      <div ref={screenRef} className="flp-preview-stage">
        {page && (
          <FlipbookPageFrame {...frameProps}>{renderBody(page)}</FlipbookPageFrame>
        )}
      </div>

      <div
        ref={captureRef}
        aria-hidden="true"
        style={{ position: 'fixed', left: -99999, top: 0, width: 1600, height: 900, pointerEvents: 'none' }}
      >
        {page && (
          <FlipbookPageFrame {...frameProps} captureMode>
            {renderBody(page)}
          </FlipbookPageFrame>
        )}
      </div>

      <pre className="flp-measure-panel" id="flp-measure">
        {`[page=${active}]\n` +
          measures
            .map(
              (m) =>
                `${m.label}: page=${m.pageW}x${m.pageH} scale=${m.scale}` +
                (m.markX !== undefined ? ` | mark=(${m.markX},${m.markY})` : ''),
            )
            .join('\n') +
          (capture ? `\n\n[html2canvas] ok=${capture.ok}${capture.ok ? ` ${capture.width}x${capture.height}` : ` err=${capture.error}`}` : '')}
      </pre>

      {captureImg && (
        <div className="flp-capture-preview" id="flp-capture-preview">
          <img src={captureImg} alt="capture" />
          <div>html2canvas 캡처 ({active})</div>
        </div>
      )}
    </div>
  )
}
