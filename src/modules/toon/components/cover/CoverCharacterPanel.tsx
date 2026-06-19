import type { CoverState } from '../../types/cover'

const RESOLUTION_OPTIONS = [
  '오늘은 내가 학습툰 작가예요!',
  '오늘도 끝까지 해볼래요!',
  '어려워도 포기하지 않을래요!',
]

interface CoverCharacterPanelProps {
  cover: CoverState
  onChangeCover: (field: keyof CoverState, value: any) => void
}

export default function CoverCharacterPanel({
  cover,
  onChangeCover
}: CoverCharacterPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <p className="text-[11.5px] font-extrabold text-[#475569] uppercase">👤 캐릭터 선택</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-[11.5px] font-bold text-[#64748B]">화자(캐릭터)</label>
          <select 
            value={cover.resolutionOwner}
            onChange={e => onChangeCover('resolutionOwner', e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] font-semibold focus:outline-none focus:border-[#4F6AF0] transition-colors"
          >
            <option value="hana">하나 선생님</option>
            <option value="doyoon">도윤이</option>
            <option value="seoa">서아</option>
            <option value="all">모두 함께</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11.5px] font-bold text-[#64748B]">각오 한마디</label>
          <select 
            value={cover.selectedResolution}
            onChange={e => onChangeCover('selectedResolution', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] font-semibold focus:outline-none focus:border-[#4F6AF0] transition-colors"
          >
            {RESOLUTION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            <option value="custom">직접 입력...</option>
          </select>
        </div>
        {cover.selectedResolution === 'custom' && (
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold text-[#64748B]">직접 입력</label>
            <input 
              value={cover.customResolution || ''}
              onChange={e => onChangeCover('customResolution', e.target.value)}
              placeholder="원하는 각오를 적어주세요."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] focus:outline-none focus:border-[#4F6AF0]"
            />
          </div>
        )}
      </div>
    </div>
  )
}
