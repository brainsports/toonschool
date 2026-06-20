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

export default function StudentTopicMakerPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [creationMode, setCreationMode] = useState<'select' | 'ai' | 'manual'>('select')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [extraRequest, setExtraRequest] = useState('')
  const [visibleCount, setVisibleCount] = useState(2)
  const [selection, setSelection] = useState<StudentUnitSelection | null>(null)

  // AI 추천 관련 상태
  const [topics, setTopics] = useState<TopicRecommendation[]>([])
  const [genState, setGenState] = useState<TopicGenerationState>('idle')

  // 키워드 추천 관련 상태
  const [recommendedKeywords, setRecommendedKeywords] = useState<KeywordItem[]>([])
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
  const [isKeywordLoading, setIsKeywordLoading] = useState(false)

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
  const handleGenerateTopics = async () => {
    if (!selection) return

    setGenState('loading')
    setSelectedTopicId(null)
    setVisibleCount(2)

    const request = {
      gradeName: selection.gradeName || '',
      subjectName: selection.subjectName || '',
      majorUnitName: selection.majorUnitName || '',
      middleUnitName: selection.middleUnitName || '',
      extraRequest: extraRequest.trim() || undefined,
      selectedKeywords
    }

    const generatedTopics = await generateTopicRecommendations(request)
    
    setTopics(generatedTopics)
    setGenState('success')
  }

  const visibleTopics = topics.slice(0, visibleCount)

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

    // 앞표지 생성 화면으로 이동하며 state 전달
    navigate('/student/front-cover', { state: fullSelectionData })
  }

  return (
    <StudentCreationLayout currentStep="topic" bgVariant="space" maxWidth="full">
      <div className="flex flex-col gap-8 animate-fade-in w-full pb-12 relative">
        
        {/* 헤더 영역 (제목 & 단원 배지) */}
        <TopicStepTitle selection={selection} />

        {/* 데스크탑 좌측 상단 이전 버튼 */}
        <TopicActionButtons
          type="desktop-prev"
          onClick={() => navigate('/student/select-unit')}
        />

        {creationMode === 'select' && (
          <div className="animate-fade-in">

            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mt-4 max-w-[1200px] mx-auto w-full">
              <button
                onClick={() => {
                  setCreationMode('ai')
                  setExtraRequest('')
                }}
                className="card-glass p-8 flex flex-col items-center justify-between hover:scale-[1.02] transition-transform text-center h-[22rem] group"
              >
                <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:bg-purple-500/30 transition-colors shrink-0">
                  <Sparkles className="w-12 h-12 text-purple-300" />
                </div>
                <div className="text-center">
                  <h3 className="font-jua text-3xl md:text-4xl font-bold text-white leading-tight">AI 추천으로 시작하기</h3>
                </div>
                <div className="btn-neon-purple px-8 py-3 rounded-full font-jua text-xl w-full max-w-[200px] text-center shrink-0">
                  AI 추천 받기
                </div>
              </button>

              <button
                onClick={() => {
                  setCreationMode('manual')
                  setExtraRequest('')
                }}
                className="card-glass p-8 flex flex-col items-center justify-between hover:scale-[1.02] transition-transform text-center h-[22rem] group"
              >
                <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:bg-blue-500/30 transition-colors shrink-0">
                  <PenTool className="w-12 h-12 text-blue-300" />
                </div>
                <div className="text-center">
                  <h3 className="font-jua text-3xl md:text-4xl font-bold text-white leading-tight">내가 직접 만들기</h3>
                </div>
                <div className="px-8 py-3 rounded-full font-jua text-xl w-full max-w-[200px] text-center shrink-0 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 border border-blue-400/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all">
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
                className="flex items-center text-purple-200 hover:text-white transition-colors font-jua text-lg bg-black/20 px-5 py-2.5 rounded-full border border-white/10"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
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
                  <div className="card-glass p-8 md:p-10 min-h-[240px] animate-fade-in">
                    <AiRecommendationCard
                      visibleTopics={visibleTopics}
                      selectedTopicId={selectedTopicId}
                      onSelectTopic={setSelectedTopicId}
                      genState={genState}
                      visibleCount={visibleCount}
                      totalCount={topics.length}
                      onLoadMore={() => setVisibleCount(prev => Math.min(prev + 2, topics.length))}
                    />
                  </div>
                )}

                <AiMagicButton
                  genState={genState}
                  disabled={genState === 'loading' || !selection || selectedKeywords.length < 2}
                  onClick={handleGenerateTopics}
                />
              </div>
            )}

            {creationMode === 'manual' && (
              <div className="flex flex-col gap-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-jua text-white mb-2">내가 직접 만들래요</h2>
                  <p className="text-blue-200 text-lg">이야기에 넣고 싶은 내용을 적어 주세요.</p>
                </div>

                <StoryInputCard
                  extraRequest={extraRequest}
                  onExtraRequestChange={setExtraRequest}
                  onFillExample={handleGenerateTopics}
                  disabled={genState === 'loading'}
                  loading={genState === 'loading'}
                />
                
                {/* AI 추천 결과 목록 (로딩 중이거나 결과가 있을 때) */}
                {(genState === 'loading' || genState === 'success') && (
                  <div className="card-glass p-8 md:p-10 min-h-[240px] mt-4 animate-fade-in">
                    {genState === 'success' && (
                      <h3 className="text-xl font-jua text-purple-200 mb-6 flex items-center">
                        <Sparkles className="w-6 h-6 mr-2 text-purple-300" />
                        입력한 내용으로 만들어진 이야기예요! 하나를 선택해주세요.
                      </h3>
                    )}
                    <AiRecommendationCard
                      visibleTopics={visibleTopics}
                      selectedTopicId={selectedTopicId}
                      onSelectTopic={setSelectedTopicId}
                      genState={genState}
                      visibleCount={visibleCount}
                      totalCount={topics.length}
                      onLoadMore={() => setVisibleCount(prev => Math.min(prev + 2, topics.length))}
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
          onClick={() => navigate('/student/select-unit')}
        />

      </div>
    </StudentCreationLayout>
  )
}
