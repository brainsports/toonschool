// 만화 컷 장면 미리보기 컴포넌트
import type { ComicCut } from '../../types/studentFlow'

interface ComicScenePreviewProps {
  cut: ComicCut
}

export default function ComicScenePreview({ cut }: ComicScenePreviewProps) {
  return (
    <div className="card-glass overflow-hidden border border-white/10 p-1 flex flex-col h-full">
      
      {/* 컷 내용 */}
      <div className="relative bg-gradient-to-b from-purple-900/40 to-indigo-900/40 min-h-[300px] flex flex-col items-center justify-center p-8 select-none rounded-[1.5rem] border border-white/5">
        
        {/* 장식용 만화 컷 번호 배지 */}
        <div className="absolute top-4 left-4 bg-purple-500/30 border border-purple-400/50 text-purple-100 font-jua text-sm px-4 py-2 rounded-xl shadow-sm">
          CUT {cut.cutNumber}
        </div>

        {/* 배경 대형 이모지 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <span className="text-[200px] select-none filter blur-[2px]">{cut.backgroundEmoji}</span>
        </div>

        {/* 말풍선 (컷 내부 상단 배치) */}
        <div className="relative z-10 mb-8 game-bubble max-w-[280px] text-center bg-white/90 backdrop-blur-sm shadow-lg">
          <p className="text-sm md:text-base font-bold text-slate-800 leading-relaxed">{cut.speechBubble || '...'}</p>
        </div>

        {/* 아바타와 감정 태그 */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full border border-white/20 bg-gradient-to-br from-purple-500/40 to-indigo-500/40 flex items-center justify-center shadow-lg animate-bounce-gentle">
            <span className="text-6xl leading-none">🦊</span>
          </div>
          <span className="bg-white/10 text-purple-200 text-xs font-jua px-3 py-1 rounded-full border border-white/20 shadow-sm">
            {cut.character} ({cut.emotion})
          </span>
        </div>

      </div>

      {/* 시나리오 가이드 */}
      <div className="px-6 py-5 bg-white/5 border-t border-white/10 text-slate-200 rounded-b-[2rem] mt-auto">
        <span className="text-[11px] font-jua text-purple-300 block uppercase tracking-wider">🎬 연출 설명</span>
        <p className="text-sm font-bold text-slate-300 leading-relaxed mt-1">{cut.sceneDescription}</p>
      </div>

    </div>
  )
}
