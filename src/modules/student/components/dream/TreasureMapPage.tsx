/**
 * 보물지도 페이지 — 열개의 빛과 꿈의 책 (인터랙티브 지도).
 *
 * 보물지도 일러스트를 화면 중심에 크게 띄우고, 지도 속 10개 장소를 직접 클릭 가능한
 * 레벨 버튼으로 사용한다. 학생 점수/레벨은 기존 useDreamProgress 를 그대로 사용한다.
 *
 * 구조(개념):
 *   StudentPageShell(공통 헤더)
 *     └ treasure-map-page
 *         ├ TreasureMapStatusBar(이름·레벨·점수·남은점수·진행막대·현재장소·바로가기)
 *         └ tm-viewport(pan/zoom 클립)
 *             └ tm-stage(배경 비율 고정)
 *                 ├ img(배경)
 *                 ├ svg(진행 경로 오버레이)
 *                 ├ tm-hotspot-layer(레벨 1~10 투명 버튼)
 *                 └ tm-state-layer(체크·자물쇠·현재위치 핀·레벨5 동적라벨)
 *         └ LevelDetailPanel(PC/태블릿=팝오버, 모바일=하단시트)
 *
 * 레벨·점수·아이템 데이터는 dreamProgressionConfig(SoT)에서 가져온다(중복 정의 금지).
 * 위치(좌표)만 treasureMapPositions.ts 에서 관리한다.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Lock, Minus, Plus, MapPin, Sprout } from 'lucide-react'
import StudentPageShell from '../layout/StudentPageShell'
import { useAuth } from '../../../../shared/contexts/AuthContext'
import { useDreamProgress } from './useDreamProgress'
import { mockStudentProfile } from '../../data/studentMockData'
import {
  MAX_LEVEL,
  MIN_LEVEL,
  getChapter,
  getLevelItems,
  type DreamChapter,
} from '../../config/dreamProgressionConfig'
import {
  TREASURE_MAP_BACKGROUND,
  TREASURE_MAP_IMAGE_ASPECT,
  TREASURE_MAP_POSITIONS,
  TREASURE_MAP_SEGMENTS,
  DEBUG_TREASURE_MAP_HOTSPOTS,
  TREASURE_MAP_MOBILE_BASE_SCALE,
  TREASURE_MAP_MIN_SCALE,
  TREASURE_MAP_MAX_SCALE,
  getTreasureMapPosition,
} from '../../config/treasureMapPositions'
import '../../styles/treasure-map.css'

type LevelState = 'completed' | 'current' | 'locked'

const MOBILE_BREAKPOINT = 768
const UNLOCK_SEEN_KEY = (studentId: string) => `dream:treasuremap:seenLevel:${studentId}`

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** 학생 현재 레벨 기준으로 각 장소 상태 계산. (레벨 범위는 이미 1~10로 정규화된 값 사용) */
function getLevelState(level: number, currentLevel: number): LevelState {
  if (level < currentLevel) return 'completed'
  if (level === currentLevel) return 'current'
  return 'locked'
}

function stateLabelKo(state: LevelState): string {
  return state === 'completed' ? '완료' : state === 'current' ? '현재 위치' : '잠김'
}

interface Transform { tx: number; ty: number; scale: number }

export default function TreasureMapPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const studentId = profile?.role === 'student' ? profile.id : user?.id
  const studentName = profile?.name || '학생'
  const avatarEmoji = mockStudentProfile.avatarEmoji
  const { progress, isLoading: progressLoading } = useDreamProgress(studentId, { showLevelUpModal: false })
  const navigate = useNavigate()

  // 진행 데이터 정규화(방어): 점수 null/문자열/NaN → 0, 레벨 → 1~10
  const currentLevel = clamp(Number.isFinite(progress.level) ? progress.level : MIN_LEVEL, MIN_LEVEL, MAX_LEVEL)
  const activityScore = Number.isFinite(progress.activityScore) ? progress.activityScore : 0

  // ── 이미지 로딩 상태 ──
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)

  // ── 선택된 레벨(상세 패널) ──
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null)

  // ── 반응형/무대 크기 ──
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 })
  const [transform, setTransform] = useState<Transform>({ tx: 0, ty: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)

  // ── pan/zoom 포인터 추적(참조) ──
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const panStart = useRef<{ tx: number; ty: number; px: number; py: number } | null>(null)
  const pinchStart = useRef<{ dist: number; scale: number; midX: number; midY: number; stageX: number; stageY: number } | null>(null)

  // ── 모바일 판정 ──
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT)
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  // ── 무대 크기(배경 비율 유지 contain-fit) ──
  const recomputeStage = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    if (vw <= 0 || vh <= 0) return
    let w = vw
    let h = vw / TREASURE_MAP_IMAGE_ASPECT
    if (h > vh) {
      h = vh
      w = vh * TREASURE_MAP_IMAGE_ASPECT
    }
    setStageSize({ w: Math.round(w), h: Math.round(h) })
  }, [])

  useEffect(() => {
    recomputeStage()
    const onResize = () => recomputeStage()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [recomputeStage])

  // ── 변환을 무대/화면 경계 안으로 클램프 ──
  const clampTransform = useCallback(
    (tx: number, ty: number, scale: number, vw: number, vh: number, baseW: number, baseH: number): Transform => {
      const sw = baseW * scale
      const sh = baseH * scale
      const txMin = sw <= vw ? (vw - sw) / 2 : vw - sw
      const txMax = sw <= vw ? (vw - sw) / 2 : 0
      const tyMin = sh <= vh ? (vh - sh) / 2 : vh - sh
      const tyMax = sh <= vh ? (vh - sh) / 2 : 0
      return {
        tx: clamp(tx, Math.min(txMin, txMax), Math.max(txMin, txMax)),
        ty: clamp(ty, Math.min(tyMin, tyMax), Math.max(tyMin, tyMax)),
        scale,
      }
    },
    [],
  )

  // 특정 레벨 마커를 화면 중앙으로(모바일).
  const centerOnLevel = useCallback(
    (level: number) => {
      const el = viewportRef.current
      const pos = getTreasureMapPosition(level)
      if (!el || !pos) return
      const vw = el.clientWidth
      const vh = el.clientHeight
      const baseW = stageSize.w
      const baseH = stageSize.h
      if (vw <= 0 || vh <= 0 || baseW <= 0) return
      const scale = transform.scale
      const markerScaledX = (pos.marker.x / 100) * baseW * scale
      const markerScaledY = (pos.marker.y / 100) * baseH * scale
      const tx = vw / 2 - markerScaledX
      const ty = vh / 2 - markerScaledY
      setTransform(clampTransform(tx, ty, scale, vw, vh, baseW, baseH))
    },
    [stageSize.w, stageSize.h, transform.scale, clampTransform],
  )

  // ── 초기 변환: 모바일이면 현재 레벨로 자동 중앙 정렬(이미지/데이터 준비 후 1회) ──
  const didInitialCenter = useRef(false)
  useEffect(() => {
    if (!isMobile || didInitialCenter.current) return
    if (stageSize.w <= 0 || !imgLoaded || authLoading) return
    const baseScale = TREASURE_MAP_MOBILE_BASE_SCALE
    const el = viewportRef.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    const pos = getTreasureMapPosition(currentLevel)
    if (!pos) return
    const markerScaledX = (pos.marker.x / 100) * stageSize.w * baseScale
    const markerScaledY = (pos.marker.y / 100) * stageSize.h * baseScale
    const tx = vw / 2 - markerScaledX
    const ty = vh / 2 - markerScaledY
    setTransform(clampTransform(tx, ty, baseScale, vw, vh, stageSize.w, stageSize.h))
    didInitialCenter.current = true
  }, [isMobile, stageSize.w, stageSize.h, imgLoaded, authLoading, currentLevel, clampTransform])

  // 데스크톱으로 전환/무대 크기 변경 시 변환 리셋(맞춤)
  useEffect(() => {
    if (!isMobile) {
      const el = viewportRef.current
      if (!el) return
      setTransform(clampTransform(0, 0, 1, el.clientWidth, el.clientHeight, stageSize.w, stageSize.h))
      didInitialCenter.current = false
    }
  }, [isMobile, stageSize.w, stageSize.h, clampTransform])

  // ── 새 레벨 해금 연출(이전 방문보다 높은 레벨 첫 도달 시 1회) ──
  const [unlockLevel, setUnlockLevel] = useState<number | null>(null)
  useEffect(() => {
    if (!studentId || authLoading) return
    const key = UNLOCK_SEEN_KEY(studentId)
    const seenRaw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    const seen = seenRaw ? clamp(parseInt(seenRaw, 10), MIN_LEVEL, MAX_LEVEL) : null
    if (seen === null) {
      // 최초 방문: 연출 없이 현재 레벨만 기록
      window.localStorage?.setItem(key, String(currentLevel))
      return
    }
    if (currentLevel > seen) {
      window.localStorage?.setItem(key, String(currentLevel))
      // 연출은 다음 틱에 켜져 "effect 본문 동기 setState" 회피 + 자동으로 3.6s 뒤 사라짐
      const show = window.setTimeout(() => setUnlockLevel(currentLevel), 0)
      const hide = window.setTimeout(() => setUnlockLevel(null), 3600)
      return () => {
        window.clearTimeout(show)
        window.clearTimeout(hide)
      }
    }
  }, [studentId, authLoading, currentLevel])

  // ── pan/zoom 핸들러 ──
  const onPointerDown = (e: React.PointerEvent) => {
    if (!isMobile) return
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      setIsPanning(true)
      panStart.current = { tx: transform.tx, ty: transform.ty, px: e.clientX, py: e.clientY }
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const el = viewportRef.current
      const rect = el?.getBoundingClientRect()
      // 핀치 중심 아래의 무대 좌표(스케일 적용 전)
      const localX = rect ? midX - rect.left : midX
      const localY = rect ? midY - rect.top : midY
      const stageX = (localX - transform.tx) / transform.scale
      const stageY = (localY - transform.ty) / transform.scale
      pinchStart.current = { dist, scale: transform.scale, midX, midY, stageX, stageY }
      panStart.current = null
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isMobile) return
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const el = viewportRef.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight

    if (pointers.current.size >= 2 && pinchStart.current) {
      const [a, b] = Array.from(pointers.current.values())
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const rect = el.getBoundingClientRect()
      const nextScale = clamp((pinchStart.current.scale * dist) / pinchStart.current.dist, TREASURE_MAP_MIN_SCALE, TREASURE_MAP_MAX_SCALE)
      // 핀치 시작점의 무대 좌표가 화면 중심(새 중심) 아래에 머무르도록 평행이동
      const tx = midX - rect.left - pinchStart.current.stageX * nextScale
      const ty = midY - rect.top - pinchStart.current.stageY * nextScale
      setTransform(clampTransform(tx, ty, nextScale, vw, vh, stageSize.w, stageSize.h))
      return
    }

    if (panStart.current) {
      const dx = e.clientX - panStart.current.px
      const dy = e.clientY - panStart.current.py
      setTransform(clampTransform(panStart.current.tx + dx, panStart.current.ty + dy, transform.scale, vw, vh, stageSize.w, stageSize.h))
    }
  }

  const endPointer = (e: React.PointerEvent) => {
    if (!isMobile) return
    pointers.current.delete(e.pointerId)
    ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    if (pointers.current.size === 1) {
      const [p] = Array.from(pointers.current.values())
      panStart.current = { tx: transform.tx, ty: transform.ty, px: p.x, py: p.y }
    }
    if (pointers.current.size === 0) {
      panStart.current = null
      setIsPanning(false)
    }
  }

  const zoomBy = (factor: number) => {
    const el = viewportRef.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    const nextScale = clamp(transform.scale * factor, TREASURE_MAP_MIN_SCALE, TREASURE_MAP_MAX_SCALE)
    // 화면 중심 기준 줌
    const cx = vw / 2
    const cy = vh / 2
    const stageX = (cx - transform.tx) / transform.scale
    const stageY = (cy - transform.ty) / transform.scale
    const tx = cx - stageX * nextScale
    const ty = cy - stageY * nextScale
    setTransform(clampTransform(tx, ty, nextScale, vw, vh, stageSize.w, stageSize.h))
  }

  // ── 장소 선택 ──
  const handleSelect = (level: number) => {
    setSelectedLevel((prev) => (prev === level ? null : level))
    if (isMobile) {
      // 선택한 장소를 화면 중앙으로(단, 더 크게 확대하지는 않음)
      requestAnimationFrame(() => centerOnLevel(level))
    }
  }

  const goToDreamPalace = (level: number) => {
    setSelectedLevel(null)
    navigate(`/student/dream-garden?level=${level}`)
  }

  // 상단바 데이터
  const currentChapter = getChapter(currentLevel)
  const pointsToNext = Number.isFinite(progress.pointsToNextLevel) ? progress.pointsToNextLevel : 0
  const progressRate = clamp(Number.isFinite(progress.levelProgressRate) ? progress.levelProgressRate : 0, 0, 1)
  const isMaxLevel = currentLevel >= MAX_LEVEL

  // 상세 패널용 선택 챕터
  const selectedChapter: DreamChapter | null = selectedLevel ? getChapter(selectedLevel) : null

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="full">
      <main className="treasure-map-page" aria-label="보물지도 — 열개의 빛과 꿈의 책">
        {/* 상단 상태바 */}
        <div className="tm-statusbar" role="status" aria-live="polite">
          <span className="tm-sb-name">{studentName}</span>
          <span className="tm-sb-level">LV.{currentLevel}</span>
          <span className="tm-sb-score">
            활동 점수 <strong>{activityScore.toLocaleString()}</strong>점
          </span>
          {!isMaxLevel ? (
            <>
              <span className="tm-sb-next">다음 장소까지 {pointsToNext.toLocaleString()}점</span>
              <span className="tm-sb-progress" aria-hidden="true">
                <span style={{ width: `${Math.round(progressRate * 100)}%` }} />
              </span>
            </>
          ) : (
            <span className="tm-sb-next">최고 레벨 달성! 🎉</span>
          )}
          <span className="tm-sb-scene" title={currentChapter.chapterTitle}>
            현재 위치: {currentChapter.locationName}
          </span>
          <span className="tm-sb-spacer" />
          <button
            type="button"
            className="tm-sb-gopalace"
            onClick={() => goToDreamPalace(currentLevel)}
            title="현재 꿈의 궁전(정원)으로 이동"
          >
            <Sprout className="w-4 h-4" />
            꿈의 궁전 바로가기
          </button>
        </div>

        {/* 지도 뷰포트 */}
        <div
          ref={viewportRef}
          className={`tm-viewport${isMobile ? (isPanning ? ' tm-grabbing' : ' tm-grab') : ''}`}
        >
          {/* 로딩/에러 자리표시자 */}
          {(progressLoading || authLoading) && stageSize.w === 0 && (
            <div className="tm-loading">보물지도를 불러오는 중…</div>
          )}

          {unlockLevel !== null && (
            <div className="tm-unlock-toast" role="alert">
              <span className="tm-unlock-emoji">✨</span>
              새로운 장소가 열렸어요! LV.{unlockLevel} {getChapter(unlockLevel).locationName}
            </div>
          )}

          {stageSize.w > 0 && (
            <div
              className={`tm-stage${isPanning ? ' tm-grabbing' : isMobile ? ' tm-grab' : ''}`}
              style={{
                width: stageSize.w,
                height: stageSize.h,
                transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
                transformOrigin: '0 0',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
            >
              {/* 배경 이미지 */}
              {imgError ? (
                <div className="tm-bg-placeholder" role="alert">
                  <span className="tm-bg-emoji">🗺️</span>
                  <div>지도를 불러오지 못했어요.</div>
                  <button
                    type="button"
                    className="tm-sb-gopalace"
                    onClick={() => {
                      setImgError(false)
                      setImgLoaded(false)
                    }}
                  >
                    다시 시도
                  </button>
                </div>
              ) : (
                <img
                  className="tm-background"
                  src={TREASURE_MAP_BACKGROUND}
                  alt="보물지도 — 열개의 빛과 꿈의 책"
                  draggable={false}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                />
              )}

              {/* 진행 경로 오버레이(완료 구간만 은은한 금빛) */}
              <svg className="tm-progress-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {TREASURE_MAP_SEGMENTS.map((seg) => {
                  const segMax = Math.max(seg.from, seg.to)
                  // 두 끝 모두 완료(현재 레벨 미만) 구간만 강조
                  if (segMax >= currentLevel) return null
                  return <path key={`${seg.from}-${seg.to}`} d={seg.d} className="tm-seg-done" />
                })}
              </svg>

              {/* 핫스팟(투명 클릭 버튼) */}
              <div className="tm-hotspot-layer">
                {TREASURE_MAP_POSITIONS.map((pos) => {
                  const state = getLevelState(pos.level, currentLevel)
                  const chapter = getChapter(pos.level)
                  const need = Math.max(0, chapter.minActivityScore - activityScore)
                  const aria =
                    state === 'locked'
                      ? `레벨 ${pos.level} ${chapter.chapterTitle}, 잠김, 다음 레벨까지 ${need.toLocaleString()}점 필요`
                      : `레벨 ${pos.level} ${chapter.chapterTitle}, ${stateLabelKo(state)}`
                  return (
                    <button
                      key={pos.level}
                      type="button"
                      className={`tm-hotspot tm-hotspot--${state}${DEBUG_TREASURE_MAP_HOTSPOTS ? ' tm-debug-hot' : ''}`}
                      style={{
                        left: `${pos.hotspot.x}%`,
                        top: `${pos.hotspot.y}%`,
                        width: `${pos.hotspot.width}%`,
                        height: `${pos.hotspot.height}%`,
                      }}
                      aria-label={aria}
                      aria-pressed={selectedLevel === pos.level}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => handleSelect(pos.level)}
                    />
                  )
                })}
              </div>

              {/* 상태 레이어 */}
              <StateLayer currentLevel={currentLevel} avatarEmoji={avatarEmoji} />

              {/* 디버그: 마커 중심 + 번호 */}
              {DEBUG_TREASURE_MAP_HOTSPOTS &&
                TREASURE_MAP_POSITIONS.map((p) => (
                  <div key={`dbg-${p.level}`}>
                    <div
                      className="tm-debug-center"
                      style={{ left: `${p.marker.x}%`, top: `${p.marker.y}%` }}
                    />
                    <div
                      className="tm-debug-num"
                      style={{ left: `${p.marker.x}%`, top: `${p.marker.y}%` }}
                    >
                      {p.level}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* 줌/현재위치 컨트롤(모바일) */}
          {isMobile && stageSize.w > 0 && (
            <div className="tm-controls">
              <button type="button" className="tm-ctrl-btn" onClick={() => zoomBy(1.2)} aria-label="지도 확대" title="확대">
                <Plus className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="tm-ctrl-btn"
                onClick={() => zoomBy(1 / 1.2)}
                aria-label="지도 축소"
                title="축소"
                disabled={transform.scale <= TREASURE_MAP_MIN_SCALE + 0.001}
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="tm-ctrl-btn"
                onClick={() => centerOnLevel(currentLevel)}
                aria-label="현재 위치로 이동"
                title="현재 위치"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 레벨 상세 패널 */}
          {selectedChapter && (
            <LevelDetailPanel
              chapter={selectedChapter}
              state={getLevelState(selectedChapter.level, currentLevel)}
              activityScore={activityScore}
              isMobile={isMobile}
              viewportRef={viewportRef}
              stageSize={stageSize}
              transform={transform}
              onClose={() => setSelectedLevel(null)}
              onEnter={goToDreamPalace}
            />
          )}
        </div>
      </main>
    </StudentPageShell>
  )
}

/* ───────────────────────────────────────────────────────────
   상태 레이어: 각 장소의 체크/자물쇠/현재위치 + 레벨5 동적 라벨
   ─────────────────────────────────────────────────────────── */
function StateLayer({
  currentLevel,
  avatarEmoji,
}: {
  currentLevel: number
  avatarEmoji: string
}) {
  return (
    <div className="tm-state-layer" aria-hidden="true">
      {TREASURE_MAP_POSITIONS.map((pos) => {
        const state = getLevelState(pos.level, currentLevel)
        const { x, y } = pos.marker

        return (
          <div key={pos.level}>
            {/* 완료 */}
            {state === 'completed' && (
              <>
                <span className="tm-ring-done" style={{ left: `${x}%`, top: `${y}%` }} />
                <span className="tm-check-badge" style={{ left: `${x}%`, top: `${y}%` }}>
                  <Check className="w-4 h-4" />
                </span>
              </>
            )}

            {/* 현재 위치 */}
            {state === 'current' && (
              <>
                <span className="tm-ring-current" style={{ left: `${x}%`, top: `${y}%` }} />
                {/* 반짝이 별 */}
                <span className="tm-sparkle" style={{ left: `${x - 7}%`, top: `${y - 6}%`, animationDelay: '0s' }}>✦</span>
                <span className="tm-sparkle" style={{ left: `${x + 7}%`, top: `${y - 3}%`, animationDelay: '0.5s' }}>✦</span>
                <span className="tm-sparkle" style={{ left: `${x + 5}%`, top: `${y + 7}%`, animationDelay: '0.9s' }}>✦</span>
                {/* 학생 캐릭터 핀 + 말풍선 */}
                <div className="tm-here-pin" style={{ left: `${x}%`, top: `${y}%` }}>
                  <span className="tm-here-bubble">여기에 있어요!</span>
                  <span className="tm-here-avatar">{avatarEmoji}</span>
                </div>
              </>
            )}

            {/* 잠김 */}
            {state === 'locked' && (
              <>
                <span className="tm-veil-locked" style={{ left: `${x}%`, top: `${y}%` }} />
                <span className="tm-lock-badge" style={{ left: `${x}%`, top: `${y}%` }}>
                  <Lock className="w-4 h-4" />
                </span>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ───────────────────────────────────────────────────────────
   레벨 상세 패널: PC/태블릿=팝오버, 모바일=하단시트
   ─────────────────────────────────────────────────────────── */
function LevelDetailPanel({
  chapter,
  state,
  activityScore,
  isMobile,
  viewportRef,
  stageSize,
  transform,
  onClose,
  onEnter,
}: {
  chapter: DreamChapter
  state: LevelState
  activityScore: number
  isMobile: boolean
  viewportRef: React.RefObject<HTMLDivElement | null>
  stageSize: { w: number; h: number }
  transform: Transform
  onClose: () => void
  onEnter: (level: number) => void
}) {
  const pos = getTreasureMapPosition(chapter.level)!
  const need = Math.max(0, chapter.minActivityScore - activityScore)
  const items = getLevelItems(chapter.level)
  const repItem = items[0]
  const isMax = chapter.level === MAX_LEVEL

  const buttonLabel =
    state === 'current' ? '이곳으로 들어가기' : state === 'completed' ? '다시 구경하기' : `${need.toLocaleString()}점이 더 필요해요`

  // 팝오버 위치(모바일은 하단시트이므로 미사용)
  const [placement, setPlacement] = useState<{ left: number; top: number; above: boolean }>({ left: 0, top: 0, above: true })
  const popRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (isMobile) return
    const vp = viewportRef.current
    if (!vp) return
    const vw = vp.clientWidth
    const vh = vp.clientHeight
    // 마커의 뷰포트 내 px 위치
    const mx = transform.tx + (pos.marker.x / 100) * stageSize.w * transform.scale
    const my = transform.ty + (pos.marker.y / 100) * stageSize.h * transform.scale
    const popW = popRef.current?.offsetWidth || 19 * 16
    const popH = popRef.current?.offsetHeight || 260
    const pad = 8
    const above = my - popH - 16 > pad
    const left = clamp(mx - popW / 2, pad, Math.max(pad, vw - popW - pad))
    const top = above ? my - popH - 14 : my + 14
    setPlacement({ left, top: clamp(top, pad, Math.max(pad, vh - popH - pad)), above })
  }, [isMobile, viewportRef, stageSize.w, stageSize.h, transform, pos.marker.x, pos.marker.y])

  const content = (
    <>
      <div className="tm-detail-head">
        <span className="tm-detail-level">LV.{chapter.level}</span>
        <span className={`tm-detail-state tm-detail-state--${state}`}>{stateLabelKo(state)}</span>
      </div>
      <div className="tm-detail-title">{chapter.chapterTitle}</div>
      <div className="tm-detail-loc">{chapter.locationName} · 상징 {chapter.symbolName}</div>
      <p className="tm-detail-desc">{chapter.nextChapterHint}</p>

      <div className="tm-detail-stats">
        <div className="tm-detail-stat">
          <div className="lbl">필요 점수</div>
          <div className="val">{chapter.minActivityScore.toLocaleString()}</div>
        </div>
        <div className="tm-detail-stat">
          <div className="lbl">내 점수</div>
          <div className="val">{activityScore.toLocaleString()}</div>
        </div>
        <div className="tm-detail-stat">
          <div className="lbl">{state === 'locked' ? '남은 점수' : isMax ? '최고단계' : '상태'}</div>
          <div className="val">{state === 'locked' ? need.toLocaleString() : isMax ? '🎉' : '—'}</div>
        </div>
      </div>

      {repItem && (
        <div className="tm-detail-item">
          <span className="tm-detail-item-emoji">{chapter.symbolEmoji}</span>
          <div className="tm-detail-item-info">
            <div className="nm">{repItem.name}</div>
            <div className="sub">이곳에서 열리는 대표 아이템 · 외 {Math.max(0, items.length - 1)}개</div>
          </div>
        </div>
      )}

      <div className="tm-detail-actions">
        {state === 'locked' ? (
          <button type="button" className="tm-detail-btn tm-detail-btn--locked" disabled>
            {buttonLabel}
          </button>
        ) : (
          <button type="button" className={`tm-detail-btn ${state === 'current' ? 'tm-detail-btn--enter' : 'tm-detail-btn--revisit'}`} onClick={() => onEnter(chapter.level)}>
            {buttonLabel}
          </button>
        )}
      </div>
      <button type="button" className="tm-detail-close" onClick={onClose}>
        닫기
      </button>
    </>
  )

  if (isMobile) {
    return (
      <>
        <div className="tm-detail-sheet-backdrop" onClick={onClose} />
        <div className="tm-detail-sheet" role="dialog" aria-label={`레벨 ${chapter.level} ${chapter.chapterTitle} 정보`}>
          <div className="tm-detail-sheet-grip" />
          {content}
        </div>
      </>
    )
  }

  return (
    <div
      ref={popRef}
      className={`tm-detail-popover ${placement.above ? 'tm-pop-below' : 'tm-pop-above'}`}
      style={{ left: placement.left, top: placement.top }}
      role="dialog"
      aria-label={`레벨 ${chapter.level} ${chapter.chapterTitle} 정보`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {content}
    </div>
  )
}
