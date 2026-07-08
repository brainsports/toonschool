// 주제 만들기 페이지 - 태블릿 좌우 배치 & AI 추천 연동
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
import TopicStepTitle from '../components/topic/TopicStepTitle'
import StoryInputCard from '../components/topic/StoryInputCard'
import AiRecommendationCard from '../components/topic/AiRecommendationCard'

import KeywordSelectionCard from '../components/topic/KeywordSelectionCard'
import QuestionSelectionCard from '../components/topic/QuestionSelectionCard'
import type { StudentUnitSelection } from '../types/studentCurriculum'
import type { TopicRecommendation, TopicGenerationState, QuestionGenerationState, KeywordItem, CurriculumContext, QuestionCategory, GeneratedQuestion } from '../types/studentTopic'
import { generateTopicRecommendations, generateKeywords, fetchCurriculumContext, fetchQuestionCategories, generateQuestions, saveGeneratedQuestions, selectGeneratedQuestion, saveGeneratedTopics, selectGeneratedTopic } from '../services/studentTopicService'
import { Sparkles, PenTool, ArrowLeft, Wand2 } from 'lucide-react'
import { projectStorage } from '../utils/projectStorage'
import { showToast } from '../utils/toast'

export default function StudentTopicMakerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai')
  const [aiStep, setAiStep] = useState<'keyword' | 'question' | 'topic'>('keyword')
  const [projectId] = useState<string>(location.state?.projectId || '')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [extraRequest, setExtraRequest] = useState('')
  const [selection, setSelection] = useState<StudentUnitSelection | null>(null)

  const INITIAL_TOPIC_VISIBLE_COUNT = 2
  const TOPIC_VISIBLE_INCREMENT = 2
  const MAX_RECOMMENDED_TOPICS = 10

  const [topics, setTopics] = useState<TopicRecommendation[]>([])
  const [visibleTopicCount, setVisibleTopicCount] = useState(INITIAL_TOPIC_VISIBLE_COUNT)
  const [genState, setGenState] = useState<TopicGenerationState>('idle')
  const [isGeneratingMore, setIsGeneratingMore] = useState(false)
  const [curriculumContext, setCurriculumContext] = useState<CurriculumContext | undefined>()

  // 키워드 추천 관련 상태
  const [recommendedKeywords, setRecommendedKeywords] = useState<KeywordItem[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [isKeywordLoading, setIsKeywordLoading] = useState(false)
  const [visibleKeywordCount, setVisibleKeywordCount] = useState(2)

  // 질문 추천 관련 상태
  const [questionCategories, setQuestionCategories] = useState<QuestionCategory[]>([])
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [questionGenState, setQuestionGenState] = useState<QuestionGenerationState>('idle')

  const displayedTopics = topics.slice(0, visibleTopicCount)
  const isMaxTopicsReached = topics.length >= MAX_RECOMMENDED_TOPICS
  const isAllTopicsVisible = topics.length > 0 && visibleTopicCount >= Math.min(topics.length, MAX_RECOMMENDED_TOPICS)
  const currentUnitKey = useMemo(() => {
    if (!selection) return ''
    return [
      selection.gradeValue || '',
      selection.subjectId || selection.subjectName || '',
      selection.semesterValue || '',
      selection.majorUnitId || '',
      selection.middleUnitId || '',
      selection.majorUnitName || '',
      selection.middleUnitName || ''
    ].join('|')
  }, [selection])
  const previousUnitKeyRef = useRef('')

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
        if (savedTopicData.selectedQuestion) {
          setGeneratedQuestions([savedTopicData.selectedQuestion]);
          setSelectedQuestionId(savedTopicData.selectedQuestion.id);
        }
        if (savedTopicData.topic) {
          setTopics([savedTopicData.topic]);
          setSelectedTopicId(savedTopicData.topic.id);
          setGenState('success');
          
          if (savedTopicData.selectedQuestion) {
            setCreationMode('ai');
            setAiStep('topic');
          } else {
            setCreationMode('manual');
          }
        }
      }
    }
  }, [projectId]);

  // 카테고리 로드
  useEffect(() => {
    fetchQuestionCategories()
      .then(setQuestionCategories)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!currentUnitKey) return
    if (!previousUnitKeyRef.current) {
      previousUnitKeyRef.current = currentUnitKey
      return
    }
    if (previousUnitKeyRef.current === currentUnitKey) return

    previousUnitKeyRef.current = currentUnitKey
    setRecommendedKeywords([])
    setSelectedKeywords([])
    setVisibleKeywordCount(2)
    setGeneratedQuestions([])
    setSelectedQuestionId(null)
    setQuestionGenState('idle')
    setTopics([])
    setVisibleTopicCount(INITIAL_TOPIC_VISIBLE_COUNT)
    setSelectedTopicId(null)
    setGenState('idle')
    setIsGeneratingMore(false)
    setAiStep('keyword')
    console.debug('[주제 만들기 단원 변경 초기화]', { currentUnitKey })
  }, [currentUnitKey])

  const canProceed = selectedTopicId !== null

  // 처음 AI 모드 진입 시 자동 키워드 생성
  useEffect(() => {
    if (creationMode === 'ai' && aiStep === 'keyword' && selection && recommendedKeywords.length === 0 && !isKeywordLoading) {
      handleGenerateKeywords()
    }
  }, [creationMode, aiStep, selection])

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
      count: 10,
      curriculumContext
    }
    try {
      const keywords = await generateKeywords(request)
      console.debug('[키워드 생성 결과]', { unitKey: currentUnitKey, keywords: keywords.map(k => k.word) })
      
      setRecommendedKeywords(prev => {
        // 중복 제거 및 최대 10개 유지
        const combined = [...prev, ...keywords]
        const unique = combined.filter((kw, index, self) => 
          index === self.findIndex(t => t.word === kw.word)
        )
        return unique.slice(0, 10)
      })
      setVisibleKeywordCount(prev => prev === 0 ? 2 : prev)
    } catch (error) {
      console.error('키워드 생성 실패:', error)
    } finally {
      setIsKeywordLoading(false)
    }
  }

  const handleShowMoreKeywords = () => {
    setVisibleKeywordCount(prev => Math.min(prev + 2, recommendedKeywords.length))
  }

  const handleToggleKeyword = (word: string) => {
    setSelectedKeywords(prev => {
      if (prev.includes(word)) {
        return prev.filter(k => k !== word)
      }
      if (prev.length >= 4) {
        return prev
      }
      return [...prev, word]
    })
  }

  // 2. 질문 생성 실행 함수
  const handleProceedToQuestions = async () => {
    if (!selection || selectedKeywords.length === 0) return
    setAiStep('question')
    setQuestionGenState('loading')
    setSelectedQuestionId(null)
    setGeneratedQuestions([])

    const request = {
      gradeName: selection.gradeName || '',
      subjectName: selection.subjectName || '',
      majorUnitName: selection.majorUnitName || '',
      middleUnitName: selection.middleUnitName || '',
      selectedKeywords,
      categories: questionCategories,
      curriculumContext
    }

    try {
      const questions = await generateQuestions(request)
      const savedQuestions = await saveGeneratedQuestions(questions, {
        grade: selection.gradeValue || 0,
        subject: selection.subjectName || '',
        semester: selection.semesterValue?.toString() || '',
        unit_id: selection.majorUnitId || null,
        subunit_id: selection.middleUnitId || null,
      })
      setGeneratedQuestions(savedQuestions)
      setQuestionGenState('success')
    } catch (error) {
      console.error('질문 생성 실패:', error)
      alert('질문을 만들지 못했습니다. 다시 시도해 주세요.')
      setQuestionGenState('error')
    }
  }

  const handleSelectQuestion = async (qId: string | null) => {
    setSelectedQuestionId(qId)
    if (qId) {
      try {
        await selectGeneratedQuestion(qId, {
          keyword: selectedKeywords.join(', '),
          subject: selection?.subjectName || '',
          grade: selection?.gradeValue || 0
        })
      } catch (e) {
        console.error('질문 선택 저장 실패:', e)
      }
    }
  }

  // 3. 주제 생성 실행 함수 (질문 선택 후)
  const handleProceedToTopics = async () => {
    if (!selection || !selectedQuestionId) return
    setAiStep('topic')
    setGenState('loading')
    setSelectedTopicId(null)
    setTopics([])
    setVisibleTopicCount(INITIAL_TOPIC_VISIBLE_COUNT)

    const selectedQuestion = generatedQuestions.find(q => q.id === selectedQuestionId)

    const request = {
      gradeName: selection.gradeName || '',
      subjectName: selection.subjectName || '',
      majorUnitName: selection.majorUnitName || '',
      middleUnitName: selection.middleUnitName || '',
      selectedKeywords,
      selectedQuestion,
      learningTopicId: selection.middleUnitId || null,
      previousTitles: [],
      previousIncidents: [],
      previousTypes: [],
      count: MAX_RECOMMENDED_TOPICS,
      curriculumContext
    }

    try {
      const generatedTopics = await generateTopicRecommendations(request)
      const savedTopics = await saveGeneratedTopics(generatedTopics, selectedQuestionId, 1)
      
      // Parse back the topic objects from saved text
      const parsedTopics = savedTopics.map(st => {
        try {
          const t = JSON.parse(st.topic_text)
          t.id = st.id // Use DB id
          return t
        } catch {
          return null
        }
      }).filter(Boolean)
      
      setTopics(parsedTopics)
      setVisibleTopicCount(INITIAL_TOPIC_VISIBLE_COUNT)
      console.debug('[추천 주제 표시 상태]', { total: parsedTopics.length, initialVisible: INITIAL_TOPIC_VISIBLE_COUNT, currentVisible: INITIAL_TOPIC_VISIBLE_COUNT })
      setGenState('success')
    } catch (error) {
      console.error('AI 추천 주제 생성 중 오류 발생:', error)
      alert('추천 주제를 만들지 못했습니다. 다시 시도해 주세요.')
      setGenState('error')
    }
  }

  // 4. 추천 주제 더 보기: 이미 준비된 10개 중 2개씩 추가 표시
  const handleShowMoreTopics = () => {
    setVisibleTopicCount(prev => {
      const next = Math.min(prev + TOPIC_VISIBLE_INCREMENT, MAX_RECOMMENDED_TOPICS, topics.length)
      console.debug('[추천 주제 표시 상태]', { total: topics.length, initialVisible: INITIAL_TOPIC_VISIBLE_COUNT, currentVisible: next })
      return next
    })
  }

  // 4-1. AI 추천 실행 함수 (다시 받기 / 초기 생성 - manual 모드용)
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

    const selectedQuestion = generatedQuestions.find(q => q.id === selectedQuestionId)

    const request = {
      gradeName: selection.gradeName || '',
      subjectName: selection.subjectName || '',
      majorUnitName: selection.majorUnitName || '',
      middleUnitName: selection.middleUnitName || '',
      extraRequest: extraRequest.trim() || undefined,
      selectedKeywords,
      selectedQuestion,
      learningTopicId: selection.middleUnitId || null,
      previousTitles: [],
      previousIncidents: [],
      previousTypes: [],
      count: MAX_RECOMMENDED_TOPICS,
      curriculumContext
    }

    try {
      const generatedTopics = await generateTopicRecommendations(request)
      if (selectedQuestionId) {
        const savedTopics = await saveGeneratedTopics(generatedTopics, selectedQuestionId, 1)
        const parsedTopics = savedTopics.map(st => {
          try {
            const t = JSON.parse(st.topic_text)
            t.id = st.id
            return t
          } catch {
            return null
          }
        }).filter(Boolean)
        setTopics(parsedTopics)
        setVisibleTopicCount(INITIAL_TOPIC_VISIBLE_COUNT)
      } else {
        setTopics(generatedTopics)
        setVisibleTopicCount(INITIAL_TOPIC_VISIBLE_COUNT)
      }
      setGenState('success')
    } catch (error) {
      console.error('AI 추천 주제 생성 중 오류 발생:', error)
      alert('추천 주제를 만들지 못했습니다. 다시 시도해 주세요.')
      setGenState('error')
    }
  }



  // 선택한 스토리의 설명 정보 가져오기
  const selectedTopic = topics.find(t => t.id === selectedTopicId)

  const handleSelectTopic = async (tId: string | null) => {
    setSelectedTopicId(tId)
    if (tId && selectedQuestionId) {
      try {
        await selectGeneratedTopic(tId, selectedQuestionId)
      } catch (e) {
        console.error('주제 선택 저장 실패:', e)
      }
    }
  }

  // 만화 만들기 클릭 시 이동
  const handleProceedToComic = () => {
    if (!canProceed || !selection || !selectedTopic) return

    const selectedQuestion = generatedQuestions.find(q => q.id === selectedQuestionId)

    const fullSelectionData = {
      selection,
      topic: selectedTopic,
      extraRequest,
      selectedKeywords,
      selectedQuestion
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

        <div className="animate-fade-in w-full max-w-[1200px] mx-auto flex flex-col gap-6 mt-4">
            <div className="flex justify-start mb-2">
              <button
                onClick={() => {
                  if (creationMode === 'manual') {
                    setCreationMode('ai')
                    setAiStep('keyword')
                    setTopics([])
                    setGenState('idle')
                    setSelectedTopicId(null)
                    setExtraRequest('')
                  } else if (creationMode === 'ai' && aiStep === 'topic') {
                    setAiStep('question')
                    setGenState('idle')
                    setSelectedTopicId(null)
                    setTopics([])
                  } else if (creationMode === 'ai' && aiStep === 'question') {
                    setAiStep('keyword')
                    setQuestionGenState('idle')
                    setSelectedQuestionId(null)
                    setGeneratedQuestions([])
                  } else {
                    navigate('/student/select-unit', { state: { projectId } })
                  }
                }}
                className="flex items-center justify-center font-jua text-lg px-6 py-2.5 shadow-sm rounded-full bg-[#4B5563] hover:bg-[#374151] text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2 stroke-[3]" />
                이전
              </button>
            </div>

            {creationMode === 'ai' && (
              <div className="flex flex-col gap-5">

                {aiStep === 'keyword' && (
                  <div className="animate-fade-in flex flex-col gap-5">
                    <KeywordSelectionCard
                      keywords={recommendedKeywords.slice(0, visibleKeywordCount)}
                      totalKeywords={recommendedKeywords.length}
                      selectedKeywords={selectedKeywords}
                      onToggleKeyword={handleToggleKeyword}
                      isLoading={isKeywordLoading}
                      onGenerateKeywords={handleShowMoreKeywords}
                    />
                    <div className="flex justify-center mt-4">
                      <button
                        disabled={selectedKeywords.length === 0 || questionGenState === 'loading'}
                        onClick={handleProceedToQuestions}
                        className={`btn-primary-action px-8 py-4 font-jua text-xl transition-all shadow-md min-w-[280px] flex justify-center items-center ${
                          selectedKeywords.length === 0 ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500 shadow-none' : '!bg-[#6366F1] hover:!bg-[#4F46E5] !text-white'
                        }`}
                      >
                        {questionGenState === 'loading' ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                            질문을 만들고 있어요...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-6 h-6 mr-2" />
                            이 키워드로 질문 만들기 ✨
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex justify-center mt-4 border-t border-gray-200 pt-6">
                      <button
                        onClick={() => {
                          setCreationMode('manual')
                          setExtraRequest('')
                        }}
                        className="text-[#626776] hover:text-[#4F46E5] underline font-jua text-lg transition-colors flex items-center"
                      >
                        <PenTool className="w-5 h-5 mr-2" />
                        키워드 선택 없이 직접 내용을 입력해서 만들래요
                      </button>
                    </div>
                  </div>
                )}

                {aiStep === 'question' && (
                  <QuestionSelectionCard
                    categories={questionCategories}
                    questions={generatedQuestions}
                    selectedQuestionId={selectedQuestionId}
                    onSelectQuestion={handleSelectQuestion}
                    onProceed={handleProceedToTopics}
                    isLoading={questionGenState === 'loading'}
                    isTopicGenerating={genState === 'loading'}
                    selectedKeywords={selectedKeywords}
                  />
                )}

                {aiStep === 'topic' && (genState === 'loading' || genState === 'success') && (
                  <div className="card-select-panel p-8 md:p-10 min-h-[240px] animate-fade-in">
                    <AiRecommendationCard
                      visibleTopics={displayedTopics}
                      selectedTopicId={selectedTopicId}
                      onSelectTopic={handleSelectTopic}
                      genState={genState}
                      isGeneratingMore={isGeneratingMore}
                      totalCount={0}
                      onLoadMore={() => {}}
                    />
                    {topics.length > 0 && !isAllTopicsVisible && (
                      <div className="text-center pt-8">
                        <button
                          type="button"
                          onClick={handleShowMoreTopics}
                          disabled={isGeneratingMore || genState === 'loading' || isAllTopicsVisible}
                          className={`btn-primary-action px-8 py-4 font-jua text-base md:text-lg min-h-[56px] transition-all ${isGeneratingMore || genState === 'loading' ? 'opacity-70 cursor-not-allowed bg-[#e5e7eb] text-[#8f95a6]' : ''}`}
                        >
                          <span>{`추천 주제 ${Math.min(visibleTopicCount + TOPIC_VISIBLE_INCREMENT, topics.length, MAX_RECOMMENDED_TOPICS)}개까지 보기 ✨`}</span>
                        </button>
                      </div>
                    )}
                    {isAllTopicsVisible && topics.length >= MAX_RECOMMENDED_TOPICS && (
                      <div className="text-center pt-8">
                        <p className="text-[#626776] font-jua text-lg">추천 주제 10개를 모두 만들었어요</p>
                      </div>
                    )}
                  </div>
                )}

                {aiStep === 'topic' && (
                  <div className="flex flex-col items-center gap-2 mt-2">
                    <button
                      disabled={genState === 'loading' || isGeneratingMore || !selection || isMaxTopicsReached}
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
                    {isAllTopicsVisible && topics.length >= MAX_RECOMMENDED_TOPICS && (
                      <p className="text-sm text-[#626776] font-medium mt-1">추천 주제 10개를 모두 만들었어요. 마음에 드는 주제를 골라 대본 만들기로 넘어가세요.</p>
                    )}
                  </div>
                )}
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
                      visibleTopics={displayedTopics}
                      selectedTopicId={selectedTopicId}
                      onSelectTopic={handleSelectTopic}
                      genState={genState}
                      isGeneratingMore={isGeneratingMore}
                      totalCount={0}
                      onLoadMore={() => {}}
                    />
                    {topics.length > 0 && !isAllTopicsVisible && (
                      <div className="text-center pt-8">
                        <button
                          type="button"
                          onClick={handleShowMoreTopics}
                          disabled={isGeneratingMore || genState === 'loading' || isAllTopicsVisible}
                          className={`btn-primary-action px-8 py-4 font-jua text-base md:text-lg min-h-[56px] transition-all ${isGeneratingMore || genState === 'loading' ? 'opacity-70 cursor-not-allowed bg-[#e5e7eb] text-[#8f95a6]' : ''}`}
                        >
                          <span>{`추천 주제 ${Math.min(visibleTopicCount + TOPIC_VISIBLE_INCREMENT, topics.length, MAX_RECOMMENDED_TOPICS)}개까지 보기 ✨`}</span>
                        </button>
                      </div>
                    )}
                    {isAllTopicsVisible && topics.length >= MAX_RECOMMENDED_TOPICS && (
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
      </div>
      </div>
    </StudentWorkspaceLayout>
  )
}
