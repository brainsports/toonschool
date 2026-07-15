/**
 * Stage 3 검증용 샘플 데이터(미리보기 전용 임시 데이터).
 * 운영 데이터가 아님. 실제 학생 작품은 localStorage(ComicProjectData/ComicCutEditData)에서
 * 로드되며, 이 파일은 미리보기(/flipbook/preview)의 결정적 렌더링 검증만을 위한다.
 * Stage 5(뷰어 통합) 이후 미리보기와 함께 제거한다.
 */
import type { ComicProjectData, ComicCutEditData, ComicCutElement } from '../components/editor/utils/comicStorage'
import type { ViewerPageLike, FlipbookMapContext } from '../components/viewer/flipbookPageMapper'
import sceneImg from '../../../assets/flipbook/sample-comic-scene.jpg'

type ScriptCut = ComicProjectData['script']['cuts'][number]

const svgChar = (fill: string, accent: string): string =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='260' viewBox='0 0 200 260'>` +
      `<ellipse cx='100' cy='240' rx='62' ry='18' fill='${accent}' opacity='.35'/>` +
      `<rect x='58' y='120' width='84' height='110' rx='32' fill='${fill}'/>` +
      `<circle cx='100' cy='86' r='56' fill='${fill}'/>` +
      `<circle cx='82' cy='82' r='9' fill='#fff'/><circle cx='118' cy='82' r='9' fill='#fff'/>` +
      `<circle cx='83' cy='84' r='4' fill='#2b2b3a'/><circle cx='119' cy='84' r='4' fill='#2b2b3a'/>` +
      `<path d='M80 104 Q100 122 120 104' stroke='#2b2b3a' stroke-width='4' fill='none' stroke-linecap='round'/>` +
      `<circle cx='68' cy='100' r='7' fill='${accent}' opacity='.55'/><circle cx='132' cy='100' r='7' fill='${accent}' opacity='.55'/>` +
      `</svg>`,
  )}`

const HANA = svgChar('#f6a4c2', '#ffd56a')
const DOYOON = svgChar('#4d94e8', '#dff4ff')
const SEOA = svgChar('#a38add', '#f6a4c2')

let eid = 0
// ComicCutElement 는 [key:string]:any 인덱스 시그니처를 가져 spread 추론이 약하므로,
// 필수 필드를 모두 채운 호출부에서 안전하게 단언한다(임시 샘플 데이터 전용).
const el = (e: Omit<ComicCutElement, 'id'>): ComicCutElement =>
  ({ id: `s${++eid}`, ...e }) as ComicCutElement

function char(imageUrl: string, x: number, y: number, w: number, h: number, opt: Partial<ComicCutElement> = {}): ComicCutElement {
  return el({ type: 'character', imageUrl, speaker: opt.speaker, x, y, width: w, height: h, rotation: opt.rotation, flipX: opt.flipX, zIndex: opt.zIndex ?? 1 })
}
function bubble(text: string, x: number, y: number, w: number, h: number, opt: Partial<ComicCutElement> = {}): ComicCutElement {
  return el({
    type: 'speechBubble',
    text,
    speaker: opt.speaker,
    bubbleType: opt.bubbleType ?? 'basic',
    x,
    y,
    width: w,
    height: h,
    rotation: opt.rotation,
    style: opt.style,
    zIndex: opt.zIndex ?? 5,
  })
}

export const sampleProject: ComicProjectData = {
  projectId: 'sample-stage3',
  grade: '5학년',
  semester: '1학기',
  subject: '사회',
  mainUnit: '1. 우리나라의 자연 환경',
  subUnit: '2. 산지와 하천',
  topicTitle: '강줄기가 만드는 우리나라 땅 모양',
  selectedStoryDescription: '강줄기가 구불구불 흐르며 만드는 땅 모양을 탐험해요.',
  coreConcepts: ['강줄기', '산지', '하천', '평야'],
  script: { version: 2, updatedAt: '', cuts: [] },
  characterReferences: { version: 'v2', hana: [HANA], doyoon: [DOYOON], seoa: [SEOA] },
}

export const sampleCtx: FlipbookMapContext = {
  project: sampleProject,
  backCover: {
    authorName: '김도현',
    gradeClassInfo: '5학년 2반',
    subjectName: '사회',
    unitName: '산지와 하천',
    topicTitle: '강줄기가 만드는 우리나라 땅 모양',
    createdDate: '2026.07.15',
  },
}

const sceneTitle = '강줄기가 만드는 모양'

const cuts: Array<{ script: ScriptCut; edit: ComicCutEditData }> = [
  {
    // 1컷 도입 — 짧은 대사 2개
    script: {
      cutNumber: 1,
      title: '강을 따라가 볼까?',
      sceneDescription: '하나와 도윤이가 넓은 강가에서 강줄기를 따라가며 이야기를 시작해요.',
      learningPoint: '강줄기는 구불구불 흐르며 땅 모양을 바꿔요.',
      dialogues: [
        { character: '도윤', text: '이게 왜 이렇게 구불구불한 걸까?' },
        { character: '하나', text: '함께 단서를 찾아보자!' },
      ],
    },
    edit: {
      cutNumber: 1,
      backgroundImageUrl: sceneImg,
      backgroundInfo: { sceneTitle, description: '넓은 강가에서 시작하는 장면' },
      elements: [
        char(HANA, 360, 600, 250, 330, { speaker: '하나' }),
        char(DOYOON, 820, 600, 250, 330, { speaker: '도윤' }),
        bubble('이게 왜 이렇게 구불구불한 걸까?', 250, 230, 360, 170, { speaker: '도윤' }),
        bubble('함께 단서를 찾아보자!', 820, 200, 360, 170, { speaker: '하나' }),
      ],
      updatedAt: '',
    },
  },
  {
    // 2컷 탐색 — 매우 긴 대사 1개
    script: {
      cutNumber: 2,
      title: '단서를 찾아요',
      sceneDescription: '강이 굽이치는 모습을 자세히 관찰하며 숨은 단서를 찾아요.',
      learningPoint: '강이 굽이칠 때 바깥쪽과 안쪽의 차이를 보면 단서가 보여요.',
      dialogues: [
        { character: '도윤', text: '강이 굽이치는 부분의 바깥쪽은 흙이 무너져 내리고, 안쪽에는 모래와 자갈이 쌓이는 것 같아!' },
      ],
    },
    edit: {
      cutNumber: 2,
      backgroundImageUrl: sceneImg,
      backgroundInfo: { sceneTitle, description: '강의 굽이치는 모습 관찰' },
      elements: [
        char(DOYOON, 540, 600, 260, 340, { speaker: '도윤' }),
        bubble('강이 굽이치는 부분의 바깥쪽은 흙이 무너져 내리고, 안쪽에는 모래와 자갈이 쌓이는 것 같아!', 120, 180, 540, 220, { speaker: '도윤' }),
      ],
      updatedAt: '',
    },
  },
  {
    // 3컷 핵심 이해 — 대사 4개 + shape/text
    script: {
      cutNumber: 3,
      title: '규칙을 발견했어요',
      sceneDescription: '관찰 결과로 강줄기가 땅을 깎고 쌓는 규칙을 이해해요.',
      learningPoint: '강은 바깥쪽을 깎아 산지를 만들고 안쪽에 자갈을 쌓아 평야를 만들어요.',
      dialogues: [
        { character: '도윤', text: '아, 바깥쪽은 깎이고!' },
        { character: '하나', text: '안쪽은 쌓이고!' },
        { character: '서아', text: '그래서 산지와 평야가 생기는구나.' },
        { character: '도윤', text: '강줄기가 땅 모양을 바꿔요.' },
      ],
    },
    edit: {
      cutNumber: 3,
      backgroundImageUrl: sceneImg,
      backgroundInfo: { sceneTitle, description: '강줄기의 규칙 발견' },
      elements: [
        char(DOYOON, 250, 610, 230, 320, { speaker: '도윤' }),
        char(HANA, 620, 610, 230, 320, { speaker: '하나' }),
        char(SEOA, 970, 610, 230, 320, { speaker: '서아' }),
        el({ type: 'shape', x: 200, y: 150, width: 1000, height: 60, style: { backgroundColor: 'rgba(121,191,85,0.35)', borderColor: 'rgba(121,191,85,0.6)' }, zIndex: 2 }),
        bubble('바깥쪽은 깎이고, 안쪽은 쌓여요!', 380, 200, 640, 150, { speaker: '서아' }),
      ],
      updatedAt: '',
    },
  },
  {
    // 4컷 생활 적용 — 캐릭터 3명
    script: {
      cutNumber: 4,
      title: '우리 동네에도 있어요',
      sceneDescription: '배운 원리를 우리 동네 하천에도 적용해 보아요.',
      learningPoint: '우리 동네 하천에서도 강줄기가 만든 모양을 찾을 수 있어요.',
      dialogues: [
        { character: '하나', text: '우리 동네 냇가에도 모래사장이 있어!' },
        { character: '서아', text: '그게 바로 안쪽에 쌓인 거구나.' },
      ],
    },
    edit: {
      cutNumber: 4,
      backgroundImageUrl: sceneImg,
      backgroundInfo: { sceneTitle, description: '생활 속 하천 적용' },
      elements: [
        char(HANA, 300, 600, 240, 330, { speaker: '하나' }),
        char(DOYOON, 640, 600, 240, 330, { speaker: '도윤' }),
        char(SEOA, 980, 600, 240, 330, { speaker: '서아' }),
        bubble('우리 동네 냇가에도 모래사장이 있어!', 220, 200, 460, 170, { speaker: '하나' }),
        bubble('그게 바로 안쪽에 쌓인 거구나.', 800, 180, 420, 160, { speaker: '서아' }),
      ],
      updatedAt: '',
    },
  },
  {
    // 5컷 오해 바로잡기 — 회전 + 핵심체크 누락(learningPoint 없음 → 폴백)
    script: {
      cutNumber: 5,
      title: '잠깐, 다시 생각해요',
      sceneDescription: '강이 곧게 흐를수록 산지를 깎는다는 오해를 바로잡아요.',
      dialogues: [
        { character: '도윤', text: '강이 곧게 흐를수록 땅을 깎는다고 했는데, 정말일까?' },
        { character: '하나', text: '아니야! 굽이칠 때 바깥쪽을 깎아요.' },
      ],
    },
    edit: {
      cutNumber: 5,
      backgroundImageUrl: sceneImg,
      backgroundInfo: { sceneTitle, description: '오해 바로잡기' },
      elements: [
        char(DOYOON, 420, 620, 240, 320, { speaker: '도윤', rotation: -6 }),
        char(HANA, 820, 610, 240, 330, { speaker: '하나', flipX: true }),
        bubble('강이 곧게 흐를수록 땅을 깎는다고 했는데, 정말일까?', 200, 200, 520, 190, { speaker: '도윤' }),
        bubble('아니야! 굽이칠 때 바깥쪽을 깎아요.', 820, 180, 420, 180, { speaker: '하나', bubbleType: 'emphasis' }),
      ],
      updatedAt: '',
    },
  },
  {
    // 6컷 정리 — 반전 + 짧은 대사
    script: {
      cutNumber: 6,
      title: '오늘 배운 핵심',
      sceneDescription: '강줄기가 만드는 땅 모양의 핵심을 정리해요.',
      learningPoint: '강줄기는 굽이치며 바깥쪽을 깎고 안쪽에 쌓아 산지와 평야를 만들어요.',
      dialogues: [{ character: '도윤', text: '강줄기 덕분에 우리나라 땅 모양이 만들어지는구나!' }],
    },
    edit: {
      cutNumber: 6,
      backgroundImageUrl: sceneImg,
      backgroundInfo: { sceneTitle, description: '핵심 정리' },
      elements: [
        char(DOYOON, 360, 600, 250, 330, { speaker: '도윤', flipX: true }),
        char(HANA, 820, 600, 250, 330, { speaker: '하나' }),
        bubble('강줄기 덕분에 우리나라 땅 모양이 만들어지는구나!', 360, 190, 680, 180, { speaker: '도윤', bubbleType: 'thought' }),
      ],
      updatedAt: '',
    },
  },
]

/** 미리보기용 페이지 배열(표지 + 만화 1~6컷). */
export function buildSampleViewerPages(): ViewerPageLike[] {
  const pages: ViewerPageLike[] = [{ type: 'front-cover', data: null }]
  for (const c of cuts) {
    pages.push({ type: 'comic-cut', cutNum: c.script.cutNumber, data: c.edit, scriptCut: c.script })
  }
  return pages
}
