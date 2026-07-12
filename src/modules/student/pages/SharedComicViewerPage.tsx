import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import StudentZoomControl from '../components/layout/StudentZoomControl'
import { Volume2, VolumeX, ArrowLeft, ArrowRight, BookOpen, MoreVertical, ZoomIn, ZoomOut, Maximize, PlayCircle, Monitor, Copy } from 'lucide-react'
import { supabase } from '../../../shared/lib/supabase'

const BGM_PATH = '/audio/viewer/if-i-had-a-chicken.mp3';

type SharedPage = {
  pageNumber: number;
  type: string;
  imageUrl: string;
};

type Spread = { pages: [number | null, number | null] };

const getSpreads = (totalCount: number, isSingle: boolean): Spread[] => {
  if (totalCount === 0) return [];
  if (isSingle) {
    return Array.from({ length: totalCount }).map((_, i) => ({ pages: [i, null] }));
  }
  if (totalCount === 1) return [{ pages: [null, 0] }];
  const spreads: Spread[] = [];
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
  if (i === totalCount - 1) {
    spreads.push({ pages: [totalCount - 1, null] });
  }
  return spreads;
};

const PageWrapper = ({ children, isLeft, isRight, isSingle }: any) => {
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
    <div ref={ref} className={`flex-1 h-full bg-white relative overflow-hidden ${isSingle ? 'rounded-[12px] shadow-md border border-slate-200/50' : isLeft ? 'rounded-none border-r-0' : isRight ? 'rounded-none border-l border-black/5' : ''} shadow-[inset_0_0_40px_rgba(0,0,0,0.03)]`}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1400, height: 1980, position: 'absolute', top: 0, left: 0 }}>
        <div className="relative z-10 w-full h-full bg-white">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function SharedComicViewerPage() {
  const { slug } = useParams()
  
  const [pages, setPages] = useState<SharedPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0)
  const [isMusicOn, setIsMusicOn] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  
  const [zoomPercent, setZoomPercent] = useState<number | null>(90)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const audioRef = useRef<HTMLAudioElement>(null)

  const [showMenu, setShowMenu] = useState(false)
  const [isAutoFlip, setIsAutoFlip] = useState(false)
  const autoFlipTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null)
  const [targetSpreadIndex, setTargetSpreadIndex] = useState<number | null>(null)

  const [isSinglePageMode, setIsSinglePageMode] = useState(false)
  const prevSingleModeRef = useRef(isSinglePageMode)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  useEffect(() => {
    const checkMode = () => {
      const isMobileOrPortrait = window.innerWidth <= 768 || (window.innerWidth <= 1024 && window.innerHeight > window.innerWidth);
      setIsSinglePageMode(isMobileOrPortrait);
      setWindowWidth(window.innerWidth);
    };
    checkMode();
    window.addEventListener('resize', checkMode);
    return () => window.removeEventListener('resize', checkMode);
  }, []);

  const spreads = getSpreads(pages.length, isSinglePageMode)

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
    if (pages.length === 0) return;
    if (prevSingleModeRef.current !== isSinglePageMode) {
      const oldSpreads = getSpreads(pages.length, prevSingleModeRef.current);
      const currentSpread = oldSpreads[currentSpreadIndexRef.current];
      if (currentSpread) {
        const pageViewing = currentSpread.pages[0] !== null ? currentSpread.pages[0] : currentSpread.pages[1];
        if (pageViewing !== null) {
          const newSpreads = getSpreads(pages.length, isSinglePageMode);
          const newIndex = newSpreads.findIndex(s => s.pages[0] === pageViewing || s.pages[1] === pageViewing);
          if (newIndex !== -1) {
            setCurrentSpreadIndex(newIndex);
          }
        }
      }
      prevSingleModeRef.current = isSinglePageMode;
    }
  }, [isSinglePageMode, pages.length]);

  useEffect(() => {
    const fetchSharedComic = async () => {
      if (!slug) return;
      setIsLoading(true);
      setErrorMsg('');
      try {
        const { data, error } = await supabase
          .from('shared_comic_books')
          .select('*')
          .eq('slug', slug)
          .eq('is_public', true)
          .single();
          
        if (error || !data) {
          setErrorMsg('공유된 책을 찾을 수 없어요.');
          return;
        }
        
        if (data.pages && Array.isArray(data.pages)) {
          setPages(data.pages);
        } else {
          setErrorMsg('플립북 데이터에 오류가 있습니다.');
        }
      } catch (err) {
        setErrorMsg('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSharedComic();
  }, [slug])

  const BASE_WIDTH = isSinglePageMode ? 500 : 1000;
  const BASE_HEIGHT = 707;
  const SCROLL_PADDING = isSinglePageMode ? 16 : 32;
  
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
    if (isMusicOn) stopMusic();
    else playMusic();
  };

  const startViewer = () => {
    setHasStarted(true);
    playMusic();
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const handleNext = () => {
    if (!hasTriedMusicRef.current && !isMusicOn) playMusic();
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

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f3f4f7]">
        <div className="text-center px-6">
          <div className="text-6xl mb-6 animate-pulse">⏳</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">플립북을 불러오는 중이에요...</h2>
        </div>
      </div>
    )
  }

  if (errorMsg || pages.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f3f4f7]">
        <div className="text-center px-6">
          <div className="text-6xl mb-6">😢</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">{errorMsg || '공유된 책을 찾을 수 없어요.'}</h2>
          <p className="text-slate-500 mb-8">링크가 올바른지 다시 한 번 확인해 주세요.</p>
        </div>
      </div>
    )
  }

  const renderPage = (page: SharedPage | null, isLeft: boolean, isSingle: boolean = false) => {
    if (!page) {
      return (
        <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle}>
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50"></div>
        </PageWrapper>
      )
    }

    return (
      <PageWrapper isLeft={isLeft} isRight={!isLeft} isSingle={isSingle}>
         <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-cover" />
      </PageWrapper>
    )
  }

  const renderHalf = (pageIndex: number | null, isLeft: boolean, isSingle = false) => {
    if (pageIndex === null) {
      return <div className={`w-full h-full ${isLeft ? 'rounded-none' : 'rounded-none'} bg-transparent`} />;
    }
    return (
      <div className={`w-full h-full relative bg-white ${isSingle ? 'rounded-[12px]' : isLeft ? 'rounded-none border-r border-black/10' : 'rounded-none border-l border-black/5'} overflow-hidden`}>
        {renderPage(pages[pageIndex], isLeft, isSingle)}
        {!isSingle && <div className={`absolute top-0 ${isLeft ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} w-12 h-full from-black/10 to-transparent pointer-events-none mix-blend-multiply opacity-50`} />}
      </div>
    );
  };

  const getPageIndicatorText = () => {
    if (spreads.length === 0) return '0 / 0';
    const spread = spreads[currentSpreadIndex];
    if (!spread) return '';
    
    if (isSinglePageMode) {
       const p = spread.pages[0];
       if (p === null) return `0 / ${pages.length}`;
       return `${p + 1} / ${pages.length}`;
    }

    const p1 = spread.pages[0];
    const p2 = spread.pages[1];
    if (p1 === null && p2 !== null) return `${p2 + 1} / ${pages.length}`;
    else if (p1 !== null && p2 === null) return `${p1 + 1} / ${pages.length}`;
    else if (p1 !== null && p2 !== null) return `${p1 + 1}-${p2 + 1} / ${pages.length}`;
    return '';
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    } catch (err) {
      alert('링크 복사에 실패했습니다.');
    }
  };

  return (
    <div className="w-full h-[100dvh] relative overflow-hidden bg-[#f3f4f7] flex flex-col">
      <audio ref={audioRef} src={BGM_PATH} preload="auto" loop />

      {!hasStarted && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
          <div className="bg-white rounded-[40px] p-16 shadow-2xl flex flex-col items-center max-w-[800px] text-center border-[8px] border-purple-100 animate-in zoom-in duration-300">
            <h1 className="text-[#303442] text-[36px] font-jua mb-8 leading-normal">
              친구가 만든 만화책이<br/>도착했어요!
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
        className="flex-1 w-full relative overflow-auto student-scrollbar bg-[#f3f4f7] flex flex-col items-center pt-4 pb-8 px-2 md:px-8"
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
              <div className="w-full h-full relative rounded-none book-shell" style={{ perspective: '2400px' }}>
                {isFlipping && targetSpreadIndex !== null && (
                  <div className="absolute inset-0 flex rounded-none book-spread">
                    <div className={`${isSinglePageMode ? 'w-full' : 'w-1/2'} h-full book-page-left`}>
                      {renderHalf(spreads[targetSpreadIndex].pages[0], true, isSinglePageMode)}
                    </div>
                    {!isSinglePageMode && (
                      <div className="w-1/2 h-full book-page-right">
                        {renderHalf(spreads[targetSpreadIndex].pages[1], false, isSinglePageMode)}
                      </div>
                    )}
                  </div>
                )}

                <div className="absolute inset-0 flex rounded-none pointer-events-auto book-spread">
                  <div 
                    className={`${isSinglePageMode ? 'w-full' : 'w-1/2'} h-full relative book-page book-page-left ${isFlipping ? 'cursor-progress' : (currentSpreadIndex > 0 ? 'cursor-pointer' : 'cursor-default')}`} 
                    onClick={(e) => { e.stopPropagation(); if (!isFlipping) handlePrev(); }}
                  >
                    {(!isFlipping || flipDirection === 'next') && renderHalf(spreads[currentSpreadIndex].pages[0], true, isSinglePageMode)}
                  </div>
                  
                  {!isSinglePageMode && (
                    <div 
                      className={`w-1/2 h-full relative book-page book-page-right ${isFlipping ? 'cursor-progress' : (currentSpreadIndex < spreads.length - 1 ? 'cursor-pointer' : 'cursor-default')}`}
                      onClick={(e) => { e.stopPropagation(); if (!isFlipping) handleNext(); }}
                    >
                      {(!isFlipping || flipDirection === 'prev') && renderHalf(spreads[currentSpreadIndex].pages[1], false, isSinglePageMode)}
                    </div>
                  )}
                </div>

                {isFlipping && targetSpreadIndex !== null && (
                  <div className="absolute inset-0 pointer-events-none z-30 flex justify-center">
                    {flipDirection === 'next' && (
                      <div 
                        className={`absolute ${isSinglePageMode ? 'w-full right-0' : 'w-1/2 right-0'} h-full flipping-page flipping-next`}
                        style={{ transformOrigin: isSinglePageMode ? 'center center' : 'left center', transformStyle: 'preserve-3d' }}
                      >
                        <div className="absolute inset-0 bg-white rounded-none page-curl-wrapper-next overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                          {renderHalf(spreads[currentSpreadIndex].pages[isSinglePageMode ? 0 : 1], false, isSinglePageMode)}
                          <div className="page-curl-overlay next-curl-overlay"></div>
                          <div className="page-curl-overlay next-curl-shadow"></div>
                          <div className="page-curl-overlay next-curl-highlight"></div>
                        </div>
                        <div className="absolute inset-0 bg-white rounded-none overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                          {renderHalf(spreads[targetSpreadIndex].pages[0], true, isSinglePageMode)}
                          {!isSinglePageMode && <div className="page-shadow-overlay-right"></div>}
                        </div>
                      </div>
                    )}
                    
                    {flipDirection === 'prev' && (
                      <div 
                        className={`absolute ${isSinglePageMode ? 'w-full left-0' : 'w-1/2 left-0'} h-full flipping-page flipping-prev`}
                        style={{ transformOrigin: isSinglePageMode ? 'center center' : 'right center', transformStyle: 'preserve-3d' }}
                      >
                        <div className="absolute inset-0 bg-white rounded-none page-curl-wrapper-prev overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                          {renderHalf(spreads[currentSpreadIndex].pages[0], true, isSinglePageMode)}
                          <div className="page-curl-overlay prev-curl-overlay"></div>
                          <div className="page-curl-overlay prev-curl-shadow"></div>
                          <div className="page-curl-overlay prev-curl-highlight"></div>
                        </div>
                        <div className="absolute inset-0 bg-white rounded-none overflow-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(-180deg)' }}>
                          {renderHalf(spreads[targetSpreadIndex].pages[isSinglePageMode ? 0 : 1], false, isSinglePageMode)}
                          {!isSinglePageMode && <div className="page-shadow-overlay"></div>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isSinglePageMode && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full bg-gradient-to-r from-black/10 via-transparent to-black/10 z-40 pointer-events-none mix-blend-multiply opacity-60" />}
              </div>
           </div>

           {hasStarted && (
             <div className="mt-4 flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-md z-50 transition-all shrink-0 playerWrapper border border-white/10" style={{ backgroundColor: 'rgba(30, 34, 45, 0.75)', backdropFilter: 'blur(8px)' }}>
               {windowWidth > 600 && (
                 <button onClick={() => { if (!isFlipping) setCurrentSpreadIndex(0) }} disabled={isFlipping} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="처음으로">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/><path d="M4 17V7"/></svg>
                 </button>
               )}
               <button onClick={handlePrev} disabled={currentSpreadIndex === 0 || isFlipping} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="이전">
                 <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="bg-white/90 text-slate-800 font-bold px-2 md:px-3 py-1 rounded md:rounded-md text-xs md:text-sm mx-1 md:mx-2 min-w-[50px] md:min-w-[60px] text-center font-jua">
                 {getPageIndicatorText()}
               </div>
               <button onClick={handleNext} disabled={currentSpreadIndex === spreads.length - 1 || isFlipping} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="다음">
                 <ArrowRight className="w-5 h-5" />
               </button>
               {windowWidth > 600 && (
                 <button onClick={() => { if (!isFlipping) setCurrentSpreadIndex(spreads.length - 1) }} disabled={isFlipping} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white transition-colors disabled:opacity-30" title="마지막으로">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/><path d="M20 17V7"/></svg>
                 </button>
               )}
               
               <div className="w-[1px] h-4 md:h-5 bg-white/20 mx-1"></div>
               
               {windowWidth > 600 && (
                 <>
                   <button onClick={() => setZoomPercent(Math.min(300, currentZoom + 10))} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white transition-colors" title="확대">
                     <ZoomIn className="w-4 h-4 md:w-5 md:h-5" />
                   </button>
                   <button onClick={() => setZoomPercent(null)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white transition-colors" title="화면맞춤">
                     <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                   </button>
                   <button onClick={toggleFullscreen} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white transition-colors" title="전체화면">
                     <Monitor className="w-4 h-4 md:w-5 md:h-5" />
                   </button>
                   <div className="w-[1px] h-4 md:h-5 bg-white/20 mx-1"></div>
                 </>
               )}

               <div className="relative">
                 <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 md:p-2 hover:bg-white/10 rounded-full text-white transition-colors" title="추가 기능">
                    <MoreVertical className="w-5 h-5" />
                 </button>
                 {showMenu && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                     <div className="absolute bottom-full mb-3 right-0 bg-white rounded-xl shadow-xl border border-slate-100 py-2 w-48 text-slate-700 font-medium z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 text-sm">
                        {windowWidth <= 600 && (
                          <>
                            <button onClick={() => { setZoomPercent(Math.min(300, currentZoom + 10)); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3"><ZoomIn className="w-4 h-4 text-slate-400"/> 확대하기</button>
                            <button onClick={() => { setZoomPercent(Math.max(25, currentZoom - 10)); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3"><ZoomOut className="w-4 h-4 text-slate-400"/> 축소하기</button>
                            <button onClick={() => { setZoomPercent(null); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3"><Maximize className="w-4 h-4 text-slate-400"/> 화면맞춤</button>
                            <button onClick={() => { toggleFullscreen(); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3"><Monitor className="w-4 h-4 text-slate-400"/> 전체화면</button>
                            <div className="h-[1px] bg-slate-100 my-1"></div>
                          </>
                        )}
                        <button onClick={() => { handleCopyLink(); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3"><Copy className="w-4 h-4 text-slate-400"/> 링크 복사하기</button>
                        <button onClick={() => { toggleAutoFlip(); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3">
                           <PlayCircle className={`w-4 h-4 ${isAutoFlip ? 'text-[#ff2778]' : 'text-slate-400'}`}/> <span className={isAutoFlip ? 'text-[#ff2778]' : ''}>{isAutoFlip ? '자동 넘김 중지' : '자동 넘김'}</span>
                        </button>
                        <button onClick={() => { toggleMusic(); setShowMenu(false); }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center gap-3">
                           {isMusicOn ? <VolumeX className="w-4 h-4 text-slate-400"/> : <Volume2 className="w-4 h-4 text-slate-400"/>} {isMusicOn ? '음악 끄기' : '음악 켜기'}
                        </button>
                     </div>
                   </>
                 )}
               </div>
             </div>
           )}
         </div>
      </div>

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
    </div>
  )
}
