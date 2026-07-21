/**
 * 툰스쿨 플립북 16:9 — OX 퀴즈 페이지(파스텔 자연 디자인).
 * 05-quiz-reference.png 기준. Stage 2 프레임/배경/카드 재사용.
 *
 * 정답 노출 정책 = 운영 FlipQuizPage 와 동일: selectedAnswer 가 있어야(선택해야)
 * 정답·해설 카드가 노출된다. 미선택 시 "왜 그럴까요?" 안내만.
 * Stage 1 매퍼의 FlipbookQuizPage 모델을 소비. answer는 normalizeOxAnswer 로 정규화됨.
 *
 * 보강(상호작용):
 *  - 정답/오답을 버튼 색상 + 체크/X 아이콘 + 격려 문구로 즉시 안내.
 *  - model.answerReliable 이 false 면 정답을 확정할 수 없어 "정답 정보를 불러오지 못했어요" 표시.
 *  - 결과는 aria-live 로 스크린리더에 안내.
 *  - 버튼은 data-no-nav 로 책장 넘김 스와이프/탭과 충돌하지 않는다.
 *  - 정답 효과음은 onPlayResult 콜백으로 부모가 음소거 설정과 연동해 재생.
 */
import { useEffect, useRef } from 'react'
import { Check, X } from 'lucide-react'
import type { FlipbookQuizPage } from '../flipbookPageModel'
import type { OxAnswer } from '../flipbookOxQuiz'
import FlipbookContentCard from '../FlipbookContentCard'

export type FlipQuizPagePastelProps = {
  model: FlipbookQuizPage
  totalQuestions?: number
  selectedAnswer?: OxAnswer
  onSelect?: (answer: OxAnswer) => void
  /** 답안 선택 즉시 결과 효과음 재생(부모가 음소거 상태와 연동). */
  onPlayResult?: (isCorrect: boolean) => void
}

const CHOICES: OxAnswer[] = ['O', 'X']

export default function FlipQuizPagePastel({
  model,
  totalQuestions = 5,
  selectedAnswer,
  onSelect,
  onPlayResult,
}: FlipQuizPagePastelProps) {
  const answered = !!selectedAnswer
  // 정답 값의 신뢰성. 명시되지 않으면 true 로 간주(기존 동작 유지).
  const answerReliable = model.answerReliable ?? true
  const isCorrect = answered && answerReliable && selectedAnswer === model.answer
  const question = model.question?.trim()

  // 정답 정보가 유효하지 않은 경우 경고는 1회만(민감정보 없음).
  const warnedRef = useRef(false)
  useEffect(() => {
    if (!answerReliable && !warnedRef.current) {
      warnedRef.current = true
      console.warn('[FlipQuiz] 정답 정보가 유효하지 않아 판정을 생략합니다.', { quizNumber: model.quizNumber })
    }
  }, [answerReliable, model.quizNumber])

  const handleSelect = (ans: OxAnswer) => {
    if (answered || !onSelect) return
    if (answerReliable && onPlayResult) {
      onPlayResult(ans === model.answer)
    }
    onSelect(ans)
  }

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
            if (answered && answerReliable) {
              if (isAnswer) cls.push('is-correct')
              else if (isPicked) cls.push('is-wrong')
            }
            // 정답 정보가 없으면 공정한 판정이 불가하므로 선택을 잠근다.
            const disabled = !answerReliable || answered || !onSelect
            return (
              <button
                key={ans}
                type="button"
                className={cls.join(' ')}
                aria-label={`${ans} 선택`}
                aria-pressed={isPicked}
                disabled={disabled}
                data-no-nav
                onClick={() => handleSelect(ans)}
              >
                <span className="flp-quiz-choice-letter">{ans}</span>
                <span className="flp-quiz-choice-lab">{ans === 'O' ? '맞아요' : '아니에요'}</span>
                {/* 정답 버튼: 체크 / 고른 오답 버튼: X — 색상 외에 아이콘으로도 결과 전달 */}
                {answered && answerReliable && isAnswer && (
                  <span className="flp-quiz-choice-mark is-correct" aria-hidden="true">
                    <Check strokeWidth={4} />
                  </span>
                )}
                {answered && answerReliable && isPicked && !isAnswer && (
                  <span className="flp-quiz-choice-mark is-wrong" aria-hidden="true">
                    <X strokeWidth={4} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <FlipbookContentCard
          tone={!answerReliable ? 'neutral' : answered ? (isCorrect ? 'green' : 'pink') : 'neutral'}
          soft
          className={`flp-quiz-result${answered && answerReliable ? ' is-revealed' : ''}${!answerReliable ? ' is-unreliable' : ''}`}
        >
          {!answerReliable ? (
            <div className="flp-quiz-result-prompt flp-quiz-result-fallback" aria-live="polite">
              <strong>이 문제의 정답 정보를 불러오지 못했어요.</strong>
              <span>다음 문제로 넘어가서 계속 풀어보아요!</span>
            </div>
          ) : answered ? (
            <>
              <span className={`flp-quiz-verdict-badge ${isCorrect ? 'is-correct' : 'is-wrong'}`} aria-hidden="true">
                {isCorrect ? '✓' : '✗'}
              </span>
              <div className="flp-quiz-result-body" aria-live="polite" aria-atomic="true">
                <div className={`flp-quiz-verdict ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                  {isCorrect
                    ? '정답이에요! 🎉 정확하게 알고 있네요.'
                    : `아쉬워요. 정답은 ${model.answer}예요.`}
                </div>
                {model.explanation?.trim() ? (
                  <p className="flp-quiz-explain">{model.explanation}</p>
                ) : (
                  <p className="flp-quiz-explain flp-quiz-explain-fallback">
                    선생님과 함께 왜 그런지 이야기해 보아요!
                  </p>
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
