/**
 * 툰스쿨 플립북 16:9 — 표지(cover) 페이지(파스텔 자연 디자인).
 * 02-cover-reference.png 기준. 모든 글자/정보는 DOM 으로 렌더링하고, 대표 그림만 데이터 이미지.
 * Stage 1 매퍼가 만든 FlipbookCoverPage 모델을 소비한다.
 *
 * 참고: 기존 FlipCoverPage.tsx(코믹 매거진, 1400×990)는 라이브 뷰어와 연결되어 있어
 * Stage 5(뷰어 통합)에서 이 컴포넌트로 교체한다. 이 파일은 신규 표지 구현이다.
 */
import type { FlipbookCoverPage } from '../flipbookPageModel'

const SUBTITLE = '재미있게 배우는 우리 단원 이야기'

function todayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
}

/** 글자별 파스텔 색상 부제목 */
function ColoredSubtitle({ text }: { text: string }) {
  return (
    <p className="flp-cover-sub" aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="flp-char">{ch === ' ' ? ' ' : ch}</span>
      ))}
    </p>
  )
}

function CoverField({ label, value, empty }: { label: string; value: string; empty?: boolean }) {
  return (
    <div className="flp-field">
      <span className="flp-field-label">{label}</span>
      <span className={`flp-field-value ${empty ? 'is-empty' : ''}`}>{value}</span>
    </div>
  )
}

function CoverFootItem({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'blue' | 'pink' | 'green'
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="flp-foot-item">
      <span className={`flp-foot-icon is-${tone}`}>{icon}</span>
      <span className="flp-foot-meta">
        <span className="flp-foot-label">{label}</span>
        <span className="flp-foot-value">{value}</span>
      </span>
    </div>
  )
}

export type FlipCoverPagePastelProps = {
  model: FlipbookCoverPage
}

export default function FlipCoverPagePastel({ model }: FlipCoverPagePastelProps) {
  const subject = model.subject?.trim()
  const unit = model.unit?.trim()
  const topic = model.topic?.trim()
  const learningGoal =
    model.learningGoal?.trim() ||
    (model.keywords?.[0]
      ? `「${model.keywords[0]}」 등 핵심 개념 학습`
      : '이 단원의 핵심을 재미있게 학습해요.')
  const studentName = model.studentName?.trim() || '나'
  const className = model.className?.trim() || (model.grade?.trim() ? model.grade.trim() : '—')
  const date = model.createdAt?.trim() || todayStr()

  return (
    <div className="flp-cover">
      <span className="flp-cover-ribbon">나만의 플립북</span>

      <header className="flp-cover-head">
        <h1 className="flp-cover-title flp-title-font">툰스쿨 학습만화</h1>
        <ColoredSubtitle text={SUBTITLE} />
      </header>

      <div className="flp-cover-body">
        <section className="flp-cover-card flp-card" aria-label="학습 정보">
          <p className="flp-cover-card-title">학습 정보</p>
          <CoverField label="과목" value={subject || '—'} empty={!subject} />
          <CoverField label="단원" value={unit || '—'} empty={!unit} />
          <CoverField label="주제" value={topic || '—'} empty={!topic} />
          <CoverField label="학습 목표" value={learningGoal} empty={!model.learningGoal?.trim()} />
        </section>

        <section className="flp-cover-hero flp-card" aria-label="대표 그림">
          {model.heroImageUrl ? (
            <img src={model.heroImageUrl} alt={`${topic || '대표'} 만화`} />
          ) : (
            <div className="flp-hero-empty">
              <span className="flp-hero-icon" aria-hidden="true">🎨</span>
              <span>대표 그림 또는 캐릭터를 넣어주세요!</span>
            </div>
          )}
        </section>
      </div>

      <footer className="flp-cover-foot flp-card">
        <CoverFootItem tone="blue" icon="🙂" label="이름" value={studentName} />
        <CoverFootItem tone="pink" icon="🏫" label="학급" value={className} />
        <CoverFootItem tone="green" icon="📅" label="날짜" value={date} />
      </footer>
    </div>
  )
}
