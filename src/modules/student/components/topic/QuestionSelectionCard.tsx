import { useState, useEffect } from 'react'
import type { GeneratedQuestion, QuestionCategory } from '../../types/studentTopic'
import { Check, CheckCircle2, Circle } from 'lucide-react'

interface QuestionSelectionCardProps {
  categories: QuestionCategory[]
  questions: GeneratedQuestion[]
  selectedQuestionId: string | null
  onSelectQuestion: (questionId: string | null) => void
  onProceed: () => void
  isLoading: boolean
  isTopicGenerating?: boolean
  selectedKeywords?: string[]
}

export default function QuestionSelectionCard({
  categories,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onProceed,
  isLoading,
  isTopicGenerating = false,
  selectedKeywords = []
}: QuestionSelectionCardProps) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.code || '')

  useEffect(() => {
    if (categories.length > 0 && !activeTab) {
      setActiveTab(categories[0].code)
    }
  }, [categories, activeTab])

  // 질문 유형 변경 시 선택된 질문이 새 유형에 없으면 초기화
  useEffect(() => {
    if (selectedQuestionId && questions.length > 0) {
      const selectedQ = questions.find(q => q.id === selectedQuestionId)
      if (selectedQ && selectedQ.categoryCode !== activeTab) {
        onSelectQuestion(null)
      }
    }
  }, [activeTab, questions, selectedQuestionId, onSelectQuestion])

  if (isLoading) {
    return (
      <div className="card-select-panel p-8 flex flex-col items-center justify-center min-h-[300px] animate-fade-in bg-white rounded-3xl shadow-sm">
        <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4" />
        <p className="font-jua text-2xl text-[#202330]">재미있는 질문을 만들고 있어요...</p>
        <p className="text-[#626776] mt-2">어떤 질문들이 나올까요?</p>
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    return null
  }

  const currentCategoryCode = activeTab || categories[0]?.code
  const filteredQuestions = questions.filter(q => q.categoryCode === currentCategoryCode)

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 animate-fade-in flex flex-col gap-8">
      {/* 1. 질문 페이지 레이아웃 Header */}
      <div className="flex flex-col items-center text-center gap-4">
        {selectedKeywords.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {selectedKeywords.map((kw, i) => (
              <span key={i} className="px-4 py-1.5 bg-gray-100 text-[#4B5563] font-jua rounded-full text-lg">
                # {kw}
              </span>
            ))}
          </div>
        )}
        <div>
          <h2 className="font-jua text-3xl text-[#202330]">질문을 골라 볼까요?</h2>
          <p className="text-[#626776] text-lg mt-2">먼저 질문 유형을 고르고, 마음에 드는 질문을 선택하세요.</p>
        </div>
      </div>

      {/* 2단 구성 영역 */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* 왼쪽: 질문 유형 */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <h3 className="font-jua text-2xl text-[#303442] flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 text-pink-600 text-xl pb-0.5">1</span>
            질문 유형
          </h3>
          <div className="flex flex-col gap-3">
            {categories.map(cat => {
              const isActive = currentCategoryCode === cat.code
              return (
                <button
                  key={cat.code}
                  onClick={() => setActiveTab(cat.code)}
                  className={`relative p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between ${
                    isActive
                      ? 'bg-pink-50 border-pink-400'
                      : 'bg-white border-gray-100 hover:border-pink-200'
                  }`}
                >
                  <div>
                    <p className={`font-jua text-xl ${isActive ? 'text-pink-600' : 'text-[#4B5563]'}`}>
                      {cat.name}
                    </p>
                  </div>
                  {isActive && <Check className="w-6 h-6 text-pink-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* 오른쪽: 질문 선택 */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <h3 className="font-jua text-2xl text-[#303442] flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 text-xl pb-0.5">2</span>
            질문 선택
          </h3>
          
          <div className="flex flex-col gap-3">
            {filteredQuestions.map((q, idx) => {
              const isSelected = selectedQuestionId === q.id || q.isSelected
              return (
                <button
                  key={q.id || idx}
                  onClick={() => q.id && onSelectQuestion(q.id)}
                  className={`p-5 rounded-2xl text-left transition-all border-2 flex items-start gap-4 ${
                    isSelected
                      ? 'bg-purple-50 border-purple-400 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-purple-200 hover:shadow-sm'
                  }`}
                >
                  <div className="mt-1 shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="w-7 h-7 text-purple-500" />
                    ) : (
                      <Circle className="w-7 h-7 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <p className={`leading-relaxed ${isSelected ? 'text-purple-900 font-bold text-xl' : 'text-[#303442] text-lg font-medium'}`}>
                      {q.questionText}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-center mt-6 pt-6 border-t border-gray-100">
        <button
          disabled={!selectedQuestionId || isTopicGenerating}
          onClick={onProceed}
          className={`btn-primary-action px-10 py-5 font-jua text-2xl transition-all shadow-md min-w-[320px] flex justify-center items-center ${
            (!selectedQuestionId || isTopicGenerating) 
              ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 shadow-none' 
              : '!bg-[#EC4899] hover:!bg-[#DB2777] !text-white' // 진한 핑크색으로 변경
          }`}
        >
          {isTopicGenerating ? (
            <>
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mr-3" />
              주제를 만들고 있어요...
            </>
          ) : (
            <>
              이 질문으로 만화 주제 만들기 ✨
            </>
          )}
        </button>
      </div>
    </div>
  )
}
