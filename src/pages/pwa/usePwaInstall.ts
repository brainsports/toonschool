import { useCallback, useEffect, useRef, useState } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export type BrowserEnvironment = {
  isAndroid: boolean
  isChrome: boolean
  isEdge: boolean
  isIPad: boolean
  isSamsungInternet: boolean
  isSafari: boolean
  isWindows: boolean
}

let capturedInstallPrompt: BeforeInstallPromptEvent | null = null

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    capturedInstallPrompt = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    capturedInstallPrompt = null
  })
}

const initialEnvironment: BrowserEnvironment = {
  isAndroid: false,
  isChrome: false,
  isEdge: false,
  isIPad: false,
  isSamsungInternet: false,
  isSafari: false,
  isWindows: false,
}

function detectEnvironment(): BrowserEnvironment {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return initialEnvironment
  }

  const userAgent = navigator.userAgent
  const isIPad = /iPad/i.test(userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSamsungInternet = /SamsungBrowser/i.test(userAgent)
  const isEdge = /Edg(?:e|A|iOS)?\//i.test(userAgent)
  const isChrome = !isEdge && !isSamsungInternet && /(?:Chrome|CriOS)\//i.test(userAgent)
  const isSafari = /Safari\//i.test(userAgent)
    && !/(?:Chrome|CriOS|FxiOS|EdgiOS|OPiOS|SamsungBrowser)\//i.test(userAgent)

  return {
    isAndroid: /Android/i.test(userAgent),
    isChrome,
    isEdge,
    isIPad,
    isSamsungInternet,
    isSafari,
    isWindows: /Windows/i.test(userAgent),
  }
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false

  const displayModeStandalone = typeof window.matchMedia === 'function'
    && window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true

  return displayModeStandalone || iosStandalone
}

export function usePwaInstall() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(capturedInstallPrompt)
  const [canPrompt, setCanPrompt] = useState(capturedInstallPrompt !== null)
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode)
  const [isPrompting, setIsPrompting] = useState(false)
  const [environment] = useState<BrowserEnvironment>(detectEnvironment)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const standaloneMedia = typeof window.matchMedia === 'function'
      ? window.matchMedia('(display-mode: standalone)')
      : null
    const updateInstalledState = () => setIsInstalled(isStandaloneMode())
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      if (isStandaloneMode()) return
      capturedInstallPrompt = event as BeforeInstallPromptEvent
      deferredPromptRef.current = capturedInstallPrompt
      setCanPrompt(true)
    }
    const handleAppInstalled = () => {
      deferredPromptRef.current = null
      capturedInstallPrompt = null
      setCanPrompt(false)
      setIsPrompting(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    standaloneMedia?.addEventListener?.('change', updateInstalledState)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      standaloneMedia?.removeEventListener?.('change', updateInstalledState)
    }
  }, [])

  const requestInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const deferredPrompt = deferredPromptRef.current
    if (!deferredPrompt || isInstalled || isPrompting) return 'unavailable'

    setIsPrompting(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      return outcome
    } catch {
      return 'unavailable'
    } finally {
      deferredPromptRef.current = null
      capturedInstallPrompt = null
      setCanPrompt(false)
      setIsPrompting(false)
    }
  }, [isInstalled, isPrompting])

  return {
    canPrompt,
    environment,
    isInstalled,
    isPrompting,
    requestInstall,
  }
}
