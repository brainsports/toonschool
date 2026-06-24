import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import ToonSchoolCharacterBadgeGroup from '../components/layout/ToonSchoolCharacterBadgeGroup'
import { ArrowLeft, ArrowRight, Loader2, BookOpen, PenTool, Edit3, Landmark, Newspaper, Home, Globe, Bot, Lightbulb, Clock, Magnet, Droplet, ShoppingBag, ScrollText } from 'lucide-react'

type StoryType = 'history' | 'latest' | 'life';

interface WorldStory {
  type: StoryType;
  title: string;
  content: string;
}

interface OXQuestion {
  id: string;
  answer: 'O' | 'X';
  question: string;
}

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

  // 기존 저장 데이터 연동 (현재는 하드코딩 또는 mock 데이터 사용)
  const subject = '수학'
  const unitTitle = '분수의 덧셈과 뺄셈'

  // AI 연동을 위한 함수
  const handleGenerateStory = () => {
    setIsGeneratingStory(true)
    setTimeout(() => {
      setStories({
        history: {
          type: 'history',
          title: '분수는 어디에서 시작되었을까?',
          content: '아주 오래전, 사람들은 빵이나 곡식을 공평하게 나누는 것이 필요했어요.\n그래서 어떤 양을 똑같이 나누는 방법을 생각해 냈지요.\n이렇게 생겨난 생각이 바로 분수의 시작이 되었답니다!'
        },
        latest: {
          type: 'latest',
          title: '우주에서도 분수를 쓴다고?',
          content: '우주선이 목적지까지 가려면 연료를 얼마나 써야 할지 정확히 계산해야 해요.\n이때 전체 연료를 몇 분의 몇으로 나눌지 계산하는 데 분수가 꼭 필요하답니다!\n과학자들은 지금도 매일 분수 계산을 하고 있어요.'
        },
        life: {
          type: 'life',
          title: '피자를 나눌 때 쓰는 마법',
          content: '친구들과 피자 한 판을 똑같이 나누어 먹을 때, 어떻게 자르나요?\n8조각으로 자른 피자 중 2조각을 먹었다면, 전체의 2/8를 먹은 거예요!\n분수는 이렇게 우리 주변에서 쉽게 찾을 수 있어요.'
        }
      })
      setIsGeneratingStory(false)
    }, 1500)
  }

  const handleGenerateQuiz = () => {
    setIsGeneratingQuiz(true)
    setTimeout(() => {
      setQuestions([
        { id: '1', answer: 'O', question: '1/2은 전체를 똑같이 두 부분으로 나눈 것 중 하나이다.' },
        { id: '2', answer: 'O', question: '분모는 전체를 나눈 조각의 개수를 나타낸다.' },
        { id: '3', answer: 'X', question: '3/4와 4/3은 같은 크기의 분수이다.' },
        { id: '4', answer: 'O', question: '분수는 일상생활에서 여러 가지로 활용된다.' },
        { id: '5', answer: 'X', question: '1보다 큰 분수는 가분수라고 한다.' }
      ])
      setIsGeneratingQuiz(false)
    }, 1500)
  }

  const handleQuestionChange = (id: string, newText: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, question: newText } : q))
  }

  const handleAnswerToggle = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, answer: q.answer === 'O' ? 'X' : 'O' } : q))
  }

  return (
    <StudentCreationLayout currentStep="summary" maxWidth="full" bgVariant="default">
      <div className="w-full flex-1 flex flex-col min-h-0 bg-[#f3f4f7] relative">
        
        {/* 상단 툴바 영역 */}
        <div className="flex justify-between items-center px-4 md:px-8 py-4 shrink-0 relative z-20">
          {/* Left: Prev Button & Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student/comic/full')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-white font-jua text-base rounded-full border border-white/10 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              이전으로
            </button>
            <div>
              <h1 className="text-2xl font-jua text-slate-800">단원 정리</h1>
              <p className="text-sm font-bold text-slate-600 hidden md:block">
                세상과 연결하고, 내가 문제를 만들어 봐요!
              </p>
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleGenerateStory}
              disabled={isGeneratingStory}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-600 font-bold rounded-xl border-2 border-purple-200 shadow-sm hover:bg-purple-50 transition-all text-sm disabled:opacity-50"
            >
              {isGeneratingStory ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              <span className="hidden sm:inline">세상 속 이야기 만들기</span>
              <span className="sm:hidden">이야기</span>
            </button>
            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-600 font-bold rounded-xl border-2 border-purple-200 shadow-sm hover:bg-purple-50 transition-all text-sm disabled:opacity-50"
            >
              {isGeneratingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
              <span className="hidden sm:inline">OX 문제 만들기</span>
              <span className="sm:hidden">문제</span>
            </button>
            <button
              onClick={() => navigate('/student/back-cover')}
              className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-jua text-sm md:text-lg rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
              <span className="hidden sm:inline">뒤표지 만들기</span>
              <span className="sm:hidden">다음</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 중앙 A4 학습지 스크롤 영역 */}
        <div className="flex-1 w-full overflow-auto flex justify-center py-8">
          <div 
            className="bg-white shadow-sm border border-slate-200 flex flex-col relative shrink-0"
            style={{ 
              width: '100%',
              maxWidth: '800px', 
              minHeight: '1131px', // A4 비율 대략 (800 * 1.414)
              padding: 'clamp(1.2rem, 3vw, 2rem)',
              borderRadius: '1.5rem'
            }}
          >
            {/* A4 헤더 */}
            <div className="w-full bg-gradient-to-r from-[#a78bfa] to-[#ec4899] rounded-[16px] min-h-[90px] mb-6 p-4 md:px-6 flex flex-col justify-center relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-center w-full z-10">
                <div className="flex flex-col text-white">
                  <div className="font-bold text-[10px] md:text-xs tracking-widest text-white/90 mb-1">
                    TOONSCHOOL {subject} | 단원 마무리
                  </div>
                  <h1 className="text-2xl md:text-3xl font-jua mb-1">단원 정리</h1>
                  <p className="text-[11px] md:text-[13px] font-bold text-white/95">
                    {unitTitle}을 세상과 연결하고, 문제로 만들어 봐요!
                  </p>
                </div>
                
                {/* 우측 캐릭터 영역 */}
                <ToonSchoolCharacterBadgeGroup 
                  className="hidden sm:flex self-end mb-1" 
                  textColorClass="text-slate-800" 
                />
              </div>
              
              {/* 장식용 원형 배경 */}
              <div className="absolute top-[-20%] right-[-5%] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-[-20%] left-[20%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* 본문 콘텐츠 영역 */}
            <div className="flex flex-col gap-10 flex-1 py-2">
              
              {/* 1. 세상 속 이야기 영역 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg shadow-sm">1</div>
                  <h2 className="text-xl md:text-2xl font-jua text-slate-800">세상 속 이야기</h2>
                </div>
                
                <div className="pl-2 md:pl-10 flex flex-col">
                  {/* 탭 버튼들 */}
                  <div className="flex gap-2 px-4 mb-[-2px] relative z-10 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => setActiveStoryTab('history')}
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
                      onClick={() => setActiveStoryTab('latest')}
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
                      onClick={() => setActiveStoryTab('life')}
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
                          <h3 className="text-xl md:text-2xl font-jua text-slate-800 mb-2 md:mb-3">{stories[activeStoryTab]?.title}</h3>
                          <p className="text-slate-700 font-medium leading-[1.6] whitespace-pre-wrap text-[13px] md:text-[14px]">
                            {stories[activeStoryTab]?.content}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center min-h-[160px] gap-3 opacity-60">
                        <BookOpen className="w-10 h-10 text-slate-400" />
                        <p className="text-slate-500 font-bold text-[13px] md:text-sm">상단에 있는 '세상 속 이야기 만들기' 버튼을 눌러보세요!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. 문제 만들기 영역 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg shadow-sm">2</div>
                  <h2 className="text-xl md:text-2xl font-jua text-slate-800">문제 만들기</h2>
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
                      <p className="text-[12px] md:text-[13px] text-slate-500 font-medium px-1 md:px-2">
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
                                  className="flex bg-white border-2 border-slate-200 rounded-lg overflow-hidden shadow-sm h-[34px]"
                                >
                                  <div className={`w-8 flex items-center justify-center font-bold text-sm transition-colors ${q.answer === 'O' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>O</div>
                                  <div className={`w-8 flex items-center justify-center font-bold text-sm transition-colors ${q.answer === 'X' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}>X</div>
                                </button>
                              </div>
                              <div className="flex-1 flex items-center gap-2 relative">
                                <input
                                  type="text"
                                  value={q.question}
                                  onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                                  className="w-full px-3.5 py-2 bg-white border-2 border-slate-100 rounded-lg focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all text-slate-700 font-medium text-[13px] md:text-[14px]"
                                />
                                <div className="absolute right-3 text-slate-300 pointer-events-none group-hover:text-pink-300 transition-colors">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[160px] gap-3 opacity-60">
                          <PenTool className="w-10 h-10 text-slate-400" />
                          <p className="text-slate-500 font-bold text-[13px] md:text-[14px]">상단에 있는 'OX 문제 만들기' 버튼을 눌러보세요!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* A4 하단: 마무리 영역 */}
            <div className="mt-8 pt-4 pb-2 border-t-2 border-slate-200 text-center relative z-10">
              <p className="text-slate-400 font-bold tracking-widest text-xs md:text-sm">
                TOONSCHOOL 단원 마무리 학습지
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentCreationLayout>
  )
}
