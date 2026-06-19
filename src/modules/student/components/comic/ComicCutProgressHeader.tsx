// 만화 컷 진행률 헤더 컴포넌트
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Star } from 'lucide-react'

interface ComicCutProgressHeaderProps {
  cutNumber: number
  totalCuts?: number
  backPath?: string
}

export default function ComicCutProgressHeader({
  cutNumber,
  totalCuts = 6,
  backPath,
}: ComicCutProgressHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-6 bg-black/30 border-2 border-white/5 rounded-3xl p-4.5 backdrop-blur-sm">
      <div className="flex items-center gap-3.5 mb-4">
        {backPath && (
          <button
            onClick={() => navigate(backPath)}
            className="w-10 h-10 rounded-2xl bg-gradient-to-b from-amber-300 to-yellow-500 border-2 border-black flex items-center justify-center text-black hover:scale-105 transition-transform shadow-[0_2.5px_0_#b45309]"
          >
            <ChevronLeft className="w-5.5 h-5.5 stroke-[3]" />
          </button>
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-1.5 select-none">
              <span>🎬</span>
              <span>{cutNumber}번 장면 퀘스트</span>
            </h2>
            <span className="text-[10px] font-black bg-purple-600 border border-purple-400 text-white px-2.5 py-0.5 rounded-full shadow-sm">
              진행률 {cutNumber} / {totalCuts}
            </span>
          </div>
        </div>
      </div>

      {/* 컷 진행 스테이지 도트 */}
      <div className="flex items-center justify-around relative py-2">
        {/* 뒤쪽 트랙 라인 */}
        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-700/60 -translate-y-1/2 z-0" />
        
        {Array.from({ length: totalCuts }).map((_, i) => {
          const num = i + 1
          const isCompleted = num < cutNumber
          const isActive = num === cutNumber

          return (
            <div
              key={num}
              className={`
                w-9 h-9 rounded-full border-2 border-black flex items-center justify-center font-black text-xs relative z-10 transition-all duration-300
                ${isCompleted 
                  ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-black shadow-md' 
                  : isActive
                  ? 'bg-gradient-to-br from-pink-400 to-rose-600 text-white shadow-lg scale-115 animate-bounce-gentle border-white/60'
                  : 'bg-slate-800 text-slate-500 border-slate-700'}
              `}
            >
              {isCompleted ? (
                <Star className="w-4.5 h-4.5 fill-yellow-300 stroke-black stroke-2" />
              ) : isActive ? (
                '🚀'
              ) : (
                num
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
