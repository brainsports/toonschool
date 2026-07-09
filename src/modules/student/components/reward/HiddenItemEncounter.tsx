import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { RewardResult } from '../../types/dreamGarden'
import { grantHiddenEncounterReward } from '../../services/itemRewardService'

interface HiddenItemEncounterProps {
  studentId?: string | null
  sourceId?: string | null
  enabled: boolean
  onRewardGranted?: (result: RewardResult) => void
}

function getRandomMs(minSeconds: number, maxSeconds: number) {
  return Math.round((minSeconds + Math.random() * (maxSeconds - minSeconds)) * 1000)
}

export default function HiddenItemEncounter({
  studentId,
  sourceId,
  enabled,
  onRewardGranted,
}: HiddenItemEncounterProps) {
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [finished, setFinished] = useState(false)
  const hasScheduledRef = useRef(false)
  const hideTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !studentId || !sourceId || finished || hasScheduledRef.current) return

    const localClaimKey = `toonschool:hidden-encounter-claimed:${studentId}:${sourceId}`
    if (localStorage.getItem(localClaimKey) === 'true') {
      setFinished(true)
      return
    }

    hasScheduledRef.current = true
    const showTimer = window.setTimeout(() => {
      setVisible(true)
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false)
        setFinished(true)
      }, getRandomMs(8, 10))
    }, getRandomMs(15, 30))

    return () => {
      window.clearTimeout(showTimer)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    }
  }, [enabled, finished, sourceId, studentId])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [message])

  async function handleClaim() {
    if (!studentId || !sourceId || isClaiming) return
    setIsClaiming(true)

    try {
      const result = await grantHiddenEncounterReward(studentId, sourceId)
      if (result.status === 'granted' || result.status === 'already_claimed') {
        localStorage.setItem(`toonschool:hidden-encounter-claimed:${studentId}:${sourceId}`, 'true')
        setVisible(false)
        setFinished(true)
      }
      setMessage(result.status === 'granted' ? '꿈의 정원에 보냈어요!' : result.message)
      onRewardGranted?.(result)
    } catch (error) {
      console.error('[HiddenItemEncounter] reward failed:', error)
      setMessage('앗! 다시 눌러 볼까요?')
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <>
      {visible && !finished && (
        <button
          type="button"
          className="hidden-item-encounter"
          onClick={handleClaim}
          disabled={isClaiming}
          aria-label="숨어 있는 꿈의 정원 아이템 받기"
        >
          <Sparkles className="hidden-item-encounter-sparkle" aria-hidden="true" />
          <span className="hidden-item-encounter-orb" aria-hidden="true">?</span>
        </button>
      )}
      {message && (
        <div className="hidden-item-encounter-toast" role="status">
          {message}
        </div>
      )}
    </>
  )
}