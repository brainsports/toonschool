// 선택한 학년/과목/단원 요약 표시 컴포넌트
interface SelectedUnitSummaryProps {
  grade: string
  subject: string
  majorUnit: string
  subUnit: string
}

export default function SelectedUnitSummary({
  grade,
  subject,
  majorUnit,
  subUnit,
}: SelectedUnitSummaryProps) {
  return (
    <div className="card-game p-5 bg-gradient-to-r from-purple-800 to-indigo-900 border-4 border-black text-white shadow-[0_5px_0_#1e1b4b]">
      <span className="text-[10px] font-black text-yellow-300 block mb-2.5 uppercase tracking-wider">📡 활성화된 탐사 단원</span>
      
      <div className="flex flex-wrap gap-2">
        {grade && (
          <span className="bg-black/30 border border-white/10 px-3 py-1 rounded-xl text-xs font-black">
            {grade}
          </span>
        )}
        {subject && (
          <span className="bg-black/30 border border-white/10 px-3 py-1 rounded-xl text-xs font-black">
            {subject}
          </span>
        )}
        {majorUnit && (
          <span className="bg-black/30 border border-white/10 px-3 py-1 rounded-xl text-xs font-black">
            대단원: {majorUnit}
          </span>
        )}
        {subUnit && (
          <span className="bg-pink-500 border border-black px-3 py-1 rounded-xl text-xs font-black">
            중단원: {subUnit}
          </span>
        )}
      </div>
    </div>
  )
}
