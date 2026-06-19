import { MessageCircle } from 'lucide-react'
import type { ToonCut } from '../../types/cover'

const PANEL_COLORS = ["#4F6AF0", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#0EA5E9"]

interface ComicPreviewProps {
  cuts: ToonCut[]
}

export function ComicPreview({ cuts }: ComicPreviewProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-6 bg-[#4F6AF0] rounded-full"/>
        <p className="text-[17px] font-bold text-[#1E293B]">만화 본문 (총 {cuts.length} 컷)</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {cuts.map((cut, i) => (
          <div 
            key={cut.id} 
            className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#E2E8F0] hover:border-[#4F6AF0] hover:shadow-lg cursor-pointer transition-all duration-200"
          >
            <div 
              className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 relative" 
              style={{ background: `${PANEL_COLORS[i % PANEL_COLORS.length]}08` }}
            >
              {/* 컷 번호 */}
              <div 
                className="absolute top-3 left-3 w-8 h-8 rounded-2xl text-[14px] font-black text-white flex items-center justify-center shadow-sm" 
                style={{ background: PANEL_COLORS[i % PANEL_COLORS.length] }}
              >
                {i + 1}
              </div>
              
              {/* 말풍선 아이콘 */}
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner" 
                style={{ background: `${PANEL_COLORS[i % PANEL_COLORS.length]}15` }}
              >
                <MessageCircle className="w-7 h-7" style={{ color: PANEL_COLORS[i % PANEL_COLORS.length] }} />
              </div>
              
              {/* 묘사 요약 */}
              <div className="bg-white/90 border border-slate-100 rounded-xl px-3 py-1.5 w-full text-center shadow-sm">
                <p className="text-[12px] font-bold text-[#64748B] truncate">
                  {cut.description || `컷 #${i + 1} 묘사를 입력하세요.`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
