import { useState, useEffect } from 'react';
import type { ComicCutElement } from '../editor/utils/comicStorage';

interface Props {
  onAddElement: (element: Omit<ComicCutElement, 'id'>) => void;
  selectedElementId?: string | null;
  elements?: ComicCutElement[];
  onUpdateElement?: (id: string, updates: Partial<ComicCutElement>) => void;
  projectId?: string;
}

export default function CharacterToolPanel({ onAddElement, selectedElementId, elements, onUpdateElement, projectId }: Props) {
  const [cropMode, setCropMode] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string>('hana');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      const saved = localStorage.getItem(`toonschool_selected_character_${projectId}`);
      if (saved) {
        setSelectedCharacterId(saved);
        setExpandedGroup(saved);
      }
    }
  }, [projectId]);

  const handleSelectCharacter = (id: string | null) => {
    setSelectedCharacterId(id);
    if (id) {
      setExpandedGroup(id);
      if (projectId) {
        localStorage.setItem(`toonschool_selected_character_${projectId}`, id);
      }
    } else {
      if (projectId) {
        localStorage.removeItem(`toonschool_selected_character_${projectId}`);
      }
    }
  };

  const characterGroups = [
    {
      id: 'hana',
      name: '하나 선생님',
      images: [
        { id: 'hana-fullbody', name: '전신', src: '/images/toonschool/characters/v2/hana-master/hana-v2-fullbody.png', width: 250, height: 500 },
        { id: 'hana-front', name: '정면', src: '/images/toonschool/characters/v2/hana-master/hana-v2-front.png', width: 250, height: 500 },
        { id: 'hana-side', name: '측면', src: '/images/toonschool/characters/v2/hana-master/hana-v2-side.png', width: 250, height: 500 },
        { id: 'hana-exp-normal', name: '기본', src: '/images/toonschool/characters/v2/expressions/hana/hana-normal.png', width: 250, height: 250 },
        { id: 'hana-exp-smile', name: '웃음', src: '/images/toonschool/characters/v2/expressions/hana/hana-smile.png', width: 250, height: 250 },
        { id: 'hana-exp-thinking', name: '생각', src: '/images/toonschool/characters/v2/expressions/hana/hana-thinking.png', width: 250, height: 250 },
        { id: 'hana-exp-surprise', name: '놀람', src: '/images/toonschool/characters/v2/expressions/hana/hana-surprise.png', width: 250, height: 250 },
        { id: 'hana-exp-explain', name: '설명', src: '/images/toonschool/characters/v2/expressions/hana/hana-explain.png', width: 250, height: 250 },
        { id: 'hana-exp-cheer', name: '응원', src: '/images/toonschool/characters/v2/expressions/hana/hana-cheer.png', width: 250, height: 250 },
      ]
    },
    {
      id: 'doyoon',
      name: '도윤',
      images: [
        { id: 'doyoon-fullbody', name: '전신', src: '/images/toonschool/characters/v2/doyoon-master/doyoon-v2-fullbody.png', width: 250, height: 480 },
        { id: 'doyoon-front', name: '정면', src: '/images/toonschool/characters/v2/doyoon-master/doyoon-v2-front.png', width: 250, height: 480 },
        { id: 'doyoon-side', name: '측면', src: '/images/toonschool/characters/v2/doyoon-master/doyoon-v2-side.png', width: 250, height: 480 },
        { id: 'doyoon-exp-normal', name: '기본', src: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-normal.png', width: 250, height: 250 },
        { id: 'doyoon-exp-smile', name: '웃음', src: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-smile.png', width: 250, height: 250 },
        { id: 'doyoon-exp-thinking', name: '생각', src: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-thinking.png', width: 250, height: 250 },
        { id: 'doyoon-exp-surprise', name: '놀람', src: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-surprise.png', width: 250, height: 250 },
        { id: 'doyoon-exp-explain', name: '설명', src: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-explain.png', width: 250, height: 250 },
        { id: 'doyoon-exp-cheer', name: '응원', src: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-cheer.png', width: 250, height: 250 },
      ]
    },
    {
      id: 'seoa',
      name: '서아',
      images: [
        { id: 'seoa-fullbody', name: '전신', src: '/images/toonschool/characters/v2/seoa-master/seoa-v2-fullbody.png', width: 250, height: 480 },
        { id: 'seoa-front', name: '정면', src: '/images/toonschool/characters/v2/seoa-master/seoa-v2-front.png', width: 250, height: 480 },
        { id: 'seoa-side', name: '측면', src: '/images/toonschool/characters/v2/seoa-master/seoa-v2-side.png', width: 250, height: 480 },
        { id: 'seoa-exp-normal', name: '기본', src: '/images/toonschool/characters/v2/expressions/seoa/seoa-normal.png', width: 250, height: 250 },
        { id: 'seoa-exp-smile', name: '웃음', src: '/images/toonschool/characters/v2/expressions/seoa/seoa-smile.png', width: 250, height: 250 },
        { id: 'seoa-exp-thinking', name: '생각', src: '/images/toonschool/characters/v2/expressions/seoa/seoa-thinking.png', width: 250, height: 250 },
        { id: 'seoa-exp-surprise', name: '놀람', src: '/images/toonschool/characters/v2/expressions/seoa/seoa-surprise.png', width: 250, height: 250 },
        { id: 'seoa-exp-explain', name: '설명', src: '/images/toonschool/characters/v2/expressions/seoa/seoa-explain.png', width: 250, height: 250 },
        { id: 'seoa-exp-cheer', name: '응원', src: '/images/toonschool/characters/v2/expressions/seoa/seoa-cheer.png', width: 250, height: 250 },
      ]
    }
  ];

  const selectableCharacters = [
    { id: 'hana', name: '하나 선생님', img: '/images/toonschool/characters/v2/expressions/hana/hana-smile.png' },
    { id: 'doyoon', name: '도윤', img: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-smile.png' },
    { id: 'seoa', name: '서아', img: '/images/toonschool/characters/v2/expressions/seoa/seoa-smile.png' }
  ];

  const handleAddCharacter = (img: typeof characterGroups[0]['images'][0]) => {
    onAddElement({
      type: 'character',
      x: 300,
      y: 200,
      width: img.width,
      height: img.height,
      rotation: 0,
      zIndex: 0,
      imageUrl: img.src,
      flipX: false,
    });
  };

  const handleDragStart = (e: React.DragEvent, img: typeof characterGroups[0]['images'][0]) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'character',
      imageUrl: img.src,
      width: img.width,
      height: img.height
    }));
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

  if (!selectedCharacterId) {
    return (
      <div className="flex flex-col h-full text-slate-200">
        <div className="p-4 border-b border-white/10 shrink-0">
          <h3 className="text-sm font-bold text-slate-400 mb-1">캐릭터 선택</h3>
          <p className="text-[11px] text-slate-500">만화에 등장할 캐릭터를 선택해주세요.</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 w-full">
            {selectableCharacters.map(char => (
              <button
                key={char.id}
                onClick={() => handleSelectCharacter(char.id)}
                className="flex items-center p-4 bg-slate-800 rounded-xl border border-white/10 hover:bg-slate-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all text-left group"
              >
                <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center mr-4 shrink-0 overflow-hidden group-hover:scale-110 transition-transform">
                  <img src={char.img} alt={char.name} className="h-full object-contain drop-shadow-md" />
                </div>
                <div>
                  <span className="block text-lg font-bold text-slate-200">{char.name}</span>
                  <span className="block text-[11px] text-slate-400 mt-1">선택하기</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedGroup = characterGroups.find(g => g.id === selectedCharacterId);

  return (
    <div className="flex flex-col h-full text-slate-200">
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-slate-400">캐릭터 추가</h3>
          <button 
            onClick={() => handleSelectCharacter(null)}
            className="text-[10px] font-bold px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-600 rounded-md hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>🔄</span> 캐릭터 재선택
          </button>
        </div>
        <p className="text-[11px] text-slate-500">클릭하거나 컷으로 드래그하여 추가합니다.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedGroup && (
          <div key={selectedGroup.id} className="bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
            <button 
              onClick={() => setExpandedGroup(expandedGroup === selectedGroup.id ? '' : selectedGroup.id)}
              className="w-full px-4 py-3 flex items-center justify-between bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <span className="font-bold text-sm text-slate-300">{selectedGroup.name}</span>
              <span className="text-slate-500 text-xs">{expandedGroup === selectedGroup.id ? '▼' : '▶'}</span>
            </button>
            
            {expandedGroup === selectedGroup.id && (
              <div className="p-3 grid grid-cols-2 gap-3 bg-slate-800/30">
                {selectedGroup.images.map(img => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, img)}
                    onClick={() => handleAddCharacter(img)}
                    className="flex flex-col items-center p-2 bg-slate-800 rounded-lg border border-white/5 hover:bg-slate-700 hover:border-purple-500/50 cursor-pointer transition-all group/item shadow-sm"
                  >
                    <div className="w-full aspect-square bg-slate-900/80 rounded mb-2 overflow-hidden flex items-center justify-center p-2">
                      <img 
                        src={img.src} 
                        alt={img.name} 
                        className="w-full h-full object-contain drop-shadow-md group-hover/item:scale-110 transition-transform pointer-events-none"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">{img.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 shrink-0">
        <p className="text-[10px] text-slate-500 text-center leading-relaxed">
          추가된 캐릭터는 드래그하여 이동하고, 모서리를 잡아 크기를 조절할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
