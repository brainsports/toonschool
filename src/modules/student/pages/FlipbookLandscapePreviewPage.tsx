/**
 * 툰스쿨 플립북 16:9 — Stage 2 검증용 미리보기 페이지(공개 라우트).
 *
 * 목적: 신규 16:9 파스텔 프레임·배경·표지를 라이브 뷰어와 분리해서 안전하게 검증.
 *  - Stage 1 매퍼(mapViewerPages)에 샘플 데이터를 넣어 표지(FlipbookCoverPage)를 만들고 렌더.
 *  - 화면용 프레임(단일 scale)으로 뷰포트를 채우고, 숨겨진 캡처용 프레임(1600×900 고정)을 별도 렌더.
 *  - scale 측정(t0/100ms/1000ms/이미지로딩 후) 결과를 window.__FLP_MEASURE 에,
 *    html2canvas 단일 캡처 결과를 window.__FLP_CAPTURE 에 노출해 Puppeteer 가 읽도록 한다.
 *
 * Stage 5(뷰어 통합) 이후 제거 또는 dev 전용으로 정리한다.
 */
import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import FlipbookPageFrame from '../components/viewer/FlipbookPageFrame'
import FlipCoverPagePastel from '../components/viewer/pages/FlipCoverPagePastel'
import { mapViewerPages, type ViewerPageLike, type FlipbookMapContext } from '../components/viewer/flipbookPageMapper'
import type { FlipbookCoverPage } from '../components/viewer/flipbookPageModel'
import type { ComicProjectData } from '../components/editor/utils/comicStorage'
import bgUrl from '../../../assets/flipbook/pastel-landscape-background.png'
import '../styles/flipbook-landscape-pastel.css'

// --- 대표 샘플 데이터(5학년 사회, 참고 이미지 분위기와 유사) ---
const sampleProject: ComicProjectData = {
  projectId: 'sample-stage2',
  grade: '5학년',
  semester: '1학기',
  subject: '사회',
  mainUnit: '1. 우리나라의 자연 환경',
  subUnit: '2. 산지와 하천',
  topicTitle: '강줄기가 만드는 우리나라 땅 모양',
  selectedStoryDescription: '',
  coreConcepts: ['강줄기', '산지', '하천', '평야'],
  script: { version: 2, updatedAt: '', cuts: [] },
  characterReferences: { version: 'v2' },
}

const sampleCtx: FlipbookMapContext = {
  project: sampleProject,
  backCover: {
    authorName: '김도현',
    gradeClassInfo: '5학년 2반',
    subjectName: '사회',
    unitName: '산지와 하천',
    topicTitle: '강줄기가 만드는 우리나라 땅 모양',
    createdDate: '2026.07.15',
  },
  firstComicImageUrl: undefined,
}

const samplePages: ViewerPageLike[] = [{ type: 'front-cover', data: null }]

type Measure = { label: string; vpW: number; vpH: number; pageW: number; pageH: number; scale: number }
type CaptureResult = { ok: true; width: number; height: number } | { ok: false; error: string }

export default function FlipbookLandscapePreviewPage() {
  const cover = mapViewerPages(samplePages, sampleCtx).find((p) => p.type === 'cover') as
    | FlipbookCoverPage
    | undefined

  const screenRootRef = useRef<HTMLDivElement>(null)
  const captureNodeRef = useRef<HTMLDivElement>(null)
  const [measures, setMeasures] = useState<Measure[]>([])
  const [capture, setCapture] = useState<CaptureResult | null>(null)
  const [captureImg, setCaptureImg] = useState<string | null>(null)

  // --- scale 측정: 최초 로딩 크기 튐 여부 확인 ---
  useEffect(() => {
    const w = window as Window & { __FLP_MEASURE?: Measure[] }
    const record = (label: string) => {
      const pageEl = screenRootRef.current?.querySelector('.flp-page') as HTMLElement | null
      const rect = pageEl?.getBoundingClientRect()
      const snap: Measure = {
        label,
        vpW: window.innerWidth,
        vpH: window.innerHeight,
        pageW: rect ? Math.round(rect.width) : 0,
        pageH: rect ? Math.round(rect.height) : 0,
        scale: rect && rect.width ? Math.round((rect.width / 1600) * 1000) / 1000 : 0,
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
  }, [])

  // --- html2canvas 단일 캡처(1600×900) ---
  useEffect(() => {
    const w = window as Window & { __FLP_CAPTURE?: CaptureResult }
    let cancelled = false
    const run = async () => {
      const node = captureNodeRef.current?.querySelector('.flp-page') as HTMLElement | null
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
  }, [cover])

  return (
    <div className="flp-preview-shell">
      <div ref={screenRootRef} className="flp-preview-stage">
        {cover && (
          <FlipbookPageFrame backgroundVariant="cover">
            <FlipCoverPagePastel model={cover} />
          </FlipbookPageFrame>
        )}
      </div>

      {/* 캡처 전용(1600×900 고정, 화면 밖) */}
      <div ref={captureNodeRef} aria-hidden="true" style={{ position: 'fixed', left: -99999, top: 0, width: 1600, height: 900, pointerEvents: 'none' }}>
        {cover && (
          <FlipbookPageFrame backgroundVariant="cover" captureMode>
            <FlipCoverPagePastel model={cover} />
          </FlipbookPageFrame>
        )}
      </div>

      <pre className="flp-measure-panel" id="flp-measure">
        {`[scale 측정]\n` +
          measures.map((m) => `${m.label}: vp=${m.vpW}x${m.vpH} page=${m.pageW}x${m.pageH} scale=${m.scale}`).join('\n') +
          (capture ? `\n\n[html2canvas] ok=${capture.ok}${capture.ok ? ` ${capture.width}x${capture.height}` : ` err=${capture.error}`}` : '')}
      </pre>

      {captureImg && (
        <div className="flp-capture-preview" id="flp-capture-preview">
          <img src={captureImg} alt="cover capture" />
          <div>html2canvas 캡처 미리보기</div>
        </div>
      )}
    </div>
  )
}
