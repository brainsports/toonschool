import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import ScriptToolbar from './ScriptToolbar';
import ScriptPreviewBoard from './ScriptPreviewBoard';
import ScriptCutEditor from './ScriptCutEditor';
import type { StudentUnitSelection } from '../../types/studentCurriculum';
import type { TopicRecommendation } from '../../types/studentTopic';
import { generateScript, generateCoverContent, type GeneratedComicScript, type CoverKeyConcept, type CoverDialogue } from '../../services/studentScriptService';
import ScriptKeyConceptPanel from './panels/ScriptKeyConceptPanel';
import ScriptCoverDialoguePanel from './panels/ScriptCoverDialoguePanel';
import { projectStorage } from '../../utils/projectStorage';
import { showToast } from '../../utils/toast';
import StudentWorkspaceLayout from '../layout/StudentWorkspaceLayout';
import StudentToolPanel from '../layout/StudentToolPanel';
import StudentZoomControl from '../layout/StudentZoomControl';

export type ScriptToolType = 'ai' | 'cut' | 'concept' | 'coverDialogue';

interface StudentScriptEditorProps {
  selectionData: {
    selection: StudentUnitSelection;
    topic: TopicRecommendation;
    extraRequest?: string;
    selectedKeywords?: string[];
  };
  projectId: string;
  onPrev: () => void;
  onNext: (keyConcepts?: CoverKeyConcept[], coverDialogue?: CoverDialogue, scriptData?: GeneratedComicScript) => void;
}

export default function StudentScriptEditor({ selectionData, projectId, onPrev, onNext }: StudentScriptEditorProps) {
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
    if (!projectId) return;
    const saved = projectStorage.loadScript<GeneratedComicScript>(projectId);
    if (saved) {
      setScriptData(saved);
    }
  }, [projectId]);

  const handleUpdateScript = (newData: GeneratedComicScript) => {
    setScriptData(newData);
    projectStorage.saveScript(projectId, newData);
  };

  const isSaveDisabled = !scriptData || !scriptData.cuts || scriptData.cuts.length === 0;
  const hasLongDialogue = scriptData?.cuts.some(cut => 
    cut.dialogues.some(d => Array.from(d.text || '').length > 20)
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
      projectStorage.saveScript(projectId, currentScript);
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
      projectStorage.saveScript(projectId, finalScript);
      
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
      projectStorage.saveScript(projectId, failedScript);
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
      projectStorage.saveScript(projectId, finalScript);
      
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
    
    const success = projectStorage.saveScript(projectId, scriptData);
    if (!success) {
      alert('저장에 실패했습니다. 저장 공간을 확인해 주세요.');
      return;
    }
    showToast('저장되었습니다');
    onNext(keyConcepts, coverDialogue, scriptData);
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

  const actionButtons = (
    <button
      disabled={isSaveDisabled}
      onClick={handleProceedNext}
      className={`btn-student btn-student-primary btn-student-md ${isSaveDisabled ? 'disabled' : ''}`}
    >
      <span>표지만들기</span>
      <ArrowRight className="w-5 h-5" />
    </button>
  );

  return (
    <StudentWorkspaceLayout
      currentStep="script"
      showBackButton={true}
      title="대본 만들기"
      subtitle={selectionData.topic.title}
      onBack={onPrev}
      actionButtons={actionButtons}
      bgVariant="space"
    >
      {/* Left Tools Area */}
      <StudentToolPanel width="var(--student-layout-tool-panel-width,320px)" className="flex-row !w-auto">
        {/* Main Vertical Toolbar */}
        <div className="w-[64px] h-full shrink-0 z-40 bg-[var(--student-color-tool-panel-bg,#f8f9fc)]">
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
          <div className="w-[300px] lg:w-[320px] h-full transition-all shrink-0 bg-[#ffffff] border-l border-[var(--student-color-border,#d9deea)] z-30 flex flex-col relative">
            {/* 태블릿용 닫기 버튼 */}
            <button 
              className="lg:hidden absolute top-2 right-2 text-[#555b6b] hover:text-[#ff2778] p-2"
              onClick={() => setIsPanelOpen(false)}
            >
              ✕
            </button>
            
            <div className="p-5 flex-1 overflow-y-auto student-scrollbar">
              {activeTool === 'ai' && (
                <div className="flex flex-col h-full text-[#303442]">
                  <h2 className="text-xl font-jua text-[var(--student-color-text-main,#1f2433)] mb-6">AI 대본 만들기</h2>
                  
                  <div className="bg-[#f8f9fc] border border-[#d9deea] rounded-xl p-4 mb-6 space-y-3 text-sm">
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
                      className="btn-student btn-student-primary w-full min-h-[52px]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{genPhase === 1 ? '1단계: 대본 생성중...' : '2단계: 표지 내용 생성중...'}</span>
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
                        className="btn-student btn-student-purple w-full min-h-[52px]"
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
      </StudentToolPanel>

      {/* Center Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative" ref={containerRef}>

        {/* Canvas Area Container */}
        <div className="flex-1 w-full relative p-4 lg:p-8 min-h-0 min-w-0 overflow-auto overscroll-contain student-scrollbar">
          <div className="w-full h-full flex justify-center items-center min-w-min min-h-min">
             <ScriptPreviewBoard 
                zoomPercent={zoomPercent} 
                selectionData={selectionData}
                selectedCut={selectedCut}
                onSelectCut={setSelectedCut}
                scriptData={scriptData}
             />
          </div>
        </div>
        
        {/* 경고 메시지: 20자 초과 시 */}
        {hasLongDialogue && scriptData && (
          <div className="absolute top-4 right-4 z-50 text-xs font-bold text-[#d97706] bg-[#fffbeb] px-3 py-1 rounded-full shadow-sm border border-[#fef3c7]">
            20자를 넘는 대사가 있어요. 말풍선에서 잘릴 수 있으니 나중에 줄여 주세요.
          </div>
        )}

        {/* Zoom Controls */}
        <StudentZoomControl
          scale={zoomPercent / 100}
          onZoomIn={() => setZoomPercent(Math.min(200, zoomPercent + 10))}
          onZoomOut={() => setZoomPercent(Math.max(25, zoomPercent - 10))}
          onFitToScreen={() => setZoomPercent(100)}
          minScale={0.25}
          maxScale={2.0}
        />
      </div>
    </StudentWorkspaceLayout>
  );
}
