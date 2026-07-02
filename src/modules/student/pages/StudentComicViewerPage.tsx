import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadComicProjectData, loadComicCutData } from '../components/editor/utils/comicStorage'
import type { ComicProjectData, ComicCutEditData, ComicCutElement } from '../components/editor/utils/comicStorage'
import { projectStorage } from '../utils/projectStorage'
import type { EditorState, CanvasElement } from '../components/editor/types'
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
import StudentZoomControl from '../components/layout/StudentZoomControl'
import SNSBackCoverPreview from '../components/back-cover/SNSBackCoverPreview'
import { Volume2, VolumeX, ArrowLeft, ArrowRight, BookOpen, MoreVertical, ZoomIn, ZoomOut, Maximize, LayoutGrid, PlayCircle, Monitor } from 'lucide-react'
import { COMMON_COVER_TEMPLATES, DEFAULT_COVER_TEMPLATE_ID } from '../data/coverTemplates'
import type { WorldStory, OXQuestion } from '../services/studentUnitSummaryService'
import { supabase } from '../../../shared/lib/supabase'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
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

function ReadonlyFrontElement({ el }: { el: CanvasElement }) {
  if (el.visible === false) return null;
  const isText = el.type === 'text';
  
  return (
    <div
      style={{
        position: 'absolute',
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        transform: `rotate(${el.rotation || 0}deg)`,
        zIndex: el.zIndex,
        pointerEvents: 'none',
        opacity: (el as any).opacity ?? 1,
      }}
    >
      {isText && (
        <div 
          className="w-full h-full flex" 
          style={{ 
            alignItems: el.props.verticalAlign === 'middle' ? 'center' : el.props.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
            justifyContent: el.props.align === 'center' ? 'center' : el.props.align === 'right' ? 'flex-end' : 'flex-start',
            fontFamily: el.props.fontFamily || 'sans-serif',
            fontSize: el.props.fontSize || 24,
            fontWeight: el.props.fontWeight || 'normal',
            color: el.props.fill || '#000',
            WebkitTextStroke: el.props.textStrokeWidth ? `${el.props.textStrokeWidth}px ${el.props.textStrokeColor}` : undefined,
            lineHeight: el.props.lineHeight || 1.2,
            textAlign: el.props.align || 'left',
            whiteSpace: 'pre-wrap'
          }}
        >
          {el.props.text}
        </div>
      )}
    </div>
  )
}

const PDF_PAGE_WIDTH = 794;
const PDF_PAGE_HEIGHT = 1123;
const PDF_SCALE = PDF_PAGE_WIDTH / 1400;

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

function ReadonlyPdfFrontElement({ el }: { el: CanvasElement }) {
  if (el.visible === false) return null;
  const isText = el.type === 'text';
  
  return (
    <div
      style={{
        position: 'absolute',
        left: el.x * PDF_SCALE,
        top: el.y * PDF_SCALE,
        width: el.width * PDF_SCALE,
        height: el.height * PDF_SCALE,
        zIndex: el.zIndex,
        opacity: (el as any).opacity ?? 1,
      }}
    >
      {isText && (
        <div 
          style={{ 
            width: '100%', height: '100%', display: 'flex',
            alignItems: el.props.verticalAlign === 'middle' ? 'center' : el.props.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
            justifyContent: el.props.align === 'center' ? 'center' : el.props.align === 'right' ? 'flex-end' : 'flex-start',
            fontFamily: el.props.fontFamily || 'sans-serif',
            fontSize: (el.props.fontSize || 24) * PDF_SCALE,
            fontWeight: el.props.fontWeight || 'normal',
            color: el.props.fill || '#000000',
            WebkitTextStroke: el.props.textStrokeWidth ? `${el.props.textStrokeWidth * PDF_SCALE}px ${el.props.textStrokeColor}` : undefined,
            lineHeight: el.props.lineHeight || 1.2,
            textAlign: el.props.align || 'left',
            whiteSpace: 'pre-wrap'
          }}
        >
          {el.props.text}
        </div>
      )}
    </div>
  )
}

const PageWrapper = ({ children, isLeft, isRight, isSingle, showNumber, pageNum }: any) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!ref.current) return;
    const resize = () => {
      if (ref.current) {
        setScale(ref.current.clientWidth / 1400); 
      }
    };
    resize();
    const obs = new ResizeObserver(resize);
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`flex-1 h-full bg-white relative overflow-hidden ${isSingle ? 'rounded-none shadow-lg border border-slate-200' : isLeft ? 'rounded-none border-r-0' : isRight ? 'rounded-none border-l border-black/5' : ''} shadow-[inset_0_0_40px_rgba(0,0,0,0.03)]`}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1400, height: 1980, position: 'absolute', top: 0, left: 0 }}>
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
  if (totalCount === 0) return [];
  if (totalCount === 1) return [{ pages: [null, 0] }];
  
  const spreads: Spread[] = [];
  // First page (front cover)
  spreads.push({ pages: [null, 0] });
  
  let i = 1;
  while (i < totalCount - 1) {
    if (i + 1 < totalCount - 1) {
      spreads.push({ pages: [i, i + 1] });
      i += 2;
    } else {
      spreads.push({ pages: [i, null] });
      i += 1;
    }
  }
  
  // Last page (back cover)
  if (i === totalCount - 1) {
    spreads.push({ pages: [totalCount - 1, null] });
  }
  
  return spreads;
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
  
  const [pages, setPages] = useState<ViewerPage[]>([])
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0)
  const [isMusicOn, setIsMusicOn] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  
  const [isPdfDownloading, setIsPdfDownloading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareModalData, setShareModalData] = useState<{ url: string } | null>(null)
  const pdfCaptureRef = useRef<HTMLDivElement>(null)

  const [zoomPercent, setZoomPercent] = useState<number | null>(90)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const audioRef = useRef<HTMLAudioElement>(null)

  const [projectData, setProjectData] = useState<ComicProjectData | null>(null)

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
    if (storedProjectData) setProjectData(storedProjectData);

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
      newPages.push({ type: 'comic-cut', cutNum: i, data: cutData, scriptCut });
    }

    // 8~10. 생활속 이야기
    newPages.push({ type: 'story-history', data: storedSummary?.stories?.history || null });
    newPages.push({ type: 'story-current', data: storedSummary?.stories?.latest || null });
    newPages.push({ type: 'story-life', data: storedSummary?.stories?.life || null });

    // 11~15. OX 문제
    for (let i = 0; i < 5; i++) {
      newPages.push({ type: 'ox-quiz', questionNum: i + 1, data: storedSummary?.questions?.[i] || null });
    }

    // 16. 뒤표지
    newPages.push({ type: 'back-cover', data: storedBackCover });

    setPages(newPages);
  }, [location.state])

  // --- Zoom Logic ---
  const BASE_WIDTH = 1000;
  const BASE_HEIGHT = 707;
  const SCROLL_PADDING = 80;
  
  let fitScale = 1;
  if (containerSize.width > 0 && containerSize.height > 0) {
    const scaleW = (containerSize.width - SCROLL_PADDING * 2) / BASE_WIDTH;
    const scaleH = (containerSize.height - SCROLL_PADDING * 2) / BASE_HEIGHT;
    fitScale = Math.min(scaleW, scaleH);
    fitScale = Math.max(0.6, fitScale); // Minimum 60%
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

  // --- Render Page Type ---
  const renderPage = (page: ViewerPage | null, isLeft: boolean, isSingle: boolean = false) => {
    if (!page) {
      return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={false}>
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50"></div>
        </PageWrapper>
      )
    }

    const pageIndex = pages.indexOf(page);
    const pageNum = pageIndex + 1;

    if (page.type === 'front-cover') {
      const state = page.data;
      if (!state) return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={false}>
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 text-4xl font-bold">아직 앞표지가 저장되지 않았어요.</div>
        </PageWrapper>
      );
      const bgTemplate = COMMON_COVER_TEMPLATES.find(t => t.id === state.coverTemplateId) || COMMON_COVER_TEMPLATES.find(t => t.id === DEFAULT_COVER_TEMPLATE_ID);
      const bgUrl = state.background || bgTemplate?.imageUrl;
      return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={false}>
           <div className="w-full h-full relative bg-white">
             {bgUrl && <img src={bgUrl} className="w-full h-full object-cover" alt="cover bg" />}
             {state.elements.map(el => <ReadonlyFrontElement key={el.id} el={el} />)}
           </div>
        </PageWrapper>
      )
    }

    if (page.type === 'comic-cut') {
      const data = page.data;
      if (!data) return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={true} pageNum={pageNum}>
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-transparent text-4xl font-bold">아직 {page.cutNum}컷이 저장되지 않았어요.</div>
        </PageWrapper>
      );
      return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={true} pageNum={pageNum}>
           <div className="w-full h-full flex flex-col items-center bg-transparent comic-cut-page-content" style={{ paddingTop: '100px', paddingBottom: '48px', paddingLeft: '80px', paddingRight: '80px' }}>
             <div className="text-[50px] font-jua text-[#303442] mb-[14px] bg-[#f3f4f7] py-8 px-12 rounded-[40px] w-[90%] max-w-[1200px] border border-[#d9deea] break-keep comic-cut-description">
               {page.cutNum}컷. {page.scriptCut?.sceneDescription || '장면'}
             </div>
             <div 
               className="w-[90%] max-w-[1200px] bg-white shadow-xl border-[12px] border-[#dbeafe] rounded-[40px] relative overflow-hidden shrink-0 comic-read-cut-frame"
               style={{ width: '100%', height: 'auto', aspectRatio: '343 / 251' }}
             >
                {data.backgroundImageUrl ? (
                  <img src={data.backgroundImageUrl} className="absolute inset-0 w-full h-full object-contain block mx-auto" alt="cut bg" />
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center text-[50px] text-slate-400 font-bold bg-slate-50">그림 없음</div>
                )}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                   <div style={{ transform: `scale(${1176 / 1400})`, transformOrigin: 'top left', width: 1400, height: 1400 * 251 / 343, position: 'absolute', top: 0, left: 0 }}>
                     {data.elements?.map(el => <ReadonlyElement key={el.id} el={el} />)}
                   </div>
                </div>
             </div>
           </div>
        </PageWrapper>
      )
    }

    if (page.type.startsWith('story-')) {
      const data = page.data;
      const typeLabel = page.type === 'story-history' ? '역사 이야기' : page.type === 'story-current' ? '최신 이야기' : '생활 연결';
      const colorClass = page.type === 'story-history' ? 'bg-purple-50 text-purple-600 border-purple-200' : page.type === 'story-current' ? 'bg-sky-50 text-sky-600 border-sky-200' : 'bg-teal-50 text-teal-600 border-teal-200';
      
      if (!data) return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={true} pageNum={pageNum}>
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-transparent text-4xl font-bold">아직 {typeLabel}가 없어요.</div>
        </PageWrapper>
      );
      return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={true} pageNum={pageNum}>
           <div className="w-full h-full flex flex-col bg-transparent" style={{ paddingTop: '100px', paddingLeft: '80px', paddingRight: '80px', paddingBottom: '64px' }}>
             <div className={`text-[45px] font-jua mb-12 py-4 px-10 rounded-full self-start border-[3px] ${colorClass}`}>
               세상 속 이야기 - {typeLabel}
             </div>
             <h2 className="text-[60px] font-jua text-[#303442] mb-10 leading-tight break-keep w-full">{data.title}</h2>
             <p className="text-[36px] text-[#555b6b] leading-[1.8] font-medium whitespace-pre-wrap break-keep w-full">{data.content}</p>
           </div>
        </PageWrapper>
      )
    }

    if (page.type === 'ox-quiz') {
      const data = page.data;
      if (!data) return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={true} pageNum={pageNum}>
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-transparent text-4xl font-bold">아직 OX 문제 {page.questionNum}가 없어요.</div>
        </PageWrapper>
      );
      return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={true} pageNum={pageNum}>
           <div className="w-full h-full flex flex-col bg-transparent relative" style={{ paddingTop: '100px', paddingLeft: '80px', paddingRight: '80px', paddingBottom: '100px' }}>
             <div className="text-[45px] font-jua mb-12 py-4 px-10 rounded-full self-start border-[3px] bg-pink-50 text-pink-600 border-pink-200">
               팡팡! OX 퀴즈 {page.questionNum}
             </div>
             <div className="w-full bg-[#f8f9fc] rounded-[40px] p-[60px] border-[4px] border-[#d9deea] flex-1 flex flex-col quiz-card">
                <h2 className="text-[54px] font-bold text-[#303442] mb-auto leading-[1.6] break-keep">Q. {data.question}</h2>
                <div className="mt-auto flex flex-col gap-8">
                  <div className="text-[40px] font-bold text-[#8b909e] text-center border-t-[3px] border-dashed border-[#d9deea] pt-12 pb-4">
                    아래 영역을 확인해보세요!
                  </div>
                  <div className="bg-white rounded-[30px] p-8 border-2 border-[#e2e8f0] shadow-sm">
                    <p className="text-[32px] font-bold">정답: <span className={data.answer === 'O' ? 'text-blue-500' : 'text-red-500'}>{data.answer}</span></p>
                  </div>
                </div>
             </div>
           </div>
        </PageWrapper>
      )
    }

    if (page.type === 'back-cover') {
      const data = page.data;
      if (!data) return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={false}>
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 text-4xl font-bold">아직 뒤표지가 저장되지 않았어요.</div>
        </PageWrapper>
      );
      
      const bgColor = data.bgColor || '#f3f4f7';
      const bgOpacity = data.bgOpacity ?? 1;
      const rgbaBg = hexToRgba(bgColor, bgOpacity);

      return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle} showNumber={false}>
           <div className="w-full h-full bg-white flex flex-col">
             <SNSBackCoverPreview
               studentName={data.authorName || '-'}
               gradeClass={data.gradeClassInfo || '-'}
               completionDate={data.createdDate || '-'}
               subject={data.subjectName || '-'}
               unit={data.unitName || '-'}
               topic={data.topicName || '-'}
               backgroundColor={rgbaBg}
             />
           </div>
        </PageWrapper>
      )
    }

    return null;
  }

  const renderPdfPage = (page: ViewerPage | null, pageNum: number) => {
    if (!page) {
      return <div style={pdfPageBaseStyle}></div>
    }

    if (page.type === 'front-cover') {
      const state = page.data;
      if (!state) return (
        <div style={{ ...pdfPageBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#94a3b8' }}>아직 앞표지가 저장되지 않았어요.</div>
      );
      const bgTemplate = COMMON_COVER_TEMPLATES.find(t => t.id === state.coverTemplateId) || COMMON_COVER_TEMPLATES.find(t => t.id === DEFAULT_COVER_TEMPLATE_ID);
      const bgUrl = state.background || bgTemplate?.imageUrl;
      return (
        <div style={{ ...pdfPageBaseStyle }}>
           <div style={{ width: '100%', height: '100%', position: 'relative' }}>
             {bgUrl && <img src={bgUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="cover bg" />}
             {state.elements.map(el => <ReadonlyPdfFrontElement key={el.id} el={el} />)}
           </div>
        </div>
      )
    }

    if (page.type === 'comic-cut') {
      const data = page.data;
      if (!data) return (
        <div style={{ ...pdfPageBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#94a3b8' }}>아직 {page.cutNum}컷이 저장되지 않았어요.</div>
      );
      
      const pt = 100 * PDF_SCALE;
      const px = 80 * PDF_SCALE;
      const pb = 48 * PDF_SCALE;
      const frameWidth = PDF_PAGE_WIDTH - (px * 2);
      const frameHeight = frameWidth * (44 / 67);
      const innerScale = frameWidth / 1400;

      return (
        <div style={{ ...pdfPageBaseStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: `${pt}px`, paddingLeft: `${px}px`, paddingRight: `${px}px`, paddingBottom: `${pb}px`, backgroundColor: '#ffffff' }}>
          {pageNum >= 2 && pageNum <= 15 && (
            <img src="/images/toonschool/flipbook/page-border-doodle.png" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.05, objectFit: 'fill', zIndex: 0 }} alt="" />
          )}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: `${50 * PDF_SCALE}px`, fontFamily: 'Jua, sans-serif', color: '#303442', marginBottom: `${14 * PDF_SCALE}px`, backgroundColor: '#f3f4f7', padding: `${32 * PDF_SCALE}px ${48 * PDF_SCALE}px`, borderRadius: `${40 * PDF_SCALE}px`, width: '100%', border: '1px solid #d9deea', wordBreak: 'keep-all', boxSizing: 'border-box' }}>
              {page.cutNum}컷. {page.scriptCut?.sceneDescription || '장면'}
            </div>
            
            <div style={{ width: `${frameWidth}px`, height: `${frameHeight}px`, backgroundColor: '#ffffff', border: `${12 * PDF_SCALE}px solid #dbeafe`, borderRadius: `${40 * PDF_SCALE}px`, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
              {data.backgroundImageUrl ? (
                <img src={data.backgroundImageUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="cut bg" />
              ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: `${50 * PDF_SCALE}px`, color: '#94a3b8', backgroundColor: '#f8fafc' }}>그림 없음</div>
              )}
              
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                {data.elements?.map(el => (
                   <div key={el.id} style={{
                     position: 'absolute',
                     left: el.x * innerScale,
                     top: el.y * innerScale,
                     width: el.width * innerScale,
                     height: el.height * innerScale,
                     zIndex: el.zIndex
                   }}>
                     {el.type === 'character' && el.imageUrl && (
                       <img src={el.imageUrl} alt="character" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                     )}
                     {el.type === 'speechBubble' && (
                       <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#ffffff', border: `${4 * innerScale}px solid #1e293b`, borderRadius: `${24 * innerScale}px` }} />
                         <p style={{ position: 'relative', zIndex: 10, color: '#1e293b', fontWeight: 'bold', textAlign: 'center', padding: `0 ${16 * innerScale}px`, margin: 0, fontSize: `${(el.style?.fontSize || 16) * innerScale}px`, wordBreak: 'keep-all', lineHeight: 1.4 }}>
                           {el.text}
                         </p>
                       </div>
                     )}
                   </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: `${24 * PDF_SCALE}px`, right: `${32 * PDF_SCALE}px`, color: '#94a3b8', fontWeight: 'bold', fontFamily: 'Jua, sans-serif', fontSize: '12pt', zIndex: 2 }}>
            - {pageNum} -
          </div>
        </div>
      )
    }

    if (page.type.startsWith('story-')) {
      const data = page.data;
      const typeLabel = page.type === 'story-history' ? '역사 이야기' : page.type === 'story-current' ? '최신 이야기' : '생활 연결';
      const isHistory = page.type === 'story-history';
      const isCurrent = page.type === 'story-current';
      const bgColor = isHistory ? '#f5f3ff' : isCurrent ? '#f0f9ff' : '#f0fdfa';
      const textColor = isHistory ? '#9333ea' : isCurrent ? '#0284c7' : '#0d9488';
      const borderColor = isHistory ? '#e9d5ff' : isCurrent ? '#bae6fd' : '#ccfbf1';
      
      if (!data) return (
        <div style={{ ...pdfPageBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#94a3b8' }}>아직 {typeLabel}가 없어요.</div>
      );

      const pt = 100 * PDF_SCALE;
      const px = 80 * PDF_SCALE;
      const pb = 64 * PDF_SCALE;

      return (
        <div style={{ ...pdfPageBaseStyle, display: 'flex', flexDirection: 'column', paddingTop: `${pt}px`, paddingLeft: `${px}px`, paddingRight: `${px}px`, paddingBottom: `${pb}px`, backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
          {pageNum >= 2 && pageNum <= 15 && (
            <img src="/images/toonschool/flipbook/page-border-doodle.png" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.05, objectFit: 'fill', zIndex: 0 }} alt="" />
          )}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: `${45 * PDF_SCALE}px`, fontFamily: 'Jua, sans-serif', marginBottom: `${48 * PDF_SCALE}px`, padding: `${16 * PDF_SCALE}px ${40 * PDF_SCALE}px`, borderRadius: '9999px', alignSelf: 'flex-start', border: `3px solid ${borderColor}`, backgroundColor: bgColor, color: textColor }}>
              세상 속 이야기 - {typeLabel}
            </div>
            <h2 style={{ fontSize: `${60 * PDF_SCALE}px`, fontFamily: 'Jua, sans-serif', color: '#303442', marginBottom: `${40 * PDF_SCALE}px`, lineHeight: 1.2, wordBreak: 'keep-all', margin: 0 }}>{data.title}</h2>
            <p style={{ fontSize: `${36 * PDF_SCALE}px`, color: '#555b6b', lineHeight: 1.8, fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'keep-all', margin: 0 }}>{data.content}</p>
          </div>
          <div style={{ position: 'absolute', bottom: `${24 * PDF_SCALE}px`, right: `${32 * PDF_SCALE}px`, color: '#94a3b8', fontWeight: 'bold', fontFamily: 'Jua, sans-serif', fontSize: '12pt', zIndex: 2 }}>
            - {pageNum} -
          </div>
        </div>
      )
    }

    if (page.type === 'ox-quiz') {
      const data = page.data;
      if (!data) return (
        <div style={{ ...pdfPageBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#94a3b8' }}>아직 OX 문제 {page.questionNum}가 없어요.</div>
      );
      
      const pt = 100 * PDF_SCALE;
      const px = 80 * PDF_SCALE;
      const pb = 100 * PDF_SCALE;

      return (
        <div style={{ ...pdfPageBaseStyle, display: 'flex', flexDirection: 'column', paddingTop: `${pt}px`, paddingLeft: `${px}px`, paddingRight: `${px}px`, paddingBottom: `${pb}px`, backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
          {pageNum >= 2 && pageNum <= 15 && (
            <img src="/images/toonschool/flipbook/page-border-doodle.png" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.05, objectFit: 'fill', zIndex: 0 }} alt="" />
          )}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ fontSize: `${45 * PDF_SCALE}px`, fontFamily: 'Jua, sans-serif', marginBottom: `${48 * PDF_SCALE}px`, padding: `${16 * PDF_SCALE}px ${40 * PDF_SCALE}px`, borderRadius: '9999px', alignSelf: 'flex-start', border: `3px solid #fbcfe8`, backgroundColor: '#fdf2f8', color: '#db2777' }}>
              팡팡! OX 퀴즈 {page.questionNum}
            </div>
            
            <div style={{ backgroundColor: '#f8f9fc', borderRadius: `${40 * PDF_SCALE}px`, padding: `${60 * PDF_SCALE}px`, border: `${4 * PDF_SCALE}px solid #d9deea`, flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
               <h2 style={{ fontSize: `${54 * PDF_SCALE}px`, fontWeight: 'bold', color: '#303442', marginBottom: 'auto', lineHeight: 1.6, wordBreak: 'keep-all', margin: 0 }}>Q. {data.question}</h2>
               
               <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: `${32 * PDF_SCALE}px` }}>
                 <div style={{ fontSize: `${40 * PDF_SCALE}px`, fontWeight: 'bold', color: '#8b909e', textAlign: 'center', borderTop: `${3 * PDF_SCALE}px dashed #d9deea`, paddingTop: `${48 * PDF_SCALE}px`, paddingBottom: `${16 * PDF_SCALE}px` }}>
                   아래 영역을 확인해보세요!
                 </div>
                 <div style={{ backgroundColor: '#ffffff', borderRadius: `${30 * PDF_SCALE}px`, padding: `${32 * PDF_SCALE}px`, border: `${2 * PDF_SCALE}px solid #e2e8f0` }}>
                   <p style={{ fontSize: `${32 * PDF_SCALE}px`, fontWeight: 'bold', margin: 0 }}>정답: <span style={{ color: data.answer === 'O' ? '#3b82f6' : '#ef4444' }}>{data.answer}</span></p>
                 </div>
               </div>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: `${24 * PDF_SCALE}px`, right: `${32 * PDF_SCALE}px`, color: '#94a3b8', fontWeight: 'bold', fontFamily: 'Jua, sans-serif', fontSize: '12pt', zIndex: 2 }}>
            - {pageNum} -
          </div>
        </div>
      )
    }

    if (page.type === 'back-cover') {
      const data = page.data;
      if (!data) return (
        <div style={{ ...pdfPageBaseStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#94a3b8' }}>아직 뒤표지가 저장되지 않았어요.</div>
      );
      
      const bgColor = data.bgColor || '#f3f4f7';
      const bgOpacity = data.bgOpacity ?? 1;
      const rgbaBg = hexToRgba(bgColor, bgOpacity);

      const infoParts = [
        data.authorName && `지은이 : ${data.authorName}`,
        data.gradeClassInfo && `학년 : ${data.gradeClassInfo}`,
        data.subjectName && `과목 : ${data.subjectName}`,
        data.unitName && `단원 : ${data.unitName}`,
        data.topicName && `주제 : ${data.topicName}`,
        data.createdDate && `발행일 : ${data.createdDate}`
      ].filter(Boolean);

      return (
        <div style={{ ...pdfPageBaseStyle, backgroundColor: rgbaBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '95%', height: '95%', position: 'relative' }}>
             <img src="/images/toonschool/back-covers/back-cover-sns-default.webp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="back cover template" />
             <div style={{ position: 'absolute', left: '4%', right: '4%', bottom: '11.5%', display: 'flex', justifyContent: 'center' }}>
               <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: 500, textAlign: 'center', whiteSpace: 'nowrap' }}>
                 {infoParts.join(' | ')}
               </div>
             </div>
          </div>
        </div>
      )
    }

    return <div style={pdfPageBaseStyle}></div>;
  }

  const renderHalf = (pageIndex: number | null, isLeft: boolean) => {
    if (pageIndex === null) {
      return <div className={`w-full h-full ${isLeft ? 'rounded-none' : 'rounded-none'} bg-transparent`} />;
    }
    return (
      <div className={`w-full h-full relative bg-white ${isLeft ? 'rounded-none border-r border-black/10' : 'rounded-none border-l border-black/5'} overflow-hidden`}>
        {renderPage(pages[pageIndex], isLeft, false)}
        {/* Spine shadow */}
        <div className={`absolute top-0 ${isLeft ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} w-12 h-full from-black/10 to-transparent pointer-events-none mix-blend-multiply opacity-50`} />
      </div>
    );
  };

  const getPageIndicatorText = () => {
    if (spreads.length === 0) return '0 / 0';
    const spread = spreads[currentSpreadIndex];
    if (!spread) return '';
    
    const p1 = spread.pages[0];
    const p2 = spread.pages[1];
    
    if (p1 === null && p2 !== null) {
      return `${p2 + 1} / ${pages.length}`;
    } else if (p1 !== null && p2 === null) {
      return `${p1 + 1} / ${pages.length}`;
    } else if (p1 !== null && p2 !== null) {
      return `${p1 + 1}-${p2 + 1} / ${pages.length}`;
    }
    return '';
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
        orientation: 'portrait',
        unit: 'px',
        format: [794, 1123],
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
          pdf.addPage([794, 1123], 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, 794, 1123);
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

      const { error: insertError } = await supabase
        .from('shared_comic_books')
        .insert({
          slug,
          project_id: currentProjectId,
          title: topicName || '툰스쿨 만화',
          student_name: authorName,
          grade: gradeClassInfo,
          thumbnail_url: thumbnailUrl,
          pages: uploadedPages,
          is_public: true
        });

      if (insertError) throw insertError;

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
              {/* flipBookStage: perspective 컨테이너 */}
              <div className="w-full h-full relative rounded-none book-shell" style={{ perspective: '2400px' }}>
                {/* Base Layer: Target Spread (Always visible behind) */}
                {isFlipping && targetSpreadIndex !== null && (
                  <div className="absolute inset-0 flex rounded-none book-spread">
                    <div className="w-1/2 h-full book-page-left">
                      {renderHalf(spreads[targetSpreadIndex].pages[0], true)}
                    </div>
                    <div className="w-1/2 h-full book-page-right">
                      {renderHalf(spreads[targetSpreadIndex].pages[1], false)}
                    </div>
                  </div>
                )}

                {/* Middle Layer: Current Spread */}
                <div className="absolute inset-0 flex rounded-none pointer-events-auto book-spread">
                  {/* Left Side */}
                  <div 
                    className={`w-1/2 h-full relative book-page book-page-left ${isFlipping ? 'cursor-progress' : (currentSpreadIndex > 0 ? 'cursor-pointer' : 'cursor-default')}`} 
                    onClick={(e) => { e.stopPropagation(); if (!isFlipping) handlePrev(); }}
                    title={currentSpreadIndex > 0 ? "이전 페이지로 이동" : undefined}
                    aria-label={currentSpreadIndex > 0 ? "이전 페이지로 이동" : undefined}
                  >
                    {(!isFlipping || flipDirection === 'next') && renderHalf(spreads[currentSpreadIndex].pages[0], true)}
                  </div>
                  
                  {/* Right Side */}
                  <div 
                    className={`w-1/2 h-full relative book-page book-page-right ${isFlipping ? 'cursor-progress' : (currentSpreadIndex < spreads.length - 1 ? 'cursor-pointer' : 'cursor-default')}`}
                    onClick={(e) => { e.stopPropagation(); if (!isFlipping) handleNext(); }}
                    title={currentSpreadIndex < spreads.length - 1 ? "다음 페이지로 이동" : undefined}
                    aria-label={currentSpreadIndex < spreads.length - 1 ? "다음 페이지로 이동" : undefined}
                  >
                    {(!isFlipping || flipDirection === 'prev') && renderHalf(spreads[currentSpreadIndex].pages[1], false)}
                  </div>
                </div>

                {/* Flipping Layer */}
                {isFlipping && targetSpreadIndex !== null && (
                  <div className="absolute inset-0 pointer-events-none z-30">
                    {flipDirection === 'next' && (
                      <div 
                        className="absolute right-0 w-1/2 h-full flipping-page flipping-next"
                        style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
                      >
                        <div className="absolute inset-0 bg-white rounded-none page-curl-wrapper-next overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                          {renderHalf(spreads[currentSpreadIndex].pages[1], false)}
                          <div className="page-curl-overlay next-curl-overlay"></div>
                          <div className="page-curl-overlay next-curl-shadow"></div>
                          <div className="page-curl-overlay next-curl-highlight"></div>
                        </div>
                        <div className="absolute inset-0 bg-white rounded-none overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          {renderHalf(spreads[targetSpreadIndex].pages[0], true)}
                          <div className="page-shadow-overlay-right"></div>
                        </div>
                      </div>
                    )}
                    
                    {flipDirection === 'prev' && (
                      <div 
                        className="absolute left-0 w-1/2 h-full flipping-page flipping-prev"
                        style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
                      >
                        <div className="absolute inset-0 bg-white rounded-none page-curl-wrapper-prev overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                          {renderHalf(spreads[currentSpreadIndex].pages[0], true)}
                          <div className="page-curl-overlay prev-curl-overlay"></div>
                          <div className="page-curl-overlay prev-curl-shadow"></div>
                          <div className="page-curl-overlay prev-curl-highlight"></div>
                        </div>
                        <div className="absolute inset-0 bg-white rounded-none overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(-180deg)' }}>
                          {renderHalf(spreads[targetSpreadIndex].pages[1], false)}
                          <div className="page-shadow-overlay"></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Center Spine Shadow (Static) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full bg-gradient-to-r from-black/10 via-transparent to-black/10 z-40 pointer-events-none mix-blend-multiply opacity-60" />
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
          width: '794px',
          pointerEvents: 'none',
          zIndex: -1
        }}
      >
        {pages.map((page, index) => (
          <div
            key={`pdf-page-${index}`}
            data-pdf-page="true"
            style={{
              width: '794px',
              height: '1123px',
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
