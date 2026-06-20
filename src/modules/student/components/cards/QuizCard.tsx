// 퀴즈 문제 카드 컴포넌트
import { useState } from 'react'
import type { QuizQuestion } from '../../types/studentFlow'
import { XCircle, CheckCircle2 } from 'lucide-react'
import StudentWideCard from '../layout/StudentWideCard'

interface QuizCardProps {
  question: QuizQuestion
  questionNumber: number
  totalQuestions: number
  onAnswer?: (answer: string | number) => void
}

export default function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: QuizCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  const handleSelect = (option: string) => {
    setSelectedAnswer(option)
    onAnswer?.(option)
  }

  return (
    <StudentWideCard>
      
      {/* 문제 번호 및 유형 */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <span className="text-sm font-jua text-white bg-purple-500/50 border border-purple-400/50 px-4 py-1.5 rounded-xl shadow-sm">
          STAGE {questionNumber} / {totalQuestions}
        </span>
        <span className={`text-xs font-jua px-3 py-1.5 rounded-xl shadow-sm border ${
          question.type === 'OX'
            ? 'bg-emerald-500/30 text-emerald-100 border-emerald-400/50'
            : 'bg-sky-500/30 text-sky-100 border-sky-400/50'
        }`}>
          {question.type === 'OX' ? '⭕❌ OX 퀴즈' : '🔤 객관식'}
        </span>
      </div>

      {/* 문제 제시문 */}
      <div className="bg-gradient-to-b from-purple-900/40 to-indigo-900/40 border border-white/10 rounded-[2rem] p-6 text-center relative overflow-hidden shadow-inner">
        <p className="text-5xl mb-3 animate-bounce-gentle select-none">{question.emoji}</p>
        <p className="text-lg md:text-xl font-bold text-white drop-shadow-sm leading-relaxed">{question.question}</p>
      </div>

      {/* 선택지 */}
      <div className={`grid gap-4 ${question.type === 'OX' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {question.options?.map((option) => {
          const isSelected = selectedAnswer === option
          const isCorrect = selectedAnswer && option === String(question.answer)
          const isWrong = selectedAnswer && isSelected && option !== String(question.answer)

          return (
            <button
              key={option}
              type="button"
              disabled={!!selectedAnswer}
              onClick={() => handleSelect(option)}
              className={`
                card-glass py-5 px-6 font-jua text-lg transition-all duration-200
                ${question.type === 'OX' ? 'text-3xl py-8' : ''}
                ${!selectedAnswer
                  ? 'card-glass-interactive text-slate-200 hover:border-white/20'
                  : isCorrect
                  ? 'bg-emerald-500/30 border-emerald-400/50 text-emerald-100 animate-pulse'
                  : isWrong
                  ? 'bg-rose-500/30 border-rose-400/50 text-rose-100'
                  : isSelected
                  ? 'bg-purple-500/30 border-purple-400/50 text-purple-100'
                  : 'opacity-50 cursor-not-allowed bg-white/5 border-white/5 text-slate-500'
                }
              `}
            >
              <span>{option}</span>
            </button>
          )
        })}
      </div>

      {/* 정답 피드백 칭찬 알림 */}
      {selectedAnswer && (
        <div 
          className={`
            p-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-jua animate-fade-in border shadow-sm backdrop-blur-sm
            ${selectedAnswer === String(question.answer)
              ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-900/40 border-rose-500/50 text-rose-200'}
          `}
        >
          {selectedAnswer === String(question.answer) ? (
            <>
              <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              <span>정답입니다! 참 잘했어요! (+10점) 🌟</span>
            </>
          ) : (
            <>
              <XCircle className="w-6 h-6 stroke-[3]" />
              <span>아쉽지만 오답이에요! 정답은 "{question.answer}"입니다. 🚀</span>
            </>
          )}
        </div>
      )}

    </StudentWideCard>
  )
}
