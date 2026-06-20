import TopicRecommendationGrid from './TopicRecommendationGrid'
import type { TopicRecommendation, TopicGenerationState } from '../../types/studentTopic'

interface AiRecommendationCardProps {
  visibleTopics: TopicRecommendation[]
  selectedTopicId: string | null
  onSelectTopic: (id: string | null) => void
  genState: TopicGenerationState
  visibleCount: number
  totalCount: number
  onLoadMore: () => void
}

export default function AiRecommendationCard({
  visibleTopics,
  selectedTopicId,
  onSelectTopic,
  genState,
  visibleCount,
  totalCount,
  onLoadMore
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

        {visibleCount < totalCount && (
          <div className="text-center pt-8">
            <button
              type="button"
              onClick={onLoadMore}
              className="card-glass card-glass-interactive px-8 py-4 text-purple-200 font-jua text-base md:text-lg min-h-[56px] rounded-full inline-flex items-center justify-center"
            >
              <span>+ 2개 더 보기</span>
            </button>
          </div>
        )}
      </div>


    </div>
  )
}
