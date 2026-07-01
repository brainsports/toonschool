import { Loader2 } from 'lucide-react'
import type { 
  StudentGradeOption, 
  StudentSemesterOption,
  StudentSubjectOption, 
  StudentMajorUnitOption, 
  StudentMiddleUnitOption, 
  CurriculumLoadState 
} from '../../types/studentCurriculum'
import StudentWideCard from '../layout/StudentWideCard'
import StudentInnerPanel from '../layout/StudentInnerPanel'

interface UnitStep2SelectionProps {
  selectedGrade: StudentGradeOption | null
  selectedSemester: StudentSemesterOption | null
  subjects: StudentSubjectOption[]
  selectedSubject: StudentSubjectOption | null
  majorUnits: StudentMajorUnitOption[]
  middleUnits: StudentMiddleUnitOption[]
  selectedMajorUnit: StudentMajorUnitOption | null
  selectedMiddleUnit: StudentMiddleUnitOption | null
  loadState: CurriculumLoadState
  subjectLoadState: CurriculumLoadState
  gradeEmojis: Record<string, string>
  subjectEmojis: Record<string, string>
  classUnitSetting: any
  onSubjectSelect: (s: StudentSubjectOption) => void
  onMajorUnitSelect: (id: string) => void
  onMiddleUnitSelect: (id: string) => void
}

export default function UnitStep2Selection({
  selectedGrade,
  selectedSemester,
  subjects,
  selectedSubject,
  majorUnits,
  middleUnits,
  selectedMajorUnit,
  selectedMiddleUnit,
  loadState,
  subjectLoadState,
  gradeEmojis,
  subjectEmojis,
  classUnitSetting,
  onSubjectSelect,
  onMajorUnitSelect,
  onMiddleUnitSelect
}: UnitStep2SelectionProps) {
  return (
    <div className="relative w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-8">

      {/* 단원 선택 */}
      <StudentWideCard className="!gap-8">
        <div className="flex items-center gap-3 bg-[#f4f1ff] p-4 rounded-2xl border border-purple-200">
          <span className="text-2xl">{gradeEmojis[selectedGrade?.label || ''] || '🎒'}</span>
          <span className="font-jua text-lg text-[#3f4350]">{selectedGrade?.label}</span>
          <span className="text-[#8b909e]">/</span>
          <span className="text-2xl">{selectedSemester?.value === 1 ? '🌸' : '🍁'}</span>
          <span className="font-jua text-lg text-[#3f4350]">{selectedSemester?.label}</span>
        </div>

        {/* 과목 선택 */}
        <div className="space-y-4">
          <h3 className="font-jua text-xl text-[#303442] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#f1ebff] border border-purple-200 flex items-center justify-center text-sm text-purple-600">3</span>
            과목을 골라주세요
          </h3>
          
          {subjects.length === 0 && subjectLoadState === 'loading' ? (
            <div className="py-8 flex justify-center text-sky-300">
              <Loader2 className="animate-spin w-10 h-10" />
            </div>
          ) : subjects.length === 0 ? (
            <StudentInnerPanel>준비된 과목이 없습니다.</StudentInnerPanel>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 lg:gap-8">
              {subjects.map((s) => {
                const isSelected = selectedSubject?.id === s.id
                const isAllowed = !classUnitSetting || classUnitSetting.subjects.includes('전체') || classUnitSetting.subjects.includes(s.name)
                return (
                  <button
                    key={s.id}
                    onClick={() => isAllowed && onSubjectSelect(s)}
                    disabled={!isAllowed}
                    title={!isAllowed ? "선생님이 아직 열어두지 않은 과목이에요" : ""}
                    className={`btn-select-item flex-col w-[100px] h-[110px] md:w-[120px] md:h-[130px] py-2 px-2 gap-2 transition-all
                      ${isSelected ? 'btn-select-item-active scale-105 shadow-md' : ''}
                      ${!isAllowed ? 'opacity-50 grayscale border-gray-300 cursor-not-allowed bg-gray-50' : ''}`}
                  >
                    <span className="text-4xl md:text-5xl select-none mb-1">{subjectEmojis[s.name] || '📚'}</span>
                    <span className={`font-jua text-base md:text-xl ${isSelected ? 'text-white' : !isAllowed ? 'text-gray-400' : 'text-[#3f4350]'}`}>{s.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {selectedSubject && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-jua text-xl text-[#303442] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#f1ebff] border border-purple-200 flex items-center justify-center text-sm text-purple-600">4</span>
              대단원을 골라요
            </h3>
            {majorUnits.length === 0 && loadState === 'loading' ? (
              <div className="py-4 flex justify-center text-purple-300">
                <Loader2 className="animate-spin w-8 h-8" />
              </div>
            ) : majorUnits.length === 0 ? (
              <StudentInnerPanel>단원이 없습니다.</StudentInnerPanel>
            ) : (
              <select
                value={selectedMajorUnit?.id || ''}
                onChange={(e) => onMajorUnitSelect(e.target.value)}
                className="input-game-soft w-full font-bold"
              >
                <option value="">대단원을 선택해주세요</option>
                {majorUnits.map((mu) => {
                  const isAllowed = !classUnitSetting || classUnitSetting.subjects.includes('전체') || (mu.unitNumber >= classUnitSetting.fromUnit && mu.unitNumber <= classUnitSetting.toUnit)
                  return (
                    <option key={mu.id} value={mu.id} disabled={!isAllowed} className={!isAllowed ? 'text-gray-400' : ''}>
                      {mu.unitNumber}단원. {mu.unitName} {!isAllowed ? '(선생님이 아직 열어두지 않은 단원이에요)' : ''}
                    </option>
                  )
                })}
              </select>
            )}
          </div>
        )}

        {selectedMajorUnit && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-jua text-xl text-[#303442] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#f1ebff] border border-purple-200 flex items-center justify-center text-sm text-purple-600">5</span>
              중단원을 골라요
            </h3>
            {middleUnits.length === 0 && loadState === 'loading' ? (
              <div className="py-4 flex justify-center text-sky-300">
                <Loader2 className="animate-spin w-8 h-8" />
              </div>
            ) : middleUnits.length === 0 ? (
              <StudentInnerPanel>선택할 수 있는 중단원이 아직 준비되지 않았어요.</StudentInnerPanel>
            ) : (
              <select
                value={selectedMiddleUnit?.id || ''}
                onChange={(e) => onMiddleUnitSelect(e.target.value)}
                className="input-game-soft w-full font-bold"
              >
                <option value="">중단원을 선택해주세요</option>
                {middleUnits.map((su) => (
                  <option key={su.id} value={su.id}>
                    {su.subunitName}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </StudentWideCard>

    </div>
  )
}
