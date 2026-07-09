import { supabase } from '../../../shared/lib/supabase'
import type { DreamGardenItem, RewardResult, StudentItem } from '../types/dreamGarden'
import { getActiveItems, saveGardenPlacement } from './dreamGardenService'

function pickRandomItem(items: DreamGardenItem[]) {
  return items[Math.floor(Math.random() * items.length)]
}

async function hasHiddenEncounterReward(studentId: string, sourceId: string) {
  const { data, error } = await supabase
    .from('reward_logs')
    .select('id')
    .eq('student_id', studentId)
    .eq('reward_type', 'hidden_encounter')
    .eq('source_id', sourceId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export async function grantHiddenEncounterReward(
  studentId: string,
  sourceId: string
): Promise<RewardResult> {
  const alreadyClaimed = await hasHiddenEncounterReward(studentId, sourceId)
  if (alreadyClaimed) {
    return {
      status: 'already_claimed',
      message: '이미 꿈의 정원에 보낸 발견 보상이에요!',
      item: null,
      studentItem: null,
      rewardType: 'hidden_encounter',
    }
  }

  const activeItems = await getActiveItems()
  const encounterItems = activeItems.filter(
    (item) => item.is_placeable && (item.rarity === 'common' || item.rarity === 'uncommon')
  )

  if (encounterItems.length === 0) {
    return {
      status: 'skipped',
      message: '아직 발견할 수 있는 정원 아이템이 없어요.',
      item: null,
      studentItem: null,
      rewardType: 'hidden_encounter',
    }
  }

  const item = pickRandomItem(encounterItems)
  const { data: studentItem, error: itemError } = await supabase
    .from('student_items')
    .insert({
      student_id: studentId,
      item_id: item.id,
      source_type: 'hidden_encounter',
      source_id: sourceId,
      quantity: 1,
      is_new: true,
    })
    .select('*, item:items(*)')
    .single()

  if (itemError) throw itemError

  const { error: logError } = await supabase
    .from('reward_logs')
    .insert({
      student_id: studentId,
      reward_type: 'hidden_encounter',
      source_id: sourceId,
      reward_date: null,
      item_id: item.id,
    })

  if (logError) throw logError

  const grantedStudentItem = studentItem as StudentItem
  await saveGardenPlacement({
    studentId,
    studentItemId: grantedStudentItem.id,
    itemId: grantedStudentItem.item_id,
    x: 76,
    y: 72,
    scale: 0.9,
    zIndex: 9,
  })

  return {
    status: 'granted',
    message: '꿈의 정원에 보냈어요!',
    item,
    studentItem: grantedStudentItem,
    rewardType: 'hidden_encounter',
  }
}