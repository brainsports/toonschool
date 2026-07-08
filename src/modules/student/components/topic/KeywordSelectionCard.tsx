import { Loader2, Wand2 } from 'lucide-react'
import type { KeywordItem } from '../../types/studentTopic'

interface KeywordSelectionCardProps {
  keywords: KeywordItem[]
  selectedKeywords: string[]
  onToggleKeyword: (word: string) => void
  isLoading: boolean
  onGenerateKeywords?: () => void
  totalKeywords?: number
}

export default function KeywordSelectionCard({
  keywords,
  selectedKeywords,
  onToggleKeyword,
  isLoading,
  onGenerateKeywords,
  totalKeywords
}: KeywordSelectionCardProps) {
  return (
    <div className="card-select-panel p-8 md:p-10 mb-8 animate-fade-in text-center">
      <h3 className="text-2xl font-jua text-[#202330] mb-2">이야기 키워드를 골라주세요</h3>
      <p className="text-[#626776] text-lg mb-8">학습 내용에 어울리는 키워드를 골라 이야기를 더 재미있게 만들어 보세요.</p>
      
      {keywords.length === 0 && isLoading ? (
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
        <div className="flex flex-col items-center w-full">
          {keywords.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto mb-8">
              {keywords.map((kw, i) => {
                const isSelected = selectedKeywords.includes(kw.word)
                return (
                  <button
                    key={`${kw.word}-${i}`}
                    onClick={() => onToggleKeyword(kw.word)}
                    title={kw.reason}
                    className={`btn-select-item px-6 py-3 shadow-sm flex items-center justify-center ${
                      isSelected 
                        ? 'btn-select-item-active !bg-[#EDE7FF] !text-[#403584] !border-[#B8A8FF] hover:!bg-[#E3DAFF] shadow-md scale-105' 
                        : ''
                    }`}
                  >
                    <span>{kw.word}</span>
                    {isSelected && (
                      <span 
                        className="ml-2 text-[13px] text-[#6B5BBF] hover:text-[#403584] font-bold px-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleKeyword(kw.word)
                        }}
                      >
                        ✕
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {(keywords.length === 0 || keywords.length < (totalKeywords ?? 10)) && onGenerateKeywords && (
            <button
              onClick={onGenerateKeywords}
              disabled={isLoading}
              className="btn-primary-action flex items-center justify-center w-full max-w-[320px] min-w-[260px] mx-auto py-3 md:py-4 text-xl font-jua shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Wand2 className={`w-6 h-6 mr-3 stroke-[3] ${isLoading ? 'animate-spin' : 'animate-bounce-gentle'}`} />
              <span>
                {isLoading 
                  ? '키워드 만드는 중...' 
                  : keywords.length === 0 
                    ? '키워드 추천 ✨' 
                    : '키워드 2개 더 보기 ✨'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
