import TopicRecommendationGrid from './TopicRecommendationGrid'
import type { TopicRecommendation, TopicGenerationState } from '../../types/studentTopic'

interface AiRecommendationCardProps {
  topics: TopicRecommendation[]
  visibleTopics: TopicRecommendation[]
  selectedTopicId: string | null
  onSelectTopic: (id: string | null) => void
  genState: TopicGenerationState
  showAllTopics: boolean
  onToggleShowAll: () => void
}

export default function AiRecommendationCard({
  topics,
  visibleTopics,
  selectedTopicId,
  onSelectTopic,
  genState,
  showAllTopics,
  onToggleShowAll
}: AiRecommendationCardProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* 왼쪽: 추천 이야기 목록 영역 */}
      <div className="flex-1 w-full">
        <TopicRecommendationGrid
          topics={visibleTopics}
          selectedTopicId={selectedTopicId}
          onSelectTopic={onSelectTopic}
          isLoading={genState === 'loading'}
        />

        {topics.length > 4 && (
          <div className="text-center pt-6">
            <button
              type="button"
              onClick={onToggleShowAll}
              className="card-glass card-glass-interactive px-8 py-3 text-purple-200 font-jua text-sm"
            >
              {showAllTopics ? '▲ 숨기기' : `➕ ${topics.length - 4}개의 추천 주제 더 보기`}
            </button>
          </div>
        )}
      </div>


    </div>
  )
}
