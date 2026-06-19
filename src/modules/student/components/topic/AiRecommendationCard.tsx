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

      {/* 오른쪽: 추가 행동 및 보조 안내 영역 */}
      <div className="w-full lg:w-[160px] xl:w-[180px] shrink-0 flex flex-col gap-3">
        <div className="bg-purple-500/20 border border-purple-400/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
          <span className="text-2xl mb-2 animate-bounce-gentle">✨</span>
          <span className="text-sm font-bold text-purple-100 font-jua leading-relaxed">
            마음에 드는<br/>스토리를<br/>골라주세요
          </span>
        </div>
      </div>
    </div>
  )
}
