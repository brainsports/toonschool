import type { CoverState } from '../../types/cover'

const SUBJECT_OPTIONS = ['국어', '영어', '수학', '사회', '과학'];

interface CoverLearningInfoPanelProps {
  cover: CoverState
  onChangeCover: (field: keyof CoverState, value: any) => void
}

export default function CoverLearningInfoPanel({ cover, onChangeCover }: CoverLearningInfoPanelProps) {
  // 기존 과목명 데이터가 오타인 '영서'일 경우 '영어'로 보정
  const currentSubjectName = cover.subjectName === '영서' ? '영어' : (cover.subjectName || '수학')

  return (
    <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <p className="text-[11.5px] font-extrabold text-[#475569] uppercase">🏫 학습 정보</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {/* 학년 */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold text-[#64748B]">학년 선택</label>
            <select 
              value={cover.grade || 5} 
              onChange={e => onChangeCover('grade', parseInt(e.target.value, 10))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[12.5px] font-bold focus:outline-none focus:border-[#4F6AF0] transition-colors"
            >
              {[3, 4, 5, 6].map(g => (
                <option key={g} value={g}>{g}학년</option>
              ))}
            </select>
          </div>

          {/* 과목 */}
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold text-[#64748B]">과목 선택</label>
            <select 
              value={currentSubjectName} 
              onChange={e => {
                const subName = e.target.value
                onChangeCover('subjectName', subName)
              }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-[12.5px] font-bold focus:outline-none focus:border-[#4F6AF0] transition-colors"
            >
              {SUBJECT_OPTIONS.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
