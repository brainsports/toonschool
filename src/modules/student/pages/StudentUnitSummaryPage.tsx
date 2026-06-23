// 단원 정리 페이지 - 단원 요약, 핵심 개념, 관련 이야기
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import { ArrowLeft, ArrowRight, Loader2, Sparkles, PenTool } from 'lucide-react'
import { mockUnitSummary, mockQuizQuestions } from '../data/studentMockData'

export default function StudentUnitSummaryPage() {
  const navigate = useNavigate()
  
  // 상태 관리
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryData, setSummaryData] = useState(mockUnitSummary.coreConcepts)
  
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [quizData, setQuizData] = useState(mockQuizQuestions.slice(0, 5))

  // 기존 저장 데이터 연동 (현재는 하드코딩 또는 mock 데이터 사용)
  const subject = '수학'
  const unitTitle = '분수의 덧셈과 뺄셈'
  const topicTitle = '우주 탐사선의 분수 연료 계산'

  // AI 연동을 위한 함수
  const handleGenerateSummary = () => {
    setIsGeneratingSummary(true)
    // AI 연동 시뮬레이션
    setTimeout(() => {
      setSummaryData(mockUnitSummary.coreConcepts)
      setIsGeneratingSummary(false)
    }, 1500)
  }

  const handleGenerateQuiz = () => {
    setIsGeneratingQuiz(true)
    // AI 연동 시뮬레이션
    setTimeout(() => {
      setQuizData(mockQuizQuestions.slice(0, 5))
      setIsGeneratingQuiz(false)
    }, 1500)
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
                핵심 내용을 확인하고 퀴즈를 풀어보세요.
              </p>
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-600 font-bold rounded-xl border-2 border-purple-200 shadow-sm hover:bg-purple-50 transition-all text-sm disabled:opacity-50"
            >
              {isGeneratingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="hidden sm:inline">핵심요약 만들기</span>
              <span className="sm:hidden">요약</span>
            </button>
            <button
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-purple-600 font-bold rounded-xl border-2 border-purple-200 shadow-sm hover:bg-purple-50 transition-all text-sm disabled:opacity-50"
            >
              {isGeneratingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
              <span className="hidden sm:inline">퀴즈 만들기</span>
              <span className="sm:hidden">퀴즈</span>
            </button>
            <button
              onClick={() => navigate('/student/quiz/intro')}
              className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-jua text-sm md:text-lg rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
              <span className="hidden sm:inline">퀴즈 만들기 가기</span>
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
              padding: 'clamp(1.5rem, 4vw, 3rem)',
              borderRadius: '1.5rem'
            }}
          >
            {/* A4 헤더: 정보 영역 (파스텔 과학 헤더) */}
            <div className="w-full bg-gradient-to-r from-[#a78bfa] to-[#d946ef] rounded-[8px] min-h-[42mm] mb-10 p-6 md:px-8 flex flex-col justify-center relative overflow-hidden shadow-sm">
              <div className="flex justify-between items-center w-full z-10">
                <div className="flex flex-col text-white">
                  <div className="font-bold text-xs md:text-sm tracking-widest text-white/90 mb-2">
                    TOONSCHOOL {subject} | 단원 마무리
                  </div>
                  <h1 className="text-3xl md:text-5xl font-jua mb-2">단원정리</h1>
                  <p className="text-xs md:text-base font-bold text-white/95">
                    {unitTitle}: 핵심 개념을 정리하고 퀴즈로 확인해요
                  </p>
                </div>
                
                {/* 우측 캐릭터 영역 */}
                <div className="hidden sm:flex items-end gap-3 self-end">
                  <div className="flex flex-col items-center">
                    <div className="w-[50px] h-[50px] rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-end justify-center backdrop-blur-sm shadow-sm">
                      <img src="/images/toonschool/characters/official/hana-teacher.png" alt="하나 선생님" className="w-[120%] h-[120%] object-cover object-top" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-[45px] h-[45px] rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-end justify-center backdrop-blur-sm shadow-sm">
                      <img src="/images/toonschool/characters/official/doyoon-boy.png" alt="도윤" className="w-[120%] h-[120%] object-cover object-top" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-[45px] h-[45px] rounded-full bg-white/20 border-2 border-white/40 overflow-hidden flex items-end justify-center backdrop-blur-sm shadow-sm">
                      <img src="/images/toonschool/characters/official/seoa-girl.png" alt="서아" className="w-[120%] h-[120%] object-cover object-top" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 장식용 원형 배경 */}
              <div className="absolute top-[-20%] right-[-5%] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-[-20%] left-[20%] w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* 본문 콘텐츠 영역 */}
            <div className="flex flex-col gap-10 flex-1">
              
              {/* 핵심 요약 영역 */}
              {summaryData && summaryData.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">1</div>
                    <h2 className="text-2xl font-jua text-slate-800">핵심요약</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-2 md:pl-10">
                    {summaryData.map((concept, idx) => {
                      const colors = [
                        'bg-purple-50 border-purple-200 text-purple-800',
                        'bg-sky-50 border-sky-200 text-sky-800',
                        'bg-teal-50 border-teal-200 text-teal-800'
                      ]
                      const colorClass = colors[idx % colors.length]
                      
                      return (
                        <div key={concept.id} className={`p-4 rounded-2xl border-2 ${colorClass}`}>
                          <div className="text-2xl mb-2">{concept.emoji}</div>
                          <h3 className="font-jua text-lg mb-2">{concept.title}</h3>
                          <p className="text-sm font-medium leading-relaxed opacity-90">{concept.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 단원 퀴즈 영역 */}
              {quizData && quizData.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-lg">2</div>
                    <h2 className="text-2xl font-jua text-slate-800">단원 퀴즈</h2>
                  </div>
                  
                  <div className="flex flex-col gap-4 pl-2 md:pl-10">
                    {quizData.map((quiz, idx) => (
                      <div key={quiz.id} className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 flex gap-4">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-white border-2 border-slate-200 text-slate-600 flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-700 text-base mb-3 leading-relaxed">
                            {quiz.question}
                          </p>
                          {quiz.type === 'multiple' && quiz.options ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {quiz.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                  <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-xs shrink-0">
                                    {i + 1}
                                  </div>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="w-full border-b-2 border-dashed border-slate-300 h-8 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 나의 한 줄 정리 영역 */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-lg">3</div>
                  <h2 className="text-2xl font-jua text-slate-800">나의 한 줄 정리</h2>
                </div>
                <div className="pl-2 md:pl-10">
                  <div className="w-full h-16 border-b-2 border-slate-300 bg-slate-50/50 rounded-t-xl px-4 flex items-end pb-2">
                    <span className="text-slate-400 font-medium">내가 배운 것을 한 문장으로 적어보세요.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* A4 하단: 마무리 영역 */}
            <div className="mt-12 pt-6 border-t-2 border-slate-200 text-center">
              <p className="text-slate-400 font-bold tracking-widest text-sm">
                TOONSCHOOL 단원 마무리 학습지
              </p>
            </div>
          </div>
        </div>
      </div>
    </StudentCreationLayout>
  )
}
