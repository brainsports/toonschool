// 창작 과목 표지/뒤표지 유형 프리셋 + 공통 상태 타입.
// 기존 5개 교과목 표지(정적 템플릿)와 분리되며, '창작' 과목에서만 사용한다.

// ===== 유형 코드 유니온 =====
export type CoverTypeCode =
  | 'basic'
  | 'adventure'
  | 'mystery'
  | 'comic'
  | 'emotional'
  | 'versus'
  | 'character'
  | 'cinematic';

export type BackCoverTypeCode =
  | 'basic'
  | 'author-note'
  | 'characters'
  | 'quote'
  | 'next-episode'
  | 'work-card';

// ===== 프리셋 인터페이스 =====
export interface CoverTypePreset {
  code: CoverTypeCode;
  name: string; // 표시 이름 (학생용)
  description: string; // 학생용 설명
  fitGenres: string[]; // 추천 장르
  compositionGuide: string; // 구도 설명 (이미지 프롬프트용, 영문)
  promptRule: string; // 유형별 추가 프롬프트 규칙 (영문)
  preview: { emoji: string; gradient: string }; // 썸네일/미리보기 (에셋 추가 전 emoji+그라데이션)
  active: boolean; // 활성화 여부
  sortOrder: number; // 정렬 순서
}

export interface BackCoverTypePreset {
  code: BackCoverTypeCode;
  name: string;
  description: string;
  compositionGuide: string; // 이미지 프롬프트용 (영문)
  promptRule: string; // 유형별 추가 프롬프트 규칙 (영문)
  preview: { emoji: string; gradient: string };
  active: boolean;
  sortOrder: number;
}

// ===== 표지 유형 8종 =====
export const FRONT_COVER_TYPE_PRESETS: CoverTypePreset[] = [
  {
    code: 'basic',
    name: '기본형',
    description: '주인공을 크게, 배경은 뒤에. 처음 만들기 좋아요.',
    fitGenres: ['생활', '학교', '가족'],
    compositionGuide:
      'Center the protagonist large in the middle of the frame. Place the main background behind the character. Stable, easy-to-understand composition.',
    promptRule: 'Hero centered at eye-level, friendly and approachable.',
    preview: { emoji: '🏠', gradient: 'from-sky-100 to-blue-200' },
    active: true,
    sortOrder: 1,
  },
  {
    code: 'adventure',
    name: '모험형',
    description: '주인공이 새로운 곳으로 떠나는 신나는 장면.',
    fitGenres: ['탐험', '보물찾기', '우주여행', '바다 모험'],
    compositionGuide:
      'Dynamic composition: the protagonist looks toward or runs into a new location. Wide background. Forward-looking, energetic pose that promises an upcoming adventure.',
    promptRule: 'Show the path or destination ahead, sense of scale and journey.',
    preview: { emoji: '🗺️', gradient: 'from-emerald-100 to-teal-200' },
    active: true,
    sortOrder: 2,
  },
  {
    code: 'mystery',
    name: '신비형',
    description: '빛나는 열쇠·시계·문으로 가득한 몽환적인 느낌.',
    fitGenres: ['판타지', '시간 여행', '미스터리', '마법'],
    compositionGuide:
      'Emphasize glowing objects such as a door, clock, key, or magical item. Strong contrast between light and dark. A secretive, dreamy atmosphere that is not scary.',
    promptRule: 'Mysterious glow, floating light particles, deep but non-frightening shadows.',
    preview: { emoji: '🔮', gradient: 'from-indigo-100 to-purple-200' },
    active: true,
    sortOrder: 3,
  },
  {
    code: 'comic',
    name: '코믹형',
    description: '재미있는 표정과 과장된 움직임, 발랄한 분위기.',
    fitGenres: ['학교 소동', '가족 소동', '실수 이야기', '로봇 코미디'],
    compositionGuide:
      'Funny facial expressions, exaggerated poses and movement. Bright, joyful mood. Feels like something fun is about to happen.',
    promptRule: 'Big expressive faces, dynamic motion lines, bright comedy tone.',
    preview: { emoji: '😄', gradient: 'from-yellow-100 to-orange-200' },
    active: true,
    sortOrder: 4,
  },
  {
    code: 'emotional',
    name: '감동형',
    description: '인물들이 함께 있어 따뜻하고 마음이 가는 장면.',
    fitGenres: ['친구', '가족', '반려동물', '화해', '성장'],
    compositionGuide:
      'Emphasize the relationship between characters — looking at each other or holding hands. Soft, warm background. Calm and gentle composition.',
    promptRule: 'Warm golden-hour light, gentle expressions, sense of connection.',
    preview: { emoji: '💖', gradient: 'from-pink-100 to-rose-200' },
    active: true,
    sortOrder: 5,
  },
  {
    code: 'versus',
    name: '대결형',
    description: '두 인물이 마주 보는 긴장감 넘치는 장면.',
    fitGenres: ['운동 경기', '요리 대결', '퀴즈 대회', '로봇 대결'],
    compositionGuide:
      'Two characters or two teams facing each other. Place an important object or goal in the middle. Tense but friendly competition composition.',
    promptRule: 'Symmetric standoff, determined faces, competitive but good-natured.',
    preview: { emoji: '🤝', gradient: 'from-orange-100 to-red-200' },
    active: true,
    sortOrder: 6,
  },
  {
    code: 'character',
    name: '캐릭터형',
    description: '등장인물 2~3명의 개성을 크게 보여 주는 장면.',
    fitGenres: ['친구 이야기', '팀 활동', '캐릭터 중심 이야기'],
    compositionGuide:
      'Feature 2 to 3 characters large. Emphasize each one’s expression and personality. Keep the background relatively simple.',
    promptRule: 'Group portrait, distinct poses, clear silhouettes.',
    preview: { emoji: '👫', gradient: 'from-violet-100 to-purple-200' },
    active: true,
    sortOrder: 7,
  },
  {
    code: 'cinematic',
    name: '영화 포스터형',
    description: '주인공·조연·장소·물건이 한 화면에 담긴 멋진 장면.',
    fitGenres: ['대규모 사건', '여러 인물 이야기', '시리즈 작품'],
    compositionGuide:
      'Compose protagonist, supporting cast, main location, and the key object together in one frame symbolically. Finished movie-poster feel.',
    promptRule: 'Epic layered composition, depth, atmospheric lighting.',
    preview: { emoji: '🎬', gradient: 'from-slate-100 to-indigo-200' },
    active: true,
    sortOrder: 8,
  },
];

// ===== 뒤표지 유형 6종 =====
export const BACK_COVER_TYPE_PRESETS: BackCoverTypePreset[] = [
  {
    code: 'basic',
    name: '기본형',
    description: '작품 소개와 작가의 말을 단정하게. 가장 읽기 쉬워요.',
    compositionGuide:
      'Simple, clean back-cover background. Keep most of the frame open and uncluttered so text can be overlaid later.',
    promptRule: 'Soft pastel wash, generous empty space, tiny decorative motif at the corner.',
    preview: { emoji: '📖', gradient: 'from-sky-100 to-cyan-200' },
    active: true,
    sortOrder: 1,
  },
  {
    code: 'author-note',
    name: '작가의 말형',
    description: '작가의 말을 크게, 따뜻한 느낌으로.',
    compositionGuide:
      'Warm, gentle back-cover background with small decorations (pencil, book, stars). A small character waving. Lots of open space for the author note.',
    promptRule: 'Warm pastel tone, cozy study vibe, calm and personal.',
    preview: { emoji: '✍️', gradient: 'from-amber-100 to-yellow-200' },
    active: true,
    sortOrder: 2,
  },
  {
    code: 'characters',
    name: '등장인물형',
    description: '주요 등장인물 2~3명을 큼직하게.',
    compositionGuide:
      'Feature 2 to 3 main characters on a simple background. Characters placed small and to the side so they never cover the text area.',
    promptRule: 'Small character portraits, simple flat background.',
    preview: { emoji: '🎭', gradient: 'from-violet-100 to-fuchsia-200' },
    active: true,
    sortOrder: 3,
  },
  {
    code: 'quote',
    name: '명대사형',
    description: '작품의 대표 대사를 크게, 영화 같은 느낌.',
    compositionGuide:
      'Cinematic back-cover background that matches a famous line. A small related scene motif. Plenty of empty space for the quote.',
    promptRule: 'Atmospheric lighting, one focal motif, poster-like.',
    preview: { emoji: '💬', gradient: 'from-indigo-100 to-blue-200' },
    active: true,
    sortOrder: 4,
  },
  {
    code: 'next-episode',
    name: '다음 화 예고형',
    description: '다음 이야기를 암시하는 설레는 장면.',
    compositionGuide:
      'Back-cover background hinting at the next episode. Teasing, forward-looking mood. Open space for the next-episode text.',
    promptRule: 'Anticipation mood, distant horizon or silhouette, exciting but gentle.',
    preview: { emoji: '🔜', gradient: 'from-teal-100 to-emerald-200' },
    active: true,
    sortOrder: 5,
  },
  {
    code: 'work-card',
    name: '작품 카드형',
    description: '장르·장소·키워드를 카드처럼 깔끔하게.',
    compositionGuide:
      'Clean card-style back-cover background. Neutral pastel with room for multiple info cards.',
    promptRule: 'Minimal flat background, card-friendly layout, tidy.',
    preview: { emoji: '🗃️', gradient: 'from-slate-100 to-gray-200' },
    active: true,
    sortOrder: 6,
  },
];

// ===== 공통 상태 타입 =====
export type CoverGenerationStatus = 'idle' | 'loading' | 'success' | 'error';

// 한 번 생성한 결과 이력 (재생성해도 이전 결과를 보관)
export interface CoverGenerationRecord {
  id: string;
  generatedImageUrl: string;
  presetCode: string;
  additionalPrompt: string;
  prompt: string;
  createdAt: string;
}

// 작품 기본 정보 (앞 단계에서 자동으로 불러오고 학생이 수정 가능)
export interface CreationCoverBaseInfo {
  title: string;
  subtitle?: string;
  mainCharacter?: string;
  supportingCharacters?: string;
  location?: string;
  importantObject?: string;
  mood?: string;
  storySummary?: string;
  keywords: string[];
  authorDisplayName?: string;
}

// 제목/부제/작가 별도 합성 설정 (AI 이미지 밖에서 툰스쿨이 올림)
export interface CoverTextLayout {
  showTitle: boolean;
  showSubtitle: boolean;
  showAuthor: boolean;
  titleScale: number; // 1.0 기준
  titlePosition: 'top' | 'center';
}

// 뒤표지에 넣을 내용 항목 키
export type BackCoverContentKey =
  | 'oneLineIntro'
  | 'authorNote'
  | 'characters'
  | 'keywords'
  | 'quote'
  | 'bestScene'
  | 'friendQuestion'
  | 'nextEpisode';

export const BACK_COVER_CONTENT_OPTIONS: { key: BackCoverContentKey; label: string; emoji: string }[] = [
  { key: 'oneLineIntro', label: '작품 한 줄 소개', emoji: '📝' },
  { key: 'authorNote', label: '작가의 말', emoji: '✍️' },
  { key: 'characters', label: '등장인물 소개', emoji: '🎭' },
  { key: 'keywords', label: '핵심 키워드', emoji: '🔑' },
  { key: 'quote', label: '작품 속 명대사', emoji: '💬' },
  { key: 'bestScene', label: '최고의 장면', emoji: '⭐' },
  { key: 'friendQuestion', label: '친구에게 묻는 질문', emoji: '🤔' },
  { key: 'nextEpisode', label: '다음 화 예고', emoji: '🔜' },
];

export const BACK_COVER_MIN_SELECTION = 2;
export const BACK_COVER_MAX_SELECTION = 4;

// 창작 앞표지 상태
export interface CreationFrontCoverState {
  coverType: CoverTypeCode | null;
  baseInfo: CreationCoverBaseInfo;
  additionalPrompt: string;
  generatedImageUrl: string | null;
  generationStatus: CoverGenerationStatus;
  generationError: string | null;
  generationHistory: CoverGenerationRecord[];
  selectedGenerationId: string | null;
  textLayout: CoverTextLayout;
  createdAt: string;
  updatedAt: string;
}

// 창작 뒤표지 상태
export interface CreationBackCoverState {
  backCoverType: BackCoverTypeCode | null;
  baseInfo: CreationCoverBaseInfo;
  selectedContents: BackCoverContentKey[];
  contentTexts: Partial<Record<BackCoverContentKey, string>>;
  additionalPrompt: string;
  generatedImageUrl: string | null;
  generationStatus: CoverGenerationStatus;
  generationError: string | null;
  generationHistory: CoverGenerationRecord[];
  selectedGenerationId: string | null;
  inheritFromFront: boolean; // 앞표지 스타일 계승 여부
  createdAt: string;
  updatedAt: string;
}

// 기본 상태 팩토리
export const createDefaultFrontCoverState = (): CreationFrontCoverState => ({
  coverType: null,
  baseInfo: { title: '', keywords: [] },
  additionalPrompt: '',
  generatedImageUrl: null,
  generationStatus: 'idle',
  generationError: null,
  generationHistory: [],
  selectedGenerationId: null,
  textLayout: { showTitle: true, showSubtitle: true, showAuthor: true, titleScale: 1.0, titlePosition: 'top' },
  createdAt: '',
  updatedAt: '',
});

export const createDefaultBackCoverState = (): CreationBackCoverState => ({
  backCoverType: null,
  baseInfo: { title: '', keywords: [] },
  selectedContents: [],
  contentTexts: {},
  additionalPrompt: '',
  generatedImageUrl: null,
  generationStatus: 'idle',
  generationError: null,
  generationHistory: [],
  selectedGenerationId: null,
  inheritFromFront: true,
  createdAt: '',
  updatedAt: '',
});
