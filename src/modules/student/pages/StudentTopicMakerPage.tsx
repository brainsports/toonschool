// 주제 만들기 페이지 - 태블릿 좌우 배치 & AI 추천 연동
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
import TopicStepTitle from '../components/topic/TopicStepTitle'
import StoryInputCard from '../components/topic/StoryInputCard'
import AiRecommendationCard from '../components/topic/AiRecommendationCard'

import KeywordSelectionCard from '../components/topic/KeywordSelectionCard'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation, TopicGenerationState, KeywordItem, CurriculumContext } from '../types/studentTopic'
import { generateTopicRecommendations, generateKeywords, fetchCurriculumContext } from '../services/studentTopicService'
import { Sparkles, PenTool, ArrowLeft, Wand2 } from 'lucide-react'
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

  const MAX_RECOMMENDED_TOPICS = 10
  const TOPICS_PER_GENERATION = 2

  const [topics, setTopics] = useState<TopicRecommendation[]>([])
  const [genState, setGenState] = useState<TopicGenerationState>('idle')
  const [isGeneratingMore, setIsGeneratingMore] = useState(false)
  const [curriculumContext, setCurriculumContext] = useState<CurriculumContext | undefined>()

  // 키워드 추천 관련 상태
  const [recommendedKeywords, setRecommendedKeywords] = useState<KeywordItem[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [isKeywordLoading, setIsKeywordLoading] = useState(false)

  const isMaxTopicsReached = topics.length >= MAX_RECOMMENDED_TOPICS;

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

  // 1-1. 단원 정보로 교과 컨텍스트 가져오기
  useEffect(() => {
    if (selection) {
      fetchCurriculumContext(selection.majorUnitId, selection.middleUnitId)
        .then(ctx => setCurriculumContext(ctx))
        .catch(console.error)
    }
  }, [selection])

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

  // 처음 AI 모드 진입 시 자동 키워드 생성
  useEffect(() => {
    if (creationMode === 'ai' && selection && recommendedKeywords.length === 0 && !isKeywordLoading) {
      handleGenerateKeywords()
    }
  }, [creationMode, selection])

  // 키워드 직접 생성 (수동)
  const handleGenerateKeywords = async () => {
    if (!selection) return
    setIsKeywordLoading(true)
    const request = {
      gradeName: selection.gradeName || '',
      subjectName: selection.subjectName || '',
      majorUnitName: selection.majorUnitName || '',
      middleUnitName: selection.middleUnitName || '',
      existingKeywords: recommendedKeywords.map(k => k.word),
      count: 2,
      curriculumContext
    }
    try {
      const keywords = await generateKeywords(request)
      
      setRecommendedKeywords(prev => {
        // 중복 제거 및 최대 10개 유지
        const combined = [...prev, ...keywords]
        const unique = combined.filter((kw, index, self) => 
          index === self.findIndex(t => t.word === kw.word)
        )
        return unique.slice(0, 10)
      })
    } catch (error) {
      console.error('키워드 생성 실패:', error)
    } finally {
      setIsKeywordLoading(false)
    }
  }

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

  // 2. AI 추천 실행 함수 (추가 생성)
  const handleGenerateMoreTopics = async () => {
    if (!selection) return
    if (isGeneratingMore || genState === 'loading') return
    if (isMaxTopicsReached) return

    const previousTitles = topics.map(t => t.title)
    const previousIncidents = topics.map(t => t.incident).filter(Boolean)
    const previousTypes = topics.map(t => t.storyType).filter(Boolean)

    setIsGeneratingMore(true)

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
      count: TOPICS_PER_GENERATION,
      curriculumContext
    }

    try {
      const generatedTopics = await generateTopicRecommendations(request)
      setTopics(prev => {
        const combined = [...prev, ...generatedTopics]
        return combined.slice(0, MAX_RECOMMENDED_TOPICS)
      })
    } catch (error) {
      console.error('AI 추천 주제 추가 생성 중 오류 발생:', error)
      alert('새로운 추천 주제를 만들지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setIsGeneratingMore(false)
    }
  }

  // 2-1. AI 추천 실행 함수 (다시 받기 / 초기 생성)
  const handleRegenerateTopics = async () => {
    if (!selection) return
    if (isGeneratingMore || genState === 'loading') return
    if (isMaxTopicsReached) return

    if (topics.length > 0) {
      if (!window.confirm('현재 추천 주제가 새로운 이야기로 바뀝니다. 다시 받을까요?')) {
        return
      }
    }

    setTopics([])
    setSelectedTopicId(null)
    setGenState('loading')

    const request = {
      gradeName: selection.gradeName || '',
      subjectName: selection.subjectName || '',
      majorUnitName: selection.majorUnitName || '',
      middleUnitName: selection.middleUnitName || '',
      extraRequest: extraRequest.trim() || undefined,
      selectedKeywords,
      learningTopicId: selection.middleUnitId || null,
      previousTitles: [],
      previousIncidents: [],
      previousTypes: [],
      count: TOPICS_PER_GENERATION,
      curriculumContext
    }

    try {
      const generatedTopics = await generateTopicRecommendations(request)
      setTopics(generatedTopics)
      setGenState('success')
    } catch (error) {
      console.error('AI 추천 주제 생성 중 오류 발생:', error)
      alert('추천 주제를 만들지 못했습니다. 다시 시도해 주세요.')
      setGenState('idle')
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

  const actionButtons = (
    <button
      disabled={!canProceed || !selection}
      onClick={handleProceedToComic}
      className="btn-student btn-student-primary btn-student-md"
    >
      <span>대본 만들기 🚀</span>
    </button>
  )

  return (
    <StudentWorkspaceLayout 
      currentStep="topic" 
      bgVariant="pastel"
      title="주제 만들기"
      subtitle="어떤 이야기를 만들까요?"
      onBack={() => navigate('/student/select-unit', { state: { projectId } })}
      actionButtons={actionButtons}
    >
      <div className="flex-1 w-full h-full overflow-y-auto student-scrollbar">
        <div className="flex flex-col gap-8 animate-fade-in w-full pt-8 px-4 max-w-[1200px] mx-auto pb-12 relative">
          
          {/* 단원 정보 배지 */}
        <TopicStepTitle selection={selection} />

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
                className="flex items-center justify-center font-jua text-lg px-6 py-2.5 shadow-sm rounded-full bg-[#4B5563] hover:bg-[#374151] text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2 stroke-[3]" />
                이전
              </button>
            </div>

            {creationMode === 'ai' && (
              <div className="flex flex-col gap-5">

                <KeywordSelectionCard
                  keywords={recommendedKeywords}
                  selectedKeywords={selectedKeywords}
                  onToggleKeyword={handleToggleKeyword}
                  isLoading={isKeywordLoading}
                  onGenerateKeywords={handleGenerateKeywords}
                />

                {(genState === 'loading' || genState === 'success') && (
                  <div className="card-select-panel p-8 md:p-10 min-h-[240px] animate-fade-in">
                    <AiRecommendationCard
                      visibleTopics={topics}
                      selectedTopicId={selectedTopicId}
                      onSelectTopic={setSelectedTopicId}
                      genState={genState}
                      isGeneratingMore={isGeneratingMore}
                      totalCount={0}
                      onLoadMore={() => {}}
                    />
                    {topics.length > 0 && !isMaxTopicsReached && (
                      <div className="text-center pt-8">
                        <button
                          type="button"
                          onClick={handleGenerateMoreTopics}
                          disabled={isGeneratingMore || genState === 'loading'}
                          className={`btn-primary-action px-8 py-4 font-jua text-base md:text-lg min-h-[56px] transition-all ${isGeneratingMore || genState === 'loading' ? 'opacity-70 cursor-not-allowed bg-[#e5e7eb] text-[#8f95a6]' : ''}`}
                        >
                          <span>{isGeneratingMore ? '새로운 주제 2개를 만들고 있어요...' : '추천 주제 2개 더 만들기 ✨'}</span>
                        </button>
                      </div>
                    )}
                    {isMaxTopicsReached && (
                      <div className="text-center pt-8">
                        <p className="text-[#626776] font-jua text-lg">추천 주제 10개를 모두 만들었어요</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col items-center gap-2 mt-2">
                  <button
                    disabled={genState === 'loading' || isGeneratingMore || !selection || selectedKeywords.length < 2 || isMaxTopicsReached}
                    onClick={handleRegenerateTopics}
                    className="btn-primary-action !bg-[#6366F1] hover:!bg-[#4F46E5] !text-white flex items-center justify-center w-full max-w-[320px] min-w-[260px] py-3 md:py-4 text-xl font-jua shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    style={isMaxTopicsReached ? {
                      opacity: 0.45,
                      cursor: 'not-allowed',
                      boxShadow: 'none'
                    } : {}}
                  >
                    <Wand2 className={`w-6 h-6 mr-3 stroke-[3] ${genState === 'loading' ? 'animate-spin' : 'animate-bounce-gentle'}`} />
                    <span>
                      {genState === 'loading' 
                        ? '추천 주제를 만들고 있어요...' 
                        : genState === 'idle' 
                          ? '이야기 추천 ✨' 
                          : '새로운 이야기로 다시 받기 🔄'}
                    </span>
                  </button>
                  {isMaxTopicsReached && (
                    <p className="text-sm text-[#626776] font-medium mt-1">추천 주제 10개를 모두 만들었어요. 마음에 드는 주제를 골라 대본 만들기로 넘어가세요.</p>
                  )}
                </div>
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
                  onFillExample={() => handleRegenerateTopics()}
                  disabled={genState === 'loading' || isGeneratingMore || isMaxTopicsReached}
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
                      totalCount={0}
                      onLoadMore={() => {}}
                    />
                    {topics.length > 0 && !isMaxTopicsReached && (
                      <div className="text-center pt-8">
                        <button
                          type="button"
                          onClick={handleGenerateMoreTopics}
                          disabled={isGeneratingMore || genState === 'loading'}
                          className={`btn-primary-action px-8 py-4 font-jua text-base md:text-lg min-h-[56px] transition-all ${isGeneratingMore || genState === 'loading' ? 'opacity-70 cursor-not-allowed bg-[#e5e7eb] text-[#8f95a6]' : ''}`}
                        >
                          <span>{isGeneratingMore ? '새로운 주제 2개를 만들고 있어요...' : '추천 주제 2개 더 만들기 ✨'}</span>
                        </button>
                      </div>
                    )}
                    {isMaxTopicsReached && (
                      <div className="text-center pt-8">
                        <p className="text-[#626776] font-jua text-lg">추천 주제 10개를 모두 만들었어요</p>
                        <p className="text-sm text-[#626776] font-medium mt-2">마음에 드는 주제를 골라 대본 만들기로 넘어가세요.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </StudentWorkspaceLayout>
  )
}
