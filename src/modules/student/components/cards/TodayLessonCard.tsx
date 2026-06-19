// 오늘의 학습툰 카드 컴포넌트
import { useNavigate } from 'react-router-dom'
import { Rocket, Trophy } from 'lucide-react'

interface TodayLessonCardProps {
  grade: string
  subject: string
  unit: string
  teacherMessage?: string
  compact?: boolean
}

export default function TodayLessonCard({
  grade,
  subject,
  unit,
  teacherMessage = '오늘도 멋진 학습툰을 만들어봐요!',
  compact = false,
}: TodayLessonCardProps) {
  const navigate = useNavigate()

  if (compact) {
    return (
      <div
        className="card-game p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white cursor-pointer card-game-interactive flex items-center gap-4 border-4 border-white shadow-sm rounded-[2rem]"
        onClick={() => navigate('/student/today')}
      >
        <div className="w-14 h-14 rounded-2xl bg-indigo-900/50 border-4 border-white/60 flex items-center justify-center text-3xl select-none shrink-0 shadow-inner">
          🚀
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-jua text-indigo-200 tracking-wider">TODAY'S MISSION</p>
          <p className="font-jua text-lg truncate text-yellow-300 drop-shadow-sm mt-0.5">{unit}</p>
        </div>
        <div className="bg-yellow-400 text-amber-900 border-2 border-white font-jua text-base px-4 py-1.5 rounded-2xl shadow-sm">
          시작!
        </div>
      </div>
    )
  }

  return (
    <div className="card-game p-6 md:p-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 border-4 border-white text-white space-y-6 shadow-sm rounded-[2.5rem]">
      {/* 타이틀 및 칭호 */}
      <div className="flex items-center gap-3">
        <Rocket className="w-8 h-8 text-yellow-300 animate-bounce-gentle fill-yellow-300 stroke-indigo-900 stroke-[1.5] drop-shadow-sm" />
        <h3 className="text-2xl font-jua tracking-wide text-yellow-300 drop-shadow-sm">오늘의 핵심 퀘스트</h3>
        <span className="ml-auto text-xs font-jua bg-pink-500 border-2 border-white/50 px-3 py-1 rounded-full text-white shadow-sm">선생님 특명</span>
      </div>

      {/* 미션 정보 */}
      <div className="bg-white/10 border-2 border-white/20 p-5 rounded-[2rem] relative shadow-inner">
        <span className="text-xs font-jua text-indigo-200 block mb-2">📌 오늘의 학습 대단원</span>
        <p className="text-3xl font-jua text-white drop-shadow-sm leading-tight">{unit}</p>
        <div className="flex items-center gap-2 mt-4">
          <span className="bg-purple-600/60 border-2 border-purple-400/50 text-sm font-jua px-3 py-1 rounded-full text-white">
            {grade}
          </span>
          <span className="bg-indigo-600/60 border-2 border-indigo-400/50 text-sm font-jua px-3 py-1 rounded-full text-white">
            {subject}
          </span>
        </div>
      </div>

      {/* 메시지 */}
      <div className="bg-white text-slate-800 border-4 border-indigo-100 p-5 rounded-[2rem] flex items-center gap-4 relative shadow-sm">
        <span className="text-4xl select-none animate-pulse">👽</span>
        <div>
          <span className="text-[11px] font-jua text-slate-400 block mb-1">교신 메시지</span>
          <p className="text-sm md:text-base font-bold text-slate-700 leading-normal">"{teacherMessage}"</p>
        </div>
      </div>

      {/* 퀘스트 단추 */}
      <button
        onClick={() => navigate('/student/today')}
        className="w-full py-5 bg-gradient-to-r from-amber-300 to-yellow-400 border-4 border-white text-amber-900 font-jua text-xl rounded-[2rem] shadow-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Trophy className="w-6 h-6 fill-yellow-200 stroke-amber-700 stroke-[2]" />
        <span>학습툰 퀘스트 시작하기</span>
      </button>
    </div>
  )
}
