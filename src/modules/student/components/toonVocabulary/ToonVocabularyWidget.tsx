// 툰어휘사전 위젯 — 에디터/툰마인드 시작·편집/툰 만화 화면에 공통으로 붙이는 플로팅 위젯.
// - 접힌 상태: 플로팅 버튼(FAB). 클릭 시 우측 패널 확장.
// - 상태 기계: idle → loading → success / empty / unauthorized / error.
// - 최근 검색어는 localStorage 에 저장(DB 캐시 아님, 이번 범위에서 UI 전용).
// - 저장하기: 로그인한 학생의 단어장(student_vocabulary_words)에 학생별로 저장/갱신.
// - 더 알아보기: 한국어기초사전 첫 화면을 새 탭으로 연다(검색어 쿼리 사용 안 함 → 404 회피).
import { useCallback, useState, useRef } from 'react'
import { Heart } from 'lucide-react'
import '../../styles/toon-vocabulary.css'
import { lookupKoreanWord, saveVocabularyWord, getSavedVocabularyWord } from '../../services/vocabularyService'
import type { LookupState, VocabularyResult, VocabularySourceType } from '../../types/vocabulary'
import { useAuth } from '../../../../shared/contexts/AuthContext'
import ToonVocabularyPanel from './ToonVocabularyPanel'

const MASCOT = '/images/toon-vocabulary/toon-vocabulary-mascot.png'
const RECENTS_KEY = 'tv-recents'
const RECENTS_MAX = 8

// 한국어기초사전 첫 화면(404 회피: 검색어를 URL 쿼리로 넘기지 않는다).
const KRDICT_HOME_URL = 'https://krdict.korean.go.kr/kor/mainAction'

// 저장 버튼 상태.
type SaveState = 'idle' | 'saving' | 'saved' | 'exists' | 'error'

export interface ToonVocabularyWidgetProps {
  grade?: number
  subject?: string
  unit?: string
  // 저장 출처 추적(나의 단어장에서 어디서 저장했는지 표시). 모두 optional → ToonEditor 등 기존 호출 호환.
  sourceType?: VocabularySourceType
  sourceId?: string | null
}

const IDLE: LookupState = { status: 'idle', data: null, message: null }

export default function ToonVocabularyWidget({ grade, subject, unit, sourceType, sourceId }: ToonVocabularyWidgetProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [state, setState] = useState<LookupState>(IDLE)
  // 현재 보고 있는 뜻(sense) 인덱스 — 저장 대상 식별을 위해 위젯이 보유(카드는 제어 컴포넌트로 전환).
  const [selSense, setSelSense] = useState(0)
  const lastQueryRef = useRef<string>('')
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      /* ignore */
    }
    return []
  })

  // 저장 상태 + 일시적 안내 메시지.
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

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

  // 검색 성공 시 이 단어가 이미 저장되어 있는지 확인해 버튼 상태 반영.
  const refreshSavedState = useCallback(
    async (word: string) => {
      const studentId = user?.id
      if (!studentId) {
        setSaveState('idle')
        return
      }
      try {
        const existing = await getSavedVocabularyWord(studentId, word)
        setSaveState(existing ? 'exists' : 'idle')
      } catch {
        // 조회 실패는 저장 버튼만 idle 로 두고 치명적이지 않음.
        setSaveState('idle')
      }
    },
    [user?.id],
  )

  const runSearch = useCallback(
    async (raw: string) => {
      const word = raw.trim()
      if (!word) return
      setInput(word)
      lastQueryRef.current = word
      setSelSense(0)
      setSaveState('idle')
      setSaveMessage(null)
      setState({ status: 'loading', data: null, message: null })
      const result = await lookupKoreanWord({ word, grade, subject, unit })
      setState(result)
      if (result.status === 'success') {
        pushRecent(word)
        void refreshSavedState(word)
      }
    },
    [grade, subject, unit, pushRecent, refreshSavedState],
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

  const handleSave = useCallback(async () => {
    const studentId = user?.id
    // 결과가 있을 때만 저장 가능(패널에서도 버튼 비활성화하지만 이중 방어).
    if (state.status !== 'success' || !state.data || state.data.results.length === 0) return
    if (saveState === 'saving' || saveState === 'saved' || saveState === 'exists') return // 중복 클릭 방지

    if (!studentId) {
      setSaveState('error')
      setSaveMessage('로그인이 만료되었어요. 다시 로그인해 주세요.')
      return
    }

    const results = state.data.results
    const current: VocabularyResult = results[Math.min(selSense, results.length - 1)]

    setSaveState('saving')
    setSaveMessage(null)
    try {
      const { mode } = await saveVocabularyWord(studentId, {
        word: current.word,
        part_of_speech: current.partOfSpeech,
        dictionary_definition: current.officialDefinition,
        easy_definition: current.easyDefinition,
        daily_example: current.dailyExample,
        subject_example: current.schoolExample,
        summary: current.keyPoint,
        source_type: sourceType ?? null,
        source_id: sourceId ?? null,
      })
      if (mode === 'created') {
        setSaveState('saved')
        setSaveMessage('저장했어요!')
      } else {
        setSaveState('exists')
        setSaveMessage('저장 내용을 새로 업데이트했어요.')
      }
    } catch (e) {
      setSaveState('error')
      setSaveMessage(e instanceof Error ? e.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [user?.id, state, selSense, saveState, sourceType, sourceId])

  const handleLearnMore = useCallback(() => {
    // 검색어를 URL 쿼리로 넘기면 404가 발생하므로, 사전 첫 화면을 새 탭으로 바로 연다.
    // 현재 검색 결과 화면은 유지된다(새 탭이므로).
    window.open(KRDICT_HOME_URL, '_blank', 'noopener,noreferrer')
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
            saveState={saveState}
            saveMessage={saveMessage}
            selSense={selSense}
            onSelSenseChange={setSelSense}
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
