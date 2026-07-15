/**
 * 툰스쿨 플립북 16:9 — 뒤표지 페이지(파스텔 자연 디자인).
 * 06-back-cover-reference.png 기준(마무리 정리 카드형). Stage 2 프레임/배경/카드 재사용.
 *
 * 실제 데이터 필드만 사용(작품명/이름/학급/과목/단원/날짜/오늘의핵심/낱말).
 * §5-4: QR 생성·작동 않는 공유 버튼·가짜 URL·가짜 학교·법률 문구 금지 → 모두 미포함.
 * 빈 필드(한줄다짐/선생님한마디/다음학습)는 안내 placeholder(가짜 값 아님).
 */
import type { FlipbookBackCoverPage } from '../flipbookPageModel'
import FlipbookContentCard from '../FlipbookContentCard'

function MetaRow({ label, value }: { label: string; value?: string }) {
  const v = value?.trim()
  if (!v) return null
  return (
    <div className="flp-back-meta-row">
      <span className="flp-back-meta-label">{label}</span>
      <span className="flp-back-meta-value">{v}</span>
    </div>
  )
}

export type FlipBackCoverPagePastelProps = {
  model: FlipbookBackCoverPage
}

export default function FlipBackCoverPagePastel({ model }: FlipBackCoverPagePastelProps) {
  const keyPoints = (model.keyPoints ?? []).filter((k) => k?.trim())
  const keywords = (model.keywords ?? []).filter((k) => k?.trim())
  const pledge = model.pledge?.trim()
  const teacherMessage = model.teacherMessage?.trim()
  const nextLearning = model.nextLearning?.trim()
  const workTitle = model.workTitle?.trim()

  const hasCreator =
    model.studentName?.trim() ||
    model.className?.trim() ||
    model.subject?.trim() ||
    model.unit?.trim() ||
    model.createdAt?.trim()

  return (
    <div className="flp-back">
      <aside className="flp-back-side">
        <h1 className="flp-back-title flp-title-font">마무리</h1>
        <p className="flp-back-desc">오늘 배운 내용을 정리하고,<br />앞으로의 배움으로 이어가요!</p>
        <div className="flp-back-cheer">🌟 끝까지 한 권을 완성한 나, 최고의 작가예요!</div>
        <div className="flp-back-brand flp-title-font">TOONSCHOOL · 학습만화</div>
      </aside>

      <section className="flp-back-main">
        {workTitle && <div className="flp-back-worktitle flp-title-font">{workTitle}</div>}

        <FlipbookContentCard tone="blue" className="flp-back-card">
          <div className="flp-back-card-head"><span className="flp-back-card-icon" aria-hidden="true">⭐</span> 오늘의 학습</div>
          {keyPoints.length ? (
            <ul className="flp-back-list">
              {keyPoints.map((k, i) => (
                <li key={i}>{k}</li>
              ))}
            </ul>
          ) : (
            <p className="flp-back-empty">오늘 배운 핵심을 한 줄씩 적어 보세요.</p>
          )}
        </FlipbookContentCard>

        <FlipbookContentCard tone="green" className="flp-back-card">
          <div className="flp-back-card-head"><span className="flp-back-card-icon" aria-hidden="true">📖</span> 기억할 낱말</div>
          {keywords.length ? (
            <div className="flp-back-keywords">
              {keywords.map((k, i) => (
                <span key={i} className="flp-back-keyword">#{k}</span>
              ))}
            </div>
          ) : (
            <p className="flp-back-empty">오늘 익힌 낱말을 적어 보세요.</p>
          )}
        </FlipbookContentCard>

        <FlipbookContentCard tone="yellow" className="flp-back-card">
          <div className="flp-back-card-head"><span className="flp-back-card-icon" aria-hidden="true">✏️</span> 한 줄 다짐</div>
          <p className={`flp-back-pledge${pledge ? '' : ' is-empty'}`}>
            {pledge || '오늘 배운 것을 한 문장으로 다짐해 보세요.'}
          </p>
        </FlipbookContentCard>

        <div className="flp-back-pair">
          <FlipbookContentCard tone="purple" className="flp-back-card flp-back-card--creator">
            <div className="flp-back-card-head"><span className="flp-back-card-icon" aria-hidden="true">❤️</span> 만든이</div>
            {hasCreator ? (
              <div className="flp-back-meta">
                <MetaRow label="이름" value={model.studentName} />
                <MetaRow label="학급" value={model.className} />
                <MetaRow label="과목" value={model.subject} />
                <MetaRow label="단원" value={model.unit} />
                <MetaRow label="완성일" value={model.createdAt} />
              </div>
            ) : (
              <p className="flp-back-empty">작품 정보를 불러오는 중이에요.</p>
            )}
          </FlipbookContentCard>

          <FlipbookContentCard tone="pink" className="flp-back-card flp-back-card--note">
            <div className="flp-back-card-head"><span className="flp-back-card-icon" aria-hidden="true">💬</span> 선생님 한마디 · 다음 학습</div>
            <p className={`flp-back-note-line${teacherMessage ? '' : ' is-empty'}`}>
              {teacherMessage || '선생님의 응원 한마디가 들어갈 자리예요.'}
            </p>
            <p className={`flp-back-note-line is-next${nextLearning ? '' : ' is-empty'}`}>
              {nextLearning ? `다음엔… ${nextLearning}` : '다음에 더 알아볼 것을 적어 보세요.'}
            </p>
          </FlipbookContentCard>
        </div>
      </section>
    </div>
  )
}
