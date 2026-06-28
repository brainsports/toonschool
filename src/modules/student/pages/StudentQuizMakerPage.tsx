// 단원 퀴즈 만들기 페이지 - AI가 만든 퀴즈 5개
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import QuizCard from '../components/cards/QuizCard'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { mockQuizQuestions } from '../data/studentMockData'
import { Trophy } from 'lucide-react'
import StudentPrimaryActionButton from '../components/layout/StudentPrimaryActionButton'

export default function StudentQuizMakerPage() {
  const navigate = useNavigate()
  const [quizSet] = useState(mockQuizQuestions)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)

  const handleAnswer = (answer: string | number, currentQuestionIndex: number) => {
    const isCorrect = String(answer) === String(quizSet[currentQuestionIndex].answer)
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1)
    }

    const newCount = answeredCount + 1
    setAnsweredCount(newCount)
  }

  const allAnswered = answeredCount >= quizSet.length

  return (
    <StudentCreationLayout currentStep="quiz" bgVariant="space" maxWidth="full">
      <div className="flex flex-col gap-6 animate-fade-in pb-8">
        
        {/* 헤더 영역 */}
        <div className="text-center mb-4">
          <h1 className="text-[2rem] font-jua text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">마무리 퀴즈</h1>
          <p className="text-base font-bold text-slate-200 mt-2 bg-white/10 border border-white/20 inline-block px-4 py-1.5 rounded-full backdrop-blur-md">
            만화에서 배운 내용을 퀴즈로 풀어볼까요?
          </p>
        </div>

        <div className="space-y-6">
          {/* 퀴즈 문제 목록 */}
          <div className="space-y-8">
            {quizSet.map((question, index) => (
              <QuizCard
                key={question.id}
                question={question}
                questionNumber={index + 1}
                totalQuestions={quizSet.length}
                onAnswer={(ans) => handleAnswer(ans, index)}
              />
            ))}
          </div>

          {/* 퀴즈 완료 축하 안내 */}
          {allAnswered && (
            <div className="card-glass bg-emerald-900/20 border border-emerald-500/30 rounded-[2rem] p-8 text-center animate-bounce-gentle shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Trophy className="w-8 h-8 text-emerald-200" />
              </div>
              <h3 className="text-xl font-jua text-emerald-100">퀴즈 완료!</h3>
              <p className="text-base font-bold text-emerald-200 mt-2">
                {quizSet.length}문제 중 {correctAnswers}문제를 맞췄어요!
              </p>
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex gap-4 pt-8 border-t border-white/10 mt-auto">
          <button
            onClick={() => navigate('/student/unit-summary')}
            className="card-glass card-glass-interactive flex-1 min-h-[72px] text-slate-300 font-jua text-xl md:text-2xl flex items-center justify-center rounded-full"
          >
            <ArrowLeft className="w-6 h-6 stroke-[3] mr-2" />
            <span>이전</span>
          </button>

          <div className="flex-[2] w-full">
            <StudentPrimaryActionButton
              disabled={!allAnswered}
              onClick={() => navigate('/student/back-cover')}
            >
              <span>뒤표지 만들기 🎨</span>
              <ArrowRight className="w-6 h-6 stroke-[3] ml-2" />
            </StudentPrimaryActionButton>
          </div>
        </div>

      </div>
    </StudentCreationLayout>
  )
}
