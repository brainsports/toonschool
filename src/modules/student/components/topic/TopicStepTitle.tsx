import type { StudentUnitSelection } from '../../types/studentCurriculum'

interface TopicStepTitleProps {
  selection: StudentUnitSelection | null
}

export default function TopicStepTitle({ selection }: TopicStepTitleProps) {
  return (
    <div className="text-center mb-2">
      <h1 className="text-[2rem] font-jua text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">무엇을 그릴까?</h1>
      {selection ? (
        <div className="mt-4 inline-flex flex-wrap justify-center items-center gap-2 bg-white/10 px-6 py-2.5 rounded-full text-white backdrop-blur-md border border-white/20 font-jua text-base shadow-sm">
          <span>{selection.gradeName}</span>
          <span className="text-purple-300">/</span>
          <span>{selection.subjectName}</span>
          <span className="text-purple-300">/</span>
          <span>{selection.majorUnitName}</span>
          <span className="text-purple-300">/</span>
          <span>{selection.middleUnitName}</span>
        </div>
      ) : (
        <div className="mt-4 inline-block bg-red-500/20 px-6 py-2.5 rounded-full border border-red-400/50">
          <p className="text-sm font-jua text-red-200">단원 정보가 없습니다!</p>
        </div>
      )}
    </div>
  )
}
