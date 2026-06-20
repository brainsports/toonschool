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
    <div className="card-glass p-8 md:p-10 mb-8 animate-fade-in text-center">
      <h3 className="text-2xl font-jua text-white mb-2">이야기 키워드를 골라주세요</h3>
      <p className="text-purple-200 text-lg mb-8">학습 내용에 어울리는 키워드를 골라 이야기를 더 재미있게 만들어 보세요.</p>
      
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <span className="absolute -top-3 -right-3 text-2xl animate-bounce">🤖</span>
          </div>
          <p className="text-lg font-jua text-purple-300 animate-pulse">
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
                className={`
                  px-6 py-3 rounded-full font-jua text-lg transition-all duration-200 shadow-sm
                  ${isSelected 
                    ? 'bg-purple-500 text-white border-2 border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105' 
                    : 'bg-white/10 text-slate-200 border-2 border-transparent hover:bg-white/20'
                  }
                `}
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
