// 학생 작품(완성된 만화) 카드 컴포넌트
import { useNavigate } from 'react-router-dom'
import type { StudentWork } from '../../types/studentFlow'
import { Star } from 'lucide-react'

interface WorkCardProps {
  work: StudentWork
  compact?: boolean
}

const statusConfig = {
  '완료': { bg: 'bg-emerald-400 text-black', icon: '🏆' },
  '진행 중': { bg: 'bg-amber-400 text-black', icon: '⚡' },
  '시작 전': { bg: 'bg-slate-400 text-white', icon: '⏳' },
}

export default function WorkCard({ work, compact = false }: WorkCardProps) {
  const navigate = useNavigate()
  const status = statusConfig[work.status]

  if (compact) {
    return (
      <div className="bg-white border-4 border-slate-100 rounded-[2rem] p-4 flex items-center gap-4 shadow-sm hover:border-purple-200 transition-colors">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${work.coverGradient} border-4 border-white flex items-center justify-center text-3xl flex-shrink-0 shadow-sm`}>
          {work.coverEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-jua text-slate-800 text-lg truncate">{work.title}</p>
          <p className="text-xs text-slate-400 font-bold mt-0.5">{work.subject} · {work.grade}학년</p>
        </div>
        <span className={`text-xs font-jua px-3 py-1.5 rounded-xl flex-shrink-0 ${status.bg}`}>
          {status.icon} {work.status}
        </span>
      </div>
    )
  }

  return (
    <div className="card-game overflow-hidden flex flex-col h-full hover:scale-[1.02] transition-transform rounded-[2rem] border-4 border-white shadow-sm">
      {/* 표지 영역 */}
      <div className={`h-32 bg-gradient-to-br ${work.coverGradient} flex items-center justify-center relative`}>
        <span className="text-6xl select-none animate-float drop-shadow-sm">{work.coverEmoji}</span>
        {work.stars > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 border-2 border-yellow-200 rounded-full px-3 py-1 text-amber-500 font-jua text-sm shadow-sm backdrop-blur-sm">
            <Star className="w-4 h-4 fill-yellow-400 stroke-amber-500 stroke-[2]" />
            <span>{work.stars}</span>
          </div>
        )}
      </div>

      {/* 정보 영역 */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4 bg-white">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-jua text-slate-800 text-base leading-snug truncate flex-1">{work.title}</h4>
            <span className={`text-[11px] font-jua px-2.5 py-1 rounded-lg flex-shrink-0 ${status.bg}`}>
              {work.status === '완료' ? '🏆' : status.icon} {work.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-bold">{work.subject} · {work.grade}학년</p>
        </div>

        <button
          onClick={() => navigate('/student/my')}
          className={`
            btn-game-3d w-full py-3 rounded-xl font-jua text-sm
            ${work.status === '완료' 
              ? 'btn-game-white text-slate-600' 
              : 'btn-game-purple'}
          `}
        >
          {work.status === '완료' ? '📖 다시보기' : work.status === '진행 중' ? '⚡ 계속하기' : '🚀 시작'}
        </button>
      </div>
    </div>
  )
}
