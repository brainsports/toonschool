import TopicRecommendationGrid from './TopicRecommendationGrid'
import type { TopicRecommendation, TopicGenerationState } from '../../types/studentTopic'

interface AiRecommendationCardProps {
  visibleTopics: TopicRecommendation[]
  selectedTopicId: string | null
  onSelectTopic: (id: string | null) => void
  genState: TopicGenerationState
  isGeneratingMore: boolean
  totalCount: number
  onLoadMore: () => void
}

export default function AiRecommendationCard({
  visibleTopics,
  selectedTopicId,
  onSelectTopic,
  genState,
  isGeneratingMore,
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

        {totalCount > 0 && totalCount < 6 && (
          <div className="text-center pt-8">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isGeneratingMore}
              className={`btn-primary-action px-8 py-4 font-jua text-base md:text-lg min-h-[56px] transition-all ${isGeneratingMore ? 'opacity-70 cursor-not-allowed bg-[#e5e7eb] text-[#8f95a6]' : ''}`}
            >
              <span>{isGeneratingMore ? '새로운 주제 2개를 만들고 있어요...' : '추천 주제 2개 더 만들기 ✨'}</span>
            </button>
          </div>
        )}
        {totalCount >= 6 && (
          <div className="text-center pt-8">
            <p className="text-[#626776] font-jua text-lg">추천 주제 6개를 모두 만들었어요</p>
          </div>
        )}
      </div>


    </div>
  )
}
