import { Loader2, ArrowLeft } from 'lucide-react'
import type { 
  StudentGradeOption, 
  StudentSubjectOption, 
  StudentMajorUnitOption, 
  StudentMiddleUnitOption, 
  CurriculumLoadState 
} from '../../types/studentCurriculum'
import StudentWideCard from '../layout/StudentWideCard'
import StudentInnerPanel from '../layout/StudentInnerPanel'
import StudentPrimaryActionButton from '../layout/StudentPrimaryActionButton'

interface UnitStep2SelectionProps {
  selectedGrade: StudentGradeOption | null
  selectedSubject: StudentSubjectOption | null
  majorUnits: StudentMajorUnitOption[]
  middleUnits: StudentMiddleUnitOption[]
  selectedMajorUnit: StudentMajorUnitOption | null
  selectedMiddleUnit: StudentMiddleUnitOption | null
  loadState: CurriculumLoadState
  gradeEmojis: Record<string, string>
  subjectEmojis: Record<string, string>
  onMajorUnitSelect: (id: string) => void
  onMiddleUnitSelect: (id: string) => void
  onPrevStep: () => void
  onProceed: () => void
  canProceed: boolean
}

export default function UnitStep2Selection({
  selectedGrade,
  selectedSubject,
  majorUnits,
  middleUnits,
  selectedMajorUnit,
  selectedMiddleUnit,
  loadState,
  gradeEmojis,
  subjectEmojis,
  onMajorUnitSelect,
  onMiddleUnitSelect,
  onPrevStep,
  onProceed,
  canProceed
}: UnitStep2SelectionProps) {
  return (
    <div className="relative w-full max-w-[1200px] mx-auto space-y-6 animate-fade-in pb-8">
      {/* 데스크톱 이전 버튼 */}
      <div className="hidden lg:flex lg:fixed lg:left-60 lg:top-24 z-40">
        <button
          onClick={onPrevStep}
          className="card-glass card-glass-interactive flex items-center justify-center px-8 py-3.5 rounded-full text-slate-200 font-jua text-base md:text-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3] mr-2" />
          <span>이전</span>
        </button>
      </div>

      {/* 단원 선택 */}
      <StudentWideCard className="!gap-8">
        <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/20">
          <span className="text-2xl">{gradeEmojis[selectedGrade?.label || ''] || '🎒'}</span>
          <span className="font-jua text-lg text-purple-200">{selectedGrade?.label}</span>
          <span className="text-purple-300">/</span>
          <span className="text-2xl">{subjectEmojis[selectedSubject?.name || ''] || '📚'}</span>
          <span className="font-jua text-lg text-sky-200">{selectedSubject?.name}</span>
        </div>

        <div className="space-y-4">
          <h3 className="font-jua text-xl text-purple-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-sm text-purple-100">3</span>
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
              className="input-glass-soft w-full font-bold"
            >
              <option value="">대단원을 선택해주세요</option>
              {majorUnits.map((mu) => (
                <option key={mu.id} value={mu.id}>
                  {mu.unitNumber}단원. {mu.unitName}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedMajorUnit && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-jua text-xl text-sky-300 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500/30 border border-sky-400/50 flex items-center justify-center text-sm text-sky-100">4</span>
              중단원을 골라요
            </h3>
            {middleUnits.length === 0 && loadState === 'loading' ? (
              <div className="py-4 flex justify-center text-sky-300">
                <Loader2 className="animate-spin w-8 h-8" />
              </div>
            ) : middleUnits.length === 0 ? (
              <StudentInnerPanel>세부 단원이 없습니다.</StudentInnerPanel>
            ) : (
              <select
                value={selectedMiddleUnit?.id || ''}
                onChange={(e) => onMiddleUnitSelect(e.target.value)}
                className="input-glass-soft w-full font-bold"
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

      {/* 하단 2단계 버튼 */}
      <div className="flex flex-col md:flex-row gap-4 pt-4">
        {/* 모바일/태블릿용 이전 버튼 */}
        <button
          onClick={onPrevStep}
          className="lg:hidden card-glass card-glass-interactive flex items-center justify-center flex-1 py-4 text-slate-200 font-jua text-lg"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3] mr-2" />
          <span>이전</span>
        </button>

        <div className="flex-[2] w-full">
          <StudentPrimaryActionButton
            disabled={!canProceed}
            onClick={onProceed}
          >
            주제 고르기 ✨
          </StudentPrimaryActionButton>
        </div>
      </div>
    </div>
  )
}
