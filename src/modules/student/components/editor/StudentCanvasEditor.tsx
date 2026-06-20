import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EditorState, CanvasElement, EditorToolType, EditorProps } from './types';
import { useEditorHistory } from './utils/editorHistory';
import EditorToolbar from './EditorToolbar';
import CanvasStage from './CanvasStage';
import { ArrowLeft, ArrowRight, Save, Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

import TextPanel from './panels/TextPanel';
import CharacterPanel from './panels/CharacterPanel';
import LayerPanel from './panels/LayerPanel';
import BackgroundPanel from './panels/BackgroundPanel';

export default function StudentCanvasEditor({ 
  initialState, onSave, readOnly = false, canvasWidth = 1400, canvasHeight = 1980,
  onPrev, onNext, prevText = "이전으로", nextText = "다음 단계로", mode = 'default', subject
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

  const fitScale = Math.min(
    (containerSize.width || 1400) / currentState.canvasWidth,
    (containerSize.height || 1980) / currentState.canvasHeight
  ) * 0.95;
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
        
        const scrollX = el.scrollLeft + pointerX;
        const scrollY = el.scrollTop + pointerY;
        
        const zoomRatio = newZoom / currentZoom;
        
        setZoomPercent(newZoom);
        
        requestAnimationFrame(() => {
           el.scrollLeft = scrollX * zoomRatio - pointerX;
           el.scrollTop = scrollY * zoomRatio - pointerY;
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

  return (
    <div className="flex-1 flex w-full bg-transparent overflow-hidden relative min-h-0">
      
      {/* Left Tools Area */}
      {!readOnly && (
        <div className="flex h-full shrink-0 relative z-30 bg-slate-900 shadow-2xl border-r border-white/10">
          
          {/* Main Vertical Toolbar */}
          <div className="w-[64px] h-full shrink-0 z-40">
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
            <div className="w-[280px] lg:w-[240px] xl:w-[280px] h-full transition-all shrink-0 bg-slate-800 border-l border-white/10 z-30">
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
                  <span className="text-slate-300 font-bold">도구 준비 중입니다</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Center Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative">
        
        {/* Top Header / Taskbar */}
        <div className="flex justify-between items-center px-8 py-4 shrink-0 relative z-20">
          
          {/* Left: Prev Button */}
          <div className="flex justify-start">
            {onPrev && (
              <button
                onClick={onPrev}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-jua text-base rounded-full border border-white/10 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                {prevText}
              </button>
            )}
          </div>

          {/* Right: Actions & Next */}
          <div className="flex items-center justify-end gap-3">
             <button 
               onClick={() => onSave?.(currentState)} 
               className="flex items-center gap-1.5 px-5 py-2.5 bg-purple-600/90 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm border border-purple-400/50"
             >
               <Save className="w-4 h-4" />
               진행사항 저장
             </button>
             <button 
               onClick={async () => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  await new Promise(resolve => setTimeout(resolve, 50));
                  await document.fonts.ready;
                  
                  if(!stageRef.current) return;
                  const tr = stageRef.current.findOne('Transformer');
                  if(tr) tr.hide();
                  
                  const prevSelected = selectedElementId;
                  setSelectedElementId(null);
                  
                  await new Promise(resolve => setTimeout(resolve, 50));

                  // 원본 크기로 캔버스 영역만 정확히 내보내기 위해 계산
                  const layer = stageRef.current.children[0];
                  const layerScale = layer.scaleX();
                  const layerX = layer.x();
                  const layerY = layer.y();

                  const uri = stageRef.current.toDataURL({ 
                    x: layerX,
                    y: layerY,
                    width: currentState.canvasWidth * layerScale,
                    height: currentState.canvasHeight * layerScale,
                    pixelRatio: 1 / layerScale 
                  });
                  
                  if(tr) tr.show();
                  setSelectedElementId(prevSelected);

                  const link = document.createElement('a');
                  link.download = 'toonschool_export.png';
                  link.href = uri;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
               }} 
               className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-700/90 hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg transition-all text-sm border border-slate-500/50"
             >
               <Download className="w-4 h-4" />
               PNG 내보내기
             </button>
            {onNext && (
              <button
                onClick={onNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-jua text-base rounded-full shadow-lg shadow-purple-500/30 transition-all ml-2"
              >
                {nextText}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Canvas Area Container */}
        <div className="flex-1 w-full relative p-2 min-h-0 min-w-0 overflow-auto overscroll-contain" ref={containerRef}>
          {containerSize.width > 0 && (
            <div className="w-full h-full flex items-center justify-center">
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
        <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 md:gap-3 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 px-3 py-2 md:px-4 md:py-2.5 rounded-full shadow-2xl text-slate-200">
          <button 
            onClick={() => setZoomPercent(Math.max(25, currentZoom - 10))}
            disabled={currentZoom <= 25}
            className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
            aria-label="캔버스 축소" title="축소"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs md:text-sm font-bold w-[4ch] text-center font-mono">
            {currentZoom}%
          </span>
          
          <input 
            type="range"
            min="25" max="300" step="5"
            value={currentZoom}
            onChange={(e) => setZoomPercent(parseInt(e.target.value))}
            className="w-16 md:w-24 accent-purple-500 cursor-pointer"
            aria-label="캔버스 확대 비율"
            aria-valuemin={25}
            aria-valuemax={300}
            aria-valuenow={currentZoom}
          />
          
          <button 
            onClick={() => setZoomPercent(Math.min(300, currentZoom + 10))}
            disabled={currentZoom >= 300}
            className="hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors p-1"
            aria-label="캔버스 확대" title="확대"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          <div className="w-px h-4 md:h-5 bg-slate-600 mx-0.5 md:mx-1" />
          
          <button 
            onClick={() => setZoomPercent(null)}
            className={`hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold p-1 ${zoomPercent === null ? 'text-purple-400' : 'text-slate-300'}`}
            aria-label="캔버스를 화면에 맞추기" title="화면 맞춤"
          >
            <Maximize className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden md:inline">맞춤</span>
          </button>
        </div>

      </div>

    </div>
  );
}
