/**
 * 기존 저장 데이터 → FlipbookPage 모델 변환 계층(단일 변환 계층).
 *
 * 설계 원칙: 페이지 컴포넌트(Flip*Page)와 렌더러(FlipbookPageRenderer)는 원본 저장 데이터를
 * 직접 읽지 않고, 이 매퍼를 통해 변환된 FlipbookPage 만 소비한다.
 * 데이터 구조가 바뀌어도 이 파일 한 곳만 수정하면 된다.
 *
 * 입력 ViewerPageLike 는 StudentComicViewerPage 의 ViewerPage 유니온과 구조가 같다.
 * (ViewerPage 가 별도 export 되어 있지 않으므로, 호환 타입을 이 파일에 둔다.)
 */
import type {
  ComicProjectData,
  ComicCutEditData,
  ComicCutElement,
} from '../editor/utils/comicStorage'
import type { WorldStory, OXQuestion } from '../../services/studentUnitSummaryService'
import type { EditorState } from '../editor/types'
import {
  buildComicPageInfo,
  buildStoryPageInfo,
  buildQuizPageInfo,
  getProjectKeywords,
} from './landscapePageInfo'
import { normalizeOxAnswer } from './flipbookOxQuiz'
import type {
  FlipbookPage,
  FlipbookCoverPage,
  FlipbookComicPage,
  FlipbookStoryPage,
  FlipbookQuizPage,
  FlipbookBackCoverPage,
  ComicStage,
  StoryCategory,
} from './flipbookPageModel'

/** 뒤표지 저장 객체(StudentBackCoverPage 의 saveBackCoverData 가 저장하는 형태). */
export interface BackCoverData {
  projectId?: string
  subject?: string
  subjectName?: string
  grade?: string
  topicTitle?: string
  topicName?: string
  topicId?: string
  unitTitle?: string
  lessonTitle?: string
  unitName?: string
  updatedAt?: string
  authorName?: string
  gradeClassInfo?: string
  createdDate?: string
  bgColor?: string
  bgOpacity?: number
}

/** ComicProjectData.script.cuts 의 단일 컷 타입(대본 컷). */
type ScriptCut = ComicProjectData['script']['cuts'][number]

/** StudentComicViewerPage.ViewerPage 와 구조 호환되는 입력 타입. */
export type ViewerPageLike =
  | { type: 'front-cover'; data: EditorState | null }
  | { type: 'comic-cut'; cutNum: number; data: ComicCutEditData | null; scriptCut: ScriptCut | null }
  | { type: 'story-history'; data: WorldStory | null }
  | { type: 'story-current'; data: WorldStory | null }
  | { type: 'story-life'; data: WorldStory | null }
  | { type: 'ox-quiz'; questionNum: number; data: OXQuestion | null }
  | { type: 'back-cover'; data: BackCoverData | null }

/** 매퍼가 페이지 변환에 필요한 공통 컨텍스트. */
export interface FlipbookMapContext {
  project: ComicProjectData | null
  backCover: BackCoverData | null
  /** 표지/뒤표지 히어로 이미지 폴백(일반적으로 첫 만화 배경 이미지 URL). */
  firstComicImageUrl?: string
}

// --- 만화 단계 매핑(cutNumber 1~6 → 단계명 + 단계 설명) ---
const COMIC_STAGES: Array<{ stage: ComicStage; description: string }> = [
  { stage: '도입', description: '주제와 관련된 상황이나 궁금증을 보여 주는 장면이에요.' },
  { stage: '탐색', description: '문제를 살펴보고 단서를 찾아요.' },
  { stage: '핵심 이해', description: '이 단원의 중요한 개념을 이해해요.' },
  { stage: '생활 적용', description: '배운 내용을 생활 속 사례에 연결해요.' },
  { stage: '오해 바로잡기', description: '자주 틀리는 내용과 오해를 바로잡아요.' },
  { stage: '정리', description: '핵심 내용을 다시 정리하고 마무리해요.' },
]

// --- 스토리 분류 라벨/반성 질문(landscapePageInfo 프리셋과 동일 기준) ---
const STORY_PRESETS: Record<StoryCategory, { label: string; reflection: string }> = {
  history: { label: '역사이야기', reflection: '옛사람들은 이 생각이나 원리를 어떻게 활용했을까요?' },
  latest: { label: '최신이야기', reflection: '오늘날 이 개념은 어디에서 볼 수 있을까요?' },
  life: { label: '생활연결', reflection: '내 주변에서도 같은 원리를 찾을 수 있나요?' },
}

/**
 * 본문을 최대 max 개 문장으로 분할(스토리 핵심 사실 영역 1차 표시용).
 * 구형 엔진 호환을 위해 lookbehind 정규식은 사용하지 않는다. 분할 불가 시 빈 배열.
 */
function splitFacts(content: string, max = 3): string[] {
  if (!content) return []
  const parts =
    content
      .match(/[^.!?。]+[.!?。]?/g)
      ?.map((s) => s.trim())
      .filter(Boolean) ?? []
  return parts.slice(0, max)
}

function mapCover(data: EditorState | null, ctx: FlipbookMapContext): FlipbookCoverPage {
  const project = ctx.project
  const back = ctx.backCover
  const meta = data?.metadata
  return {
    type: 'cover',
    subject: meta?.subjectName || project?.subject || back?.subjectName || '',
    grade: meta?.grade || project?.grade || back?.grade || '',
    semester: project?.semester,
    unit:
      project?.subUnit ||
      project?.mainUnit ||
      back?.unitName ||
      meta?.unitTitle ||
      meta?.lessonTitle ||
      '',
    topic: project?.topicTitle || meta?.topicTitle || back?.topicTitle || back?.topicName || '',
    // learningGoal 은 현재 데이터에 없음 → 1차 미제공(2차: 커리큘럼 조회/프로젝트 저장)
    keywords: getProjectKeywords(project, 4),
    heroImageUrl: data?.background || project?.cover?.imageUrl || ctx.firstComicImageUrl || undefined,
    studentName: back?.authorName || '',
    className: back?.gradeClassInfo,
    createdAt: back?.createdDate,
  }
}

function mapComic(
  cutNum: number,
  cutData: ComicCutEditData | null,
  scriptCut: ScriptCut | null,
  ctx: FlipbookMapContext,
): FlipbookComicPage | null {
  // 데이터가 둘 다 없으면 페이지를 생략한다(기존 조건부 push 와 동일).
  if (!cutData && !scriptCut) return null
  const project = ctx.project
  const stageInfo = COMIC_STAGES[Math.max(0, Math.min(5, cutNum - 1))]
  // 기존 빌더에서 씬 제목/핵심 질문 프리셋 폴백을 재사용(project 가 있을 때만).
  const info = project ? buildComicPageInfo(project, cutNum) : null
  const dialogue = (scriptCut?.dialogues ?? [])
    .map((d: { character: string; text: string }) => ({ speaker: d.character, text: d.text }))
    .filter((d: { speaker?: string; text: string }) => Boolean(d.text))
  const elements: ComicCutElement[] | undefined =
    cutData?.elements && cutData.elements.length ? cutData.elements : undefined
  return {
    type: 'comic',
    cutNumber: cutNum,
    stage: stageInfo.stage,
    stageDescription: stageInfo.description,
    sceneTitle:
      scriptCut?.title || cutData?.backgroundInfo?.sceneTitle || info?.title || `${cutNum}컷`,
    sceneDescription: scriptCut?.sceneDescription || cutData?.backgroundInfo?.description || undefined,
    imageUrl: cutData?.backgroundImageUrl || undefined,
    dialogue: dialogue.length ? dialogue : undefined,
    keyPoint: scriptCut?.learningPoint || info?.keyQuestion || undefined,
    caption: cutData?.backgroundInfo?.description || undefined,
    elements,
  }
}

function mapStory(
  category: StoryCategory,
  data: WorldStory | null,
  ctx: FlipbookMapContext,
): FlipbookStoryPage | null {
  if (!data) return null
  const project = ctx.project
  const preset = STORY_PRESETS[category]
  const facts = splitFacts(data.content, 3)
  const info = project ? buildStoryPageInfo(project, category, data) : null
  return {
    type: 'story',
    category,
    categoryLabel: preset.label,
    title: data.title || preset.label,
    summary: facts[0] || undefined,
    // imageUrl 은 현재 데이터에 없음 → 1차 미제공(2차: AI 스토리 이미지)
    body: data.content || '',
    facts: facts.length ? facts : undefined,
    reflection: info?.keyQuestion || preset.reflection,
  }
}

function mapQuiz(
  questionNum: number,
  data: OXQuestion | null,
  ctx: FlipbookMapContext,
): FlipbookQuizPage | null {
  if (!data) return null
  const project = ctx.project
  const info = project ? buildQuizPageInfo(project, questionNum) : null
  return {
    type: 'quiz',
    quizNumber: questionNum,
    question: data.question || '',
    answer: normalizeOxAnswer(data.answer),
    // hint 는 현재 데이터에 없음 → 1차 미제공(2차). explanation 은 풀이 팁 프리셋 사용.
    explanation: info?.mission || undefined,
  }
}

function mapBackCover(data: BackCoverData | null, ctx: FlipbookMapContext): FlipbookBackCoverPage {
  const project = ctx.project
  const back = data
  return {
    type: 'back-cover',
    // 1차 자동 채움: 오늘의 핵심3 / 기억할 낱말3 은 coreConcepts 에서
    keyPoints: getProjectKeywords(project, 3),
    keywords: getProjectKeywords(project, 3),
    // pledge / teacherMessage / nextLearning 은 현재 데이터에 없음 → 1차 미제공(2~3차)
    studentName: back?.authorName || '',
    className: back?.gradeClassInfo,
    workTitle: project?.topicTitle || back?.topicTitle || back?.topicName || '',
    subject: back?.subjectName || project?.subject || '',
    unit: back?.unitName || project?.subUnit || project?.mainUnit || '',
    createdAt: back?.createdDate,
    heroImage: ctx.firstComicImageUrl || undefined,
  }
}

/** 단일 ViewerPage → FlipbookPage. 데이터 부족으로 생략되면 null. */
export function mapViewerPage(page: ViewerPageLike, ctx: FlipbookMapContext): FlipbookPage | null {
  switch (page.type) {
    case 'front-cover':
      return mapCover(page.data, ctx)
    case 'comic-cut':
      return mapComic(page.cutNum, page.data, page.scriptCut, ctx)
    case 'story-history':
      return mapStory('history', page.data, ctx)
    case 'story-current':
      return mapStory('latest', page.data, ctx)
    case 'story-life':
      return mapStory('life', page.data, ctx)
    case 'ox-quiz':
      return mapQuiz(page.questionNum, page.data, ctx)
    case 'back-cover':
      return mapBackCover(page.data, ctx)
    default:
      return null
  }
}

/**
 * 전체 페이지 배열 변환. null(데이터 부족)은 필터링한다.
 * 페이지 순서는 입력 배열 그대로 유지한다.
 * (요청 순서 역사→생활→최신 으로 바꾸려면 페이지 조립 단계에서 순서를 조정한다.)
 */
export function mapViewerPages(pages: ViewerPageLike[], ctx: FlipbookMapContext): FlipbookPage[] {
  return pages
    .map((p) => mapViewerPage(p, ctx))
    .filter((p): p is FlipbookPage => p !== null)
}
