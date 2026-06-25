import { useState } from 'react';
import type { CanvasElement } from '../types';
import { CHARACTER_ASSETS } from '../../../data/characterAssets';
import type { CharacterName } from '../../../data/characterAssets';

interface Props {
  onAddElement: (element: Omit<CanvasElement, 'id'>) => void;
  subject?: string;
}

export default function CharacterPanel({ onAddElement }: Props) {
  const [activeTab, setActiveTab] = useState<CharacterName | 'all'>('하나 선생님');

  const handleAddCharacter = (src: string, layerName: string) => {
    onAddElement({
      type: 'image',
      x: 200, y: 200,
      width: 250, height: 400,
      rotation: 0, zIndex: 100,
      locked: false, visible: true,
      props: { src, layerName }
    });
  };

  const tabs = [
    { id: '하나 선생님', label: '하나 선생님' },
    { id: '도윤', label: '도윤' },
    { id: '서아', label: '서아' },
    { id: 'all', label: '전체' },
  ] as const;

  const filteredCharacters = CHARACTER_ASSETS.filter(char => {
    if (activeTab === 'all') return true;
    return char.characterName === activeTab;
  });

  return (
    <div className="w-full bg-slate-800 h-full p-4 overflow-hidden flex flex-col min-h-0">
      <h3 className="text-white font-bold mb-4 shrink-0">캐릭터</h3>
      
      <div className="flex flex-wrap gap-2 mb-4 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            aria-label={tab.label}
            title={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 overflow-y-auto overscroll-contain pb-4 flex-1 min-h-0">
        {filteredCharacters.map(char => (
          <button 
            key={char.id}
            onClick={() => handleAddCharacter(char.imageUrl, char.layerName)}
            className="bg-slate-700 hover:bg-slate-600 rounded-xl p-2 flex flex-col items-center transition-all group"
            aria-label={char.name}
            title={char.name}
          >
            <div className="h-24 w-full flex items-center justify-center bg-slate-900/50 rounded-lg mb-2 p-1">
              <img 
                src={char.imageUrl} 
                alt={char.name} 
                className="h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform" 
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  const button = target.closest('button');
                  if (button) button.style.display = 'none';
                }}
              />
            </div>
            <span className="text-xs text-slate-300 font-bold text-center break-words w-full">{char.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
