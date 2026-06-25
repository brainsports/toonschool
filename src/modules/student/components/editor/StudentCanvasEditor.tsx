import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EditorState, CanvasElement, EditorToolType, EditorProps } from './types';
import { useEditorHistory } from './utils/editorHistory';
import EditorToolbar from './EditorToolbar';
import CanvasStage from './CanvasStage';
import { ArrowRight, Save, Sparkles } from 'lucide-react';

import TextPanel from './panels/TextPanel';
import CharacterPanel from './panels/CharacterPanel';
import LayerPanel from './panels/LayerPanel';
import BackgroundPanel from './panels/BackgroundPanel';
import StudentWorkspaceLayout from '../layout/StudentWorkspaceLayout';
import StudentToolPanel from '../layout/StudentToolPanel';
import StudentZoomControl from '../layout/StudentZoomControl';

export default function StudentCanvasEditor({ 
  initialState, onSave, readOnly = false, canvasWidth = 1400, canvasHeight = 1980,
  onPrev, onNext, nextText = "다음 단계로", mode = 'default', subject,
  onCompleteCover, isCoverCompleted, topicTitle
}: EditorProps) {
  const defaultState: EditorState = {
    version: '1.1',
    elements: [],
    canvasWidth,
    canvasHeight,
  };

  const { currentState, pushState, undo, redo, canUndo, canRedo } = useEditorHistory(initialState || defaultState);
  
  const [activeTool, setActiveTool] = useState<EditorToolType>('select');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const stageRef = useRef<any>(null);
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
    // 조금 늦게 측정해서 레이아웃 안정화 후 크기 계산
    setTimeout(handleResize, 50);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const SCROLL_PADDING = 40;
  const fitScale = Math.min(
    Math.max(1, (containerSize.width || 1400) - SCROLL_PADDING * 2) / currentState.canvasWidth,
    Math.max(1, (containerSize.height || 1980) - SCROLL_PADDING * 2) / currentState.canvasHeight
  );
  const currentZoom = zoomPercent !== null ? zoomPercent : Math.round(fitScale * 100);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // prevent browser zoom
        const delta = e.deltaY > 0 ? -5 : 5;
        let newZoom = currentZoom + delta;
        newZoom = Math.max(25, Math.min(300, newZoom));
        
        const rect = el.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;
        
        const SCROLL_PADDING = 40;
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

  const handleAddElement = (element: Omit<CanvasElement, 'id'>) => {
    const newElement = { ...element, id: uuidv4() } as CanvasElement;
    const maxZ = Math.max(0, ...currentState.elements.map(e => e.zIndex));
    newElement.zIndex = maxZ + 1;
    
    pushState({
      ...currentState,
      elements: [...currentState.elements, newElement]
    });
    setSelectedElementId(newElement.id);
    setActiveTool('select');
  };

  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    const newElements = currentState.elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    pushState({ ...currentState, elements: newElements });
  };

  const handleDeleteElement = (id: string) => {
    pushState({
      ...currentState,
      elements: currentState.elements.filter(el => el.id !== id)
    });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleToggleVisibility = (id: string) => {
    const el = currentState.elements.find(e => e.id === id);
    if (!el) return;
    const newVisible = el.visible !== false ? false : true;
    handleUpdateElement(id, { visible: newVisible });
    if (!newVisible && selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const handleReorderElement = (id: string, direction: 'up' | 'down') => {
    const elements = [...currentState.elements];
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
    
    pushState({ ...currentState, elements });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) handleDeleteElement(selectedElementId);
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        if (e.shiftKey) redo();
        else undo();
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, undo, redo]);

  useEffect(() => {
    if (selectedElementId) {
      const el = currentState.elements.find(e => e.id === selectedElementId);
      if (el && el.type === 'text') {
        setActiveTool('text');
      }
    }
  }, [selectedElementId, currentState.elements]);

  const title = mode === 'front-cover' ? '표지 만들기' : mode === 'comic-cut' ? '만화 제작하기' : '편집하기';

  const actionButtons = (
    <>
      {mode === 'front-cover' && onCompleteCover && (
        <button 
          onClick={() => {
            const newState = onCompleteCover(currentState);
            if (newState) pushState(newState);
          }}
          disabled={isCoverCompleted}
          className={`btn-student btn-student-primary btn-student-md ${isCoverCompleted ? 'disabled' : ''}`}
        >
          <Sparkles className="w-5 h-5" />
          <span>{isCoverCompleted ? '표지 완성됨' : '표지 완성하기'}</span>
        </button>
      )}
      <button 
        onClick={() => onSave?.(currentState)} 
        className="btn-student btn-student-secondary btn-student-md"
      >
        <Save className="w-5 h-5" />
        <span className="hidden sm:inline">진행사항 저장</span>
      </button>

      {onNext && (
        <button
          onClick={() => onNext(currentState)}
          className="btn-student btn-student-primary btn-student-md"
        >
          <span>{nextText}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </>
  );

  return (
    <StudentWorkspaceLayout
      currentStep={mode === 'front-cover' ? 'frontCover' : 'comic'}
      title={title}
      subtitle={topicTitle}
      showBackButton={true}
      onBack={onPrev}
      actionButtons={actionButtons}
      bgVariant="pastel"
    >
      <StudentToolPanel width="var(--student-layout-tool-panel-width,320px)" className="flex-row !w-auto">
        {!readOnly && (
          <div className="flex h-full shrink-0 relative z-10 bg-[#f8f9fc] shadow-lg border-r border-[#d9deea]">
            
            {/* Main Vertical Toolbar */}
            <div className="w-[64px] h-full shrink-0 z-20 bg-white shadow-lg border-r border-[#d9deea]">
              <EditorToolbar 
                activeTool={activeTool}
                onChangeTool={setActiveTool}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                showBackgroundTool={mode === 'front-cover'}
              />
            </div>

            {/* Tool Panels */}
            {activeTool !== 'select' && (
              <div className="w-[280px] lg:w-[240px] xl:w-[280px] h-full transition-all shrink-0 bg-[#ffffff] flex flex-col z-10">
                {/* No spacer needed anymore as header is now relative */}
                
                <div className="flex-1 w-full relative overflow-y-auto">
                  {activeTool === 'text' && (
                    <TextPanel 
                      onAddElement={handleAddElement} 
                      selectedElement={selectedElementId ? currentState.elements.find(e => e.id === selectedElementId) || null : null}
                      onUpdateElement={handleUpdateElement}
                    />
                  )}
                  {activeTool === 'character' && (
                    <CharacterPanel onAddElement={handleAddElement} subject={subject} />
                  )}
                  {activeTool === 'layer' && (
                    <LayerPanel 
                      elements={currentState.elements}
                      selectedElementId={selectedElementId}
                      onSelectElement={setSelectedElementId}
                      onToggleVisibility={handleToggleVisibility}
                      onReorderElement={handleReorderElement}
                    />
                  )}
                  {activeTool === 'background' && (
                    <BackgroundPanel 
                      selectedCoverId={currentState.coverTemplateId}
                      onSelectCover={(id) => pushState({ ...currentState, coverTemplateId: id })}
                    />
                  )}
                  {['bubble', 'graphic', 'shape'].includes(activeTool) && (
                    <div className="w-full h-full p-4 flex flex-col items-center justify-center space-y-4">
                      <span className="text-4xl">🛠️</span>
                      <span className="text-slate-400 font-bold">도구 준비 중입니다</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </StudentToolPanel>

      {/* Center Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative" ref={containerRef}>
        
        {/* Canvas Area Container */}
        <div className="flex-1 w-full relative p-4 lg:p-8 min-h-0 min-w-0 overflow-auto overscroll-contain student-scrollbar">
          {containerSize.width > 0 && (
            <div className="w-full h-full flex justify-center items-center min-w-min min-h-min">
              <CanvasStage 
                state={currentState}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onChangeElement={handleUpdateElement}
                stageRef={stageRef}
                containerWidth={containerSize.width}
                containerHeight={containerSize.height}
                zoomPercent={zoomPercent}
              />
            </div>
          )}
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
    </StudentWorkspaceLayout>
  );
}
