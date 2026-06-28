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
      title: { fontSize: 80, text: '제목', fill: '#000000', fontFamily: 'SCoreDream', fontWeight: 800, align: 'center' as const, verticalAlign: 'middle' as const },
      body: { fontSize: 40, text: '본문', fill: '#000000', fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif", fontWeight: 400, align: 'left' as const, verticalAlign: 'middle' as const },
      bubble: { fontSize: 32, text: '말풍선 텍스트', fill: '#000000', fontFamily: 'Gaegu', fontWeight: 400, align: 'center' as const, verticalAlign: 'middle' as const }
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
    { label: 'Pretendard', value: "'Pretendard', 'Noto Sans KR', sans-serif" },
    { label: 'Noto Sans KR', value: "'Noto Sans KR', 'Pretendard', sans-serif" },
    { label: 'NanumSquareRound', value: "'NanumSquareRound', 'Pretendard', sans-serif" },
    { label: 'Gmarket Sans', value: "'Gmarket Sans', 'Pretendard', sans-serif" },
    { label: 'Cafe24 Ssurround', value: "'Cafe24 Ssurround', 'Pretendard', sans-serif" },
    { label: 'SUIT', value: "'SUIT', 'Pretendard', sans-serif" },
    { label: 'S-Core Dream', value: 'SCoreDream' },
    { label: 'Gaegu', value: 'Gaegu' }
  ];

  const FONT_WEIGHTS: Record<string, { label: string; value: number }[]> = {
    "'Pretendard', 'Noto Sans KR', sans-serif": [
      { label: 'Pretendard 400 Regular', value: 400 },
      { label: 'Pretendard 500 Medium', value: 500 },
      { label: 'Pretendard 600 SemiBold', value: 600 },
      { label: 'Pretendard 700 Bold', value: 700 }
    ],
    "'Noto Sans KR', 'Pretendard', sans-serif": [
      { label: 'Noto Sans KR 400 Regular', value: 400 },
      { label: 'Noto Sans KR 500 Medium', value: 500 },
      { label: 'Noto Sans KR 700 Bold', value: 700 }
    ],
    "'NanumSquareRound', 'Pretendard', sans-serif": [
      { label: 'NanumSquareRound Regular', value: 400 },
      { label: 'NanumSquareRound Bold', value: 700 }
    ],
    "'Gmarket Sans', 'Pretendard', sans-serif": [
      { label: 'Gmarket Sans Light', value: 300 },
      { label: 'Gmarket Sans Medium', value: 500 },
      { label: 'Gmarket Sans Bold', value: 700 }
    ],
    "'Cafe24 Ssurround', 'Pretendard', sans-serif": [
      { label: 'Cafe24 Ssurround Regular', value: 400 }
    ],
    "'SUIT', 'Pretendard', sans-serif": [
      { label: 'SUIT 400 Regular', value: 400 },
      { label: 'SUIT 500 Medium', value: 500 },
      { label: 'SUIT 600 SemiBold', value: 600 },
      { label: 'SUIT 700 Bold', value: 700 }
    ],
    Pretendard: [ // Legacy fallback
      { label: 'Pretendard 400 Regular', value: 400 },
      { label: 'Pretendard 500 Medium', value: 500 },
      { label: 'Pretendard 600 SemiBold', value: 600 },
      { label: 'Pretendard 700 Bold', value: 700 }
    ],
    SCoreDream: [
      { label: 'S-Core Dream 4 Regular', value: 400 },
      { label: 'S-Core Dream 6 Bold', value: 600 },
      { label: 'S-Core Dream 8 Heavy', value: 800 }
    ],
    Gaegu: [
      { label: 'Gaegu 400 Regular', value: 400 },
      { label: 'Gaegu 700 Bold', value: 700 }
    ]
  };

  const handleFontFamilyChange = (newFont: string) => {
    if (!selectedElement) return;
    const availableWeights = FONT_WEIGHTS[newFont] || FONT_WEIGHTS["'Pretendard', 'Noto Sans KR', sans-serif"];
    let currentWeight = selectedElement.props.fontWeight || 400;
    
    if (!availableWeights.some(w => w.value === currentWeight)) {
      currentWeight = availableWeights.reduce((prev, curr) => 
        Math.abs(curr.value - currentWeight) < Math.abs(prev.value - currentWeight) ? curr : prev
      ).value;
    }

    onUpdateElement(selectedElement.id, { 
      props: { ...selectedElement.props, fontFamily: newFont, fontWeight: currentWeight } 
    });
  };

  const currentFontFamily = selectedElement?.props.fontFamily === 'Pretendard' 
    ? "'Pretendard', 'Noto Sans KR', sans-serif" 
    : (selectedElement?.props.fontFamily || "'Pretendard', 'Noto Sans KR', sans-serif");

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
                value={currentFontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full bg-slate-900 text-white rounded-lg p-2 text-sm border border-slate-700 outline-none focus:border-purple-500"
                style={{ fontFamily: currentFontFamily }}
              >
                {fonts.map(font => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">글꼴 굵기</label>
              <select 
                value={selectedElement.props.fontWeight || 400}
                onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, fontWeight: parseInt(e.target.value) } })}
                className="w-full bg-slate-900 text-white rounded-lg p-2 text-sm border border-slate-700 outline-none focus:border-purple-500"
                style={{ fontFamily: currentFontFamily }}
              >
                {(FONT_WEIGHTS[currentFontFamily] || FONT_WEIGHTS["'Pretendard', 'Noto Sans KR', sans-serif"]).map(weight => (
                  <option key={weight.value} value={weight.value}>
                    {weight.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 flex justify-between mb-1">
                <span>크기</span>
                <span>{selectedElement.props.fontSize || 40}px</span>
              </label>
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
              <label className="text-xs text-slate-400 block mb-1">외곽선 색상</label>
              <div className="flex flex-wrap gap-2 items-center">
                <button 
                  onClick={() => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, textStrokeWidth: 0 } })}
                  className={`px-2 py-1 text-xs rounded-md border-2 ${!selectedElement.props.textStrokeWidth ? 'border-purple-500 bg-slate-700 text-white' : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'}`}
                  title="사용 안 함"
                  aria-label="사용 안 함"
                >
                  사용 안 함
                </button>
                {['#000000', '#ffffff', '#ef4444', '#3b82f6', '#10b981', '#064E3B', '#f59e0b'].map(color => (
                  <button 
                    key={color}
                    onClick={() => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, textStrokeColor: color, textStrokeWidth: selectedElement.props.textStrokeWidth || 2 } })}
                    className={`w-6 h-6 rounded-full border-2 ${selectedElement.props.textStrokeColor === color && selectedElement.props.textStrokeWidth > 0 ? 'border-purple-500' : 'border-slate-700'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <div className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-slate-700 flex items-center justify-center bg-gradient-to-tr from-red-500 via-green-500 to-blue-500" title="사용자 지정 색상">
                  <input
                    type="color"
                    value={selectedElement.props.textStrokeColor || '#000000'}
                    onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, textStrokeColor: e.target.value, textStrokeWidth: selectedElement.props.textStrokeWidth || 2 } })}
                    className="absolute opacity-0 w-[200%] h-[200%] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 flex justify-between mb-1">
                <span>외곽선 두께</span>
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="0" max="6" step="1"
                  value={selectedElement.props.textStrokeWidth || 0}
                  onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, textStrokeWidth: parseInt(e.target.value) } })}
                  className="flex-1"
                />
                <input 
                  type="number"
                  min="0" max="6" step="1"
                  value={selectedElement.props.textStrokeWidth || 0}
                  onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, textStrokeWidth: parseInt(e.target.value) || 0 } })}
                  className="w-16 bg-slate-900 text-white rounded p-1 text-sm border border-slate-700 text-center"
                />
                <span className="text-xs text-slate-400">px</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 flex justify-between mb-1">
                <span>줄 간격 {Number(selectedElement.props.lineHeight || 1.2).toFixed(1)}</span>
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="range" 
                  min="0.8" max="2.0" step="0.05"
                  value={selectedElement.props.lineHeight || 1.2}
                  onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, lineHeight: parseFloat(e.target.value) } })}
                  className="flex-1"
                />
                <input 
                  type="number"
                  min="0.8" max="2.0" step="0.05"
                  value={selectedElement.props.lineHeight || 1.2}
                  onChange={(e) => onUpdateElement(selectedElement.id, { props: { ...selectedElement.props, lineHeight: parseFloat(e.target.value) || 1.2 } })}
                  className="w-16 bg-slate-900 text-white rounded p-1 text-sm border border-slate-700 text-center"
                />
              </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
