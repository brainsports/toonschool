import { MessageSquare, MessageCircle, Info, AlertCircle } from 'lucide-react';
import type { ComicCutElement } from '../editor/utils/comicStorage';

interface Props {
  onAddElement: (element: Omit<ComicCutElement, 'id'>) => void;
}

export default function ComicSpeechBubblePanel({ onAddElement }: Props) {
  const bubbles = [
    {
      id: 'basic',
      name: '기본 말풍선',
      icon: MessageSquare,
      type: 'basic',
      bgColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#000000',
    },
    {
      id: 'thought',
      name: '생각 말풍선',
      icon: MessageCircle,
      type: 'thought',
      bgColor: '#ffffff',
      textColor: '#000000',
      borderColor: '#3b82f6',
    },
    {
      id: 'explain',
      name: '설명 말풍선',
      icon: Info,
      type: 'explain',
      bgColor: '#fef3c7',
      textColor: '#92400e',
      borderColor: '#f59e0b',
    },
    {
      id: 'emphasis',
      name: '강조 말풍선',
      icon: AlertCircle,
      type: 'emphasis',
      bgColor: '#fee2e2',
      textColor: '#b91c1c',
      borderColor: '#ef4444',
    }
  ] as const;

  const handleAddBubble = (bubble: typeof bubbles[number]) => {
    onAddElement({
      type: 'speechBubble',
      bubbleType: bubble.type,
      text: '내용을 입력하세요',
      x: 100,
      y: 100,
      width: 250,
      height: 120,
      rotation: 0,
      zIndex: 0,
      style: {
        backgroundColor: bubble.bgColor,
        borderColor: bubble.borderColor,
        textColor: bubble.textColor,
        fontSize: 24
      }
    });
  };

  return (
    <div className="flex flex-col h-full space-y-6 text-slate-200 p-4">
      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-4">말풍선 추가</h3>
        <p className="text-xs text-slate-500 mb-6">말풍선을 클릭하면 화면에 추가됩니다.</p>
        
        <div className="grid grid-cols-2 gap-3">
          {bubbles.map(bubble => {
            const Icon = bubble.icon;
            return (
              <button
                key={bubble.id}
                onClick={() => handleAddBubble(bubble)}
                className="flex flex-col items-center p-4 bg-slate-900/50 hover:bg-slate-700/50 border border-white/10 rounded-xl transition-all hover:scale-105 hover:border-purple-500/50"
              >
                <div className="w-12 h-12 mb-2 rounded-full bg-slate-800 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-slate-300" />
                </div>
                <span className="text-sm font-bold text-slate-300">{bubble.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">
          말풍선을 추가한 후 더블클릭하여 내용을 수정할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
