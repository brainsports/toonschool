/**
 * 꿈의 궁전 성장형 보상 시스템 — 단일 설정(Single Source of Truth).
 *
 * 레벨 임계값·10개 스토리 장면·등급 점수·보상 점수·멱등 키를 모두 이 파일에서 관리한다.
 * 어느 컴포넌트에서도 레벨 기준을 하드코딩하지 않는다.
 *
 * 설계 원칙(PLAN.md §13 참고):
 * - activityScore = 레벨 판정에 사용하는 '실제 활동 점수' (레벨 보너스 제외)
 * - bonusScore    = 레벨 달성 보너스 점수 (200점) — dreamScore 에는 포함, activityScore 에서는 제외
 *   → 보너스가 다음 레벨을 연쇄적으로 열지 못한다.
 * - dreamScore    = 화면에 표시되는 전체 누적 점수 = activityScore + bonusScore
 */

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'symbol'

/** 레벨 1개당 필요한 활동 점수 구간 폭. 한 곳에서 800/1200 등으로 조정 가능. */
export const ACTIVITY_SCORE_PER_LEVEL = 1000

/** 레벨 달성 보너스(레벨 2~10 최초 달성 시 각 1회). 레벨 1은 시작 레벨이므로 제외. */
export const LEVEL_BONUS_POINTS = 200

/** 최소/최대 레벨 */
export const MIN_LEVEL = 1
export const MAX_LEVEL = 10

/** 레벨 상징 아이템(0점). */
export const SYMBOL_ITEM_POINTS = 0

export interface DreamChapter {
  level: number
  minActivityScore: number
  maxActivityScore: number | null
  chapterTitle: string
  locationName: string
  symbolName: string
  /** 정원/보물지도 배경을 식별하는 키. level 1 은 기존 꿈의 정원 배경을 그대로 사용. */
  backgroundKey: string
  /** 색 테마 키(CSS 그라디언트 매핑용). 외부 이미지 사용 금지. */
  themeKey: string
  /** 상징 아이템을 이모지로 표현(레벨 심볼 아이템이 DB에 없어도 안전). */
  symbolEmoji: string
  nextChapterHint: string
}

/**
 * 10개 스토리 장면. 전체 제목 = "열개의 빛과 꿈의 책".
 * 번호는 항상 1 → 10 순서로 이어진다(보물지도 ㄹ자 배치에서만 시각적 지그재그).
 */
export const DREAM_CHAPTERS: DreamChapter[] = [
  {
    level: 1,
    minActivityScore: 0,
    maxActivityScore: 999,
    chapterTitle: '꿈의 궁전과 빈 책',
    locationName: '꿈의 궁전',
    symbolName: '꿈의 황금 열쇠',
    backgroundKey: 'dream_palace',
    themeKey: 'palace',
    symbolEmoji: '🗝️',
    nextChapterHint: '별빛 정원으로 향하는 길을 찾아보세요.',
  },
  {
    level: 2,
    minActivityScore: 1000,
    maxActivityScore: 1999,
    chapterTitle: '별빛 정원의 작은 씨앗',
    locationName: '별빛 정원',
    symbolName: '별빛 씨앗',
    backgroundKey: 'starlight_garden',
    themeKey: 'starlight',
    symbolEmoji: '🌱',
    nextChapterHint: '구름 도서관에서 사라진 문장을 찾아요.',
  },
  {
    level: 3,
    minActivityScore: 2000,
    maxActivityScore: 2999,
    chapterTitle: '구름 도서관의 사라진 문장',
    locationName: '구름 도서관',
    symbolName: '지혜의 책갈피',
    backgroundKey: 'cloud_library',
    themeKey: 'cloud',
    symbolEmoji: '🔖',
    nextChapterHint: '마법숲에서 길 잃은 친구를 도와주세요.',
  },
  {
    level: 4,
    minActivityScore: 3000,
    maxActivityScore: 3999,
    chapterTitle: '마법숲의 길 잃은 친구',
    locationName: '마법숲',
    symbolName: '도움의 나뭇잎',
    backgroundKey: 'magic_forest',
    themeKey: 'forest',
    symbolEmoji: '🍃',
    nextChapterHint: '바다 탐험섬의 비밀 지도를 따라가 봐요.',
  },
  {
    level: 5,
    minActivityScore: 4000,
    maxActivityScore: 4999,
    chapterTitle: '바다 탐험섬의 비밀 지도',
    locationName: '바다 탐험섬',
    symbolName: '탐험 나침반',
    backgroundKey: 'ocean_island',
    themeKey: 'ocean',
    symbolEmoji: '🧭',
    nextChapterHint: '시간이 멈춘 박물관으로 떠나요.',
  },
  {
    level: 6,
    minActivityScore: 5000,
    maxActivityScore: 5999,
    chapterTitle: '시간이 멈춘 박물관',
    locationName: '시간여행 박물관',
    symbolName: '시간의 모래시계',
    backgroundKey: 'time_museum',
    themeKey: 'time',
    symbolEmoji: '⏳',
    nextChapterHint: '별들 사이의 약속을 확인하러 가요.',
  },
  {
    level: 7,
    minActivityScore: 6000,
    maxActivityScore: 6999,
    chapterTitle: '별들 사이의 약속',
    locationName: '우주 연구기지',
    symbolName: '약속의 별 조각',
    backgroundKey: 'space_station',
    themeKey: 'space',
    symbolEmoji: '🌠',
    nextChapterHint: '상상이 움직이는 발명도시로!',
  },
  {
    level: 8,
    minActivityScore: 7000,
    maxActivityScore: 7999,
    chapterTitle: '상상이 움직이는 발명도시',
    locationName: '발명도시',
    symbolName: '창의의 전구',
    backgroundKey: 'invention_city',
    themeKey: 'invention',
    symbolEmoji: '💡',
    nextChapterHint: '하늘성의 마지막 문을 열어요.',
  },
  {
    level: 9,
    minActivityScore: 8000,
    maxActivityScore: 8999,
    chapterTitle: '하늘성의 마지막 문',
    locationName: '하늘성',
    symbolName: '용기의 날개',
    backgroundKey: 'sky_castle',
    themeKey: 'sky',
    symbolEmoji: '🪽',
    nextChapterHint: '완성된 꿈의 이야기책이 가까워요.',
  },
  {
    level: 10,
    minActivityScore: 9000,
    maxActivityScore: null,
    chapterTitle: '완성된 꿈의 이야기책',
    locationName: '꿈의 책 세계',
    symbolName: '완성된 꿈의 책',
    backgroundKey: 'dream_book',
    themeKey: 'book',
    symbolEmoji: '📖',
    nextChapterHint: '모든 꿈이 하나의 이야기책으로 완성되었어요!',
  },
]

export const DREAM_BOOK_TITLE = '열개의 빛과 꿈의 책'

/**
 * 장면 테마별 배경 그라디언트(외부 이미지 없이 CSS).
 * 꿈의 궁전(레벨1, palace)은 기존 정원 webp 배경을 그대로 사용하므로 여기서는 참조만.
 */
export const THEME_GRADIENTS: Record<string, string> = {
  palace: 'linear-gradient(160deg, #fde7f3 0%, #f4d9f0 45%, #e8c9ee 100%)',
  starlight: 'linear-gradient(160deg, #e7ecff 0%, #d9e2ff 50%, #c9d6ff 100%)',
  cloud: 'linear-gradient(160deg, #f3f7ff 0%, #e7f0ff 50%, #dfeaff 100%)',
  forest: 'linear-gradient(160deg, #e6f7e8 0%, #d3efdc 50%, #c2e6cd 100%)',
  ocean: 'linear-gradient(160deg, #e2f4fb 0%, #c9e9f6 50%, #b3ddf2 100%)',
  time: 'linear-gradient(160deg, #f5efe6 0%, #ece1cf 50%, #e0d0b6 100%)',
  space: 'linear-gradient(160deg, #e9e3ff 0%, #d8ccff 50%, #c3b0ff 100%)',
  invention: 'linear-gradient(160deg, #fff2e0 0%, #ffe3c2 50%, #ffd49d 100%)',
  sky: 'linear-gradient(160deg, #eaf6ff 0%, #cfe9ff 50%, #b5dcff 100%)',
  book: 'linear-gradient(160deg, #fde7f0 0%, #ffd9e5 40%, #ffe9cf 100%)',
}

/** level 1(꿈의 궁전)은 기존 정원 webp 배경을 쓰므로 그라디언트 대상에서 제외. */
export const DEFAULT_BACKGROUND_LEVEL = 1

/**
 * 레벨별 꿈의 정원 배경 이미지 경로(public 기준 절대경로).
 *
 * - 레벨1: 기존 정원 배경(student-ui.css .dg-background-image 가 사용 중인 webp). 경로/파일 변경 금지.
 * - 레벨2~10: /public/images 에 준비된 실제 이미지(level-N-*.png). 1~10 전 레벨 실제 이미지 매핑.
 *
 * 배경은 오직 '학생의 실제 레벨 값 하나'만 기준으로 자동 선택된다(수동 선택 아님).
 * useGardenBackgroundUrl() 이 이미지를 preload 한 뒤 로딩 실패/404 시 레벨1 배경으로 폴백한다.
 */
export const GARDEN_BACKGROUND_BY_LEVEL: Record<number, string> = {
  1: '/images/student_garden_bg.webp',
  2: '/images/level-2-starlight-garden.png',
  3: '/images/level-3-cloud-library.png',
  4: '/images/level-4-magic-forest.png',
  5: '/images/level-5-adventure-island.png',
  6: '/images/level-6-time-museum.png',
  7: '/images/level-7-star-promise.png',
  8: '/images/level-8-invention-city.png',
  9: '/images/level-9-sky-castle-gate.png',
  10: '/images/level-10-dream-storybook.png',
}

/** 기본(레벨1) 배경 이미지 URL — 로딩 실패/미지원 레벨 폴백용. */
export const GARDEN_BACKGROUND_FALLBACK = GARDEN_BACKGROUND_BY_LEVEL[1]

/**
 * 레벨별 배경 이미지 URL 반환.
 * 매핑이 없는 범위 밖 레벨이면 레벨1 배경으로 폴백한다.
 */
export function getGardenBackgroundUrl(level: number): string {
  return GARDEN_BACKGROUND_BY_LEVEL[level] ?? GARDEN_BACKGROUND_FALLBACK
}

// ─────────────────────────────────────────────────────────────────
// 레벨별 아이템 카탈로그 (레벨 2~10).
// 레벨 1의 30개 아이템은 기존 시드(출석/만화 보상)로 지급되므로 여기서 제외.
// 각 레벨 달성 시 해당 레벨 아이템이 자동 지급된다(dreamLevelItemService.ensureLevelItems).
//
// - code: DB items.code (전역 unique). 레벨1과 충돌하지 않도록 lv{N}_ 접두어.
// - image: 파일명만. 실제 경로는 getLevelItemImageUrl(level, image) 로 조합.
// - category/rarity: DB CHECK 제약(items_category_check / items_rarity_check) 준수.
// ─────────────────────────────────────────────────────────────────
export type ItemCategory = 'nature' | 'animal' | 'spirit' | 'decor' | 'sky' | 'legend'
export type GrantableRarity = Exclude<ItemRarity, 'symbol'>

export interface LevelItemSpec {
  code: string
  name: string
  category: ItemCategory
  rarity: GrantableRarity
  description: string
  /** 파일명(예: 'firefly.png'). 경로는 getLevelItemImageUrl 로 조합. */
  image: string
  /** 정원 자동 배치 기본 크기(미지정 시 1). */
  defaultScale?: number
}

const li = (
  level: number,
  slug: string,
  name: string,
  category: ItemCategory,
  rarity: GrantableRarity,
  description: string,
  defaultScale = 0.9,
): LevelItemSpec => ({
  code: `lv${level}_${slug.replace(/-/g, '_')}`,
  name,
  category,
  rarity,
  description,
  image: `${slug}.png`,
  defaultScale,
})

/**
 * li() 와 동일하되 이미지 파일명을 명시적으로 지정(파일명이 code slug 와 다를 때).
 * 레벨 2 신규 아이템(lv2_item_NN.png)처럼 파일명이 코드와 무관할 때 사용.
 * 코드는 slug 기반(lv{level}_{slug}) → 기존 코드를 그대로 유지하면서 이미지만 교체.
 */
const liImg = (
  level: number,
  slug: string,
  name: string,
  category: ItemCategory,
  rarity: GrantableRarity,
  description: string,
  imageFile: string,
  defaultScale = 0.9,
): LevelItemSpec => ({
  code: `lv${level}_${slug.replace(/-/g, '_')}`,
  name,
  category,
  rarity,
  description,
  image: imageFile,
  defaultScale,
})

/**
 * 레벨 2~10 의 아이템 목록. 각 10개씩.
 * 레벨이 오를수록 등급이 높은(희귀/전설) 아이템 비중이 커진다.
 */
export const LEVEL_ITEM_CATALOG: Record<number, LevelItemSpec[]> = {
  2: [
    // 레벨 2 전용 신규 아이템(lv2_item_NN.png). code 는 기존 slug 기반 코드를 유지한다.
    liImg(2, 'small-flower-seed', '반짝이는 별목걸이', 'decor', 'common', '별빛을 고스란히 머금은 반짝이는 목걸이예요.', 'lv2_item_01.png'),
    liImg(2, 'sparkling-grass', '구름 젤리 컵', 'decor', 'common', '폭신한 구름을 담은 달콤한 젤리 컵이에요.', 'lv2_item_02.png'),
    liImg(2, 'pink-flower', '무지개 깃펜', 'decor', 'common', '무지개 빛 먹물로 이야기를 적는 깃펜이에요.', 'lv2_item_03.png'),
    liImg(2, 'small-star-piece', '달빛 보석함', 'decor', 'uncommon', '달빛 보석을 반짝이게 보관하는 상자예요.', 'lv2_item_04.png'),
    liImg(2, 'yellow-butterfly', '솜사탕 왕관', 'decor', 'uncommon', '폭신한 솜사탕으로 만든 달콤한 왕관이에요.', 'lv2_item_05.png'),
    liImg(2, 'flower-path', '바람개비 배지', 'decor', 'uncommon', '바람이 불 때마다 살랑 도는 바람개비 배지예요.', 'lv2_item_06.png'),
    liImg(2, 'moonlight-mushroom', '꿈씨앗 화분', 'nature', 'rare', '작은 꿈이 자라나는 신비한 씨앗 화분이에요.', 'lv2_item_07.png'),
    liImg(2, 'firefly', '마법 리본 상자', 'decor', 'rare', '리본이 저절로 매듭지는 마법 상자예요.', 'lv2_item_08.png'),
    liImg(2, 'waterdrop-spirit', '햇살 나침반', 'decor', 'epic', '밝은 햇살 쪽으로 길을 알려주는 나침반이에요.', 'lv2_item_09.png'),
    liImg(2, 'aurora-tree', '별사탕 램프', 'sky', 'epic', '별사탕처럼 반짝이는 포근한 램프예요.', 'lv2_item_10.png'),
  ],
  3: [
    li(3, 'tiny-telescope', '작은 망원경', 'decor', 'common', '멀리 있는 것을 보게 해 주는 망원경이에요.'),
    li(3, 'feather-quill', '깃펜', 'decor', 'common', '이야기를 적을 때 쓰는 깃펜이에요.'),
    li(3, 'cloud-desk', '구름 책상', 'decor', 'common', '구름으로 만든 포근한 책상이에요.'),
    li(3, 'cloud-bookshelf', '구름 책장', 'decor', 'uncommon', '책을 가득 담은 구름 책장이에요.'),
    li(3, 'magic-magnifier', '마법 돋보기', 'decor', 'uncommon', '숨겨진 것을 찾아주는 돋보기예요.'),
    li(3, 'sky-globe', '하늘 지구본', 'sky', 'uncommon', '하늘의 모양을 담은 지구본이에요.'),
    li(3, 'wisdom-bookmark', '지혜의 책갈피', 'decor', 'rare', '읽던 자리를 기억하는 책갈피예요.'),
    li(3, 'flying-book', '날아다니는 책', 'spirit', 'rare', '스스로 날아다니는 신비한 책이에요.'),
    li(3, 'sentence-fragments', '사라진 문장', 'spirit', 'epic', '도서관에서 잃어버린 문장 조각이에요.'),
    li(3, 'golden-book', '황금책', 'legend', 'legendary', '모든 지혜를 담은 전설의 책이에요.'),
  ],
  4: [
    li(4, 'tiny-treehouse', '작은 나무집', 'decor', 'common', '나무 위에 지은 아담한 집이에요.'),
    li(4, 'mushroom-lamp', '버섯 램프', 'decor', 'common', '버섯 모양의 포근한 램프예요.'),
    li(4, 'helping-leaf', '도움의 나뭇잎', 'nature', 'common', '친구를 돕고 싶게 만드는 나뭇잎이에요.'),
    li(4, 'flower-bridge', '꽃다리', 'decor', 'uncommon', '꽃으로 만든 예쁜 다리예요.'),
    li(4, 'forest-mailbox', '숲 우체통', 'decor', 'uncommon', '숲 친구들에게 편지를 받는 우체통이에요.'),
    li(4, 'crystal-pond', '수정 연못', 'nature', 'uncommon', '맑은 수정빛 연못이에요.'),
    li(4, 'glowing-stone', '빛나는 돌', 'nature', 'rare', '어둠 속에서도 빛나는 돌이에요.'),
    li(4, 'fox-spirit', '여우 정령', 'spirit', 'rare', '숲을 지켜 주는 여우 정령이에요.'),
    li(4, 'wisdom-tree', '지혜의 나무', 'nature', 'epic', '오래된 지혜를 품은 나무예요.'),
    li(4, 'golden-deer', '황금 사슴', 'animal', 'legendary', '숲 깊은 곳의 전설의 사슴이에요.'),
  ],
  5: [
    li(5, 'sandcastle', '모래성', 'decor', 'common', '해변에 쌓은 멋진 모래성이에요.'),
    li(5, 'palm-tree', '야자수', 'nature', 'common', '바닷가에 서 있는 야자수예요.'),
    li(5, 'lifebuoy', '구명튜브', 'decor', 'common', '안전을 지켜 주는 구명튜브예요.'),
    li(5, 'small-lighthouse', '작은 등대', 'decor', 'uncommon', '배 길을 밝혀 주는 등대예요.'),
    li(5, 'sea-map', '바다 지도', 'decor', 'uncommon', '보물을 찾아주는 바다 지도예요.'),
    li(5, 'whale-fountain', '고래 분수', 'animal', 'uncommon', '물을 뿜어 올리는 고래 분수예요.'),
    li(5, 'explorer-compass', '탐험가 나침반', 'decor', 'rare', '길을 잃지 않게 해 주는 나침반이에요.'),
    li(5, 'adventure-ship', '탐험선', 'decor', 'epic', '넓은 바다를 누비는 탐험선이에요.'),
    li(5, 'golden-anchor', '황금 닻', 'legend', 'legendary', '어떤 폭풍도 견디는 전설의 닻이에요.'),
    li(5, 'treasure-chest', '보물상자', 'legend', 'legendary', '비밀 지도 끝의 보물상자예요.'),
  ],
  6: [
    li(6, 'clock-fragment', '시계 조각', 'decor', 'common', '멈춘 시계에서 떨어진 조각이에요.'),
    li(6, 'time-key', '시간의 열쇠', 'decor', 'common', '시간의 문을 여는 열쇠예요.'),
    li(6, 'museum-lantern', '박물관 등불', 'decor', 'common', '박물관을 밝히는 오래된 등불이에요.'),
    li(6, 'memory-frame', '추억 액자', 'decor', 'uncommon', '소중한 추억을 담는 액자예요.'),
    li(6, 'hourglass-bottle', '모래시계 병', 'decor', 'uncommon', '시간이 담긴 신비한 병이에요.'),
    li(6, 'time-bell', '시간의 종', 'decor', 'uncommon', '시간을 알려 주는 종이에요.'),
    li(6, 'crystal-pendulum', '수정 진자', 'spirit', 'rare', '시간의 흐름을 보여 주는 수정이에요.'),
    li(6, 'golden-gear', '황금 톱니바퀴', 'decor', 'rare', '오래도록 굴러가는 황금 톱니예요.'),
    li(6, 'mini-clock-tower', '미니 시계탑', 'decor', 'epic', '박물관 한가운데의 시계탑이에요.'),
    li(6, 'time-crown', '시간의 왕관', 'legend', 'legendary', '시간을 다스리는 전설의 왕관이에요.'),
  ],
  7: [
    li(7, 'star-lantern', '별빛 등불', 'sky', 'common', '별빛을 모은 등불이에요.'),
    li(7, 'moon-ribbon', '달빛 리본', 'decor', 'common', '달빛으로 짠 부드러운 리본이에요.'),
    li(7, 'stardust-bottle', '별가루 병', 'decor', 'common', '별가루를 담은 반짝이는 병이에요.'),
    li(7, 'promise-star', '약속의 별', 'sky', 'uncommon', '약속을 기억하게 해 주는 별이에요.'),
    li(7, 'moon-cradle', '달 요람', 'decor', 'uncommon', '달빛 아래 포근한 요람이에요.'),
    li(7, 'constellation-ring', '별자리 반지', 'decor', 'uncommon', '별자리 무늬의 반지예요.'),
    li(7, 'nebula-orb', '성운 구슬', 'sky', 'rare', '우주의 성운을 담은 구슬이에요.'),
    li(7, 'galaxy-swing', '은하 그네', 'decor', 'rare', '은하 속에서 높이 뜨는 그네예요.'),
    li(7, 'comet-bridge', '혜성 다리', 'sky', 'epic', '혜성이 만들어 낸 반짝이는 다리예요.'),
    li(7, 'promise-crown', '약속의 왕관', 'legend', 'legendary', '별들 사이의 약속을 새긴 왕관이에요.'),
  ],
  8: [
    li(8, 'spring-chair', '스프링 의자', 'decor', 'common', '통통 튀어 오르는 의자예요.'),
    li(8, 'windmill-cart', '풍차 수레', 'decor', 'common', '바람으로 움직이는 수레예요.'),
    li(8, 'gear-flower', '톱니바퀴 꽃', 'nature', 'common', '톱니바퀴로 피어난 꽃이에요.'),
    li(8, 'idea-bulb', '아이디어 전구', 'decor', 'uncommon', '반짝 떠오른 생각을 담은 전구예요.'),
    li(8, 'mini-robot', '미니 로봇', 'decor', 'uncommon', '도움을 주는 작은 로봇이에요.'),
    li(8, 'inventor-toolbox', '발명가 도구상자', 'decor', 'uncommon', '온갖 도구가 든 상자예요.'),
    li(8, 'steam-fountain', '증기 분수', 'decor', 'rare', '증기를 뿜어 올리는 분수예요.'),
    li(8, 'moving-bridge', '움직이는 다리', 'decor', 'rare', '스스로 열리고 닫히는 다리예요.'),
    li(8, 'tiny-airship', '작은 비행선', 'sky', 'epic', '하늘을 나는 멋진 비행선이에요.'),
    li(8, 'invention-core', '발명의 핵심', 'legend', 'legendary', '도시를 움직이는 전설의 동력이에요.'),
  ],
  9: [
    li(9, 'door-lantern', '문 등불', 'decor', 'common', '큰 문을 밝히는 등불이에요.'),
    li(9, 'cloud-pillar', '구름 기둥', 'decor', 'common', '하늘성을 떠받치는 기둥이에요.'),
    li(9, 'sky-crystal', '하늘 수정', 'sky', 'common', '투명하게 빛나는 하늘 수정이에요.'),
    li(9, 'crystal-banner', '수정 깃발', 'decor', 'uncommon', '빛으로 수놓은 깃발이에요.'),
    li(9, 'guardian-bell', '수호의 종', 'decor', 'uncommon', '성을 지키는 종이에요.'),
    li(9, 'floating-stair', '떠다니는 계단', 'decor', 'uncommon', '공중에 떠 있는 신비한 계단이에요.'),
    li(9, 'light-shield', '빛의 방패', 'decor', 'rare', '빛으로 만든 든든한 방패예요.'),
    li(9, 'royal-emblem', '왕가의 문장', 'decor', 'rare', '하늘성 왕가의 문장이에요.'),
    li(9, 'sky-key', '하늘의 열쇠', 'decor', 'epic', '마지막 문을 여는 열쇠예요.'),
    li(9, 'final-lock', '마지막 자물쇠', 'legend', 'legendary', '용기 있는 자만 여는 자물쇠예요.'),
  ],
  10: [
    li(10, 'magic-page', '마법의 페이지', 'decor', 'uncommon', '스스로 글자가 써지는 페이지예요.'),
    li(10, 'memory-feather', '추억의 깃털', 'animal', 'uncommon', '소중한 기억을 담은 깃털이에요.'),
    li(10, 'story-lamp', '이야기 등불', 'decor', 'uncommon', '이야기를 비추는 따뜻한 등불이에요.'),
    li(10, 'golden-bookmark', '황금 책갈피', 'decor', 'rare', '완성된 책의 황금 책갈피예요.'),
    li(10, 'star-seal', '별의 인장', 'decor', 'rare', '완성된 이야기를 인증하는 인장이에요.'),
    li(10, 'dream-orb', '꿈의 구슬', 'spirit', 'rare', '모든 꿈이 담긴 반짝이는 구슬이에요.'),
    li(10, 'book-garden', '책 정원', 'nature', 'epic', '책 속에서 피어난 정원이에요.'),
    li(10, 'final-star-tree', '마지막 별나무', 'nature', 'epic', '별빛을 가득 머금은 나무예요.'),
    li(10, 'story-crown', '이야기의 왕관', 'legend', 'legendary', '완성된 이야기책의 왕관이에요.'),
    li(10, 'dream-book', '꿈의 책', 'legend', 'legendary', '모든 꿈이 하나로 묶인 전설의 책이에요.'),
  ],
}

/** 레벨 범위 보정 후 해당 레벨 아이템 목록 반환(없으면 빈 배열). */
export function getLevelItems(level: number): LevelItemSpec[] {
  return LEVEL_ITEM_CATALOG[level] ?? []
}

/** 레벨 아이템의 public 이미지 경로 조합. */
export function getLevelItemImageUrl(level: number, image: string): string {
  return `/images/toonschool/dream-garden/items/level-${level}/${image}`
}

/** 아이템 등급 → 기본 점수. symbol(레벨 상징)은 0점. */
export const RARITY_BASE_POINTS: Record<ItemRarity, number> = {
  common: 50,
  uncommon: 80,
  rare: 120,
  epic: 200,
  legendary: 300,
  symbol: 0,
}

/** 등급 표시명(한글). */
export const RARITY_LABEL: Record<ItemRarity, string> = {
  common: '일반',
  uncommon: '노력',
  rare: '도전',
  epic: '희귀',
  legendary: '전설',
  symbol: '레벨 상징',
}

/**
 * 동일 아이템 중복 획득 점수 정책.
 * - 첫 획득: 기본 점수의 100%
 * - 두 번째 이후: 기본 점수의 25%
 */
export const DUPLICATE_ITEM_FIRST_RATE = 1.0
export const DUPLICATE_ITEM_REPEAT_RATE = 0.25

/** 보상 이벤트 점수. reward_logs 의 reward_type / source_id 와 대응한다. */
export const REWARD_EVENT_POINTS = {
  attendance: 50, // 일일 출석
  streak5: 100, // 5일 연속 출석(최초 충족 시)
  comicComplete: 120, // 만화 작품 완성
  teacherPraise: 50, // 선생님 칭찬
  specialMission: 200, // 특별 미션
  levelBonus: LEVEL_BONUS_POINTS, // 레벨 달성 보너스(bonusScore)
  symbol: 0, // 레벨 상징 아이템
} as const

/**
 * 멱등 키 빌더. reward_logs.source_id 인코딩에 사용.
 * reward_type 은 운영 CHECK 제약(attendance/comic_complete/lucky_reward/hidden_encounter/teacher_reward/event)을
 * 존중하여 기존 허용값을 그대로 쓰고, source_id prefix 로 세부 종류를 구분한다.
 */
export const DreamIdempotencyKeys = {
  /** 5일 연속 출석: streakEnd(YYYY-MM-DD) */
  streak5: (streakEnd: string) => `dream:streak5:${streakEnd}`,
  /** 레벨 달성 보너스(200점) — 학생당 레벨별 1회 */
  levelBonus: (level: number) => `dream:level:${level}`,
  /** 레벨 상징 아이템(0점) — 학생당 레벨별 1회 */
  levelSymbol: (level: number) => `dream:symbol:${level}`,
  /** 레벨 달성 아이템(0점, 정원 배치용) — 학생당 (레벨,아이템코드) 별 1회 */
  levelItem: (level: number, code: string) => `dream:item:${level}:${code}`,
  /** 특별 미션 */
  specialMission: (missionId: string) => `dream:special:${missionId}`,
  /** 선생님 칭찬 — teacher_messages.id 를 자연 멱등키로 사용 */
  teacherPraise: (messageId: string) => `praise:${messageId}`,
} as const

/** reward_logs 에서 'event' 보상의 세부 종류를 source_id prefix 로 식별 */
export const EVENT_SOURCE_PREFIX = {
  streak5: 'dream:streak5:',
  level: 'dream:level:',
  symbol: 'dream:symbol:',
  item: 'dream:item:',
  special: 'dream:special:',
} as const

/** helper: 챕터를 레벨로 조회 */
export function getChapterByLevel(level: number): DreamChapter {
  const clamped = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level))
  return DREAM_CHAPTERS.find((c) => c.level === clamped) ?? DREAM_CHAPTERS[0]
}

/** helper: 챕터를 레벨로 조회(짧은 별칭) */
export function getChapter(level: number): DreamChapter {
  return getChapterByLevel(level)
}

/** helper: 활동 점수로 레벨 계산 */
export function levelFromActivityScore(activityScore: number): number {
  if (activityScore < 0) return MIN_LEVEL
  // 0~999 -> 1, 1000~1999 -> 2, ... 9000+ -> 10
  const level = Math.floor(activityScore / ACTIVITY_SCORE_PER_LEVEL) + 1
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level))
}
