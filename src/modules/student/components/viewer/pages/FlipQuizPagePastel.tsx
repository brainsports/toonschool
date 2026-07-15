/**
 * 툰스쿨 플립북 16:9 — OX 퀴즈 페이지(파스텔 자연 디자인).
 * 05-quiz-reference.png 기준. Stage 2 프레임/배경/카드 재사용.
 *
 * 정답 노출 정책 = 운영 FlipQuizPage 와 동일: selectedAnswer 가 있어야(선택해야)
 * 정답·해설 카드가 노출된다. 미선택 시 "왜 그럴까요?" 안내만.
 * Stage 1 매퍼의 FlipbookQuizPage 모델을 소비. answer는 normalizeOxAnswer 로 정규화됨.
 */
import type { FlipbookQuizPage } from '../flipbookPageModel'
import type { OxAnswer } from '../flipbookOxQuiz'
import FlipbookContentCard from '../FlipbookContentCard'

export type FlipQuizPagePastelProps = {
  model: FlipbookQuizPage
  totalQuestions?: number
  selectedAnswer?: OxAnswer
  onSelect?: (answer: OxAnswer) => void
}

const CHOICES: OxAnswer[] = ['O', 'X']

export default function FlipQuizPagePastel({
  model,
  totalQuestions = 5,
  selectedAnswer,
  onSelect,
}: FlipQuizPagePastelProps) {
  const answered = !!selectedAnswer
  const isCorrect = answered && selectedAnswer === model.answer
  const question = model.question?.trim()

  return (
    <div className="flp-quiz">
      <aside className="flp-quiz-side">
        <h2 className="flp-quiz-title flp-title-font">
          <span className="flp-quiz-title-green">팡팡!</span>{' '}
          <span className="flp-quiz-title-blue">OX</span>{' '}
          <span className="flp-quiz-title-red">퀴즈</span>
        </h2>
        <p className="flp-quiz-sub">문제를 읽고 O 또는 X를 선택해 보세요!</p>
        <div className="flp-quiz-progress flp-title-font">
          Q.{model.quizNumber} <span className="flp-quiz-progress-total">/ {totalQuestions}</span>
        </div>
        <div className="flp-quiz-helper" aria-label="도움말">
          <span className="flp-quiz-helper-icon" aria-hidden="true">💡</span>
          <span>천천히 읽고, 내가 아는 것과 비교해 보아요!</span>
        </div>
      </aside>

      <section className="flp-quiz-main">
        <FlipbookContentCard soft className="flp-quiz-qcard">
          <span className="flp-quiz-qbadge">🔍 퀴즈 문제</span>
          <p className={`flp-quiz-question${question ? '' : ' is-empty'}`}>
            {question || '문제를 준비 중이에요.'}
          </p>
          {model.hint?.trim() && (
            <div className="flp-quiz-hint">
              <span className="flp-quiz-hint-badge">힌트</span>
              <span>{model.hint}</span>
            </div>
          )}
        </FlipbookContentCard>

        <div className="flp-quiz-ox">
          {CHOICES.map((ans) => {
            const isAnswer = ans === model.answer
            const isPicked = answered && selectedAnswer === ans
            const cls = ['flp-quiz-choice', ans === 'O' ? 'is-o' : 'is-x']
            if (answered) {
              if (isAnswer) cls.push('is-correct')
              else if (isPicked) cls.push('is-wrong')
            }
            return (
              <button
                key={ans}
                type="button"
                className={cls.join(' ')}
                aria-label={`${ans} 선택`}
                aria-pressed={isPicked}
                disabled={answered || !onSelect}
                onClick={() => !answered && onSelect?.(ans)}
              >
                <span className="flp-quiz-choice-letter">{ans}</span>
                <span className="flp-quiz-choice-lab">{ans === 'O' ? '맞아요' : '아니에요'}</span>
              </button>
            )
          })}
        </div>

        <FlipbookContentCard
          tone={answered ? (isCorrect ? 'green' : 'pink') : 'neutral'}
          soft
          className={`flp-quiz-result${answered ? ' is-revealed' : ''}`}
        >
          {answered ? (
            <>
              <span className={`flp-quiz-verdict-badge ${isCorrect ? 'is-correct' : 'is-wrong'}`} aria-hidden="true">
                {isCorrect ? '✓' : '✗'}
              </span>
              <div className="flp-quiz-result-body">
                <div className={`flp-quiz-verdict ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                  {isCorrect ? '정답이에요! 정확하게 알고 있네요.' : `정답은 ${model.answer} — 한 번 더 생각해 보세요.`}
                </div>
                {model.explanation?.trim() && (
                  <p className="flp-quiz-explain">{model.explanation}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <span className="flp-quiz-result-prompt-badge" aria-hidden="true">🌿</span>
              <div className="flp-quiz-result-prompt">
                <strong>왜 그럴까요?</strong>
                <span>O나 X를 선택하면 정답과 이유를 알아보아요!</span>
              </div>
            </>
          )}
        </FlipbookContentCard>
      </section>
    </div>
  )
}
