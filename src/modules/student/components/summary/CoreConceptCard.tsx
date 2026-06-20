// 핵심 개념 카드 컴포넌트
import type { CoreConcept } from '../../types/studentFlow'
import StudentWideCard from '../layout/StudentWideCard'

interface CoreConceptCardProps {
  concepts: CoreConcept[]
}

const conceptBgs = [
  'bg-purple-500/20 border border-purple-500/30 text-purple-100',
  'bg-sky-500/20 border border-sky-500/30 text-sky-100',
  'bg-emerald-500/20 border border-emerald-500/30 text-emerald-100',
]

export default function CoreConceptCard({ concepts }: CoreConceptCardProps) {
  return (
    <StudentWideCard>
      <h3 className="text-xl md:text-2xl font-jua text-white drop-shadow-sm flex items-center gap-2 select-none px-2">
        <span className="text-2xl">💡</span> 배운 핵심 원리 3가지
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {concepts.map((concept, i) => (
          <div
            key={concept.id}
            className={`rounded-[1.5rem] p-5 flex flex-col items-center text-center shadow-sm backdrop-blur-sm ${conceptBgs[i] || conceptBgs[0]}`}
          >
            <div className="w-14 h-14 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-3xl select-none mb-4 shadow-lg animate-bounce-gentle">
              {concept.emoji}
            </div>
            <div>
              <p className="font-jua text-lg md:text-xl leading-tight text-white">{concept.title}</p>
              <p className="text-xs font-bold opacity-80 mt-2 leading-relaxed text-slate-200">
                {concept.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </StudentWideCard>
  )
}
