import { Check, Copy, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

export type InstallGuide = {
  copyAddress?: boolean
  intro?: string
  steps: string[]
  title: string
}

type PwaInstallModalProps = {
  guide: InstallGuide
  onClose: () => void
  returnFocusTo: HTMLElement | null
}

async function copyCurrentAddress(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href)
      return true
    }
  } catch {
    // 보안 정책 등으로 Clipboard API를 사용할 수 없으면 아래 대체 방식을 사용한다.
  }

  const textarea = document.createElement('textarea')
  textarea.value = window.location.href
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

export default function PwaInstallModal({ guide, onClose, returnFocusTo }: PwaInstallModalProps) {
  const titleId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      returnFocusTo?.focus()
    }
  }, [onClose, returnFocusTo])

  const handleCopy = async () => {
    setCopyState(await copyCurrentAddress() ? 'copied' : 'failed')
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/70 bg-gradient-to-br from-white via-violet-50 to-sky-50 p-6 text-left shadow-2xl sm:p-8"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
          aria-label="설치 안내 닫기"
        >
          <X size={22} aria-hidden="true" />
        </button>

        <div className="pr-12">
          <span className="mb-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-sm font-extrabold text-violet-700">
            설치 방법
          </span>
          <h2 id={titleId} className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {guide.title}
          </h2>
        </div>

        {guide.intro && (
          <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 font-bold leading-relaxed text-amber-900">
            {guide.intro}
          </p>
        )}

        <ol className="mt-6 space-y-3">
          {guide.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 rounded-2xl bg-white/90 p-4 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-extrabold text-sky-700">
                {index + 1}
              </span>
              <span className="pt-1 text-base font-bold leading-relaxed text-slate-700">{step}</span>
            </li>
          ))}
        </ol>

        {copyState === 'failed' && (
          <p className="mt-4 text-center text-sm font-bold text-rose-600" role="status">
            주소를 복사하지 못했어요. 주소창의 주소를 직접 복사해 주세요.
          </p>
        )}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {guide.copyAddress && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-violet-200 bg-white px-5 font-extrabold text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200"
            >
              {copyState === 'copied' ? <Check size={19} /> : <Copy size={19} />}
              {copyState === 'copied' ? '주소를 복사했어요' : '주소 복사하기'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-full bg-primary px-7 font-extrabold text-white shadow-sm transition hover:bg-pink-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pink-200 active:bg-pink-700"
          >
            확인
          </button>
        </div>
      </section>
    </div>
  )
}
