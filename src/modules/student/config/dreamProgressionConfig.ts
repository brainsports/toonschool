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
 * - 레벨2~5: /public/images 에 준비된 실제 이미지.
 * - 레벨6~10: 아직 이미지가 없어 매핑에서 제외. getGardenBackgroundUrl() 이 레벨1 배경으로 폴백.
 *   새 이미지가 준비되면 이 맵에 한 줄 추가만 하면 자동 반영된다(임의 배경 연결 금지).
 *
 * 배경은 오직 '학생의 실제 레벨 값 하나'만 기준으로 자동 선택된다(수동 선택 아님).
 */
export const GARDEN_BACKGROUND_BY_LEVEL: Record<number, string> = {
  1: '/images/student_garden_bg.webp',
  2: '/images/level-2-starlight-garden.png',
  3: '/images/level-3-cloud-library.png',
  4: '/images/level-4-magic-forest.png',
  5: '/images/level-5-adventure-island.png',
}

/** 기본(레벨1) 배경 이미지 URL — 로딩 실패/미지원 레벨 폴백용. */
export const GARDEN_BACKGROUND_FALLBACK = GARDEN_BACKGROUND_BY_LEVEL[1]

/**
 * 레벨별 배경 이미지 URL 반환.
 * 이미지가 없는 레벨(6~10)이거나 범위 밖이면 레벨1 배경으로 폴백한다.
 */
export function getGardenBackgroundUrl(level: number): string {
  return GARDEN_BACKGROUND_BY_LEVEL[level] ?? GARDEN_BACKGROUND_FALLBACK
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
