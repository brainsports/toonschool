import type { CoverState } from '../../types/cover'

interface CoverInfoPanelProps {
  cover: CoverState
  onChangeCover: (field: keyof CoverState, value: any) => void
}

export default function CoverInfoPanel({ cover, onChangeCover }: CoverInfoPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <p className="text-[11.5px] font-extrabold text-[#475569] uppercase">✍️ 표지 정보</p>
      </div>
      <div className="p-4 space-y-3">
        {/* 작품 제목 */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-bold text-[#64748B]">작품 제목</label>
          <input 
            value={cover.title} 
            onChange={e => onChangeCover('title', e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[12.5px] font-bold focus:outline-none focus:border-[#4F6AF0] transition-colors"
          />
        </div>

        {/* 날짜 */}
        <div className="space-y-1">
          <label className="text-[11.5px] font-bold text-[#64748B]">발행 날짜</label>
          <input 
            value={cover.date || ''} 
            onChange={e => onChangeCover('date', e.target.value)}
            placeholder="예: 2026.06.18"
            className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[12.5px] font-bold focus:outline-none focus:border-[#4F6AF0] transition-colors"
          />
        </div>

        {/* 글, 그림 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold text-[#64748B]">글 작가</label>
            <input 
              value={cover.author} 
              onChange={e => onChangeCover('author', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] font-bold focus:outline-none focus:border-[#4F6AF0] transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold text-[#64748B]">그림 작가</label>
            <input 
              value={cover.illustrator} 
              onChange={e => onChangeCover('illustrator', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-[12.5px] font-bold focus:outline-none focus:border-[#4F6AF0] transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
