import { Loader2 } from 'lucide-react'
import type { KeywordItem } from '../../types/studentTopic'

interface KeywordSelectionCardProps {
  keywords: KeywordItem[]
  selectedKeywords: string[]
  onToggleKeyword: (word: string) => void
  isLoading: boolean
}

export default function KeywordSelectionCard({
  keywords,
  selectedKeywords,
  onToggleKeyword,
  isLoading
}: KeywordSelectionCardProps) {
  return (
    <div className="card-select-panel p-8 md:p-10 mb-8 animate-fade-in text-center">
      <h3 className="text-2xl font-jua text-[#202330] mb-2">이야기 키워드를 골라주세요</h3>
      <p className="text-[#626776] text-lg mb-8">학습 내용에 어울리는 키워드를 골라 이야기를 더 재미있게 만들어 보세요.</p>
      
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <span className="absolute -top-3 -right-3 text-2xl animate-bounce">🤖</span>
          </div>
          <p className="text-lg font-jua text-[#303442] animate-pulse">
            학습 내용에 어울리는 키워드를 찾고 있어요...
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
          {keywords.map((kw, i) => {
            const isSelected = selectedKeywords.includes(kw.word)
            return (
              <button
                key={`${kw.word}-${i}`}
                onClick={() => onToggleKeyword(kw.word)}
                title={kw.reason}
                className={`btn-select-item px-6 py-3 shadow-sm ${isSelected ? 'btn-select-item-active shadow-md scale-105' : ''}`}
              >
                {kw.word}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
