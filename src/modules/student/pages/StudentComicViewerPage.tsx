import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadComicProjectData, loadComicCutData } from '../components/editor/utils/comicStorage'
import type { ComicProjectData, ComicCutEditData } from '../components/editor/utils/comicStorage'
import { projectStorage } from '../utils/projectStorage'
import type { EditorState } from '../components/editor/types'
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
import StudentZoomControl from '../components/layout/StudentZoomControl'
import { Volume2, VolumeX, ArrowLeft, ArrowRight, BookOpen, MoreVertical, ZoomIn, ZoomOut, Maximize, LayoutGrid, PlayCircle, Monitor } from 'lucide-react'
import type { WorldStory, OXQuestion } from '../services/studentUnitSummaryService'
import { supabase } from '../../../shared/lib/supabase'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { createGrowthEvaluationForSharedComic } from '../services/studentGrowthService'
import FlipbookPageFrame, { FLIPBOOK_LANDSCAPE_HEIGHT, FLIPBOOK_LANDSCAPE_WIDTH } from '../components/viewer/FlipbookPageFrame'
import FlipCoverPagePastel from '../components/viewer/pages/FlipCoverPagePastel'
import FlipComicPagePastel from '../components/viewer/pages/FlipComicPagePastel'
import FlipStoryPagePastel from '../components/viewer/pages/FlipStoryPagePastel'
import FlipQuizPagePastel from '../components/viewer/pages/FlipQuizPagePastel'
import FlipBackCoverPagePastel from '../components/viewer/pages/FlipBackCoverPagePastel'
import { mapViewerPage } from '../components/viewer/flipbookPageMapper'
import type { FlipbookMapContext } from '../components/viewer/flipbookPageMapper'
import type { FlipbookPage as FlipbookPageModel } from '../components/viewer/flipbookPageModel'
import { usePageTurnSound } from '../components/viewer/usePageTurnSound'
import { useSwipeNavigation } from '../components/viewer/useSwipeNavigation'
import BookFlip from '../components/viewer/BookFlip'
import '../styles/flipbook.css'
import '../styles/flipbook-landscape-pastel.css'
import '../styles/flipbook-flip.css'
const BGM_PATH = '/audio/viewer/if-i-had-a-chicken.mp3';

const PDF_PAGE_WIDTH = FLIPBOOK_LANDSCAPE_WIDTH;
const PDF_PAGE_HEIGHT = FLIPBOOK_LANDSCAPE_HEIGHT;

// 책장 넘김 애니메이션 지속시간. CSS(--flp-flip-dur) 와 동일하게 맞춘다.
// 모션 감소 설정 시 짧은 페이드로 대체(애니메이션은 CSS 미디어쿼리가 담당, 여기서는 상태 전환 시점만 맞춘다).
const PREFERS_REDUCED_MOTION =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
const FLIP_DURATION_MS = PREFERS_REDUCED_MOTION ? 260 : 650

// 16:9 파스텔 단일 페이지 논리 크기
const PASTEL_PAGE_WIDTH = 1600
const PASTEL_PAGE_HEIGHT = 900
// 양면 펼침 논리 너비(좌·우 두 페이지). 단일 모드는 PASTEL_PAGE_WIDTH 사용.
const SPREAD_WIDTH = PASTEL_PAGE_WIDTH * 2

type ViewerPage =
  | { type: 'front-cover'; data: EditorState | null }
  | { type: 'comic-cut'; cutNum: number; data: ComicCutEditData | null; scriptCut: any }
  | { type: 'story-history'; data: WorldStory | null }
  | { type: 'story-current'; data: WorldStory | null }
  | { type: 'story-life'; data: WorldStory | null }
  | { type: 'ox-quiz'; questionNum: number; data: OXQuestion | null }
  | { type: 'back-cover'; data: any }

type Spread = { pages: [number | null, number | null] };

const getSpreads = (totalCount: number, single = false): Spread[] => {
  if (totalCount <= 0) return []
  // 단일 페이지 모드(모바일 세로): 한 페이지를 한 스프레드(한 면)로.
  if (single) {
    return Array.from({ length: totalCount }, (_, i) => ({ pages: [i, null] }))
  }
  // 양면 펼침(PC/태블릿): 표지는 우측 단독, 본문은 2면, 마지막 홀수 페이지는 단독.
  const spreads: Spread[] = [{ pages: [null, 0] }]
  let i = 1
  while (i < totalCount) {
    if (i + 1 < totalCount) {
      spreads.push({ pages: [i, i + 1] })
      i += 2
    } else {
      spreads.push({ pages: [i, null] })
      i += 1
    }
  }
  return spreads
}

const getPublicSiteUrl = () => {
  return (
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    window.location.origin
  );
};

const createShareUrl = (slug: string) => {
  const baseUrl = getPublicSiteUrl().replace(/\/$/, '');
  return `${baseUrl}/book/${slug}`;
};

export default function StudentComicViewerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  
  const [pages, setPages] = useState<ViewerPage[]>([])
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0)
  const [isMusicOn, setIsMusicOn] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  
  const [isPdfDownloading, setIsPdfDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareModalData, setShareModalData] = useState<{ url: string } | null>(null)
  const pdfCaptureRef = useRef<HTMLDivElement>(null)

  const [zoomPercent, setZoomPercent] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 })
  const rafRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // 화면 크기 기반 모바일 단일 페이지 모드(기기명 아님). 공유 뷰어와 동일 기준.
  const [isSinglePageMode, setIsSinglePageMode] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)

  const [projectData, setProjectData] = useState<ComicProjectData | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, 'O' | 'X'>>({})

  const [showMenu, setShowMenu] = useState(false)
  const [isAutoFlip, setIsAutoFlip] = useState(false)
  const autoFlipTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null)
  const [targetSpreadIndex, setTargetSpreadIndex] = useState<number | null>(null)

  // 책장 넘김 효과음(합성, 음소거 상태는 localStorage 에 저장).
  const { playPageTurn, primeAudio, soundEnabled, toggleSound } = usePageTurnSound()

  const useSinglePageMode = isSinglePageMode
  const spreads = getSpreads(pages.length, useSinglePageMode)
  const prevSingleModeRef = useRef(useSinglePageMode)

  // 화면 크기로 단일/양면 모드 결정(회전 포함). 기기명 아닌 가용 너비·방향 기준(공유 뷰어와 동일).
  useEffect(() => {
    const checkMode = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      setIsSinglePageMode(w <= 768 || (w <= 1024 && h > w))
      setWindowWidth(w)
    }
    checkMode()
    window.addEventListener('resize', checkMode)
    window.addEventListener('orientationchange', checkMode)
    return () => {
      window.removeEventListener('resize', checkMode)
      window.removeEventListener('orientationchange', checkMode)
    }
  }, [])

  // 신규 파스텔 페이지 모델(원본 ViewerPage[] 와 1:1 정렬, 원본 데이터 불변)
  const pastelCtx = useMemo<FlipbookMapContext>(() => {
    const backCoverPage = pages.find((p) => p.type === 'back-cover')
    const firstComicPage = pages.find((p) => p.type === 'comic-cut' && p.data?.backgroundImageUrl)
    return {
      project: projectData,
      backCover: backCoverPage && backCoverPage.type === 'back-cover' ? backCoverPage.data ?? null : null,
      firstComicImageUrl:
        firstComicPage && firstComicPage.type === 'comic-cut' ? firstComicPage.data?.backgroundImageUrl : undefined,
    }
  }, [projectData, pages])
  const pastelPages = useMemo<(FlipbookPageModel | null)[]>(
    () => pages.map((p) => mapViewerPage(p, pastelCtx)),
    [pages, pastelCtx],
  )

  const currentSpreadIndexRef = useRef(currentSpreadIndex)
  currentSpreadIndexRef.current = currentSpreadIndex
  const isFlippingRef = useRef(isFlipping)
  isFlippingRef.current = isFlipping

  // 모드(단일↔양면) 전환 시 보던 페이지 유지.
  useEffect(() => {
    if (pages.length === 0) return
    if (prevSingleModeRef.current !== useSinglePageMode) {
      const oldSpreads = getSpreads(pages.length, prevSingleModeRef.current)
      const cur = oldSpreads[currentSpreadIndexRef.current]
      if (cur) {
        const pageViewing = cur.pages[0] !== null ? cur.pages[0] : cur.pages[1]
        if (pageViewing !== null) {
          const newIndex = spreads.findIndex((s) => s.pages[0] === pageViewing || s.pages[1] === pageViewing)
          if (newIndex !== -1) setCurrentSpreadIndex(newIndex)
        }
      }
      prevSingleModeRef.current = useSinglePageMode
    }
  }, [useSinglePageMode, pages.length]) // spreads 는 useSinglePageMode/pages.length 에서 파생

  const toggleAutoFlip = () => setIsAutoFlip(p => !p)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err))
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
    }
  }

  useEffect(() => {
    if (isAutoFlip) {
      autoFlipTimerRef.current = setInterval(() => {
        if (isFlippingRef.current) return;
        const cur = currentSpreadIndexRef.current;
        if (cur >= spreads.length - 1) {
          setIsAutoFlip(false);
        } else {
          const next = cur + 1;
          setTargetSpreadIndex(next);
          setIsFlipping(true);
          setFlipDirection('next');
          playPageTurn();
          setTimeout(() => {
            setCurrentSpreadIndex(next);
            setIsFlipping(false);
            setFlipDirection(null);
            setTargetSpreadIndex(null);
          }, FLIP_DURATION_MS);
        }
      }, 4000)
    } else {
      if (autoFlipTimerRef.current) clearInterval(autoFlipTimerRef.current)
    }
    return () => {
      if (autoFlipTimerRef.current) clearInterval(autoFlipTimerRef.current)
    }
    // playPageTurn 은 안정적인 useCallback(usePageTurnSound)이므로 추가해도 재실행을 유발하지 않는다.
  }, [isAutoFlip, spreads.length, playPageTurn])

  // 가용 영역(스테이지) 측정. 캔버스가 아니라 스테이지를 재서 순환 측정을 방지.
  // 스테이지는 캔버스가 마운트된 뒤(프로젝트 로드 후)에 관찰해야 하므로 ResizeObserver + pages.length 의존.
  // 스테이지 크기는 부모 flex 가 결정(캔버스와 무관) → 관찰 루프 없음.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => setStageSize({ width: el.clientWidth, height: el.clientHeight })
    const onResize = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(measure)
    }
    measure()
    const ro = new ResizeObserver(onResize)
    ro.observe(el)
    window.addEventListener('orientationchange', onResize)
    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined
    if (vv) vv.addEventListener('resize', onResize)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      window.removeEventListener('orientationchange', onResize)
      if (vv) vv.removeEventListener('resize', onResize)
    }
  }, [pages.length])

  useEffect(() => {
    const stateProjectId = location.state?.projectId;
    const legacyTopicId = location.state?.topic?.id;
    const currentProjectId = stateProjectId || legacyTopicId || localStorage.getItem('currentProjectId');

    if (!currentProjectId) {
      return; 
    }

    const storedProjectData = loadComicProjectData(currentProjectId);
    setProjectData(storedProjectData ?? null);

    const storedFrontCover = projectStorage.loadFrontCover<EditorState>(currentProjectId);
    const storedSummary = projectStorage.loadSummary<any>(currentProjectId);
    const storedBackCover = projectStorage.loadBackCover<any>(currentProjectId);

    const newPages: ViewerPage[] = [];

    // 1. 앞표지
    newPages.push({ type: 'front-cover', data: storedFrontCover });

    // 2~7. 만화 6컷
    for (let i = 1; i <= 6; i++) {
      const cutData = loadComicCutData(currentProjectId, i);
      const scriptCut = storedProjectData?.script?.cuts?.find(c => c.cutNumber === i);
      if (cutData || scriptCut) newPages.push({ type: 'comic-cut', cutNum: i, data: cutData, scriptCut });
    }

    // 8~10. 생활속 이야기
    if (storedSummary?.stories?.history) newPages.push({ type: 'story-history', data: storedSummary.stories.history });
    if (storedSummary?.stories?.latest) newPages.push({ type: 'story-current', data: storedSummary.stories.latest });
    if (storedSummary?.stories?.life) newPages.push({ type: 'story-life', data: storedSummary.stories.life });

    // 11~15. OX 문제
    for (let i = 0; i < 5; i++) {
      const question = storedSummary?.questions?.[i];
      if (question) newPages.push({ type: 'ox-quiz', questionNum: i + 1, data: question });
    }

    // 16. 뒤표지
    newPages.push({ type: 'back-cover', data: storedBackCover });

    setPages(newPages);
  }, [location.state])


  // --- 단일 scale: 가용 스테이지 공간에서 gutter 만 빼고 맞춤(비율 유지). ---
  const BASE_W = useSinglePageMode ? PASTEL_PAGE_WIDTH : SPREAD_WIDTH;
  const BASE_H = PASTEL_PAGE_HEIGHT;
  const GUTTER = useSinglePageMode ? 12 : 24;

  let fitScale = 1;
  if (stageSize.width > 0 && stageSize.height > 0) {
    const scaleW = (stageSize.width - GUTTER * 2) / BASE_W;
    const scaleH = (stageSize.height - GUTTER * 2) / BASE_H;
    fitScale = Math.min(scaleW, scaleH);
    fitScale = Math.max(0.15, fitScale);
  }

  const currentZoom = zoomPercent !== null ? zoomPercent : (stageSize.width > 0 ? Math.round(fitScale * 100) : 100);
  const spreadScale = currentZoom / 100;

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); 
        const delta = e.deltaY > 0 ? -5 : 5;
        let newZoom = currentZoom + delta;
        newZoom = Math.max(25, Math.min(300, newZoom));
        setZoomPercent(newZoom);
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [currentZoom]);

  // --- Navigation & Sound ---
  const hasTriedMusicRef = useRef(false);

  const playMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    hasTriedMusicRef.current = true;
    try {
      audio.volume = 0.35;
      audio.loop = true;
      await audio.play();
      setIsMusicOn(true);
    } catch (error) {
      console.warn('배경음악 재생이 브라우저 정책으로 차단되었을 수 있습니다.', error);
      setIsMusicOn(false);
    }
  };

  const stopMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setIsMusicOn(false);
  };

  const toggleMusic = () => {
    if (isMusicOn) {
      stopMusic();
    } else {
      playMusic();
    }
  };

  const startViewer = () => {
    setHasStarted(true);
    playMusic();
    // "책 펼치기" 제스처에서 효과음 AudioContext 를 미리 실행해 첫 넘김 소리 누락 방지.
    primeAudio();
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleNext = () => {
    if (!hasTriedMusicRef.current && !isMusicOn) {
      playMusic();
    }
    if (isFlipping || currentSpreadIndex >= spreads.length - 1) return;
    const next = currentSpreadIndex + 1;
    setTargetSpreadIndex(next);
    setFlipDirection('next');
    setIsFlipping(true);
    playPageTurn();
    setTimeout(() => {
      setCurrentSpreadIndex(next);
      setIsFlipping(false);
      setFlipDirection(null);
      setTargetSpreadIndex(null);
    }, FLIP_DURATION_MS);
  }

  const handlePrev = () => {
    if (isFlipping || currentSpreadIndex <= 0) return;
    const prev = currentSpreadIndex - 1;
    setTargetSpreadIndex(prev);
    setFlipDirection('prev');
    setIsFlipping(true);
    playPageTurn();
    setTimeout(() => {
      setCurrentSpreadIndex(prev);
      setIsFlipping(false);
      setFlipDirection(null);
      setTargetSpreadIndex(null);
    }, FLIP_DURATION_MS);
  }

  // 모바일 터치: 가로 스와이프 + 탭(좌/우 절반). 학생 뷰어는 페이지 반 클릭이 없어 탭도 허용.
  const swipeNav = useSwipeNavigation({
    onNext: handleNext,
    onPrev: handlePrev,
    isLocked: () => isFlipping,
    enableTap: true,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStarted) return
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasStarted, currentSpreadIndex, isFlipping, spreads.length])


  if (!projectData || pages.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f3f4f7]">
        <div className="text-center px-6">
          <div className="text-6xl mb-6">📖</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">아직 저장된 프로젝트가 없어요.</h2>
          <p className="text-slate-500 mb-8">먼저 주제, 대본, 만화 등을 저장해 주세요.</p>
          <button 
            onClick={() => navigate('/student/select-unit')}
            className="px-8 py-3 bg-purple-500 text-white font-bold rounded-full shadow-lg hover:bg-purple-600 transition-colors"
          >
            단원 선택으로 가기
          </button>
        </div>
      </div>
    )
  }

  // Stage 5B: 화면, PDF, 공유 캡처 모두 같은 파스텔 16:9 페이지 모델을 사용한다.
  const comicCutCount = pages.filter((p) => p.type === 'comic-cut').length || 6
  const storyCount = pages.filter((p) => p.type.startsWith('story-')).length || 3
  const quizCount = pages.filter((p) => p.type === 'ox-quiz').length || 5

  const renderPastelModel = (model: FlipbookPageModel, storyNumber: number) => {
    switch (model.type) {
      case 'cover':
        return <FlipCoverPagePastel model={model} />
      case 'comic':
        return <FlipComicPagePastel model={model} totalCuts={comicCutCount} />
      case 'story':
        return <FlipStoryPagePastel model={model} storyNumber={storyNumber} totalStories={storyCount} />
      case 'quiz':
        return (
          <FlipQuizPagePastel
            model={model}
            totalQuestions={quizCount}
            selectedAnswer={quizAnswers[model.quizNumber]}
            onSelect={(a) => setQuizAnswers((c) => ({ ...c, [model.quizNumber]: a }))}
          />
        )
      case 'back-cover':
        return <FlipBackCoverPagePastel model={model} />
      default:
        return null
    }
  }

  const renderPageSlot = (pageIndex: number | null) => {
    const blank = (
      <FlipbookPageFrame fitMode="fixed" backgroundVariant="quiet">
        <div className="flp-blank-page" aria-hidden="true" />
      </FlipbookPageFrame>
    )
    if (pageIndex === null) return blank
    const page = pages[pageIndex]
    const model = pageIndex < pastelPages.length ? pastelPages[pageIndex] : null
    if (!page || !model) return blank
    const variant = page.type === 'front-cover' || page.type === 'back-cover' ? 'cover' : 'content'
    let storyNumber = 1
    if (page.type.startsWith('story-')) {
      storyNumber = pages.filter((p, i) => p.type.startsWith('story-') && i <= pageIndex).length
    }
    return (
      <FlipbookPageFrame fitMode="fixed" backgroundVariant={variant}>
        {renderPastelModel(model, storyNumber)}
      </FlipbookPageFrame>
    )
  }

  const getPageIndicatorText = () => {
    if (spreads.length === 0) return '0 / 0';
    const sp = spreads[currentSpreadIndex]?.pages;
    const left = sp?.[0];
    const right = sp?.[1];
    const total = pages.length;
    const hasL = left !== null && left !== undefined;
    const hasR = right !== null && right !== undefined;
    if (!hasL && !hasR) return '';
    if (!hasL) return `${(right ?? 0) + 1} / ${total}`;
    if (!hasR) return `${(left ?? 0) + 1} / ${total}`;
    return `${(left ?? 0) + 1}-${(right ?? 0) + 1} / ${total}`;
  };

  // 플립 중 베이스 스프레드: 넘어가는 면 아래에 깔리는 좌·우(실제 책 넘김)
  const currentSpread: Spread = spreads[currentSpreadIndex] ?? { pages: [null, null] }
  const targetSpread: Spread | null =
    targetSpreadIndex !== null ? spreads[targetSpreadIndex] ?? null : null
  const baseSpread: Spread =
    isFlipping && targetSpread
      ? useSinglePageMode
        ? targetSpread // 단일 모드: 넘겨서 드러날 타겟 페이지를 베이스로
        : flipDirection === 'next'
          ? { pages: [currentSpread.pages[0], targetSpread.pages[1]] }
          : { pages: [targetSpread.pages[0], currentSpread.pages[1]] }
      : currentSpread
  const handleDownloadPdf = async () => {
    if (isPdfDownloading) return;

    try {
      setIsPdfDownloading(true);

      const pageNodes = pdfCaptureRef.current?.querySelectorAll('[data-pdf-page="true"]');

      if (!pageNodes || pageNodes.length === 0) {
        throw new Error('PDF로 저장할 페이지가 없습니다.');
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT],
        compress: true,
      });

      const backCoverPage = pages.find(p => p.type === 'back-cover');
      const authorName = backCoverPage?.data?.authorName || '';
      const gradeClass = backCoverPage?.data?.gradeClassInfo || '';
      const topicName = backCoverPage?.data?.topicName || '';

      let fileName = '툰스쿨_만화보기.pdf';
      if (authorName || gradeClass || topicName) {
        fileName = `툰스쿨_${authorName || '학생'}_${gradeClass || '학년반'}_${topicName || '주제'}.pdf`;
      }
      const safeFileName = fileName.replace(/[\\/:*?"<>|]/g, '');

      for (let i = 0; i < pageNodes.length; i += 1) {
        const pageNode = pageNodes[i] as HTMLElement;

        const canvas = await html2canvas(pageNode, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT], 'landscape');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT);
      }

      pdf.save(safeFileName);
    } catch (error) {
      console.error('PDF 다운로드 실패 원본 error:', error);
      console.error('PDF 다운로드 실패 message:', error instanceof Error ? error.message : String(error));
      console.error('PDF 다운로드 실패 stack:', error instanceof Error ? error.stack : undefined);
      alert('PDF 다운로드를 준비하는 중 문제가 생겼어요. 다시 시도해 주세요.');
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const handleShare = async () => {
    if (isSharing) return;

    const stateProjectId = location.state?.projectId;
    const legacyTopicId = location.state?.topic?.id;
    const currentProjectId = stateProjectId || legacyTopicId || localStorage.getItem('currentProjectId');
    
    if (!currentProjectId) {
      alert('프로젝트 정보가 없어 공유할 수 없습니다.');
      return;
    }

    try {
      setIsSharing(true);
      
      // 1. Check if already shared
      const { data: existingData } = await supabase
        .from('shared_comic_books')
        .select('slug')
        .eq('project_id', currentProjectId)
        .eq('is_public', true)
        .maybeSingle();
        
      if (existingData?.slug) {
        setShareModalData({ url: createShareUrl(existingData.slug) });
        return;
      }

      // 2. Extract pages as images
      const pageNodes = pdfCaptureRef.current?.querySelectorAll('[data-pdf-page="true"]');
      if (!pageNodes || pageNodes.length === 0) {
        throw new Error('공유할 페이지가 없습니다.');
      }

      const slug = Math.random().toString(36).substring(2, 8);
      const uploadedPages = [];
      let thumbnailUrl = '';

      for (let i = 0; i < pageNodes.length; i++) {
        const pageNode = pageNodes[i] as HTMLElement;
        const canvas = await html2canvas(pageNode, {
          scale: 1.5, // Slightly lower scale for web sharing to save size
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        if (!blob) continue;

        const fileName = `${slug}/page-${String(i + 1).padStart(2, '0')}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('shared-comic-books')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('shared-comic-books')
          .getPublicUrl(fileName);

        const sourcePage = pages[i];
        let pageType = 'unknown';
        if (sourcePage) {
          if (sourcePage.type === 'front-cover') pageType = 'cover';
          else if (sourcePage.type === 'comic-cut') pageType = 'comic';
          else if (sourcePage.type.startsWith('story-')) pageType = 'story';
          else if (sourcePage.type === 'ox-quiz') pageType = 'quiz';
          else if (sourcePage.type === 'back-cover') pageType = 'back-cover';
        }

        uploadedPages.push({
          pageNumber: i + 1,
          type: pageType,
          imageUrl: publicUrl
        });

        if (i === 0) {
          thumbnailUrl = publicUrl;
        }
      }

      // 3. Save to database
      const backCoverPage = pages.find(p => p.type === 'back-cover');
      const authorName = backCoverPage?.data?.authorName || '';
      const gradeClassInfo = backCoverPage?.data?.gradeClassInfo || '';
      const topicName = backCoverPage?.data?.topicName || '';
      const subjectName = backCoverPage?.data?.subjectName || '';

      // Title 추출
      const pd = projectData as any;
      const possibleTitles = [
        pd?.title,
        pd?.content?.topicTitle,
        pd?.content?.selectedTopic?.title,
        pd?.content?.title,
        pd?.topicTitle,
        topicName
      ];
      let finalTitle = possibleTitles.find(t => t && typeof t === 'string' && t.trim() !== '') || '툰스쿨 만화';

      // Subject 추출
      const possibleSubjects = [
        pd?.subject,
        pd?.content?.subject,
        pd?.content?.curriculum?.subjectName,
        pd?.content?.curriculum?.subject,
        subjectName
      ];
      let finalSubject = possibleSubjects.find(s => s && typeof s === 'string' && s.trim() !== '');

      if (!finalSubject) {
        const textToSearch = `${finalTitle} ${pd?.summary || ''} ${pd?.content?.summary || ''} ${pd?.selectedStoryDescription || ''}`;
        if (textToSearch.includes('사회') || textToSearch.includes('강줄기') || textToSearch.includes('급식') || textToSearch.includes('우리나라') || textToSearch.includes('국토') || textToSearch.includes('산지') || textToSearch.includes('지도')) finalSubject = '사회';
        else if (textToSearch.includes('과학')) finalSubject = '과학';
        else if (textToSearch.includes('수학')) finalSubject = '수학';
        else if (textToSearch.includes('영어')) finalSubject = '영어';
        else if (textToSearch.includes('미술')) finalSubject = '미술';
        else if (textToSearch.includes('국어')) finalSubject = '국어';
        else finalSubject = '기타';
      }

      const { error: insertError } = await supabase
        .from('shared_comic_books')
        .insert({
          slug,
          project_id: currentProjectId,
          title: finalTitle,
          subject: finalSubject,
          student_name: authorName,
          grade: gradeClassInfo,
          thumbnail_url: thumbnailUrl,
          pages: uploadedPages,
          is_public: true
        });

      if (insertError) throw insertError;

      if (user?.id) {
        try {
          await createGrowthEvaluationForSharedComic(currentProjectId, user.id);
        } catch (evalError) {
          console.error('[StudentComicViewerPage] 성장기록 생성 실패', evalError);
        }
      }

      setShareModalData({ url: createShareUrl(slug) });
    } catch (error) {
      console.error('공유 실패:', error);
      alert('공유 링크 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <StudentWorkspaceLayout
      currentStep="viewer"
      title="만화보기"
      subtitle="우리가 만든 만화책을 한 장씩 넘겨보며 감상해요."
      onBack={() => navigate('/student/back-cover', { state: location.state })}
      actionButtons={
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownloadPdf} 
            disabled={isPdfDownloading}
            className="btn-student btn-student-md !bg-white border-2 !border-purple-200 text-purple-600 hover:!bg-purple-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-1">📄</span> {isPdfDownloading ? 'PDF 만드는 중...' : 'PDF 다운로드'}
          </button>
          <button 
            onClick={handleShare} 
            disabled={isSharing || isPdfDownloading}
            className="btn-student btn-student-md !bg-[#ff2778] text-white hover:!bg-[#e01e65] border-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="mr-1">🎉</span> {isSharing ? '링크 만드는 중...' : '친구에게 자랑하기'}
          </button>
        </div>
      }
      bgVariant="default"
    >
      <audio ref={audioRef} src={BGM_PATH} preload="auto" loop />
      {!hasStarted && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="bg-white rounded-[40px] p-16 shadow-2xl flex flex-col items-center max-w-[800px] text-center border-[8px] border-purple-100 animate-in zoom-in duration-300">
            <h1 className="text-[#303442] text-[36px] font-jua mb-8 leading-normal">
              축하합니다.<br/>이제 해피타임!
            </h1>
            <button 
              className="bg-purple-600 hover:bg-purple-700 text-white border-0 py-6 px-16 rounded-full text-4xl font-jua cursor-pointer shadow-[0_12px_30px_rgba(147,51,234,0.4)] transition-transform hover:scale-105 active:scale-95 flex items-center gap-4"
              onClick={startViewer}
            >
              <BookOpen className="w-10 h-10" />
              책 펼치기
            </button>
          </div>
        </div>
      )}

      <div
        className="flex-1 w-full relative overflow-hidden bg-[#f3f4f7] flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
      >
        <div
          ref={stageRef}
          className="flex-1 min-h-0 w-full flex items-center justify-center overflow-auto student-scrollbar"
          {...swipeNav}
        >
           <div
             ref={containerRef}
             className="relative shadow-2xl bg-[#e2e8f0] rounded-none shrink-0 viewerCanvas"
             style={{
                margin: GUTTER,
                width: BASE_W * spreadScale,
                height: BASE_H * spreadScale,
                overflow: 'visible',
                opacity: hasStarted ? 1 : 0.5,
                perspective: '2400px',
             }}
           >
              <div
                className="relative"
                style={{
                  width: BASE_W,
                  height: BASE_H,
                  transform: `scale(${spreadScale})`,
                  transformOrigin: 'top left',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* 베이스: 양면은 좌·우 두 페이지, 단일 모드는 한 페이지만(각 1600×900) */}
                <div className="absolute inset-0 flex">
                  <div style={{ width: PASTEL_PAGE_WIDTH, height: PASTEL_PAGE_HEIGHT }}>
                    {renderPageSlot(baseSpread.pages[0])}
                  </div>
                  {!useSinglePageMode && (
                    <div style={{ width: PASTEL_PAGE_WIDTH, height: PASTEL_PAGE_HEIGHT }}>
                      {renderPageSlot(baseSpread.pages[1])}
                    </div>
                  )}
                </div>

                {/* 중앙 책등 섀도우(양면 모드만) */}
                {!useSinglePageMode && <div className="flp-spine" aria-hidden="true" />}

                {/* 실제 책 넘김: 종이 한 장이 회전(BookFlip 공용 컴포넌트 — 양 뷰어 동일 애니메이션) */}
                {isFlipping && targetSpread && flipDirection && (
                  <>
                    {/* 넘기는 동안 아래(드러나는 다음 페이지)에 지는 캐스트 섀도우 */}
                    <div className={flipDirection === 'next' ? 'flp-cast-shadow-next' : 'flp-cast-shadow-prev'} aria-hidden="true" />
                    <BookFlip
                      direction={flipDirection}
                      single={useSinglePageMode}
                      pageWidth={PASTEL_PAGE_WIDTH}
                      pageHeight={PASTEL_PAGE_HEIGHT}
                      front={renderPageSlot(useSinglePageMode ? currentSpread.pages[0] : (flipDirection === 'next' ? currentSpread.pages[1] : currentSpread.pages[0]))}
                      back={renderPageSlot(useSinglePageMode ? targetSpread.pages[0] : (flipDirection === 'next' ? targetSpread.pages[0] : targetSpread.pages[1]))}
                    />
                  </>
                )}
              </div>
           </div>
        </div>
           {/* Bottom Player Bar */}
           {hasStarted && (
             <div className="mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-full shadow-lg z-50 transition-all shrink-0 playerWrapper" style={{ backgroundColor: 'rgba(40, 25, 10, 0.88)', marginBottom: 'env(safe-area-inset-bottom)', width: BASE_W * spreadScale, marginInline: 'auto', boxSizing: 'border-box' }}>
               {windowWidth > 600 && (
               <button onClick={() => { if (!isFlipping) setCurrentSpreadIndex(0) }} disabled={isFlipping} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="처음으로">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/><path d="M4 17V7"/></svg>
               </button>
               )}
               <button onClick={handlePrev} disabled={currentSpreadIndex === 0 || isFlipping} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="이전">
                 <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="bg-white text-slate-900 font-bold px-3 py-1 rounded-md text-sm mx-2 min-w-[60px] text-center font-jua">
                 {getPageIndicatorText()}
               </div>
               <button onClick={handleNext} disabled={currentSpreadIndex === spreads.length - 1 || isFlipping} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="다음">
                 <ArrowRight className="w-5 h-5" />
               </button>
               {windowWidth > 600 && (
               <button onClick={() => { if (!isFlipping) setCurrentSpreadIndex(spreads.length - 1) }} disabled={isFlipping} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="마지막으로">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/><path d="M20 17V7"/></svg>
               </button>
               )}

               <div className="w-[1px] h-5 bg-white/20 mx-1"></div>

               <button
                 onClick={toggleSound}
                 className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"
                 title={soundEnabled ? '책장 넘김 소리 끄기' : '책장 넘김 소리 켜기'}
                 aria-label={soundEnabled ? '책장 넘김 소리 끄기' : '책장 넘김 소리 켜기'}
                 aria-pressed={!soundEnabled}
               >
                 {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
               </button>

               <div className="w-[1px] h-5 bg-white/20 mx-1"></div>
               
               <div className="relative">
                 <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors" title="추가 기능">
                    <MoreVertical className="w-5 h-5" />
                 </button>
                 {showMenu && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                     <div className="absolute bottom-full mb-3 right-0 bg-white rounded-xl shadow-xl border border-slate-100 py-2 w-48 text-slate-700 font-medium z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <button onClick={() => { setZoomPercent(Math.min(300, currentZoom + 10)); setShowMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3"><ZoomIn className="w-4 h-4 text-slate-400"/> 확대하기</button>
                        <button onClick={() => { setZoomPercent(Math.max(25, currentZoom - 10)); setShowMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3"><ZoomOut className="w-4 h-4 text-slate-400"/> 축소하기</button>
                        <button onClick={() => { setZoomPercent(null); setShowMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3"><Maximize className="w-4 h-4 text-slate-400"/> 화면맞춤</button>
                        <div className="h-[1px] bg-slate-100 my-1"></div>
                        <button onClick={() => { alert('썸네일 보기 기능은 준비 중입니다.'); setShowMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3"><LayoutGrid className="w-4 h-4 text-slate-400"/> 썸네일 보기</button>
                        <button onClick={() => { toggleAutoFlip(); setShowMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3">
                           <PlayCircle className={`w-4 h-4 ${isAutoFlip ? 'text-[#ff2778]' : 'text-slate-400'}`}/> <span className={isAutoFlip ? 'text-[#ff2778]' : ''}>{isAutoFlip ? '자동 넘김 중지' : '자동 넘김'}</span>
                        </button>
                        <button onClick={() => { toggleMusic(); setShowMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3">
                           {isMusicOn ? <VolumeX className="w-4 h-4 text-slate-400"/> : <Volume2 className="w-4 h-4 text-slate-400"/>} {isMusicOn ? '음악 끄기' : '음악 켜기'}
                        </button>
                        <div className="h-[1px] bg-slate-100 my-1"></div>
                        <button onClick={() => { toggleFullscreen(); setShowMenu(false); }} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3"><Monitor className="w-4 h-4 text-slate-400"/> 전체화면</button>
                     </div>
                   </>
                 )}
               </div>
             </div>
           )}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-50">
        <StudentZoomControl
          scale={(currentZoom) / 100}
          onZoomIn={() => setZoomPercent(Math.min(300, currentZoom + 10))}
          onZoomOut={() => setZoomPercent(Math.max(25, currentZoom - 10))}
          onFitToScreen={() => setZoomPercent(null)}
          minScale={0.25}
          maxScale={3.0}
        />
      </div>

      {/* Hidden PDF Capture Container */}
      <div
        ref={pdfCaptureRef}
        className="pdf-capture-root"
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-99999px',
          top: 0,
          width: `${PDF_PAGE_WIDTH}px`,
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        {pages.map((_, index) => (
          <div
            key={`pdf-page-${index}`}
            data-pdf-page="true"
            style={{
              width: `${PDF_PAGE_WIDTH}px`,
              height: `${PDF_PAGE_HEIGHT}px`,
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#ffffff'
            }}
          >
            {renderPageSlot(index)}
          </div>
        ))}
      </div>

      {shareModalData && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
          <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center max-w-[500px] text-center border-4 border-purple-100 animate-in zoom-in duration-300">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-[#303442] text-[28px] font-jua mb-2">
              친구에게 보여줄 플립북 링크가 만들어졌어요!
            </h2>
            <p className="text-slate-500 mb-6 font-medium break-keep">
              아래 링크를 복사해서 친구에게 보내 주세요.
            </p>
            
            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 text-slate-600 font-mono text-sm break-all mb-6">
              {shareModalData.url}
            </div>

            <div className="flex flex-col w-full gap-3">
              <button 
                className="w-full py-4 bg-purple-600 text-white rounded-full font-bold text-lg hover:bg-purple-700 transition-colors shadow-md"
                onClick={() => {
                  navigator.clipboard.writeText(shareModalData.url);
                  alert('링크가 복사되었습니다!');
                }}
              >
                링크 복사하기
              </button>
              <button 
                className="w-full py-4 bg-white text-purple-600 border-2 border-purple-200 rounded-full font-bold text-lg hover:bg-purple-50 transition-colors"
                onClick={() => window.open(shareModalData.url, '_blank')}
              >
                새 창에서 보기
              </button>
              <button 
                className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors mt-2"
                onClick={() => setShareModalData(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </StudentWorkspaceLayout>
  )
}
