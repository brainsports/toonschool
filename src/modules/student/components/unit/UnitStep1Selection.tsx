import { Loader2, Flower2 } from 'lucide-react'
import type { StudentGradeOption, StudentSemesterOption, CurriculumLoadState } from '../../types/studentCurriculum'
import StudentWideCard from '../layout/StudentWideCard'
import StudentInnerPanel from '../layout/StudentInnerPanel'

interface UnitStep1SelectionProps {
  grades: StudentGradeOption[]
  semesters: StudentSemesterOption[]
  selectedGrade: StudentGradeOption | null
  selectedSemester: StudentSemesterOption | null
  loadState: CurriculumLoadState
  gradeEmojis: Record<string, string>
  onGradeSelect: (g: StudentGradeOption) => void
  onSemesterSelect: (s: StudentSemesterOption) => void
}

export default function UnitStep1Selection({
  grades,
  semesters,
  selectedGrade,
  selectedSemester,
  loadState,
  gradeEmojis,
  onGradeSelect,
  onSemesterSelect
}: UnitStep1SelectionProps) {
  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-8">
      {/* 학년 선택 */}
      <StudentWideCard className="!gap-5">
        <h3 className="font-jua text-lg text-[#303442] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#f1ebff] border border-purple-200 flex items-center justify-center text-sm text-purple-600">
            1
          </span>
          학년을 골라주세요
        </h3>
        
        {grades.length === 0 && loadState === 'loading' ? (
          <div className="py-8 flex justify-center text-purple-300">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        ) : grades.length === 0 ? (
          <StudentInnerPanel>준비된 학년이 없습니다.</StudentInnerPanel>
        ) : (
          <div className="flex justify-center gap-8 md:gap-16">
            {grades.map((g) => {
              const isSelected = selectedGrade?.id === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => onGradeSelect(g)}
                  className={`btn-select-item flex-col w-[138px] h-[138px] md:w-[150px] md:h-[150px] py-3 px-2 gap-2
                    ${isSelected ? 'btn-select-item-active scale-105 shadow-md' : ''}`}
                >
                  <span className="text-5xl md:text-6xl select-none mb-2">{gradeEmojis[g.label] || '🎒'}</span>
                  <span className={`font-jua text-lg md:text-2xl ${isSelected ? 'text-white' : 'text-[#3f4350]'}`}>{g.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </StudentWideCard>

      {/* 학기 선택 */}
      <StudentWideCard className={`!gap-5 transition-all duration-300 ${selectedGrade ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none'}`}>
        <h3 className={`font-jua text-lg flex items-center gap-2 ${selectedGrade ? 'text-[#303442]' : 'text-[#8b909e]'}`}>
          <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-sm ${selectedGrade ? 'bg-[#f1ebff] border-purple-200 text-purple-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
            2
          </span>
          학기를 골라주세요
        </h3>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {semesters.map((s) => {
            const isSelected = selectedSemester?.id === s.id
            return (
              <button
                key={s.id}
                onClick={() => onSemesterSelect(s)}
                className={`btn-select-item flex-col w-[126px] h-[135px] md:w-[140px] md:h-[150px] py-3 px-2 gap-2
                  ${isSelected ? 'btn-select-item-active scale-105 shadow-md' : ''}`}
              >
                {s.value === 1 ? (
                  <Flower2
                    size={48}
                    strokeWidth={2}
                    className="text-[#2E7D32] fill-[#7CB342] mb-2"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="text-5xl md:text-6xl select-none mb-2">🍁</span>
                )}
                <span className={`font-jua text-lg md:text-2xl ${isSelected ? 'text-white' : 'text-[#3f4350]'}`}>{s.label}</span>
              </button>
            )
          })}
        </div>
      </StudentWideCard>

    </div>
  )
}
