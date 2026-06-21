import type { StudentUnitSelection } from '../../types/studentCurriculum'

interface TopicStepTitleProps {
  selection: StudentUnitSelection | null
}

export default function TopicStepTitle({ selection }: TopicStepTitleProps) {
  return (
    <div className="text-center">
      <h1 className="text-[2rem] md:text-[2.15rem] font-jua text-[#202330]">무엇을 그릴까?</h1>
      {selection ? (
        <div className="mt-[16px] inline-flex flex-wrap justify-center items-center gap-2 bg-white px-6 py-2.5 rounded-full text-[#626776] border border-[rgba(111,78,190,0.18)] font-jua text-base shadow-sm">
          <span>{selection.gradeName}</span>
          <span className="text-purple-300">/</span>
          <span>{selection.subjectName}</span>
          <span className="text-purple-300">/</span>
          <span>{selection.majorUnitName}</span>
          <span className="text-purple-300">/</span>
          <span>{selection.middleUnitName}</span>
        </div>
      ) : (
        <div className="mt-[16px] inline-block bg-red-50 px-6 py-2.5 rounded-full border border-red-200">
          <p className="text-sm font-jua text-red-500">단원 정보가 없습니다!</p>
        </div>
      )}
    </div>
  )
}
