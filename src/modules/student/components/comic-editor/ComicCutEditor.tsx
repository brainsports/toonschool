import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { MousePointer2, Layout, Users, MessageSquare, Type, Crop, Layers, Undo, Redo, ArrowLeft, ArrowRight, Save } from 'lucide-react';

import type { ComicCutEditData, ComicCutElement } from '../editor/utils/comicStorage';
import { saveComicCutData, loadComicCutData } from '../editor/utils/comicStorage';
import ComicCanvas from './ComicCanvas';
import BackgroundInfoPanel from './BackgroundInfoPanel';
import CharacterToolPanel from './CharacterToolPanel';
import StudentWorkspaceLayout from '../layout/StudentWorkspaceLayout';
import StudentToolPanel from '../layout/StudentToolPanel';

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

  const actionButtons = (
    <>
      <div className="flex items-center gap-2 mr-4">
        {[1, 2, 3, 4, 5, 6].map(num => (
          <button
            key={num}
            onClick={() => navigate(`/student/comic/cut/${num}`)}
            className={`w-10 h-10 rounded-xl font-jua text-lg transition-all ${num === cutNumber ? 'bg-purple-600 text-white shadow-md scale-110' : 'bg-[#e9ecef] text-[#555b6b] hover:bg-[#d9deea]'}`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="w-px h-6 bg-[#d9deea] mr-2 hidden md:block" />
      <button 
        onClick={() => {
          if (cutNumber > 1) navigate(`/student/comic/cut/${cutNumber - 1}`);
        }}
        disabled={cutNumber === 1}
        className="btn-student btn-student-secondary btn-student-md disabled:opacity-50 hidden md:flex"
      >
        <ArrowLeft className="w-5 h-5" /> 이전 컷
      </button>
      <button 
        onClick={() => saveComicCutData(topicId, cutNumber, editData)}
        className="btn-student btn-student-secondary btn-student-md hidden md:flex"
      >
        <Save className="w-5 h-5" /> 임시 저장
      </button>
      <button 
        onClick={() => {
          if (cutNumber < 6) navigate(`/student/comic/cut/${cutNumber + 1}`);
          else navigate('/student/comic/full');
        }}
        className="btn-student btn-student-primary btn-student-md"
      >
        <span>{cutNumber === 6 ? '만화보기' : '다음 컷'}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </>
  );

  return (
    <StudentWorkspaceLayout
      currentStep="comic"
      title={`${cutNumber}컷 편집`}
      onBack={() => navigate('/student/comic/full')}
      actionButtons={actionButtons}
      bgVariant="pastel"
    >
      <StudentToolPanel width="var(--student-layout-tool-panel-width,280px)" className="flex-row !w-auto">
        {/* Left Tools Area */}
        <div className="flex h-full shrink-0 relative z-30 bg-[#f8f9fc] shadow-lg border-r border-[#d9deea]">
          
          {/* Main Vertical Toolbar */}
          <div className="w-[64px] h-full shrink-0 z-40 flex flex-col items-center py-4 gap-2 overflow-y-auto bg-white">
            {tools.map(tool => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${isActive ? 'bg-purple-600 text-white' : 'text-[#555b6b] hover:text-[#303442] hover:bg-[#f3f4f7]'}`}
                  title={tool.label}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">{tool.label.replace(' 설명', '')}</span>
                </button>
              );
            })}
            
            <div className="h-px w-10 bg-[#d9deea] my-2" />
            
            <button disabled className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all text-[#8b909e] cursor-not-allowed">
              <Undo className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">취소</span>
            </button>
            <button disabled className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all text-[#8b909e] cursor-not-allowed">
              <Redo className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold">다시실행</span>
            </button>
          </div>

          {/* Tool Panels */}
          {activeTool !== 'select' && (
            <div className="w-[280px] h-full transition-all shrink-0 bg-[#ffffff] border-l border-[#d9deea] z-30 overflow-y-auto p-4 flex flex-col student-scrollbar">
              {activeTool === 'background' ? (
                <BackgroundInfoPanel 
                  cutNumber={cutNumber} 
                  scriptData={scriptData} 
                  onRegenBackground={() => { alert('AI 배경 다시 만들기 기능은 추후 연결됩니다.') }} 
                />
              ) : activeTool === 'character' ? (
                <CharacterToolPanel onAddElement={handleAddElement} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#8b909e] space-y-4">
                  <span className="text-4xl">🛠️</span>
                  <p className="font-bold text-[#555b6b] text-center">
                    {tools.find(t => t.id === activeTool)?.label} 도구<br/>준비 중입니다
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </StudentToolPanel>

      {/* Center Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent h-full relative">
        {/* Canvas Area */}
        <div className="flex-1 relative overflow-auto p-2 lg:p-8 student-scrollbar" ref={containerRef}>
          <div className="w-full h-full flex justify-center items-center min-w-min min-h-min pt-4 pb-24 lg:pb-4">
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
    </StudentWorkspaceLayout>
  );
}
