import { Plus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import type { CanvasElement } from '../types';

interface Props {
  onAddElement: (element: Omit<CanvasElement, 'id'>) => void;
  selectedElement: CanvasElement | null;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
}

export default function TextPanel({ onAddElement, selectedElement, onUpdateElement }: Props) {
  const handleAddText = (preset: 'title' | 'body' | 'bubble') => {
    const config = {
      title: { fontSize: 80, text: '제목', fill: '#000000', fontFamily: 'SCoreDream', align: 'center' as const, verticalAlign: 'middle' as const },
      body: { fontSize: 40, text: '본문', fill: '#000000', fontFamily: 'Pretendard', align: 'left' as const, verticalAlign: 'middle' as const },
      bubble: { fontSize: 32, text: '말풍선 텍스트', fill: '#000000', fontFamily: 'Gaegu', align: 'center' as const, verticalAlign: 'middle' as const }
    };

    onAddElement({
      type: 'text',
      x: 300, y: 300,
      width: 400, height: 100,
      rotation: 0, zIndex: 100,
      locked: false, visible: true,
      props: config[preset]
    });
  };

  const isTextSelected = selectedElement?.type === 'text';

  const fonts = [
    { label: 'Pretendard', value: 'Pretendard' },
    { label: 'S-Core Dream', value: 'SCoreDream' },
    { label: 'Gaegu', value: 'Gaegu' }
  ];

  return (
    <div className="w-full bg-slate-800 h-full p-4 overflow-hidden flex flex-col min-h-0">
      <div className="shrink-0 mb-4">
        <h3 className="text-white font-bold mb-4">텍스트 추가</h3>
        <div className="flex flex-col gap-2">
          <button onClick={() => handleAddText('title')} style={{ fontFamily: 'SCoreDream' }} className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl flex items-center justify-between text-lg">
            제목 <Plus className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={() => handleAddText('body')} style={{ fontFamily: 'Pretendard' }} className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl flex items-center justify-between text-sm">
            본문 <Plus className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={() => handleAddText('bubble')} style={{ fontFamily: 'Gaegu' }} className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl flex items-center justify-between text-sm">
            말풍선 텍스트 <Plus className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {isTextSelected && (
        <div className="flex-1 border-t border-slate-700 pt-4 overflow-y-auto overscroll-contain min-h-0 pr-1">
          <h3 className="text-white font-bold mb-4">텍스트 속성</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">텍스트 내용</label>
              <textarea
                value={selectedElement.props.text || ''}
                onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, text: e.target.value } })}
                className="w-full bg-slate-900 text-white rounded-lg p-2 text-sm border border-slate-700 outline-none focus:border-purple-500 min-h-[80px] resize-y"
                placeholder="텍스트를 입력하세요"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">글꼴</label>
              <select 
                value={selectedElement.props.fontFamily || 'Pretendard'}
                onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, fontFamily: e.target.value } })}
                className="w-full bg-slate-900 text-white rounded-lg p-2 text-sm border border-slate-700 outline-none focus:border-purple-500"
                style={{ fontFamily: selectedElement.props.fontFamily || 'Pretendard' }}
              >
                {fonts.map(font => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">크기</label>
              <input 
                type="range" 
                min="12" max="200" 
                value={selectedElement.props.fontSize || 40}
                onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, fontSize: parseInt(e.target.value) } })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">글자색</label>
              <div className="flex flex-wrap gap-2">
                {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'].map(color => (
                  <button 
                    key={color}
                    onClick={() => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, fill: color } })}
                    className={`w-6 h-6 rounded-full border-2 ${selectedElement.props.fill === color ? 'border-white' : 'border-slate-700'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">글자 배경</label>
              <div className="flex flex-wrap gap-2 items-center">
                <button 
                  onClick={() => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, backgroundColor: 'transparent' } })}
                  className={`px-2 py-1 text-xs rounded-md border-2 ${!selectedElement.props.backgroundColor || selectedElement.props.backgroundColor === 'transparent' ? 'border-purple-500 bg-slate-700 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'}`}
                  title="없음"
                  aria-label="없음"
                >
                  없음
                </button>
                {[
                  { value: '#FFFFFF', name: '흰색' },
                  { value: '#FFF4B8', name: '연노랑' },
                  { value: '#FFDCE8', name: '연분홍' },
                  { value: '#DDEEFF', name: '연하늘' },
                  { value: '#E2F4D5', name: '연두' },
                  { value: '#24324A', name: '진한 남색' }
                ].map(bg => (
                  <button 
                    key={bg.value}
                    onClick={() => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, backgroundColor: bg.value } })}
                    className={`w-6 h-6 rounded-full border-2 ${selectedElement.props.backgroundColor === bg.value ? 'border-purple-500' : 'border-slate-700'}`}
                    style={{ backgroundColor: bg.value }}
                    title={bg.name}
                    aria-label={bg.name}
                  />
                ))}
                
                <div className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-slate-700 flex items-center justify-center bg-gradient-to-tr from-red-500 via-green-500 to-blue-500" title="사용자 지정 색상">
                  <input
                    type="color"
                    value={selectedElement.props.backgroundColor !== 'transparent' ? (selectedElement.props.backgroundColor || '#ffffff') : '#ffffff'}
                    onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, backgroundColor: e.target.value } })}
                    className="absolute opacity-0 w-[200%] h-[200%] cursor-pointer"
                    aria-label="사용자 지정 색상"
                  />
                </div>
              </div>
            </div>

            <div>
               <label className="text-xs text-slate-400 flex justify-between mb-1">
                 <span>배경 투명도</span>
                 <span>{Math.round((selectedElement.props.backgroundOpacity ?? 1) * 100)}%</span>
               </label>
               <input 
                 type="range" 
                 min="0" max="100" 
                 value={Math.round((selectedElement.props.backgroundOpacity ?? 1) * 100)}
                 onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, backgroundOpacity: parseInt(e.target.value) / 100 } })}
                 className="w-full"
                 disabled={!selectedElement.props.backgroundColor || selectedElement.props.backgroundColor === 'transparent'}
               />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">정렬</label>
              <div className="flex bg-slate-900 rounded-lg p-1">
                <button onClick={() => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, align: 'left' } })} className={`flex-1 flex justify-center py-1.5 rounded-md ${selectedElement.props.align === 'left' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button onClick={() => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, align: 'center' } })} className={`flex-1 flex justify-center py-1.5 rounded-md ${selectedElement.props.align === 'center' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button onClick={() => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, align: 'right' } })} className={`flex-1 flex justify-center py-1.5 rounded-md ${selectedElement.props.align === 'right' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
               <label className="text-xs text-slate-400 block mb-1">크기</label>
               <input 
                 type="range" 
                 min="12" max="200" 
                 value={selectedElement.props.fontSize || 40}
                 onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, fontSize: parseInt(e.target.value) } })}
                 className="w-full"
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
