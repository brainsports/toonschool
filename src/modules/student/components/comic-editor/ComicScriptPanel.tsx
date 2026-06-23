import { useState } from 'react';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import type { ComicCutElement } from '../editor/utils/comicStorage';

interface Props {
  elements: ComicCutElement[];
  onUpdateElement: (id: string, updates: Partial<ComicCutElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddElement: (element: Omit<ComicCutElement, 'id'>) => void;
}

const AVAILABLE_CHARACTERS = ['하나 선생님', '도윤', '서아', '보보', '화자 미지정'];

export default function ComicScriptPanel({ elements, onUpdateElement, onDeleteElement, onAddElement }: Props) {
  const [lastCharacter, setLastCharacter] = useState(AVAILABLE_CHARACTERS[0]);

  const speechBubbles = elements.filter(el => el.type === 'speechBubble');

  const handleAddDialogue = () => {
    onAddElement({
      type: 'speechBubble',
      bubbleType: 'basic',
      speaker: lastCharacter,
      text: '새 대사를 입력하세요',
      x: 100,
      y: 100,
      width: 300,
      height: 150,
      rotation: 0,
      zIndex: 0,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        textColor: '#000000',
        fontSize: 24
      }
    });
  };

  return (
    <div className="flex flex-col h-full text-slate-200">
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          대사 관리
        </h3>
        <p className="text-xs text-slate-500 mb-6">캔버스 위 말풍선의 대사와 인물을 바로 수정할 수 있습니다.</p>
        
        <button
          onClick={handleAddDialogue}
          className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors mb-6 shadow-md"
        >
          <Plus className="w-4 h-4" />
          대사 추가
        </button>

        <div className="space-y-4">
          {speechBubbles.map((bubble) => (
            <div key={bubble.id} className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <select
                  value={bubble.speaker || '화자 미지정'}
                  onChange={(e) => {
                    setLastCharacter(e.target.value);
                    onUpdateElement(bubble.id, { speaker: e.target.value });
                  }}
                  className="bg-slate-800 text-xs font-bold text-purple-300 border border-slate-600 rounded p-1.5 focus:outline-none focus:border-purple-500"
                >
                  {AVAILABLE_CHARACTERS.map(char => (
                    <option key={char} value={char}>{char}</option>
                  ))}
                  {!AVAILABLE_CHARACTERS.includes(bubble.speaker || '') && bubble.speaker && (
                    <option value={bubble.speaker}>{bubble.speaker}</option>
                  )}
                </select>
                <button
                  onClick={() => onDeleteElement(bubble.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  title="대사 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={bubble.text}
                onChange={(e) => onUpdateElement(bubble.id, { text: e.target.value })}
                className="w-full h-20 bg-slate-800 border border-slate-700 rounded p-2 text-sm text-white resize-none focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="대사를 입력하세요..."
              />
            </div>
          ))}
          
          {speechBubbles.length === 0 && (
            <div className="text-center py-8 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
              <p className="text-slate-500 text-sm">현재 추가된 대사가 없습니다.</p>
              <p className="text-slate-600 text-xs mt-1">대사 추가 버튼을 눌러보세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
