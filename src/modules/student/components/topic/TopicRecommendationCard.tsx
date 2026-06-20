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
  const safeDifficulty = topic?.difficulty || '쉬움'
  const safeMood = topic?.storyMood || '모험'
  const safeDesc = topic?.shortDescription || ''
  const emoji = getMoodEmoji(safeMood)

  return (
    <button
      onClick={() => onSelect(topic.id)}
      className={`
        w-full text-left p-8 card-glass card-glass-interactive transition-all duration-200 relative flex flex-col justify-center min-h-[220px] gap-4
        ${selected ? 'card-glass-active scale-[1.02] border-purple-400' : 'border-transparent hover:border-white/20'}
      `}
    >
      <div className="flex items-center gap-4">
        {/* 이모지 */}
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 transition-colors
          ${selected ? 'bg-purple-500/30 shadow-inner' : 'bg-white/5'}
        `}>
          <span className={selected ? 'animate-bounce-gentle select-none' : 'select-none'}>{emoji}</span>
        </div>

        {/* 메인 내용 (제목 & 난이도 & 분위기) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-jua text-2xl md:text-3xl truncate ${selected ? 'text-white drop-shadow-md' : 'text-slate-200'}`}>
              {safeTitle}
            </p>
            {selected && (
              <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-base font-black shrink-0 animate-pulse shadow-sm">
                ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm md:text-base font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
              {difficultyStars[safeDifficulty as '쉬움' | '보통' | '도전'] || '⭐'} {safeDifficulty}
            </span>
            <span className="text-sm md:text-base font-bold text-purple-200 bg-purple-500/20 px-3 py-1 rounded-lg border border-purple-500/30 truncate max-w-[120px]">
              {safeMood}
            </span>
          </div>
        </div>
      </div>
      
      {/* 상세 설명 */}
      <div className={`w-full text-left rounded-2xl p-4 mt-2 transition-colors ${selected ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/10'}`}>
        <p className="text-base md:text-lg font-bold text-slate-300 leading-relaxed break-keep">
          {safeDesc}
        </p>
      </div>
    </button>
  )
}
