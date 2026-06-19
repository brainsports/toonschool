import { Loader2, ArrowRight } from 'lucide-react'
import type { StudentGradeOption, StudentSubjectOption, CurriculumLoadState } from '../../types/studentCurriculum'

interface UnitStep1SelectionProps {
  grades: StudentGradeOption[]
  subjects: StudentSubjectOption[]
  selectedGrade: StudentGradeOption | null
  selectedSubject: StudentSubjectOption | null
  loadState: CurriculumLoadState
  subjectLoadState: CurriculumLoadState
  gradeEmojis: Record<string, string>
  subjectEmojis: Record<string, string>
  onGradeSelect: (g: StudentGradeOption) => void
  onSubjectSelect: (s: StudentSubjectOption) => void
  onNextStep: () => void
  isStep1Complete: boolean
}

export default function UnitStep1Selection({
  grades,
  subjects,
  selectedGrade,
  selectedSubject,
  loadState,
  subjectLoadState,
  gradeEmojis,
  subjectEmojis,
  onGradeSelect,
  onSubjectSelect,
  onNextStep,
  isStep1Complete
}: UnitStep1SelectionProps) {
  return (
    <div className="w-full max-w-[620px] mx-auto space-y-6 animate-fade-in pb-8">
      {/* 학년 선택 */}
      <div className="card-glass px-6 py-6 md:px-7 md:py-7 space-y-5">
        <h3 className="font-jua text-lg text-purple-200 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-purple-500/40 border border-purple-400/60 flex items-center justify-center text-sm text-purple-100">
            1
          </span>
          학년을 골라주세요
        </h3>
        
        {grades.length === 0 && loadState === 'loading' ? (
          <div className="py-8 flex justify-center text-purple-300">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        ) : grades.length === 0 ? (
          <p className="text-sm text-slate-300 font-bold py-8 text-center bg-white/5 rounded-2xl border border-white/10">준비된 학년이 없습니다.</p>
        ) : (
          <div className="flex justify-center gap-6">
            {grades.map((g) => {
              const isSelected = selectedGrade?.id === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => onGradeSelect(g)}
                  className={`
                    w-[92px] h-[92px] md:w-[100px] md:h-[100px] py-3 px-2 transition-all flex flex-col items-center justify-center gap-2
                    ${isSelected
                      ? 'card-glass card-glass-active scale-105 text-white shadow-[0_0_20px_rgba(167,139,250,0.3)]'
                      : 'card-glass card-glass-interactive text-slate-300'}
                  `}
                >
                  <span className="text-4xl select-none mb-1">{gradeEmojis[g.label] || '🎒'}</span>
                  <span className="font-jua text-sm md:text-base">{g.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 과목 선택 */}
      <div className={`card-glass px-6 py-6 md:px-7 md:py-7 space-y-5 transition-all duration-300 ${selectedGrade ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none'}`}>
        <h3 className="font-jua text-lg text-sky-300 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-sky-500/40 border border-sky-400/60 flex items-center justify-center text-sm text-sky-100">
            2
          </span>
          과목을 골라주세요
        </h3>
        
        {subjects.length === 0 && subjectLoadState === 'loading' ? (
          <div className="py-8 flex justify-center text-sky-300">
            <Loader2 className="animate-spin w-10 h-10" />
          </div>
        ) : subjects.length === 0 && selectedGrade ? (
          <p className="text-sm text-slate-300 font-bold py-8 text-center bg-white/5 rounded-2xl border border-white/10">준비된 과목이 없습니다.</p>
        ) : (
          <div className="flex flex-wrap justify-center gap-4">
            {subjects.map((s) => {
              const isSelected = selectedSubject?.id === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => onSubjectSelect(s)}
                  className={`
                    w-[84px] h-[84px] md:w-[92px] md:h-[92px] py-3 px-2 transition-all flex flex-col items-center justify-center gap-2
                    ${isSelected
                      ? 'card-glass card-glass-active scale-105 text-white shadow-[0_0_15px_rgba(56,189,248,0.3)] border-sky-400/50'
                      : 'card-glass card-glass-interactive text-slate-300'}
                  `}
                >
                  <span className="text-3xl select-none mb-1">{subjectEmojis[s.name] || '📚'}</span>
                  <span className="font-jua text-sm">{s.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 하단 1단계 버튼 */}
      <div className="flex justify-end pt-2 lg:fixed lg:right-10 lg:top-24 lg:pt-0 z-40">
        <button
          disabled={!isStep1Complete}
          onClick={onNextStep}
          className={`flex items-center px-10 py-3.5 rounded-full font-jua text-base md:text-lg transition-all ${
            isStep1Complete 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-105' 
            : 'bg-white/5 text-slate-500 border border-white/10'
          }`}
        >
          <span>다음 🚀</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  )
}
