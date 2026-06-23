import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { ComicCutElement } from '../editor/utils/comicStorage';

interface Props {
  elements: ComicCutElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<ComicCutElement>) => void;
  onReorderElement: (id: string, direction: 'up' | 'down') => void;
  onDeleteElement: (id: string) => void;
}

export default function ComicLayerPanel({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onReorderElement,
  onDeleteElement
}: Props) {
  // Sort elements by zIndex descending for the panel
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const getElementLabel = (el: ComicCutElement) => {
    switch(el.type) {
      case 'character': return el.name || '캐릭터';
      case 'speechBubble': return (el.text || '').substring(0, 10) + '...';
      case 'text': return (el.text || '').substring(0, 10) + '...';
      case 'image': return '이미지';
      default: return '도형';
    }
  };

  return (
    <div className="w-full h-full p-4 flex flex-col text-slate-200">
      <h3 className="text-sm font-bold text-slate-400 mb-4 shrink-0">레이어</h3>
      <div className="flex-1 overflow-y-auto space-y-2">
        {sortedElements.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">추가된 요소가 없습니다</p>
        )}
        {sortedElements.map(el => {
          const isSelected = selectedElementId === el.id;
          const isVisible = el.visible !== false;
          
          return (
            <div 
              key={el.id}
              onClick={() => onSelectElement(el.id)}
              className={`p-2 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${isSelected ? 'bg-purple-900/50 outline outline-1 outline-purple-500' : 'bg-slate-700/50 hover:bg-slate-600/50'} ${!isVisible ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <span className={`text-xs truncate flex-1 ${!isVisible ? 'text-slate-400' : 'text-white'}`}>
                  {getElementLabel(el)}
                </span>
              </div>
              
              <div className="flex items-center gap-1 shrink-0 ml-2 bg-slate-800 rounded p-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onUpdateElement(el.id, { visible: !isVisible }); }} 
                  className={`p-1 rounded ${isVisible ? 'text-slate-300 hover:text-white hover:bg-slate-600' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`} 
                  title={isVisible ? "숨기기" : "표시하기"}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                {isSelected && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); onReorderElement(el.id, 'up'); }} className="p-1 hover:bg-slate-600 rounded text-slate-300 hover:text-white" title="앞으로">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onReorderElement(el.id, 'down'); }} className="p-1 hover:bg-slate-600 rounded text-slate-300 hover:text-white" title="뒤로">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteElement(el.id); }} className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300" title="삭제">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
