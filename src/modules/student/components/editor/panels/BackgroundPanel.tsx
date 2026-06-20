import { Check } from 'lucide-react';
import { COMMON_COVER_TEMPLATES, DEFAULT_COVER_TEMPLATE_ID } from '../../../data/coverTemplates';

interface Props {
  selectedCoverId?: string;
  onSelectCover: (id: string) => void;
  onClose?: () => void;
}

export default function BackgroundPanel({ selectedCoverId = DEFAULT_COVER_TEMPLATE_ID, onSelectCover, onClose }: Props) {
  return (
    <div className="w-[280px] bg-slate-800 border-l border-white/10 h-full p-4 overflow-hidden flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-white font-bold">표지 선택</h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            닫기
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pb-8 flex-1 overflow-y-auto overscroll-contain min-h-0 pr-1">
        {COMMON_COVER_TEMPLATES.map((cover, index) => {
          const isSelected = selectedCoverId === cover.id || (!selectedCoverId && cover.id === DEFAULT_COVER_TEMPLATE_ID);
          
          return (
            <button
              key={cover.id}
              onClick={() => onSelectCover(cover.id)}
              aria-label={cover.id === 'blank-paper' ? '빈 도화지 선택' : `표지 ${index}`}
              className={`relative flex flex-col items-center gap-2 p-1.5 rounded-lg transition-all ${
                isSelected ? 'bg-purple-900/40 outline outline-2 outline-purple-500' : 'hover:bg-slate-700/50'
              }`}
            >
              <div 
                className={`w-full bg-slate-900 rounded overflow-hidden flex items-center justify-center relative shadow-sm ${cover.id === 'blank-paper' ? 'border border-slate-300' : ''}`}
                style={{ aspectRatio: '210/297' }}
              >
                <img 
                  src={cover.imageUrl} 
                  alt="" 
                  className="w-full h-full object-contain pointer-events-none"
                  loading="lazy"
                />
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-0.5 shadow-md">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </div>
                )}
              </div>
              <span className={`text-[11px] font-bold ${isSelected ? 'text-purple-300' : 'text-slate-400'}`}>
                {cover.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
