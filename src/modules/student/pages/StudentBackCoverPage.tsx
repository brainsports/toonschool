import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import SNSBackCoverPreview from '../components/back-cover/SNSBackCoverPreview'
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Maximize, Settings2, LayoutTemplate, Share2, QrCode as QrCodeIcon, MousePointerClick } from 'lucide-react'
import { mockStudentProfile } from '../data/studentMockData'

export default function StudentBackCoverPage() {
  const navigate = useNavigate()
  
  // Zoom & Resize logic
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoomPercent, setZoomPercent] = useState<number | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

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

  // A4 fixed width for calculation
  const A4_WIDTH = 720;
  const A4_HEIGHT = A4_WIDTH * 1.414;
  
  const SCROLL_PADDING = 40;
  const fitScale = Math.min(
    Math.max(0.1, (containerSize.width - SCROLL_PADDING * 2) / A4_WIDTH),
    Math.max(0.1, (containerSize.height - SCROLL_PADDING * 2) / A4_HEIGHT)
  );
  
  const currentZoom = zoomPercent !== null ? zoomPercent : (containerSize.width ? Math.round(fitScale * 100) : 100);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // prevent browser zoom
        const delta = e.deltaY > 0 ? -5 : 5;
        let newZoom = currentZoom + delta;
        newZoom = Math.max(25, Math.min(300, newZoom));
        setZoomPercent(newZoom);
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [currentZoom]);

  return (
    <StudentCreationLayout currentStep="backCover" bgVariant="space" maxWidth="full">
      <div className="flex w-full h-full animate-fade-in relative overflow-hidden min-h-0">
        
        {/* Main Center Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative">
           {/* Top Toolbar */}
           <div className="flex items-center justify-between px-4 md:px-8 py-4 shrink-0 relative z-20">
              <button
                onClick={() => navigate('/student/unit-summary')}
                className="card-glass card-glass-interactive flex items-center justify-center rounded-full px-5 py-2.5 text-slate-300 font-jua text-base shadow-sm hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 stroke-[3] mr-2" />
                <span>이전</span>
              </button>

              <div className="text-center flex-1 px-2">
                 <h1 className="text-2xl md:text-[2rem] font-jua text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">뒤표지 꾸미기</h1>
              </div>

              <button
                onClick={() => navigate('/student/comic/read')}
                className="btn-primary-action flex items-center justify-center rounded-full px-5 py-2.5 text-white font-jua text-base shadow-md hover:scale-105 transition-transform"
              >
                <span>만화 보기 🖼️</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 stroke-[3] ml-2" />
              </button>
           </div>
           
           {/* Canvas Container */}
           <div className="flex-1 w-full relative min-h-0 min-w-0 overflow-auto overscroll-contain flex items-center justify-center p-10" ref={containerRef}>
              <div 
                style={{ 
                  transform: `scale(${currentZoom / 100})`, 
                  transformOrigin: 'center center', 
                  width: A4_WIDTH, 
                  height: A4_HEIGHT, 
                  flexShrink: 0 
                }} 
                className="relative shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)] transition-transform duration-75"
              >
                 <SNSBackCoverPreview
                    studentName={mockStudentProfile.name}
                    gradeClass={`${mockStudentProfile.grade} ${mockStudentProfile.classNumber}반`}
                    email="student@email.com"
                    completionDate="2026.06.24"
                    subject="과학"
                    unit="자석의 성질"
                    onShareFriend={() => alert('친구에게 공유하기 모달이 열립니다.')}
                    onShareFamily={() => alert('가족에게 보여주기 안내가 열립니다.')}
                    onReplay={() => navigate('/student/comic/read')}
                  />
              </div>
           </div>
           
           {/* Zoom Controls */}
           <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 md:gap-3 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 px-3 py-2 md:px-4 md:py-2.5 rounded-full shadow-2xl text-slate-200">
              <button 
                onClick={() => setZoomPercent(Math.max(25, currentZoom - 10))}
                disabled={currentZoom <= 25}
                className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-xs md:text-sm font-bold w-[4ch] text-center font-mono">
                {currentZoom}%
              </span>
              
              <button 
                onClick={() => setZoomPercent(Math.min(300, currentZoom + 10))}
                disabled={currentZoom >= 300}
                className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <div className="w-px h-4 md:h-5 bg-slate-600 mx-0.5 md:mx-1" />
              
              <button 
                onClick={() => setZoomPercent(null)}
                className={`hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold p-1 ${zoomPercent === null ? 'text-purple-400' : 'text-slate-300'}`}
              >
                <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden md:inline">화면 맞춤</span>
              </button>
           </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="w-[280px] lg:w-[320px] h-full shrink-0 bg-[#151628]/95 backdrop-blur-md border-l border-white/10 flex flex-col overflow-y-auto custom-scrollbar z-30">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-xl font-jua text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-purple-400" />
              뒤표지 설정
            </h2>
          </div>
          
          <div className="p-4 flex flex-col gap-4">
             <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-pink-400"/>템플릿 선택</h3>
                <div className="text-sm text-slate-400">다양한 SNS 테마를 선택할 수 있어요.</div>
             </div>
             
             <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-400"/>작품 정보</h3>
                <div className="text-sm text-slate-400">공유할 작품 정보를 확인하고 수정해요.</div>
             </div>
             
             <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2"><QrCodeIcon className="w-4 h-4 text-green-400"/>QR 설정</h3>
                <div className="text-sm text-slate-400">내 만화로 연결되는 QR 코드를 만들어요.</div>
             </div>
             
             <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2"><MousePointerClick className="w-4 h-4 text-yellow-400"/>버튼 설정</h3>
                <div className="text-sm text-slate-400">가족, 친구에게 공유하는 버튼을 설정해요.</div>
             </div>
          </div>
        </div>
      </div>
    </StudentCreationLayout>
  )
}
