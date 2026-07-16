/**
 * 꿈 진행 상태 공유 훅.
 * 셸(StudentPageShell)·꿈의궁전·보물지도·대시보드가 동일한 상태를 공유한다.
 *
 * - getDreamProgress 로 점수/레벨 계산(streak5·레벨보너스 보정 포함).
 * - 칭찬 자가기록(consumePraiseRewards)을 먼저 수행해 칭찬 점수를 반영.
 * - 새로 달성한 레벨이 있으면 레벨업 모달을 1회 표시(sessionStorage 로 중복 억제).
 * - 커스텀 이벤트(dreamProgressChanged/studentLootItemsChanged/attendanceRewardGranted)로 갱신.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { getDreamProgress, type DreamProgressResult } from '../../services/dreamScoreService'
import { consumePraiseRewards } from '../../services/teacherPraiseService'
import { MAX_LEVEL, MIN_LEVEL } from '../../config/dreamProgressionConfig'

export interface DreamLevelUpInfo {
  level: number
}

const empty: DreamProgressResult = {
  activityScore: 0,
  bonusScore: 0,
  dreamScore: 0,
  level: MIN_LEVEL,
  attendancePoints: 0,
  streak5Points: 0,
  comicCompletePoints: 0,
  teacherPraisePoints: 0,
  itemPoints: 0,
  specialMissionPoints: 0,
  levelBonusPoints: 0,
  attendanceCount: 0,
  streak5Count: 0,
  comicCompleteCount: 0,
  teacherPraiseCount: 0,
  itemCount: 0,
  specialMissionCount: 0,
  weeklyPoints: 0,
  monthlyPoints: 0,
  nextLevel: 2,
  pointsToNextLevel: 1000,
  levelProgressRate: 0,
  scoredLogs: [],
  newlyAchievedLevels: [],
}

const LEVELUP_SEEN_KEY = (studentId: string, level: number) => `dream:levelup:shown:${studentId}:${level}`

export function useDreamProgress(studentId: string | undefined | null, options?: { showLevelUpModal?: boolean }) {
  const [progress, setProgress] = useState<DreamProgressResult>(empty)
  const [isLoading, setIsLoading] = useState(true)
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null)
  const inFlight = useRef(false)
  const showLevelUpModal = options?.showLevelUpModal ?? true

  const refresh = useCallback(async () => {
    if (!studentId || inFlight.current) return
    inFlight.current = true
    try {
      // 칭찬 자가기록 먼저(본인 reward_logs 에 +50 반영 후 계산)
      try {
        await consumePraiseRewards(studentId)
      } catch {
        /* ignore — 칭찬 미반영여도 점수 계산은 진행 */
      }
      const result = await getDreamProgress(studentId)
      setProgress(result)

      // 레벨업 모달: 새로 달성한 가장 높은 레벨 1회 표시
      if (showLevelUpModal && result.newlyAchievedLevels.length > 0) {
        const top = result.newlyAchievedLevels[result.newlyAchievedLevels.length - 1]
        if (top > MIN_LEVEL) {
          const seen = typeof window !== 'undefined' && window.sessionStorage
          ? window.sessionStorage.getItem(LEVELUP_SEEN_KEY(studentId, top))
          : null
          if (!seen) {
            setLevelUpLevel(top)
            window.sessionStorage?.setItem(LEVELUP_SEEN_KEY(studentId, top), '1')
          }
        }
      }
    } catch (err) {
      console.error('[useDreamProgress] refresh failed:', err)
    } finally {
      inFlight.current = false
      setIsLoading(false)
    }
  }, [studentId, showLevelUpModal])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const handler = () => void refresh()
    window.addEventListener('dreamProgressChanged', handler)
    window.addEventListener('studentLootItemsChanged', handler)
    window.addEventListener('attendanceRewardGranted', handler)
    return () => {
      window.removeEventListener('dreamProgressChanged', handler)
      window.removeEventListener('studentLootItemsChanged', handler)
      window.removeEventListener('attendanceRewardGranted', handler)
    }
  }, [refresh])

  const dismissLevelUp = useCallback(() => setLevelUpLevel(null), [])

  return {
    progress,
    isLoading,
    refresh,
    levelUpLevel,
    dismissLevelUp,
    isMaxLevel: progress.level >= MAX_LEVEL,
  }
}
