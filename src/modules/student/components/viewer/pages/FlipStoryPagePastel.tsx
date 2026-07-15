/**
 * 툰스쿨 플립북 16:9 — 세상 속 이야기 페이지(파스텔 자연 디자인).
 * 04-story-reference.png 기준. Stage 2 프레임/배경/카드 재사용.
 * 좌측 안내(타입 배지 + 3종 표시 + 목적 + 안내 말풍선) / 우측 이야기(제목·이미지·본문·핵심 사실·생각 한 줄).
 * Stage 1 매퍼가 만든 FlipbookStoryPage 모델을 소비한다.
 */
import type { FlipbookStoryPage, StoryCategory } from '../flipbookPageModel'
import FlipbookContentCard from '../FlipbookContentCard'

const STORY_TYPES: Array<{ key: StoryCategory; label: string; icon: string }> = [
  { key: 'history', label: '역사 이야기', icon: '🏛️' },
  { key: 'latest', label: '최신 이야기', icon: '🌐' },
  { key: 'life', label: '생활 연결', icon: '🏡' },
]

const STORY_PURPOSE: Record<StoryCategory, string> = {
  history: '옛날 사람들은 이 원리를 어떻게 활용했을까요?',
  latest: '오늘날 이 개념을 어디에서 볼 수 있을까요?',
  life: '우리 주변에서 어떻게 찾아볼 수 있을까요?',
}

const STORY_GUIDE: Record<StoryCategory, string> = {
  history: '과거의 모습을 상상하며 읽어 보아요!',
  latest: '요즘 세상과 연결해 생각해 보아요!',
  life: '내 생활 속 예를 떠올려 보아요!',
}

export type FlipStoryPagePastelProps = {
  model: FlipbookStoryPage
  storyNumber?: number
  totalStories?: number
}

export default function FlipStoryPagePastel({
  model,
  storyNumber = 1,
  totalStories = 3,
}: FlipStoryPagePastelProps) {
  const facts = (model.facts ?? []).filter((f) => f?.trim())
  const body = model.body?.trim()
  const reflection = model.reflection?.trim()
  const guide = STORY_GUIDE[model.category]

  return (
    <div className="flp-story">
      <aside className="flp-story-side">
        <div className="flp-story-badge flp-title-font">{model.categoryLabel}</div>
        {storyNumber > 0 && <div className="flp-story-no">이야기 {storyNumber} / {totalStories}</div>}

        <div className="flp-story-types" role="list" aria-label="세상 속 이야기 3종">
          {STORY_TYPES.map((t) => (
            <span
              key={t.key}
              role="listitem"
              className={`flp-story-type${t.key === model.category ? ' is-active' : ''}`}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </span>
          ))}
        </div>

        <p className="flp-story-purpose">{STORY_PURPOSE[model.category]}</p>

        <div className="flp-story-helper" aria-label="도움말">
          <span className="flp-story-helper-icon" aria-hidden="true">💬</span>
          <span className="flp-story-helper-text">{guide}</span>
        </div>
      </aside>

      <section className="flp-story-main">
        <FlipbookContentCard soft className="flp-story-card">
          <h2 className="flp-story-title flp-title-font">{model.title || model.categoryLabel}</h2>

          <div className="flp-story-image" aria-label="이야기 대표 그림">
            {model.imageUrl ? (
              <img src={model.imageUrl} alt={`${model.title} 대표 그림`} />
            ) : (
              <div className="flp-story-image-empty">
                <span aria-hidden="true">🌱</span>
                <span>이야기 그림을 준비 중이에요.</span>
              </div>
            )}
          </div>

          <p className={`flp-story-body${body ? '' : ' is-empty'}`}>
            {body || '이 이야기의 내용을 곧 보여 드릴게요.'}
          </p>

          {facts.length > 0 && (
            <ul className="flp-story-facts">
              {facts.map((f, i) => (
                <li key={i} className="flp-story-fact">
                  <span className="flp-story-fact-no">사실 {i + 1}</span>
                  <span className="flp-story-fact-text">{f}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flp-story-think">
            <span className="flp-story-think-badge">✏️ 생각 한 줄</span>
            <p className="flp-story-think-text">
              {reflection || '이 이야기를 읽고 떠오른 생각을 한 문장으로 적어 보아요!'}
            </p>
          </div>
        </FlipbookContentCard>
      </section>
    </div>
  )
}
