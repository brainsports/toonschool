/**
 * 보물지도 페이지 — 열개의 빛과 꿈의 책.
 * 10개 장면을 ㄹ(리을)자 지그재그로 배치하고 구불구불한 점선 경로로 잇는다.
 * 경로는 항상 1 → 2 → ... → 10 순서. 현재 위치까지 밝은색, 잠긴 구간은 흐린 색.
 */
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Lock } from 'lucide-react'
import StudentPageShell from '../layout/StudentPageShell'
import { useAuth } from '../../../../shared/contexts/AuthContext'
import { useDreamProgress } from './useDreamProgress'
import {
  DREAM_BOOK_TITLE,
  DREAM_CHAPTERS,
  type DreamChapter,
} from '../../config/dreamProgressionConfig'
import '../../styles/dream-progression.css'

// ㄹ자 그리드에서 각 레벨의 중심 좌표(viewBox 0..100 비율). 4열×3행 기준.
const POINTS: Record<number, [number, number]> = {
  1: [12.5, 16],
  2: [37.5, 16],
  3: [62.5, 16],
  4: [87.5, 50],
  5: [62.5, 50],
  6: [37.5, 50],
  7: [12.5, 50],
  8: [12.5, 84],
  9: [37.5, 84],
  10: [62.5, 84],
}

// 정렬된 경로 점(1→10)
const ORDERED_POINTS: [number, number][] = Array.from({ length: 10 }, (_, i) => POINTS[i + 1])

function wavyPath(pts: [number, number][], amp = 1.8): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy) || 1
    const px = -dy / len
    const py = dx / len
    const sign = i % 2 === 0 ? 1 : -1
    const cx = mx + px * amp * sign
    const cy = my + py * amp * sign
    d += ` Q ${cx} ${cy} ${x2} ${y2}`
  }
  return d
}

export default function TreasureMapPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const studentId = profile?.role === 'student' ? profile.id : user?.id
  const { progress } = useDreamProgress(studentId, { showLevelUpModal: false })
  const navigate = useNavigate()
  const currentRef = useRef<HTMLDivElement | null>(null)

  const currentLevel = progress.level
  const activityScore = progress.activityScore

  // 현재 위치로 자동 스크롤
  useEffect(() => {
    if (!authLoading && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' })
    }
  }, [authLoading, currentLevel])

  const donePath = useMemo(() => wavyPath(ORDERED_POINTS.slice(0, currentLevel)), [currentLevel])
  const lockedPath = useMemo(() => wavyPath(ORDERED_POINTS.slice(currentLevel - 1)), [currentLevel])
  const currentPoint = POINTS[currentLevel]

  function stateOf(level: number): 'done' | 'current' | 'locked' {
    if (level < currentLevel) return 'done'
    if (level === currentLevel) return 'current'
    return 'locked'
  }

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="full">
      <main className="treasure-map-page">
        <div className="treasure-map-title">
          <h1>{DREAM_BOOK_TITLE}</h1>
          <p>활동 점수 {activityScore.toLocaleString()}점 · 현재 LV.{currentLevel}</p>
        </div>

        <div className="treasure-map-scroll">
          <div className="treasure-map-grid">
            {/* 구불구불 점선 경로(카드 뒤) */}
            <svg className="tm-path-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {lockedPath && <path d={lockedPath} className="tm-path-locked" />}
              {donePath && <path d={donePath} className="tm-path-done" />}
              {currentPoint && (
                <circle cx={currentPoint[0]} cy={currentPoint[1]} r="1.1" className="tm-path-done" style={{ stroke: 'none', fill: '#f59ec0' }} />
              )}
            </svg>

            {DREAM_CHAPTERS.map((chapter: DreamChapter) => {
              const state = stateOf(chapter.level)
              const isCurrent = state === 'current'
              const need = Math.max(0, chapter.minActivityScore - activityScore)
              return (
                <div
                  key={chapter.level}
                  className="tm-card"
                  data-tm-level={chapter.level}
                  ref={isCurrent ? currentRef : undefined}
                >
                  <div
                    className={`tm-scene dream-bg--${chapter.themeKey} tm-scene--${state}`}
                    role="img"
                    aria-label={`레벨 ${chapter.level} ${chapter.chapterTitle} (${state === 'done' ? '완료' : state === 'current' ? '현재' : '잠김'})`}
                  >
                    {state === 'done' && (
                      <span className="tm-scene-badge" title="완료">
                        <Check className="w-5 h-5" style={{ color: '#e0a800', background: '#fff', borderRadius: '9999px', padding: '2px' }} />
                      </span>
                    )}
                    {state === 'locked' && (
                      <span className="tm-scene-badge tm-scene-lock" title="잠김">
                        <Lock className="w-4 h-4" style={{ color: '#9a7e9a' }} />
                      </span>
                    )}

                    <div className="tm-scene-emoji">{chapter.symbolEmoji}</div>
                    <div className="tm-scene-level">LV.{chapter.level} · {chapter.locationName}</div>
                    <div className="tm-scene-title">{chapter.chapterTitle}</div>

                    {state === 'done' && <div className="tm-scene-symbol">✦ {chapter.symbolName}</div>}
                    {state === 'current' && (
                      <>
                        <div className="tm-scene-symbol">{chapter.symbolName}</div>
                        <span className="tm-scene-here">여기에 있어요!</span>
                      </>
                    )}
                    {state === 'locked' && (
                      <div className="tm-scene-need">다음 장면까지 활동점수 {need.toLocaleString()}점</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('/student/dream-garden')}
            className="dream-hud-chip dream-hud-chip--score"
            style={{ background: '#ffe3ef', color: '#a8347a', borderColor: '#ffc6dc' }}
          >
            꿈의 궁전으로 가기
          </button>
        </div>
      </main>
    </StudentPageShell>
  )
}
