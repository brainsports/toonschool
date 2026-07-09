import { useEffect, useMemo, useState } from 'react'
import { Gift, Leaf, Loader2, Plus, Sparkles, Sprout, WandSparkles } from 'lucide-react'
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
      setError('정원 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.')
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
      const nextIndex = placements.length + 1
      await saveGardenPlacement({
        studentId,
        studentItemId: studentItem.id,
        itemId: studentItem.item_id,
        x: 16 + ((nextIndex * 17) % 62),
        y: 26 + ((nextIndex * 11) % 42),
        scale: 1,
        zIndex: nextIndex,
      })
      setMessage('정원에 아이템을 놓았어요.')
      await loadGardenData()
    } catch (err) {
      console.error('[StudentDreamGardenPage] placement failed:', err)
      setError('이미 놓았거나 배치할 수 없는 아이템이에요.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="2xl">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 pb-10">
        <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-stretch">
          <div className="rounded-[28px] bg-gradient-to-br from-emerald-50 via-sky-50 to-purple-50 border-4 border-white p-6 md:p-8 shadow-sm overflow-hidden relative min-h-[360px]">
            <div className="absolute right-6 top-6 flex gap-2 opacity-70">
              <Sparkles className="w-8 h-8 text-amber-300 fill-amber-200" />
              <Leaf className="w-8 h-8 text-emerald-400" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-white px-4 py-2 text-emerald-700 font-jua text-sm shadow-sm mb-4">
                <Sprout className="w-4 h-4" />
                꿈의 정원
              </div>
              <h1 className="font-jua text-3xl md:text-5xl text-slate-800 leading-tight">
                {garden?.garden_name ?? '나의 꿈의 정원'}
              </h1>
              <p className="mt-3 text-slate-600 font-bold text-base md:text-lg">
                출석하고 만화를 완성하면 정원 아이템을 모을 수 있어요.
              </p>
            </div>

            <div className="relative mt-8 h-[210px] rounded-[26px] bg-gradient-to-b from-sky-100 to-emerald-100 border-4 border-white shadow-inner overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-[55%] bg-emerald-200/80 rounded-t-[50%]" />
              {placements.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-5xl mb-3">🌱</span>
                  <p className="font-jua text-xl text-emerald-700">아직 놓은 아이템이 없어요</p>
                </div>
              ) : (
                placements.map((placement) => (
                  <div
                    key={placement.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{
                      left: `${placement.x}%`,
                      top: `${placement.y}%`,
                      zIndex: placement.z_index,
                      transform: `translate(-50%, -50%) scale(${placement.scale})`,
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/90 border-2 border-white shadow flex items-center justify-center text-3xl">
                      {placement.item?.category === 'animal' ? '🐾' : placement.item?.category === 'sky' ? '⭐' : '🌿'}
                    </div>
                    <span className="mt-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {placement.item?.name ?? '아이템'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] bg-white/90 border border-white p-5 md:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-jua text-2xl text-slate-800">보상 테스트</h2>
                <p className="text-sm font-bold text-slate-500 mt-1">개발 확인용 임시 버튼이에요.</p>
              </div>
              <Gift className="w-8 h-8 text-pink-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
              <button
                type="button"
                disabled={!studentId || isWorking}
                onClick={() => handleReward(() => grantAttendanceReward(studentId as string))}
                className="min-h-[58px] rounded-2xl bg-pink-500 text-white font-jua text-base shadow-sm disabled:opacity-50"
              >
                테스트 출석 보상 받기
              </button>
              <button
                type="button"
                disabled={!studentId || isWorking}
                onClick={() => handleReward(() => grantComicCompleteReward(studentId as string, `test-comic-${Date.now()}`))}
                className="min-h-[58px] rounded-2xl bg-purple-500 text-white font-jua text-base shadow-sm disabled:opacity-50"
              >
                테스트 만화 완성 보상
              </button>
              <button
                type="button"
                disabled={!studentId || isWorking}
                onClick={() => handleReward(() => grantLuckyRewardIfNeeded(studentId as string))}
                className="min-h-[58px] rounded-2xl bg-amber-400 text-amber-950 font-jua text-base shadow-sm disabled:opacity-50"
              >
                테스트 우연한 행운
              </button>
            </div>

            {(message || error) && (
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${error ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                {error ?? message}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4">
              <h3 className="font-jua text-lg text-slate-800 mb-3">배치 목록</h3>
              {placements.length === 0 ? (
                <p className="text-sm font-bold text-slate-400">정원에 놓은 아이템이 없어요.</p>
              ) : (
                <div className="space-y-2">
                  {placements.map((placement) => (
                    <div key={placement.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                      <span className="font-bold text-sm text-slate-700">{placement.item?.name ?? '아이템'}</span>
                      <span className="text-xs font-bold text-slate-400">
                        x {placement.x} / y {placement.y}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] bg-white/90 border border-white p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-jua text-2xl text-slate-800">보유 아이템</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">카드를 눌러 정원에 놓아 보세요.</p>
            </div>
            <div className="rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 font-jua">
              {studentItems.reduce((sum, item) => sum + item.quantity, 0)}개
            </div>
          </div>

          {authLoading || isLoading ? (
            <div className="h-48 flex items-center justify-center text-slate-400 font-bold">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              정원을 불러오는 중
            </div>
          ) : !studentId ? (
            <div className="h-48 flex items-center justify-center text-slate-500 font-bold">
              학생 로그인 후 사용할 수 있어요.
            </div>
          ) : groupedItems.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <WandSparkles className="w-10 h-10 text-purple-300 mb-3" />
              <p className="font-jua text-xl text-slate-600">아직 가진 아이템이 없어요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {groupedItems.map(({ item: studentItem, count }) => {
                const item = studentItem.item
                const isPlaced = placedStudentItemIds.has(studentItem.id)

                return (
                  <article key={studentItem.item_id} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0">
                        {item?.category === 'animal' ? '🐾' : item?.category === 'sky' ? '⭐' : item?.category === 'decor' ? '🎀' : '🌿'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-jua text-lg text-slate-800 truncate">{item?.name ?? '아이템'}</h3>
                        <p className="text-xs font-bold text-slate-500 line-clamp-2 min-h-[32px]">
                          {item?.description ?? '꿈의 정원에 놓을 수 있는 아이템이에요.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {categoryLabels[item?.category ?? 'nature']}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${rarityStyles[item?.rarity ?? 'common']}`}>
                        {rarityLabels[item?.rarity ?? 'common']}
                      </span>
                      <span className="rounded-full bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-600">
                        {count}개
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isWorking || isPlaced || !item?.is_placeable}
                      onClick={() => handlePlaceItem(studentItem)}
                      className="mt-auto min-h-[44px] rounded-2xl bg-emerald-500 text-white font-jua flex items-center justify-center gap-2 disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      <Plus className="w-4 h-4" />
                      {isPlaced ? '놓았어요' : '정원에 놓기'}
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </StudentPageShell>
  )
}
