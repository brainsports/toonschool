// 주제 추천 카드 컴포넌트 (개별)
import type { TopicRecommendation } from '../../types/studentTopic'

interface TopicRecommendationCardProps {
  topic: TopicRecommendation
  selected: boolean
  onSelect: (id: string) => void
}

const difficultyStars: Record<'쉬움' | '보통' | '도전', string> = {
  '쉬움': '⭐',
  '보통': '⭐⭐',
  '도전': '⭐⭐⭐',
}

const getMoodEmoji = (mood?: string) => {
  const safeMood = mood || ''
  if (safeMood.includes('모험')) return '🚀'
  if (safeMood.includes('탐험')) return '🧭'
  if (safeMood.includes('미스터리') || safeMood.includes('비밀') || safeMood.includes('사건')) return '🔍'
  if (safeMood.includes('신비')) return '✨'
  if (safeMood.includes('대결') || safeMood.includes('기사')) return '⚔️'
  if (safeMood.includes('우주')) return '🛸'
  if (safeMood.includes('요리')) return '🍕'
  return '📚'
}

export default function TopicRecommendationCard({
  topic,
  selected,
  onSelect,
}: TopicRecommendationCardProps) {
  const safeTitle = topic?.title || '추천 이야기'
  const safeDifficulty = topic?.difficulty || '보통'
  const safeStoryType = topic?.storyTypeLabel || '일상 이야기'
  const safeDesc = topic?.summary || ''
  const emoji = getMoodEmoji(safeStoryType)

  return (
    <button
      onClick={() => onSelect(topic.id)}
      className={`
        w-full text-left p-8 bg-white border border-[rgba(111,78,190,0.18)] shadow-sm transition-all duration-200 relative flex flex-col justify-start min-h-[220px] gap-4 rounded-[2rem]
        ${selected ? 'bg-[#f1ebff] border-purple-500 shadow-md scale-[1.02]' : 'hover:bg-[#f1ebff] hover:border-purple-300'}
      `}
    >
      <div className="flex items-start gap-4 w-full">
        {/* 이모지 */}
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 transition-colors
          ${selected ? 'bg-white shadow-sm' : 'bg-slate-50 border border-slate-100'}
        `}>
          <span className={selected ? 'animate-bounce-gentle select-none' : 'select-none'}>{emoji}</span>
        </div>

        {/* 메인 내용 (제목 & 난이도 & 분위기) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-jua text-2xl md:text-3xl line-clamp-2 leading-tight break-keep ${selected ? 'text-purple-900 drop-shadow-sm' : 'text-[#25213b]'}`}>
              {safeTitle}
            </p>
            {selected && (
              <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-base font-black shrink-0 animate-pulse shadow-sm">
                ✓
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-2 mt-3">
            <span className="text-sm md:text-base font-bold text-[#68627d] bg-[#f4f1ff] px-3 py-1 rounded-lg border border-purple-100 whitespace-nowrap">
              {difficultyStars[safeDifficulty as '쉬움' | '보통' | '도전'] || '⭐⭐'} {safeDifficulty}
            </span>
            <span className="text-sm md:text-base font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 line-clamp-1">
              {safeStoryType}
            </span>
          </div>
        </div>
      </div>
      
      {/* 상세 설명 */}
      <div className={`w-full text-left rounded-2xl p-4 mt-1 flex-1 transition-colors ${selected ? 'bg-white/60 border border-white' : 'bg-slate-50 border border-slate-100'}`}>
        <p className="text-base md:text-lg font-bold text-[#68627d] leading-relaxed break-keep line-clamp-3">
          {safeDesc}
        </p>
      </div>
    </button>
  )
}
