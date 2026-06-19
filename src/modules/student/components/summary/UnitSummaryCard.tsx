// 단원 요약 카드 컴포넌트
interface UnitSummaryCardProps {
  title: string
  summary: string
  onSimplify?: () => void
  onShorten?: () => void
}

export default function UnitSummaryCard({
  title,
  summary,
  onSimplify,
  onShorten,
}: UnitSummaryCardProps) {
  return (
    <div className="card-glass p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3 select-none border-b border-white/10 pb-4">
        <span className="text-4xl animate-bounce-gentle">📖</span>
        <h3 className="text-xl font-jua text-purple-200">{title} 탐험 핵심 요약</h3>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-inner">
        <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed whitespace-pre-wrap">{summary}</p>
      </div>

      {/* 보조 버튼들 */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        {onSimplify && (
          <button
            onClick={onSimplify}
            className="card-glass card-glass-interactive py-4 px-2 text-sm font-jua text-sky-300 hover:border-sky-400/50 hover:bg-sky-500/20"
          >
            <span>🔄 쉽게 보기</span>
          </button>
        )}
        {onShorten && (
          <button
            onClick={onShorten}
            className="card-glass card-glass-interactive py-4 px-2 text-sm font-jua text-purple-300 hover:border-purple-400/50 hover:bg-purple-500/20"
          >
            <span>✂️ 짧게 보기</span>
          </button>
        )}
      </div>
    </div>
  )
}
