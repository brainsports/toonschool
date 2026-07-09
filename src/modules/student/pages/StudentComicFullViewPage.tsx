import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
import StudentToolPanel from '../components/layout/StudentToolPanel'
import StudentZoomControl from '../components/layout/StudentZoomControl'
import { generateSingleComicCut, checkCutGenerationStatus, type ComicGenerationState } from '../services/studentComicService';
import { loadComicProjectData, saveComicProjectData, loadComicCutData, saveComicCutData, type ComicProjectData, type ComicCutEditData, type ComicCutElement } from '../components/editor/utils/comicStorage';
import type { GeneratedComicScript } from '../services/studentScriptService';
import { projectStorage } from '../utils/projectStorage';
import { Sparkles, Loader2, MousePointer2, Layout, Users, MessageSquare, Type, Layers, RefreshCw, Maximize, Undo, Redo } from 'lucide-react';
import { runGeminiSmokeTest } from '../../../shared/lib/geminiDiagnostics';
import { getErrorMessageByCode } from '../../../shared/lib/geminiLogger';

const IS_DEBUG_MODE = false; // 관리자/디버그 모드용 플래그 (true시 시간 및 상세 메시지 표시)


import ComicCanvas from '../components/comic-editor/ComicCanvas';
import CharacterToolPanel from '../components/comic-editor/CharacterToolPanel';
import ComicScriptPanel from '../components/comic-editor/ComicScriptPanel';
import ComicSpeechBubblePanel from '../components/comic-editor/ComicSpeechBubblePanel';
import ComicLayerPanel from '../components/comic-editor/ComicLayerPanel';
import ToonSchoolCharacterBadgeGroup from '../components/layout/ToonSchoolCharacterBadgeGroup';
import HiddenItemEncounter from '../components/reward/HiddenItemEncounter';

type ToolType = 'select' | 'background' | 'character' | 'bubble' | 'script' | 'layer';

// 캔버스 사이즈 측정용 래퍼 컴포넌트
function ComicCellWrapper({ 
  cutNumber, 
  cutData, 
  isSelected, 
  onClick, 
  selectedElementId, 
  onSelectElement, 
  onUpdateElement,
  genState,
  onGenerate,
  onDoubleClick,
  onDropElement
}: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [elapsedNow, setElapsedNow] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (genState?.status === 'generating' && genState.startedAt) {
      interval = setInterval(() => {
        setElapsedNow(Date.now() - genState.startedAt!);
      }, 1000);
    } else {
      setElapsedNow(0);
    }
    return () => clearInterval(interval);
  }, [genState?.status, genState?.startedAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0) return `${m}분 ${s}초`;
    return `${s}초`;
  };

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;
    try {
      const data = JSON.parse(dataStr);
      if (data.type === 'character' && onDropElement && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        onDropElement(cutNumber, data, e.clientX, e.clientY, rect);
      }
    } catch (err) {}
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isGenerated = !!cutData?.backgroundImageUrl;

  return (
    <div 
      ref={containerRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative w-full h-full bg-slate-100 rounded-2xl overflow-hidden cursor-pointer transition-all border-4 ${isSelected ? 'border-purple-500 shadow-xl shadow-purple-500/20' : 'border-slate-300 hover:border-slate-400'}`}
    >
      <div className="absolute top-2 left-2 z-10 bg-slate-800 text-white font-jua text-lg px-3 py-1 rounded-lg shadow">
        {cutNumber}
      </div>

      {isGenerated && size.width > 0 && size.height > 0 ? (
        <ComicCanvas
          data={cutData}
          containerWidth={size.width}
          containerHeight={size.height}
          selectedElementId={isSelected ? selectedElementId : null}
          onSelectElement={(id) => { if (isSelected) onSelectElement(id); }}
          onUpdateElement={(id, updates) => { if (isSelected) onUpdateElement(id, updates); }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
          <Sparkles className="w-10 h-10 mb-2 opacity-50" />
          <span className="font-jua text-xl">그림을 생성하세요</span>
        </div>
      )}

      {!isGenerated && !genState && (
         <button onClick={(e) => { e.stopPropagation(); onGenerate(); }} className="absolute inset-0 bg-transparent flex flex-col items-center justify-center opacity-0 hover:opacity-100 hover:bg-slate-900/10 transition-all z-20 font-bold text-slate-700">
            클릭하여 생성하기
         </button>
      )}

      {genState?.status === 'generating' && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 p-4 text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-3" />
          {/* 학생 화면 표시용 */}
          <span className="font-bold text-sm text-purple-700">
            {cutNumber === 1 ? '1번 컷은 전체 그림 분위기를 정하느라 시간이 조금 더 걸릴 수 있어요.' : '그림을 만들고 있어요.'}
          </span>
          
          {/* 관리자/디버그 모드용 표시 */}
          {IS_DEBUG_MODE && (
            <>
              <span className="font-bold text-xs text-purple-700 opacity-50 mt-1">{cutNumber}번 컷 생성 중 · {formatTime(elapsedNow)} 경과</span>
              <span className="text-xs text-slate-600 mt-1 break-all">{genState.message}</span>
            </>
          )}
        </div>
      )}
      
      {/* 관리자/디버그 모드용 완료 시간 뱃지 (학생 화면에서는 숨김) */}
      {IS_DEBUG_MODE && isGenerated && genState?.status === 'success' && genState.elapsedMs && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md z-20 backdrop-blur-sm">
          {cutNumber}번 컷 생성 완료 · {formatTime(genState.elapsedMs)}
        </div>
      )}
      {genState?.status === 'error' && (() => {
        const errorCode = genState.errorCode || '';
        const userMsg = errorCode
          ? getErrorMessageByCode(errorCode)
          : (genState.errorMessage || genState.message || '알 수 없는 오류가 발생했습니다.');
        const retryLabel =
          errorCode === 'GEMINI_503' ? '대체 모델로 다시 시도'
          : errorCode === 'TIMEOUT' || errorCode === 'POLL_TIMEOUT' ? '이 컷만 다시 생성'
          : '다시 시도';
        return (
          <div className="absolute inset-0 bg-red-50/95 flex flex-col items-center justify-center z-20 p-4 text-center backdrop-blur-sm">
            <span className="text-red-600 font-bold mb-1 text-lg">{cutNumber}번 컷 생성 실패</span>
            {errorCode && (
              <span className="text-[10px] bg-red-100 text-red-400 rounded px-2 py-0.5 mb-1 font-mono">{errorCode}</span>
            )}
            <span className="text-red-500 font-bold mb-3 text-sm break-all leading-snug">{userMsg}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onGenerate(); }}
              className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg text-sm font-bold shadow-md transition-colors"
            >{retryLabel}</button>
          </div>
        );
      })()}

      {!isSelected && <div className="absolute inset-0 bg-transparent z-50" />}
    </div>
  );
}

export default function StudentComicFullViewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  
  const [selectionData, setSelectionData] = useState<any>(null);
  const [projectId] = useState<string>(location.state?.projectId || '');
  const [projectData, setProjectData] = useState<ComicProjectData | null>(null);
  const [scriptData, setScriptData] = useState<GeneratedComicScript | null>(null);
  
  const [cutsData, setCutsData] = useState<Record<number, ComicCutEditData>>({});
  const [genStates, setGenStates] = useState<Record<number, ComicGenerationState>>({});
  const [genAllState, setGenAllState] = useState<{ isRunning: boolean, completedCount: number, startedAt: number | null, elapsedMs: number }>({
    isRunning: false, completedCount: 0, startedAt: null, elapsedMs: 0
  });


  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (genAllState.isRunning && genAllState.startedAt) {
      interval = setInterval(() => {
        setGenAllState(prev => ({ ...prev, elapsedMs: Date.now() - prev.startedAt! }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [genAllState.isRunning, genAllState.startedAt]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0) return `${m}분 ${s}초`;
    return `${s}초`;
  };
  
  const [selectedCutNumber, setSelectedCutNumber] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<ToolType>('character');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const [detailedCutNumber, setDetailedCutNumber] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoomPercent, setZoomPercent] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    setTimeout(handleResize, 50);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const A4_WIDTH = 750;
  const SCROLL_PADDING = 40;
  const fitScale = Math.min(
    Math.max(1, (containerSize.width || 1200) - SCROLL_PADDING * 2) / A4_WIDTH,
    Math.max(1, (containerSize.height || 800) - SCROLL_PADDING * 2) / (A4_WIDTH * 1.414)
  );
  const currentZoom = zoomPercent !== null ? zoomPercent : Math.round(fitScale * 100);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -5 : 5;
        let newZoom = currentZoom + delta;
        newZoom = Math.max(25, Math.min(300, newZoom));
        
        const rect = el.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;
        
        const contentX = el.scrollLeft + pointerX - SCROLL_PADDING;
        const contentY = el.scrollTop + pointerY - SCROLL_PADDING;
        
        const zoomRatio = newZoom / currentZoom;
        
        setZoomPercent(newZoom);
        
        requestAnimationFrame(() => {
           el.scrollLeft = contentX * zoomRatio + SCROLL_PADDING - pointerX;
           el.scrollTop = contentY * zoomRatio + SCROLL_PADDING - pointerY;
        });
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [currentZoom]);

  const toggleDetailedCut = (num: number) => {
    if (detailedCutNumber === num) {
      setDetailedCutNumber(null);
    } else {
      setDetailedCutNumber(num);
      setSelectedCutNumber(num);
    }
  };

  useEffect(() => {
    // ✅ 1순위: location.state (직전 단계에서 전달된 현재 작품 데이터)
    let data = location.state as any;

    // ✅ 2순위: projectId로 projectStorage에서 현재 작품 데이터 복원
    if ((!data || !data.selection || !data.topic) && projectId) {
      const topicData = projectStorage.loadTopic<any>(projectId);
      if (topicData && topicData.selection && topicData.topic) {
        data = topicData;
      }
    }

    // ⚠️ 3순위: localStorage.studentSelectedTopic — 현재 projectId와 일치할 때만 사용
    if (!data || !data.selection || !data.topic) {
      const stored = localStorage.getItem('studentSelectedTopic');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (projectId && parsed.projectId && parsed.projectId !== projectId) {
            console.warn('[ComicFullView] localStorage 데이터의 projectId가 현재와 다릅니다. 무시합니다.');
          } else if (parsed && parsed.selection && parsed.topic) {
            data = parsed;
          }
        } catch(e) {}
      }
    }

    if (!data || !data.selection || !data.topic) {
      alert('학습 정보가 없습니다. 단원 선택부터 다시 진행해주세요.');
      navigate('/student/select-unit');
      return;
    }
    setSelectionData(data);

    // ✅ topicId: projectId를 최우선 사용 (topic.id는 projectId가 없을 때만 fallback)
    const topicId = projectId || data.topic.id;
    const currentSubject = data.selection.subjectName;
    const currentGrade = data.selection.gradeName;
    const currentTopicTitle = data.topic.title;

    // ✅ 대본 데이터: projectStorage.loadScript 만 사용 (studentScript localStorage는 미사용)
    const parsedScript = projectStorage.loadScript<GeneratedComicScript>(topicId);

    if (!parsedScript) {
      // 대본이 없으면 만화제작 불가 — 사용자에게 안내 후 대기 (대본 없이 빈 상태 유지)
      console.warn('[ComicFullView] 대본 데이터를 찾을 수 없습니다. projectId:', topicId);
      return;
    }

    setScriptData(parsedScript);

    // ✅ storedProjectData 검증: 과목·학년·주제 모두 일치해야만 재사용
    let storedProjectData = loadComicProjectData(topicId);
    const isStoredDataValid = storedProjectData &&
      storedProjectData.subject === currentSubject &&
      storedProjectData.grade === currentGrade &&
      storedProjectData.topicTitle === currentTopicTitle;

    if (!isStoredDataValid) {
      if (storedProjectData) {
        console.warn('[ComicFullView] 저장된 만화 데이터와 현재 작품이 불일치합니다. 새로 생성합니다.', {
          stored: { subject: storedProjectData.subject, grade: storedProjectData.grade, title: storedProjectData.topicTitle },
          current: { subject: currentSubject, grade: currentGrade, title: currentTopicTitle }
        });
      }
      // 불일치 시 현재 대본 기준으로 새 ComicProjectData 생성
      storedProjectData = {
        projectId: topicId,
        grade: currentGrade,
        subject: currentSubject,
        topicTitle: parsedScript.title,
        selectedStoryDescription: data.topic.summary || '',
        coreConcepts: parsedScript.keyConcepts?.map((c: any) => c.title) || [],
        script: {
          version: 1,
          updatedAt: new Date().toISOString(),
          cuts: parsedScript.cuts.map((c: any) => ({
            cutNumber: c.cutNumber,
            title: c.role || '',
            sceneDescription: c.scene,
            learningPoint: c.learningPoint,
            dialogues: c.dialogues.map((d: any) => ({ character: d.speaker, text: d.text }))
          })) as any
        },
        characterReferences: { version: 'v2' }
      };
      saveComicProjectData(topicId, storedProjectData);
    }
    setProjectData(storedProjectData);

    // ✅ 컷 데이터 로드: 불일치했다면 이전 컷 이미지를 새 대본의 장면 설명으로 초기화
    const loadedCuts: Record<number, ComicCutEditData> = {};
    for (let i = 1; i <= 6; i++) {
      let cutData = isStoredDataValid ? loadComicCutData(topicId, i) : null;
      if (!cutData) {
        cutData = { cutNumber: i, elements: [], updatedAt: new Date().toISOString() };
      }
      if (cutData.customBackgroundPrompt === undefined || !cutData.customBackgroundPrompt.trim()) {
        cutData.customBackgroundPrompt = storedProjectData?.script?.cuts?.[i - 1]?.sceneDescription || '';
      }
      loadedCuts[i] = cutData;
    }
    setCutsData(loadedCuts);
  }, [location.state, navigate]);

  // 진행 중인 대기열 작업 확인 및 정리 (무한 로딩 버그 수정)
  useEffect(() => {
    if (!projectData) return;

    const checkJobs = async () => {
      for (let i = 1; i <= 6; i++) {
        // 이미 생성 완료된 이미지거나 현재 활성 생성 중이면 건너뜀
        if (cutsData[i]?.backgroundImageUrl || genStates[i]?.status === 'generating') continue;

        const job = await checkCutGenerationStatus(projectData.projectId, i);
        if (!job) continue;

        // DB에 queued/processing 상태가 남아있는 경우 무한 로딩 방지 (수동 재시도 유도)
        if (job.status === 'queued' || job.status === 'processing') {
          setGenStates(prev => {
            if (prev[i]?.status === 'error') return prev;
            return {
              ...prev,
              [i]: {
                status: 'error',
                progress: 0,
                message: '이전 생성이 중단되었습니다. 다시 시도해 주세요.',
                errorMessage: '페이지 새로고침으로 인해 생성 대기열에서 중단되었습니다.'
              }
            };
          });
        } else if (job.status === 'failed' && genStates[i]?.status !== 'error') {
          setGenStates(prev => ({
            ...prev,
            [i]: {
              status: 'error',
              progress: 0,
              message: '서버 이미지 생성 실패',
              errorMessage: job.error_message || '알 수 없는 오류'
            }
          }));
        }
      }
    };

    checkJobs();
    
    // 이전에 있던 setInterval(checkAndPollJobs, 5000) 폴링을 제거하여 
    // 사용자가 다시 생성 버튼을 누르기 전까지는 백그라운드 무한 재시작이 일어나지 않게 함

  }, [projectData, cutsData]);

  // 긴급 복구 함수 + smoke test (콘솔 테스트용)
  useEffect(() => {
    (window as any).clearStaleGenerationState = () => {
      setGenStates({});
      console.log('Stale generation states cleared! 모든 임시 생성 상태가 초기화되었습니다.');
      alert('생성 상태가 초기화되었습니다. 다시 생성을 시도해주세요.');
    };
    // Gemini smoke test: window.runGeminiSmokeTest() 로 실행
    (window as any).runGeminiSmokeTest = runGeminiSmokeTest;
    console.log('[ToonSchool] 콘솔 명령어: window.runGeminiSmokeTest() — Gemini API 상태 확인');
    console.log('[ToonSchool] 콘솔 명령어: window.clearStaleGenerationState() — 생성 상태 초기화');
    return () => {
      delete (window as any).clearStaleGenerationState;
      delete (window as any).runGeminiSmokeTest;
    };
  }, []);

  useEffect(() => {
    // 키보드 삭제
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) handleDeleteElement(selectedElementId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, cutsData, selectedCutNumber]);

  const saveCutState = useCallback((cutNum: number, newData: ComicCutEditData) => {
    if (!projectData) return;
    const updated = { ...newData, updatedAt: new Date().toISOString() };
    setCutsData(prev => ({ ...prev, [cutNum]: updated }));
    try {
      saveComicCutData(projectData.projectId, cutNum, updated);
    } catch (e: any) {
      if (e.message === 'STORAGE_FULL' || e.name === 'StorageFullError') {
        alert('저장 공간이 부족합니다. 기존 컷 이미지를 정리하거나 이미지 저장 방식을 변경해야 합니다.');
      } else {
        console.error(e);
      }
    }
  }, [projectData]);

  const handleUpdateElement = (id: string, updates: Partial<ComicCutElement>) => {
    const cutData = cutsData[selectedCutNumber];
    if (!cutData) return;
    saveCutState(selectedCutNumber, {
      ...cutData,
      elements: cutData.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    });
  };

  const handleAddElement = (element: Omit<ComicCutElement, 'id'>) => {
    const cutData = cutsData[selectedCutNumber];
    if (!cutData) return;
    const maxZ = cutData.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const newElement: ComicCutElement = {
      ...element,
      id: uuidv4(),
      zIndex: maxZ + 1
    } as ComicCutElement;
    saveCutState(selectedCutNumber, {
      ...cutData,
      elements: [...cutData.elements, newElement]
    });
    setSelectedElementId(newElement.id);
  };

  const handleDropElement = useCallback((cutNumber: number, elementData: any, clientX: number, clientY: number, containerRect: DOMRect) => {
    const cutData = cutsData[cutNumber];
    if (!cutData) return;
    
    const CANVAS_WIDTH = 1400;
    const scale = containerRect.width / CANVAS_WIDTH;
    
    const relativeX = (clientX - containerRect.left) / scale;
    const relativeY = (clientY - containerRect.top) / scale;

    const maxZ = cutData.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const newElement: ComicCutElement = {
      ...elementData,
      id: uuidv4(),
      x: relativeX - (elementData.width / 2),
      y: relativeY - (elementData.height / 2),
      rotation: 0,
      zIndex: maxZ + 1,
      flipX: false,
    } as ComicCutElement;
    
    saveCutState(cutNumber, {
      ...cutData,
      elements: [...cutData.elements, newElement]
    });
    
    setSelectedCutNumber(cutNumber);
    setSelectedElementId(newElement.id);
    setActiveTool('character');
  }, [cutsData, saveCutState]);

  const handleDeleteElement = (id: string) => {
    const cutData = cutsData[selectedCutNumber];
    if (!cutData) return;
    saveCutState(selectedCutNumber, {
      ...cutData,
      elements: cutData.elements.filter(el => el.id !== id)
    });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleReorderElement = (id: string, direction: 'up' | 'down') => {
    const cutData = cutsData[selectedCutNumber];
    if (!cutData) return;
    const elements = [...cutData.elements];
    const index = elements.findIndex(e => e.id === id);
    if (index === -1) return;

    if (direction === 'up' && index < elements.length - 1) {
      const temp = elements[index].zIndex;
      elements[index].zIndex = elements[index + 1].zIndex;
      elements[index + 1].zIndex = temp;
    } else if (direction === 'down' && index > 0) {
      const temp = elements[index].zIndex;
      elements[index].zIndex = elements[index - 1].zIndex;
      elements[index - 1].zIndex = temp;
    }
    
    saveCutState(selectedCutNumber, { ...cutData, elements });
  };

  const handleGenerateCut = async (cutNumber: number, isManualRegenerate: boolean = false) => {
    if (!projectData) return;

    if (genStates[cutNumber]?.status === 'generating') {
      console.warn(`[ToonSchool] ${cutNumber}번 컷은 이미 생성 중입니다.`);
      return;
    }

    const currentCutData = cutsData[cutNumber];
    const isRegenerate = !!currentCutData?.backgroundImageUrl;

    if (isRegenerate) {
      if (isManualRegenerate) {
        const count = currentCutData?.backgroundRegenerateCount || 0;
        console.log(`[ToonSchool Background] REGENERATE_LIMIT_CHECK cut=${cutNumber} count=${count}`);

        if (count >= 1) {
          console.log(`[ToonSchool Background] REGENERATE_LIMIT_REACHED cut=${cutNumber}`);
          alert('배경 수정은 컷마다 1번만 할 수 있어요.');
          return;
        }
      }

      if (!confirm(`${cutNumber}컷 배경을 다시 만들까요?\\n기존 배경이 사라집니다.`)) {
        return;
      }
    }

    setGenStates(prev => ({ ...prev, [cutNumber]: { status: 'generating', progress: 0, message: '시작하는 중...' } }));

    try {
      await generateSingleComicCut(projectData, cutNumber, (state) => {
        setGenStates(prev => ({ ...prev, [cutNumber]: state }));
      });
      
      const newCutData = loadComicCutData(projectData.projectId, cutNumber);
      if (newCutData) {
        if (isRegenerate && isManualRegenerate) {
           newCutData.backgroundRegenerateCount = (currentCutData?.backgroundRegenerateCount || 0) + 1;
           try {
             saveComicCutData(projectData.projectId, cutNumber, newCutData);
           } catch (e) {
             console.error('Failed to save backgroundRegenerateCount', e);
           }
           console.log(`[ToonSchool Background] REGENERATE_LIMIT_USED cut=${cutNumber} count=${newCutData.backgroundRegenerateCount}`);
        }
        setCutsData(prev => ({ ...prev, [cutNumber]: newCutData }));
      }
    } catch (err: any) {
      console.error(`Error generating cut ${cutNumber}:`, err);
      setGenStates(prev => {
        const current = prev[cutNumber];
        if (current?.status === 'error') return prev;
        const errorCode = err.errorCode || 'UNKNOWN';
        const displayMsg = getErrorMessageByCode(errorCode);
        return {
          ...prev,
          [cutNumber]: {
            status: 'error',
            progress: 0,
            message: displayMsg,
            errorMessage: displayMsg,
            errorCode,
          }
        };
      });
      throw err;
    }
  };

  const handleGenerateAll = async () => {
    setGenAllState({ isRunning: true, completedCount: Object.values(cutsData).filter(c => c.backgroundImageUrl).length, startedAt: Date.now(), elapsedMs: 0 });
    
    for (let i = 1; i <= 6; i++) {
      if (!cutsData[i]?.backgroundImageUrl && genStates[i]?.status !== 'generating') {
        try {
          await handleGenerateCut(i);
          setGenAllState(prev => ({ ...prev, completedCount: prev.completedCount + 1 }));
          if (i < 6) {
            const delay = Math.floor(Math.random() * 1000) + 1500;
            await new Promise(r => setTimeout(r, delay));
          }
        } catch (e) {
          console.error(`[StudentComicFullViewPage] handleGenerateCut error for cut ${i}`, e);
          break; // 실패 시 순차 생성 즉시 중단
        }
      }
    }
    setGenAllState(prev => ({ ...prev, isRunning: false }));
  };

  const handleGenerateDialogues = () => {
    if (!projectData || !projectData.script || !projectData.script.cuts) return;

    const hasExistingBubbles = Object.values(cutsData).some(cut => 
      cut.elements.some(el => el.type === 'speechBubble')
    );

    if (hasExistingBubbles) {
      if (!window.confirm('이미 배치된 대사가 있습니다. 다시 생성하면 기존 말풍선 위치가 초기화됩니다. 계속할까요?')) {
        return;
      }
    }

    const newCutsData = { ...cutsData };
    let hasChanges = false;

    for (let i = 1; i <= 6; i++) {
      const cutScript = projectData.script.cuts[i - 1];
      if (!cutScript || !cutScript.dialogues || cutScript.dialogues.length === 0) continue;

      const currentCutData = newCutsData[i];
      if (!currentCutData) continue;

      const filteredElements = currentCutData.elements.filter(el => el.type !== 'speechBubble');
      let maxZ = filteredElements.reduce((max, el) => Math.max(max, el.zIndex), 0);

      const newBubbles: ComicCutElement[] = cutScript.dialogues.map((dialogue, index) => {
        maxZ += 1;
        const isSecond = index % 2 === 1;
        const startX = isSecond ? 600 : 100;
        const startY = isSecond ? 300 : 100;
        
        return {
          id: uuidv4(),
          type: 'speechBubble',
          bubbleType: 'basic',
          text: dialogue.text,
          speaker: dialogue.character,
          x: startX,
          y: startY + (Math.floor(index / 2) * 200),
          width: 300,
          height: 150,
          rotation: 0,
          zIndex: maxZ,
          style: {
            backgroundColor: '#ffffff',
            borderColor: '#000000',
            textColor: '#000000',
            fontSize: 28
          }
        } as ComicCutElement;
      });

      if (newBubbles.length > 0) {
        newCutsData[i] = {
          ...currentCutData,
          elements: [...filteredElements, ...newBubbles],
          updatedAt: new Date().toISOString()
        };
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setCutsData(newCutsData);
      Object.entries(newCutsData).forEach(([cutStr, data]) => {
        try {
          saveComicCutData(projectData.projectId, parseInt(cutStr), data);
        } catch (e: any) {
          console.error(e);
        }
      });
    } else {
      alert('배치할 대사가 없습니다.');
    }
  };

  const handleNext = () => {
    const allGenerated = [1,2,3,4,5,6].every(num => cutsData[num]?.backgroundImageUrl);
    if (!allGenerated) {
      if (!confirm('아직 그림이 없는 컷이 있어요. 그래도 다음으로 넘어갈까요?')) {
        return;
      }
    }
    navigate('/student/unit-summary', { state: { ...selectionData, projectId: projectData?.projectId } });
  };

  if (!selectionData || !projectData) {
    return (
      <StudentWorkspaceLayout currentStep="comic" title="만화제작" bgVariant="default">
        <div className="flex-1 w-full flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        </div>
      </StudentWorkspaceLayout>
    );
  }

  const tools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: '선택' },
    { id: 'character', icon: Users, label: '캐릭터' },
    { id: 'script', icon: Type, label: '대사' },
    { id: 'bubble', icon: MessageSquare, label: '말풍선' },
    { id: 'background', icon: Layout, label: '배경' },
    { id: 'layer', icon: Layers, label: '레이어' },
  ];

  const currentCutData = cutsData[selectedCutNumber];

  const allBackgroundsGenerated = [1, 2, 3, 4, 5, 6].every(num => cutsData[num]?.backgroundImageUrl);

  const expectedDialogues = [1, 2, 3, 4, 5, 6].filter(num => {
    const cutScript = projectData?.script?.cuts?.[num - 1];
    return cutScript && cutScript.dialogues && cutScript.dialogues.length > 0;
  });

  const allDialoguesGenerated = expectedDialogues.length > 0 && expectedDialogues.every(num => 
    cutsData[num]?.elements.some(el => el.type === 'speechBubble')
  );


  const actionButtons = (
    <div className="flex flex-col items-end gap-1.5 pr-8">
      <div className="flex flex-wrap items-center gap-3 justify-end">
        <button
          onClick={handleGenerateAll}
          disabled={allBackgroundsGenerated || genAllState.isRunning}
          className={`btn-student btn-student-md ${
            allBackgroundsGenerated
              ? 'bg-[#E5E7EB] border-2 border-[#D1D5DB] text-[#9CA3AF] shadow-none cursor-not-allowed'
              : 'btn-student-secondary'
          }`}
        >
          {genAllState.isRunning ? (
            <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
          ) : (
            <Sparkles className={`w-5 h-5 ${allBackgroundsGenerated ? 'text-[#9CA3AF]' : 'text-purple-500'}`} />
          )}
          <span className={allBackgroundsGenerated ? 'text-[#9CA3AF]' : 'text-purple-700'}>
            {/* 학생 화면 표시용 */}
            {genAllState.isRunning 
              ? `${genAllState.completedCount}/6 완료` 
              : allBackgroundsGenerated ? '배경 생성 완료' : '배경 모두 생성'}
            
            {/* 관리자/디버그 모드용 표시 */}
            {IS_DEBUG_MODE && (
              <div className="text-xs opacity-50 mt-1">
                {genAllState.isRunning 
                  ? `${genAllState.completedCount}/6 완료 · 누적 ${formatTime(genAllState.elapsedMs)}` 
                  : allBackgroundsGenerated ? '배경 생성 완료' : '배경 모두 생성'}
              </div>
            )}
          </span>
        </button>

        <button
          onClick={handleGenerateDialogues}
          disabled={allDialoguesGenerated}
          className={`btn-student btn-student-md ${
            allDialoguesGenerated
              ? 'bg-[#E5E7EB] border-2 border-[#D1D5DB] text-[#9CA3AF] shadow-none cursor-not-allowed'
              : 'btn-student-secondary'
          }`}
        >
          <MessageSquare className={`w-5 h-5 ${allDialoguesGenerated ? 'text-[#9CA3AF]' : 'text-indigo-500'}`} />
          <span className={allDialoguesGenerated ? 'text-[#9CA3AF]' : 'text-indigo-700'}>
            {allDialoguesGenerated ? '대사 생성 완료' : '대사 생성'}
          </span>
        </button>

        <button
          onClick={handleNext}
          className="btn-student btn-student-primary btn-student-md"
        >
          <span>단원 정리 →</span>
        </button>
      </div>
    </div>
  );

  const activePanelWidth = 72 + (activeTool !== 'select' ? 300 : 0);
  const centerOffset = activePanelWidth / 2;

  const studentId = profile?.role === 'student' ? profile.id : user?.id;
  const hiddenEncounterSourceId = projectData?.projectId ? `comic:${projectData.projectId}` : null;

  const centerContent = !allBackgroundsGenerated && !genAllState.isRunning && (
    <div 
      className="px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full font-bold text-[13px] border border-purple-100 shadow-sm flex items-center gap-2 transition-transform duration-300"
      style={{ transform: `translateX(${centerOffset}px)` }}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
      </span>
      만화제작은 최대 15분이 소요될수 있습니다
    </div>
  );

  return (
    <StudentWorkspaceLayout 
      currentStep="comic" 
      bgVariant="pastel"
      showBackButton={true}
      title="만화제작 (6컷)"
      subtitle={`왼쪽 도구를 사용해 선택한 컷(${selectedCutNumber}컷)을 편집하세요.`}
      onBack={() => navigate('/student/front-cover', { state: { ...selectionData, projectId } })}
      actionButtons={actionButtons}
      centerContent={centerContent}
    >
      <HiddenItemEncounter
        studentId={studentId}
        sourceId={hiddenEncounterSourceId}
        enabled={Boolean(studentId && hiddenEncounterSourceId)}
      />
      <div className="flex flex-col w-full h-full relative">

        {/* 하단 패널 및 캔버스 영역 */}
        <div className="flex-1 flex overflow-hidden w-full relative">
          <StudentToolPanel width="var(--student-layout-tool-panel-width,300px)" className="flex-row !w-auto">
            <div className="flex h-full shrink-0 relative z-30 bg-[#163F46] shadow-lg border-r border-[#0f3a3b]">
          {/* Main Vertical Toolbar */}
          <div className="w-[72px] h-full shrink-0 z-40 flex flex-col items-center bg-[#163F46]">
            <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto w-full pt-4 student-scrollbar">
              {tools.map(tool => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all shrink-0 ${isActive ? 'bg-[#ff2778] text-white shadow-md' : 'text-[#c7dede] hover:text-white hover:bg-white/10'}`}
                    title={tool.label}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-bold">{tool.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* Undo/Redo Group */}
            <div className="mt-auto flex flex-col items-center w-full pb-4 shrink-0">
              <div className="h-px w-10 bg-[#e2e8f0] my-2" />
              
              <button 
                onClick={() => {}} 
                disabled={true} 
                className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all text-slate-300 cursor-not-allowed"
                title="취소"
              >
                <Undo className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">취소</span>
              </button>
              <button 
                onClick={() => {}} 
                disabled={true} 
                className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all text-slate-300 cursor-not-allowed"
                title="다시실행"
              >
                <Redo className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">다시실행</span>
              </button>
            </div>
          </div>

          {/* Tool Panels */}
          {activeTool !== 'select' && (
            <div className="w-[300px] h-full transition-all shrink-0 bg-[#ffffff] border-l border-[#d9deea] z-30 overflow-y-auto student-scrollbar">
              {activeTool === 'character' && (
                <CharacterToolPanel 
                  onAddElement={handleAddElement} 
                  selectedElementId={selectedElementId}
                  elements={currentCutData?.elements || []}
                  onUpdateElement={handleUpdateElement}
                  projectId={projectData?.projectId}
                />
              )}
              {activeTool === 'script' && (
                <ComicScriptPanel 
                  elements={currentCutData?.elements || []}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onAddElement={handleAddElement} 
                />
              )}
              {activeTool === 'bubble' && (
                <ComicSpeechBubblePanel onAddElement={handleAddElement} />
              )}
              {activeTool === 'layer' && currentCutData && (
                <ComicLayerPanel 
                  elements={currentCutData.elements}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  onUpdateElement={handleUpdateElement}
                  onReorderElement={handleReorderElement}
                  onDeleteElement={handleDeleteElement}
                />
              )}
              {activeTool === 'background' && (
                <div className="p-4 flex flex-col h-full text-[#303442]">
                  <h3 className="text-sm font-bold text-[#555b6b] mb-4">배경 관리</h3>
                  <p className="text-xs text-[#8b909e] mb-6">AI가 생성한 컷의 배경을 관리합니다.</p>
                  
                  {genStates[selectedCutNumber]?.status === 'error' && (
                     <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-bold text-red-600 mb-1">생성 실패</p>
                        <p className="text-xs font-bold text-red-500 mb-2">원인: {genStates[selectedCutNumber]?.message}</p>
                        {genStates[selectedCutNumber]?.errorMessage && (
                          <p className="text-[10px] text-red-400 leading-relaxed break-words">{genStates[selectedCutNumber]?.errorMessage}</p>
                        )}
                     </div>
                  )}
                  
                  <div className="mb-4 flex-1">
                    <label className="block text-xs font-bold text-[#555b6b] mb-2 flex items-center justify-between">
                      <span>{selectedCutNumber}컷 배경 설명</span>
                    </label>
                    <textarea
                      value={currentCutData?.customBackgroundPrompt ?? ''}
                      onChange={(e) => {
                        const cutData = cutsData[selectedCutNumber];
                        if (cutData) {
                          saveCutState(selectedCutNumber, {
                            ...cutData,
                            customBackgroundPrompt: e.target.value
                          });
                        }
                      }}
                      className="w-full h-40 bg-white border border-[#d9deea] rounded-lg p-3 text-sm text-[#303442] resize-none focus:outline-none focus:border-purple-500 transition-colors"
                      placeholder="배경 설명을 입력하세요..."
                    />
                  </div>

                  <button
                    onClick={() => handleGenerateCut(selectedCutNumber, true)}
                    disabled={genStates[selectedCutNumber]?.status === 'generating' || (currentCutData?.backgroundRegenerateCount || 0) >= 1}
                    className={`flex items-center justify-center gap-2 w-full py-3 font-bold rounded-xl transition-colors disabled:opacity-50 ${
                      (currentCutData?.backgroundRegenerateCount || 0) >= 1 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    <RefreshCw className={`w-4 h-4 ${genStates[selectedCutNumber]?.status === 'generating' ? 'animate-spin' : ''}`} />
                    {(currentCutData?.backgroundRegenerateCount || 0) >= 1 ? '배경 수정 완료' : '수정한 설명으로 다시 만들기'}
                  </button>
                  <p className="text-xs text-purple-500 mt-4 text-center">
                    배경 생성 시 사람/캐릭터/글자는 포함되지 않습니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </StudentToolPanel>

      {/* Center Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative">
        {/* Canvas Area Container */}
        <div className="flex-1 w-full relative min-h-0 min-w-0 overflow-auto overscroll-contain student-scrollbar mt-6" ref={containerRef}>
          <div 
            className="p-8 pb-32 flex justify-center origin-top transition-transform duration-200"
            style={{ transform: `scale(${currentZoom / 100})`, minWidth: 'max-content', minHeight: 'max-content' }}
          >
            {detailedCutNumber ? (
              // Detailed Mode for single cut
              <div className="bg-white rounded-lg shadow-2xl flex flex-col p-6 w-[800px] h-[600px] relative">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-jua text-[#303442]">{detailedCutNumber}컷 상세 편집</h2>
                  <button onClick={() => setDetailedCutNumber(null)} className="btn-student btn-student-secondary btn-student-md">
                    전체 보기로 돌아가기
                  </button>
                </div>
                <div className="flex-1 relative">
                  <ComicCellWrapper
                    cutNumber={detailedCutNumber}
                    cutData={cutsData[detailedCutNumber]}
                    isSelected={true}
                    onClick={() => {}}
                    selectedElementId={selectedElementId}
                    onSelectElement={setSelectedElementId}
                    onUpdateElement={handleUpdateElement}
                    genState={genStates[detailedCutNumber]}
                    onGenerate={() => handleGenerateCut(detailedCutNumber)}
                    onDropElement={handleDropElement}
                  />
                </div>
              </div>
            ) : (
              // A4 Canvas Container
              <div 
                className="bg-white rounded-lg shadow-2xl flex flex-col p-6 shrink-0" 
                style={{ 
                  width: '750px', 
                  aspectRatio: '210 / 297'
                }}
              >
                {/* Top: Title Header (약 8% 비율) */}
                <div className="h-[76px] mb-4 shrink-0 bg-[#F1E7FF] rounded-xl px-5 flex items-center justify-between border-b-2 border-[#E5D5FF] shadow-sm">
                  {/* Left: Logo & Subject & Title */}
                  <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
                    <span className="font-black text-2xl tracking-tighter text-[#303442] shrink-0">TOONSCHOOL</span>
                    <div className="px-3 py-1 bg-[#DCC7FF] text-[#6D28D9] rounded-md font-bold text-sm shrink-0">
                      {projectData.subject}
                    </div>
                    <span className="text-[#BFA7F2] font-bold shrink-0 mx-1">|</span>
                    <h2 className="text-xl font-jua text-[#303442] truncate">
                      {projectData.topicTitle}
                    </h2>
                  </div>
                  {/* Right: Characters */}
                  <ToonSchoolCharacterBadgeGroup textColorClass="text-[#555b6b]" />
                </div>
                
                {/* Center: 6 Cuts (2x3 Grid) */}
                <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-3 md:gap-4 lg:gap-5">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <div key={num} className="w-full h-full relative group">
                      <ComicCellWrapper
                        cutNumber={num}
                        cutData={cutsData[num]}
                        isSelected={selectedCutNumber === num}
                        onClick={() => {
                          setSelectedCutNumber(num);
                          setSelectedElementId(null);
                        }}
                        onDoubleClick={() => toggleDetailedCut(num)}
                        selectedElementId={selectedElementId}
                        onSelectElement={setSelectedElementId}
                        onUpdateElement={handleUpdateElement}
                        genState={genStates[num]}
                        onGenerate={() => handleGenerateCut(num)}
                        onDropElement={handleDropElement}
                      />
                      {/* Detail View Overlay Button */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleDetailedCut(num); }}
                        className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-30 hover:bg-black/70"
                        title="크게 편집하기"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Bottom: Summary Area */}
                <div className="h-28 mt-6 shrink-0 bg-white border-2 border-indigo-100 rounded-xl flex items-stretch shadow-sm overflow-hidden">
                  <div className="w-32 bg-indigo-50 flex flex-col items-center justify-center shrink-0 border-r border-indigo-100 gap-1">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-jua text-indigo-800">핵심정리</span>
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-center overflow-y-auto student-scrollbar">
                    {scriptData?.keyConcepts && scriptData.keyConcepts.length > 0 ? (
                      <ul className="space-y-1.5 flex flex-col justify-center h-full">
                        {scriptData.keyConcepts.slice(0, 3).map((concept, idx) => (
                          <li key={concept.id || idx} className="text-sm flex items-start gap-2">
                            <span className="font-bold text-indigo-600 w-4 text-right shrink-0">{idx + 1}.</span>
                            <div className="flex-1 leading-snug">
                              <span className="font-bold text-[#303442] mr-2">{concept.title}</span>
                              <span className="text-[#555b6b]">{concept.description}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#8b909e] font-bold text-sm">
                        핵심 개념이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zoom Controls */}
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
      </div>
    </StudentWorkspaceLayout>
  );
}
