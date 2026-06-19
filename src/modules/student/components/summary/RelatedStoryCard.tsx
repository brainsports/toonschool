// 단원 관련 이야기 카드 컴포넌트
interface RelatedStoryCardProps {
  story: string
}

export default function RelatedStoryCard({ story }: RelatedStoryCardProps) {
  return (
    <div className="card-glass p-6 md:p-8 bg-amber-900/20 border border-amber-500/30 space-y-4 shadow-sm">
      <div className="flex items-center gap-3 select-none border-b border-amber-500/30 pb-4">
        <span className="text-4xl animate-bounce-gentle">📜</span>
        <h3 className="text-xl font-jua text-amber-200">역사 속 탐험 비화</h3>
      </div>
      <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{story}</p>
    </div>
  )
}
