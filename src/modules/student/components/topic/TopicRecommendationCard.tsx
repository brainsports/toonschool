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

const getMoodEmoji = (mood: string) => {
  if (mood.includes('모험')) return '🚀'
  if (mood.includes('탐험')) return '🧭'
  if (mood.includes('미스터리') || mood.includes('비밀') || mood.includes('사건')) return '🔍'
  if (mood.includes('신비')) return '✨'
  if (mood.includes('대결') || mood.includes('기사')) return '⚔️'
  if (mood.includes('우주')) return '🛸'
  if (mood.includes('요리')) return '🍕'
  return '📚'
}

export default function TopicRecommendationCard({
  topic,
  selected,
  onSelect,
}: TopicRecommendationCardProps) {
  const emoji = getMoodEmoji(topic.storyMood)

  return (
    <button
      onClick={() => onSelect(topic.id)}
      className={`
        w-full text-left p-4 card-glass card-glass-interactive transition-all duration-200 relative flex flex-col gap-3
        ${selected ? 'card-glass-active scale-[1.02]' : 'border-transparent hover:border-white/20'}
      `}
    >
      <div className="flex items-center gap-4">
        {/* 이모지 */}
        <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-colors
          ${selected ? 'bg-purple-500/30 shadow-inner' : 'bg-white/5'}
        `}>
          <span className={selected ? 'animate-bounce-gentle select-none' : 'select-none'}>{emoji}</span>
        </div>

        {/* 메인 내용 (제목 & 난이도 & 분위기) */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`font-jua text-lg truncate ${selected ? 'text-white drop-shadow-md' : 'text-slate-200'}`}>
              {topic.title}
            </p>
            {selected && (
              <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-black shrink-0 animate-pulse shadow-sm">
                ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-2 py-1 rounded-lg border border-white/10">
              {difficultyStars[topic.difficulty]} {topic.difficulty}
            </span>
            <span className="text-[11px] font-bold text-purple-200 bg-purple-500/20 px-2 py-1 rounded-lg border border-purple-500/30 truncate max-w-[80px]">
              {topic.storyMood}
            </span>
          </div>
        </div>
      </div>
      
      {/* 상세 설명 (선택되었거나 기본적으로 노출) */}
      <div className={`w-full text-left rounded-2xl p-3 mt-1 space-y-2 transition-colors ${selected ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/10'}`}>
        <p className="text-xs font-bold text-slate-300 leading-relaxed">
          {topic.shortDescription}
        </p>
        <p className="text-[11px] font-bold text-purple-200 leading-snug break-keep flex items-start gap-1.5 bg-purple-500/20 p-2 rounded-xl">
          <span className="shrink-0 mt-0.5">💡</span>
          <span>{topic.learningPoint}</span>
        </p>
      </div>
    </button>
  )
}
