// 툰어휘사전 위젯 — 에디터/툰마인드 화면에 공통으로 붙이는 플로팅 위젯.
// - 접힌 상태: 플로팅 버튼(FAB). 클릭 시 우측 패널 확장.
// - 상태 기계: idle → loading → success / empty / unauthorized / error.
// - 최근 검색어는 localStorage 에 저장(DB 캐시 아님, 이번 범위에서 UI 전용).
import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import '../../styles/toon-vocabulary.css'
import { lookupKoreanWord } from '../../services/vocabularyService'
import type { LookupState } from '../../types/vocabulary'
import ToonVocabularyPanel from './ToonVocabularyPanel'

const MASCOT = '/images/toon-vocabulary/toon-vocabulary-mascot.png'
const RECENTS_KEY = 'tv-recents'
const RECENTS_MAX = 8

export interface ToonVocabularyWidgetProps {
  grade?: number
  subject?: string
  unit?: string
}

const IDLE: LookupState = { status: 'idle', data: null, message: null }

export default function ToonVocabularyWidget({ grade, subject, unit }: ToonVocabularyWidgetProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [state, setState] = useState<LookupState>(IDLE)
  const [recents, setRecents] = useState<string[]>([])
  const lastQueryRef = useRef<string>('')

  // 최근 검색어 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY)
      if (raw) setRecents(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])

  const pushRecent = useCallback((word: string) => {
    setRecents((prev) => {
      const next = [word, ...prev.filter((w) => w !== word)].slice(0, RECENTS_MAX)
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const runSearch = useCallback(
    async (raw: string) => {
      const word = raw.trim()
      if (!word) return
      setInput(word)
      lastQueryRef.current = word
      setState({ status: 'loading', data: null, message: null })
      const result = await lookupKoreanWord({ word, grade, subject, unit })
      setState(result)
      if (result.status === 'success') pushRecent(word)
    },
    [grade, subject, unit, pushRecent],
  )

  const handleSearch = useCallback(() => {
    void runSearch(input)
  }, [input, runSearch])

  const handlePickRecent = useCallback(
    (w: string) => {
      void runSearch(w)
    },
    [runSearch],
  )

  const handleClearRecents = useCallback(() => {
    setRecents([])
    try {
      localStorage.removeItem(RECENTS_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const handleClearInput = useCallback(() => {
    setInput('')
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const handleSave = useCallback(() => {
    // 1차: UI만 구현. 저장 기능은 추후 단어장 연동 시 활성화.
    setState((s) => (s.status === 'success' ? { ...s } : s))
  }, [])

  const handleLearnMore = useCallback(() => {
    const w = lastQueryRef.current.trim()
    if (!w) return
    // 한국어기초사전 검색 페이지로 새 창(유용하고 비파괴적).
    const url = `https://krdict.korean.go.kr/dicSearch/search?q=${encodeURIComponent(w)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  return (
    <div className="toon-vocabulary-root">
      {open ? (
        <>
          <div className="tv-scrim" onClick={handleClose} />
          <ToonVocabularyPanel
            input={input}
            onInputChange={setInput}
            onSearch={handleSearch}
            onClearInput={handleClearInput}
            state={state}
            recents={recents}
            onPickRecent={handlePickRecent}
            onClearRecents={handleClearRecents}
            onClose={handleClose}
            onSave={handleSave}
            onLearnMore={handleLearnMore}
          />
        </>
      ) : (
        <button
          type="button"
          className="tv-fab"
          onClick={() => setOpen(true)}
          aria-label="툰어휘사전 열기"
        >
          <img className="tv-fab__mascot" src={MASCOT} alt="" />
          <span className="tv-fab__bubble">
            <span className="tv-fab__title">
              <Heart className="tv-heart" size={14} fill="currentColor" /> 툰어휘사전
            </span>
            <span className="tv-fab__sub">모르는 단어? 쉽게 찾아줄게!</span>
          </span>
        </button>
      )}
    </div>
  )
}
