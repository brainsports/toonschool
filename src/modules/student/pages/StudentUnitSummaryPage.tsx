import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout'
import ToonSchoolCharacterBadgeGroup from '../components/layout/ToonSchoolCharacterBadgeGroup'
import { ArrowRight, BookOpen, PenTool, Loader2, Edit3, Landmark, Newspaper, Home, Globe, Bot, Lightbulb, Clock, Magnet, Droplet, ShoppingBag, ScrollText } from 'lucide-react'
import { projectStorage } from '../utils/projectStorage'
import { generateWorldStories, generateOXQuizzes, type WorldStory, type OXQuestion } from '../services/studentUnitSummaryService'

type StoryType = 'history' | 'latest' | 'life';

const getStoryIcon = (title: string, type: StoryType) => {
  const t = title.toLowerCase();
  
  // 1. 키워드 기반 아이콘 (Emoji 사용)
  if (t.includes('피자') || t.includes('빵') || t.includes('음식')) return <span className="text-5xl drop-shadow-sm">🍕</span>;
  if (t.includes('우주') || t.includes('로켓') || t.includes('행성')) return <span className="text-5xl drop-shadow-sm">🚀</span>;
  if (t.includes('분수') || t.includes('수학') || t.includes('계산')) return <span className="text-5xl drop-shadow-sm">➗</span>;
  if (t.includes('피라미드') || t.includes('이집트') || t.includes('유적')) return <span className="text-5xl drop-shadow-sm">🏜️</span>;
  
  // 2. 키워드 기반 아이콘 (Lucide 사용)
  const iconProps = { className: "w-12 h-12 opacity-80" };
  
  if (t.includes('시간') || t.includes('시계')) return <Clock {...iconProps} />;
  if (t.includes('물') || t.includes('컵')) return <Droplet {...iconProps} />;
  if (t.includes('시장') || t.includes('장바구니') || t.includes('쇼핑')) return <ShoppingBag {...iconProps} />;
  if (t.includes('자석') || t.includes('n극') || t.includes('s극')) return <Magnet {...iconProps} />;
  if (t.includes('신문') || t.includes('뉴스')) return <Newspaper {...iconProps} />;
  if (t.includes('지구') || t.includes('세계')) return <Globe {...iconProps} />;
  if (t.includes('로봇') || t.includes('ai') || t.includes('인공지능')) return <Bot {...iconProps} />;
  if (t.includes('전구') || t.includes('발명') || t.includes('전기')) return <Lightbulb {...iconProps} />;
  if (t.includes('역사') || t.includes('과거') || t.includes('문서')) return <ScrollText {...iconProps} />;
  if (t.includes('박물관')) return <Landmark {...iconProps} />;
  
  // 3. 기본 아이콘 (타입별)
  switch(type) {
    case 'history': return <Landmark {...iconProps} />;
    case 'latest': return <Newspaper {...iconProps} />;
    case 'life': return <Home {...iconProps} />;
    default: return <Lightbulb {...iconProps} />;
  }
}


export default function StudentUnitSummaryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const state = location.state as any || {}
  // ✅ 'default-project' fallback 제거 — projectId 없으면 빈 상태 유지 (샘플 데이터 혼입 방지)
  const projectId = state.projectId || localStorage.getItem('studentCurrentProjectId') || ''


  const [projectData, setProjectData] = useState<any>(null)

  // 상태 관리
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)
  const [activeStoryTab, setActiveStoryTab] = useState<StoryType>('history')
  const [stories, setStories] = useState<Record<StoryType, WorldStory | null>>({
    history: null,
    latest: null,
    life: null
  })
  
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [questions, setQuestions] = useState<OXQuestion[]>([])

  useEffect(() => {
    // ✅ projectId가 없으면 샘플 데이터 혼입 방지를 위해 빈 상태로 설정
    if (!projectId) {
      console.warn('[UnitSummary] projectId가 없습니다. 빈 상태로 시작합니다.')
      setStories({ history: null, latest: null, life: null })
      setQuestions([])
      return
    }

    const storageTopicData = projectStorage.loadTopic<any>(projectId)
    const storageComicData = projectStorage.loadComic<any>(projectId)
    const summaryData = projectStorage.loadSummary<any>(projectId)

    const topicData = state.topicData || storageTopicData
    const comicData = state.comicData || storageComicData

    if (topicData) {
      setProjectData({ topicData, comicData })
    }

    if (summaryData && topicData) {
      const currentSubject = topicData.selection?.subjectName
      const currentTopic = topicData.topic?.title

      // ✅ projectId + 과목 + 주제 모두 일치할 때만 저장된 summary 복원
      const isMatch =
        summaryData.subjectName === currentSubject &&
        summaryData.topicTitle === currentTopic &&
        // projectId가 summary에 저장되어 있으면 추가 검증
        (!summaryData.projectId || summaryData.projectId === projectId)

      if (isMatch) {
        if (summaryData.stories) setStories(summaryData.stories)
        if (summaryData.activeStoryTab) setActiveStoryTab(summaryData.activeStoryTab)
        if (summaryData.questions) setQuestions(summaryData.questions)
      } else {
        console.warn('[UnitSummary] 저장된 summary 데이터와 현재 작품이 불일치합니다. 빈 상태로 시작합니다.', {
          saved: { subject: summaryData.subjectName, topic: summaryData.topicTitle, projectId: summaryData.projectId },
          current: { subject: currentSubject, topic: currentTopic, projectId }
        })
        setStories({ history: null, latest: null, life: null })
        setQuestions([])
      }
    } else {
      setStories({ history: null, latest: null, life: null })
      setQuestions([])
    }

  }, [projectId, location.state])

  const saveSummaryState = (newStories: any, newTab: any, newQuestions: any) => {
    if (!projectId) return // projectId 없으면 저장 안 함
    projectStorage.saveSummary(projectId, {
      stories: newStories,
      activeStoryTab: newTab,
      questions: newQuestions,
      subjectName: projectData?.topicData?.selection?.subjectName,
      topicTitle: projectData?.topicData?.topic?.title,
      // ✅ projectId도 함께 저장하여 향후 불일치 감지에 사용
      projectId
    })
  }

  // AI 연동을 위한 함수
  const handleGenerateStory = async () => {
    if (!projectData?.topicData) return;
    setIsGeneratingStory(true)
    
    try {
      const { selection, topic, selectedKeywords } = projectData.topicData
      const panels = projectData.comicData?.panels || []
      const comicText = panels.map((p: any) => p.dialogues?.map((d: any) => d.text).join(' ')).join(' | ')

      const generatedStories = await generateWorldStories({
        gradeName: selection?.gradeName,
        subjectName: selection?.subjectName,
        majorUnitName: selection?.majorUnitName,
        middleUnitName: selection?.middleUnitName,
        learningGoal: selection?.learningGoal,
        selectedKeywords: selectedKeywords,
        topicTitle: topic?.title,
        topicSummary: topic?.summary,
        comicText: comicText
      })

      setStories(generatedStories)
      saveSummaryState(generatedStories, activeStoryTab, questions)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsGeneratingStory(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!projectData?.topicData) return;
    setIsGeneratingQuiz(true)

    try {
      const { selection, topic } = projectData.topicData
      const panels = projectData.comicData?.panels || []
      const comicText = panels.map((p: any) => p.dialogues?.map((d: any) => d.text).join(' ')).join(' | ')

      const generatedQuizzes = await generateOXQuizzes({
        gradeName: selection?.gradeName,
        subjectName: selection?.subjectName,
        majorUnitName: selection?.majorUnitName,
        middleUnitName: selection?.middleUnitName,
        learningGoal: selection?.learningGoal,
        topicTitle: topic?.title,
        topicSummary: topic?.summary,
        comicText: comicText
      })

      setQuestions(generatedQuizzes)
      saveSummaryState(stories, activeStoryTab, generatedQuizzes)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  const handleQuestionChange = (id: string, newText: string) => {
    const newQuestions = questions.map(q => q.id === id ? { ...q, question: newText } : q)
    setQuestions(newQuestions)
    saveSummaryState(stories, activeStoryTab, newQuestions)
  }

  const handleAnswerToggle = (id: string) => {
    const newQuestions = questions.map(q => q.id === id ? { ...q, answer: (q.answer === 'O' ? 'X' : 'O') as "O" | "X" } : q)
    setQuestions(newQuestions)
    saveSummaryState(stories, activeStoryTab, newQuestions)
  }

  const handleTabChange = (tab: StoryType) => {
    setActiveStoryTab(tab)
    saveSummaryState(stories, tab, questions)
  }

  // 기존 저장 데이터 연동
  const subject = projectData?.topicData?.selection?.subjectName || '과목 정보 없음'
  const unitTitle = projectData?.topicData?.topic?.title || projectData?.topicData?.selection?.middleUnitName || projectData?.topicData?.selection?.majorUnitName || '단원 정보 없음'

  const isDataMissing = !projectData?.topicData;
  const isStoryCompleted = !!(stories.history?.content || stories.latest?.content || stories.life?.content);
  const isQuizCompleted = questions.length >= 5;

  const actionButtons = (
    <>
      <button
        onClick={handleGenerateStory}
        disabled={isGeneratingStory || isDataMissing || isStoryCompleted}
        className={`btn-student btn-student-md disabled:opacity-70 ${
          isStoryCompleted
            ? '!bg-[#F3F4F6] !border-[#D1D5DB] !text-[#9CA3AF] !cursor-not-allowed'
            : 'btn-student-secondary'
        }`}
      >
        {isGeneratingStory ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <BookOpen className={`w-5 h-5 ${isStoryCompleted ? 'text-[#9CA3AF]' : ''}`} />
        )}
        <span className="hidden sm:inline">
          {isStoryCompleted ? '세상 속 이야기 완료' : isGeneratingStory ? '세상 속 이야기 생성 중...' : '세상 속 이야기 만들기'}
        </span>
        <span className="sm:hidden">
          {isStoryCompleted ? '완료' : isGeneratingStory ? '생성 중...' : '이야기'}
        </span>
      </button>
      <button
        onClick={handleGenerateQuiz}
        disabled={isGeneratingQuiz || isDataMissing || isQuizCompleted}
        className={`btn-student btn-student-md disabled:opacity-70 ${
          isQuizCompleted
            ? '!bg-[#F3F4F6] !border-[#D1D5DB] !text-[#9CA3AF] !cursor-not-allowed'
            : 'btn-student-secondary'
        }`}
      >
        {isGeneratingQuiz ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <PenTool className={`w-5 h-5 ${isQuizCompleted ? 'text-[#9CA3AF]' : ''}`} />
        )}
        <span className="hidden sm:inline">
          {isQuizCompleted ? 'OX 문제 완료' : isGeneratingQuiz ? 'OX 문제 생성 중...' : 'OX 문제 만들기'}
        </span>
        <span className="sm:hidden">
          {isQuizCompleted ? '완료' : isGeneratingQuiz ? '생성 중...' : '문제'}
        </span>
      </button>
      <button
        onClick={() => navigate('/student/back-cover', { state: { projectId } })}
        className="btn-student btn-student-primary btn-student-md"
      >
        <span className="hidden sm:inline">뒤표지 만들기</span>
        <span className="sm:hidden">다음</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </>
  );

  return (
    <StudentWorkspaceLayout
      currentStep="summary"
      title="단원 정리"
      subtitle="세상과 연결하고, 내가 문제를 만들어 봐요!"
      onBack={() => navigate('/student/comic/full', { state: { projectId } })}
      actionButtons={actionButtons}
      bgVariant="default"
    >
      <div className="w-full flex-1 flex flex-col min-h-0 bg-transparent relative">
        {/* 중앙 A4 학습지 스크롤 영역 */}
        <div className="flex-1 w-full overflow-auto flex justify-center py-8 student-scrollbar">
          <div 
            className="bg-white shadow-sm border border-[#d9deea] flex flex-col relative shrink-0"
            style={{ 
              width: '100%',
              maxWidth: '800px', 
              minHeight: '1131px', // A4 비율 대략 (800 * 1.414)
              padding: 'clamp(1.2rem, 3vw, 2rem)',
              borderRadius: '1.5rem'
            }}
          >
            {/* A4 헤더 */}
            <div className="h-[76px] mb-6 shrink-0 bg-[#F1E7FF] rounded-xl px-5 flex items-center justify-between border-b-2 border-[#E5D5FF] shadow-sm w-full">
              {/* Left: Logo & Subject & Title */}
              <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
                <span className="font-black text-2xl tracking-tighter text-[#303442] shrink-0">TOONSCHOOL</span>
                <div className="px-3 py-1 bg-[#DCC7FF] text-[#6D28D9] rounded-md font-bold text-sm shrink-0">
                  {subject}
                </div>
                <span className="text-[#BFA7F2] font-bold shrink-0 mx-1">|</span>
                <h2 className="text-xl font-jua text-[#303442] truncate">
                  {unitTitle}
                </h2>
              </div>
              {/* Right: Characters */}
              <ToonSchoolCharacterBadgeGroup textColorClass="text-[#555b6b]" />
            </div>

            {/* 본문 콘텐츠 영역 */}
            <div className="flex flex-col gap-10 flex-1 py-2">
              {isDataMissing ? (
                <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] text-center gap-4">
                  <BookOpen className="w-16 h-16 text-slate-300" />
                  <p className="text-lg font-bold text-slate-500">
                    아직 단원정리 내용을 만들 준비가 되지 않았어요.<br/>먼저 주제, 대본, 만화를 완성해 주세요.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. 세상 속 이야기 영역 */}
                  <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg shadow-sm">1</div>
                  <h2 className="text-xl md:text-2xl font-jua text-[#303442]">세상 속 이야기</h2>
                </div>
                
                <div className="pl-2 md:pl-10 flex flex-col">
                  {/* 탭 버튼들 */}
                  <div className="flex gap-2 px-4 mb-[-2px] relative z-10 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => handleTabChange('history')}
                      className={`px-4 py-2 rounded-t-xl font-bold text-xs md:text-sm flex items-center gap-1.5 border-2 transition-colors shrink-0 ${
                        activeStoryTab === 'history' 
                          ? 'bg-purple-50 border-purple-200 border-b-purple-50 text-purple-700' 
                          : `bg-slate-50 border-slate-200 text-slate-500 hover:bg-purple-50/50 ${activeStoryTab === 'latest' ? 'border-b-sky-200' : activeStoryTab === 'life' ? 'border-b-teal-200' : 'border-b-purple-200'}`
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      역사 이야기
                    </button>
                    <button
                      onClick={() => handleTabChange('latest')}
                      className={`px-4 py-2 rounded-t-xl font-bold text-xs md:text-sm flex items-center gap-1.5 border-2 transition-colors shrink-0 ${
                        activeStoryTab === 'latest' 
                          ? 'bg-sky-50 border-sky-200 border-b-sky-50 text-sky-700' 
                          : `bg-slate-50 border-slate-200 text-slate-500 hover:bg-sky-50/50 ${activeStoryTab === 'history' ? 'border-b-purple-200' : activeStoryTab === 'life' ? 'border-b-teal-200' : 'border-b-sky-200'}`
                      }`}
                    >
                      <Newspaper className="w-4 h-4" />
                      최신 이야기
                    </button>
                    <button
                      onClick={() => handleTabChange('life')}
                      className={`px-4 py-2 rounded-t-xl font-bold text-xs md:text-sm flex items-center gap-1.5 border-2 transition-colors shrink-0 ${
                        activeStoryTab === 'life' 
                          ? 'bg-teal-50 border-teal-200 border-b-teal-50 text-teal-700' 
                          : `bg-slate-50 border-slate-200 text-slate-500 hover:bg-teal-50/50 ${activeStoryTab === 'history' ? 'border-b-purple-200' : activeStoryTab === 'latest' ? 'border-b-sky-200' : 'border-b-teal-200'}`
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      생활 연결
                    </button>
                  </div>

                  {/* 기사 본문 카드 */}
                  <div className={`p-5 md:p-6 rounded-2xl border-2 relative z-0 transition-colors duration-300 min-h-[160px]
                    ${activeStoryTab === 'history' ? 'bg-purple-50 border-purple-200' : ''}
                    ${activeStoryTab === 'latest' ? 'bg-sky-50 border-sky-200' : ''}
                    ${activeStoryTab === 'life' ? 'bg-teal-50 border-teal-200' : ''}
                  `}>
                    {stories[activeStoryTab] ? (
                      <div className="flex flex-col sm:flex-row gap-5 md:gap-6 items-start">
                        {/* 가로형 썸네일 */}
                        <div className="w-full sm:w-[150px] h-[100px] shrink-0 bg-white rounded-xl border-2 border-white/50 shadow-sm flex items-center justify-center overflow-hidden">
                          <div className={`w-full h-full flex items-center justify-center
                            ${activeStoryTab === 'history' ? 'bg-purple-100 text-purple-500' : ''}
                            ${activeStoryTab === 'latest' ? 'bg-sky-100 text-sky-500' : ''}
                            ${activeStoryTab === 'life' ? 'bg-teal-100 text-teal-500' : ''}
                          `}>
                             {getStoryIcon(stories[activeStoryTab]?.title || '', activeStoryTab)}
                          </div>
                        </div>
                        
                        {/* 기사 텍스트 영역 */}
                        <div className="flex flex-col">
                          <h3 className="text-xl md:text-2xl font-jua text-[#303442] mb-2 md:mb-3">{stories[activeStoryTab]?.title}</h3>
                          <p className="text-[#555b6b] font-medium leading-[1.6] whitespace-pre-wrap text-[13px] md:text-[14px]">
                            {stories[activeStoryTab]?.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[160px] gap-3 opacity-60">
                        <BookOpen className="w-10 h-10 text-[#8b909e]" />
                        <p className="text-[#555b6b] font-bold text-[13px] md:text-sm">상단에 있는 '세상 속 이야기 만들기' 버튼을 눌러보세요!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. 문제 만들기 영역 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg shadow-sm">2</div>
                  <h2 className="text-xl md:text-2xl font-jua text-[#303442]">문제 만들기</h2>
                </div>
                
                <div className="pl-2 md:pl-10">
                  <div className="border-2 border-pink-100 rounded-[20px] overflow-hidden shadow-sm bg-white">
                    {/* 패널 헤더 */}
                    <div className="bg-pink-50 py-3 px-5 border-b-2 border-pink-100 flex items-center gap-2">
                      <h3 className="font-jua text-pink-700 text-base">OX 문제 5개 만들기</h3>
                      <div className="px-2 py-0.5 bg-white rounded-full text-[10px] font-bold text-pink-500 border border-pink-200">
                        수정 가능
                      </div>
                    </div>
                    
                    {/* 문제 목록 */}
                    <div className="p-3 md:p-4 flex flex-col gap-3">
                      <p className="text-[12px] md:text-[13px] text-[#555b6b] font-medium px-1 md:px-2">
                        친구에게 낼 문제를 만들고, 정답 O/X를 골라 주세요.
                      </p>
                      {questions.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                          {questions.map((q, idx) => (
                            <div key={q.id} className="flex flex-col sm:flex-row gap-3 sm:items-center p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                              <div className="flex items-center gap-3 shrink-0">
                                <div className="w-7 h-7 rounded-full bg-white border-2 border-pink-200 text-pink-600 flex items-center justify-center font-bold text-[13px] shadow-sm">
                                  {idx + 1}
                                </div>
                                <button
                                  onClick={() => handleAnswerToggle(q.id)}
                                  className="flex bg-white border-2 border-[#d9deea] rounded-lg overflow-hidden shadow-sm h-[34px]"
                                >
                                  <div className={`w-8 flex items-center justify-center font-bold text-sm transition-colors ${q.answer === 'O' ? 'bg-emerald-500 text-white' : 'text-[#8b909e] hover:bg-slate-50'}`}>O</div>
                                  <div className={`w-8 flex items-center justify-center font-bold text-sm transition-colors ${q.answer === 'X' ? 'bg-rose-500 text-white' : 'text-[#8b909e] hover:bg-slate-50'}`}>X</div>
                                </button>
                              </div>
                              <div className="flex-1 flex items-center gap-2 relative">
                                <input
                                  type="text"
                                  value={q.question}
                                  onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                                  className="w-full px-3.5 py-2 bg-white border-2 border-slate-100 rounded-lg focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all text-[#303442] font-medium text-[13px] md:text-[14px]"
                                />
                                <div className="absolute right-3 text-[#d9deea] pointer-events-none group-hover:text-pink-300 transition-colors">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[160px] gap-3 opacity-60">
                          <PenTool className="w-10 h-10 text-[#8b909e]" />
                          <p className="text-[#555b6b] font-bold text-[13px] md:text-[14px]">상단에 있는 'OX 문제 만들기' 버튼을 눌러보세요!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
            )}
            </div>

            {/* A4 하단: 마무리 영역 */}
            <div className="mt-8 pt-4 pb-2 border-t-2 border-[#d9deea] text-center relative z-10">
              <p className="text-[#8b909e] font-bold tracking-widest text-xs md:text-sm">
                TOONSCHOOL 단원 마무리 학습지
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentWorkspaceLayout>
  )
}
