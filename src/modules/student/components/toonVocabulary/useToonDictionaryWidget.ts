import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../../../../shared/contexts/AuthContext'
import { getSavedVocabularyWord, lookupKoreanWord, saveVocabularyWord } from '../../services/vocabularyService'
import type { LookupState, VocabularyResult, VocabularySourceType } from '../../types/vocabulary'

const RECENTS_KEY = 'tv-recents'
const RECENTS_MAX = 8
const KRDICT_HOME_URL = 'https://krdict.korean.go.kr/kor/mainAction'
const IDLE: LookupState = { status: 'idle', data: null, message: null }

export type ToonDictionarySaveState = 'idle' | 'saving' | 'saved' | 'exists' | 'error'

export interface UseToonDictionaryWidgetOptions {
  grade?: number
  subject?: string
  unit?: string
  sourceType?: VocabularySourceType
  sourceId?: string | null
}

export function useToonDictionaryWidget(options: UseToonDictionaryWidgetOptions) {
  const { grade, subject, unit, sourceType, sourceId } = options
  const { user } = useAuth()
  const userId = user?.id
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [state, setState] = useState<LookupState>(IDLE)
  const [selSense, setSelSense] = useState(0)
  const [saveState, setSaveState] = useState<ToonDictionarySaveState>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      // 최근 검색어 저장소를 사용할 수 없어도 검색 기능은 유지한다.
    }
    return []
  })
  const searchInputRef = useRef<HTMLInputElement>(null)

  const pushRecent = useCallback((word: string) => {
    setRecents((previous) => {
      const next = [word, ...previous.filter((item) => item !== word)].slice(0, RECENTS_MAX)
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
      } catch {
        // 저장 실패는 검색 결과에 영향을 주지 않는다.
      }
      return next
    })
  }, [])

  const refreshSavedState = useCallback(async (word: string) => {
    if (!userId) {
      setSaveState('idle')
      return
    }
    try {
      const existing = await getSavedVocabularyWord(userId, word)
      setSaveState(existing ? 'exists' : 'idle')
    } catch {
      setSaveState('idle')
    }
  }, [userId])

  const runSearch = useCallback(async (raw: string) => {
    const word = raw.trim()
    if (!word) return
    setInput(word)
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
  }, [grade, pushRecent, refreshSavedState, subject, unit])

  const handleSearch = useCallback(() => void runSearch(input), [input, runSearch])
  const handlePickRecent = useCallback((word: string) => void runSearch(word), [runSearch])
  const handleClearInput = useCallback(() => setInput(''), [])
  const handleClearRecents = useCallback(() => {
    setRecents([])
    try {
      localStorage.removeItem(RECENTS_KEY)
    } catch {
      // 저장소를 사용할 수 없어도 화면에서는 즉시 지운다.
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (state.status !== 'success' || !state.data?.results.length) return
    if (saveState === 'saving' || saveState === 'saved' || saveState === 'exists') return
    if (!userId) {
      setSaveState('error')
      setSaveMessage('로그인이 만료되었어요. 다시 로그인해 주세요.')
      return
    }

    const current: VocabularyResult = state.data.results[Math.min(selSense, state.data.results.length - 1)]
    setSaveState('saving')
    setSaveMessage(null)
    try {
      const { mode } = await saveVocabularyWord(userId, {
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
      setSaveState(mode === 'created' ? 'saved' : 'exists')
      setSaveMessage(mode === 'created' ? '저장했어요!' : '저장 내용을 새로 업데이트했어요.')
    } catch (error) {
      setSaveState('error')
      setSaveMessage(error instanceof Error ? error.message : '저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }, [saveState, selSense, sourceId, sourceType, state, userId])

  const handleLearnMore = useCallback(() => {
    window.open(KRDICT_HOME_URL, '_blank', 'noopener,noreferrer')
  }, [])

  return {
    open,
    setOpen,
    input,
    setInput,
    state,
    recents,
    selSense,
    setSelSense,
    saveState,
    saveMessage,
    searchInputRef,
    handleSearch,
    handlePickRecent,
    handleClearInput,
    handleClearRecents,
    handleSave,
    handleLearnMore,
  }
}
