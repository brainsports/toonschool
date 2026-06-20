import { ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import type { CanvasElement } from '../types';

interface Props {
  elements: CanvasElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
  onReorderElement: (id: string, direction: 'up' | 'down') => void;
}

export default function LayerPanel({
  elements,
  selectedElementId,
  onSelectElement,
  onToggleVisibility,
  onReorderElement
}: Props) {
  // Sort elements by zIndex descending for the panel
  const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-full bg-slate-800 h-full p-4 overflow-hidden flex flex-col min-h-0">
      <h3 className="text-white font-bold mb-4 shrink-0">레이어</h3>
      <div className="flex-1 overflow-y-auto overscroll-contain space-y-2 min-h-0">
        {sortedElements.length === 0 && (
          <p className="text-slate-400 text-sm text-center py-8">요소가 없습니다</p>
        )}
        {sortedElements.map(el => {
          const isSelected = selectedElementId === el.id;
          const isVisible = el.visible !== false;
          let label = el.props.layerName ? el.props.layerName
                    : el.type === 'text' ? (el.props.text?.substring(0, 10) || '텍스트') 
                    : el.type === 'image' ? '이미지' 
                    : '도형';
          
          return (
            <div 
              key={el.id}
              onClick={() => onSelectElement(el.id)}
              className={`p-2 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${isSelected ? 'bg-purple-900/50 outline outline-1 outline-purple-500' : 'bg-slate-700/50 hover:bg-slate-600/50'} ${!isVisible ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <span className={`text-xs truncate flex-1 ${!isVisible ? 'text-slate-400' : 'text-white'}`}>{label}</span>
              </div>
              
              <div className="flex items-center gap-1 shrink-0 ml-2 bg-slate-800 rounded p-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(el.id); }} 
                  className={`p-1 rounded ${isVisible ? 'text-slate-300 hover:text-white hover:bg-slate-600' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700'}`} 
                  title={isVisible ? "숨기기" : "표시하기"}
                  aria-label={isVisible ? "레이어 숨기기" : "레이어 표시하기"}
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
