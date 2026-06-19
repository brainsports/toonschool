// 주제 만들기 페이지 - 태블릿 좌우 배치 & AI 추천 연동
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import TopicStepTitle from '../components/topic/TopicStepTitle'
import StoryInputCard from '../components/topic/StoryInputCard'
import AiMagicButton from '../components/topic/AiMagicButton'
import AiRecommendationCard from '../components/topic/AiRecommendationCard'
import TopicActionButtons from '../components/topic/TopicActionButtons'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation, TopicGenerationState } from '../types/studentTopic'
import { generateTopicRecommendations } from '../services/studentTopicService'

export default function StudentTopicMakerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [extraRequest, setExtraRequest] = useState('')
  const [showAllTopics, setShowAllTopics] = useState(false)
  const [selection, setSelection] = useState<StudentUnitSelection | null>(null)

  // AI 추천 관련 상태
  const [topics, setTopics] = useState<TopicRecommendation[]>([])
  const [genState, setGenState] = useState<TopicGenerationState>('idle')

  // 1. 넘겨받은 실제 단원 선택 정보 가져오기 (location.state 우선, 그다음 localStorage)
  useEffect(() => {
    let currentSelection = location.state?.selection as StudentUnitSelection | undefined
    
    if (!currentSelection) {
      const stored = localStorage.getItem('studentUnitSelection')
      if (stored) {
        try {
          currentSelection = JSON.parse(stored) as StudentUnitSelection
        } catch (e) {
          console.error('Failed to parse stored selection', e)
        }
      }
    }
    
    setSelection(currentSelection || null)
  }, [location.state])

  const canProceed = selectedTopicId !== null

  // 2. AI 추천 실행 함수
  const handleGenerateTopics = async () => {
    if (!selection) return

    setGenState('loading')
    setSelectedTopicId(null)
    setShowAllTopics(false)

    const request = {
      gradeName: selection.gradeName || '',
      subjectName: selection.subjectName || '',
      majorUnitName: selection.majorUnitName || '',
      middleUnitName: selection.middleUnitName || '',
      extraRequest: extraRequest.trim() || undefined
    }

    const generatedTopics = await generateTopicRecommendations(request)
    
    setTopics(generatedTopics)
    setGenState('success')
  }

  // 기본적으로 상단 4개만 보여주고, 더보기 클릭 시 전체(보통 10개) 노출
  const visibleTopics = showAllTopics 
    ? topics 
    : topics.slice(0, 4)

  // 선택한 스토리의 설명 정보 가져오기
  const selectedTopic = topics.find(t => t.id === selectedTopicId)

  // 만화 만들기 클릭 시 이동
  const handleProceedToComic = () => {
    if (!canProceed || !selection || !selectedTopic) return

    // 다음 단계로 넘기기 위해 localStorage에 선택 저장
    const fullSelectionData = {
      selection,
      topic: selectedTopic,
      extraRequest
    }
    localStorage.setItem('studentSelectedTopic', JSON.stringify(fullSelectionData))

    // 컷 생성 화면으로 이동하며 state 전달
    navigate('/student/comic/cut/1', { state: fullSelectionData })
  }

  return (
    <StudentCreationLayout currentStep="topic" bgVariant="space" maxWidth="lg">
      <div className="flex flex-col gap-8 animate-fade-in w-full pb-12 relative">
        
        {/* 헤더 영역 (제목 & 단원 배지) */}
        <TopicStepTitle selection={selection} />

        {/* 데스크탑 좌측 상단 이전 버튼 */}
        <TopicActionButtons
          type="desktop-prev"
          onClick={() => navigate('/student/select-unit')}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 좌측: 주제 목록 영역 & AI 추천 마법 부리기 버튼 */}
          <div className="flex flex-col gap-5">
            <div className="card-glass p-6 md:p-8 flex-1">
              <AiRecommendationCard
                topics={topics}
                visibleTopics={visibleTopics}
                selectedTopicId={selectedTopicId}
                onSelectTopic={setSelectedTopicId}
                genState={genState}
                showAllTopics={showAllTopics}
                onToggleShowAll={() => setShowAllTopics(!showAllTopics)}
              />
            </div>

            <AiMagicButton
              genState={genState}
              disabled={genState === 'loading' || !selection}
              onClick={handleGenerateTopics}
            />
          </div>

          {/* 우측: AI 요청 입력 영역 */}
          <div className="flex flex-col gap-5 h-full">
            <StoryInputCard
              extraRequest={extraRequest}
              onExtraRequestChange={setExtraRequest}
              onFillExample={() => setExtraRequest('우주선 연료가 부족해지는 상황을 재미있게 해결해 주세요!')}
            />
          </div>
        </div>
        
        {/* 우측 상단(데스크탑) 및 하단(모바일) 다음 버튼 */}
        <TopicActionButtons
          type="next"
          disabled={!canProceed || !selection}
          onClick={handleProceedToComic}
        />
        
        {/* 모바일/태블릿 하단 이전 버튼 (lg 미만에서만 표시) */}
        <TopicActionButtons
          type="mobile-prev"
          onClick={() => navigate('/student/select-unit')}
        />

      </div>
    </StudentCreationLayout>
  )
}
