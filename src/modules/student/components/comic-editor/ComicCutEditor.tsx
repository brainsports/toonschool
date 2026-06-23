import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { MousePointer2, Layout, Users, MessageSquare, Type, Crop, Layers, Undo, Redo, ArrowLeft, ArrowRight, Save, LayoutGrid } from 'lucide-react';

import type { ComicCutEditData, ComicCutElement } from '../editor/utils/comicStorage';
import { saveComicCutData, loadComicCutData } from '../editor/utils/comicStorage';
import ComicCanvas from './ComicCanvas';
import BackgroundInfoPanel from './BackgroundInfoPanel';
import CharacterToolPanel from './CharacterToolPanel';

type ToolType = 'select' | 'background' | 'character' | 'bubble' | 'dialogue' | 'crop' | 'layer';

interface Props {
  topicId: string;
  cutNumber: number;
  scriptData?: any;
}

export default function ComicCutEditor({ topicId, cutNumber, scriptData }: Props) {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<ToolType>('background');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  const [editData, setEditData] = useState<ComicCutEditData>(() => {
    const saved = loadComicCutData(topicId, cutNumber);
    return saved || {
      cutNumber,
      elements: [],
      updatedAt: new Date().toISOString()
    };
  });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    setTimeout(handleResize, 50);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveState = useCallback((newData: ComicCutEditData) => {
    const updated = { ...newData, updatedAt: new Date().toISOString() };
    setEditData(updated);
    saveComicCutData(topicId, cutNumber, updated);
  }, [topicId, cutNumber]);

  const handleUpdateElement = (id: string, updates: Partial<ComicCutElement>) => {
    saveState({
      ...editData,
      elements: editData.elements.map(el => el.id === id ? { ...el, ...updates } : el)
    });
  };

  const handleAddElement = (element: Omit<ComicCutElement, 'id'>) => {
    const maxZ = editData.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    const newElement: ComicCutElement = {
      ...element,
      id: uuidv4(),
      zIndex: maxZ + 1
    } as ComicCutElement;
    saveState({
      ...editData,
      elements: [...editData.elements, newElement]
    });
    setSelectedElementId(newElement.id);
  };

  const handleDeleteElement = (id: string) => {
    saveState({
      ...editData,
      elements: editData.elements.filter(el => el.id !== id)
    });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) handleDeleteElement(selectedElementId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, editData.elements]);

  const tools: { id: ToolType; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: '선택' },
    { id: 'background', icon: Layout, label: '배경 설명' },
    { id: 'character', icon: Users, label: '캐릭터' },
    { id: 'bubble', icon: MessageSquare, label: '말풍선' },
    { id: 'dialogue', icon: Type, label: '대사' },
    { id: 'crop', icon: Crop, label: '자르기' },
    { id: 'layer', icon: Layers, label: '레이어' },
  ];

  return (
    <div className="flex-1 flex w-full bg-transparent overflow-hidden relative min-h-0">
      
      {/* Left Tools Area (Black/Dark) */}
      <div className="flex h-full shrink-0 relative z-30 bg-slate-900 shadow-2xl border-r border-white/10">
        
        {/* Main Vertical Toolbar */}
        <div className="w-[64px] h-full shrink-0 z-40 flex flex-col items-center py-4 gap-2 overflow-y-auto">
          {tools.map(tool => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${isActive ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
                title={tool.label}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold">{tool.label.replace(' 설명', '')}</span>
              </button>
            );
          })}
          
          <div className="h-px w-10 bg-white/10 my-2" />
          
          <button disabled className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all text-slate-600 cursor-not-allowed">
            <Undo className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">취소</span>
          </button>
          <button disabled className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all text-slate-600 cursor-not-allowed">
            <Redo className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">다시실행</span>
          </button>
        </div>

        {/* Tool Panels (Dark styling) */}
        {activeTool !== 'select' && (
          <div className="w-[280px] h-full transition-all shrink-0 bg-slate-800 border-l border-white/10 z-30 overflow-y-auto p-4 flex flex-col">
            {activeTool === 'background' ? (
              <BackgroundInfoPanel 
                cutNumber={cutNumber} 
                scriptData={scriptData} 
                onRegenBackground={() => { alert('AI 배경 다시 만들기 기능은 추후 연결됩니다.') }} 
              />
            ) : activeTool === 'character' ? (
              <CharacterToolPanel onAddElement={handleAddElement} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <span className="text-4xl">🛠️</span>
                <p className="font-bold text-slate-300 text-center">
                  {tools.find(t => t.id === activeTool)?.label} 도구<br/>준비 중입니다
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f3f4f7] h-full relative">
        
        {/* Top Header / Taskbar */}
        <div className="h-[68px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student/comic/full')}
              className="flex items-center gap-2 text-slate-600 hover:text-purple-600 font-bold transition-colors"
            >
              <LayoutGrid className="w-5 h-5" />
              만화보기
            </button>
            <div className="w-px h-6 bg-slate-300" />
            <h2 className="font-jua text-2xl text-slate-800">
              {cutNumber}컷 편집
            </h2>
          </div>

          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => navigate(`/student/comic/cut/${num}`)}
                className={`w-10 h-10 rounded-xl font-jua text-lg transition-all ${num === cutNumber ? 'bg-purple-600 text-white shadow-md scale-110' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (cutNumber > 1) navigate(`/student/comic/cut/${cutNumber - 1}`);
              }}
              disabled={cutNumber === 1}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200 text-sm"
            >
              <ArrowLeft className="w-4 h-4" /> 이전 컷
            </button>
            <button 
              onClick={() => saveComicCutData(topicId, cutNumber, editData)}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-slate-700 font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-300 shadow-sm text-sm"
            >
              <Save className="w-4 h-4" /> 임시 저장
            </button>
            <button 
              onClick={() => {
                if (cutNumber < 6) navigate(`/student/comic/cut/${cutNumber + 1}`);
                else navigate('/student/comic/full');
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-xl shadow-md transition-colors flex items-center gap-1.5 text-sm"
            >
              {cutNumber === 6 ? '만화보기' : '다음 컷'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden" ref={containerRef}>
          {canvasSize.width > 0 && (
            <ComicCanvas
              data={editData}
              containerWidth={canvasSize.width}
              containerHeight={canvasSize.height}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
            />
          )}
        </div>
      </div>
    </div>
  );
}
