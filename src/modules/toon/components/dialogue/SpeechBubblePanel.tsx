import { Plus, Trash2, MessageCircle } from 'lucide-react'
import type { SpeechBubble } from '../../types/cover'
import { intVal } from '../../utils/coverLayout'

interface SpeechBubblePanelProps {
  bubbles: SpeechBubble[]
  selectedBubbleId: string | null
  setSelectedBubbleId: (id: string | null) => void
  onAddBubble: () => void
  onDeleteBubble: () => void
  onUpdateBubble: (field: keyof SpeechBubble, value: any) => void
}

export default function SpeechBubblePanel({
  bubbles,
  selectedBubbleId,
  setSelectedBubbleId,
  onAddBubble,
  onDeleteBubble,
  onUpdateBubble
}: SpeechBubblePanelProps) {
  const selectedBubble = bubbles.find(b => b.id === selectedBubbleId)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button 
          onClick={onAddBubble}
          disabled={bubbles.length >= 3}
          className="flex-1 py-2.5 bg-[#4F6AF0] hover:bg-[#3451D1] text-white rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1 shadow-sm transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4"/> {bubbles.length >= 3 ? '말풍선 최대(3개)' : '말풍선 추가'}
        </button>
        <button 
          onClick={onDeleteBubble}
          disabled={!selectedBubbleId}
          className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="w-4 h-4"/> 삭제
        </button>
      </div>

      {selectedBubbleId && selectedBubble && (
        <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm p-4 space-y-3.5">
          <p className="text-[12.5px] font-extrabold text-slate-800 pb-2 border-b border-[#E2E8F0]">말풍선 세부 속성</p>
          
          {/* 1. 말풍선 텍스트 입력 */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold text-[#64748B]">대사 내용</label>
            <textarea 
              value={selectedBubble.text}
              onChange={e => onUpdateBubble('text', e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-[12.5px] font-semibold resize-none focus:outline-none focus:border-[#4F6AF0]"
              rows={2.5}
            />
          </div>

          {/* 2. 말풍선 꼬리 화자 선택 */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold text-[#64748B]">화자(꼬리 방향)</label>
            <select 
              value={selectedBubble.speaker}
              onChange={e => onUpdateBubble('speaker', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] font-semibold focus:outline-none"
            >
              <option value="none">말풍선 꼬리 없음</option>
              <option value="doyoon">도윤이</option>
              <option value="seoa">서아</option>
              <option value="hana">하나 선생님</option>
            </select>
          </div>

          {/* 3. 말풍선 모양 디자인 */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold text-[#64748B]">말풍선 모양</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'rounded', label: '둥근 형태' },
                { key: 'square', label: '사각 형태' },
                { key: 'cloud', label: '생각(구름)' },
                { key: 'burst', label: '외침(폭발)' }
              ].map(s => (
                <button 
                  key={s.key}
                  onClick={() => onUpdateBubble('shape', s.key)}
                  className={`py-1.5 rounded-lg text-[11.5px] border font-bold transition-all ${selectedBubble.shape === s.key ? 'bg-[#EEF2FF] border-[#4F6AF0] text-[#4F6AF0]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. 텍스트 크기 조절 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11.5px] font-bold text-[#64748B]">
              <span>글자 크기</span>
              <span className="text-[#4F6AF0]">{selectedBubble.fontSize || 12}px</span>
            </div>
            <input 
              type="range"
              min="10"
              max="24"
              value={selectedBubble.fontSize || 12}
              onChange={e => onUpdateBubble('fontSize', intVal(e.target.value))}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#4F6AF0]"
            />
          </div>
        </div>
      )}
      
      {/* 말풍선 목록 리스트 */}
      <div className="space-y-2">
        <p className="text-[11.5px] font-bold text-slate-400">말풍선 레이어 리스트</p>
        {bubbles.map((b) => (
          <div 
            key={b.id}
            onClick={() => setSelectedBubbleId(b.id)}
            className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${selectedBubbleId === b.id ? 'border-[#4F6AF0] bg-[#EEF2FF]/20' : 'border-slate-150 bg-white hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-4 h-4 text-slate-400 flex-shrink-0"/>
              <span className="text-[12px] font-bold text-slate-700 truncate">{b.text}</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold flex-shrink-0">
              {b.shape}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
