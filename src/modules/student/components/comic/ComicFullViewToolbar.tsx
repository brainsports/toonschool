// 전체보기 툴바 컴포넌트
import { useNavigate } from 'react-router-dom'
import { Edit3, Move } from 'lucide-react'
import StudentPrimaryActionButton from '../layout/StudentPrimaryActionButton'

interface ComicFullViewToolbarProps {
  onReviseAll?: () => void
  onMoveBubbles?: () => void
}

export default function ComicFullViewToolbar({
  onReviseAll,
  onMoveBubbles,
}: ComicFullViewToolbarProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      {/* 보조 버튼들 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onReviseAll}
          className="card-glass card-glass-interactive min-h-[56px] px-2 text-base md:text-lg text-slate-300 font-jua flex items-center justify-center gap-2 rounded-2xl"
        >
          <Edit3 className="w-5 h-5" />
          <span>전부 처음부터 고치기</span>
        </button>
        <button
          onClick={onMoveBubbles}
          className="card-glass card-glass-interactive min-h-[56px] px-2 text-base md:text-lg text-slate-300 font-jua flex items-center justify-center gap-2 rounded-2xl"
        >
          <Move className="w-5 h-5" />
          <span>말풍선 위치 바꾸기</span>
        </button>
      </div>

      {/* 메인 버튼 */}
      <div className="flex justify-center pt-4 border-t border-white/10 mt-4">
        <StudentPrimaryActionButton
          onClick={() => navigate('/student/summary')}
          className="max-w-md"
        >
          <span className="text-2xl mr-2">📖</span> 배운 내용 정리하러 가기!
        </StudentPrimaryActionButton>
      </div>
    </div>
  )
}
