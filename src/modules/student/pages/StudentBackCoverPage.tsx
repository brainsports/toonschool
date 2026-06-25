import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import SNSBackCoverPreview from '../components/back-cover/SNSBackCoverPreview'
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Maximize, Settings2, LayoutTemplate, Share2 } from 'lucide-react'
import { mockStudentProfile } from '../data/studentMockData'

const subjectBackCoverThemes: Record<string, { name: string, brand: string, background: string, patternColor: string }> = {
  korean: { name: '국어', brand: '#422C8C', background: '#F2ECFF', patternColor: 'rgba(244, 114, 182, 0.12)' },
  math: { name: '수학', brand: '#422C8C', background: '#EEF4FF', patternColor: 'rgba(245, 158, 11, 0.12)' },
  social: { name: '사회', brand: '#0A532C', background: '#EAF7EC', patternColor: 'rgba(34, 197, 94, 0.12)' },
  english: { name: '영어', brand: '#E65F01', background: '#FFF0E3', patternColor: 'rgba(129, 140, 248, 0.12)' },
  science: { name: '과학', brand: '#403584', background: '#F0ECFF', patternColor: 'rgba(99, 102, 241, 0.12)' },
  default: { name: '기본', brand: '#94a3b8', background: '#f3f4f7', patternColor: 'rgba(148, 163, 184, 0.12)' }
};

const hexToRgba = (hex: string, opacity: number) => {
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
};

const getThemeBySubject = (subjectName: string) => {
  const theme = Object.values(subjectBackCoverThemes).find(t => t.name === subjectName);
  return theme || subjectBackCoverThemes.default;
};

const getStoredData = () => {
  try {
    const stored = localStorage.getItem('studentSelectedTopic');
    if (stored) {
      const data = JSON.parse(stored);
      return {
        subjectName: data?.selection?.subjectName || '',
        unitName: data?.selection?.middleUnitName || data?.selection?.majorUnitName || '',
        topicName: data?.topic?.title || ''
      };
    }
  } catch(e) {}
  return { subjectName: '', unitName: '', topicName: '' };
};

export default function StudentBackCoverPage() {
  const navigate = useNavigate()
  
  // Zoom & Resize logic
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoomPercent, setZoomPercent] = useState<number | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  const storedData = getStoredData();

  // Editable State
  const [authorName, setAuthorName] = useState<string>(() => localStorage.getItem('backCoverAuthor') || mockStudentProfile.name);
  const [gradeClassInfo, setGradeClassInfo] = useState<string>(() => localStorage.getItem('backCoverGradeClass') || `${mockStudentProfile.grade} ${mockStudentProfile.classNumber}반`);
  const [subjectName, setSubjectName] = useState<string>(() => localStorage.getItem('backCoverSubject') || storedData.subjectName || "과학");
  const [unitName, setUnitName] = useState<string>(() => localStorage.getItem('backCoverUnit') || storedData.unitName || "선택한 단원");
  const [topicName, setTopicName] = useState<string>(() => localStorage.getItem('backCoverTopic') || storedData.topicName || "만든 주제");
  const [createdDate, setCreatedDate] = useState<string>(() => {
    const storedDate = localStorage.getItem('backCoverDate');
    if (storedDate) return storedDate;
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  });
  const [bgColor, setBgColor] = useState<string>(() => localStorage.getItem('backCoverBgColor') || '');
  const [backCoverBgOpacity, setBackCoverBgOpacity] = useState<number>(() => {
    const stored = localStorage.getItem('backCoverBgOpacity');
    return stored ? Number(stored) : 1;
  });

  useEffect(() => {
    localStorage.setItem('backCoverBgColor', bgColor);
    localStorage.setItem('backCoverBgOpacity', String(backCoverBgOpacity));
    localStorage.setItem('backCoverAuthor', authorName);
    localStorage.setItem('backCoverGradeClass', gradeClassInfo);
    localStorage.setItem('backCoverSubject', subjectName);
    localStorage.setItem('backCoverUnit', unitName);
    localStorage.setItem('backCoverTopic', topicName);
    localStorage.setItem('backCoverDate', createdDate);
  }, [bgColor, backCoverBgOpacity, authorName, gradeClassInfo, subjectName, unitName, topicName, createdDate]);

  const activeBgColor = bgColor || getThemeBySubject(subjectName).background;
  const backCoverBackgroundWithOpacity = hexToRgba(activeBgColor, backCoverBgOpacity);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubject = e.target.value;
    setSubjectName(newSubject);
    const matchedTheme = Object.values(subjectBackCoverThemes).find(t => t.name === newSubject);
    if (matchedTheme) {
      setBgColor(matchedTheme.background);
    } else {
      setBgColor(subjectBackCoverThemes.default.background);
    }
    setBackCoverBgOpacity(1);
  };

  const resetToSubjectColor = () => {
    setBgColor(getThemeBySubject(subjectName).background);
    setBackCoverBgOpacity(1);
  };

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

  // 1483 x 2048 ratio
  const BASE_WIDTH = 520;
  const BASE_HEIGHT = BASE_WIDTH * (2048 / 1483);
  
  const SCROLL_PADDING = 32;
  const fitScale = Math.min(
    Math.max(0.1, (containerSize.width - SCROLL_PADDING * 2) / BASE_WIDTH),
    Math.max(0.1, (containerSize.height - SCROLL_PADDING * 2) / BASE_HEIGHT)
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
    <StudentCreationLayout currentStep="backCover" bgVariant="pastel" maxWidth="full">
      <div className="flex w-full h-full animate-fade-in relative overflow-hidden min-h-0 items-start">
        
        {/* Left Sidebar (Moved from right) */}
        <div className="w-[280px] lg:w-[320px] h-full shrink-0 bg-[#151628]/95 backdrop-blur-md border-r border-white/10 flex flex-col overflow-y-auto custom-scrollbar z-30">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-xl font-jua text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-purple-400" />
              뒤표지 설정
            </h2>
          </div>
          
          <div className="p-4 flex flex-col gap-4">
             <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-slate-200 font-bold mb-1 flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-pink-400"/>배경색</h3>
                <p className="text-xs text-slate-400 mb-3">과목별 기본색을 바꾸어 뒤표지를 꾸밀 수 있어요.</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Object.values(subjectBackCoverThemes).filter(t => t.name !== '기본').map(t => (
                    <button
                      key={t.name}
                      onClick={() => {
                        setBgColor(t.background);
                        setBackCoverBgOpacity(1);
                      }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${activeBgColor === t.background ? 'border-white bg-white/20 shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                      title={t.name}
                    >
                      <div className="w-5 h-5 rounded-full border border-black/10 shadow-inner shrink-0" style={{ backgroundColor: t.brand }} />
                      <span className="text-xs text-slate-200 font-medium">{t.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 mb-4">
                  <label className="flex items-center justify-between bg-white/5 rounded-lg p-2 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                    <span className="text-xs font-medium text-slate-300 px-1">직접 선택</span>
                    <input
                      type="color"
                      value={activeBgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded"
                      title="직접 색상 선택"
                    />
                  </label>
                  
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-300">투명도</span>
                      <span className="text-xs text-slate-400 font-mono">{Math.round(backCoverBgOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.01"
                      value={backCoverBgOpacity}
                      onChange={(e) => setBackCoverBgOpacity(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
                <button
                  onClick={resetToSubjectColor}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium rounded-lg transition-colors border border-white/5"
                >
                  현재 과목 기본색으로 되돌리기
                </button>
             </div>
             
             <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-400"/>동적 정보 수정</h3>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">지은이</label>
                    <input 
                      type="text" 
                      value={authorName} 
                      onChange={e => setAuthorName(e.target.value)} 
                      className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                      placeholder="예: 홍길동"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">학년/반</label>
                    <input 
                      type="text" 
                      value={gradeClassInfo} 
                      onChange={e => setGradeClassInfo(e.target.value)} 
                      className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                      placeholder="예: 3학년 2반"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">과목</label>
                    <input 
                      type="text" 
                      value={subjectName} 
                      onChange={handleSubjectChange} 
                      className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                      placeholder="예: 과학"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">단원</label>
                    <input 
                      type="text" 
                      value={unitName} 
                      onChange={e => setUnitName(e.target.value)} 
                      className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                      placeholder="예: 분수의 나눗셈"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">주제</label>
                    <input 
                      type="text" 
                      value={topicName} 
                      onChange={e => setTopicName(e.target.value)} 
                      className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                      placeholder="예: 생활 속 분수"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">만든 날짜</label>
                    <input 
                      type="text" 
                      value={createdDate} 
                      onChange={e => setCreatedDate(e.target.value)} 
                      className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                      placeholder="예: 2026.06.24"
                    />
                  </div>
                </div>
             </div>
          </div>
        </div>

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

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/student/comic/read')}
                  className="btn-primary-action flex items-center justify-center rounded-full px-5 py-2.5 text-white font-jua text-base shadow-md hover:scale-105 transition-transform"
                >
                  <span>만화 보기 🖼️</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 stroke-[3] ml-2" />
                </button>
              </div>
           </div>
           
           {/* Canvas Container */}
           <div 
             className="flex-1 w-full relative overflow-auto custom-scrollbar flex justify-center items-start pt-10 pb-32" 
             ref={containerRef}
           >
              <div
                style={{
                   width: BASE_WIDTH * (currentZoom / 100),
                   height: BASE_HEIGHT * (currentZoom / 100),
                   flexShrink: 0,
                   position: 'relative'
                }}
              >
                 <div 
                   style={{ 
                     transform: `scale(${currentZoom / 100})`, 
                     transformOrigin: 'top left', 
                     width: BASE_WIDTH, 
                     height: BASE_HEIGHT,
                     position: 'absolute',
                     top: 0,
                     left: 0
                   }} 
                 >
                    <SNSBackCoverPreview
                       studentName={authorName}
                       gradeClass={gradeClassInfo}
                       completionDate={createdDate}
                       subject={subjectName}
                       unit={unitName}
                       topic={topicName}
                       backgroundColor={backCoverBackgroundWithOpacity}
                    />
                 </div>
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
      </div>
    </StudentCreationLayout>
  )
}
