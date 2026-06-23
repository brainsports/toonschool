// 단원 정리 페이지 - 단원 요약, 핵심 개념, 관련 이야기
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import UnitSummaryCard from '../components/summary/UnitSummaryCard'
import CoreConceptCard from '../components/summary/CoreConceptCard'
import RelatedStoryCard from '../components/summary/RelatedStoryCard'
import StudentPrimaryActionButton from '../components/layout/StudentPrimaryActionButton'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { mockUnitSummary } from '../data/studentMockData'

export default function StudentUnitSummaryPage() {
  const navigate = useNavigate()
  const [summaryMode, setSummaryMode] = useState<'default' | 'simple' | 'short'>('default')

  const simpleSummary = '분수는 전체를 몇 개로 나눈 것 중의 일부분을 가리키는 숫자예요. 분모가 같을 때는 위쪽 숫자인 분자만 편하게 더하거나 빼면 정답을 찾을 수 있어요! 분모가 다를 땐, 통분을 통해 분모를 같게 만들고 계산해야 해요!'

  const shortSummary = '★ 이것만 기억해요! ★\n1. 분모가 같으면? 분자끼리만 계산하기!\n2. 분모가 다르면? 통분으로 분모를 똑같이 만들고 계산하기!'

  const currentSummary =
    summaryMode === 'simple' ? simpleSummary
    : summaryMode === 'short' ? shortSummary
    : mockUnitSummary.summary

  return (
    <StudentCreationLayout currentStep="summary" bgVariant="space" maxWidth="full">
      <div className="flex flex-col gap-6 animate-fade-in pb-8">
        
        {/* 헤더 영역 */}
        <div className="text-center mb-2">
          <h1 className="text-[2rem] font-jua text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">단원 정리</h1>
          <p className="text-base font-bold text-slate-200 mt-2">
            만화에서 배운 핵심 개념을 다시 한번 짚어봐요!
          </p>
        </div>

        <div className="space-y-8">
          {/* 단원 요약 설명 보드 */}
          <div className="space-y-4">
            <UnitSummaryCard
              title={mockUnitSummary.title}
              summary={currentSummary}
              onSimplify={() => setSummaryMode('simple')}
              onShorten={() => setSummaryMode('short')}
            />
            {summaryMode !== 'default' && (
              <button
                onClick={() => setSummaryMode('default')}
                className="card-glass card-glass-interactive w-full min-h-[56px] text-slate-300 font-jua text-lg md:text-xl rounded-full"
              >
                원래 상세 설명 보기
              </button>
            )}
          </div>

          {/* 핵심 개념 Gems */}
          <CoreConceptCard concepts={mockUnitSummary.coreConcepts} />

          {/* 설화 비화 */}
          <RelatedStoryCard story={mockUnitSummary.relatedStory} />
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex gap-4 pt-8 border-t border-white/10 mt-4">
          <button
            onClick={() => navigate('/student/comic/full')}
            className="card-glass card-glass-interactive flex-1 min-h-[72px] text-slate-300 font-jua text-xl md:text-2xl flex items-center justify-center rounded-full"
          >
            <ArrowLeft className="w-6 h-6 stroke-[3] mr-2" />
            <span>이전</span>
          </button>

          <div className="flex-[2] w-full">
            <StudentPrimaryActionButton
              onClick={() => navigate('/student/quiz/intro')}
            >
              <span>퀴즈 풀러 가기 🧩</span>
              <ArrowRight className="w-6 h-6 stroke-[3] ml-2" />
            </StudentPrimaryActionButton>
          </div>
        </div>

      </div>
    </StudentCreationLayout>
  )
}
