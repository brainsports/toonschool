// 6컷 전체보기 개별 카드 컴포넌트
import type { ComicCut } from '../../types/studentFlow'
import { Edit2 } from 'lucide-react'

interface ComicFullViewCardProps {
  cut: ComicCut
  onRevise?: (cutNumber: number) => void
}

export default function ComicFullViewCard({ cut, onRevise }: ComicFullViewCardProps) {
  return (
    <div className="card-glass overflow-hidden border border-white/10 flex flex-col justify-between shadow-sm hover:border-white/20 transition-all duration-200">
      
      {/* 컷 이미지 영역 */}
      <div className="relative bg-gradient-to-b from-purple-900/40 to-indigo-900/40 h-44 flex flex-col items-center justify-center p-4 select-none m-2 rounded-2xl border border-white/5">
        
        {/* 컷 번호 */}
        <div className="absolute top-3 left-3 bg-purple-500/30 border border-purple-400/50 text-purple-100 font-jua text-[11px] px-2.5 py-1 rounded-lg shadow-sm">
          {cut.cutNumber}컷
        </div>

        {/* 배경 대형 이모지 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <span className="text-[110px] filter blur-[1px]">{cut.backgroundEmoji}</span>
        </div>

        {/* 캐릭터와 말풍선 */}
        <div className="relative z-10 flex flex-col items-center gap-1.5 w-full">
          {/* 캐릭터 */}
          <div className="w-14 h-14 rounded-full border border-white/20 bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center shadow-md">
            <span className="text-4xl leading-none">🦊</span>
          </div>
          
          {/* 말풍선 */}
          <div className="game-bubble max-w-[140px] text-center relative px-3 py-2 bg-white/90 shadow-lg">
            <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">{cut.speechBubble}</p>
          </div>
        </div>

      </div>

      {/* 하단 정보 + 수정 버튼 */}
      <div className="p-3 bg-white/5 flex items-center justify-between gap-3 border-t border-white/10">
        <p className="text-[11px] font-bold text-slate-300 truncate flex-1">{cut.sceneDescription}</p>
        
        {onRevise && (
          <button
            onClick={() => onRevise(cut.cutNumber)}
            className="p-1.5 px-3 bg-purple-500/30 text-purple-200 font-jua text-[11px] rounded-xl hover:bg-purple-500/50 transition-colors flex items-center gap-1.5 shrink-0 border border-purple-500/30"
          >
            <Edit2 className="w-3 h-3 stroke-[3]" />
            <span>수정</span>
          </button>
        )}
      </div>

    </div>
  )
}
