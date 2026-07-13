import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  Flower2,
  Gift,
  Leaf,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Sparkles,
  Sprout,
  WandSparkles,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import StudentPageShell from '../components/layout/StudentPageShell'
import DreamGardenPetals from '../components/dream-garden/DreamGardenPetals'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { GardenPlacement, RewardResult, StudentGarden, StudentItem } from '../types/dreamGarden'
import {
  getAutoGardenPlacement,
  getGardenPlacements,
  getOrCreateStudentGarden,
  getStudentItems,
  grantAttendanceReward,
  grantComicCompleteReward,
  grantLuckyRewardIfNeeded,
  saveGardenPlacement,
  updateGardenPlacement,
} from '../services/dreamGardenService'

// ───────────────────────────────────────────────────────────
// 좌표는 정원 캔버스(slots 컨테이너) 기준 비율 좌표(0~100)로 관리.
// DB의 x,y 컬럼을 그대로 비율값으로 사용한다(픽셀 아님).
// ───────────────────────────────────────────────────────────
const BOUND_X_MIN = 2
const BOUND_X_MAX = 96
const BOUND_Y_MIN = 4
const BOUND_Y_MAX = 92

const SCALE_MIN = 0.5
const SCALE_MAX = 2.0
const SCALE_STEP = 0.1
const ROTATION_STEP = 15
const HIGHLIGHT_DURATION = 2600

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

type PlacementTransform = { scale: number; rotation: number; x: number; y: number }

// DB에서 온 placement 값이 undefined/문자열이어도 항상 안전한 숫자가 되도록 정규화.
// rotation 컬럼이 아직 없는 DB에서 rotation이 undefined로 내려오는 경우를 방어한다.
function normalizePlacement(p: GardenPlacement): GardenPlacement {
  const scale = Number(p.scale)
  const rotation = Number(p.rotation)
  const x = Number(p.x)
  const y = Number(p.y)
  return {
    ...p,
    scale: Number.isFinite(scale) ? scale : 1,
    rotation: Number.isFinite(rotation) ? rotation : 0,
    x: Number.isFinite(x) ? x : 40,
    y: Number.isFinite(y) ? y : 50,
  }
}

// 마지막으로 서버에 저장 확정된 값(롤백 기준).
function snapshotPlacement(p: GardenPlacement): PlacementTransform {
  return {
    scale: Number(p.scale) || 1,
    rotation: Number(p.rotation) || 0,
    x: Number(p.x) || 40,
    y: Number(p.y) || 50,
  }
}

// 데스크톱에서 왼쪽 정보 패널이 정원 위를 덮는 폭(px).
// 모바일(<=860px)에서는 패널이 정원 위쪽에 별도 영역으로 배치되므로 0.
function getOverlayWidthPx() {
  if (typeof window === 'undefined') return 0
  const w = window.innerWidth
  if (w <= 860) return 0
  return w >= 1181 ? 310 : 300
}

// 왼쪽 패널에 가려지지 않도록 보장할 최소 x(%).
function computeSafeMinXPercent(containerWidthPx: number) {
  const overlay = getOverlayWidthPx()
  if (overlay <= 0 || containerWidthPx <= 0) return BOUND_X_MIN
  return Math.min(40, ((overlay + 16) / containerWidthPx) * 100)
}

// 새로 배치할 아이템의 안전한 위치 선정.
// getAutoGardenPlacement의 테마 좌표를 기준점으로 삼고,
// 안전 영역 안으로 클램프한 뒤 기존 배치와 가장 멀리 떨어진 후보를 고른다.
function findAutoPosition(
  item: GardenPlacement['item'],
  existing: { x: number; y: number }[],
  containerWidthPx: number
) {
  const base = getAutoGardenPlacement(item)
  const safeMinX = Math.max(computeSafeMinXPercent(containerWidthPx), 30)
  const baseX = base.x ?? 40
  const baseY = base.y ?? 50

  const candidates: { x: number; y: number }[] = []
  const offsets = [
    [0, 0],
    [9, 0],
    [-9, 0],
    [0, 9],
    [0, -9],
    [16, 8],
    [-16, 8],
    [16, -8],
    [-16, -8],
    [24, 0],
    [-24, 0],
    [0, 18],
    [0, -18],
  ]
  for (const [dx, dy] of offsets) {
    candidates.push({ x: baseX + dx, y: baseY + dy })
  }

  let best = { x: clamp(baseX, safeMinX, BOUND_X_MAX - 2), y: clamp(baseY, BOUND_Y_MIN + 6, BOUND_Y_MAX - 4) }
  let bestScore = -1
  for (const c of candidates) {
    const x = clamp(c.x, safeMinX, BOUND_X_MAX - 2)
    const y = clamp(c.y, BOUND_Y_MIN + 6, BOUND_Y_MAX - 4)
    let nearest = Infinity
    for (const p of existing) {
      const d = Math.hypot(p.x - x, p.y - y)
      if (d < nearest) nearest = d
    }
    if (nearest === Infinity) nearest = 60
    if (nearest > bestScore) {
      bestScore = nearest
      best = { x, y }
    }
  }

  return { x: best.x, y: best.y, scale: base.scale ?? 1, zIndex: base.zIndex ?? 5 }
}

function getRewardMessage(result: RewardResult) {
  if (result.status === 'already_claimed') return '이미 받은 보상이에요.'
  if (result.status === 'skipped') return result.message
  return result.item ? `${result.item.name} 획득!` : result.message
}

function getItemEmoji(item?: StudentItem['item'] | GardenPlacement['item'] | null) {
  if (item?.category === 'nature') return '🌱'
  if (item?.category === 'sky') return '✨'
  if (item?.category === 'animal') return '🦋'
  if (item?.category === 'decor') return '🪑'
  if (item?.category === 'spirit') return '🌟'
  if (item?.category === 'legend') return '🌈'
  return '🎁'
}

function ItemImage({ item, imgClassName, fallbackClassName }: { item?: StudentItem['item'] | GardenPlacement['item'] | null, imgClassName?: string, fallbackClassName?: string }) {
  const [imgError, setImgError] = useState(false)
  if (item?.image_url && !imgError) {
    return <img src={item.image_url} alt={item?.name ?? '아이템'} className={imgClassName} onError={() => setImgError(true)} draggable={false} />
  }
  return <span className={fallbackClassName}>{getItemEmoji(item)}</span>
}

type TransformPatch = { scale?: number; rotation?: number }

function GardenPlacementItem({
  placement,
  isSelected,
  isHighlighted,
  onSelect,
  onDragSave,
  onUpdateTransform,
  registerElement,
}: {
  placement: GardenPlacement
  isSelected: boolean
  isHighlighted: boolean
  onSelect: (id: string | null) => void
  onDragSave: (id: string, x: number, y: number) => Promise<void>
  onUpdateTransform: (id: string, patch: TransformPatch) => void
  registerElement: (id: string, el: HTMLElement | null) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pos, setPos] = useState({ x: placement.x, y: placement.y })
  const startPos = useRef({ x: 0, y: 0 })
  const startPointer = useRef({ x: 0, y: 0 })
  const movedRef = useRef(false)

  useEffect(() => {
    if (!isDragging) {
      setPos({ x: placement.x, y: placement.y })
    }
  }, [placement.x, placement.y, isDragging])

  const scale = clamp(placement.scale ?? 1, SCALE_MIN, SCALE_MAX)
  const rotation = placement.rotation ?? 0

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const el = containerRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    setIsDragging(true)
    movedRef.current = false
    startPos.current = { ...pos }
    startPointer.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    const parent = containerRef.current?.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()

    const dxPercent = ((e.clientX - startPointer.current.x) / rect.width) * 100
    const dyPercent = ((e.clientY - startPointer.current.y) / rect.height) * 100

    const newX = clamp(startPos.current.x + dxPercent, BOUND_X_MIN, BOUND_X_MAX)
    const newY = clamp(startPos.current.y + dyPercent, BOUND_Y_MIN, BOUND_Y_MAX)

    if (
      Math.abs(e.clientX - startPointer.current.x) >= 3 ||
      Math.abs(e.clientY - startPointer.current.y) >= 3
    ) {
      movedRef.current = true
    }

    setPos({ x: newX, y: newY })
  }

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    const el = containerRef.current
    if (el) el.releasePointerCapture(e.pointerId)

    // 거의 움직이지 않았다면 '클릭'으로 간주 → 선택 토글.
    if (!movedRef.current) {
      onSelect(isSelected ? null : placement.id)
      return
    }

    try {
      await onDragSave(placement.id, pos.x, pos.y)
    } catch {
      setPos(startPos.current)
    }
  }

  const changeScale = (delta: number) => {
    const next = clamp(round1(scale + delta), SCALE_MIN, SCALE_MAX)
    onUpdateTransform(placement.id, { scale: next })
  }
  const changeRotation = (delta: number) => {
    // 시각적으로 동일한 각도로 -180~180 범위에 정규화.
    // 저장값이 DB CHECK 제약(rotation ∈ [-360,360])을 벗어나 저장이 실패하는 것을 막는다.
    const next = ((((rotation + delta + 180) % 360) + 360) % 360) - 180
    onUpdateTransform(placement.id, { rotation: Math.round(next) })
  }
  const resetTransform = () => {
    onUpdateTransform(placement.id, { scale: 1, rotation: 0 })
  }

  const zIndex = isDragging ? 200 : isSelected ? 120 : isHighlighted ? 110 : placement.z_index || 5

  return (
    <div
      ref={(el) => {
        containerRef.current = el
        registerElement(placement.id, el)
      }}
      className={[
        'dg-item',
        isSelected ? 'dg-item-selected' : '',
        isHighlighted ? 'dg-item-highlighted' : '',
        isDragging ? 'dg-item-dragging' : '',
      ].join(' ')}
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        zIndex,
        touchAction: 'none',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="button"
      tabIndex={0}
      aria-label={placement.item?.name ?? '정원 아이템'}
      title={placement.item?.name ?? ''}
    >
      <div className="dg-item-visual" style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}>
        <div className={isHighlighted ? 'dg-item-bob dg-item-bob-active' : 'dg-item-bob'}>
          {isHighlighted && <span className="dg-highlight-ring" aria-hidden="true" />}
          <div className="dream-garden-slot-object" draggable={false}>
            <ItemImage
              item={placement.item}
              imgClassName="dream-garden-item-img pointer-events-none"
              fallbackClassName="dream-garden-item-emoji pointer-events-none"
            />
            <span className="dream-garden-item-name pointer-events-none">{placement.item?.name ?? '아이템'}</span>
          </div>
        </div>
      </div>

      {isHighlighted && (
        <span className="dg-here-bubble" aria-hidden="true">
          여기에 있어요!
        </span>
      )}

      {isSelected && !isDragging && (
        <div
          className="dg-edit-popover"
          onPointerDown={(e) => e.stopPropagation()}
          role="toolbar"
          aria-label={`${placement.item?.name ?? '아이템'} 편집`}
        >
          <div className="dg-edit-head">
            <span className="dg-edit-name">{placement.item?.name ?? '아이템'}</span>
            <span className="dg-edit-percent">{Math.round(scale * 100)}%</span>
          </div>
          <div className="dg-edit-row">
            <button type="button" className="dg-edit-btn" onClick={() => changeScale(-SCALE_STEP)} aria-label="작게" title="작게">
              <ZoomOut />
            </button>
            <button type="button" className="dg-edit-btn" onClick={() => changeScale(SCALE_STEP)} aria-label="크게" title="크게">
              <ZoomIn />
            </button>
            <button type="button" className="dg-edit-btn" onClick={() => changeRotation(-ROTATION_STEP)} aria-label="왼쪽으로 회전" title="왼쪽 회전">
              <RotateCcw />
            </button>
            <button type="button" className="dg-edit-btn" onClick={() => changeRotation(ROTATION_STEP)} aria-label="오른쪽으로 회전" title="오른쪽 회전">
              <RotateCw />
            </button>
            <button type="button" className="dg-edit-btn dg-edit-btn-reset" onClick={resetTransform} aria-label="크기와 회전 초기화" title="초기화">
              <RefreshCw />
            </button>
            <button type="button" className="dg-edit-btn dg-edit-btn-close" onClick={() => onSelect(null)} aria-label="선택 해제" title="닫기">
              <X />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentDreamGardenPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const studentId = profile?.role === 'student' ? profile.id : user?.id

  const [garden, setGarden] = useState<StudentGarden | null>(null)
  const [studentItems, setStudentItems] = useState<StudentItem[]>([])
  const [placements, setPlacements] = useState<GardenPlacement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWorking, setIsWorking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAllItemsModalOpen, setIsAllItemsModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const slotsContainerRef = useRef<HTMLDivElement>(null)
  const elementRefs = useRef<Map<string, HTMLElement>>(new Map())
  const highlightTimer = useRef<number | null>(null)
  const messageTimer = useRef<number | null>(null)
  const fieldSaveTimers = useRef<Record<string, number>>({})
  const pendingFields = useRef<Record<string, number>>({})
  const committedRef = useRef<Map<string, PlacementTransform>>(new Map())

  function showMessage(next: string | null, duration = 2000) {
    setMessage(next)
    if (messageTimer.current) window.clearTimeout(messageTimer.current)
    if (next && duration > 0) {
      messageTimer.current = window.setTimeout(() => setMessage(null), duration)
    }
  }

  function registerElement(id: string, el: HTMLElement | null) {
    if (el) {
      elementRefs.current.set(id, el)
    } else {
      elementRefs.current.delete(id)
    }
  }

  function triggerHighlight(placementId: string) {
    setHighlightId(placementId)
    if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), HIGHLIGHT_DURATION)
  }

  async function locatePlacement(studentItemId: string, itemId: string) {
    setIsAllItemsModalOpen(false)
    // 1) 클릭한 획득 기록과 동일한 인스턴스(student_item_id) 우선 탐색.
    let target = placements.find((p) => p.student_item_id === studentItemId)
    // 2) 없다면 같은 종류(item_id)의 배치 중 첫 번째.
    if (!target) {
      target = placements.find((p) => p.item_id === itemId)
    }

    // 3) 배치가 아예 없으면 즉시 생성한 뒤 강조한다.
    if (!target) {
      const si = studentItems.find((s) => s.id === studentItemId)
      if (si && studentId && si.item?.is_placeable) {
        try {
          const containerWidthPx =
            slotsContainerRef.current?.getBoundingClientRect().width ??
            (typeof window !== 'undefined' ? window.innerWidth : 1024)
          const pos = findAutoPosition(si.item, placements, containerWidthPx)
          const created = normalizePlacement(
            await saveGardenPlacement({
              studentId,
              studentItemId: si.id,
              itemId: si.item_id,
              x: pos.x,
              y: pos.y,
              scale: pos.scale,
              zIndex: pos.zIndex,
            })
          )
          committedRef.current.set(created.id, snapshotPlacement(created))
          setPlacements((prev) => [...prev, created])
          target = created
        } catch (err) {
          if (import.meta.env.DEV) console.error('[DreamGarden] locate auto-place failed:', studentItemId, err)
          showMessage('정원에 아직 놓지 못한 아이템이에요. 잠시 후 다시 시도해 주세요.')
          return
        }
      } else {
        showMessage('아직 정원에 배치할 수 없는 아이템이에요.')
        return
      }
    }

    if (!target) return

    const el = elementRefs.current.get(target.id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    }
    setSelectedId(null)
    triggerHighlight(target.id)
  }

  async function handleSavePosition(placementId: string, x: number, y: number) {
    showMessage('위치 저장 중...', 0)
    try {
      const updated = normalizePlacement(await updateGardenPlacement({ placementId, x, y }))
      committedRef.current.set(placementId, snapshotPlacement(updated))
      // 위치 저장은 x,y만 반영. scale/rotation은 건드리지 않는다.
      setPlacements((prev) =>
        prev.map((p) => (p.id === placementId ? { ...p, x: updated.x, y: updated.y } : p))
      )
      showMessage('위치를 저장했어요.')
    } catch (err) {
      if (import.meta.env.DEV) console.error('[DreamGarden] position save failed:', placementId, err)
      const snap = committedRef.current.get(placementId)
      if (snap) {
        setPlacements((prev) =>
          prev.map((p) => (p.id === placementId ? { ...p, x: snap.x, y: snap.y } : p))
        )
      }
      setError('위치를 저장하지 못했어요. 다시 옮겨 주세요.')
      setTimeout(() => setError(null), 3000)
      throw err
    }
  }

  function scheduleFieldSave(placementId: string, field: 'scale' | 'rotation', value: number) {
    const key = `${placementId}:${field}`
    pendingFields.current[key] = value
    showMessage('저장 중...', 0)

    if (fieldSaveTimers.current[key]) {
      window.clearTimeout(fieldSaveTimers.current[key])
    }
    fieldSaveTimers.current[key] = window.setTimeout(async () => {
      const v = pendingFields.current[key]
      delete pendingFields.current[key]
      // 필드별로 독립 저장. scale 저장은 rotation을, rotation 저장은 scale을 덮어쓰지 않는다.
      const payload = field === 'scale' ? { scale: v } : { rotation: v }
      try {
        const updated = normalizePlacement(await updateGardenPlacement({ placementId, ...payload }))
        committedRef.current.set(placementId, snapshotPlacement(updated))
        setPlacements((prev) =>
          prev.map((p) =>
            p.id === placementId
              ? {
                  ...p,
                  scale: Number.isFinite(Number(updated.scale)) ? Number(updated.scale) : p.scale,
                  rotation: Number.isFinite(Number(updated.rotation)) ? Number(updated.rotation) : p.rotation,
                  updated_at: updated.updated_at,
                }
              : p
          )
        )
        showMessage('저장했어요.')
      } catch (err) {
        if (import.meta.env.DEV) console.error(`[DreamGarden] ${field} save failed:`, placementId, err)
        // 해당 필드만 마지막 저장값으로 롤백(다른 필드에 영향을 주지 않음).
        const snap = committedRef.current.get(placementId)
        if (snap) {
          setPlacements((prev) =>
            prev.map((p) => (p.id === placementId ? { ...p, [field]: snap[field] } : p))
          )
        }
        setError('크기·회전 저장에 실패했어요. 다시 시도해 주세요.')
        setTimeout(() => setError(null), 3000)
      } finally {
        delete fieldSaveTimers.current[key]
      }
    }, 450)
  }

  function handleUpdateTransform(placementId: string, patch: TransformPatch) {
    // 낙관적 상태는 해당 필드만 부분 갱신(다른 필드를 덮어쓰지 않음).
    setPlacements((prev) =>
      prev.map((p) => (p.id === placementId ? { ...p, ...patch } : p))
    )
    if (typeof patch.scale === 'number') {
      scheduleFieldSave(placementId, 'scale', patch.scale)
    }
    if (typeof patch.rotation === 'number') {
      scheduleFieldSave(placementId, 'rotation', patch.rotation)
    }
  }

  async function loadGardenData() {
    if (!studentId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const gardenData = await getOrCreateStudentGarden(studentId)
      const [itemsData, placementsRaw] = await Promise.all([
        getStudentItems(studentId),
        getGardenPlacements(studentId),
      ])
      let placementsData: GardenPlacement[] = placementsRaw.map(normalizePlacement)
      let changedByRecovery = false

      const containerWidthPx =
        slotsContainerRef.current?.getBoundingClientRect().width ??
        (typeof window !== 'undefined' ? window.innerWidth : 1024)
      const safeMinX = computeSafeMinXPercent(containerWidthPx)

      // ── 1) 기존 배치 보정: 화면 밖 / 왼쪽 패널 뒤에 가려진 좌표를 안전 영역으로. ──
      const corrected: GardenPlacement[] = []
      for (const p of placementsData) {
        let x = p.x
        let y = p.y
        let changed = false
        if (x < BOUND_X_MIN || x > BOUND_X_MAX) {
          x = clamp(x, BOUND_X_MIN, BOUND_X_MAX)
          changed = true
        }
        if (y < BOUND_Y_MIN || y > BOUND_Y_MAX) {
          y = clamp(y, BOUND_Y_MIN, BOUND_Y_MAX)
          changed = true
        }
        if (!changed && x < safeMinX) {
          x = safeMinX + 1
          changed = true
        }
        if (changed) {
          try {
            const updated = normalizePlacement(await updateGardenPlacement({ placementId: p.id, x, y }))
            corrected.push(updated)
            changedByRecovery = true
          } catch (err) {
            if (import.meta.env.DEV) console.error('[DreamGarden] placement correct failed:', p.id, err)
            corrected.push({ ...p, x, y })
          }
        } else {
          corrected.push(p)
        }
      }
      placementsData = corrected

      // ── 2) 보유 아이템 중 배치가 없는 것을 개별 인스턴스로 자동 배치(한 건 실패해도 나머지 계속). ──
      const placeMissing = async (missing: StudentItem[]) => {
        for (const si of missing) {
          try {
            const pos = findAutoPosition(si.item, placementsData, containerWidthPx)
            const created = normalizePlacement(
              await saveGardenPlacement({
                studentId,
                studentItemId: si.id,
                itemId: si.item_id,
                x: pos.x,
                y: pos.y,
                scale: pos.scale,
                zIndex: pos.zIndex,
              })
            )
            placementsData = [...placementsData, created]
            changedByRecovery = true
          } catch (err) {
            if (import.meta.env.DEV) console.error('[DreamGarden] auto-place failed:', si.id, si.item?.name, err)
          }
        }
      }
      const buildMissing = () => {
        const placed = new Set(placementsData.map((p) => p.student_item_id))
        return itemsData.filter((si) => si.item?.is_placeable && !placed.has(si.id))
      }
      await placeMissing(buildMissing())
      // 누락이 남아 있으면 1회 재시도.
      const stillMissing = buildMissing()
      if (stillMissing.length > 0) {
        await placeMissing(stillMissing)
      }

      // ── 3) 보정/생성이 있었다면 최신 DB 기준으로 한 번 더 동기화(이전 상태 덮어쓰기 방지). ──
      if (changedByRecovery) {
        try {
          placementsData = (await getGardenPlacements(studentId)).map(normalizePlacement)
        } catch (err) {
          if (import.meta.env.DEV) console.error('[DreamGarden] re-fetch after recovery failed:', err)
        }
      }

      // ── 4) 마지막 저장 확정값(롤백 기준) 갱신. ──
      committedRef.current = new Map(placementsData.map((p) => [p.id, snapshotPlacement(p)]))

      setGarden(gardenData)
      setStudentItems(itemsData)
      setPlacements(placementsData)

      // ── 5) 검증: 배치 가능 아이템 중 여전히 배치가 없으면 안내. ──
      const finalMissing = buildMissing()
      if (finalMissing.length > 0) {
        setError(`아이템 ${finalMissing.length}개를 정원에 아직 못 놓았어요. 잠시 후 새로고침해 주세요.`)
        setTimeout(() => setError(null), 5000)
      }

      if (import.meta.env.DEV) {
        const placeableCount = itemsData.filter((si) => si.item?.is_placeable).length
        console.info(`[DreamGarden] load ok: placeable=${placeableCount}, placements=${placementsData.length}`)
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('[DreamGarden] load failed:', err)
      setError('정원 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      void loadGardenData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, studentId])

  useEffect(() => {
    return () => {
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current)
      if (messageTimer.current) window.clearTimeout(messageTimer.current)
      for (const id of Object.keys(fieldSaveTimers.current)) {
        window.clearTimeout(fieldSaveTimers.current[id])
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAllItemsModalOpen) {
          setIsAllItemsModalOpen(false)
        } else if (selectedId) {
          setSelectedId(null)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAllItemsModalOpen, selectedId])

  useEffect(() => {
    if (isAllItemsModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isAllItemsModalOpen])

  async function handleReward(action: () => Promise<RewardResult>) {
    setIsWorking(true)
    setError(null)
    setMessage(null)

    try {
      const result = await action()
      showMessage(getRewardMessage(result))
      await loadGardenData()
    } catch (err) {
      setError('보상을 받는 중 문제가 생겼어요.')
    } finally {
      setIsWorking(false)
    }
  }

  const recentItems = useMemo(
    () =>
      [...studentItems]
        .sort((a, b) => {
          const aTime = new Date(a.acquired_at || a.created_at).getTime()
          const bTime = new Date(b.acquired_at || b.created_at).getTime()
          return bTime - aTime
        })
        .slice(0, 3),
    [studentItems]
  )

  const totalItemCount = studentItems.reduce((sum, item) => sum + item.quantity, 0)
  const placedCount = placements.length
  const ownedKindCount = studentItems.length

  const handleBackgroundPointerDown = (e: React.PointerEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedId(null)
    }
  }

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="full">
      <main className="dream-garden-page">
        <section className="dream-garden-stage" aria-label="나의 꿈의 정원">

          {/* ── 배경 이미지 ── */}
          <div className="dg-background-image" />

          {/* ── 꽃비 효과 (정원이 살아있는 느낌, 매우 은은함 / 클릭·드래그 간섭 없음) ── */}
          <DreamGardenPetals />

          {/* ── 토스트 알림 ── */}
          {(message || error) && (
            <div className={`dream-garden-toast ${error ? 'dream-garden-toast-error' : 'dream-garden-toast-success'}`}>
              {error ?? message}
            </div>
          )}

          {(authLoading || isLoading) && (
            <div className="dream-garden-loading">
              <Loader2 className="w-5 h-5 animate-spin" />
              정원을 불러오는 중
            </div>
          )}

          {/* ── 왼쪽 정보 오버레이 ── */}
          <aside className="dream-garden-overlay dream-garden-overlay-left" aria-label="정원 정보">
            {/* ── 제목 패널 ── */}
            <div className="dream-garden-title">
              <div className="dg-title-badge">
                <Sprout className="w-4 h-4" />
                꿈의 정원
              </div>
              <h1 className="dg-title-text">
                {garden?.garden_name ?? '나의 꿈의 정원'}
              </h1>
              <p className="dg-title-sub">
                출석하고 만화를 완성하면 정원 아이템을 모을 수 있어요.
              </p>
            </div>

            {/* 정원 단계 */}
            <div className="dg-info-section">
              <div className="dg-info-header">
                <div className="dg-info-icon dg-info-icon-green">
                  <Leaf className="w-4 h-4" />
                </div>
                <p className="dg-info-label">정원 단계</p>
              </div>
              <div className="dg-level-badge">
                <span className="dg-level-num">{garden?.level ?? 1}단계</span>
                <span className="dg-level-name">씨앗 뜨 정원</span>
              </div>
              <div className="dg-progress-bar-wrap">
                <div className="dg-progress-track">
                  <div
                    className="dg-progress-fill"
                    style={{ width: `${ownedKindCount === 0 ? 0 : Math.min(100, (placedCount / ownedKindCount) * 100)}%` }}
                  />
                </div>
                <div className="dg-progress-labels">
                  <span>정원 꾸미기</span>
                  <span>{placedCount}/{ownedKindCount}</span>
                </div>
              </div>
            </div>

            {/* 아이템 종류 */}
            <div className="dg-info-section">
              <p className="dg-section-title">
                <Flower2 className="w-3.5 h-3.5" />
                아이템 종류
              </p>
              <div className="dg-category-grid">
                {[
                  { label: '정식', count: '18/45', color: '#f9a8d4' },
                  { label: '식물', count: '16/32', color: '#86efac' },
                  { label: '동물', count: '5/20', color: '#fcd34d' },
                  { label: '건물', count: '3/15', color: '#93c5fd' },
                  { label: '기타', count: '2/18', color: '#c4b5fd' },
                ].map(({ label, count, color }) => (
                  <div key={label} className="dg-category-chip" style={{ '--chip-color': color } as React.CSSProperties}>
                    <span className="dg-chip-dot" style={{ background: color }} />
                    <span className="dg-chip-label">{label}</span>
                    <span className="dg-chip-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 잠금 아이템 안내 */}
            <div className="dg-locked-info">
              <div className="dg-locked-info-header">
                <Lock className="w-3.5 h-3.5 text-purple-500" />
                <p className="font-jua text-sm text-slate-700">잠금 아이템</p>
              </div>
              <p className="dg-locked-info-text">
                다음 단계에서 더 많은 아이템을<br />만나보세요!
              </p>
              <div className="dg-locked-slots">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="dg-locked-slot-chip">
                    <Lock className="w-3 h-3" />
                  </div>
                ))}
              </div>
            </div>
            {/* 획득 아이템 수 */}
            <div className="dg-info-section">
              <div className="dg-info-header">
                <div className="dg-info-icon dg-info-icon-pink">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <p className="dg-info-label">내가 획득한 아이템</p>
                  <p className="dg-big-count">{totalItemCount}개</p>
                </div>
              </div>
            </div>

            {/* 최근 획득 */}
            <div className="dg-info-section">
              <div className="dg-info-header">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <p className="dg-section-title-inline">최근 획득</p>
                <button
                  type="button"
                  className="dg-view-all-btn"
                  onClick={() => setIsAllItemsModalOpen(true)}
                >
                  전체 보기
                </button>
              </div>
              {recentItems.length === 0 ? (
                <div className="dg-empty-recent">
                  <WandSparkles className="w-5 h-5 text-purple-300" />
                  <p className="font-jua text-sm text-slate-500">첫 아이템을 기다리는 중</p>
                </div>
              ) : (
                <div className="dg-recent-list">
                  {recentItems.map((studentItem) => (
                    <button
                      key={studentItem.id}
                      type="button"
                      className="dg-recent-item dg-clickable appearance-none"
                      onClick={() => locatePlacement(studentItem.id, studentItem.item_id)}
                    >
                      <ItemImage item={studentItem.item} imgClassName="dg-recent-thumb-img" fallbackClassName="dg-recent-thumb" />
                      <div className="dg-recent-info">
                        <p className="dg-recent-name">{studentItem.item?.name ?? '아이템'}</p>
                        <p className="dg-recent-time">여기를 눌러 위치 보기</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 보상 안내 */}
            <div className="dg-reward-guide">
              <div className="dg-reward-guide-header">
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <p className="font-jua text-sm text-amber-900">보상 안내</p>
              </div>
              <p className="dg-reward-guide-text">
                정원 아이템을 누르면 크기와 회전을<br />바꿀 수 있어요! 🌿
              </p>
            </div>

            {/* 개발 테스트 */}
            {false && (
            <details className="dream-garden-dev-panel">
              <summary>
                <span>개발 테스트</span>
                <ChevronDown className="w-4 h-4" />
              </summary>
              <div className="dg-test-buttons">
                <button
                  type="button"
                  disabled={!studentId || isWorking}
                  onClick={() => handleReward(() => grantAttendanceReward(studentId as string))}
                  className="dg-test-btn dg-test-btn-pink"
                >
                  📅 출석
                </button>
                <button
                  type="button"
                  disabled={!studentId || isWorking}
                  onClick={() => handleReward(() => grantComicCompleteReward(studentId as string, `test-comic-${Date.now()}`))}
                  className="dg-test-btn dg-test-btn-purple"
                >
                  ✏️ 만화 완성
                </button>
                <button
                  type="button"
                  disabled={!studentId || isWorking}
                  onClick={() => handleReward(() => grantLuckyRewardIfNeeded(studentId as string))}
                  className="dg-test-btn dg-test-btn-amber"
                >
                  ❓ 우연한 행운
                </button>
              </div>
            </details>
            )}
          </aside>

          {/* ── 정원 아이템들 (저장된 비율 좌표 그대로 배치) ── */}
          <div
            ref={slotsContainerRef}
            className="dream-garden-slots"
            onPointerDown={handleBackgroundPointerDown}
            aria-label="정원 꾸미기 자리"
          >
            {placements.map((placement) => (
              <GardenPlacementItem
                key={placement.id}
                placement={placement}
                isSelected={selectedId === placement.id}
                isHighlighted={highlightId === placement.id}
                onSelect={setSelectedId}
                onDragSave={handleSavePosition}
                onUpdateTransform={handleUpdateTransform}
                registerElement={registerElement}
              />
            ))}
          </div>


        </section>
      </main>

      {/* ── 전체 아이템 모달 ── */}
      {isAllItemsModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setIsAllItemsModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-2xl font-jua text-slate-800 flex items-center gap-2">
                  <Gift className="w-6 h-6 text-pink-500" />
                  내가 획득한 아이템
                </h2>
                <p className="text-slate-500 font-medium mt-1">총 {totalItemCount}개 · 카드를 누르면 정원 위치를 보여줘요</p>
              </div>
              <button
                type="button"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                onClick={() => setIsAllItemsModalOpen(false)}
                aria-label="닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 모달 본문 (스크롤) */}
            <div className="p-6 overflow-y-auto">
              {studentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <WandSparkles className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="font-jua text-xl text-slate-500">아직 획득한 아이템이 없어요.</p>
                  <p className="text-slate-400 mt-2">출석하거나 만화를 완성해서 아이템을 모아보세요!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...studentItems]
                    .sort((a, b) => {
                      const aTime = new Date(a.acquired_at || a.created_at).getTime()
                      const bTime = new Date(b.acquired_at || b.created_at).getTime()
                      return bTime - aTime
                    })
                    .map((studentItem) => (
                      <button
                        key={studentItem.id}
                        type="button"
                        className="appearance-none bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col items-center text-center hover:shadow-md hover:border-pink-200 transition-all cursor-pointer"
                        onClick={() => locatePlacement(studentItem.id, studentItem.item_id)}
                      >
                        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3">
                          <ItemImage item={studentItem.item} imgClassName="max-w-[4rem] max-h-[4rem] object-contain" fallbackClassName="text-3xl" />
                        </div>
                        <strong className="font-jua text-lg text-slate-800 mb-1 line-clamp-1">
                          {studentItem.item?.name ?? '알 수 없는 아이템'}
                        </strong>
                        <div className="flex flex-col items-center gap-1 text-sm text-slate-500">
                          <span className="px-2 py-0.5 bg-slate-200/50 rounded-full text-xs font-medium">
                            {studentItem.item?.category === 'nature' && '식물'}
                            {studentItem.item?.category === 'sky' && '하늘 장식'}
                            {studentItem.item?.category === 'animal' && '동물'}
                            {studentItem.item?.category === 'decor' && '장식'}
                            {studentItem.item?.category === 'spirit' && '정령'}
                            {studentItem.item?.category === 'legend' && '전설'}
                            {!['nature', 'sky', 'animal', 'decor', 'spirit', 'legend'].includes(studentItem.item?.category ?? '') && (studentItem.item?.category ?? '기타')}
                          </span>
                          <span className="text-xs">
                            {new Date(studentItem.acquired_at || studentItem.created_at).toLocaleDateString('ko-KR')} 획득
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </StudentPageShell>
  )
}
