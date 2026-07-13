import type { ComicProjectData } from '../editor/utils/comicStorage'
import type { WorldStory } from '../../services/studentUnitSummaryService'
import type { LandscapePageInfo } from './LandscapePageLayout'

const comicDefaults = [
  ['이야기의 시작', '궁금한 장면', '이 장면에서 무엇이 이상하거나 궁금한가요?', '처음 보고 든 궁금증을 떠올려 보세요.'],
  ['단서를 찾아요', '자세히 살펴봐요', '반복되거나 달라지는 부분이 있나요?', '앞뒤의 차이점을 찾아보세요.'],
  ['규칙을 짐작해요', '숨은 규칙 찾기', '어떤 규칙이나 원리가 숨어 있을까요?', '자신의 생각을 한 문장으로 말해 보세요.'],
  ['다른 곳에 적용해요', '생각을 연결해요', '이 원리를 다른 상황에도 적용할 수 있나요?', '같은 원리를 사용할 수 있는 예를 떠올려 보세요.'],
  ['헷갈린 생각을 바로잡아요', '다시 생각해요', '어떤 부분을 잘못 생각했을까요?', '틀린 이유를 찾아 바르게 설명해 보세요.'],
  ['배운 내용을 정리해요', '이야기를 마무리해요', '오늘 배운 핵심은 무엇인가요?', '배운 내용을 친구에게 설명하듯 말해 보세요.'],
] as const

const quizDefaults = [
  ['기본 개념을 확인해요', '첫 번째 확인', '문제에서 묻는 핵심이 무엇인가요?', '문제의 조건을 먼저 천천히 읽어 보세요.'],
  ['이유를 생각해요', '한 번 더 생각해요', '왜 그런 답이 되는지 설명할 수 있나요?', '답만 고르지 말고 이유도 함께 생각하세요.'],
  ['생활에 적용해요', '생활 속 문제', '그림이나 상황 속 핵심 원리는 무엇인가요?', '반복되거나 달라지는 부분을 먼저 찾아보세요.'],
  ['헷갈린 부분을 확인해요', '다시 확인해요', '어떤 조건을 놓치기 쉬운가요?', '보기와 조건을 끝까지 읽고 전체를 살펴보세요.'],
  ['배운 내용을 마무리해요', '마지막 도전', '배운 개념을 스스로 설명하고 적용할 수 있나요?', '앞에서 배운 내용을 순서대로 떠올려 보세요.'],
] as const

export function getProjectKeywords(project: ComicProjectData | null, limit = 4) {
  return (project?.coreConcepts ?? []).filter(Boolean).slice(0, limit)
}

export function buildComicPageInfo(project: ComicProjectData, cutNum: number): LandscapePageInfo {
  const scriptCut = project.script?.cuts?.find((cut) => cut.cutNumber === cutNum)
  const preset = comicDefaults[Math.max(0, Math.min(5, cutNum - 1))]
  return {
    pageType: `만화컷 ${cutNum}`,
    stageLabel: preset[0],
    title: scriptCut?.title || preset[1],
    description: scriptCut?.sceneDescription || project.selectedStoryDescription || undefined,
    keyQuestion: scriptCut?.learningPoint || preset[2],
    keywords: getProjectKeywords(project),
    missionLabel: '생각 미션',
    mission: preset[3],
  }
}

export function buildStoryPageInfo(project: ComicProjectData, storyType: WorldStory['type'], story: WorldStory): LandscapePageInfo {
  const presets = {
    history: ['역사이야기', '과거와 연결해요', '옛사람들은 이 생각이나 원리를 어떻게 활용했을까요?', '어느 시대에 어떤 목적으로 사용했는지 살펴보세요.', '읽기 포인트'],
    latest: ['최신이야기', '오늘날과 연결해요', '오늘날 이 개념은 어디에서 볼 수 있을까요?', '비슷한 사례를 생활 속에서 떠올려 보세요.', '생각 미션'],
    life: ['생활연결', '내 생활과 연결해요', '내 주변에서도 같은 원리를 찾을 수 있나요?', '집이나 학교에서 비슷한 사례를 하나 찾아보세요.', '활동 미션'],
  } as const
  const preset = presets[storyType]
  return {
    pageType: preset[0],
    stageLabel: preset[1],
    title: story.title || preset[0],
    description: project.selectedStoryDescription || undefined,
    keyQuestion: preset[2],
    keywords: getProjectKeywords(project),
    missionLabel: preset[4],
    mission: preset[3],
  }
}

export function buildQuizPageInfo(project: ComicProjectData, questionNum: number): LandscapePageInfo {
  const preset = quizDefaults[Math.max(0, Math.min(4, questionNum - 1))]
  return {
    pageType: `퀴즈 ${questionNum}`,
    stageLabel: preset[0],
    title: preset[1],
    description: '오늘 배운 내용을 차근차근 확인하는 문제예요.',
    keyQuestion: preset[2],
    keywords: getProjectKeywords(project, 3),
    missionLabel: '풀이 팁',
    mission: preset[3],
  }
}
