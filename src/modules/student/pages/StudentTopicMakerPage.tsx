// 주제 만들기 페이지 - 태블릿 좌우 배치 & AI 추천 연동
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import TopicStepTitle from '../components/topic/TopicStepTitle'
import StoryInputCard from '../components/topic/StoryInputCard'
import AiMagicButton from '../components/topic/AiMagicButton'
import AiRecommendationCard from '../components/topic/AiRecommendationCard'
import TopicActionButtons from '../components/topic/TopicActionButtons'
import KeywordSelectionCard from '../components/topic/KeywordSelectionCard'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation, TopicGenerationState, KeywordItem } from '../types/studentTopic'
import { generateTopicRecommendations, generateKeywords } from '../services/studentTopicService'
import { Sparkles, PenTool, ArrowLeft } from 'lucide-react'
import { projectStorage } from '../utils/projectStorage'
import { showToast } from '../utils/toast'

export default function StudentTopicMakerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [creationMode, setCreationMode] = useState<'select' | 'ai' | 'manual'>('select')
  const [projectId] = useState<string>(location.state?.projectId || '')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [extraRequest, setExtraRequest] = useState('')
  const [selection, setSelection] = useState<StudentUnitSelection | null>(null)

  const MAX_RECOMMENDATIONS = 6
  const RECOMMENDATIONS_PER_REQUEST = 2

  const [topics, setTopics] = useState<TopicRecommendation[]>([])
  const [genState, setGenState] = useState<TopicGenerationState>('idle')
  const [isGeneratingMore, setIsGeneratingMore] = useState(false)

  // 키워드 추천 관련 상태
  const [recommendedKeywords, setRecommendedKeywords] = useState<KeywordItem[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [isKeywordLoading, setIsKeywordLoading] = useState(false)

  // 1. 단원 선택 정보 가져오기 (projectStorage 우선, 그다음 location.state, 마지막 localStorage)
  useEffect(() => {
    let currentSelection: StudentUnitSelection | null = null;
    
    if (projectId) {
      const storedUnit = projectStorage.loadUnit<StudentUnitSelection>(projectId);
      if (storedUnit) {
        currentSelection = storedUnit;
      }
    }

    if (!currentSelection && location.state?.selection) {
      currentSelection = location.state.selection as StudentUnitSelection;
    }
    
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
  }, [location.state, projectId])

  // 이전 단계 데이터 복원
  useEffect(() => {
    if (projectId && topics.length === 0) {
      const savedTopicData = projectStorage.loadTopic<any>(projectId);
      if (savedTopicData) {
        if (savedTopicData.extraRequest) setExtraRequest(savedTopicData.extraRequest);
        if (savedTopicData.selectedKeywords) setSelectedKeywords(savedTopicData.selectedKeywords);
        if (savedTopicData.topic) {
          setTopics([savedTopicData.topic]);
          setSelectedTopicId(savedTopicData.topic.id);
          setCreationMode('ai');
          setGenState('success');
        }
      }
    }
  }, [projectId]);

  const canProceed = selectedTopicId !== null

  // 키워드 자동 추천 효과
  useEffect(() => {
    if (creationMode === 'ai' && recommendedKeywords.length === 0 && selection && !isKeywordLoading) {
      const fetchKeywords = async () => {
        setIsKeywordLoading(true)
        const request = {
          gradeName: selection.gradeName || '',
          subjectName: selection.subjectName || '',
          majorUnitName: selection.majorUnitName || '',
          middleUnitName: selection.middleUnitName || ''
        }
        const keywords = await generateKeywords(request)
        setRecommendedKeywords(keywords)
        setIsKeywordLoading(false)
      }
      fetchKeywords()
    }
  }, [creationMode, selection, recommendedKeywords.length, isKeywordLoading])

  const handleToggleKeyword = (word: string) => {
    if (selectedKeywords.includes(word)) {
      setSelectedKeywords(prev => prev.filter(k => k !== word))
    } else {
      if (selectedKeywords.length >= 4) {
        alert('키워드는 최대 4개까지 고를 수 있어요.')
        return
      }
      setSelectedKeywords(prev => [...prev, word])
    }
  }

  // 2. AI 추천 실행 함수
  const handleGenerateTopics = async (isLoadMore = false) => {
    if (!selection) return
    if (isGeneratingMore || genState === 'loading') return

    if (!isLoadMore && topics.length > 0) {
      if (!window.confirm('현재 추천 주제가 새로운 이야기로 바뀝니다. 다시 받을까요?')) {
        return
      }
    }

    if (isLoadMore && topics.length >= MAX_RECOMMENDATIONS) {
      return
    }

    const previousTitles = topics.map(t => t.title)
    const previousIncidents = topics.map(t => t.incident).filter(Boolean)
    const previousTypes = topics.map(t => t.storyType).filter(Boolean)

    if (isLoadMore) {
      setIsGeneratingMore(true)
    } else {
      setGenState('loading')
    }

    const request = {
      gradeName: selection.gradeName || '',
      subjectName: selection.subjectName || '',
      majorUnitName: selection.majorUnitName || '',
      middleUnitName: selection.middleUnitName || '',
      extraRequest: extraRequest.trim() || undefined,
      selectedKeywords,
      learningTopicId: selection.middleUnitId || null,
      previousTitles,
      previousIncidents,
      previousTypes,
      count: RECOMMENDATIONS_PER_REQUEST
    }

    try {
      const generatedTopics = await generateTopicRecommendations(request)
      
      if (isLoadMore) {
        setTopics(prev => [...prev, ...generatedTopics])
      } else {
        setTopics(generatedTopics)
        setSelectedTopicId(null)
      }
      setGenState('success')
    } catch (error) {
      console.error('AI 추천 주제 생성 중 오류 발생:', error)
      alert(isLoadMore ? '새로운 추천 주제를 만들지 못했습니다. 다시 시도해 주세요.' : '추천 주제를 만들지 못했습니다. 다시 시도해 주세요.')
      if (!isLoadMore && topics.length === 0) {
        setGenState('idle')
      }
    } finally {
      if (isLoadMore) {
        setIsGeneratingMore(false)
      }
    }
  }



  // 선택한 스토리의 설명 정보 가져오기
  const selectedTopic = topics.find(t => t.id === selectedTopicId)

  // 만화 만들기 클릭 시 이동
  const handleProceedToComic = () => {
    if (!canProceed || !selection || !selectedTopic) return

    const fullSelectionData = {
      selection,
      topic: selectedTopic,
      extraRequest,
      selectedKeywords
    }

    const success = projectStorage.saveTopic(projectId, fullSelectionData)
    if (!success) {
      alert('저장에 실패했습니다. 저장 공간을 확인해 주세요.')
      return
    }

    showToast('저장되었습니다')

    // 다음 단계로 넘기기 위해 기존 localStorage 에도 저장 (호환성)
    localStorage.setItem('studentSelectedTopic', JSON.stringify(fullSelectionData))

    // 대본 생성 화면으로 이동하며 state 전달
    navigate('/student/script', { state: { ...fullSelectionData, projectId } })
  }

  return (
    <StudentCreationLayout currentStep="topic" bgVariant="pastel" maxWidth="full">
      <div className="flex-1 w-full h-full overflow-y-auto pr-4 lg:pr-8">
        <div className="flex flex-col gap-8 animate-fade-in w-full pt-[40px] md:pt-[56px] px-4 max-w-5xl mx-auto pb-[48px] relative">
          
          {/* 헤더 영역 (제목 & 단원 배지) */}
        <TopicStepTitle selection={selection} />

        {/* 데스크탑 좌측 상단 이전 버튼 */}
        <TopicActionButtons
          type="desktop-prev"
          onClick={() => navigate('/student/select-unit', { state: { projectId } })}
        />

        {creationMode === 'select' && (
          <div className="animate-fade-in">

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-4 max-w-[1200px] mx-auto w-full">
              <button
                onClick={() => {
                  setCreationMode('ai')
                  setExtraRequest('')
                }}
                className="card-select-panel p-8 flex flex-col items-center justify-between hover:scale-[1.02] transition-transform text-center h-[22rem] group"
              >
                <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center group-hover:bg-purple-500/20 transition-colors shrink-0">
                  <Sparkles className="w-12 h-12 text-purple-500" />
                </div>
                <div className="text-center">
                  <h3 className="font-jua text-3xl md:text-4xl font-bold text-[#25213b] leading-tight">AI 추천으로 시작하기</h3>
                </div>
                <div className="btn-primary-action px-8 py-3 font-jua text-xl w-full max-w-[200px] text-center shrink-0 shadow-md">
                  AI 추천 받기
                </div>
              </button>

              <button
                onClick={() => {
                  setCreationMode('manual')
                  setExtraRequest('')
                }}
                className="card-select-panel p-8 flex flex-col items-center justify-between hover:scale-[1.02] transition-transform text-center h-[22rem] group"
              >
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:bg-blue-500/20 transition-colors shrink-0">
                  <PenTool className="w-12 h-12 text-blue-500" />
                </div>
                <div className="text-center">
                  <h3 className="font-jua text-3xl md:text-4xl font-bold text-[#25213b] leading-tight">내가 직접 만들기</h3>
                </div>
                <div className="btn-primary-action px-8 py-3 font-jua text-xl w-full max-w-[200px] text-center shrink-0 shadow-md transition-all">
                  직접 입력하기
                </div>
              </button>
            </div>
          </div>
        )}

        {creationMode !== 'select' && (
          <div className="animate-fade-in w-full max-w-[1200px] mx-auto flex flex-col gap-6">
            <div className="flex justify-start mb-2">
              <button
                onClick={() => {
                  setCreationMode('select')
                  setTopics([])
                  setGenState('idle')
                  setSelectedTopicId(null)
                  setExtraRequest('')
                }}
                className="btn-primary-action flex items-center font-jua text-lg px-6 py-2.5 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 mr-2 stroke-[3]" />
                방법 다시 선택하기
              </button>
            </div>

            {creationMode === 'ai' && (
              <div className="flex flex-col gap-5">

                <KeywordSelectionCard
                  keywords={recommendedKeywords}
                  selectedKeywords={selectedKeywords}
                  onToggleKeyword={handleToggleKeyword}
                  isLoading={isKeywordLoading}
                />

                {(genState === 'loading' || genState === 'success') && (
                  <div className="card-select-panel p-8 md:p-10 min-h-[240px] animate-fade-in">
                    <AiRecommendationCard
                      visibleTopics={topics}
                      selectedTopicId={selectedTopicId}
                      onSelectTopic={setSelectedTopicId}
                      genState={genState}
                      isGeneratingMore={isGeneratingMore}
                      totalCount={topics.length}
                      onLoadMore={() => handleGenerateTopics(true)}
                    />
                  </div>
                )}

                <AiMagicButton
                  genState={genState}
                  disabled={genState === 'loading' || isGeneratingMore || !selection || selectedKeywords.length < 2}
                  onClick={() => handleGenerateTopics(false)}
                />
              </div>
            )}

            {creationMode === 'manual' && (
              <div className="flex flex-col gap-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-jua text-[#202330] mb-2">내가 직접 만들래요</h2>
                  <p className="text-[#626776] text-lg">이야기에 넣고 싶은 내용을 적어 주세요.</p>
                </div>

                <StoryInputCard
                  extraRequest={extraRequest}
                  onExtraRequestChange={setExtraRequest}
                  onFillExample={() => handleGenerateTopics(false)}
                  disabled={genState === 'loading' || isGeneratingMore}
                  loading={genState === 'loading'}
                />
                
                {/* AI 추천 결과 목록 (로딩 중이거나 결과가 있을 때) */}
                {(genState === 'loading' || genState === 'success') && (
                  <div className="card-select-panel p-8 md:p-10 min-h-[240px] mt-4 animate-fade-in">
                    {genState === 'success' && (
                      <h3 className="text-xl font-jua text-[#303442] mb-6 flex items-center">
                        <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
                        입력한 내용으로 만들어진 이야기예요! 하나를 선택해주세요.
                      </h3>
                    )}
                    <AiRecommendationCard
                      visibleTopics={topics}
                      selectedTopicId={selectedTopicId}
                      onSelectTopic={setSelectedTopicId}
                      genState={genState}
                      isGeneratingMore={isGeneratingMore}
                      totalCount={topics.length}
                      onLoadMore={() => handleGenerateTopics(true)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* 우측 상단(데스크탑) 및 하단(모바일) 다음 버튼 */}
        <TopicActionButtons
          type="next"
          disabled={!canProceed || !selection}
          onClick={handleProceedToComic}
        />
        
        {/* 모바일/태블릿 하단 이전 버튼 (lg 미만에서만 표시) */}
        <TopicActionButtons
          type="mobile-prev"
          onClick={() => navigate('/student/select-unit', { state: { projectId } })}
        />

      </div>
      </div>
    </StudentCreationLayout>
  )
}
