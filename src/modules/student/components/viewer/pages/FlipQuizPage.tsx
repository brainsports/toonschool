import FlipPageChrome from '../FlipPageChrome'

type FlipQuizPageProps = {
  subject?: string
  unit?: string
  questionNum: number
  totalQuestions: number
  question: string
  correctAnswer: 'O' | 'X'
  selectedAnswer?: 'O' | 'X'
  explanation?: string
  onSelect: (answer: 'O' | 'X') => void
  pageNumber: number
  totalPages: number
}

/**
 * OX 퀴즈(p11~15) — 한 문제에 집중하는 “퀴즈쇼”.
 * 큰 O/X 버튼, 선택 전/후 상태 구분, 정답 여부 + 짧은 해설(풀이 팁).
 */
export default function FlipQuizPage({
  subject,
  unit,
  questionNum,
  totalQuestions,
  question,
  correctAnswer,
  selectedAnswer,
  explanation,
  onSelect,
  pageNumber,
  totalPages,
}: FlipQuizPageProps) {
  const answered = !!selectedAnswer
  const isCorrect = answered && selectedAnswer === correctAnswer

  return (
    <FlipPageChrome
      subject={subject}
      unit={unit}
      chipLabel="OX 퀴즈"
      chipTone="quiz"
      chipCount={`Q.${questionNum} / ${totalQuestions}`}
      pageNumber={pageNumber}
      totalPages={totalPages}
    >
      <div className="fb-quiz">
        <div className="fb-quiz-qnum">Q.{questionNum}</div>
        <h2 className="fb-quiz-question">{question}</h2>
        <div className="fb-quiz-ox">
          {(['O', 'X'] as const).map((ans) => {
            const cls = ['fb-ox', ans === 'O' ? 'is-o' : 'is-x']
            if (answered) {
              if (ans === correctAnswer) cls.push('is-correct')
              else if (ans === selectedAnswer) cls.push('is-wrong')
            }
            return (
              <button
                key={ans}
                type="button"
                className={cls.join(' ')}
                aria-label={`${ans} 선택`}
                aria-pressed={selectedAnswer === ans}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!answered) onSelect(ans)
                }}
                disabled={answered}
              >
                {ans}
                <span className="fb-ox-lab">{ans === 'O' ? '맞아요' : '아니에요'}</span>
              </button>
            )
          })}
        </div>
        {answered && (
          <div className="fb-quiz-result">
            <div className={`fb-quiz-badge ${isCorrect ? 'is-correct' : 'is-wrong'}`} aria-hidden="true">
              {isCorrect ? '✓' : '✗'}
            </div>
            <div className={`fb-quiz-explain ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
              <div className="fb-quiz-verdict">
                {isCorrect ? '정답이에요! 정확하게 알고 있네요.' : `정답은 ${correctAnswer} — 한 번 더 생각해 보세요.`}
              </div>
              {explanation && <div className="fb-quiz-body">{explanation}</div>}
            </div>
          </div>
        )}
      </div>
    </FlipPageChrome>
  )
}
