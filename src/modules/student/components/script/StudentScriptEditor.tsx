import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, ZoomIn, ZoomOut, Maximize, Eye, Sparkles, Loader2 } from 'lucide-react';
import ScriptToolbar from './ScriptToolbar';
import ScriptPreviewBoard from './ScriptPreviewBoard';
import ScriptCutEditor from './ScriptCutEditor';
import type { StudentUnitSelection } from '../../types/studentCurriculum';
import type { TopicRecommendation } from '../../types/studentTopic';
import { generateScript, generateCoverContent, type GeneratedComicScript, type CoverKeyConcept, type CoverDialogue } from '../../services/studentScriptService';
import ScriptKeyConceptPanel from './panels/ScriptKeyConceptPanel';
import ScriptCoverDialoguePanel from './panels/ScriptCoverDialoguePanel';

export type ScriptToolType = 'ai' | 'cut' | 'concept' | 'coverDialogue';

interface StudentScriptEditorProps {
  selectionData: {
    selection: StudentUnitSelection;
    topic: TopicRecommendation;
    extraRequest?: string;
    selectedKeywords?: string[];
  };
  onPrev: () => void;
  onNext: (keyConcepts?: CoverKeyConcept[], coverDialogue?: CoverDialogue) => void;
}

export default function StudentScriptEditor({ selectionData, onPrev, onNext }: StudentScriptEditorProps) {
  const [activeTool, setActiveTool] = useState<ScriptToolType>('ai');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [selectedCut, setSelectedCut] = useState<number | null>(null);
  
  // Script states
  const [scriptData, setScriptData] = useState<GeneratedComicScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState<0 | 1 | 2>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 줌 상태 관리
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('studentScript');
    if (saved) {
      try {
        setScriptData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved script', e);
      }
    }
  }, []);

  const handleUpdateScript = (newData: GeneratedComicScript) => {
    setScriptData(newData);
    localStorage.setItem('studentScript', JSON.stringify(newData));
  };

  const isSaveDisabled = !scriptData || scriptData.cuts.some(cut => 
    cut.dialogues.some(d => Array.from(d.text).length > 20)
  );

  const requestPayload = {
    gradeName: selectionData.selection.gradeName || '',
    subjectName: selectionData.selection.subjectName || '',
    majorUnitName: selectionData.selection.majorUnitName || '',
    middleUnitName: selectionData.selection.middleUnitName || '',
    middleUnitId: selectionData.selection.middleUnitId || '',
    learningTopicId: selectionData.topic.id,
    storyTitle: selectionData.topic.title,
    storySummary: selectionData.topic.summary || '',
    keywords: selectionData.selectedKeywords || selectionData.topic.keywords || [],
    setting: selectionData.topic.setting || '',
    incident: selectionData.topic.incident || '',
    problem: selectionData.topic.problem || '',
    resolutionDirection: selectionData.topic.resolutionDirection || '',
    learningConnection: selectionData.topic.learningConnection || ''
  };

  const handleGenerateScript = async () => {
    if (scriptData && (!scriptData.generationStatus || scriptData.generationStatus.script === 'success')) {
      const confirmMsg = '현재 수정한 대본이 새로운 대본으로 바뀝니다. 다시 만들까요?';
      if (!window.confirm(confirmMsg)) return;
    }

    if (!selectionData.selection.middleUnitId) {
      setErrorMsg('단원 정보가 부족하여 생성할 수 없습니다.');
      return;
    }

    setIsGenerating(true);
    setGenPhase(1);
    setErrorMsg(null);

    let currentScript: GeneratedComicScript;

    // 1단계: 6컷 대본 생성
    try {
      currentScript = await generateScript(requestPayload);
      currentScript.generationStatus = { script: 'success', coverContent: 'idle' };
      setScriptData(currentScript);
      localStorage.setItem('studentScript', JSON.stringify(currentScript));
    } catch (err: any) {
      setErrorMsg(err.message || '6컷 대본을 만들지 못했습니다. 다시 시도해 주세요.');
      setIsGenerating(false);
      setGenPhase(0);
      return; // 1단계 실패 시 중단 (기존 데이터는 유지됨)
    }

    // 2단계: 핵심 개념 및 표지 대화 생성
    setGenPhase(2);
    try {
      const coverData = await generateCoverContent(currentScript, requestPayload);
      const finalScript = {
        ...currentScript,
        keyConcepts: coverData.keyConcepts,
        coverDialogue: coverData.coverDialogue,
        generationStatus: { script: 'success' as const, coverContent: 'success' as const }
      };
      setScriptData(finalScript);
      localStorage.setItem('studentScript', JSON.stringify(finalScript));
      
      // 생성 완료 후 자동으로 컷 편집으로 이동
      setTimeout(() => {
        setActiveTool('cut');
      }, 1500);
    } catch (err: any) {
      // 2단계 실패 시 대본은 유지하고 상태만 업데이트
      const failedScript = {
        ...currentScript,
        generationStatus: { script: 'success' as const, coverContent: 'error' as const }
      };
      setScriptData(failedScript);
      localStorage.setItem('studentScript', JSON.stringify(failedScript));
      setErrorMsg(err.message || '대본은 완성됐지만 표지 내용을 만들지 못했습니다.');
    } finally {
      setIsGenerating(false);
      setGenPhase(0);
    }
  };

  const handleRetryCoverContent = async () => {
    if (!scriptData) return;
    
    setIsGenerating(true);
    setGenPhase(2);
    setErrorMsg(null);

    try {
      const coverData = await generateCoverContent(scriptData, requestPayload);
      const finalScript = {
        ...scriptData,
        keyConcepts: coverData.keyConcepts,
        coverDialogue: coverData.coverDialogue,
        generationStatus: { script: 'success' as const, coverContent: 'success' as const }
      };
      setScriptData(finalScript);
      localStorage.setItem('studentScript', JSON.stringify(finalScript));
      
      setTimeout(() => {
        setActiveTool('cut');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || '대본은 완성됐지만 표지 내용을 만들지 못했습니다.');
    } finally {
      setIsGenerating(false);
      setGenPhase(0);
    }
  };

  const handleProceedNext = () => {
    if (!scriptData) {
      alert('먼저 AI로 6컷 대본을 만들어 주세요.');
      setActiveTool('ai');
      return;
    }
    
    const keyConcepts = scriptData.keyConcepts || [];
    const hasValidKeyConcepts = keyConcepts.length === 3 && keyConcepts.every(c => c.title.trim().length > 0 && c.description.trim().length > 0);
    
    if (!hasValidKeyConcepts) {
      alert('핵심 개념 3가지를 확인해 주세요.');
      setActiveTool('concept');
      if (!isPanelOpen && window.innerWidth < 1024) {
        setIsPanelOpen(true);
      }
      return;
    }

    const coverDialogue = scriptData.coverDialogue;
    if (!coverDialogue || !coverDialogue.hana.trim() || !coverDialogue.doyoon.trim() || !coverDialogue.seoa.trim()) {
      alert('표지 대화 3개를 확인해 주세요.');
      setActiveTool('coverDialogue');
      if (!isPanelOpen && window.innerWidth < 1024) {
        setIsPanelOpen(true);
      }
      return;
    }
    
    onNext(keyConcepts, coverDialogue);
  };

  // 태블릿 등에서 패널 자동 닫기 처리
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsPanelOpen(false);
      } else {
        setIsPanelOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex-1 flex w-full bg-[#f3f4f7] overflow-hidden relative min-h-0">
      
      {/* Left Tools Area */}
      <div className="flex h-full shrink-0 relative z-30 bg-[#f3f4f7] border-r border-[#dfe2ea]">
        
        {/* Main Vertical Toolbar */}
        <div className="w-[64px] h-full shrink-0 z-40">
          <ScriptToolbar 
            activeTool={activeTool}
            onSelectTool={(tool: ScriptToolType) => {
              setActiveTool(tool);
              if (!isPanelOpen && window.innerWidth < 1024) {
                setIsPanelOpen(true);
              }
            }}
          />
        </div>

        {/* Tool Panels */}
        {isPanelOpen && (
          <div className="w-[300px] lg:w-[320px] h-full transition-all shrink-0 bg-[#f3f4f7] border-r border-[#dfe2ea] z-30 flex flex-col relative">
            {/* 태블릿용 닫기 버튼 */}
            <button 
              className="lg:hidden absolute top-2 right-2 text-[#555b6b] hover:text-[#ff2778] p-2"
              onClick={() => setIsPanelOpen(false)}
            >
              ✕
            </button>
            
            <div className="p-5 flex-1 overflow-y-auto">
              {activeTool === 'ai' && (
                <div className="flex flex-col h-full text-[#303442]">
                  <h2 className="text-xl font-jua text-[#202330] mb-6">AI 대본 만들기</h2>
                  
                  <div className="bg-[#ffffff] border border-[#dfe2ea] rounded-xl p-4 mb-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#626776]">학년</span>
                      <span className="font-bold">{selectionData.selection.gradeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#626776]">과목</span>
                      <span className="font-bold">{selectionData.selection.subjectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#626776]">학습 주제</span>
                      <span className="font-bold text-right pl-4">{selectionData.topic.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#626776]">선택한 이야기</span>
                      <span className="font-bold text-right pl-4">{selectionData.topic.summary}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3">
                    {errorMsg && (
                      <div className="text-sm text-[#ff2778] bg-[#fff0f5] p-3 rounded-lg border border-[#ffccdc]">
                        {errorMsg}
                      </div>
                    )}
                    <button 
                      onClick={handleGenerateScript}
                      disabled={isGenerating}
                      aria-label="AI로 6컷 대본 생성하기"
                      className="w-full py-4 rounded-xl font-jua text-lg bg-[#ff2778] hover:bg-[#e91e68] active:bg-[#d7185d] disabled:bg-[#ff9ebc] disabled:cursor-not-allowed text-white shadow-lg transition-all flex items-center justify-center gap-2 min-h-[52px]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{genPhase === 1 ? '1단계: 6컷 대화를 만들고 있어요...' : '2단계: 핵심 개념과 표지 대화를 정리하고 있어요...'}</span>
                        </>
                      ) : scriptData?.generationStatus?.script === 'success' && scriptData?.generationStatus?.coverContent === 'success' ? (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>AI로 다시 만들기</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>AI 생성하기</span>
                        </>
                      )}
                    </button>
                    {scriptData?.generationStatus?.script === 'success' && scriptData?.generationStatus?.coverContent === 'error' && !isGenerating && (
                      <button 
                        onClick={handleRetryCoverContent}
                        className="w-full py-4 rounded-xl font-jua text-lg bg-[#4d82f3] hover:bg-[#396ae1] text-white shadow-lg transition-all flex items-center justify-center gap-2 min-h-[52px]"
                      >
                        <Sparkles className="w-5 h-5" />
                        <span>표지 내용 다시 만들기</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {activeTool === 'cut' && scriptData && (
                <ScriptCutEditor 
                  scriptData={scriptData} 
                  onChange={handleUpdateScript} 
                  selectedCut={selectedCut} 
                  onSelectCut={setSelectedCut} 
                />
              )}
              {activeTool === 'cut' && !scriptData && (
                <div className="flex flex-col items-center justify-center h-full text-[#555b6b] font-jua text-lg">
                  <p>먼저 AI 대본을 생성해주세요.</p>
                </div>
              )}
              
              {activeTool === 'concept' && scriptData && (
                <ScriptKeyConceptPanel
                  scriptData={scriptData}
                  onChange={handleUpdateScript}
                />
              )}
              {activeTool === 'concept' && !scriptData && (
                <div className="flex flex-col items-center justify-center h-full text-[#555b6b] font-jua text-lg">
                  <p>먼저 AI 대본을 생성해주세요.</p>
                </div>
              )}
              
              {activeTool === 'coverDialogue' && scriptData && (
                <ScriptCoverDialoguePanel
                  scriptData={scriptData}
                  onChange={handleUpdateScript}
                />
              )}
              {activeTool === 'coverDialogue' && !scriptData && (
                <div className="flex flex-col items-center justify-center h-full text-[#555b6b] font-jua text-lg">
                  <p>먼저 AI 대본을 생성해주세요.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Center Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f3f4f7] h-full relative">
        
        {/* Top Header / Taskbar */}
        <div className="flex justify-between items-center px-6 lg:px-8 py-4 shrink-0 relative z-20">
          
          <div className="flex justify-start">
            <button
              onClick={onPrev}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ffffff] hover:bg-slate-50 text-[#303442] font-jua text-base rounded-full border border-[#d5d9e2] transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              이전으로
            </button>
          </div>

          <div className="flex items-center justify-end gap-3">
             <button 
               className="flex items-center gap-1.5 px-4 lg:px-5 py-2.5 bg-[#ffffff] hover:bg-slate-50 text-[#303442] font-bold rounded-xl shadow-sm transition-all text-sm border border-[#d5d9e2]"
             >
               <Eye className="w-4 h-4" />
               <span className="hidden sm:inline">대본 미리보기</span>
             </button>
             <button 
               disabled={isSaveDisabled}
               className={`flex items-center gap-1.5 px-4 lg:px-5 py-2.5 font-bold rounded-xl shadow-sm transition-all text-sm border ${isSaveDisabled ? 'bg-[#f3f4f7] text-[#8f95a6] border-[#d5d9e2] cursor-not-allowed' : 'bg-[#ffffff] hover:bg-slate-50 text-[#303442] border-[#d5d9e2]'}`}
             >
               <Save className="w-4 h-4" />
               <span className="hidden sm:inline">진행사항 저장</span>
             </button>
             <button
               disabled={isSaveDisabled}
               onClick={handleProceedNext}
               className={`flex items-center gap-2 px-6 py-2.5 font-jua text-base rounded-full shadow-lg transition-all ml-2 ${isSaveDisabled ? 'bg-[#e5e7eb] text-[#8f95a6] cursor-not-allowed' : 'bg-[#ff2778] text-[#ffffff] hover:bg-[#e91e68]'}`}
             >
               앞표지 만들기
               <ArrowRight className="w-4 h-4" />
             </button>
          </div>
          {/* 에러 메시지: 20자 초과 시 */}
          {isSaveDisabled && scriptData && (
            <div className="absolute -bottom-6 right-8 text-xs font-bold text-[#ff2778] bg-white px-3 py-1 rounded-full shadow-sm border border-[#ffccdc]">
              20자를 초과한 대사가 있어 저장할 수 없습니다.
            </div>
          )}
        </div>

        {/* Canvas Area Container */}
        <div 
          className="flex-1 w-full relative p-4 lg:p-8 min-h-0 min-w-0 overflow-auto overscroll-contain" 
          ref={containerRef}
        >
          <div className="w-full h-full flex justify-center items-start min-w-min min-h-min">
             <ScriptPreviewBoard 
                zoomPercent={zoomPercent} 
                selectionData={selectionData}
                selectedCut={selectedCut}
                onSelectCut={setSelectedCut}
                scriptData={scriptData}
             />
          </div>
        </div>
        
        {/* Zoom Controls */}
        <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 md:gap-3 bg-[#ffffff] bg-opacity-95 backdrop-blur-sm border border-[#dfe2ea] px-3 py-2 md:px-4 md:py-2.5 rounded-full shadow-lg text-[#303442]">
          <button 
            onClick={() => setZoomPercent(Math.max(25, zoomPercent - 10))}
            disabled={zoomPercent <= 25}
            className="hover:text-[#ff2778] disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs md:text-sm font-bold w-[4ch] text-center font-mono">
            {zoomPercent}%
          </span>
          
          <input 
            type="range"
            min="25" max="200" step="5"
            value={zoomPercent}
            onChange={(e) => setZoomPercent(parseInt(e.target.value))}
            className="w-16 md:w-24 accent-[#ff2778] cursor-pointer"
          />
          
          <button 
            onClick={() => setZoomPercent(Math.min(200, zoomPercent + 10))}
            disabled={zoomPercent >= 200}
            className="hover:text-[#ff2778] disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="w-px h-4 md:h-5 bg-[#d5d9e2] mx-0.5 md:mx-1" />
          
          <button 
            onClick={() => setZoomPercent(100)}
            className="hover:text-[#ff2778] transition-colors flex items-center gap-1.5 text-xs font-bold p-1 text-[#555b6b]"
          >
            <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden md:inline">맞춤</span>
          </button>
        </div>

      </div>
    </div>
  );
}
