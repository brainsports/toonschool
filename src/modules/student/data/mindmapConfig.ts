/**
 * 툰마인드 디자인 설정: 테마(팔레트/배경/장식), 아이콘, 색상 키, 기본 제한.
 *
 * 색상은 colorKey 로 추상화한다. 각 테마는 동일한 colorKey 들(branch1..branch8, central,
 * thought) 에 대해 서로 다른 파스텔 색을 제공한다. → 테마 변경 시 노드 데이터는 그대로,
 * 시각만 바뀐다(학생 입력/위치 보존).
 */

export interface MindmapPalette {
  /** 캔버스 배경(CSS gradient 문자열). */
  background: string;
  /** 배경 장식 색(구름/별 등). */
  cloud: string;
  accent: string;
  /** 중심 주제 색. */
  central: string;
  centralBorder: string;
  centralText: string;
  /** 큰 가지 색 8종(branch1..branch8). */
  branches: string[];
  branchBorders: string[];
  branchText: string;
  /** 설명 카드(작은 가지) 기본 색. */
  cardBg: string;
  cardBorder: string;
  cardText: string;
  /** '나의 생각' 노드 색. */
  thought: string;
  thoughtBorder: string;
  /** 곡선 연결선 두께(px). */
  lineStroke: number;
}

export interface MindmapTheme {
  id: string;
  name: string;
  emoji: string;
  /** 캔버스 배경에 뿌릴 장식 이모지/도형 종류. */
  decorations: string[];
  palette: MindmapPalette;
}

/** colorKey → 실제 색을 테마에서 해석하는 헬퍼. */
export function resolveColor(palette: MindmapPalette, colorKey: string): { fill: string; border: string } {
  if (colorKey === 'central') return { fill: palette.central, border: palette.centralBorder };
  if (colorKey === 'thought') return { fill: palette.thought, border: palette.thoughtBorder };
  const m = /^branch(\d+)$/.exec(colorKey);
  if (m) {
    const idx = Math.min(Math.max(parseInt(m[1], 10) - 1, 0), palette.branches.length - 1);
    return { fill: palette.branches[idx], border: palette.branchBorders[idx] };
  }
  return { fill: palette.cardBg, border: palette.cardBorder };
}

export const MINDMAP_THEMES: MindmapTheme[] = [
  {
    id: 'pastel',
    name: '기본 파스텔',
    emoji: '🎨',
    decorations: ['☁️', '⭐', '🌸', '🌿'],
    palette: {
      background: 'linear-gradient(135deg, #fbfdff 0%, #eaf6ff 55%, #f3eaff 100%)',
      cloud: '#ffffff',
      accent: '#ffd166',
      central: '#fff7e6',
      centralBorder: '#f6c177',
      centralText: '#7a5230',
      branches: ['#bfe9c9', '#cfe3ff', '#ffd9b3', '#ffd0e6', '#e2d2ff', '#fff3b0', '#c6f5e0', '#ffc7c2'],
      branchBorders: ['#7fcf93', '#8fb8ec', '#f0a858', '#f59cc4', '#b69dee', '#e8c34d', '#7fd9af', '#ef938a'],
      branchText: '#4a3a2a',
      cardBg: '#ffffff',
      cardBorder: '#e4e9f2',
      cardText: '#4a5568',
      thought: '#fff0f6',
      thoughtBorder: '#f7a8c4',
      lineStroke: 7,
    },
  },
  {
    id: 'sky',
    name: '하늘과 구름',
    emoji: '☁️',
    decorations: ['☁️', '🌈', '🐦', '✨'],
    palette: {
      background: 'linear-gradient(180deg, #dff1ff 0%, #bfe6ff 60%, #eaf7ff 100%)',
      cloud: '#ffffff',
      accent: '#7ec8ff',
      central: '#ffffff',
      centralBorder: '#7ec8ff',
      centralText: '#2b5e8c',
      branches: ['#cdeaff', '#bfe3ff', '#d6f0ff', '#c2eaff', '#dff3ff', '#bce0ff', '#c9e8ff', '#d7eeff'],
      branchBorders: ['#6fb8ef', '#5fa7e0', '#8cc6f0', '#66aee6', '#9bd0f2', '#5fa0d8', '#7cbce8', '#8ac4ee'],
      branchText: '#274c66',
      cardBg: '#ffffff',
      cardBorder: '#cfe6f7',
      cardText: '#3a5874',
      thought: '#eaf6ff',
      thoughtBorder: '#7ec8ff',
      lineStroke: 7,
    },
  },
  {
    id: 'forest',
    name: '숲과 나무',
    emoji: '🌳',
    decorations: ['🍃', '🌲', '🍄', '🦋'],
    palette: {
      background: 'linear-gradient(135deg, #f1f8ea 0%, #e3f3d6 55%, #f6fbe8 100%)',
      cloud: '#ffffff',
      accent: '#8bc34a',
      central: '#fffbe6',
      centralBorder: '#a3c97a',
      centralText: '#46512a',
      branches: ['#d7ecc6', '#c7e6b8', '#e2f0d3', '#cce5b8', '#d9ecc4', '#c4e0a8', '#d5e8bf', '#e0efce'],
      branchBorders: ['#8fc06a', '#7fb358', '#a3cc7d', '#7fae57', '#92c46e', '#76a84f', '#8cbe66', '#9cc878'],
      branchText: '#3c4a26',
      cardBg: '#ffffff',
      cardBorder: '#d6e8c2',
      cardText: '#4a5a36',
      thought: '#f1f8e8',
      thoughtBorder: '#a3c97a',
      lineStroke: 7,
    },
  },
  {
    id: 'space',
    name: '우주 탐험',
    emoji: '🚀',
    decorations: ['⭐', '🌙', '🪐', '✨'],
    palette: {
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
      cloud: '#a5b4fc',
      accent: '#fbbf24',
      central: '#fef3c7',
      centralBorder: '#fbbf24',
      centralText: '#5b4500',
      branches: ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#a855f7'],
      branchBorders: ['#818cf8', '#a78bfa', '#f472b6', '#22d3ee', '#fbbf24', '#34d399', '#60a5fa', '#c084fc'],
      branchText: '#ffffff',
      cardBg: '#312e81',
      cardBorder: '#6366f1',
      cardText: '#e0e7ff',
      thought: '#4c1d95',
      thoughtBorder: '#c4b5fd',
      lineStroke: 7,
    },
  },
  {
    id: 'sea',
    name: '바닷속',
    emoji: '🐠',
    decorations: ['🫧', '🐚', '🌊', '⭐'],
    palette: {
      background: 'linear-gradient(180deg, #bfeefb 0%, #8fd8f5 55%, #c9f4ff 100%)',
      cloud: '#ffffff',
      accent: '#22b8cf',
      central: '#fff7e6',
      centralBorder: '#ffd166',
      centralText: '#1f5d6b',
      branches: ['#bdeefb', '#aee3f5', '#cdeffc', '#a8e0f0', '#c4ecf9', '#9fd6e8', '#bceaf4', '#d2f0fc'],
      branchBorders: ['#5fc3d6', '#4fb3c6', '#7fd0e0', '#4da6ba', '#6fcade', '#46a4b8', '#5ec5d8', '#7cd2e4'],
      branchText: '#1d4e5c',
      cardBg: '#ffffff',
      cardBorder: '#bfe3ee',
      cardText: '#2c6273',
      thought: '#e8f8fc',
      thoughtBorder: '#5fc3d6',
      lineStroke: 7,
    },
  },
  {
    id: 'school',
    name: '알록달록 학용품',
    emoji: '✏️',
    decorations: ['✏️', '📌', '🖍️', '🌟'],
    palette: {
      background: 'linear-gradient(135deg, #fffdf5 0%, #fff0f3 50%, #f0f5ff 100%)',
      cloud: '#ffffff',
      accent: '#ff6b6b',
      central: '#fff7e6',
      centralBorder: '#ff8787',
      centralText: '#5c3a2e',
      branches: ['#ffd1d1', '#ffe8b3', '#c9f0d1', '#c2e3ff', '#e8d1ff', '#ffd6a8', '#b8f0e0', '#ffd0e6'],
      branchBorders: ['#ff8787', '#ffb84d', '#67c87f', '#5fa7e0', '#b06bd6', '#f59e3b', '#56c4a4', '#ef6fa6'],
      branchText: '#4a3528',
      cardBg: '#ffffff',
      cardBorder: '#f0e6da',
      cardText: '#4a4036',
      thought: '#fff0f3',
      thoughtBorder: '#ff8787',
      lineStroke: 7,
    },
  },
];

export function getTheme(themeId: string): MindmapTheme {
  return MINDMAP_THEMES.find((t) => t.id === themeId) ?? MINDMAP_THEMES[0];
}

/** 큰 가지에 순서대로 부여할 색상 키. */
export const BRANCH_COLOR_KEYS = [
  'branch1',
  'branch2',
  'branch3',
  'branch4',
  'branch5',
  'branch6',
  'branch7',
  'branch8',
] as const;

/**
 * 어린이 친화 아이콘 키. 값은 렌더러가 lucide-react 이름 또는 이모지로 해석.
 * 여기선 단순·안정적으로 이모지 기반 표현을 사용한다(폰트/이미지 자산 의존 없이
 * 기준 이미지처럼 번호 카드 옆 작은 아이콘이 항상 보이도록).
 */
export interface MindmapIconDef {
  key: string;
  label: string;
  emoji: string;
}

export const MINDMAP_ICONS: MindmapIconDef[] = [
  { key: 'idea', label: '아이디어', emoji: '💡' },
  { key: 'sun', label: '햇빛', emoji: '☀️' },
  { key: 'water', label: '물', emoji: '💧' },
  { key: 'air', label: '공기', emoji: '🌬️' },
  { key: 'soil', label: '흙', emoji: '🟤' },
  { key: 'seed', label: '씨앗', emoji: '🌱' },
  { key: 'sprout', label: '새싹', emoji: '🌿' },
  { key: 'leaf', label: '잎', emoji: '🍃' },
  { key: 'flower', label: '꽃', emoji: '🌸' },
  { key: 'fruit', label: '열매', emoji: '🍎' },
  { key: 'tree', label: '나무', emoji: '🌳' },
  { key: 'root', label: '뿌리', emoji: '🪵' },
  { key: 'star', label: '별', emoji: '⭐' },
  { key: 'heart', label: '마음', emoji: '❤️' },
  { key: 'book', label: '책', emoji: '📖' },
  { key: 'pencil', label: '연필', emoji: '✏️' },
  { key: 'question', label: '질문', emoji: '❓' },
  { key: 'search', label: '탐구', emoji: '🔍' },
  { key: 'lightbulb', label: '깨달음', emoji: '🔆' },
  { key: 'home', label: '우리 집', emoji: '🏠' },
  { key: 'friends', label: '친구', emoji: '👫' },
  { key: 'clock', label: '시간', emoji: '⏰' },
  { key: 'weather', label: '날씨', emoji: '🌤️' },
  { key: 'music', label: '음악', emoji: '🎵' },
  { key: 'art', label: '미술', emoji: '🎨' },
  { key: 'number', label: '수', emoji: '🔢' },
  { key: 'letter', label: '말', emoji: '🔤' },
  { key: 'map', label: '지도', emoji: '🗺️' },
  { key: 'globe', label: '지구', emoji: '🌍' },
  { key: 'animal', label: '동물', emoji: '🐰' },
  { key: 'bird', label: '새', emoji: '🐦' },
  { key: 'fish', label: '물고기', emoji: '🐟' },
  { key: 'rocket', label: '로켓', emoji: '🚀' },
  { key: 'cloud', label: '구름', emoji: '☁️' },
  { key: 'rain', label: '비', emoji: '🌧️' },
  { key: 'fire', label: '불', emoji: '🔥' },
  { key: 'snow', label: '눈', emoji: '❄️' },
  { key: 'magnet', label: '자석', emoji: '🧲' },
  { key: 'gear', label: '기계', emoji: '⚙️' },
  { key: 'thermometer', label: '온도', emoji: '🌡️' },
];

const ICON_MAP: Record<string, MindmapIconDef> = Object.fromEntries(
  MINDMAP_ICONS.map((i) => [i.key, i])
);

export function getIcon(key?: string): MindmapIconDef | null {
  if (!key) return null;
  return ICON_MAP[key] ?? null;
}

/** 기본 제한(초등학생이 너무 복잡해지지 않도록). */
export const MINDMAP_LIMITS = {
  maxMainBranches: 8,
  maxSubPerMain: 6,
  maxTotalNodes: 50,
  /** 중심 주제(depth 0)를 제외한 학생 가지의 최대 단계. */
  maxDepth: 5,
  maxTitleLength: 30,
  maxDescriptionLength: 200,
} as const;

/** 자동 배치 기준(좌·우 수평 트리). position 은 노드 중심점.
 *  단계별 크기: 중심(가장 큼) > 1차 main(중간) > 2차 sub(짧음) > 3~5차 detail. */
export const LAYOUT = {
  centralSize: { w: 250, h: 124 },
  mainSize: { w: 196, h: 70 }, // 1차: 중간 크기 핵심 주제 카드
  subSize: { w: 184, h: 64 }, // 2차: 짧은 세부 주제 카드(제목 위주)
  detailSize: { w: 300, h: 112 }, // 3차: 긴 가로형 설명 카드(제목 + 2~3줄 설명)
  thoughtSize: { w: 244, h: 96 },
  // 중심→1차 수평 거리
  mainDx: 300,
  // 1차→2차 수평 거리(바깥 방향)
  subDx: 250,
  // 2차 이후 상세 가지 사이의 수평 거리(바깥 방향). 넓은 카드 폭 고려.
  detailDx: 300,
  // 같은 부모 안 자식들 사이 세로 간격
  childGapY: 18,
  // 한쪽에 쌓이는 1차 가지들 사이 최소 세로 여백
  mainGapY: 26,
  // '나의 생각'을 중심 아래로 띄우는 거리
  thoughtDy: 250,
  thoughtGapX: 260,
};
