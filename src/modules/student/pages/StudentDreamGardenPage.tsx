import { useEffect, useMemo, useState } from 'react'
import {
  Armchair,
  ChevronDown,
  CloudSun,
  Flower2,
  Gift,
  Gem,
  Leaf,
  Loader2,
  Lock,
  Plus,
  Rabbit,
  Sparkles,
  Sprout,
  TreePine,
  WandSparkles,
  Waves,
} from 'lucide-react'
import StudentPageShell from '../components/layout/StudentPageShell'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { GardenPlacement, RewardResult, StudentGarden, StudentItem } from '../types/dreamGarden'
import {
  getGardenPlacements,
  getOrCreateStudentGarden,
  getStudentItems,
  grantAttendanceReward,
  grantComicCompleteReward,
  grantLuckyRewardIfNeeded,
  saveGardenPlacement,
} from '../services/dreamGardenService'

type GardenSlotId =
  | 'center_fountain'
  | 'left_flowerbed'
  | 'top_tree'
  | 'right_animal'
  | 'bottom_bench'
  | 'pond'
  | 'path_decoration'
  | 'sky_magic'

type GardenSlot = {
  id: GardenSlotId
  label: string
  category: string
  x: number
  y: number
  size: 'sm' | 'md' | 'lg'
  icon: typeof Sprout
  zIndex: number
}

const gardenSlots: GardenSlot[] = [
  { id: 'sky_magic', label: '하늘 장식', category: 'sky', x: 73, y: 15, size: 'sm', icon: CloudSun, zIndex: 7 },
  { id: 'top_tree', label: '큰 나무', category: 'nature', x: 24, y: 24, size: 'lg', icon: TreePine, zIndex: 3 },
  { id: 'pond', label: '연못', category: 'nature', x: 73, y: 39, size: 'lg', icon: Waves, zIndex: 2 },
  { id: 'left_flowerbed', label: '꽃밭', category: 'nature', x: 20, y: 61, size: 'md', icon: Flower2, zIndex: 5 },
  { id: 'center_fountain', label: '중앙 장식', category: 'decor', x: 49, y: 54, size: 'lg', icon: Gem, zIndex: 6 },
  { id: 'right_animal', label: '동물 친구', category: 'animal', x: 82, y: 66, size: 'md', icon: Rabbit, zIndex: 7 },
  { id: 'path_decoration', label: '길 장식', category: 'decor', x: 38, y: 76, size: 'sm', icon: Sparkles, zIndex: 8 },
  { id: 'bottom_bench', label: '벤치', category: 'decor', x: 63, y: 80, size: 'md', icon: Armchair, zIndex: 8 },
]

const rarityLabels: Record<string, string> = {
  common: '기본',
  uncommon: '특별',
  rare: '희귀',
  epic: '반짝',
  legendary: '전설',
}

const categoryLabels: Record<string, string> = {
  nature: '자연',
  animal: '친구',
  spirit: '정령',
  decor: '장식',
  sky: '하늘',
  legend: '전설',
}

const rarityStyles: Record<string, string> = {
  common: 'bg-slate-100 text-slate-600 border-slate-200',
  uncommon: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rare: 'bg-sky-100 text-sky-700 border-sky-200',
  epic: 'bg-purple-100 text-purple-700 border-purple-200',
  legendary: 'bg-amber-100 text-amber-700 border-amber-200',
}

function getRewardMessage(result: RewardResult) {
  if (result.status === 'already_claimed') return '이미 받은 보상이에요.'
  if (result.status === 'skipped') return result.message
  return result.item ? `${result.item.name} 획득!` : result.message
}

function getItemEmoji(item?: StudentItem['item'] | GardenPlacement['item'] | null) {
  if (item?.category === 'animal') return '🐰'
  if (item?.category === 'sky') return '⭐'
  if (item?.category === 'decor') return '🎀'
  if (item?.category === 'spirit') return '🧚'
  if (item?.category === 'legend') return '💎'
  return '🌱'
}

function getSlotForItem(studentItem: StudentItem, usedSlots: Set<GardenSlotId>) {
  const item = studentItem.item
  const code = item?.code?.toLowerCase() ?? ''
  const name = item?.name?.toLowerCase() ?? ''

  const preferredId =
    code.includes('sky') || item?.category === 'sky'
      ? 'sky_magic'
      : code.includes('animal') || item?.category === 'animal'
        ? 'right_animal'
        : code.includes('bench') || name.includes('벤치')
          ? 'bottom_bench'
          : code.includes('pond') || name.includes('연못')
            ? 'pond'
            : code.includes('flower') || name.includes('꽃')
              ? 'left_flowerbed'
              : code.includes('tree') || name.includes('나무') || item?.category === 'nature'
                ? 'top_tree'
                : item?.category === 'decor'
                  ? 'center_fountain'
                  : 'path_decoration'

  const preferredSlot = gardenSlots.find((slot) => slot.id === preferredId)
  if (preferredSlot && !usedSlots.has(preferredSlot.id)) return preferredSlot

  return gardenSlots.find((slot) => !usedSlots.has(slot.id)) ?? gardenSlots[0]
}

function getNearestSlot(placement: GardenPlacement, usedSlots: Set<GardenSlotId>) {
  const availableSlots = gardenSlots.filter((slot) => !usedSlots.has(slot.id))
  const slots = availableSlots.length > 0 ? availableSlots : gardenSlots

  return slots.reduce((nearest, slot) => {
    const nearestDistance = Math.hypot(nearest.x - placement.x, nearest.y - placement.y)
    const slotDistance = Math.hypot(slot.x - placement.x, slot.y - placement.y)
    return slotDistance < nearestDistance ? slot : nearest
  }, slots[0])
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

  const groupedItems = useMemo(() => {
    const map = new Map<string, { item: StudentItem; count: number }>()

    studentItems.forEach((studentItem) => {
      const key = studentItem.item_id
      const existing = map.get(key)
      if (existing) {
        existing.count += studentItem.quantity
      } else {
        map.set(key, { item: studentItem, count: studentItem.quantity })
      }
    })

    return Array.from(map.values())
  }, [studentItems])

  const placedStudentItemIds = useMemo(
    () => new Set(placements.map((placement) => placement.student_item_id)),
    [placements]
  )

  const recentItems = useMemo(
    () =>
      [...studentItems]
        .sort((a, b) => new Date(b.acquired_at).getTime() - new Date(a.acquired_at).getTime())
        .slice(0, 3),
    [studentItems]
  )

  const slotPlacements = useMemo(() => {
    const usedSlots = new Set<GardenSlotId>()
    const map = new Map<GardenSlotId, GardenPlacement>()

    placements
      .filter((placement) => placement.is_visible !== false)
      .sort((a, b) => a.z_index - b.z_index)
      .forEach((placement) => {
        const slot = getNearestSlot(placement, usedSlots)
        usedSlots.add(slot.id)
        map.set(slot.id, placement)
      })

    return map
  }, [placements])

  async function loadGardenData() {
    if (!studentId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const gardenData = await getOrCreateStudentGarden(studentId)
      const [itemsData, placementsData] = await Promise.all([
        getStudentItems(studentId),
        getGardenPlacements(studentId),
      ])

      setGarden(gardenData)
      setStudentItems(itemsData)
      setPlacements(placementsData)
    } catch (err) {
      console.error('[StudentDreamGardenPage] load failed:', err)
      setError('정원 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      void loadGardenData()
    }
  }, [authLoading, studentId])

  async function handleReward(action: () => Promise<RewardResult>) {
    setIsWorking(true)
    setError(null)
    setMessage(null)

    try {
      const result = await action()
      setMessage(getRewardMessage(result))
      await loadGardenData()
    } catch (err) {
      console.error('[StudentDreamGardenPage] reward failed:', err)
      setError('보상을 받는 중 문제가 생겼어요.')
    } finally {
      setIsWorking(false)
    }
  }

  async function handlePlaceItem(studentItem: StudentItem) {
    if (!studentId) return

    setIsWorking(true)
    setError(null)
    setMessage(null)

    try {
      const usedSlots = new Set<GardenSlotId>()
      placements.forEach((placement) => {
        usedSlots.add(getNearestSlot(placement, usedSlots).id)
      })
      const slot = getSlotForItem(studentItem, usedSlots)

      await saveGardenPlacement({
        studentId,
        studentItemId: studentItem.id,
        itemId: studentItem.item_id,
        x: slot.x,
        y: slot.y,
        scale: slot.size === 'lg' ? 1.1 : slot.size === 'sm' ? 0.9 : 1,
        zIndex: slot.zIndex,
      })
      setMessage(`${slot.label} 자리에 아이템을 놓았어요.`)
      await loadGardenData()
    } catch (err) {
      console.error('[StudentDreamGardenPage] placement failed:', err)
      setError('이미 놓았거나 배치할 수 없는 아이템이에요.')
    } finally {
      setIsWorking(false)
    }
  }

  const totalItemCount = studentItems.reduce((sum, item) => sum + item.quantity, 0)
  const placedCount = placements.length

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="full">
      <main className="dream-garden-page">
        <section className="dream-garden-stage" aria-label="나의 꿈의 정원">

          {/* ── 배경 레이어 1: 하늘 그라데이션 ── */}
          <div className="dg-bg-sky" />

          {/* ── 배경 레이어 2: 무지개 ── */}
          <div className="dg-rainbow" />

          {/* ── 배경 레이어 3: 태양 ── */}
          <div className="dg-sun">
            <div className="dg-sun-rays" />
          </div>

          {/* ── 배경 레이어 4: 구름들 ── */}
          <div className="dg-cloud dg-cloud-1" />
          <div className="dg-cloud dg-cloud-2" />
          <div className="dg-cloud dg-cloud-3" />

          {/* ── 배경 레이어 5: 반짝이 별들 ── */}
          <div className="dg-sparkle dg-sparkle-1">✦</div>
          <div className="dg-sparkle dg-sparkle-2">✧</div>
          <div className="dg-sparkle dg-sparkle-3">✦</div>
          <div className="dg-sparkle dg-sparkle-4">✦</div>
          <div className="dg-sparkle dg-sparkle-5">✧</div>

          {/* ── 배경 레이어 6: 잔디 기반 ── */}
          <div className="dg-bg-grass" />

          {/* ── 배경 레이어 7: 나무/숲 배경 ── */}
          <div className="dg-forest-bg">
            {/* 나무들 (CSS only) */}
            <div className="dg-tree dg-tree-1">
              <div className="dg-tree-top" />
              <div className="dg-tree-mid" />
              <div className="dg-tree-trunk" />
            </div>
            <div className="dg-tree dg-tree-2">
              <div className="dg-tree-top" />
              <div className="dg-tree-mid" />
              <div className="dg-tree-trunk" />
            </div>
            <div className="dg-treehouse">
              <div className="dg-treehouse-top">
                {/* 나무집 지붕 */}
                <div className="dg-treehouse-roof" />
                <div className="dg-treehouse-wall" />
                <div className="dg-treehouse-window" />
              </div>
              <div className="dg-treehouse-trunk" />
            </div>
          </div>

          {/* ── 배경 레이어 8: 돌 오솔길 ── */}
          <div className="dg-path-stones">
            {/* 돌들 - 각각 개별 배치 */}
            {[...Array(18)].map((_, i) => (
              <div key={i} className={`dg-stone dg-stone-${i + 1}`} />
            ))}
          </div>

          {/* ── 배경 레이어 9: 중앙 원형 광장 ── */}
          <div className="dg-plaza-circle" />
          <div className="dg-plaza-ring" />

          {/* ── 배경 레이어 10: 연못 (물결/연꽃/다리) ── */}
          <div className="dg-pond-area">
            <div className="dg-pond-water">
              <div className="dg-pond-ripple dg-pond-ripple-1" />
              <div className="dg-pond-ripple dg-pond-ripple-2" />
            </div>
            <div className="dg-lotus dg-lotus-1">🪷</div>
            <div className="dg-lotus dg-lotus-2">🪷</div>
            <div className="dg-swan">🦢</div>
            <div className="dg-pond-bridge" />
            <div className="dg-pond-bridge-rail dg-pond-bridge-rail-l" />
            <div className="dg-pond-bridge-rail dg-pond-bridge-rail-r" />
          </div>

          {/* ── 배경 레이어 11: 꽃밭 구역 ── */}
          <div className="dg-flowerbed-area">
            <div className="dg-flowerbed-patch" />
            {/* 꽃들 */}
            <div className="dg-flower dg-flower-1">🌸</div>
            <div className="dg-flower dg-flower-2">🌼</div>
            <div className="dg-flower dg-flower-3">🌺</div>
            <div className="dg-flower dg-flower-4">🌸</div>
            <div className="dg-flower dg-flower-5">🌻</div>
            <div className="dg-flower dg-flower-6">🌼</div>
            <div className="dg-flower dg-flower-7">🌹</div>
          </div>

          {/* ── 배경 레이어 12: 울타리 ── */}
          <div className="dg-fence-row dg-fence-bottom">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="dg-fence-post">
                <div className="dg-fence-cap" />
                <div className="dg-fence-body" />
              </div>
            ))}
          </div>
          <div className="dg-fence-row dg-fence-right">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="dg-fence-post dg-fence-post-v">
                <div className="dg-fence-cap" />
                <div className="dg-fence-body" />
              </div>
            ))}
          </div>

          {/* ── 배경 레이어 13: 장식물들 ── */}
          {/* 가로등 */}
          <div className="dg-lamp dg-lamp-1">
            <div className="dg-lamp-head" />
            <div className="dg-lamp-pole" />
          </div>
          <div className="dg-lamp dg-lamp-2">
            <div className="dg-lamp-head" />
            <div className="dg-lamp-pole" />
          </div>

          {/* 우체통 */}
          <div className="dg-mailbox">
            <div className="dg-mailbox-body">📮</div>
          </div>

          {/* 표지판 */}
          <div className="dg-signpost">
            <div className="dg-signpost-board">꿈의 정원</div>
            <div className="dg-signpost-pole" />
          </div>

          {/* 아치 문 */}
          <div className="dg-arch">
            <div className="dg-arch-frame" />
            <div className="dg-arch-flowers">🌸🌸</div>
          </div>

          {/* 벤치 배경 */}
          <div className="dg-bench-area">
            <div className="dg-bench-seat" />
            <div className="dg-bench-legs" />
          </div>

          {/* 덤불들 */}
          <div className="dg-bush dg-bush-1" />
          <div className="dg-bush dg-bush-2" />
          <div className="dg-bush dg-bush-3" />
          <div className="dg-bush dg-bush-4" />

          {/* 분수대 베이스 */}
          <div className="dg-fountain-base">
            <div className="dg-fountain-bowl-outer" />
            <div className="dg-fountain-bowl-inner" />
            <div className="dg-fountain-water-spray" />
            <div className="dg-fountain-water-spray dg-fountain-water-spray-2" />
            <div className="dg-fountain-water-spray dg-fountain-water-spray-3" />
            <div className="dg-fountain-center-star">⭐</div>
          </div>

          {/* ── UI 레이어: 제목 패널 ── */}
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
                    style={{ width: `${Math.min(100, (placedCount / gardenSlots.length) * 100)}%` }}
                  />
                </div>
                <div className="dg-progress-labels">
                  <span>꾸미기 진행</span>
                  <span>{placedCount}/{gardenSlots.length}</span>
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
          </aside>

          {/* ── 오른쪽 정보 오버레이 ── */}
          <aside className="dream-garden-overlay dream-garden-overlay-right" aria-label="보유 아이템">
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
                <button type="button" className="dg-view-all-btn">전체 보기</button>
              </div>
            </div>

            {/* 최근 획득 */}
            <div className="dg-info-section">
              <div className="dg-info-header">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <p className="dg-section-title-inline">최근 획득</p>
                <button type="button" className="dg-view-all-btn">전체 보기</button>
              </div>
              {recentItems.length === 0 ? (
                <div className="dg-empty-recent">
                  <WandSparkles className="w-5 h-5 text-purple-300" />
                  <p className="font-jua text-sm text-slate-500">첫 아이템을 기다리는 중</p>
                </div>
              ) : (
                <div className="dg-recent-list">
                  {recentItems.map((studentItem) => (
                    <div key={studentItem.id} className="dg-recent-item">
                      <div className="dg-recent-thumb">{getItemEmoji(studentItem.item)}</div>
                      <div className="dg-recent-info">
                        <p className="dg-recent-name">{studentItem.item?.name ?? '아이템'}</p>
                        <p className="dg-recent-time">방금 획득</p>
                      </div>
                    </div>
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
                정원 단계를 올리면 새로운<br />아이템과 특별 보상을 받을 수 있어요! 🎁
              </p>
            </div>

            {/* 개발 테스트 */}
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
          </aside>

          {/* ── 정원 슬롯들 ── */}
          <div className="dream-garden-slots" aria-label="정원 꾸미기 자리">
            {gardenSlots.map((slot) => {
              const placement = slotPlacements.get(slot.id)
              const SlotIcon = slot.icon

              return (
                <div
                  key={slot.id}
                  className={`dream-garden-slot dream-garden-slot-${slot.size} ${placement ? 'dream-garden-slot-filled' : 'dream-garden-slot-locked'}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%`, zIndex: slot.zIndex }}
                >
                  <div className="dream-garden-slot-ground" />
                  <div className="dream-garden-slot-object">
                    {placement ? (
                      <>
                        <span className="dream-garden-item-emoji">{getItemEmoji(placement.item)}</span>
                        <span className="dream-garden-item-name">{placement.item?.name ?? slot.label}</span>
                      </>
                    ) : (
                      <>
                        <SlotIcon className="dream-garden-slot-silhouette" />
                        <Lock className="dream-garden-slot-lock" />
                        <span className="dream-garden-slot-label">{slot.label}</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── 하단 인벤토리 독 ── */}
          <div className="dream-garden-inventory-dock" aria-label="보유 아이템 목록">
            {authLoading || isLoading ? (
              <div className="dream-garden-inventory-empty">
                <Loader2 className="w-4 h-4 animate-spin" />
                아이템 확인 중
              </div>
            ) : !studentId ? (
              <div className="dream-garden-inventory-empty">학생 로그인 후 사용할 수 있어요.</div>
            ) : groupedItems.length === 0 ? (
              <div className="dream-garden-inventory-empty">
                <Sparkles className="w-4 h-4 text-purple-400" />
                🌟 보상으로 아이템을 모아 보세요.
              </div>
            ) : (
              groupedItems.map(({ item: studentItem, count }) => {
                const item = studentItem.item
                const isPlaced = placedStudentItemIds.has(studentItem.id)

                return (
                  <article key={studentItem.item_id} className="dream-garden-item-card">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="dream-garden-item-thumb">{getItemEmoji(item)}</div>
                      <div className="min-w-0">
                        <h3 className="truncate font-jua text-base text-slate-800">{item?.name ?? '아이템'}</h3>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                            {categoryLabels[item?.category ?? 'nature']}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${rarityStyles[item?.rarity ?? 'common']}`}>
                            {rarityLabels[item?.rarity ?? 'common']}
                          </span>
                          <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[11px] font-bold text-pink-600">
                            {count}개
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isWorking || isPlaced || !item?.is_placeable}
                      onClick={() => handlePlaceItem(studentItem)}
                      className="dream-garden-place-button"
                    >
                      <Plus className="w-4 h-4" />
                      {isPlaced ? '배치됨' : '놓기'}
                    </button>
                  </article>
                )
              })
            )}
          </div>
        </section>
      </main>
    </StudentPageShell>
  )
}
