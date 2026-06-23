import { useState } from 'react';
import type { ComicCutElement } from '../editor/utils/comicStorage';

interface Props {
  onAddElement: (element: Omit<ComicCutElement, 'id'>) => void;
  selectedElementId?: string | null;
  elements?: ComicCutElement[];
  onUpdateElement?: (id: string, updates: Partial<ComicCutElement>) => void;
}

export default function CharacterToolPanel({ onAddElement, selectedElementId, elements, onUpdateElement }: Props) {
  const [cropMode, setCropMode] = useState(false);

  const characters = [
    {
      id: 'hana',
      name: '하나 선생님',
      image: '/images/toonschool/characters/v2/hana-master/hana-v2-fullbody.png',
      width: 250,
      height: 500
    },
    {
      id: 'doyoon',
      name: '도윤',
      image: '/images/toonschool/characters/v2/doyoon-master/doyoon-v2-fullbody.png',
      width: 250,
      height: 480
    },
    {
      id: 'seoa',
      name: '서아',
      image: '/images/toonschool/characters/v2/seoa-master/seoa-v2-fullbody.png',
      width: 250,
      height: 480
    }
  ];

  const handleAddCharacter = (char: typeof characters[0]) => {
    onAddElement({
      type: 'character',
      x: 300,
      y: 200,
      width: char.width,
      height: char.height,
      rotation: 0,
      zIndex: 0, // Will be overridden in handleAddElement
      imageUrl: char.image,
      flipX: false,
    });
  };

  const selectedChar = selectedElementId 
    ? elements?.find(e => e.id === selectedElementId && e.type === 'character')
    : null;

  if (selectedChar && onUpdateElement) {
    return (
      <div className="flex flex-col h-full space-y-6 text-slate-200 p-4">
        <div>
          <h3 className="text-sm font-bold text-slate-400 mb-4">캐릭터 속성</h3>
          
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10 mb-4">
            <p className="text-xs text-slate-400 mb-2">기본 크기 조절 (캔버스)</p>
            <input 
              type="range" 
              min="50" max="800" 
              value={selectedChar.width} 
              onChange={(e) => {
                const newWidth = Number(e.target.value);
                const ratio = selectedChar.width / selectedChar.height;
                onUpdateElement(selectedChar.id, { width: newWidth, height: newWidth / ratio });
              }}
              className="w-full accent-purple-500"
            />
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400 font-bold">캐릭터 자르기 (영역 내 조절)</p>
              <button 
                onClick={() => setCropMode(!cropMode)}
                className={`px-3 py-1 text-xs font-bold rounded-lg ${cropMode ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {cropMode ? '종료' : '자르기 켜기'}
              </button>
            </div>
            
            {cropMode && (
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">영역 내 확대 (Zoom)</p>
                  <input 
                    type="range" 
                    min="1" max="5" step="0.1"
                    value={selectedChar.cropScale || 1} 
                    onChange={(e) => onUpdateElement(selectedChar.id, { cropScale: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">가로 이동 (X)</p>
                  <input 
                    type="range" 
                    min="-200" max="200" 
                    value={selectedChar.cropX || 0} 
                    onChange={(e) => onUpdateElement(selectedChar.id, { cropX: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 mb-1">세로 이동 (Y)</p>
                  <input 
                    type="range" 
                    min="-200" max="200" 
                    value={selectedChar.cropY || 0} 
                    onChange={(e) => onUpdateElement(selectedChar.id, { cropY: Number(e.target.value) })}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onUpdateElement(selectedChar.id, { cropScale: 1, cropX: 0, cropY: 0 })} className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors">
                    초기화
                  </button>
                </div>
              </div>
            )}
            {!cropMode && (
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                자르기 모드를 켜면 컷 안에 들어간 캐릭터의 크기를 키우고 위치를 옮겨서 얼굴만 보이게 하거나 특정 부위를 잘라낼 수 있습니다.
              </p>
            )}
          </div>
          
          <button 
            onClick={() => onUpdateElement(selectedChar.id, { flipX: !selectedChar.flipX })}
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-600 transition-colors"
          >
            좌우 반전
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 text-slate-200 p-4">
      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-4">캐릭터 추가</h3>
        <p className="text-xs text-slate-500 mb-4">캐릭터를 클릭하면 화면에 추가됩니다.</p>
        
        <div className="grid grid-cols-2 gap-3">
          {characters.map(char => (
            <button
              key={char.id}
              onClick={() => handleAddCharacter(char)}
              className="flex flex-col items-center p-2 bg-slate-900/50 hover:bg-slate-700/50 border border-white/10 rounded-xl transition-all hover:scale-105 hover:border-purple-500/50 group"
            >
              <div className="w-full aspect-[3/4] bg-white/5 rounded-lg mb-2 overflow-hidden flex items-center justify-center p-2">
                <img 
                  src={char.image} 
                  alt={char.name} 
                  className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="text-sm font-bold text-slate-300">{char.name}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">
          추가된 캐릭터는 드래그하여 이동하고, 모서리를 잡아 크기를 조절할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
