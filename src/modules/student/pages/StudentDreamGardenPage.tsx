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
  if (item?.category === 'animal') return '토끼'
  if (item?.category === 'sky') return '반짝'
  if (item?.category === 'decor') return '리본'
  if (item?.category === 'spirit') return '요정'
  if (item?.category === 'legend') return '보석'
  return '새싹'
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
          <div className="dream-garden-sky" />
          <div className="dream-garden-grass" />
          <div className="dream-garden-path dream-garden-path-main" />
          <div className="dream-garden-path dream-garden-path-branch" />
          <div className="dream-garden-pond-shape" />
          <div className="dream-garden-flower-zone" />
          <div className="dream-garden-forest-zone" />

          <div className="dream-garden-title">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-white/80 px-3 py-1.5 text-emerald-800 font-jua text-sm shadow-sm">
              <Sprout className="w-4 h-4" />
              꿈의 정원
            </div>
            <h1 className="font-jua text-3xl md:text-5xl text-slate-800 leading-tight">
              {garden?.garden_name ?? '나의 꿈의 정원'}
            </h1>
            <p className="mt-2 max-w-[560px] text-sm md:text-lg text-slate-700 font-bold">
              출석하고 만화를 완성하면 정원 아이템을 모을 수 있어요.
            </p>
          </div>

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

          <aside className="dream-garden-overlay dream-garden-overlay-left" aria-label="정원 정보">
            <div className="flex items-center gap-2">
              <div className="dream-garden-mini-icon bg-emerald-100 text-emerald-700">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500">정원 단계</p>
                <p className="font-jua text-xl text-slate-800">Lv. {garden?.level ?? 1}</p>
              </div>
            </div>

            <div className="dream-garden-progress">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>꾸미기 진행</span>
                <span>{placedCount}/{gardenSlots.length}</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-white/70 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                  style={{ width: `${Math.min(100, (placedCount / gardenSlots.length) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-slate-500">아이템 종류</p>
              <div className="grid grid-cols-2 gap-2">
                {['자연', '친구', '장식', '하늘'].map((label) => (
                  <span key={label} className="rounded-2xl bg-white/65 px-3 py-2 text-center text-sm font-jua text-slate-700">
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/55 p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Lock className="w-4 h-4 text-purple-500" />
                <p className="font-jua text-sm">잠긴 자리는 실루엣으로 보여요.</p>
              </div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">
                아이템을 얻으면 알맞은 고정 자리에서 실제 모습으로 바뀌어요.
              </p>
            </div>
          </aside>

          <aside className="dream-garden-overlay dream-garden-overlay-right" aria-label="보유 아이템">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">내가 획득한 아이템</p>
                <p className="font-jua text-2xl text-slate-800">{totalItemCount}개</p>
              </div>
              <div className="dream-garden-mini-icon bg-pink-100 text-pink-600">
                <Gift className="w-5 h-5" />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold text-slate-500">최근 획득 아이템</p>
              {recentItems.length === 0 ? (
                <div className="rounded-3xl bg-white/60 px-4 py-4 text-center">
                  <WandSparkles className="mx-auto mb-2 h-6 w-6 text-purple-300" />
                  <p className="font-jua text-sm text-slate-600">첫 아이템을 기다리는 중</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentItems.map((studentItem) => (
                    <div key={studentItem.id} className="flex items-center gap-2 rounded-2xl bg-white/65 px-3 py-2">
                      <span className="dream-garden-mini-emoji">{getItemEmoji(studentItem.item)}</span>
                      <div className="min-w-0">
                        <p className="truncate font-jua text-sm text-slate-800">{studentItem.item?.name ?? '아이템'}</p>
                        <p className="text-[11px] font-bold text-slate-500">{rarityLabels[studentItem.item?.rarity ?? 'common']}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-amber-100 bg-amber-50/75 p-3">
              <p className="font-jua text-sm text-amber-900">보상 안내</p>
              <p className="mt-1 text-xs font-bold leading-relaxed text-amber-800">
                출석, 만화 완성, 행운 보상으로 정원을 채울 수 있어요.
              </p>
            </div>

            <details className="dream-garden-dev-panel">
              <summary>
                <span>개발 테스트</span>
                <ChevronDown className="w-4 h-4" />
              </summary>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  disabled={!studentId || isWorking}
                  onClick={() => handleReward(() => grantAttendanceReward(studentId as string))}
                  className="dream-garden-test-button bg-pink-500 text-white disabled:opacity-50"
                >
                  테스트 출석 보상 받기
                </button>
                <button
                  type="button"
                  disabled={!studentId || isWorking}
                  onClick={() => handleReward(() => grantComicCompleteReward(studentId as string, `test-comic-${Date.now()}`))}
                  className="dream-garden-test-button bg-purple-500 text-white disabled:opacity-50"
                >
                  테스트 만화 완성 보상
                </button>
                <button
                  type="button"
                  disabled={!studentId || isWorking}
                  onClick={() => handleReward(() => grantLuckyRewardIfNeeded(studentId as string))}
                  className="dream-garden-test-button bg-amber-300 text-amber-950 disabled:opacity-50"
                >
                  테스트 우연한 행운
                </button>
              </div>
            </details>
          </aside>

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
                보상으로 아이템을 모아 보세요.
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
