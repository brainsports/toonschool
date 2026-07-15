/**
 * 툰스쿨 플립북 16:9 — Stage 2/3 검증용 미리보기 페이지(공개 라우트).
 * 표지 + 만화 6컷을 탭(또는 ?page=cover|comic1..6)으로 전환하며 렌더.
 *  - Stage 1 매퍼(mapViewerPages)로 페이지 모델 생성 → 표지/만화 컴포넌트 렌더.
 *  - scale 측정(t0/100ms/1000ms/이미지로딩 후) + 만화 요소(캐릭터/말풍선) 위치 측정 → window.__FLP_MEASURE.
 *  - html2canvas 단일 캡처(1600×900) → window.__FLP_CAPTURE.
 * Stage 5(뷰어 통합) 이후 제거.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import FlipbookPageFrame, {
  type FlipbookPageFrameProps,
} from '../components/viewer/FlipbookPageFrame'
import FlipCoverPagePastel from '../components/viewer/pages/FlipCoverPagePastel'
import FlipComicPagePastel from '../components/viewer/pages/FlipComicPagePastel'
import { mapViewerPages } from '../components/viewer/flipbookPageMapper'
import type { FlipbookPage } from '../components/viewer/flipbookPageModel'
import { buildSampleViewerPages, sampleCtx } from './flipbookStageSampleData'
import bgUrl from '../../../assets/flipbook/pastel-landscape-background.png'
import '../styles/flipbook-landscape-pastel.css'

const PAGE_KEYS = ['cover', 'comic1', 'comic2', 'comic3', 'comic4', 'comic5', 'comic6'] as const
type PageKey = (typeof PAGE_KEYS)[number]

function pageFromQuery(): PageKey {
  const q = new URLSearchParams(window.location.search).get('page') ?? ''
  return (PAGE_KEYS as readonly string[]).includes(q) ? (q as PageKey) : 'cover'
}

type Measure = {
  label: string
  vpW: number
  vpH: number
  pageW: number
  pageH: number
  scale: number
  charX?: number
  charY?: number
  bubX?: number
  bubY?: number
}
type CaptureResult = { ok: true; width: number; height: number } | { ok: false; error: string }

function PageBody({ page }: { page: FlipbookPage }) {
  switch (page.type) {
    case 'cover':
      return <FlipCoverPagePastel model={page} />
    case 'comic':
      return <FlipComicPagePastel model={page} />
    default:
      return null
  }
}

export default function FlipbookLandscapePreviewPage() {
  const pages = useMemo<FlipbookPage[]>(() => mapViewerPages(buildSampleViewerPages(), sampleCtx), [])
  const [active, setActive] = useState<PageKey>(() => pageFromQuery())
  const activeIndex = PAGE_KEYS.indexOf(active)
  const page = pages[activeIndex]

  const screenRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const [measures, setMeasures] = useState<Measure[]>([])
  const [capture, setCapture] = useState<CaptureResult | null>(null)
  const [captureImg, setCaptureImg] = useState<string | null>(null)

  useEffect(() => {
    const w = window as Window & { __FLP_MEASURE?: Measure[] }
    const root = screenRef.current
    const record = (label: string) => {
      const pageEl = root?.querySelector('.flp-page') as HTMLElement | null
      const rect = pageEl?.getBoundingClientRect()
      const charEl = root?.querySelector('.flp-char-img') as HTMLElement | null
      const bubEl = root?.querySelector('.flp-bubble') as HTMLElement | null
      const cr = charEl?.getBoundingClientRect()
      const br = bubEl?.getBoundingClientRect()
      const snap: Measure = {
        label,
        vpW: window.innerWidth,
        vpH: window.innerHeight,
        pageW: rect ? Math.round(rect.width) : 0,
        pageH: rect ? Math.round(rect.height) : 0,
        scale: rect && rect.width ? Math.round((rect.width / 1600) * 1000) / 1000 : 0,
        charX: cr ? Math.round(cr.left) : undefined,
        charY: cr ? Math.round(cr.top) : undefined,
        bubX: br ? Math.round(br.left) : undefined,
        bubY: br ? Math.round(br.top) : undefined,
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
  }, [active])

  const frameProps: Pick<FlipbookPageFrameProps, 'backgroundVariant'> = {
    backgroundVariant: active === 'cover' ? 'cover' : 'content',
  }

  return (
    <div className="flp-preview-shell">
      <div className="flp-preview-tabs">
        {PAGE_KEYS.map((k, i) => (
          <button
            key={k}
            type="button"
            className={`flp-preview-tab${k === active ? ' is-active' : ''}`}
            onClick={() => setActive(k)}
          >
            {i === 0 ? '표지' : `${i}컷`}
          </button>
        ))}
      </div>

      <div ref={screenRef} className="flp-preview-stage">
        {page && (
          <FlipbookPageFrame {...frameProps}>
            <PageBody page={page} />
          </FlipbookPageFrame>
        )}
      </div>

      <div
        ref={captureRef}
        aria-hidden="true"
        style={{ position: 'fixed', left: -99999, top: 0, width: 1600, height: 900, pointerEvents: 'none' }}
      >
        {page && (
          <FlipbookPageFrame {...frameProps} captureMode>
            <PageBody page={page} />
          </FlipbookPageFrame>
        )}
      </div>

      <pre className="flp-measure-panel" id="flp-measure">
        {`[page=${active}]\n` +
          measures
            .map(
              (m) =>
                `${m.label}: page=${m.pageW}x${m.pageH} scale=${m.scale}` +
                (m.charX !== undefined ? ` | char=(${m.charX},${m.charY})` : '') +
                (m.bubX !== undefined ? ` bubble=(${m.bubX},${m.bubY})` : ''),
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
