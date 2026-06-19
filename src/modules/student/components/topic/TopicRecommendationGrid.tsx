// 주제 추천 그리드 (10개 카드 나열)
import type { TopicRecommendation } from '../../types/studentTopic'
import TopicRecommendationCard from './TopicRecommendationCard'
import { Loader2 } from 'lucide-react'

interface TopicRecommendationGridProps {
  topics: TopicRecommendation[]
  selectedTopicId: string | null
  onSelectTopic: (id: string) => void
  isLoading?: boolean
}

export default function TopicRecommendationGrid({
  topics,
  selectedTopicId,
  onSelectTopic,
  isLoading = false,
}: TopicRecommendationGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 select-none px-2">
        <span className="text-2xl animate-float">🤖</span>
        <h3 className="text-lg font-jua text-purple-200">AI 추천 이야기 목록</h3>
      </div>
      
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-white/5 rounded-[2rem] border border-white/10">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <span className="absolute -top-3 -right-3 text-2xl animate-bounce">🤖</span>
          </div>
          <p className="text-sm font-jua text-purple-300 animate-pulse">
            주제를 고르고 있어요...
          </p>
        </div>
      ) : topics.length === 0 ? (
        <div className="py-8 text-center bg-white/5 rounded-2xl border border-white/10">
          <p className="text-sm font-bold text-slate-300 leading-relaxed">
            아직 추천된 이야기가 없어요.<br/>왼쪽에서 "AI 추천 마법 부리기" 버튼을 눌러주세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {topics.map((topic) => (
            <TopicRecommendationCard
              key={topic.id}
              topic={topic}
              selected={selectedTopicId === topic.id}
              onSelect={onSelectTopic}
            />
          ))}
        </div>
      )}
    </div>
  )
}
