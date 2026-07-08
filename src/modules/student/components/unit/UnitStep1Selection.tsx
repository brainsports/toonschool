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
  classUnitSetting: any
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
  classUnitSetting,
  onGradeSelect,
  onSemesterSelect,
}: UnitStep1SelectionProps) {
  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-8">

      {/* ① 학년 선택 */}
      <StudentWideCard className="!gap-6">
        <h3 className="font-jua text-lg text-[#1f2937] flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-pink-100 border border-pink-300 flex items-center justify-center text-sm text-pink-600 font-bold">
            1
          </span>
          학년을 골라주세요
        </h3>

        {grades.length === 0 && loadState === 'loading' ? (
          <div className="py-8 flex justify-center text-pink-300">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        ) : grades.length === 0 ? (
          <StudentInnerPanel>준비된 학년이 없습니다.</StudentInnerPanel>
        ) : (
          <div className="flex justify-center gap-6 md:gap-10 flex-wrap">
            {grades.map((g) => {
              const isSelected = selectedGrade?.id === g.id
              const isAllowed  = !classUnitSetting || classUnitSetting.grade === g.value
              return (
                <button
                  key={g.id}
                  onClick={() => isAllowed && onGradeSelect(g)}
                  disabled={!isAllowed}
                  title={!isAllowed ? '선생님이 아직 열어두지 않은 학년이에요' : ''}
                  className={[
                    'btn-select-item flex-col w-[130px] h-[130px] md:w-[148px] md:h-[148px] py-3 px-2 gap-2 transition-all',
                    isSelected  ? 'btn-select-item-active' : '',
                    !isAllowed  ? 'opacity-40 grayscale cursor-not-allowed border-gray-200 bg-gray-50 shadow-none' : '',
                  ].join(' ')}
                >
                  <span className="text-5xl md:text-6xl select-none mb-1">
                    {gradeEmojis[g.label] || '🎒'}
                  </span>
                  <span className={[
                    'font-jua text-xl md:text-2xl',
                    isSelected  ? 'text-white' : '',
                    !isAllowed  ? 'text-gray-400' : 'text-[#1f2937]',
                  ].join(' ')}>
                    {g.label}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </StudentWideCard>

      {/* ② 학기 선택 */}
      <StudentWideCard
        className={[
          '!gap-6 transition-all duration-300',
          selectedGrade ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none',
        ].join(' ')}
      >
        <h3 className={[
          'font-jua text-lg flex items-center gap-2',
          selectedGrade ? 'text-[#1f2937]' : 'text-[#9ca3af]',
        ].join(' ')}>
          <span className={[
            'w-7 h-7 rounded-full border flex items-center justify-center text-sm font-bold',
            selectedGrade
              ? 'bg-pink-100 border-pink-300 text-pink-600'
              : 'bg-gray-100 border-gray-200 text-gray-400',
          ].join(' ')}>
            2
          </span>
          학기를 골라주세요
        </h3>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {semesters.map((s) => {
            const isSelected = selectedSemester?.id === s.id
            const isAllowed  = !classUnitSetting || classUnitSetting.semester === s.value
            return (
              <button
                key={s.id}
                onClick={() => isAllowed && onSemesterSelect(s)}
                disabled={!isAllowed}
                title={!isAllowed ? '선생님이 아직 열어두지 않은 학기예요' : ''}
                className={[
                  'btn-select-item flex-col w-[120px] h-[130px] md:w-[140px] md:h-[148px] py-3 px-2 gap-2 transition-all',
                  isSelected ? 'btn-select-item-active' : '',
                  !isAllowed ? 'opacity-40 grayscale cursor-not-allowed border-gray-200 bg-gray-50 shadow-none' : '',
                ].join(' ')}
              >
                {s.value === 1 ? (
                  <Flower2
                    size={48}
                    strokeWidth={2}
                    className={isSelected ? 'text-white mb-1' : 'text-emerald-500 mb-1'}
                    aria-hidden="true"
                  />
                ) : (
                  <span className="text-5xl md:text-6xl select-none mb-1">🍁</span>
                )}
                <span className={[
                  'font-jua text-xl md:text-2xl',
                  isSelected  ? 'text-white' : '',
                  !isAllowed  ? 'text-gray-400' : 'text-[#1f2937]',
                ].join(' ')}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
      </StudentWideCard>

    </div>
  )
}
