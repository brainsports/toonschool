import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadComicProjectData, loadComicCutData } from '../components/editor/utils/comicStorage'
import type { ComicProjectData, ComicCutEditData, ComicCutElement } from '../components/editor/utils/comicStorage'
import { projectStorage } from '../utils/projectStorage'
import type { EditorState } from '../components/editor/types'
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
import StudentZoomControl from '../components/layout/StudentZoomControl'
import { Volume2, VolumeX, ArrowLeft, ArrowRight, BookOpen, MoreVertical, ZoomIn, ZoomOut, Maximize, LayoutGrid, PlayCircle, Monitor } from 'lucide-react'
import { COMMON_COVER_TEMPLATES, DEFAULT_COVER_TEMPLATE_ID } from '../data/coverTemplates'
import type { WorldStory, OXQuestion } from '../services/studentUnitSummaryService'
import { supabase } from '../../../shared/lib/supabase'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { createGrowthEvaluationForSharedComic } from '../services/studentGrowthService'
import LandscapePageLayout, { FLIPBOOK_PAGE_HEIGHT, FLIPBOOK_PAGE_RATIO, FLIPBOOK_PAGE_WIDTH } from '../components/viewer/LandscapePageLayout'
import { buildComicPageInfo, buildQuizPageInfo, buildStoryPageInfo, getProjectKeywords } from '../components/viewer/landscapePageInfo'
import '../styles/landscape-viewer.css'
const BGM_PATH = '/audio/viewer/if-i-had-a-chicken.mp3';

function hexToRgba(hex: string, opacity: number) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6 && normalized.length !== 3) return hex;
  let r, g, b;
  if (normalized.length === 3) {
    r = parseInt(normalized[0] + normalized[0], 16);
    g = parseInt(normalized[1] + normalized[1], 16);
    b = parseInt(normalized[2] + normalized[2], 16);
  } else {
    const bigint = parseInt(normalized, 16);
    r = (bigint >> 16) & 255;
    g = (bigint >> 8) & 255;
    b = bigint & 255;
  }
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function ReadonlyElement({ el }: { el: ComicCutElement }) {
  const isBubble = el.type === 'speechBubble'
  const isChar = el.type === 'character'

  return (
    <div
      style={{
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: `rotate(${el.rotation || 0}deg) ${el.flipX ? 'scaleX(-1)' : ''}`,
        zIndex: el.zIndex,
        pointerEvents: 'none',
      }}
    >
      {isChar && el.imageUrl && (
        <img src={el.imageUrl} alt="character" className="w-full h-full object-contain" />
      )}
      {isBubble && (
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-white border-4 border-slate-800 rounded-3xl shadow-md" />
          <p className="relative z-10 text-slate-800 font-bold text-center px-4 leading-snug break-keep"
             style={{ fontSize: el.style?.fontSize || 16 }}>
            {el.text}
          </p>
        </div>
      )}
    </div>
  )
}

const PDF_PAGE_WIDTH = 1123;
const PDF_PAGE_HEIGHT = 794;
const PDF_SCALE = PDF_PAGE_WIDTH / FLIPBOOK_PAGE_WIDTH;

const pdfPageBaseStyle: React.CSSProperties = {
  width: `${PDF_PAGE_WIDTH}px`,
  height: `${PDF_PAGE_HEIGHT}px`,
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  color: '#111827',
  border: 'none',
  boxShadow: 'none',
  transform: 'none',
  position: 'relative',
  boxSizing: 'border-box',
};

const PageWrapper = ({ children, isLeft, isRight, isSingle, showNumber, pageNum }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!ref.current) return;
    const resize = () => {
      if (ref.current) {
        setScale(ref.current.clientWidth / FLIPBOOK_PAGE_WIDTH);
      }
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`flex-1 h-full bg-white relative overflow-hidden ${isSingle ? 'rounded-none shadow-lg border border-slate-200' : isLeft ? 'rounded-none border-r-0' : isRight ? 'rounded-none border-l border-black/5' : ''} shadow-[inset_0_0_40px_rgba(0,0,0,0.03)]`}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: FLIPBOOK_PAGE_WIDTH, height: FLIPBOOK_PAGE_HEIGHT, position: 'absolute', top: 0, left: 0 }}>
        {pageNum !== undefined && pageNum >= 2 && pageNum <= 15 && (
          <div 
            className="absolute pointer-events-none page-doodle-border"
            style={{
              inset: '-24px',
              backgroundImage: 'url("/images/toonschool/flipbook/page-border-doodle.png")',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              zIndex: 0,
              opacity: 0.05
            }}
          />
        )}
        
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
      {showNumber && pageNum !== undefined && (
        <div 
          className={`absolute ${isSingle ? 'left-1/2 -translate-x-1/2 bottom-6' : isLeft ? 'left-8 bottom-6' : 'right-8 bottom-6'} text-slate-400 font-bold font-jua select-none page-number`}
          style={{ fontSize: '12pt', zIndex: 2 }}
        >
          - {pageNum} -
        </div>
      )}
    </div>
  )
}

type ViewerPage =
  | { type: 'front-cover'; data: EditorState | null }
  | { type: 'comic-cut'; cutNum: number; data: ComicCutEditData | null; scriptCut: any }
  | { type: 'story-history'; data: WorldStory | null }
  | { type: 'story-current'; data: WorldStory | null }
  | { type: 'story-life'; data: WorldStory | null }
  | { type: 'ox-quiz'; questionNum: number; data: OXQuestion | null }
  | { type: 'back-cover'; data: any }

type Spread = { pages: [number | null, number | null] };

const getSpreads = (totalCount: number): Spread[] => {
  return Array.from({ length: totalCount }, (_, pageIndex) => ({ pages: [pageIndex, null] }));
};

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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const audioRef = useRef<HTMLAudioElement>(null)

  const [projectData, setProjectData] = useState<ComicProjectData | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, 'O' | 'X'>>({})

  const [showMenu, setShowMenu] = useState(false)
  const [isAutoFlip, setIsAutoFlip] = useState(false)
  const autoFlipTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null)
  const [targetSpreadIndex, setTargetSpreadIndex] = useState<number | null>(null)

  const spreads = getSpreads(pages.length)

  const currentSpreadIndexRef = useRef(currentSpreadIndex)
  currentSpreadIndexRef.current = currentSpreadIndex
  const isFlippingRef = useRef(isFlipping)
  isFlippingRef.current = isFlipping

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
          setTimeout(() => {
            setCurrentSpreadIndex(next);
            setIsFlipping(false);
            setFlipDirection(null);
            setTargetSpreadIndex(null);
          }, 1100);
        }
      }, 4000)
    } else {
      if (autoFlipTimerRef.current) clearInterval(autoFlipTimerRef.current)
    }
    return () => {
      if (autoFlipTimerRef.current) clearInterval(autoFlipTimerRef.current)
    }
  }, [isAutoFlip, spreads.length])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    setTimeout(handleResize, 50)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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


  // --- Zoom Logic ---
  const BASE_WIDTH = 1200;
  const BASE_HEIGHT = BASE_WIDTH / FLIPBOOK_PAGE_RATIO;
  const SCROLL_PADDING = 80;
  
  let fitScale = 1;
  if (containerSize.width > 0 && containerSize.height > 0) {
    const scaleW = (containerSize.width - SCROLL_PADDING * 2) / BASE_WIDTH;
    const scaleH = (containerSize.height - SCROLL_PADDING * 2) / BASE_HEIGHT;
    fitScale = Math.min(scaleW, scaleH);
    fitScale = Math.max(0.3, fitScale);
  }
  
  const currentZoom = zoomPercent !== null ? zoomPercent : (containerSize.width > 0 ? Math.round(fitScale * 100) : 100);

  useEffect(() => {
    const el = containerRef.current;
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
    setTimeout(() => {
      setCurrentSpreadIndex(next);
      setIsFlipping(false);
      setFlipDirection(null);
      setTargetSpreadIndex(null);
    }, 1100);
  }

  const handlePrev = () => {
    if (isFlipping || currentSpreadIndex <= 0) return;
    const prev = currentSpreadIndex - 1;
    setTargetSpreadIndex(prev);
    setFlipDirection('prev');
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentSpreadIndex(prev);
      setIsFlipping(false);
      setFlipDirection(null);
      setTargetSpreadIndex(null);
    }, 1100);
  }

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

  // --- Landscape page rendering ---
  const renderLandscapeContent = (page: ViewerPage, pageNum: number) => {
    const backCover = pages.find((candidate) => candidate.type === 'back-cover')
    const backData = backCover?.type === 'back-cover' ? backCover.data : null
    const subject = backData?.subjectName || projectData.subject
    const unit = backData?.unitName || projectData.subUnit || projectData.mainUnit
    const firstComicPage = pages.find((candidate) => candidate.type === 'comic-cut' && candidate.data?.backgroundImageUrl)
    const firstComicImage = firstComicPage?.type === 'comic-cut' ? firstComicPage.data?.backgroundImageUrl : undefined

    if (page.type === 'front-cover') {
      const state = page.data
      const bgTemplate = COMMON_COVER_TEMPLATES.find((template) => template.id === state?.coverTemplateId)
        || COMMON_COVER_TEMPLATES.find((template) => template.id === DEFAULT_COVER_TEMPLATE_ID)
      const coverImage = state?.background || firstComicImage || bgTemplate?.imageUrl || projectData.cover?.imageUrl
      const keywords = getProjectKeywords(projectData)
      return (
        <article className="landscape-cover">
          <section className="landscape-cover-copy">
            <span className="landscape-page-type">TOONSCHOOL · {subject}</span>
            <h1>{projectData.topicTitle || '나의 학습 만화'}</h1>
            <p>{unit || projectData.selectedStoryDescription}</p>
            {!!keywords.length && <div className="landscape-keywords">{keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>}
            <div className="landscape-meta">
              {projectData.grade && <span>{projectData.grade}</span>}
              {backData?.authorName && <span>지은이 {backData.authorName}</span>}
              {backData?.gradeClassInfo && <span>{backData.gradeClassInfo}</span>}
              {backData?.createdDate && <span>{backData.createdDate}</span>}
            </div>
          </section>
          <section className="landscape-cover-art">
            {coverImage ? <img src={coverImage} alt={`${projectData.topicTitle} 표지`} /> : <div className="text-6xl" aria-label="표지 이미지 없음">📖</div>}
          </section>
        </article>
      )
    }

    if (page.type === 'comic-cut') {
      const info = buildComicPageInfo(projectData, page.cutNum)
      const sceneScale = 806 / 1400
      return (
        <LandscapePageLayout info={info} subject={subject} unit={unit} pageNumber={pageNum} totalPages={pages.length} tone="comic">
          <div className="landscape-content-inner">
            <div className="landscape-comic-frame">
              {page.data?.backgroundImageUrl ? (
                <img src={page.data.backgroundImageUrl} className="absolute inset-0 w-full h-full object-contain" alt={`${page.cutNum}컷 만화 장면`} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-jua text-slate-400">그림 준비 중</div>
              )}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{ transform: `scale(${sceneScale})`, transformOrigin: 'top left', width: 1400, height: 1025 }}>
                  {page.data?.elements?.map((element) => <ReadonlyElement key={element.id} el={element} />)}
                </div>
              </div>
            </div>
          </div>
        </LandscapePageLayout>
      )
    }

    if (page.type.startsWith('story-')) {
      const storyType: WorldStory['type'] = page.type === 'story-history' ? 'history' : page.type === 'story-current' ? 'latest' : 'life'
      const data = page.data
      if (!data) return null
      const info = buildStoryPageInfo(projectData, storyType, data)
      return (
        <LandscapePageLayout info={info} subject={subject} unit={unit} pageNumber={pageNum} totalPages={pages.length} tone={storyType === 'latest' ? 'current' : storyType}>
          <div className="landscape-story-content">
            <h3>{data.title}</h3>
            <p>{data.content}</p>
          </div>
        </LandscapePageLayout>
      )
    }

    if (page.type === 'ox-quiz') {
      const data = page.data
      if (!data) return null
      const info = buildQuizPageInfo(projectData, page.questionNum)
      const selected = quizAnswers[page.questionNum]
      return (
        <LandscapePageLayout info={info} subject={subject} unit={unit} pageNumber={pageNum} totalPages={pages.length} tone="quiz">
          <div className="landscape-quiz-card">
            <h3>Q. {data.question}</h3>
            <div className="landscape-quiz-actions">
              {(['O', 'X'] as const).map((answer) => (
                <button
                  key={answer}
                  type="button"
                  aria-label={`${answer} 선택`}
                  className={selected === answer ? (answer === data.answer ? '!border-emerald-400 !bg-emerald-50 !text-emerald-600' : '!border-rose-400 !bg-rose-50 !text-rose-600') : ''}
                  onClick={(event) => {
                    event.stopPropagation()
                    setQuizAnswers((current) => ({ ...current, [page.questionNum]: answer }))
                  }}
                >
                  {answer}
                </button>
              ))}
            </div>
            {selected && <p className={`mt-8 text-center text-2xl font-jua ${selected === data.answer ? 'text-emerald-600' : 'text-rose-600'}`}>{selected === data.answer ? '정답이에요!' : '한 번 더 생각해 보세요.'}</p>}
          </div>
        </LandscapePageLayout>
      )
    }

    const data = page.data || {}
    const backgroundColor = hexToRgba(data.bgColor || '#e9f7ef', data.bgOpacity ?? 1)
    return (
      <article className="landscape-back-cover" style={{ backgroundColor }}>
        <section className="landscape-back-copy">
          <span className="landscape-page-type">학습 마무리</span>
          <h1>오늘의 배움을 완성했어요</h1>
          <p>{projectData.topicTitle || data.topicName || '나의 학습 만화'}</p>
          <div className="landscape-meta">
            {data.authorName && <span>{data.authorName}</span>}
            {data.gradeClassInfo && <span>{data.gradeClassInfo}</span>}
            {data.createdDate && <span>{data.createdDate}</span>}
            <span>친구와 작품을 나누고 다시 읽어 보세요.</span>
          </div>
        </section>
        <section className="landscape-back-art">
          {firstComicImage && <img className="landscape-back-hero" src={firstComicImage} alt="작품 대표 만화 장면" />}
          <div className="landscape-back-share">
            <strong>TOONSCHOOL</strong>
            <p>작품 링크를 공유하고 다시 감상해 보세요.</p>
            <img src="/images/toonschool/back-covers/back-cover-sns-default.webp" alt="작품 공유 QR 카드" />
          </div>
        </section>
      </article>
    )
  }

  const renderPage = (page: ViewerPage | null, isLeft: boolean, isSingle = false) => {
    if (!page) {
      return <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={false}><div className="w-full h-full bg-slate-50" /></PageWrapper>
    }
    const pageNum = pages.indexOf(page) + 1
    return (
      <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={false} pageNum={pageNum}>
        {renderLandscapeContent(page, pageNum)}
      </PageWrapper>
    )
  }

  const renderPdfPage = (page: ViewerPage, pageNum: number) => (
    <div style={pdfPageBaseStyle}>
      <div style={{ width: FLIPBOOK_PAGE_WIDTH, height: FLIPBOOK_PAGE_HEIGHT, transform: `scale(${PDF_SCALE})`, transformOrigin: 'top left' }}>
        {renderLandscapeContent(page, pageNum)}
      </div>
    </div>
  )
  const renderHalf = (pageIndex: number | null, isLeft: boolean) => {
    if (pageIndex === null) return <div className="w-full h-full bg-transparent" />;
    return (
      <div className="w-full h-full relative bg-white overflow-hidden">
        {renderPage(pages[pageIndex], isLeft, false)}
      </div>
    );
  };

  const getPageIndicatorText = () => {
    if (spreads.length === 0) return '0 / 0';
    const pageIndex = spreads[currentSpreadIndex]?.pages[0];
    return pageIndex === null || pageIndex === undefined ? '' : `${pageIndex + 1} / ${pages.length}`;
  };
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

      <style>{`
        @keyframes flipNextAnim {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes flipPrevAnim {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
        @keyframes pageCurlNextRadius {
          0%   { border-top-right-radius: 0; border-bottom-right-radius: 0; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10); }
          20%  { border-top-right-radius: 3rem; border-bottom-right-radius: 4rem; box-shadow: 0 26px 60px rgba(15, 23, 42, 0.24), inset 18px 0 28px rgba(15, 23, 42, 0.08); }
          55%  { border-top-right-radius: 4rem; border-bottom-right-radius: 6rem; box-shadow: 0 26px 60px rgba(15, 23, 42, 0.24), inset 18px 0 28px rgba(15, 23, 42, 0.08); }
          100% { border-top-right-radius: 0; border-bottom-right-radius: 0; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10); }
        }
        @keyframes pageCurlPrevRadius {
          0%   { border-top-left-radius: 0; border-bottom-left-radius: 0; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10); }
          20%  { border-top-left-radius: 3rem; border-bottom-left-radius: 4rem; box-shadow: 0 26px 60px rgba(15, 23, 42, 0.24), inset -18px 0 28px rgba(15, 23, 42, 0.08); }
          55%  { border-top-left-radius: 4rem; border-bottom-left-radius: 6rem; box-shadow: 0 26px 60px rgba(15, 23, 42, 0.24), inset -18px 0 28px rgba(15, 23, 42, 0.08); }
          100% { border-top-left-radius: 0; border-bottom-left-radius: 0; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.10); }
        }
        .flipping-next {
          animation: flipNextAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          will-change: transform;
        }
        .flipping-prev {
          animation: flipPrevAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          will-change: transform;
        }
        .page-curl-wrapper-next {
          animation: pageCurlNextRadius 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          will-change: border-radius, box-shadow;
        }
        .page-curl-wrapper-prev {
          animation: pageCurlPrevRadius 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          will-change: border-radius, box-shadow;
        }
        .page-curl-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0;
          z-index: 50;
        }
        @keyframes curlOverlayAnim {
          0% { opacity: 0; }
          20% { opacity: 1; }
          55% { opacity: 1; }
          100% { opacity: 0; }
        }
        .next-curl-overlay {
          background: radial-gradient(circle at right center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 28%, rgba(15,23,42,0.18) 62%, transparent 78%);
          animation: curlOverlayAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .next-curl-shadow {
          background: linear-gradient(to right, transparent 0%, rgba(15,23,42,0.05) 85%, rgba(15,23,42,0.15) 100%);
          animation: curlOverlayAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .next-curl-highlight {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.75) 82%, rgba(255,255,255,0.2) 100%);
          animation: curlOverlayAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .prev-curl-overlay {
          background: radial-gradient(circle at left center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.45) 28%, rgba(15,23,42,0.18) 62%, transparent 78%);
          animation: curlOverlayAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .prev-curl-shadow {
          background: linear-gradient(to left, transparent 0%, rgba(15,23,42,0.05) 85%, rgba(15,23,42,0.15) 100%);
          animation: curlOverlayAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .prev-curl-highlight {
          background: linear-gradient(-90deg, transparent 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.75) 82%, rgba(255,255,255,0.2) 100%);
          animation: curlOverlayAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        @keyframes spineShadowAnim {
          0% { opacity: 0; }
          50% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        .page-shadow-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(to right, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 25%);
          animation: spineShadowAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
        .page-shadow-overlay-right {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(to left, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 25%);
          animation: spineShadowAnim 1100ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        }
      `}</style>
      <div 
        className="flex-1 w-full relative overflow-auto student-scrollbar bg-[#f3f4f7] flex flex-col items-center pt-8 pb-10 px-4 md:px-10"
      >
         
         <div className="flex flex-col items-center my-auto shrink-0 w-full">
           <div 
             ref={containerRef}
             className="relative shadow-2xl bg-[#e2e8f0] rounded-none shrink-0 viewerCanvas"
             style={{
                width: BASE_WIDTH * (currentZoom / 100),
                height: BASE_HEIGHT * (currentZoom / 100),
                overflow: 'visible',
                opacity: hasStarted ? 1 : 0.5,
             }}
           >
              <div className="w-full h-full relative book-shell" style={{ perspective: '2400px' }}>
                {isFlipping && targetSpreadIndex !== null && (
                  <div className="absolute inset-0">
                    {renderHalf(spreads[targetSpreadIndex].pages[0], true)}
                  </div>
                )}

                {!isFlipping && (
                  <div className="absolute inset-0">
                    {renderHalf(spreads[currentSpreadIndex].pages[0], true)}
                  </div>
                )}

                {isFlipping && targetSpreadIndex !== null && (
                  <div className="absolute inset-0 pointer-events-none z-30">
                    <div
                      className={`absolute inset-0 flipping-page ${flipDirection === 'next' ? 'flipping-next' : 'flipping-prev'}`}
                      style={{
                        transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      <div className="absolute inset-0 bg-white overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                        {renderHalf(spreads[currentSpreadIndex].pages[0], true)}
                      </div>
                      <div className="absolute inset-0 bg-white overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        {renderHalf(spreads[targetSpreadIndex].pages[0], true)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
           </div>
           {/* Bottom Player Bar */}
           {hasStarted && (
             <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg z-50 transition-all shrink-0 playerWrapper" style={{ backgroundColor: 'rgba(40, 25, 10, 0.88)' }}>
               <button onClick={() => { if (!isFlipping) setCurrentSpreadIndex(0) }} disabled={isFlipping} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="처음으로">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/><path d="M4 17V7"/></svg>
               </button>
               <button onClick={handlePrev} disabled={currentSpreadIndex === 0 || isFlipping} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="이전">
                 <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="bg-white text-slate-900 font-bold px-3 py-1 rounded-md text-sm mx-2 min-w-[60px] text-center font-jua">
                 {getPageIndicatorText()}
               </div>
               <button onClick={handleNext} disabled={currentSpreadIndex === spreads.length - 1 || isFlipping} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="다음">
                 <ArrowRight className="w-5 h-5" />
               </button>
               <button onClick={() => { if (!isFlipping) setCurrentSpreadIndex(spreads.length - 1) }} disabled={isFlipping} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="마지막으로">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/><path d="M20 17V7"/></svg>
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
          width: '1123px',
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        {pages.map((page, index) => (
          <div
            key={`pdf-page-${index}`}
            data-pdf-page="true"
            style={{
              width: '1123px',
              height: '794px',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#ffffff'
            }}
          >
            {renderPdfPage(page, index + 1)}
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
