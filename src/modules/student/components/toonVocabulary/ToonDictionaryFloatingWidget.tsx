import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BookOpen } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../../styles/toon-vocabulary.css'
import type { VocabularySourceType } from '../../types/vocabulary'
import ToonDictionaryMobileSheet from './ToonDictionaryMobileSheet'
import ToonDictionaryPanel from './ToonDictionaryPanel'
import { useToonDictionaryWidget } from './useToonDictionaryWidget'

const MASCOT = '/images/toon-vocabulary/toon-vocabulary-mascot.png'

export interface ToonDictionaryFloatingWidgetProps {
  grade?: number
  subject?: string
  unit?: string
  sourceType?: VocabularySourceType
  sourceId?: string | null
  placement?: 'default' | 'mindmap-editor'
}

function useMobileSheet() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return mobile
}

export default function ToonDictionaryFloatingWidget({ placement = 'default', ...props }: ToonDictionaryFloatingWidgetProps) {
  const widget = useToonDictionaryWidget(props)
  const { open, setOpen, searchInputRef } = widget
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMobileSheet()
  const panelId = `toon-dictionary-${useId().replaceAll(':', '')}`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const previousPathRef = useRef(location.pathname)

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus())
  }, [setOpen])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => searchInputRef.current?.focus())
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close, open, searchInputRef])

  useEffect(() => {
    if (previousPathRef.current !== location.pathname) {
      setOpen(false)
      previousPathRef.current = location.pathname
    }
  }, [location.pathname, setOpen])

  const openWordbook = useCallback(() => {
    const event = new Event('toonDictionaryOpenWordbook', { cancelable: true })
    if (window.dispatchEvent(event)) navigate('/student/vocabulary')
  }, [navigate])

  const panelProps = {
    panelId,
    inputRef: widget.searchInputRef,
    input: widget.input,
    onInputChange: widget.setInput,
    onSearch: widget.handleSearch,
    onClearInput: widget.handleClearInput,
    state: widget.state,
    recents: widget.recents,
    onPickRecent: widget.handlePickRecent,
    onClearRecents: widget.handleClearRecents,
    onClose: close,
    onSave: widget.handleSave,
    onLearnMore: widget.handleLearnMore,
    onOpenWordbook: openWordbook,
    saveState: widget.saveState,
    saveMessage: widget.saveMessage,
    selSense: widget.selSense,
    onSelSenseChange: widget.setSelSense,
  }

  return createPortal(
    <div className={`toon-vocabulary-root tv-placement--${placement}`} data-toon-dictionary-widget="true">
      {widget.open && (
        <>
          <button className="tv-scrim" type="button" aria-label="툰어휘사전 닫기" onClick={() => close()} />
          {isMobile
            ? <ToonDictionaryMobileSheet {...panelProps} />
            : <ToonDictionaryPanel {...panelProps} />}
        </>
      )}
      <button
        ref={triggerRef}
        type="button"
        className={`tv-fab${widget.open ? ' tv-fab--open' : ''}`}
        onClick={() => widget.open ? close(false) : widget.setOpen(true)}
        aria-label={widget.open ? '툰어휘사전 닫기' : '툰어휘사전 열기'}
        aria-expanded={widget.open}
        aria-controls={panelId}
      >
        <img className="tv-fab__mascot" src={MASCOT} alt="" />
        <BookOpen className="tv-fab__book" aria-hidden="true" />
        <span className="tv-fab__title">툰어휘<br />사전</span>
      </button>
    </div>,
    document.body,
  )
}
