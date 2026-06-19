import { Plus, Trash2 } from 'lucide-react'
import type { ToonCut } from '../../types/cover'

interface ComicCutPanelProps {
  cuts: ToonCut[]
  activeCutId: string
  setActiveCutId: (id: string) => void
  onAddCut: () => void
  onDeleteCut: () => void
  onUpdateCutField: (id: string, field: keyof ToonCut, value: string) => void
}

export default function ComicCutPanel({
  cuts,
  activeCutId,
  setActiveCutId,
  onAddCut,
  onDeleteCut,
  onUpdateCutField
}: ComicCutPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button 
          onClick={onAddCut}
          className="flex-1 py-2.5 bg-[#4F6AF0] hover:bg-[#3451D1] text-white rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4"/> 컷 추가
        </button>
        <button 
          onClick={onDeleteCut}
          className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-[12.5px] font-bold flex items-center justify-center gap-1 transition-colors"
        >
          <Trash2 className="w-4 h-4"/> 컷 삭제
        </button>
      </div>
      {cuts.map((cut, i) => (
        <div 
          key={cut.id} 
          onClick={() => setActiveCutId(cut.id)}
          className={`bg-white rounded-2xl border p-4 space-y-3 cursor-pointer shadow-sm transition-all ${activeCutId === cut.id ? 'border-[#4F6AF0] ring-2 ring-[#4F6AF0]/10' : 'border-slate-150'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-black text-slate-800">컷 #${i + 1}</p>
            <select 
              value={cut.character}
              onChange={e => onUpdateCutField(cut.id, 'character', e.target.value)}
              onClick={e => e.stopPropagation()} 
              className="px-2 py-1 border border-slate-200 rounded-lg text-[11px] font-bold focus:outline-none"
            >
              <option value="doyoon">도윤이</option>
              <option value="seoa">서아</option>
              <option value="hana">하나 선생님</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <input 
              value={cut.description} 
              onChange={e => onUpdateCutField(cut.id, 'description', e.target.value)}
              placeholder="이 컷의 장면에 대한 세부 묘사..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold focus:outline-none focus:border-[#4F6AF0] transition-colors"
            />
            <input 
              value={cut.dialogue} 
              onChange={e => onUpdateCutField(cut.id, 'dialogue', e.target.value)}
              placeholder="캐릭터 대사..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12px] font-semibold focus:outline-none focus:border-[#4F6AF0] transition-colors"
            />
          </div>
        </div>
      ))}
    </div>
  )
}
