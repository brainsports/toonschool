import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
import StudentToolPanel from '../components/layout/StudentToolPanel'
import StudentZoomControl from '../components/layout/StudentZoomControl'
import SNSBackCoverPreview from '../components/back-cover/SNSBackCoverPreview'
import { ArrowRight, Settings2, LayoutTemplate, Share2 } from 'lucide-react'
import { mockStudentProfile } from '../data/studentMockData'
import { showToast } from '../utils/toast'
import { projectStorage } from '../utils/projectStorage'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { supabase } from '../../../shared/lib/supabase'
import {
  grantComicCompleteReward,
  grantLuckyRewardIfNeeded,
} from '../services/dreamGardenService'


const backCoverRewardRequests = new Set<string>()

function getSupabaseErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { code: null, message: null, details: null, hint: null }
  }

  const record = error as Record<string, unknown>
  return {
    code: record.code ?? null,
    message: record.message ?? null,
    details: record.details ?? null,
    hint: record.hint ?? null,
  }
}
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

export default function StudentBackCoverPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const { user, profile: authProfile } = useAuth()
  const studentId = authProfile?.role === 'student' ? (authProfile.id ?? user?.id) : user?.id
  const [studentData, setStudentData] = useState<any>(null)
  const [isStudentDataLoaded, setIsStudentDataLoaded] = useState(false)

  useEffect(() => {
    if (user?.id && authProfile?.role === 'student') {
      supabase.from('students').select('*').eq('id', user.id).single().then(({ data, error }) => {
        if (!error && data) {
          setStudentData(data)
        }
        setIsStudentDataLoaded(true)
      })
    } else {
      setIsStudentDataLoaded(true)
    }
  }, [user?.id, authProfile?.role])

  // Zoom & Resize logic
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoomPercent, setZoomPercent] = useState<number | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  // Editable State
  const [authorName, setAuthorName] = useState<string>('');
  const [gradeClassInfo, setGradeClassInfo] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [unitName, setUnitName] = useState<string>('');
  const [topicName, setTopicName] = useState<string>('');
  const [createdDate, setCreatedDate] = useState<string>('');
  const [bgColor, setBgColor] = useState<string>('');
  const [backCoverBgOpacity, setBackCoverBgOpacity] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isStudentDataLoaded) return;
    if (isLoaded) return;

    const stateProjectId = location.state?.projectId;
    const currentProjectId = stateProjectId || localStorage.getItem('currentProjectId');

    const todayStr = (() => {
      const now = new Date();
      return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
    })();

    const defaultAuthorName = studentData?.name || authProfile?.name || mockStudentProfile.name;

    if (!currentProjectId) {
      setAuthorName(defaultAuthorName);
      setGradeClassInfo('-');
      setSubjectName('-');
      setUnitName('-');
      setTopicName('-');
      setCreatedDate(todayStr);
      setBgColor(getThemeBySubject('-').background);
      setBackCoverBgOpacity(1);
      setIsLoaded(true);
      return;
    }

    const topicData = projectStorage.loadTopic<any>(currentProjectId);
    const unitData = projectStorage.loadUnit<any>(currentProjectId);
    
    const activeData = topicData || location.state || {};
    const selection = activeData?.selection || unitData || {};
    const topic = activeData?.topic || {};

    const currentSubjectName = selection?.subjectName || '-';
    const currentUnitName = selection?.middleUnitName || selection?.majorUnitName || selection?.unitTitle || selection?.lessonTitle || '-';
    const currentTopicTitle = topic?.title || topic?.topicTitle || '-';
    
    const defaultGrade = studentData?.grade ? (studentData.grade.includes('초') ? studentData.grade : `초${studentData.grade.replace(/[^0-9]/g, '')}`) : (selection?.gradeName || selection?.grade || mockStudentProfile.grade);
    const currentGradeClass = studentData?.grade ? `${defaultGrade} 1반` : `${defaultGrade}${mockStudentProfile.classNumber ? ` ${mockStudentProfile.classNumber}` : ''}`;

    const savedBackCover = projectStorage.loadBackCover<any>(currentProjectId);
    
    const isMatchingProject = savedBackCover 
      && savedBackCover.projectId === currentProjectId
      && savedBackCover.subjectName === currentSubjectName
      && savedBackCover.topicTitle === currentTopicTitle;

    if (isMatchingProject) {
      setAuthorName(savedBackCover.authorName || defaultAuthorName);
      setGradeClassInfo(savedBackCover.gradeClassInfo || currentGradeClass);
      setSubjectName(savedBackCover.subjectName || currentSubjectName);
      setUnitName(savedBackCover.unitName || currentUnitName);
      setTopicName(savedBackCover.topicName || currentTopicTitle);
      setCreatedDate(savedBackCover.createdDate || todayStr);
      setBgColor(savedBackCover.bgColor || getThemeBySubject(savedBackCover.subjectName || currentSubjectName).background);
      setBackCoverBgOpacity(savedBackCover.bgOpacity ?? 1);
    } else {
      setAuthorName(defaultAuthorName);
      setGradeClassInfo(currentGradeClass);
      setSubjectName(currentSubjectName);
      setUnitName(currentUnitName);
      setTopicName(currentTopicTitle);
      setCreatedDate(todayStr);
      setBgColor(getThemeBySubject(currentSubjectName).background);
      setBackCoverBgOpacity(1);
    }
    
    setIsLoaded(true);
  }, [location.state, isStudentDataLoaded, isLoaded, studentData, authProfile]);

  const grantCompletionRewardAfterBackCoverSave = async (projectId: string) => {
    if (!studentId || !projectId) return

    const requestKey = `${studentId}:${projectId}`
    if (backCoverRewardRequests.has(requestKey)) return
    backCoverRewardRequests.add(requestKey)

    try {
      const result = await grantComicCompleteReward(studentId, projectId)
      if (result.status !== 'granted') return

      try {
        await grantLuckyRewardIfNeeded(studentId)
      } catch (error) {
        const details = getSupabaseErrorDetails(error)
        console.error('[StudentBackCoverPage] lucky reward failed after comic completion:', {
          errorCode: details.code,
          message: details.message,
          details: details.details,
          hint: details.hint,
          studentId,
          projectId,
        })
      }

      window.dispatchEvent(new Event('studentLootItemsChanged'))
    } catch (error) {
      const details = getSupabaseErrorDetails(error)
      console.error('[StudentBackCoverPage] comic complete reward failed:', {
        errorCode: details.code,
        message: details.message,
        details: details.details,
        hint: details.hint,
        studentId,
        projectId,
      })
    } finally {
      backCoverRewardRequests.delete(requestKey)
    }
  }

  const saveBackCoverData = async (shouldGrantReward = false) => {
    const currentProjectId = location.state?.projectId || localStorage.getItem('currentProjectId')
    if (!currentProjectId) return false

    const topicData = projectStorage.loadTopic<any>(currentProjectId)
    const unitData = projectStorage.loadUnit<any>(currentProjectId)
    const selection = topicData?.selection || unitData || {}
    const topic = topicData?.topic || {}

    const backCoverData = {
      projectId: currentProjectId,
      subject: selection?.subjectId || '',
      subjectName,
      grade: selection?.gradeValue || selection?.grade || '',
      topicTitle: topicName,
      topicId: topic?.id || '',
      unitTitle: selection?.majorUnitName || '',
      lessonTitle: selection?.middleUnitName || '',
      updatedAt: new Date().toISOString(),

      authorName,
      gradeClassInfo,
      unitName,
      createdDate,
      bgColor,
      bgOpacity: backCoverBgOpacity,
    }

    const isSaved = projectStorage.saveBackCover(currentProjectId, backCoverData)
    if (!isSaved) return false

    // Legacy support
    localStorage.setItem('backCoverBgColor', bgColor)
    localStorage.setItem('backCoverBgOpacity', String(backCoverBgOpacity))
    localStorage.setItem('backCoverAuthor', authorName)
    localStorage.setItem('backCoverGradeClass', gradeClassInfo)
    localStorage.setItem('backCoverSubject', subjectName)
    localStorage.setItem('backCoverUnit', unitName)
    localStorage.setItem('backCoverTopic', topicName)
    localStorage.setItem('backCoverDate', createdDate)

    if (shouldGrantReward) {
      await grantCompletionRewardAfterBackCoverSave(currentProjectId)
    }

    return true
  }

  useEffect(() => {
    if (!isLoaded) return
    void saveBackCoverData(false)
  }, [bgColor, backCoverBgOpacity, authorName, gradeClassInfo, subjectName, unitName, topicName, createdDate, isLoaded, location.state])

  const handleGenerateInfo = () => {
    const currentProjectId = location.state?.projectId || localStorage.getItem('currentProjectId');
    if (!currentProjectId) {
      showToast('현재 작품 정보를 찾을 수 없습니다.');
      return;
    }
    
    const topicData = projectStorage.loadTopic<any>(currentProjectId);
    const unitData = projectStorage.loadUnit<any>(currentProjectId);
    
    const activeData = topicData || location.state || {};
    const selection = activeData?.selection || unitData || {};
    const topic = activeData?.topic || {};

    const currentSubjectName = selection?.subjectName || '-';
    const currentUnitName = selection?.middleUnitName || selection?.majorUnitName || selection?.unitTitle || selection?.lessonTitle || '-';
    const currentTopicTitle = topic?.title || topic?.topicTitle || '-';
    const defaultGrade = studentData?.grade ? (studentData.grade.includes('초') ? studentData.grade : `초${studentData.grade.replace(/[^0-9]/g, '')}`) : (selection?.gradeName || selection?.grade || mockStudentProfile.grade);
    const currentGradeClass = studentData?.grade ? `${defaultGrade} 1반` : `${defaultGrade}${mockStudentProfile.classNumber ? ` ${mockStudentProfile.classNumber}` : ''}`;
    const defaultAuthorName = studentData?.name || authProfile?.name || mockStudentProfile.name;

    setAuthorName(defaultAuthorName);
    setGradeClassInfo(currentGradeClass);
    setSubjectName(currentSubjectName);
    setUnitName(currentUnitName);
    setTopicName(currentTopicTitle);
    
    const now = new Date();
    setCreatedDate(`${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`);
    
    setBgColor(getThemeBySubject(currentSubjectName).background);
    setBackCoverBgOpacity(1);

    showToast('현재 작품 정보로 갱신되었습니다.');
  };

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

  const actionButtons = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleGenerateInfo}
        className="btn-student btn-student-secondary btn-student-md"
      >
        <span>정보 생성하기</span>
      </button>
      <button
        onClick={async () => {
          const projectId = location.state?.projectId || localStorage.getItem('currentProjectId')
          const isSaved = await saveBackCoverData(true)
          if (!isSaved) return
          navigate('/student/comic/read', {
            state: { projectId }
          })
        }}
        className="btn-student btn-student-primary btn-student-md"
      >
        <span>만화 보기 🖼️</span>
        <ArrowRight className="w-5 h-5 ml-1" />
      </button>
    </div>
  );

  return (
    <StudentWorkspaceLayout
      currentStep="backCover"
      title="뒤표지 꾸미기"
      subtitle="과목별 기본색을 바꾸고 정보를 수정해 보세요."
      onBack={() => navigate('/student/unit-summary')}
      actionButtons={actionButtons}
      bgVariant="pastel"
    >
      <StudentToolPanel width="var(--student-layout-tool-panel-width,300px)" className="overflow-y-auto student-scrollbar">
        <div className="p-5 border-b border-[#d9deea]">
          <h2 className="text-xl font-jua text-[#303442] flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-purple-500" />
            뒤표지 설정
          </h2>
        </div>
        
        <div className="p-4 flex flex-col gap-4">
           <div className="bg-white rounded-xl p-4 border border-[#d9deea] shadow-sm">
              <h3 className="text-[#303442] font-bold mb-1 flex items-center gap-2"><LayoutTemplate className="w-4 h-4 text-pink-500"/>배경색</h3>
              <p className="text-xs text-[#555b6b] mb-3">과목별 기본색을 바꾸어 뒤표지를 꾸밀 수 있어요.</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {Object.values(subjectBackCoverThemes).filter(t => t.name !== '기본').map(t => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setBgColor(t.background);
                      setBackCoverBgOpacity(1);
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${activeBgColor === t.background ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-sm' : 'border-[#d9deea] bg-white text-[#555b6b] hover:bg-[#f3f4f7]'}`}
                    title={t.name}
                  >
                    <div className="w-5 h-5 rounded-full border border-black/10 shadow-inner shrink-0" style={{ backgroundColor: t.brand }} />
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 mb-4">
                <label className="flex items-center justify-between bg-white rounded-lg p-2 border border-[#d9deea] cursor-pointer hover:bg-[#f3f4f7] transition-colors">
                  <span className="text-xs font-medium text-[#555b6b] px-1">직접 선택</span>
                  <input
                    type="color"
                    value={activeBgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-[#d9deea] [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:rounded"
                    title="직접 색상 선택"
                  />
                </label>
                
                <div className="bg-white rounded-lg p-3 border border-[#d9deea]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#555b6b]">투명도</span>
                    <span className="text-xs text-[#8b909e] font-mono">{Math.round(backCoverBgOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1"
                    step="0.01"
                    value={backCoverBgOpacity}
                    onChange={(e) => setBackCoverBgOpacity(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#d9deea] rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
              <button
                onClick={resetToSubjectColor}
                className="w-full py-2 bg-[#f3f4f7] hover:bg-[#e9ecef] text-[#555b6b] text-xs font-medium rounded-lg transition-colors border border-[#d9deea]"
              >
                현재 과목 기본색으로 되돌리기
              </button>
           </div>
           
           <div className="bg-white rounded-xl p-4 border border-[#d9deea] shadow-sm">
              <h3 className="text-[#303442] font-bold mb-3 flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-500"/>동적 정보 수정</h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#555b6b]">지은이</label>
                  <input 
                    type="text" 
                    value={authorName} 
                    onChange={e => setAuthorName(e.target.value)} 
                    className="bg-white border border-[#d9deea] rounded-lg px-3 py-2 text-sm text-[#303442] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="예: 홍길동"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#555b6b]">학년/반</label>
                  <input 
                    type="text" 
                    value={gradeClassInfo} 
                    onChange={e => setGradeClassInfo(e.target.value)} 
                    className="bg-white border border-[#d9deea] rounded-lg px-3 py-2 text-sm text-[#303442] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="예: 3학년 2반"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#555b6b]">과목</label>
                  <input 
                    type="text" 
                    value={subjectName} 
                    onChange={handleSubjectChange} 
                    className="bg-white border border-[#d9deea] rounded-lg px-3 py-2 text-sm text-[#303442] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="예: 과학"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#555b6b]">단원</label>
                  <input 
                    type="text" 
                    value={unitName} 
                    onChange={e => setUnitName(e.target.value)} 
                    className="bg-white border border-[#d9deea] rounded-lg px-3 py-2 text-sm text-[#303442] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="예: 분수의 나눗셈"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#555b6b]">주제</label>
                  <input 
                    type="text" 
                    value={topicName} 
                    onChange={e => setTopicName(e.target.value)} 
                    className="bg-white border border-[#d9deea] rounded-lg px-3 py-2 text-sm text-[#303442] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="예: 생활 속 분수"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#555b6b]">만든 날짜</label>
                  <input 
                    type="text" 
                    value={createdDate} 
                    onChange={e => setCreatedDate(e.target.value)} 
                    className="bg-white border border-[#d9deea] rounded-lg px-3 py-2 text-sm text-[#303442] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="예: 2026.06.24"
                  />
                </div>
              </div>
           </div>
        </div>
      </StudentToolPanel>

      {/* Main Center Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative">
         {/* Canvas Container */}
         <div 
           className="flex-1 w-full relative overflow-auto student-scrollbar flex justify-center items-start pt-10 pb-32" 
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
         <StudentZoomControl
           scale={currentZoom / 100}
           onZoomIn={() => setZoomPercent(Math.min(300, currentZoom + 10))}
           onZoomOut={() => setZoomPercent(Math.max(25, currentZoom - 10))}
           onFitToScreen={() => setZoomPercent(null)}
           minScale={0.25}
           maxScale={3.0}
         />
      </div>
    </StudentWorkspaceLayout>
  )
}
