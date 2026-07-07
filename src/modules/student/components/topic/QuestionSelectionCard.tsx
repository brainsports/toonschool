import { useState } from 'react'
import type { GeneratedQuestion, QuestionCategory } from '../../types/studentTopic'
import { Sparkles, HelpCircle } from 'lucide-react'

interface QuestionSelectionCardProps {
  categories: QuestionCategory[]
  questions: GeneratedQuestion[]
  selectedQuestionId: string | null
  onSelectQuestion: (questionId: string) => void
  onProceed: () => void
  isLoading: boolean
  isTopicGenerating?: boolean
}

export default function QuestionSelectionCard({
  categories,
  questions,
  selectedQuestionId,
  onSelectQuestion,
  onProceed,
  isLoading,
  isTopicGenerating = false
}: QuestionSelectionCardProps) {
  const [activeTab, setActiveTab] = useState<string>(categories[0]?.code || '')

  if (isLoading) {
    return (
      <div className="card-select-panel p-8 flex flex-col items-center justify-center min-h-[300px] animate-fade-in">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="font-jua text-2xl text-[#202330]">재미있는 질문을 만들고 있어요...</p>
        <p className="text-[#626776] mt-2">어떤 질문들이 나올까요?</p>
      </div>
    )
  }

  if (!questions || questions.length === 0) {
    return null
  }

  // Ensure active tab is valid
  const currentCategoryCode = activeTab || categories[0]?.code
  const filteredQuestions = questions.filter(q => q.categoryCode === currentCategoryCode)

  return (
    <div className="card-select-panel p-6 md:p-8 animate-fade-in flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-100 p-2.5 rounded-xl shrink-0">
          <HelpCircle className="w-7 h-7 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-jua text-2xl text-[#202330]">어떤 질문으로 이야기를 만들까요?</h3>
          <p className="text-[#626776] text-base mt-1">마음에 드는 질문을 하나 골라주세요.</p>
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="flex flex-wrap gap-2 pb-2">
        {categories.map(cat => (
          <button
            key={cat.code}
            onClick={() => setActiveTab(cat.code)}
            className={`px-4 py-2.5 rounded-full font-jua text-lg transition-all ${
              currentCategoryCode === cat.code
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white text-[#626776] border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 카테고리 설명 */}
      <div className="bg-indigo-50/50 rounded-xl p-4 -mt-2">
        <p className="text-[#4B5563] text-sm md:text-base text-center">
          💡 {categories.find(c => c.code === currentCategoryCode)?.description}
        </p>
      </div>

      {/* 질문 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuestions.map((q, idx) => {
          const isSelected = selectedQuestionId === q.id || q.isSelected
          return (
            <button
              key={q.id || idx}
              onClick={() => q.id && onSelectQuestion(q.id)}
              className={`p-5 rounded-2xl text-left transition-all border-2 flex items-start gap-3 ${
                isSelected
                  ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500 ring-opacity-30'
                  : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
              }`}>
                {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
              <div>
                <p className={`font-medium leading-snug ${isSelected ? 'text-indigo-900 font-bold text-lg' : 'text-[#303442] text-base'}`}>
                  {q.questionText}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-center mt-4">
        <button
          disabled={!selectedQuestionId || isTopicGenerating}
          onClick={onProceed}
          className={`btn-primary-action px-8 py-4 font-jua text-xl transition-all shadow-md min-w-[280px] flex justify-center items-center ${
            (!selectedQuestionId || isTopicGenerating) ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 shadow-none' : '!bg-[#6366F1] hover:!bg-[#4F46E5] !text-white'
          }`}
        >
          {isTopicGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
              주제를 만들고 있어요...
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 mr-2" />
              이 질문으로 주제 만들기 ✨
            </>
          )}
        </button>
      </div>
    </div>
  )
}
