import { supabase } from '../../../shared/lib/supabase'
import type {
  DreamGardenItem,
  GardenPlacement,
  RewardResult,
  RewardType,
  SaveGardenPlacementInput,
  StudentGarden,
  StudentItem,
  UpdateGardenPlacementInput,
} from '../types/dreamGarden'

const RARITY_WEIGHTS: Record<DreamGardenItem['rarity'], number> = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 8,
  legendary: 2,
}

function getTodayDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function pickWeightedRandomItem(items: DreamGardenItem[]) {
  const totalWeight = items.reduce((sum, item) => sum + RARITY_WEIGHTS[item.rarity], 0)
  let cursor = Math.random() * totalWeight

  for (const item of items) {
    cursor -= RARITY_WEIGHTS[item.rarity]
    if (cursor <= 0) return item
  }

  return items[items.length - 1]
}

function getRewardCandidateItems(items: DreamGardenItem[], rewardType: RewardType) {
  const placeableItems = items.filter((item) => item.is_placeable)

  if (rewardType === 'attendance') {
    return placeableItems.filter((item) => item.rarity === 'common')
  }

  return placeableItems
}

type AutoPlacementZone = Pick<SaveGardenPlacementInput, 'x' | 'y' | 'scale' | 'zIndex'>

const flowerGardenZones: AutoPlacementZone[] = [
  { x: 20, y: 61, scale: 0.9, zIndex: 8 },
  { x: 38, y: 76, scale: 0.85, zIndex: 9 },
  { x: 49, y: 60, scale: 0.85, zIndex: 8 },
  { x: 63, y: 80, scale: 0.85, zIndex: 9 },
]

const treeGardenZones: AutoPlacementZone[] = [
  { x: 24, y: 24, scale: 1, zIndex: 3 },
]

const grassGardenZones: AutoPlacementZone[] = [
  { x: 34, y: 70, scale: 0.85, zIndex: 8 },
  { x: 45, y: 68, scale: 0.85, zIndex: 8 },
  { x: 60, y: 78, scale: 0.85, zIndex: 9 },
]

const pondGardenZones: AutoPlacementZone[] = [
  { x: 73, y: 39, scale: 0.9, zIndex: 5 },
  { x: 78, y: 45, scale: 0.85, zIndex: 6 },
]

const skyGardenZones: AutoPlacementZone[] = [
  { x: 73, y: 15, scale: 0.85, zIndex: 7 },
  { x: 58, y: 18, scale: 0.8, zIndex: 7 },
  { x: 28, y: 18, scale: 0.8, zIndex: 7 },
]

const flyingGardenZones: AutoPlacementZone[] = [
  { x: 28, y: 45, scale: 0.82, zIndex: 8 },
  { x: 52, y: 42, scale: 0.82, zIndex: 8 },
  { x: 68, y: 52, scale: 0.82, zIndex: 8 },
]

const animalGardenZones: AutoPlacementZone[] = [
  { x: 82, y: 66, scale: 0.9, zIndex: 8 },
  { x: 58, y: 72, scale: 0.88, zIndex: 9 },
]

const decorGardenZones: AutoPlacementZone[] = [
  { x: 49, y: 54, scale: 0.9, zIndex: 8 },
  { x: 38, y: 76, scale: 0.86, zIndex: 9 },
  { x: 63, y: 80, scale: 0.9, zIndex: 9 },
]

function pickAutoPlacementZone(zones: AutoPlacementZone[], seed: string) {
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % zones.length
  return zones[index]
}

export function getAutoGardenPlacement(item?: DreamGardenItem | null): AutoPlacementZone {
  const code = item?.code?.toLowerCase() ?? ''
  const name = item?.name?.toLowerCase() ?? ''
  const category = (item?.category ?? '') as string
  const seed = code || name || category || 'default'

  const isWaterItem =
    category === 'water' ||
    ['pond', 'lotus', 'water_lily', 'water_drop', 'duck', 'swan', 'fish'].some((keyword) => code.includes(keyword) || name.includes(keyword)) ||
    ['연못', '연꽃', '수련', '물방울', '물고기', '오리', '백조'].some((keyword) => name.includes(keyword))

  if (isWaterItem) return pickAutoPlacementZone(pondGardenZones, seed)

  const isFlowerItem =
    ['flower', 'flower_seed', 'mushroom'].some((keyword) => code.includes(keyword)) ||
    ['꽃', '꽃씨', '버섯'].some((keyword) => name.includes(keyword))
  if (isFlowerItem) return pickAutoPlacementZone(flowerGardenZones, seed)

  const isTreeItem = code.includes('tree') || name.includes('나무')
  if (isTreeItem) return pickAutoPlacementZone(treeGardenZones, seed)

  const isGrassItem = code.includes('grass') || name.includes('풀') || name.includes('잔디')
  if (isGrassItem) return pickAutoPlacementZone(grassGardenZones, seed)

  if (category === 'sky' || code.includes('cloud') || name.includes('구름')) {
    return pickAutoPlacementZone(skyGardenZones, seed)
  }

  if (code.includes('firefly') || code.includes('butterfly') || name.includes('반딧불') || name.includes('나비')) {
    return pickAutoPlacementZone(flyingGardenZones, seed)
  }

  if (category === 'animal') return pickAutoPlacementZone(animalGardenZones, seed)
  if (category === 'decor' || category === 'spirit' || category === 'legend') return pickAutoPlacementZone(decorGardenZones, seed)
  if (category === 'nature') return pickAutoPlacementZone(grassGardenZones, seed)

  return pickAutoPlacementZone(decorGardenZones, seed)
}

async function getExistingRewardLog(studentId: string, rewardType: RewardType, sourceId?: string) {
  let query = supabase
    .from('reward_logs')
    .select('id, item_id')
    .eq('student_id', studentId)
    .eq('reward_type', rewardType)
    .limit(1)

  if (sourceId) {
    query = query.eq('source_id', sourceId)
  } else if (rewardType === 'attendance') {
    query = query.eq('reward_date', getTodayDateKey()).is('source_id', null)
  } else {
    query = query.is('source_id', null)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data
}

async function getExistingAttendanceRewardLog(studentId: string, today: string) {
  const { data, error } = await supabase
    .from('reward_logs')
    .select('id, item_id')
    .eq('student_id', studentId)
    .eq('reward_type', 'attendance')
    .or(`source_id.eq.${today},and(source_id.is.null,reward_date.eq.${today})`)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

async function getOrCreateRewardStats(studentId: string) {
  const { data: existing, error: selectError } = await supabase
    .from('student_reward_stats')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()

  if (selectError) {
    console.error('[dreamGardenService] getOrCreateRewardStats failed:', selectError)
    throw selectError
  }
  if (existing) return existing as {
    id: string
    student_id: string
    completed_comic_count: number
    last_lucky_reward_count: number
    last_attendance_reward_date: string | null
  }

  const { data, error } = await supabase
    .from('student_reward_stats')
    .insert({ student_id: studentId })
    .select('*')
    .single()

  if (error) throw error
  return data as {
    id: string
    student_id: string
    completed_comic_count: number
    last_lucky_reward_count: number
    last_attendance_reward_date: string | null
  }
}

export async function getActiveItems(): Promise<DreamGardenItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as DreamGardenItem[]
}

export async function getStudentGarden(studentId: string): Promise<StudentGarden | null> {
  const { data: existing, error: selectError } = await supabase
    .from('student_gardens')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle()

  if (selectError) {
    console.error('[dreamGardenService] getOrCreateGarden failed:', selectError)
    throw selectError
  }
  return (existing ?? null) as StudentGarden | null
}

export async function createDefaultGarden(studentId: string): Promise<StudentGarden> {
  const { data, error } = await supabase
    .from('student_gardens')
    .insert({
      student_id: studentId,
      garden_name: '꿈의 정원',
      background_code: 'default_garden',
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      const existing = await getStudentGarden(studentId)
      if (existing) return existing
    }
    console.error('[dreamGardenService] getOrCreateGarden failed:', error)
    throw error
  }
  return data as StudentGarden
}

export async function getOrCreateStudentGarden(studentId: string): Promise<StudentGarden> {
  const existing = await getStudentGarden(studentId)
  if (existing) return existing
  return createDefaultGarden(studentId)
}

export async function getStudentItems(studentId: string): Promise<StudentItem[]> {
  const { data, error } = await supabase
    .from('student_items')
    .select('*, item:items(*)')
    .eq('student_id', studentId)
    .order('acquired_at', { ascending: false })

  if (error) {
    console.error('[dreamGardenService] getOwnedItems failed:', error)
    throw error
  }
  return (data ?? []) as StudentItem[]
}

export async function grantRandomItem(
  studentId: string,
  rewardType: RewardType,
  sourceId?: string
): Promise<RewardResult> {
  const existingReward = await getExistingRewardLog(studentId, rewardType, sourceId)
  if (existingReward) {
    return {
      status: 'already_claimed',
      message: '이미 받은 보상이에요.',
      item: null,
      studentItem: null,
      rewardType,
    }
  }

  const activeItems = await getActiveItems()
  const rewardItems = getRewardCandidateItems(activeItems, rewardType)
  if (rewardItems.length === 0) {
    return {
      status: 'skipped',
      message: '받을 수 있는 아이템이 아직 없어요.',
      item: null,
      studentItem: null,
      rewardType,
    }
  }

  const item = pickWeightedRandomItem(rewardItems)
  const { data: studentItem, error: itemError } = await supabase
    .from('student_items')
    .insert({
      student_id: studentId,
      item_id: item.id,
      source_type: rewardType,
      source_id: sourceId ?? null,
      quantity: 1,
      is_new: true,
    })
    .select('*, item:items(*)')
    .single()

  if (itemError) {
    console.error('[dreamGardenService] getOwnedItems failed:', itemError)
    throw itemError
  }

  const { error: logError } = await supabase
    .from('reward_logs')
    .insert({
      student_id: studentId,
      reward_type: rewardType,
      source_id: sourceId ?? null,
      reward_date: rewardType === 'attendance' ? getTodayDateKey() : null,
      item_id: item.id,
    })

  if (logError) throw logError

  return {
    status: 'granted',
    message: `${item.name} 아이템을 받았어요.`,
    item,
    studentItem: studentItem as StudentItem,
    rewardType,
  }
}

export async function grantAttendanceReward(studentId: string): Promise<RewardResult> {
  const today = getTodayDateKey()
  const existingReward = await getExistingAttendanceRewardLog(studentId, today)
  if (existingReward) {
    return {
      status: 'already_claimed',
      message: '?대? 諛쏆? 蹂댁긽?댁뿉??',
      item: null,
      studentItem: null,
      rewardType: 'attendance',
    }
  }

  const result = await grantRandomItem(studentId, 'attendance', today)
  if (result.status === 'granted') {
    try {
      await getOrCreateRewardStats(studentId)
      const { error } = await supabase
        .from('student_reward_stats')
        .update({ last_attendance_reward_date: today })
        .eq('student_id', studentId)

      if (error) throw error
    } catch (error) {
      console.error('[dreamGardenService] update attendance reward stats failed:', error)
    }

    if (result.studentItem) {
      try {
        await saveGardenPlacement({
          studentId,
          studentItemId: result.studentItem.id,
          itemId: result.studentItem.item_id,
          ...getAutoGardenPlacement(result.studentItem.item ?? result.item),
        })
      } catch (error) {
        console.error('[dreamGardenService] auto place attendance reward failed:', error)
      }
    }
  }
  return result
}

export async function grantComicCompleteReward(studentId: string, comicId: string): Promise<RewardResult> {
  const result = await grantRandomItem(studentId, 'comic_complete', comicId)
  if (result.status !== 'granted') return result

  const stats = await getOrCreateRewardStats(studentId)
  await supabase
    .from('student_reward_stats')
    .update({ completed_comic_count: stats.completed_comic_count + 1 })
    .eq('student_id', studentId)

  if (result.studentItem) {
    try {
      await saveGardenPlacement({
        studentId,
        studentItemId: result.studentItem.id,
        itemId: result.studentItem.item_id,
        ...getAutoGardenPlacement(result.studentItem.item ?? result.item),
      })
    } catch (error) {
      console.error('[dreamGardenService] auto place comic reward failed:', error)
    }
  }

  return result
}

export async function grantLuckyRewardIfNeeded(studentId: string): Promise<RewardResult> {
  const stats = await getOrCreateRewardStats(studentId)
  const nextLuckyCount = Math.floor(stats.completed_comic_count / 3) * 3

  if (nextLuckyCount < 3 || stats.last_lucky_reward_count >= nextLuckyCount) {
    return {
      status: 'skipped',
      message: '아직 우연한 행운 차례가 아니에요.',
      item: null,
      studentItem: null,
      rewardType: 'lucky_reward',
    }
  }

  const result = await grantRandomItem(studentId, 'lucky_reward', `comic-${nextLuckyCount}`)
  if (result.status === 'granted') {
    await supabase
      .from('student_reward_stats')
      .update({ last_lucky_reward_count: nextLuckyCount })
      .eq('student_id', studentId)

    if (result.studentItem) {
      try {
        await saveGardenPlacement({
          studentId,
          studentItemId: result.studentItem.id,
          itemId: result.studentItem.item_id,
          ...getAutoGardenPlacement(result.studentItem.item ?? result.item),
        })
      } catch (error) {
        console.error('[dreamGardenService] auto place lucky reward failed:', error)
      }
    }
  }

  return result
}

export async function getGardenPlacements(studentId: string): Promise<GardenPlacement[]> {
  const garden = await getOrCreateStudentGarden(studentId)
  const { data, error } = await supabase
    .from('garden_placements')
    .select('*, item:items(*), student_item:student_items(*)')
    .eq('garden_id', garden.id)
    .eq('is_visible', true)
    .order('z_index', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[dreamGardenService] getPlacements failed:', error)
    throw error
  }
  return (data ?? []) as GardenPlacement[]
}

export async function saveGardenPlacement(input: SaveGardenPlacementInput): Promise<GardenPlacement> {
  const garden = await getOrCreateStudentGarden(input.studentId)

  // 중복 판정은 학생이 실제로 획득한 '개별 보유 아이템 인스턴스'(student_item_id) 기준.
  // 같은 아이템(item_id)을 여러 개 획득해도 각각 별도 배치가 생성되어야 한다.
  // DB의 unique(garden_id, student_item_id) 제약과 일치.
  const { data: existing, error: checkError } = await supabase
    .from('garden_placements')
    .select('*, item:items(*), student_item:student_items(*)')
    .eq('garden_id', garden.id)
    .eq('student_item_id', input.studentItemId)
    .maybeSingle()

  if (checkError) {
    console.error('[dreamGardenService] check existing placement failed:', checkError)
  }

  if (existing) {
    return existing as GardenPlacement
  }

  const { data, error } = await supabase
    .from('garden_placements')
    .insert({
      garden_id: garden.id,
      student_item_id: input.studentItemId,
      item_id: input.itemId,
      x: input.x ?? 40,
      y: input.y ?? 40,
      scale: input.scale ?? 1,
      rotation: input.rotation ?? 0,
      z_index: input.zIndex ?? 1,
      is_visible: true,
    })
    .select('*, item:items(*), student_item:student_items(*)')
    .single()

  if (error) {
    console.error('[dreamGardenService] saveGardenPlacement failed:', error)
    throw error
  }
  return data as GardenPlacement
}

export async function updateGardenPlacement(input: UpdateGardenPlacementInput): Promise<GardenPlacement> {
  const payload: Record<string, number | boolean> = {}
  if (typeof input.x === 'number') payload.x = input.x
  if (typeof input.y === 'number') payload.y = input.y
  if (typeof input.scale === 'number') payload.scale = input.scale
  if (typeof input.rotation === 'number') payload.rotation = input.rotation
  if (typeof input.zIndex === 'number') payload.z_index = input.zIndex
  if (typeof input.isVisible === 'boolean') payload.is_visible = input.isVisible

  const { data, error } = await supabase
    .from('garden_placements')
    .update(payload)
    .eq('id', input.placementId)
    .select('*, item:items(*), student_item:student_items(*)')
    .single()

  if (error) {
    console.error('[dreamGardenService] updateGardenPlacement failed:', error)
    throw error
  }
  return data as GardenPlacement
}

export async function deleteGardenPlacement(placementId: string): Promise<void> {
  const { error } = await supabase
    .from('garden_placements')
    .delete()
    .eq('id', placementId)

  if (error) {
    console.error('[dreamGardenService] getPlacements failed:', error)
    throw error
  }
}
