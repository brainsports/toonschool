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

      
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-[#f4f1ff] rounded-[2rem] border border-purple-200">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <span className="absolute -top-3 -right-3 text-2xl animate-bounce">🤖</span>
          </div>
          <p className="text-sm font-jua text-[#38314f] animate-pulse">
            주제를 고르고 있어요...
          </p>
        </div>
      ) : topics.length === 0 ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
