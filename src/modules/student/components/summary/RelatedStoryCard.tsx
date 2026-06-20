// 단원 관련 이야기 카드 컴포넌트
import StudentWideCard from '../layout/StudentWideCard'
import StudentInnerPanel from '../layout/StudentInnerPanel'
interface RelatedStoryCardProps {
  story: string
}

export default function RelatedStoryCard({ story }: RelatedStoryCardProps) {
  return (
    <StudentWideCard className="!bg-amber-900/20 !border-amber-500/30">
      <div className="flex items-center gap-3 select-none border-b border-amber-500/30 pb-4">
        <span className="text-4xl animate-bounce-gentle">📜</span>
        <h3 className="text-xl md:text-2xl font-jua text-amber-200">역사 속 탐험 비화</h3>
      </div>
      <StudentInnerPanel className="!text-left !items-start !justify-start !bg-white/5 !border-white/5">
        <p className="whitespace-pre-wrap w-full">{story}</p>
      </StudentInnerPanel>
    </StudentWideCard>
  )
}
