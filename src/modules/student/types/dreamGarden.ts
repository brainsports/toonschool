export type RewardType =
  | 'attendance'
  | 'comic_complete'
  | 'lucky_reward'
  | 'hidden_encounter'
  | 'teacher_reward'
  | 'event'

export type ItemCategory = 'nature' | 'animal' | 'spirit' | 'decor' | 'sky' | 'legend'
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface DreamGardenItem {
  id: string
  code: string
  name: string
  category: ItemCategory
  rarity: ItemRarity
  description: string | null
  image_url: string | null
  is_placeable: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface StudentItem {
  id: string
  student_id: string
  item_id: string
  source_type: RewardType
  source_id: string | null
  acquired_at: string
  quantity: number
  is_new: boolean
  created_at: string
  updated_at: string
  item?: DreamGardenItem | null
}

export interface StudentGarden {
  id: string
  student_id: string
  garden_name: string
  level: number
  experience: number
  background_code: string
  created_at: string
  updated_at: string
}

export interface GardenPlacement {
  id: string
  garden_id: string
  student_item_id: string
  item_id: string
  x: number
  y: number
  scale: number
  z_index: number
  is_visible: boolean
  created_at: string
  updated_at: string
  item?: DreamGardenItem | null
  student_item?: StudentItem | null
}

export interface RewardResult {
  status: 'granted' | 'already_claimed' | 'skipped'
  message: string
  item: DreamGardenItem | null
  studentItem: StudentItem | null
  rewardType: RewardType
}

export interface SaveGardenPlacementInput {
  studentId: string
  studentItemId: string
  itemId: string
  x?: number
  y?: number
  scale?: number
  zIndex?: number
}

export interface UpdateGardenPlacementInput {
  placementId: string
  x?: number
  y?: number
  scale?: number
  zIndex?: number
  isVisible?: boolean
}
