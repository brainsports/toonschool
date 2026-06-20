// 만화 컷 액션 버튼 그룹 컴포넌트
import { Sparkles, Check, ArrowLeft, ArrowRight } from 'lucide-react'

interface ComicCutActionButtonsProps {
  cutNumber: number
  totalCuts?: number
  onKeep: () => void
  onEdit: () => void
  onAiRewrite: () => void
  onNext: () => void
  onBack: () => void
}

export default function ComicCutActionButtons({
  cutNumber,
  totalCuts = 6,
  onKeep,
  onAiRewrite,
  onNext,
  onBack,
}: ComicCutActionButtonsProps) {
  const isLast = cutNumber >= totalCuts

  return (
    <div className="space-y-4 select-none">
      {/* 1. 대사 조작 헬퍼 버튼들 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onKeep}
          className="card-glass card-glass-interactive min-h-[72px] text-purple-200 font-jua flex items-center justify-center text-xl md:text-2xl rounded-full"
        >
          <Check className="w-6 h-6 stroke-[3] mr-2" />
          <span>대사 저장하기</span>
        </button>

        <button
          type="button"
          onClick={onAiRewrite}
          className="card-glass card-glass-interactive min-h-[72px] text-sky-300 font-jua flex items-center justify-center text-xl md:text-2xl rounded-full"
        >
          <Sparkles className="w-6 h-6 fill-sky-300 stroke-sky-200 stroke-2 mr-2" />
          <span>AI 다른 추천</span>
        </button>
      </div>

      {/* 2. 이전/다음 콕핏 화살표 버튼 (좌우 대칭 배치) */}
      <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-white/10">
        {/* 이전 버튼 */}
        <button
          type="button"
          onClick={onBack}
          className="card-glass card-glass-interactive min-h-[72px] text-slate-300 font-jua text-xl md:text-2xl flex items-center justify-center rounded-full"
        >
          <ArrowLeft className="w-6 h-6 stroke-[3] mr-2" />
          <span>이전 장면</span>
        </button>

        {/* 다음 버튼 */}
        <button
          type="button"
          onClick={onNext}
          className="btn-neon-purple min-h-[72px] font-jua text-xl md:text-2xl flex items-center justify-center rounded-full"
        >
          <span>{isLast ? '전체 보기' : '다음 장면'}</span>
          <ArrowRight className="w-6 h-6 stroke-[3] ml-2" />
        </button>
      </div>
    </div>
  )
}
