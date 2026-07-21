// 툰어휘사전 확장 패널 — 헤더 / 검색창 / 상태별 본문 / 최근 검색어 / 하단 버튼.
// 상태 기계(idle/loading/empty/unauthorized/error/success)와 저장 상태(saveState)는 부모(Widget)가 전달.
// 뜻(sense) 선택도 부모가 제어(selSense/onSelSenseChange) — 저장 대상 식별을 위해.
import { Search, X, Pin, Bookmark } from 'lucide-react'
import type { LookupState } from '../../types/vocabulary'
import VocabularyResultCards from './VocabularyResultCards'

const MASCOT = '/images/toon-vocabulary/toon-vocabulary-mascot.png'

// 저장 버튼 라벨/상태.
type SaveState = 'idle' | 'saving' | 'saved' | 'exists' | 'error'

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
  saveState: SaveState
  saveMessage: string | null
  selSense: number
  onSelSenseChange: (i: number) => void
}

export default function ToonVocabularyPanel(props: ToonVocabularyPanelProps) {
  const {
    input, onInputChange, onSearch, onClearInput, state, recents,
    onPickRecent, onClearRecents, onClose, onSave, onLearnMore,
    saveState, saveMessage, selSense, onSelSenseChange,
  } = props
  const hasResults = state.status === 'success' && state.data && state.data.results.length > 0
  const saveLabel = SAVE_LABELS[saveState]
  // 저장 가능한 상태: 결과가 있고, idle(처음) 또는 error(재시도)일 때.
  const saveDisabled = !hasResults || saveState === 'saving' || saveState === 'saved' || saveState === 'exists'

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
          selSense={selSense}
          onSelSenseChange={onSelSenseChange}
        />
      </div>

      {/* 저장 상태 안내 메시지 */}
      {saveMessage ? (
        <div className={`tv-save-msg tv-save-msg--${saveState}`}>{saveMessage}</div>
      ) : null}

      {/* 하단 버튼 */}
      <div className="tv-footer">
        <button
          className={`tv-btn ${saveState === 'saved' || saveState === 'exists' ? 'tv-btn--saved' : 'tv-btn--secondary'}`}
          onClick={onSave}
          disabled={saveDisabled}
        >
          <Bookmark size={18} /> {saveLabel}
        </button>
        <button className="tv-btn tv-btn--primary" onClick={onLearnMore} disabled={!hasResults}>
          <Search size={18} /> 더 알아보기
        </button>
      </div>
    </div>
  )
}

const SAVE_LABELS: Record<SaveState, string> = {
  idle: '저장하기',
  saving: '저장 중...',
  saved: '저장했어요',
  exists: '저장됨',
  error: '저장하기',
}

function Body({
  state, onPickRecent, onClearRecents, recents, hasResults, selSense, onSelSenseChange,
}: {
  state: LookupState
  onPickRecent: (w: string) => void
  onClearRecents: () => void
  recents: string[]
  hasResults: boolean
  selSense: number
  onSelSenseChange: (i: number) => void
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
        <VocabularyResultCards
          results={state.data.results}
          aiStatus={state.data.aiStatus}
          sel={selSense}
          onSelChange={onSelSenseChange}
        />
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
