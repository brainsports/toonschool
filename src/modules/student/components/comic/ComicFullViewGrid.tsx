// 6컷 전체보기 그리드 컴포넌트 (2열 혹은 3열 배치)
import type { ComicCut } from '../../types/studentFlow'
import ComicFullViewCard from './ComicFullViewCard'

interface ComicFullViewGridProps {
  cuts: ComicCut[]
  onRevise?: (cutNumber: number) => void
}

export default function ComicFullViewGrid({ cuts, onRevise }: ComicFullViewGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {cuts.map((cut) => (
        <ComicFullViewCard
          key={cut.id}
          cut={cut}
          onRevise={onRevise}
        />
      ))}
    </div>
  )
}
