// 툰어휘사전 확장 패널 — 헤더 / 검색창 / 상태별 본문 / 최근 검색어 / 하단 버튼.
// 상태 기계(idle/loading/empty/unauthorized/error/success)는 부모(Widget)가 전달.
import { Search, X, Pin, Bookmark } from 'lucide-react'
import type { LookupState } from '../../types/vocabulary'
import VocabularyResultCards from './VocabularyResultCards'

const MASCOT = '/images/toon-vocabulary/toon-vocabulary-mascot.png'

export interface ToonVocabularyPanelProps {
  input: string
  onInputChange: (v: string) => void
  onSearch: () => void
  onClearInput: () => void
  state: LookupState
  recents: string[]
  onPickRecent: (w: string) => void
  onClearRecents: () => void
  onClose: () => void
  onSave: () => void
  onLearnMore: () => void
}

export default function ToonVocabularyPanel(props: ToonVocabularyPanelProps) {
  const {
    input, onInputChange, onSearch, onClearInput, state, recents,
    onPickRecent, onClearRecents, onClose, onSave, onLearnMore,
  } = props
  const hasResults = state.status === 'success' && state.data && state.data.results.length > 0

  return (
    <div className="tv-panel" role="dialog" aria-label="툰어휘사전">
      {/* 헤더 */}
      <div className="tv-header">
        <img className="tv-header__mascot" src={MASCOT} alt="" />
        <div className="tv-header__titles">
          <div className="tv-header__title-row">
            <span className="tv-header__title">툰어휘사전</span>
            <Pin className="tv-header__pin" size={18} />
          </div>
          <div className="tv-header__subtitle">모르는 단어를 쉽게 알려줄게!</div>
        </div>
        <button className="tv-header__close" onClick={onClose} aria-label="닫기">
          <X size={18} />
        </button>
      </div>

      {/* 검색창 */}
      <div style={{ padding: '14px 16px 0' }}>
        <div className="tv-search">
          <Search className="tv-search__icon" size={20} />
          <input
            className="tv-search__input"
            value={input}
            maxLength={30}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSearch() }}
            placeholder="궁금한 단어를 입력해 보세요"
            inputMode="text"
            enterKeyHint="search"
          />
          {input ? (
            <button className="tv-search__clear" onClick={onClearInput} aria-label="지우기">
              <X size={18} />
            </button>
          ) : null}
        </div>
      </div>

      {/* 본문 */}
      <div className="tv-body">
        <Body
          state={state}
          onPickRecent={onPickRecent}
          onClearRecents={onClearRecents}
          recents={recents}
          hasResults={!!hasResults}
        />
      </div>

      {/* 하단 버튼 */}
      <div className="tv-footer">
        <button className="tv-btn tv-btn--secondary" onClick={onSave} disabled={!hasResults}>
          <Bookmark size={18} /> 저장하기
        </button>
        <button className="tv-btn tv-btn--primary" onClick={onLearnMore} disabled={!hasResults}>
          <Search size={18} /> 더 알아보기
        </button>
      </div>
    </div>
  )
}

function Body({
  state, onPickRecent, onClearRecents, recents, hasResults,
}: {
  state: LookupState
  onPickRecent: (w: string) => void
  onClearRecents: () => void
  recents: string[]
  hasResults: boolean
}) {
  if (state.status === 'loading') {
    return (
      <div className="tv-state">
        <div className="tv-spinner" />
        <div className="tv-state__title">단어의 뜻을 찾고 있어요...</div>
      </div>
    )
  }
  if (state.status === 'unauthorized') {
    return (
      <div className="tv-state">
        <img className="tv-state__mascot" src={MASCOT} alt="" />
        <div className="tv-state__title">로그인이 필요해요</div>
        <div className="tv-state__text">{state.message}</div>
      </div>
    )
  }
  if (state.status === 'empty') {
    return (
      <div className="tv-state">
        <img className="tv-state__mascot" src={MASCOT} alt="" />
        <div className="tv-state__title">앗, 단어를 못 찾았어요</div>
        <div className="tv-state__text">{state.message}</div>
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="tv-state">
        <img className="tv-state__mascot" src={MASCOT} alt="" />
        <div className="tv-state__title">문제가 생겼어요</div>
        <div className="tv-state__text">{state.message}</div>
      </div>
    )
  }
  if (hasResults && state.data) {
    return (
      <>
        <VocabularyResultCards results={state.data.results} aiStatus={state.data.aiStatus} />
        <div className="tv-source">
          출처 · {state.data.source.name} ({state.data.source.license})
        </div>
        {recents.length > 0 ? (
          <RecentSection recents={recents} onPickRecent={onPickRecent} onClearRecents={onClearRecents} />
        ) : null}
      </>
    )
  }
  // idle
  return (
    <>
      <div className="tv-state">
        <img className="tv-state__mascot" src={MASCOT} alt="" />
        <div className="tv-state__title">툰어휘사전이에요!</div>
        <div className="tv-state__text">궁금한 단어를 입력하면 쉽게 설명해 줄게!</div>
      </div>
      {recents.length > 0 ? (
        <RecentSection recents={recents} onPickRecent={onPickRecent} onClearRecents={onClearRecents} />
      ) : null}
    </>
  )
}

function RecentSection({
  recents, onPickRecent, onClearRecents,
}: {
  recents: string[]
  onPickRecent: (w: string) => void
  onClearRecents: () => void
}) {
  return (
    <div>
      <div className="tv-recent__head">
        <span className="tv-recent__title">최근 검색어</span>
        <button className="tv-recent__clear" onClick={onClearRecents}>전체 삭제</button>
      </div>
      <div className="tv-recent__tags">
        {recents.map((w) => (
          <button key={w} className="tv-tag" onClick={() => onPickRecent(w)}>
            {w}
          </button>
        ))}
      </div>
    </div>
  )
}
