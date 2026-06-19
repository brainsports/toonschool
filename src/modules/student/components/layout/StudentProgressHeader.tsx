// 단계별 진행률을 보여주는 상단 헤더 컴포넌트
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface StudentProgressHeaderProps {
  current: number
  total: number
  label?: string
  backPath?: string
  emoji?: string
}

export default function StudentProgressHeader({
  current,
  total,
  label,
  backPath,
  emoji = '🪐',
}: StudentProgressHeaderProps) {
  const navigate = useNavigate()
  const percent = Math.min(Math.max(Math.round((current / total) * 100), 0), 100)

  return (
    <div className="mb-8 bg-purple-100/60 border-2 border-purple-200/80 rounded-3xl p-4.5 relative shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* 좌측: 타이틀 및 뒤로가기 */}
        <div className="flex items-center gap-3">
          {backPath && (
            <button
              onClick={() => navigate(backPath)}
              className="w-10 h-10 rounded-2xl bg-gradient-to-b from-amber-300 to-yellow-400 border border-yellow-500 flex items-center justify-center text-amber-950 hover:scale-105 transition-transform active:translate-y-[2px] shadow-[0_2px_0_#d97706]"
            >
              <ChevronLeft className="w-5.5 h-5.5 stroke-[3]" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-black text-purple-950 flex items-center gap-1.5 select-none">
              <span>{emoji}</span>
              <span>{label || '미션 진행 중'}</span>
            </h2>
            <p className="text-[10.5px] font-bold text-purple-500 mt-0.5">이 단계의 미션을 완성해서 행성을 구해보세요!</p>
          </div>
        </div>

        {/* 우측: 퀘스트 진행도 및 우주선 슬라이더 */}
        <div className="flex-1 max-w-md w-full relative pt-2">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-black text-purple-500 tracking-wider">미션 충전율</span>
            <span className="text-[10px] font-black bg-purple-600 border border-purple-500 text-white px-2 py-0.5 rounded-full shadow-xs">
              {current} / {total} 완료
            </span>
          </div>

          <div className="relative h-4 rounded-full bg-purple-50 border border-purple-200 overflow-visible">
            {/* 진행률 게이지 */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-300 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />

            {/* 움직이는 우주선 이모지 */}
            <div
              className="absolute -top-3 -ml-4 transition-all duration-500 flex flex-col items-center"
              style={{ left: `${percent}%` }}
            >
              <span className="text-xl animate-float select-none">🚀</span>
              <div className="w-1 h-1 rounded-full bg-pink-400 animate-ping absolute -bottom-1" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
