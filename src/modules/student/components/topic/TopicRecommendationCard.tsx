import { CheckCircle2 } from 'lucide-react'
import type { TopicRecommendation } from '../../types/studentTopic'

interface TopicRecommendationCardProps {
  topic: TopicRecommendation
  selected: boolean
  onSelect: (id: string) => void
}

const difficultyLabel = (difficulty?: string) => difficulty || '보통'

const getMoodEmoji = (label?: string) => {
  const text = label || ''
  if (text.includes('실험') || text.includes('관찰')) return '🔎'
  if (text.includes('비밀') || text.includes('추적')) return '🧩'
  if (text.includes('비교') || text.includes('대결')) return '⚡'
  if (text.includes('미래') || text.includes('상상')) return '🚀'
  if (text.includes('친구') || text.includes('설명')) return '💬'
  return '✨'
}

export default function TopicRecommendationCard({
  topic,
  selected,
  onSelect,
}: TopicRecommendationCardProps) {
  const safeTitle = topic?.title || '추천 만화 주제'
  const safeDifficulty = difficultyLabel(topic?.difficulty)
  const safeStoryType = topic?.storyTypeLabel || topic?.perspective || topic?.angle || '생활 발견형'
  const safeAngle = topic?.perspective || topic?.angle || safeStoryType
  const safeDesc = topic?.storyHint || topic?.summary || ''
  const safeLearningPoint = topic?.learningPoint || topic?.learningConnection || topic?.summary || ''
  const safeOpeningLine = topic?.openingLine || `"${safeTitle}"에서 이야기가 시작돼요.`
  const safeReason = topic?.connectionReason || ''
  const safeTags = [...new Set([...(topic?.tags || []), ...(topic?.keywords || [])])].slice(0, 6)
  const emoji = getMoodEmoji(`${safeStoryType} ${safeAngle}`)
  const validation = topic?.validation

  return (
    <button
      onClick={() => onSelect(topic.id)}
      className={`
        w-full text-left p-8 bg-white border border-[rgba(111,78,190,0.18)] shadow-sm transition-all duration-200 relative flex flex-col justify-start min-h-[220px] gap-4 rounded-[2rem]
        ${selected ? 'bg-[#f1ebff] border-purple-500 shadow-md scale-[1.02]' : 'hover:bg-[#f1ebff] hover:border-purple-300'}
      `}
    >
      <div className="flex items-start gap-4 w-full">
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 transition-colors
          ${selected ? 'bg-white shadow-sm' : 'bg-slate-50 border border-slate-100'}
        `}>
          <span className={selected ? 'animate-bounce-gentle select-none' : 'select-none'}>{emoji}</span>
        </div>

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
              {safeDifficulty}
            </span>
            <span className="text-sm md:text-base font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 line-clamp-1">
              {safeStoryType}
            </span>
          </div>
        </div>
      </div>

      <div className={`w-full text-left rounded-2xl p-4 mt-1 flex-1 transition-colors flex flex-col gap-3 ${selected ? 'bg-white/60 border border-white' : 'bg-slate-50 border border-slate-100'}`}>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold text-purple-700 px-2 py-1 bg-purple-50 border border-purple-100 rounded-md">{safeAngle}</span>
          {safeTags.map(tag => (
            <span key={tag} className="text-xs font-bold text-[#4B5563] px-2 py-1 bg-white border border-slate-100 rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        <div className="rounded-xl bg-white/80 border border-slate-100 p-3">
          <p className="text-xs font-bold text-[#8f95a6] mb-1">이야기 힌트</p>
          <p className="text-base md:text-lg font-bold text-[#68627d] leading-relaxed break-keep">{safeDesc}</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-xl bg-[#f8f9fa] border border-gray-100 p-3">
            <p className="text-xs font-bold text-[#6366f1] mb-1">배울 내용</p>
            <p className="text-sm font-medium text-[#4b5563] leading-relaxed break-keep">{safeLearningPoint}</p>
          </div>
          <div className="rounded-xl bg-[#fffaf0] border border-amber-100 p-3">
            <p className="text-xs font-bold text-amber-700 mb-1">첫 장면 대사</p>
            <p className="text-sm font-bold text-[#4b5563] leading-relaxed break-keep">{safeOpeningLine}</p>
          </div>
        </div>

        {safeReason && (
          <div className="mt-1 p-3 bg-[#f8f9fa] rounded-xl border border-gray-100">
            <p className="text-sm font-medium text-[#4b5563] leading-relaxed break-keep">
              <span className="font-bold text-[#6366f1] mr-1">연결 이유:</span>
              {safeReason}
            </p>
          </div>
        )}
      </div>

      {validation && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${validation.keywordReflected ? 'text-green-700 bg-green-50 border border-green-200' : 'text-gray-400 bg-gray-50 border border-gray-200'}`}>
            <CheckCircle2 className={`w-3 h-3 ${validation.keywordReflected ? 'text-green-600' : 'text-gray-400'}`} />
            키워드 반영
          </div>
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${validation.grammarChecked ? 'text-green-700 bg-green-50 border border-green-200' : 'text-gray-400 bg-gray-50 border border-gray-200'}`}>
            <CheckCircle2 className={`w-3 h-3 ${validation.grammarChecked ? 'text-green-600' : 'text-gray-400'}`} />
            제목 확인
          </div>
        </div>
      )}
    </button>
  )
}