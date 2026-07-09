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
  const placeableItems = activeItems.filter((item) => item.is_placeable)
  if (placeableItems.length === 0) {
    return {
      status: 'skipped',
      message: '받을 수 있는 아이템이 아직 없어요.',
      item: null,
      studentItem: null,
      rewardType,
    }
  }

  const item = pickWeightedRandomItem(placeableItems)
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
  const result = await grantRandomItem(studentId, 'attendance')
  if (result.status === 'granted') {
    await getOrCreateRewardStats(studentId)
    await supabase
      .from('student_reward_stats')
      .update({ last_attendance_reward_date: getTodayDateKey() })
      .eq('student_id', studentId)
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
  const { data, error } = await supabase
    .from('garden_placements')
    .insert({
      garden_id: garden.id,
      student_item_id: input.studentItemId,
      item_id: input.itemId,
      x: input.x ?? 40,
      y: input.y ?? 40,
      scale: input.scale ?? 1,
      z_index: input.zIndex ?? 1,
      is_visible: true,
    })
    .select('*, item:items(*), student_item:student_items(*)')
    .single()

  if (error) {
    console.error('[dreamGardenService] getPlacements failed:', error)
    throw error
  }
  return data as GardenPlacement
}

export async function updateGardenPlacement(input: UpdateGardenPlacementInput): Promise<GardenPlacement> {
  const payload: Record<string, number | boolean> = {}
  if (typeof input.x === 'number') payload.x = input.x
  if (typeof input.y === 'number') payload.y = input.y
  if (typeof input.scale === 'number') payload.scale = input.scale
  if (typeof input.zIndex === 'number') payload.z_index = input.zIndex
  if (typeof input.isVisible === 'boolean') payload.is_visible = input.isVisible

  const { data, error } = await supabase
    .from('garden_placements')
    .update(payload)
    .eq('id', input.placementId)
    .select('*, item:items(*), student_item:student_items(*)')
    .single()

  if (error) {
    console.error('[dreamGardenService] getPlacements failed:', error)
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
