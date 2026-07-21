import { TEXT_GENERATION_MODEL } from '../../../config/models'
import { geminiClient } from '../../../shared/lib/gemini'
import { supabase } from '../../../shared/lib/supabase'
import type { TopicRecommendation, TopicGenerationRequest, KeywordItem, CurriculumContext, StoryType } from '../types/studentTopic'

function normalizeText(text: string) {
  return text.replace(/[\s\d.,!?~"'“”‘’()[\]{}:;·…]/g, '').toLowerCase()
}


type DynamicPerspective = {
  name: string
  storyType: StoryType
  storyTypeLabel: string
  scene: string
  device: string
  fitWords: string[]
}

type TopicDiversityLog = {
  generatedCount: number
  removedDuplicateCount: number
  usedPerspectives: string[]
  keywordDistribution: Record<string, number>
  fallbackCount: number
}

const DYNAMIC_PERSPECTIVE_POOL: DynamicPerspective[] = [
  { name: '생활 속 발견', storyType: 'everyday_problem', storyTypeLabel: '생활 속 발견', scene: '집과 학교 사이', device: '작은 발견', fitWords: ['생활', '관찰', '우리'] },
  { name: '학교에서 생긴 사건', storyType: 'school_incident', storyTypeLabel: '학교 사건', scene: '교실', device: '갑작스러운 사건', fitWords: ['학교', '친구', '교실'] },
  { name: '친구와의 토론', storyType: 'decision', storyTypeLabel: '토론', scene: '모둠 활동 시간', device: '찬반 토론', fitWords: ['비교', '생각', '의견'] },
  { name: '엉뚱한 상상', storyType: 'twist', storyTypeLabel: '상상', scene: '상상 속 하루', device: '뒤바뀐 규칙', fitWords: ['만약', '상상', '변화'] },
  { name: '만약 사라진다면', storyType: 'twist', storyTypeLabel: '만약 이야기', scene: '갑자기 바뀐 세상', device: '사라진 조건', fitWords: ['없다면', '사라진', '문제'] },
  { name: '미래 발명', storyType: 'invention', storyTypeLabel: '미래 발명', scene: '미래 발명실', device: '새 발명품', fitWords: ['발명', '로봇', '미래'] },
  { name: '문제 해결 작전', storyType: 'challenge', storyTypeLabel: '해결 작전', scene: '작전 회의실', device: '팀 미션', fitWords: ['해결', '문제', '방법'] },
  { name: '과학 탐정', storyType: 'mystery', storyTypeLabel: '과학 탐정', scene: '탐정단이 된 교실', device: '단서 추적', fitWords: ['실험', '관찰', '원인'] },
  { name: '비밀 실험', storyType: 'mistake_discovery', storyTypeLabel: '실험 이야기', scene: '방과 후 실험대', device: '몰래 시작한 실험', fitWords: ['실험', '확인', '관찰'] },
  { name: '시간 여행', storyType: 'role_play', storyTypeLabel: '시간 여행', scene: '과거와 미래', device: '시대 비교', fitWords: ['역사', '변화', '옛날'] },
  { name: '우주 탐험', storyType: 'challenge', storyTypeLabel: '우주 탐험', scene: '우주 정거장', device: '우주 미션', fitWords: ['우주', '로봇', '에너지'] },
  { name: '바닷속 탐험', storyType: 'challenge', storyTypeLabel: '바닷속 탐험', scene: '바닷속 기지', device: '깊은 곳 조사', fitWords: ['바다', '물', '환경'] },
  { name: '숲속 모험', storyType: 'challenge', storyTypeLabel: '숲속 모험', scene: '숲길', device: '자연 관찰', fitWords: ['식물', '동물', '자연'] },
  { name: '박물관에서 만난 단서', storyType: 'mystery', storyTypeLabel: '단서 찾기', scene: '박물관 전시실', device: '전시물 단서', fitWords: ['역사', '발견', '비교'] },
  { name: '역사 속 인물과의 만남', storyType: 'role_play', storyTypeLabel: '역사 만남', scene: '역사 속 장면', device: '인물 인터뷰', fitWords: ['역사', '인물', '옛날'] },
  { name: '직업 체험', storyType: 'role_play', storyTypeLabel: '직업 체험', scene: '하루 체험 현장', device: '역할 바꾸기', fitWords: ['직업', '생활', '사회'] },
  { name: '뉴스 기자 취재', storyType: 'role_play', storyTypeLabel: '뉴스 취재', scene: '학교 방송국', device: '현장 취재', fitWords: ['조사', '사건', '사회'] },
  { name: '발명 대회', storyType: 'invention', storyTypeLabel: '발명 대회', scene: '발명 대회장', device: '작품 발표', fitWords: ['발명', '아이디어', '로봇'] },
  { name: '구조 작전', storyType: 'challenge', storyTypeLabel: '구조 작전', scene: '위험한 현장', device: '도움 요청', fitWords: ['안전', '위험', '해결'] },
  { name: '환경 지키기', storyType: 'everyday_problem', storyTypeLabel: '환경 지키기', scene: '우리 동네', device: '환경 문제', fitWords: ['환경', '물', '에너지'] },
  { name: '가족과 함께 찾은 답', storyType: 'everyday_problem', storyTypeLabel: '가족 이야기', scene: '집', device: '가족 대화', fitWords: ['생활', '가족', '일상'] },
  { name: '마을 문제 해결', storyType: 'everyday_problem', storyTypeLabel: '마을 해결', scene: '우리 마을', device: '마을 회의', fitWords: ['동네', '생활', '사회'] },
  { name: '운동장 사건', storyType: 'school_incident', storyTypeLabel: '운동장 사건', scene: '운동장', device: '놀이 중 발견', fitWords: ['학교', '규칙', '비교'] },
  { name: '급식실 사건', storyType: 'school_incident', storyTypeLabel: '급식실 사건', scene: '급식실', device: '점심시간 문제', fitWords: ['생활', '물', '나눗셈'] },
  { name: '교실 속 작은 변화', storyType: 'school_incident', storyTypeLabel: '교실 변화', scene: '교실', device: '작은 변화 관찰', fitWords: ['관찰', '변화', '학교'] },
  { name: '도서관에서 찾은 단서', storyType: 'mystery', storyTypeLabel: '도서관 단서', scene: '도서관', device: '책 속 힌트', fitWords: ['조사', '발견', '설명'] },
  { name: '로봇과 협력하기', storyType: 'invention', storyTypeLabel: '로봇 협력', scene: '로봇 실습실', device: '로봇 파트너', fitWords: ['로봇', '발명', '에너지'] },
  { name: '동물의 시선', storyType: 'role_play', storyTypeLabel: '다른 시선', scene: '동물들이 보는 세상', device: '시점 바꾸기', fitWords: ['동물', '관찰', '자연'] },
  { name: '자연의 시선', storyType: 'role_play', storyTypeLabel: '자연의 시선', scene: '숲과 강', device: '자연이 말하기', fitWords: ['식물', '물', '환경'] },
  { name: '물건이 말을 한다면', storyType: 'twist', storyTypeLabel: '물건 의인화', scene: '책상 위', device: '말하는 물건', fitWords: ['생활', '도구', '발명'] },
  { name: '하루 동안 바뀐 세상', storyType: 'twist', storyTypeLabel: '바뀐 하루', scene: '뒤바뀐 하루', device: '규칙 변화', fitWords: ['변화', '없다면', '생활'] },
  { name: '선택의 결과 비교', storyType: 'decision', storyTypeLabel: '선택 비교', scene: '두 갈래 선택', device: '결과 비교', fitWords: ['비교', '결과', '나눗셈'] },
  { name: '오해 바로잡기', storyType: 'mistake_discovery', storyTypeLabel: '오해 해결', scene: '친구 사이', device: '잘못된 생각 고치기', fitWords: ['오해', '정말', '확인'] },
  { name: '찬반 토론', storyType: 'decision', storyTypeLabel: '찬반 토론', scene: '토론 발표장', device: '근거 찾기', fitWords: ['비교', '의견', '토론'] },
  { name: '미션 수행', storyType: 'challenge', storyTypeLabel: '미션', scene: '미션 카드 앞', device: '단계별 과제', fitWords: ['미션', '실험', '해결'] },
  { name: '게임 속 세계', storyType: 'challenge', storyTypeLabel: '게임 세계', scene: '게임 맵', device: '레벨 통과', fitWords: ['규칙', '분수', '나눗셈'] },
  { name: '지도 만들기', storyType: 'mistake_discovery', storyTypeLabel: '지도 만들기', scene: '탐사 지도 앞', device: '관계 그리기', fitWords: ['위치', '동네', '분수'] },
  { name: '규칙 찾기', storyType: 'mistake_discovery', storyTypeLabel: '규칙 찾기', scene: '규칙판 앞', device: '패턴 발견', fitWords: ['규칙', '수학', '비교'] },
  { name: '비교 관찰', storyType: 'mistake_discovery', storyTypeLabel: '비교 관찰', scene: '관찰 기록장', device: '차이 찾기', fitWords: ['비교', '관찰', '식물'] },
  { name: '원인과 결과 추적', storyType: 'mystery', storyTypeLabel: '원인 추적', scene: '사건 기록판', device: '원인 찾기', fitWords: ['왜', '원인', '결과'] },
  { name: '나만의 설명서 만들기', storyType: 'invention', storyTypeLabel: '설명서', scene: '설명서 제작실', device: '사용법 만들기', fitWords: ['방법', '설명', '발명'] },
  { name: '친구에게 알려주기', storyType: 'everyday_problem', storyTypeLabel: '친구 설명', scene: '쉬는 시간', device: '친구 돕기', fitWords: ['설명', '친구', '생활'] },
  { name: '위험을 막는 방법', storyType: 'challenge', storyTypeLabel: '위험 막기', scene: '위험 알림판', device: '예방 작전', fitWords: ['안전', '문제', '해결'] },
  { name: '이상한 초대장', storyType: 'mystery', storyTypeLabel: '초대장 사건', scene: '초대장을 받은 교실', device: '수상한 초대', fitWords: ['단서', '사건', '비밀'] },
  { name: '사라진 물건 찾기', storyType: 'mystery', storyTypeLabel: '물건 찾기', scene: '어질러진 교실', device: '추리 단서', fitWords: ['사라진', '찾기', '관찰'] },
  { name: '비밀 연구소', storyType: 'invention', storyTypeLabel: '연구소', scene: '작은 연구소', device: '연구 기록', fitWords: ['실험', '발명', '로봇'] },
  { name: '미래 도시', storyType: 'invention', storyTypeLabel: '미래 도시', scene: '미래 도시', device: '새 기술 적용', fitWords: ['미래', '에너지', '로봇'] },
  { name: '우리 동네 탐사', storyType: 'everyday_problem', storyTypeLabel: '동네 탐사', scene: '우리 동네', device: '현장 조사', fitWords: ['동네', '생활', '조사'] },
  { name: '작은 영웅', storyType: 'challenge', storyTypeLabel: '작은 영웅', scene: '도움이 필요한 순간', device: '용기 내기', fitWords: ['해결', '도움', '생활'] },
  { name: '실패한 실험에서 배우기', storyType: 'mistake_discovery', storyTypeLabel: '실패에서 배우기', scene: '실험 실패 현장', device: '실패 원인 찾기', fitWords: ['실험', '왜', '확인'] }
]

const FALLBACK_TITLE_TEMPLATES = [
  '{scene}에서 사라진 물건', '{scene}에서 발견한 작은 규칙', '{scene}에 남겨진 이상한 쪽지', '{scene}에서 엇갈린 두 친구', '{scene}에 나타난 수상한 흔적',
  '{scene}에서 시작된 모둠 작전', '{scene}에 도착한 미스터리 초대장', '{scene}에서 뒤바뀐 두 가방', '{scene}의 뜻밖의 실수', '{scene}에서 모인 작은 영웅들',
  '{scene}에서 울린 타임 종', '{scene}에 숨겨진 보물', '{scene}에서 말을 걸어온 도구', '{scene}의 사라진 한 자루', '{scene}에서 겪은 엉뚱한 오해',
  '{scene}에서 열린 긴급 회의', '{scene}의 수상한 낙서', '{scene}에서 발견한 낡은 지도', '{scene}에 떨어진 정체불명 물건', '{scene}에서 만난 새 친구'
]

const FALLBACK_STORY_HINT_TEMPLATES = [
  '{scene}에서 평범한 하루가 흐르는데, 갑자기 {device}가 시작된다. 주인공은 무슨 일이 일어났는지 살핀다.',
  '{scene}에 이상한 흔적이 나타난다. 아이들은 {device}로 원인을 하나씩 좁혀 간다.',
  '{scene}에서 친구끼리 의견이 갈린다. 주인공은 {device}로 먼저 할 일을 정한다.',
  '{scene}에 알 수 없는 메시지가 도착한다. 아이들은 {device}로 다음 단계를 찾는다.',
  '{scene}에서 작은 실수가 커진다. 주인공은 {device}로 상황을 다시 잡는다.',
  '{scene}의 물건이 제자리에 없다. 아이들은 {device}로 어디로 갔는지 살핀다.',
  '{scene}에서 누군가 먼저 움직였다. 주인공은 {device}로 진짜 이유를 찾는다.',
  '{scene}에 낯선 물건이 하나 나타난다. 아이들은 {device}로 어떻게 할지 고른다.',
  '{scene}에서 익숙한 규칙이 바뀐다. 주인공은 {device}로 새 방법을 시도한다.',
  '{scene}에 숨겨진 보물의 흔적이 보인다. 아이들은 {device}로 풀어 본다.'
]

const FALLBACK_OPENING_LINE_TEMPLATES = [
  '"큰일이야, 이거 어디 갔지?"', '"잠깐, 이거 이상한데?"', '"아까 분명히 여기 있었어!"',
  '"우리 지나치면 안 될 것 같아."', '"내 생각은 좀 달라."', '"직접 확인해 보자."',
  '"선생님, 이거 좀 이상해요!"', '"우리만의 방법으로 해볼래?"', '"아까 본 게 힌트였어."',
  '"먼저 장소를 나눠서 찾자."', '"왜 내 답이랑 다르지?"', '"이걸 빼면 달라져."',
  '"이건 사건이야."', '"누가 이렇게 했을까?"', '"우리도 겪은 일이야."',
  '"다시 보면 답이 보일까?"', '"이유부터 찾아보자."', '"반대로 생각해 볼까?"',
  '"친구에게 어떻게 말하지?"', '"이건 힌트일지도 몰라."', '"기준을 직접 정해 보자."',
  '"먼저 할 일을 고르자."', '"다른 팀은 왜 달랐을까?"', '"작은 연구소를 열어볼까?"'
]

const getSeededValue = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash
}

const seededShuffle = <T,>(items: T[], seed: string) => {
  const result = [...items]
  let value = getSeededValue(seed) || 1
  for (let i = result.length - 1; i > 0; i--) {
    value = (value * 1664525 + 1013904223) >>> 0
    const j = value % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const normalizeTopicTitle = (title: string) => {
  return (title || '')
    .replace(/\s*\((?:\d+|버전\s*\d+|두 번째|세 번째)\)\s*$/g, '')
    .replace(/\s*(?:버전|두 번째|세 번째|두번째|세번째|[0-9]+탄)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const getTitleStructure = (title: string) => {
  return normalizeTopicTitle(title).replace(/[가-힣A-Za-z0-9]+/g, '□')
}

const normalizeKoreanText = (text: string) => normalizeText(text).replace(/(입니다|합니다|해요|된다|한다|있다|없다|찾는다|본다|된다)$/g, '')

const getTextSimilarity = (a: string, b: string) => {
  const normA = normalizeKoreanText(a)
  const normB = normalizeKoreanText(b)
  if (!normA || !normB) return 0
  const short = normA.length < normB.length ? normA : normB
  const long = normA.length < normB.length ? normB : normA
  if (long.includes(short) && short.length >= 8) return 1
  const tokensA = new Set(normA.match(/[가-힣A-Za-z0-9]{2,}/g) || [])
  const tokensB = new Set(normB.match(/[가-힣A-Za-z0-9]{2,}/g) || [])
  if (tokensA.size === 0 || tokensB.size === 0) return 0
  const overlap = [...tokensA].filter(token => tokensB.has(token)).length
  return overlap / Math.min(tokensA.size, tokensB.size)
}

const WEAK_STORY_PHRASES = ['사건이 시작된다', '새로운 생각을 찾아본다', '다른 생각을 발견한다', '궁금증을 해결한다', '친구들과 알아본다', '작은 사건이 시작된다', '서로 다른 생각을 맞춰 간다']

const isWeakStoryHint = (topic: TopicRecommendation) => {
  const combined = [topic.storyHint, topic.learningPoint, topic.openingLine, topic.incident, topic.problem].join(' ')
  const weakHitCount = WEAK_STORY_PHRASES.filter(phrase => combined.includes(phrase)).length
  return weakHitCount > 0 || normalizeKoreanText(topic.storyHint || topic.summary || '').length < 24 || normalizeKoreanText(topic.openingLine || '').length < 8
}

const getTopicCoreKey = (topic: TopicRecommendation) => {
  return [topic.setting, topic.incident, topic.problem, topic.resolutionDirection]
    .map(value => normalizeKoreanText(value || '').slice(0, 12))
    .join('|')
}

const getKeywordDistribution = (topics: TopicRecommendation[], keywords: string[]) => {
  return keywords.reduce<Record<string, number>>((acc, keyword) => {
    acc[keyword] = topics.filter(topic => [topic.title, topic.summary, topic.storyHint, topic.learningConnection, ...(topic.keywords || [])].join(' ').includes(keyword)).length
    return acc
  }, {})
}

const selectDiversePerspectives = (request: TopicGenerationRequest, count: number, usedPerspectiveNames: string[] = []) => {
  const keywords = request.selectedKeywords || []
  const questionText = request.selectedQuestion?.questionText || ''
  const contextText = [request.gradeName, request.subjectName, request.majorUnitName, request.middleUnitName, questionText, ...keywords].join(' ')
  const seed = `${contextText}-${Date.now()}-${usedPerspectiveNames.join('|')}`

  const scored = DYNAMIC_PERSPECTIVE_POOL
    .filter(perspective => !usedPerspectiveNames.includes(perspective.name))
    .map(perspective => {
      const keywordScore = perspective.fitWords.filter(word => contextText.includes(word)).length * 4
      const subjectScore = perspective.fitWords.some(word => request.subjectName.includes(word) || request.middleUnitName.includes(word)) ? 3 : 0
      const questionScore = perspective.fitWords.some(word => questionText.includes(word)) ? 3 : 0
      return { perspective, score: keywordScore + subjectScore + questionScore }
    })

  return seededShuffle(scored, seed)
    .sort((a, b) => b.score - a.score)
    .map(item => item.perspective)
    .slice(0, count)
}

const isSimilarTopic = (a: TopicRecommendation, b: TopicRecommendation) => {
  const titleA = normalizeText(normalizeTopicTitle(a.title || ''))
  const titleB = normalizeText(normalizeTopicTitle(b.title || ''))
  if (titleA && titleA === titleB) return true
  if (getTitleStructure(a.title || '') === getTitleStructure(b.title || '')) return true
  if (getTextSimilarity(a.storyHint || a.summary || '', b.storyHint || b.summary || '') >= 0.55) return true
  if (getTextSimilarity(a.learningPoint || a.learningConnection || '', b.learningPoint || b.learningConnection || '') >= 0.7) return true
  if (getTextSimilarity(a.openingLine || '', b.openingLine || '') >= 0.65) return true
  if (getTopicCoreKey(a) === getTopicCoreKey(b)) return true
  const aMainKeyword = a.keywords?.[0]
  const bMainKeyword = b.keywords?.[0]
  return Boolean(aMainKeyword && bMainKeyword && aMainKeyword === bMainKeyword && (a.setting === b.setting || a.incident === b.incident))
}

const repairWeakTopicRecommendation = (
  rawTopic: any,
  request: TopicGenerationRequest,
  perspective: DynamicPerspective,
  index: number
): TopicRecommendation => {
  const keywords = request.selectedKeywords?.length ? request.selectedKeywords : [request.middleUnitName || '주제']
  const setting = rawTopic.setting || perspective.scene
  const questionText = request.selectedQuestion?.questionText || rawTopic.question || rawTopic.connectionReason || `${setting}에서 어떤 일이 시작될까요?`
  const title = normalizeTopicTitle(rawTopic.title || FALLBACK_TITLE_TEMPLATES[index % FALLBACK_TITLE_TEMPLATES.length].replace('{scene}', setting))
  const incident = rawTopic.incident || `${setting}에서 예상 밖의 일이 생긴다`
  const problem = rawTopic.problem || `친구들이 무엇을 어떻게 할지 서로 다르게 생각한다`
  const resolutionDirection = rawTopic.resolutionDirection || `${perspective.device}로 흔적을 찾아 직접 확인해 본다`
  const storyHint = rawTopic.storyHint || rawTopic.summary || `${incident}. 아이들은 ${problem}. ${resolutionDirection}.`
  const learningPoint = rawTopic.learningPoint || rawTopic.learningConnection || `${request.middleUnitName || '이 단원'}에서 배운 점이 실제 상황에서 어떻게 쓰이는지 배운다.`
  const openingLine = rawTopic.openingLine || `"잠깐, 뭔가 이상한데?"`
  const topicKeywords = [...new Set([...(Array.isArray(rawTopic.keywords) ? rawTopic.keywords : []), ...keywords.slice(0, 2)])].slice(0, 4)

  return {
    id: rawTopic.id || `topic-${Date.now()}-${index}`,
    title,
    question: questionText,
    angle: rawTopic.angle || rawTopic.perspective || perspective.name,
    perspective: rawTopic.perspective || rawTopic.angle || perspective.name,
    storyHint,
    learningPoint,
    openingLine,
    summary: rawTopic.summary || storyHint,
    connectionReason: rawTopic.connectionReason || `선택한 질문과 ${topicKeywords.join(', ')}를 ${perspective.name} 관점으로 연결한 이야기입니다.`,
    storyType: rawTopic.storyType || perspective.storyType,
    storyTypeLabel: rawTopic.storyTypeLabel || perspective.storyTypeLabel,
    setting,
    incident,
    problem,
    resolutionDirection,
    learningConnection: rawTopic.learningConnection || learningPoint,
    keywords: topicKeywords,
    tags: [...new Set([perspective.name, ...topicKeywords])].slice(0, 5),
    tone: rawTopic.tone || '구체적이고 호기심 있는',
    difficulty: rawTopic.difficulty || '보통',
    learningTopicId: request.learningTopicId,
    selectedQuestion: request.selectedQuestion || undefined,
    selectedKeywords: request.selectedKeywords,
    validation: rawTopic.validation || {
      keywordReflected: true,
      questionReflected: Boolean(request.selectedQuestion?.questionText ? questionText : true),
      grammarChecked: true
    }
  }
}

const fillTopicTemplate = (template: string, values: Record<string, string>) => {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template)
}

const createFallbackTopicRecommendation = (
  request: TopicGenerationRequest,
  perspective: DynamicPerspective,
  index: number,
  existingTitles: string[]
): TopicRecommendation => {
  const unitKeyword = request.middleUnitName || request.majorUnitName || '이 단원'
  const templateSeed = `${perspective.name}-${perspective.scene}-${index}-${Date.now()}`
  const titleTemplates = seededShuffle(FALLBACK_TITLE_TEMPLATES, templateSeed)
  const storyTemplates = seededShuffle(FALLBACK_STORY_HINT_TEMPLATES, `${templateSeed}-story`)
  const openingTemplates = seededShuffle(FALLBACK_OPENING_LINE_TEMPLATES, `${templateSeed}-opening`)
  const templateValues = { scene: perspective.scene, device: perspective.device }

  let title = normalizeTopicTitle(fillTopicTemplate(titleTemplates[0], templateValues))
  for (const candidate of titleTemplates) {
    const nextTitle = normalizeTopicTitle(fillTopicTemplate(candidate, templateValues))
    if (!existingTitles.some(existing => normalizeTopicTitle(existing) === nextTitle)) {
      title = nextTitle
      break
    }
  }

  const storyHint = fillTopicTemplate(storyTemplates[0], templateValues)
  const openingLine = fillTopicTemplate(openingTemplates[0], templateValues)

  return repairWeakTopicRecommendation({
    title,
    question: request.selectedQuestion?.questionText || `${perspective.scene}에서 어떤 장면이 이어질까요?`,
    storyHint,
    learningPoint: `${unitKeyword}에서 배운 내용이 실제 장면에 어떻게 쓰이는지 배운다.`,
    openingLine,
    setting: perspective.scene,
    incident: `${perspective.device}가 ${perspective.scene}의 흐름을 바꾼다`,
    problem: `모둠 친구들의 의견이 갈린다`,
    resolutionDirection: `${perspective.device}로 장면을 직접 확인한다`,
    keywords: [unitKeyword]
  }, request, perspective, index)
}

const validateAndRepairTopicRecommendations = (
  rawTopics: any[],
  request: TopicGenerationRequest,
  perspectives: DynamicPerspective[],
  count: number,
  existingTitles: string[] = []
) => {
  const keywords = request.selectedKeywords || []
  const repaired: TopicRecommendation[] = []
  let removedDuplicateCount = 0
  let fallbackCount = 0

  rawTopics.forEach((rawTopic, index) => {
    const perspective = perspectives[index % perspectives.length] || DYNAMIC_PERSPECTIVE_POOL[index % DYNAMIC_PERSPECTIVE_POOL.length]
    const topic = repairWeakTopicRecommendation(rawTopic, request, perspective, index)
    const normalizedTitle = normalizeTopicTitle(topic.title)
    const titleTaken = [...existingTitles, ...repaired.map(item => item.title)].some(title => normalizeTopicTitle(title) === normalizedTitle)
    const duplicate = titleTaken || repaired.some(item => isSimilarTopic(item, topic)) || repaired.some(item => (item.perspective || item.angle) === (topic.perspective || topic.angle))
    const weakStory = isWeakStoryHint(topic)
    const passesRequiredReview = isValidRequiredTopic(topic, [...existingTitles, ...repaired.map(item => item.title)])

    // 키워드 리터럴 포함 여부로 좋은 제목을 거르지 않는다(키워드는 힌트).
    if (duplicate || weakStory || !passesRequiredReview) {
      removedDuplicateCount++
      return
    }

    repaired.push({ ...topic, title: normalizedTitle })
  })

  const usedPerspectives = repaired.map(topic => topic.perspective || topic.angle || '').filter(Boolean)
  const fallbackPerspectives = selectDiversePerspectives(request, count, usedPerspectives)
  let fallbackGuard = 0
  while (repaired.length < count && fallbackGuard < count * 10) {
    const perspective = fallbackPerspectives[(repaired.length + fallbackGuard) % fallbackPerspectives.length] || DYNAMIC_PERSPECTIVE_POOL[(repaired.length + fallbackGuard) % DYNAMIC_PERSPECTIVE_POOL.length]
    const fallback = createFallbackTopicRecommendation(request, perspective, repaired.length + fallbackGuard, [...existingTitles, ...repaired.map(item => item.title)])
    fallbackCount++
    fallbackGuard++
    if (!repaired.some(item => isSimilarTopic(item, fallback)) && isValidRequiredTopic(fallback, [...existingTitles, ...repaired.map(item => item.title)])) {
      repaired.push(fallback)
    }
  }

  let forceIndex = 0
  while (repaired.length < count) {
    const perspective = DYNAMIC_PERSPECTIVE_POOL[(repaired.length + forceIndex) % DYNAMIC_PERSPECTIVE_POOL.length]
    const fallback = createFallbackTopicRecommendation(request, perspective, repaired.length + forceIndex + 100, [...existingTitles, ...repaired.map(item => item.title)])
    const normalizedTitle = normalizeTopicTitle(fallback.title)
    const titleTaken = repaired.some(item => normalizeTopicTitle(item.title) === normalizedTitle)
    if (!titleTaken && isValidRequiredTopic(fallback, [...existingTitles, ...repaired.map(item => item.title)])) {
      repaired.push({
        ...fallback,
        title: normalizedTitle,
        storyHint: fallback.storyHint || fallback.summary || `${request.middleUnitName || '주제'}를 다른 장소와 사건으로 풀어 보는 이야기입니다.`,
        openingLine: fallback.openingLine || `"이번에는 다른 단서부터 찾아보자."`
      })
    }
    forceIndex++
    fallbackCount++
    if (forceIndex > count * 20) {
      const forcedTitleSeeds = ['교실의 작은 비밀', '사라진 물건', '엇갈린 두 친구', '뜻밖의 발견', '뒤바뀐 하루', '수상한 쪽지', '갑작스러운 변화', '낡은 지도', '작은 오해', '우리 반 긴급 회의']
      repaired.push({
        ...fallback,
        id: `topic-force-${Date.now()}-${repaired.length}`,
        title: forcedTitleSeeds[repaired.length % forcedTitleSeeds.length],
        storyHint: `평범한 하루에 작은 사건이 생기고, 친구들은 각자 다르게 반응하며 무엇을 먼저 할지 정합니다.`,
        learningPoint: `${request.middleUnitName || '이 단원'}에서 배운 점이 실제 상황에서 어떻게 쓰이는지 배웁니다.`,
        openingLine: `"잠깐, 이거 이상한데?"`,
        keywords: [request.middleUnitName || '이 단원']
      })
    }
  }
  const finalTopics = repaired.slice(0, count).map((topic, index) => applyRequiredTopicDiversity({
    ...topic,
    id: topic.id || `topic-${Date.now()}-${index}`,
    learningTopicId: request.learningTopicId
  }, index, request))

  const diversityLog: TopicDiversityLog = {
    generatedCount: finalTopics.length,
    removedDuplicateCount,
    usedPerspectives: finalTopics.map(topic => topic.perspective || topic.angle || '').filter(Boolean),
    keywordDistribution: getKeywordDistribution(finalTopics, keywords),
    fallbackCount
  }

  console.log('[주제 생성 다양성 검수]', diversityLog)
  return { topics: finalTopics, diversityLog }
}


const buildPrompt = (
  request: TopicGenerationRequest,
  existing: TopicRecommendation[],
  count: number,
  extraData: CurriculumContext,
  perspectives: DynamicPerspective[]
) => {
  const { gradeName, subjectName, majorUnitName, middleUnitName, extraRequest, selectedKeywords, previousTitles } = request
  const { learningGoal, keyQuestions, contentScope, achievementStandards, unitSummary, unitGoal, subunitSummary } = extraData

  const allBannedTitles = [
    ...(previousTitles || []),
    ...existing.map(r => r.title)
  ].map(normalizeTopicTitle)

  const perspectiveList = perspectives.map((perspective, index) => (
    `${index + 1}. ${perspective.name} / 장소 힌트: ${perspective.scene} / 상황 장치: ${perspective.device}`
  )).join('\n')

  const questionContext = ''

  return `당신은 초등학생용 교과 학습만화 기획자입니다.

목표: 학생이 만화 첫 장면을 떠올리고 스스로 다음을 이어갈 수 있는 '짧은 작품 제목' ${count}개를 만드세요.
주제는 완성된 줄거리·학습목표·보고서 문장이 아닙니다. 문제의 해결, 교훈, 결론을 제목 안에 미리 다 담지 마세요. 아래 동적 관점 후보 중 서로 다른 관점을 사용하세요. 관점을 고정하지 말고 이번 단원·키워드·질문과 어울리는 관점만 쓰세요.

[이번에 사용할 동적 관점]
${perspectiveList}

[단원 정보]
학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원(학습 주제): ${middleUnitName}
${unitGoal ? `대단원 목표: ${unitGoal}` : ''}
${learningGoal ? `학습목표: ${learningGoal}` : ''}
${keyQuestions ? `핵심 질문: ${keyQuestions}` : ''}
${achievementStandards ? `성취기준: ${achievementStandards}` : ''}
${unitSummary ? `대단원 요약: ${unitSummary}` : ''}
${subunitSummary ? `중단원 요약: ${subunitSummary}` : ''}
${contentScope ? `내용 체계: ${contentScope}` : ''}
${selectedKeywords?.length ? `선택한 키워드: ${selectedKeywords.join(', ')}` : ''}
${questionContext}
질문 생성 결과는 사용하지 마세요. 선택된 키워드와 단원 정보만으로 주제를 만드세요.
${extraRequest ? `추가 요청: ${extraRequest}` : ''}
${allBannedTitles.length > 0 ? `이미 사용한 제목은 절대 반복하지 마세요: ${allBannedTitles.join(', ')}\n` : ''}

[키워드 처리 — 가장 중요]
선택된 키워드는 제목에 그대로 복사해 넣어야 하는 필수 단어가 아닙니다. 키워드와 교과 개념이 등장인물의 행동·장소·사건·갈등에서 자연스럽게 연상되면 충분합니다. 키워드가 제목에 직접 없더라도 의미가 장면에서 느껴지면 됩니다. 키워드가 빠졌다고 좋은 제목을 폐기하지 마세요.
특히 '상황, 상대방, 준비, 태도, 방법, 과정, 관계, 목적, 중요성, 필요성, 의미, 소통, 배려, 존중' 같은 추상 단어는 제목에 그대로 쓰지 말고 구체적인 인물·장소·사건으로 바꾸세요.
- '상대방' → 발표 중인 친구, 부탁하는 짝꿍, 화가 난 동생
- '상황' → 발표 직전, 급식 시간, 비 오는 운동장, 체험학습 전날
- '준비' → 놓고 온 준비물, 사라진 발표 자료
- '배려·소통' → 말을 끝까지 들어 주는 친구, 잘못 전달된 말, 말을 자꾸 끊는 친구

[만들기 순서]
1. 학년·단원에서 배울 교과 개념을 이해한다.
2. 선택한 질문·키워드가 어떤 실제 행동이나 장면을 뜻하는지 해석한다.
3. 초등학생이 겪거나 상상할 수 있는 구체적 상황(인물·장소·사건·갈등 또는 궁금증)으로 바꾼다.
4. 학생이 재미있다고 느낄 만한 짧고 자연스러운 제목으로 쓴다.
5. 아래 [반환 전 자체 검사]를 통과한 것만 반환한다.
좋은 주제는 설명이 필요 없다. 제목만 보고 무슨 일이 벌어질지 상상할 수 있어야 한다. 제목을 읽고 "무슨 말이지?"라는 반응이 예상되면 버리고 다시 작성한다.

[주제 제목 형식 — 가장 중요한 규칙]
주제는 10~25자(최대 30자)의 짧은 '작품 제목'입니다. 한 주제에 사건·갈등·해결·교훈을 모두 넣지 말고, 학생이 대본에서 직접 풀어갈 수 있게 첫 장면 하나만 건네세요.
제목은 만들 때마다 아래 유형을 섞어 쓰고, 같은 종결 표현을 반복하지 마세요.
- 사람·상황형: "양치할 때 물을 계속 틀어 놓은 동생", "내 비밀을 말해 버린 단짝"
- 행동형: "교실에서 자석에 붙는 물건 찾기", "우리 반 전기 절약 작전"
- 질문형: "자석은 왜 철에 붙을까?", "그림자는 왜 길어졌다 짧아질까?"
- 사건형: "사라진 급식실 우유", "갑자기 멈춘 교실 시계"
- 탐험·상상형: "분수 나라의 잃어버린 조각", "자석 탐정의 수상한 가방"
절대 쓰지 마세요(제목에 포함되면 안 됨):
- "~이야기", "~에 대한 이야기", "~의 대한 이야기"로 끝내기 (예: "친구와 화해하는 이야기" X)
- "~의 중요성", "~의 필요성"
- "~을 알아보는", "~을 탐구하는", "~을 깨닫는", "~을 실천하는", "~의 의미를 되새기는"
- "~을 이해하기", "~을 탐구하기", "~을 알아보기", "문제를 해결하는"
- 보고서·학습목표 톤("효과적인 방법을 찾는", "바람직한 태도를 기르는")
'이야기'라는 단어 자체를 무조건 금지하지는 않지만, 제목을 습관적으로 "~이야기"로 끝내면 안 됩니다.

[반드시 지킬 규칙]
1. 주제 ${count}개는 서로 다른 제목과 서로 다른 종결 형식이어야 합니다.
2. 같은 제목 구조나 같은 질문 문장을 제목처럼 반복하지 마세요.
3. 제목 뒤에 (1), (2), 버전, 두 번째 같은 표시를 붙이지 마세요.
4. 키워드는 제목에 반드시 넣지 않아도 됩니다(위 [키워드 처리] 참고). 한 주제에 사건 하나만 담고, 주제마다 인물·장소·사건을 다르게 하세요.
5. 각 주제마다 장소·사건·갈등·궁금증은 달라야 하지만, 그것들을 '제목에 모두' 쓰지 마세요. 제목은 짧은 제목, 디테일은 storyHint에.
6. 학습 개념 설명문이 아니라 만화 대본으로 이어질 수 있는 씨앗이어야 합니다.
7. 초등학생(3~6학년)이 한 번에 이해하는 쉬운 말로, 실제 장면이나 사건이 떠오르게 쓰세요.
8. 단원 핵심 개념은 정확히 유지하되, 추상 표현보다 사람·장소·행동·사건을 쓰세요.
9. 발명, 탐험, 실험, 토론, 사건, 발견, 비교, 오해 같은 다양한 상황을 활용하세요. (단, 제목에 '미션·퀘스트·게임' 단어는 쓰지 마세요.)
10. 모든 주제는 실제 6컷 만화 대본으로 바로 이어질 수 있어야 합니다.

[반환 전 자체 검사]
각 제목을 반환하기 전에 스스로 확인하고, 어기면 다시 작성하세요.
1. "~이야기"로 습관적으로 끝나지 않았는가?
2. 보고서나 학습목표처럼 딱딱하지 않은가?
3. 초등학생이 바로 이해할 수 있는가?
4. 실제 장면이나 사건이 떠오르는가?
5. 해결·교훈·결론을 미리 다 말하지 않았는가?
6. 여러 주제의 형식이 서로 다양한가?
7. 선택한 학년·과목·단원·키워드와 정확히 관련되는가?
8. 추상 단어(상황·상대방·태도·방법·과정 등)를 제목에 억지로 넣지 않았는가?
9. 제목과 storyHint·learningPoint·openingLine이 같은 사건을 말하는가?

[필드 작성 규칙]
- title: 10~25자(최대 30자)의 짧은 '작품 제목'. 위 [주제 제목 형식]과 금지 표현을 반드시 지킨다. 제목 뒤 숫자·괄호·버전 금지.
- question: 선택 질문 또는 그 질문에서 뻗은 구체 질문
- angle 또는 perspective: 반드시 [이번에 사용할 동적 관점] 중 하나
- storyHint: 장소 + 사건 + 갈등 + 다음 장면 힌트가 담긴 1~2문장 (제목에 담지 못한 디테일을 여기에)
- learningPoint: 배울 핵심 내용 1문장
- openingLine: 대본 첫 장면에 넣을 수 있는 짧은 대사 1문장
- keywords: 제목에 담긴 핵심 낱말 2~4개. 선택 키워드를 억지로 넣지 말고 실제 장면에 어울리는 낱말로.
- tags: 관점, 장소, 키워드를 짧은 태그로 3~5개

응답은 지정된 JSON 형식으로만 반환하세요.
{
  "recommendations": [
    {
      "title": "짧은 작품 제목",
      "question": "연결 질문",
      "angle": "동적 관점 이름",
      "perspective": "동적 관점 이름",
      "storyHint": "이야기 시작 힌트",
      "learningPoint": "배울 내용",
      "openingLine": "첫 장면 대사",
      "summary": "storyHint와 같은 뜻의 짧은 설명",
      "connectionReason": "키워드와 질문이 어떻게 연결되는지",
      "storyType": "everyday_problem",
      "storyTypeLabel": "생활 속 발견",
      "setting": "장소",
      "incident": "발생한 사건",
      "problem": "갈등 또는 해결할 문제",
      "resolutionDirection": "해결 방향",
      "learningConnection": "학습 개념의 사용 방법",
      "keywords": ["키워드1", "키워드2"],
      "tags": ["관점", "장소", "키워드"],
      "tone": "전체적인 톤",
      "difficulty": "보통"
    }
  ]
}
`
}


export const fetchCurriculumContext = async (
  majorUnitId?: string | null,
  middleUnitId?: string | null
): Promise<CurriculumContext> => {
  const context: CurriculumContext = {}

  if (majorUnitId) {
    try {
      const { data } = await supabase
        .from('curriculum_units')
        .select('unit_summary, unit_goal')
        .eq('id', majorUnitId)
        .single()
      if (data) {
        context.unitSummary = data.unit_summary || ''
        context.unitGoal = data.unit_goal || ''
      }
    } catch (e) {
      console.error('Failed to fetch unit info:', e)
    }
  }

  if (middleUnitId) {
    try {
      const { data } = await supabase
        .from('curriculum_subunits')
        .select(`
          subunit_summary,
          learning_goal,
          key_questions,
          content_scope,
          subunit_achievement_standards(
            achievement_standards(
              standard_text,
              student_friendly_text
            )
          )
        `)
        .eq('id', middleUnitId)
        .single()
        
      if (data) {
        context.subunitSummary = data.subunit_summary || ''
        context.learningGoal = data.learning_goal || ''
        
        if (typeof data.key_questions === 'string') context.keyQuestions = data.key_questions
        else if (data.key_questions) context.keyQuestions = JSON.stringify(data.key_questions)
        
        if (typeof data.content_scope === 'string') context.contentScope = data.content_scope
        else if (data.content_scope) context.contentScope = JSON.stringify(data.content_scope)
        
        const standards: string[] = []
        if (Array.isArray(data.subunit_achievement_standards)) {
          data.subunit_achievement_standards.forEach((sas: any) => {
            const std = sas.achievement_standards
            if (std) {
              if (std.student_friendly_text) standards.push(std.student_friendly_text)
              else if (std.standard_text) standards.push(std.standard_text)
            }
          })
        }
        context.achievementStandards = standards.join('\\n')
      }
    } catch (e) {
      console.error('Failed to fetch subunit info:', e)
    }
  }

  return context
}

function attachJosa(word: string, type: '은는' | '이가' | '을를' | '과와'): string {
  if (!word) return '';
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) {
    // 한글이 아닌 경우 기본값 반환
    return word + (type === '은는' ? '은' : type === '이가' ? '이' : type === '을를' ? '을' : '과');
  }
  const hasJongseong = (lastChar - 0xac00) % 28 > 0;
  switch (type) {
    case '은는': return word + (hasJongseong ? '은' : '는');
    case '이가': return word + (hasJongseong ? '이' : '가');
    case '을를': return word + (hasJongseong ? '을' : '를');
    case '과와': return word + (hasJongseong ? '과' : '와');
  }
}

export const FALLBACK_THEMES = [
  {
    type: 'everyday_problem',
    label: '생활 속 문제',
    getTitle: (k: string) => [
      `급식 시간에 시작된 ${k} 소동`,
      `우리 반 ${k} 대소동`,
      `동생 때문에 알게 된 ${k}`
    ],
    getSummary: (concept: string) => `하나, 도윤, 서아가 학교나 집에서 겪은 작은 사건을 통해 ${attachJosa(concept, '을를')} 자연스럽게 이해하는 이야기`,
    setting: '학교, 집',
    incident: `평범한 일상 속에서 문제가 발생함`,
    problem: `친구들 또는 가족과 의견이 부딪힘`,
    resolutionDirection: `서로 대화하며 오해를 풀고 해결책을 찾음`,
    tone: '유쾌한, 공감되는',
  },
  {
    type: 'mystery',
    label: '미스터리',
    getTitle: (k: string) => [
      `밤마다 움직이는 ${k}의 비밀`,
      `학교 괴담 속 ${k}`,
      `사라진 ${attachJosa(k, '을를')} 찾아라`
    ],
    getSummary: (concept: string) => `친구들이 학교에 퍼진 수상한 소문을 따라가며 ${concept}의 단서를 찾는 이야기`,
    setting: '방과 후 학교, 어두운 복도',
    incident: `학교에 이상한 소문이 퍼짐`,
    problem: `정체를 알 수 없는 미스터리한 일을 겪음`,
    resolutionDirection: `용기를 내어 진실을 파헤침`,
    tone: '흥미진진한, 조금 오싹한',
  },
  {
    type: 'challenge',
    label: '게임/메타버스',
    getTitle: (k: string) => [
      `${k} 퀘스트에 접속하라`,
      `게임 속 ${k} 미션`,
      `메타버스에서 만난 ${k}`
    ],
    getSummary: (concept: string) => `하나, 도윤, 서아가 게임 속 미션을 해결하며 ${attachJosa(concept, '을를')} 단계별로 익히는 이야기`,
    setting: '가상현실 게임 속',
    incident: `새로운 게임 퀘스트가 시작됨`,
    problem: `어려운 미션을 통과해야만 로그아웃할 수 있음`,
    resolutionDirection: `팀워크를 발휘해 미션을 클리어함`,
    tone: '액션, 긴장감 있는',
  },
  {
    type: 'adventure',
    label: '마법/판타지',
    getTitle: (k: string) => [
      `마법 지도에 나타난 ${k}`,
      `${k} 주문을 완성하라`,
      `마법 학교의 ${k} 수업`
    ],
    getSummary: (concept: string) => `친구들이 마법 도구를 사용해 ${concept}의 원리를 발견하는 이야기`,
    setting: '마법 학교',
    incident: `마법 도구가 오작동을 일으킴`,
    problem: `마법의 부작용으로 곤란한 상황에 빠짐`,
    resolutionDirection: `올바른 주문과 방법을 알아내어 원래대로 되돌림`,
    tone: '신비로운, 환상적인',
  },
  {
    type: 'animal_pet',
    label: '동물/펫 일상',
    getTitle: (k: string) => [
      `고양이가 발견한 ${k}`,
      `강아지 탐험대와 ${k}`,
      `반려동물 회의의 ${k}`
    ],
    getSummary: (concept: string) => `동물 친구들이 생활 속 장면을 관찰하며 ${attachJosa(concept, '을를')} 재미있게 보여주는 이야기`,
    setting: '동네 놀이터, 동물들의 비밀 기지',
    incident: `주인 몰래 동물들만의 회의가 열림`,
    problem: `동물들의 시선에서 이해할 수 없는 일이 생김`,
    resolutionDirection: `동물들만의 기발한 방법으로 상황을 정리함`,
    tone: '귀여운, 엉뚱한',
  },
  {
    type: 'superpower_hero',
    label: '초능력/히어로',
    getTitle: (k: string) => [
      `${k} 히어로 출동`,
      `초능력으로 지켜낸 ${k}`,
      `${k} 배틀의 승자는?`
    ],
    getSummary: (concept: string) => `친구들이 각자의 능력을 사용해 문제를 해결하며 ${concept}의 특징을 이해하는 이야기`,
    setting: '위기에 처한 도시',
    incident: `도시에 갑자기 문제가 발생함`,
    problem: `자신의 초능력만으로는 해결하기 어려움`,
    resolutionDirection: `서로의 능력을 합쳐 퀴즈 배틀로 위기를 극복함`,
    tone: '활기찬, 역동적인',
  },
  {
    type: 'detective',
    label: '추리/탐정',
    getTitle: (k: string) => [
      `탐정단과 ${k} 사건`,
      `사라진 ${k}의 단서`,
      `교실 속 ${k} 미스터리`
    ],
    getSummary: (concept: string) => `하나, 도윤, 서아가 단서를 모아 ${concept}의 핵심을 추리하는 이야기`,
    setting: '탐정 사무소가 된 교실',
    incident: `중요한 물건이 사라지거나 이상한 일이 벌어짐`,
    problem: `단서가 부족해 범인이나 원인을 찾기 힘듦`,
    resolutionDirection: `작은 흔적들을 모아 날카로운 추리로 진실을 밝혀냄`,
    tone: '진지한, 호기심 넘치는',
  },
  {
    type: 'comedy',
    label: '유머/개그',
    getTitle: (k: string) => [
      `${k} 때문에 난리 난 우리 반`,
      `갑자기 ${attachJosa(k, '이가')} 되어버렸다`,
      `웃다가 알게 된 ${k}`
    ],
    getSummary: (concept: string) => `친구들이 엉뚱한 실수와 웃긴 상황을 겪으며 ${attachJosa(concept, '을를')} 자연스럽게 배우는 이야기`,
    setting: '왁자지껄한 교실',
    incident: `말도 안 되는 황당한 실수를 저지름`,
    problem: `상황이 갈수록 꼬이고 커져만 감`,
    resolutionDirection: `우연하고 웃긴 계기로 문제가 단숨에 풀림`,
    tone: '폭소 유발, 과장된',
  },
  {
    type: 'idol',
    label: '아이돌/성장',
    getTitle: (k: string) => [
      `${k} 오디션 대작전`,
      `무대 위에서 빛난 ${k}`,
      `비밀 아이돌의 ${k} 미션`
    ],
    getSummary: (concept: string) => `친구들이 무대나 방송 준비 과정에서 ${attachJosa(concept, '을를')} 활용해 문제를 해결하는 이야기`,
    setting: '오디션 대기실, 방송국 무대',
    incident: `무대에 오르기 직전 예상치 못한 사고가 남`,
    problem: `준비한 것을 제대로 보여주기 힘든 상황`,
    resolutionDirection: `순발력과 연습한 실력을 발휘해 위기를 넘김`,
    tone: '감동적인, 응원하게 되는',
  },
  {
    type: 'survival',
    label: '서바이벌/모험',
    getTitle: (k: string) => [
      `무인도에서 만난 ${k}`,
      `${attachJosa(k, '은는')} 없이는 살아남을 수 없어`,
      `이세계 생존 미션: ${k}`
    ],
    getSummary: (concept: string) => `친구들이 낯선 환경에서 살아남기 위해 ${attachJosa(concept, '을를')} 활용하는 이야기`,
    setting: '무인도, 낯선 이세계',
    incident: `갑자기 낯선 환경에 갇혀버림`,
    problem: `가지고 있는 물건이 부족하고 위험이 다가옴`,
    resolutionDirection: `주변 환경의 특징을 관찰해 생존 도구를 만들어냄`,
    tone: '긴장감 있는, 생존형',
  }
];

export const validateTopicRecommendation = (
  topic: TopicRecommendation,
  selectedKeywords: string[],
  selectedQuestion: string | undefined,
  existingTitles: string[]
): { isValid: boolean; validation: { keywordReflected: boolean; questionReflected: boolean; grammarChecked: boolean } } => {
  const searchableText = [
    topic.title,
    topic.summary,
    topic.storyHint,
    topic.learningPoint,
    topic.connectionReason,
    ...(topic.keywords || [])
  ].join(' ')

  const keywordReflected = selectedKeywords.length === 0 || selectedKeywords.some(keyword => searchableText.includes(keyword))
  const questionTokens = selectedQuestion ? selectedQuestion.split(/\s+/).filter(token => token.length > 1) : []
  const questionReflected = !selectedQuestion || questionTokens.some(token => searchableText.includes(token)) || Boolean(topic.question)
  const cleanTitle = normalizeTopicTitle(topic.title)
  const grammarChecked = cleanTitle.length >= 6 && cleanTitle.length <= 32 && cleanTitle === topic.title && !existingTitles.some(title => normalizeTopicTitle(title) === cleanTitle)

  return {
    isValid: keywordReflected && questionReflected && grammarChecked,
    validation: { keywordReflected, questionReflected, grammarChecked }
  }
}

export const generateTopicRecommendations = async (
  request: TopicGenerationRequest
): Promise<TopicRecommendation[]> => {
  let extraData: CurriculumContext = request.curriculumContext || {}
  if (!request.curriculumContext && request.learningTopicId) {
    extraData = await fetchCurriculumContext(null, request.learningTopicId)
  }

  const safeSelectedKeywords = validateGeneratedKeywords(
    (request.selectedKeywords || []).map(word => ({ word, reason: '' })),
    request.majorUnitName || '',
    request.middleUnitName || '',
    request.subjectName || ''
  ).map(item => item.word)
  const topicRequest: TopicGenerationRequest = {
    ...request,
    selectedQuestion: null,
    selectedKeywords: safeSelectedKeywords.length > 0 ? safeSelectedKeywords : request.selectedKeywords
  }

  const countToGenerate = Math.min(topicRequest.count || 2, 10)
  const existingTitles = topicRequest.previousTitles || []
  const selectedPerspectives = selectDiversePerspectives(topicRequest, countToGenerate, [])
  const prompt = buildPrompt(topicRequest, [], countToGenerate, extraData, selectedPerspectives)

  const tryModel = async (model: string): Promise<string> => {
    if (!model) throw new Error('No model provided')
    return await Promise.race([
      geminiClient.generateTextWithModel(prompt, model),
      // 주제 ${countToGenerate}개 + 긴 프롬프트 생성 여유를 위해 20초까지 대기.
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 20000))
    ])
  }

  let rawRecommendations: any[] = []
  try {
    const responseText = await tryModel(TEXT_GENERATION_MODEL)
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(cleanedText)
    if (parsedData && Array.isArray(parsedData.recommendations)) {
      rawRecommendations = parsedData.recommendations.filter((rec: any) => rec && typeof rec === 'object')
    }
  } catch (error) {
    console.warn('[AI 추천 생성] 실패 또는 응답 검수 불가 → 동적 fallback 사용:', error)
  }

  console.debug('[topic generation parsed]', { requestedCount: countToGenerate, parsedCount: rawRecommendations.length })

  const { topics } = validateAndRepairTopicRecommendations(
    rawRecommendations,
    topicRequest,
    selectedPerspectives,
    countToGenerate,
    existingTitles
  )

  console.debug('[topic generation final]', { requestedCount: countToGenerate, finalCount: topics.length })
  return topics
}


export const BANNED_KEYWORD_TERMS = new Set([
  '탐구야', '즐겁게', '놀자', '놀자!', '해보자', '하기', '되기', '알기',
  '생각', '이야기', '활동', '재미', '공부', '학습',
  '우리', '학생', '사람들', '경우', '위치', '설명', '과정', '의미', '종류',
  '이유', '까닭', '모습', '방식', '결과', '효과', '특성',
  '이해', '평가', '목표', '성취', '기준',
  '관찰', '실험', '탐구', '비교', '변화', '결과', '활동', '기록', '확인', '정리'
]);

const BAD_KEYWORD_TERMS = new Set([
  '만들기', '내리', '내리는', '그리기', '꾸미기', '하기', '보기', '알아보기',
  '확인하기', '생각하기', '비교하기', '관찰하기', '실험하기', '탐구하기',
  '정리하기', '설명하기', '생각', '확인', '결과', '탐구', '활동'
])

const SCIENCE_CONCEPT_ALLOWLIST = new Set([
  '용해', '용액', '용질', '용매', '물', '가루', '녹기', '진하기', '섞임', '눈',
  '동물', '서식지', '먹이', '생김새', '보호색', '사막', '북극', '날개',
  '식물', '뿌리', '줄기', '잎', '꽃', '씨', '햇빛', '양분',
  '공기', '온도', '자석', '전기', '소리', '그림자', '지층', '화석'
])

const SCIENCE_LOW_VALUE_TERMS = new Set(['풍경', '장면', '모습', '생각', '확인', '결과', '탐구', '활동'])


const REQUIRED_BAD_KEYWORD_TERMS = new Set([
  '있다', '없다', '된다', '하다', '필요하다', '움직이다', '설명하다',
  '설명함', '알아보기', '생각하기', '비교하기', '관찰하기',
  '미션', '모험', '탐정', '비밀기지', '퀘스트', '게임',
  '것', '내용', '문제', '방법', '이유'
])

const REQUIRED_TOPIC_TYPE_LABELS = [
  '생활 발견형', '실험 관찰형', '비밀 추적형', '문제 해결형', '비교 대결형',
  '오해 해결형', '안전 상황형', '미래 상상형', '직업 체험형', '친구 설명형'
]

const REQUIRED_TOPIC_BAD_TERMS = ['미션', '퀘스트', '비밀기지', '게임', '용액 풍경', '이동 미션']
const REQUIRED_JOSA_ENDINGS = ['에서', '으로', '로', '은', '는', '이', '가', '을', '를', '의', '와', '과']
const REQUIRED_TRAILING_VERBS = /(있다|없다|된다|하다|필요하다|움직이다|설명하다)$/
const REQUIRED_EXPLANATION_WORDS = /(설명함|알아보기|생각하기|비교하기|관찰하기)$/

const normalizeRequiredKeyword = (word: string) => {
  return (word || '')
    .replace(/[!?,.()[\]{}<>"'“”‘’]/g, ' ')
    .replace(/\s+(에서|으로|로|은|는|이|가|을|를|의|와|과)\s+/g, ' ')
    .replace(/(\S+)(에서|으로|로|은|는|이|가|을|를|의|와|과)\s+/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

const isRequiredBadKeyword = (word: string) => {
  const parts = word.split(/\s+/).filter(Boolean)
  if (parts.length < 1 || parts.length > 3) return true
  if (parts.some(part => REQUIRED_BAD_KEYWORD_TERMS.has(part))) return true
  if (REQUIRED_BAD_KEYWORD_TERMS.has(word)) return true
  if (REQUIRED_TRAILING_VERBS.test(word) || REQUIRED_EXPLANATION_WORDS.test(word)) return true
  return REQUIRED_JOSA_ENDINGS.some(josa => word.endsWith(josa))
}

const normalizeRequiredTopicTitle = (title: string) => normalizeTopicTitle(title).trim()

const hasAwkwardRepeatedWord = (title: string) => {
  const words = title.split(/\s+/).filter(word => word.length > 1)
  return words.some((word, index) => words.indexOf(word) !== index)
}

// 학생다운 짧은 제목을 해치는 표현 감지: 습관적 '~이야기' 종결 + 보고서/학습목표 톤.
// (질문형 제목의 '?'는 허용하므로 여기서 금지하지 않는다.)
const BANNED_TOPIC_TITLE_PHRASES = [
  '중요성', '필요성', '알아보는', '탐구하는', '깨닫는', '실천하는', '되새기는',
  '이해하기', '탐구하기', '알아보기', '해결하는', '효과적인 방법', '바람직한 태도'
]
const hasBannedTopicTitleExpression = (title: string) => {
  // 습관적 '~이야기' / '~이야기?' 종결
  if (/이야기[??]?$/.test(title)) return true
  // 보고서·학습목표 톤 표현
  return BANNED_TOPIC_TITLE_PHRASES.some(phrase => title.includes(phrase))
}

// 제목에 그대로 쓰이면 부자연스러운 추상 단어(의미는 구체 장면으로 드러내야 함).
// '준비(물)'·'문제'처럼 자연스러운 쓰임이 있는 단어는 의도적으로 제외.
const ABSTRACT_TITLE_WORDS = ['상황', '상대방', '태도', '방법', '과정', '관계', '목적', '중요성', '필요성', '의미', '실천', '소통', '배려', '존중']

const isValidRequiredTopic = (topic: TopicRecommendation, existingTitles: string[]) => {
  const rawTitle = (topic.title || '').trim()
  const title = normalizeRequiredTopicTitle(rawTitle)
  if (title.length < 4 || title.length > 30) return false
  if (title !== rawTitle) return false // 버전/숫자/괄호 접미어 등 부가 표시 거부 ('?'는 유지)
  if (hasBannedTopicTitleExpression(title)) return false // '~이야기' 종결·보고서 표현 거부
  if (ABSTRACT_TITLE_WORDS.some(w => title.includes(w))) return false // 추상 단어 제목 직접 사용 거부
  if (REQUIRED_TOPIC_BAD_TERMS.some(term => [title, topic.storyHint, topic.summary, ...(topic.keywords || [])].join(' ').includes(term))) return false
  if (hasAwkwardRepeatedWord(title)) return false
  if (existingTitles.some(existing => normalizeTopicTitle(existing) === normalizeTopicTitle(title))) return false

  const badTitleWords = ['질문', '단서', '미션', '장면', '문제'];
  if (badTitleWords.some(w => title.includes(w))) return false;

  // 키워드/단원명 리터럴 포함 여부로 좋은 제목을 거르지 않는다.
  // 키워드는 힌트이며 단원 연관성은 AI 프롬프트와 위 품질 검사로 확보한다.
  return true
}

const applyRequiredTopicDiversity = (topic: TopicRecommendation, index: number, request: TopicGenerationRequest): TopicRecommendation => {
  const typeLabel = REQUIRED_TOPIC_TYPE_LABELS[index % REQUIRED_TOPIC_TYPE_LABELS.length]
  const keywords = request.selectedKeywords?.length ? request.selectedKeywords : topic.keywords || []
  return {
    ...topic,
    title: normalizeRequiredTopicTitle(topic.title),
    question: undefined,
    storyTypeLabel: typeLabel,
    perspective: typeLabel,
    angle: typeLabel,
    keywords: [...new Set([...(topic.keywords || []), ...keywords])].slice(0, 4),
    validation: {
      keywordReflected: true,
      questionReflected: false,
      grammarChecked: true
    }
  }
}
const isActivityKeyword = (word: string) => {
  if (SCIENCE_CONCEPT_ALLOWLIST.has(word)) return false
  if (BAD_KEYWORD_TERMS.has(word)) return true
  if (/(하기|보기|만들기|그리기|꾸미기|알아보기|확인하기|생각하기|비교하기|관찰하기|실험하기|탐구하기|정리하기|설명하기)$/.test(word)) return true
  return /기$/.test(word) && !SCIENCE_CONCEPT_ALLOWLIST.has(word)
}

const isVerbStemKeyword = (word: string) => {
  return ['내리', '만들', '그리', '꾸미', '하', '보', '알아보', '확인하', '생각하', '비교하', '관찰하', '실험하', '탐구하', '정리하', '설명하'].includes(word)
}

const isBadKeyword = (word: string, subjectName = '') => {
  const cleaned = word.trim()
  if (!cleaned) return true
  if (BAD_KEYWORD_TERMS.has(cleaned)) return true
  if (isActivityKeyword(cleaned)) return true
  if (isVerbStemKeyword(cleaned)) return true
  if (subjectName === '과학' && SCIENCE_LOW_VALUE_TERMS.has(cleaned) && !SCIENCE_CONCEPT_ALLOWLIST.has(cleaned)) return true
  return false
}

const getScienceUnitFallbackWords = (majorUnitName: string, middleUnitName: string, context?: CurriculumContext) => {
  const source = [majorUnitName, middleUnitName, context?.unitGoal, context?.learningGoal, context?.unitSummary, context?.subunitSummary, context?.contentScope, context?.keyQuestions].filter(Boolean).join(' ')

  if (source.includes('태양계') || source.includes('태양') || source.includes('별')) {
    return ['태양', '지구', '빛', '열', '별', '태양계', '낮', '밤', '그림자', '온도', '에너지', '생명', '식물', '계절']
  }
  if (source.includes('온도') || source.includes('열') || source.includes('기체') || source.includes('대류')) {
    return ['열', '온도', '기체', '공기', '대류', '이동', '실험', '변화', '흐름', '입자']
  }
  if (source.includes('용해') || source.includes('용액') || source.includes('녹')) {
    return ['용해', '용액', '용질', '용매', '물', '가루', '녹기', '진하기', '섞임', '눈']
  }
  if (source.includes('동물') || source.includes('서식지')) {
    return ['동물', '서식지', '먹이', '생김새', '보호색', '사막', '북극', '날개', '다리', '몸']
  }
  if (source.includes('식물')) {
    return ['식물', '뿌리', '줄기', '잎', '꽃', '열매', '물', '햇빛', '바람', '양분']
  }
  return []
}
export const KEYWORD_GENERATION_RULES = `
[중요 조건]
1. 키워드는 반드시 초등학생이 만화 이야기 소재로 바로 사용할 수 있는 '명사' 또는 '교과 핵심 개념어'여야 합니다.
2. 한 키워드는 공백 없는 짧은 단어여야 합니다.
3. 문장형 표현은 절대 금지합니다.
4. 형용사, 부사, 동사형 표현은 금지합니다.
5. '하기', '알기', '되기', '해보자', '놀자', '탐구야', '즐겁게' 같은 활동형 표현은 금지합니다.
6. 조사나 어미가 붙은 단어는 제외하고 원형만 추출하세요.
7. 특수문자, 느낌표, 물음표, 쉼표, 마침표가 포함되지 않게 하세요.
8. 단원명이나 중단원명을 단순히 띄어쓰기만 해서 만든 단어는 제외합니다.
9. '생각', '이야기', '활동', '재미', '공부', '학습' 등 너무 넓고 애매한 단어는 제외하세요.
10. 학생이 만화 장면으로 바로 떠올릴 수 있는 구체적인 사물, 인물, 장소, 사건 중심의 명사를 우선하세요.
11. 가장 우선순위가 높은 것은 '중단원(학습 주제)'의 핵심 개념입니다.
12. 서로 비슷하지 않은 단어들로 최대 10개까지 추천해 주세요.
13. 결과는 JSON 형태로만 반환합니다. 마크다운 코드블록은 쓰지 않습니다.
14. 과학 과목에서는 '관찰', '실험', '탐구', '결과', '비교', '변화' 같은 공통 활동어만 반복하지 마세요.
15. 대단원명, 중단원명, 학습목표, 단원 설명에 들어 있는 구체 명사(예: 동물, 사막, 북극, 서식지, 보호색, 먹이, 생김새, 날개, 뿌리, 줄기)를 우선하세요. 단, 단원과 맞을 때만 사용하세요.
`;

export const validateGeneratedKeywords = (
  candidates: KeywordItem[],
  majorUnitName: string,
  middleUnitName: string,
  subjectName = ''
): KeywordItem[] => {
  const punctuationRegex = /[!?,.()\[\]{}<>]/
  const chapterWords = new Set([
    (majorUnitName || '').replace(/\s/g, ''),
    (middleUnitName || '').replace(/\s/g, '')
  ])
  const validated: KeywordItem[] = []
  const seen = new Set<string>()
  const removed: Array<{ word: string; reason: string }> = []

  for (const item of candidates) {
    if (!item || !item.word) continue
    const original = item.word.trim()
    const w = normalizeRequiredKeyword(original)
    let reason = ''

    if (!w) reason = 'empty'
    else if (punctuationRegex.test(w)) reason = 'punctuation'
    else if (isRequiredBadKeyword(w)) reason = 'required-filter'
    else if (BANNED_KEYWORD_TERMS.has(w) || isBadKeyword(w, subjectName)) reason = 'banned-or-activity'
    else if (chapterWords.has(w.replace(/\s/g, ''))) reason = 'whole-unit-title'

    if (reason) {
      removed.push({ word: original, reason })
      continue
    }

    if (!seen.has(w)) {
      seen.add(w)
      validated.push({ ...item, word: w })
    }
  }

  if (removed.length > 0) console.debug('[keyword validation removed]', removed)
  return validated.slice(0, 10)
}
const SCIENCE_GENERIC_KEYWORDS = new Set(['관찰', '실험', '탐구', '비교', '변화', '결과', '활동', '확인', '기록', '정리', '에너지'])

const extractUnitKeywordCandidates = (
  majorUnitName: string,
  middleUnitName: string,
  context?: CurriculumContext,
  subjectName = ''
) => {
  const scored = new Map<string, number>()
  const addWord = (word: string, score: number) => {
    const cleaned = word.trim()
    if (cleaned.length < 2 || cleaned.length > 5) return
    if (SCIENCE_GENERIC_KEYWORDS.has(cleaned)) return
    if (isBadKeyword(cleaned, subjectName)) return
    scored.set(cleaned, (scored.get(cleaned) || 0) + score)
  }
  const addFromText = (text: string | undefined, score: number) => {
    if (!text) return
    const candidates = text.match(/[가-힣]{2,6}/g) || []
    candidates.forEach(word => addWord(word, score))
  }

  getScienceUnitFallbackWords(majorUnitName, middleUnitName, context).forEach(word => addWord(word, 8))
  addFromText(middleUnitName, 5)
  addFromText(majorUnitName, 4)
  addFromText(context?.learningGoal, 4)
  addFromText(context?.subunitSummary, 3)
  addFromText(context?.unitGoal, 3)
  addFromText(context?.unitSummary, 2)
  addFromText(context?.contentScope, 2)
  addFromText(context?.achievementStandards, 2)
  addFromText(context?.keyQuestions, 2)

  return [...scored.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 10)
}
const getFallbackKeywords = (
  subjectName: string, 
  existingKeywords: string[] = [], 
  middleUnitName: string = '', 
  majorUnitName: string = '', 
  context?: CurriculumContext
): KeywordItem[] => {
  const specificMap: Record<string, string[]> = {
    '산지': ['산맥', '백두대간', '태백산맥', '지리산', '설악산', '국토', '고원'],
    '하천': ['강줄기', '상류', '하류', '나루터', '국토', '강변'],
    '강': ['강줄기', '상류', '하류', '나루터', '국토', '강변'],
    '평야': ['농사', '들판', '국토'],
    '해안': ['바다', '갯벌', '해수욕장', '항구', '어촌', '국토'],
    '섬': ['제주도', '울릉도', '독도', '화산섬', '항구', '어촌', '바다'],
    '도시': ['빌딩', '아파트', '공장', '교통', '버스', '지하철', '시장'],
    '촌락': ['농촌', '어촌', '산지촌', '논밭', '마을', '국토', '고장'],
    '지형': ['평야', '해안', '국토', '고장', '지형도'],
    '국토': ['우리나라', '국토', '고장', '지도', '바다']
  }

  let fallbackWords: string[] = []
  const combinedName = `${majorUnitName} ${middleUnitName}`
  const scienceFallbackWords = (subjectName === '과학' || subjectName === '怨쇳븰') ? getScienceUnitFallbackWords(majorUnitName, middleUnitName, context) : []
  const unitCandidates = extractUnitKeywordCandidates(majorUnitName, middleUnitName, context, subjectName)
  fallbackWords = [...fallbackWords, ...scienceFallbackWords, ...unitCandidates]

  if (combinedName) {
    for (const [key, words] of Object.entries(specificMap)) {
      if (combinedName.includes(key)) {
        fallbackWords = [...fallbackWords, ...words]
      }
    }
  }

  if (fallbackWords.length === 0) {
    const defaultWords: Record<string, string[]> = {
      '국어': ['인물', '마음', '대화', '표현', '상상', '사건', '감정', '글', '단어'],
      '영어': ['학교', '여행', '음식', '동물', '대화', '파티', '단어', '문장', '인사'],
      '수학': ['규칙', '숫자', '도형', '분수', '계산', '퍼즐', '크기', '모양', '길이'],
      '사회': ['지형', '국토', '기후', '산업', '교통', '도시', '농촌', '바다', '고장', '지도'],
      '과학': ['생물', '동물', '식물', '날씨', '공기', '물', '흙', '소리', '빛', '자석']
    }
    fallbackWords = defaultWords[subjectName] || defaultWords['국어']
  }

  fallbackWords = [...new Set(fallbackWords)]
  if (subjectName === '과학') {
    fallbackWords = fallbackWords.filter(word => !SCIENCE_GENERIC_KEYWORDS.has(word))
  }

  fallbackWords = fallbackWords.filter(word => !isBadKeyword(word, subjectName))

  if (existingKeywords.length > 0) {
    fallbackWords = fallbackWords.filter(w => !existingKeywords.includes(w))
  }

  return fallbackWords.map(word => ({
    word,
    reason: '학습 주제와 관련된 추천 키워드입니다.'
  }))
}

const FINAL_JOSA_ENDINGS = ['에서', '에게', '에는', '으로', '부터', '까지', '로', '은', '는', '이', '가', '을', '를', '의', '와', '과', '에', '도', '만']

const BANNED_FINAL_KEYWORDS = [
  '의해', '통해', '위해', '대한', '관한', '때문에', '경우', '동안',
  '질문', '단서', '장면', '미션', '모험', '퀘스트', '게임', '이야기',
  '주인공', '친구', '해결', '문제', '방법', '이유', '내용', '것'
]

const SCIENCE_DEFAULT_SAFE_KEYWORDS = ['관찰', '실험', '변화', '비교', '현상', '원리', '자연', '물질', '에너지', '생명']

const normalizeKeywordWord = (word: string) => {
  let normalized = (word || '')
    .replace(/[!?,.()[\]{}<>"'“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  let changed = true
  while (changed && normalized.length > 1) {
    changed = false
    for (const ending of FINAL_JOSA_ENDINGS) {
      if (normalized.length > ending.length + 1 && normalized.endsWith(ending)) {
        normalized = normalized.slice(0, -ending.length).trim()
        changed = true
        break
      }
    }
  }

  return normalized.replace(/\s+/g, ' ').trim()
}

export const finalizeKeywords = (keywords: string[]): string[] => {
  const result: string[] = []
  const seen = new Set<string>()

  for (const raw of keywords) {
    const normalized = normalizeKeywordWord(raw)
    if (!normalized) continue

    const parts = normalized.split(/\s+/).filter(Boolean)
    if (parts.length < 1 || parts.length > 3) continue
    if (normalized.length < 1) continue
    if (BANNED_FINAL_KEYWORDS.some(banned => normalized.includes(banned))) continue
    if (REQUIRED_TRAILING_VERBS.test(normalized) || REQUIRED_EXPLANATION_WORDS.test(normalized)) continue
    if (parts.some(part => REQUIRED_BAD_KEYWORD_TERMS.has(part))) continue

    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }

  return result
}

const getSafeKeywordPool = (request: TopicGenerationRequest & { count?: number; existingKeywords?: string[] }) => {
  const subjectName = request.subjectName || ''
  const pool = [
    ...getScienceUnitFallbackWords(request.majorUnitName || '', request.middleUnitName || '', request.curriculumContext),
    ...(request.middleUnitName?.match(/[가-힣]{1,6}/g) || []),
    ...(request.majorUnitName?.match(/[가-힣]{1,6}/g) || [])
  ]

  if (subjectName === '과학' || subjectName === '怨쇳븰') {
    pool.push(...SCIENCE_DEFAULT_SAFE_KEYWORDS)
  }

  return pool
}

const supplementKeywordsToCount = (
  candidates: KeywordItem[],
  request: TopicGenerationRequest & { count?: number; existingKeywords?: string[] }
) => {
  const targetCount = Math.min(Math.max(request.count || 2, 1), 10)
  const result: KeywordItem[] = []
  const seen = new Set(finalizeKeywords(request.existingKeywords || []))

  const addItems = (items: KeywordItem[]) => {
    const validated = validateGeneratedKeywords(items, request.majorUnitName || '', request.middleUnitName || '', request.subjectName || '')
    for (const item of validated) {
      if (!item?.word) continue
      const finalized = finalizeKeywords([item.word])
      if (finalized.length === 0) continue
      const word = finalized[0]
      if (seen.has(word)) continue
      result.push({ ...item, word })
      seen.add(word)
      if (result.length >= targetCount) break
    }
  }

  addItems(candidates)

  let guard = 0
  while (result.length < targetCount && guard < 10) {
    const fallback = getFallbackKeywords(
      request.subjectName || '',
      [...seen],
      request.middleUnitName || '',
      request.majorUnitName || '',
      request.curriculumContext
    )
    const before = result.length
    addItems(fallback)
    guard++
    if (result.length === before) break
  }

  if (result.length < targetCount) {
    addItems(getSafeKeywordPool(request).map(word => ({
      word,
      reason: '단원 내용에 맞춰 보충한 안전 키워드입니다.'
    })))
  }

  return result.slice(0, targetCount)
}
export const generateKeywords = async (
  request: TopicGenerationRequest & { count?: number; existingKeywords?: string[] }
): Promise<KeywordItem[]> => {
  const { gradeName, subjectName, majorUnitName, middleUnitName, count = 2, existingKeywords = [], curriculumContext } = request

  const existingKeywordsText = existingKeywords.length > 0 
    ? `\n\n이미 생성된 다음 키워드들은 제외하고 완전히 새로운 단어로 만들어주세요:\n[${existingKeywords.join(', ')}]` 
    : ''

  const contextText = curriculumContext ? `
[교과 정보]
대단원 목표: ${curriculumContext.unitGoal || ''}
중단원 학습목표: ${curriculumContext.learningGoal || ''}
성취기준: ${curriculumContext.achievementStandards || ''}
대단원 설명: ${curriculumContext.unitSummary || ''}
중단원 설명: ${curriculumContext.subunitSummary || ''}
내용 체계: ${curriculumContext.contentScope || ''}
핵심 질문: ${curriculumContext.keyQuestions || ''}
` : '';

  const unitKey = [gradeName, subjectName, majorUnitName, middleUnitName, curriculumContext?.unitGoal, curriculumContext?.learningGoal, curriculumContext?.subunitSummary].filter(Boolean).join('|')

  const prompt = `
너는 초등학생을 위한 학습만화 선생님입니다.
아래 단원 정보와 교과 정보를 바탕으로 학습만화 이야기에 쓸 만한 핵심 키워드 ${count}개를 추천해 주세요.

학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원(학습 주제): ${middleUnitName}${contextText}${existingKeywordsText}
${KEYWORD_GENERATION_RULES}

반환 형식:
{
  "keywords": [
    {
      "word": "산맥",
      "reason": "우리나라 산지 지형의 특징을 보여주는 구체적인 장소입니다."
    }
  ]
}
`

  console.debug('[키워드 생성 요청]', { unitKey, gradeName, subjectName, majorUnitName, middleUnitName })

  const KEYWORD_GENERATION_TIMEOUT_MS = 12000
  const KEYWORD_GENERATION_RETRY_COUNT = 1

  const tryModel = async (model: string): Promise<KeywordItem[]> => {
    if (!model) throw new Error('No model provided')

    let lastError: unknown = null
    for (let attempt = 0; attempt <= KEYWORD_GENERATION_RETRY_COUNT; attempt++) {
      try {
        const responseText = await Promise.race([
          geminiClient.generateTextWithModel(prompt, model),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), KEYWORD_GENERATION_TIMEOUT_MS))
        ])

        const cleanedText = responseText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
        const parsedData = JSON.parse(cleanedText)

        if (parsedData && Array.isArray(parsedData.keywords) && parsedData.keywords.length > 0) {
          const parsedKeywords = parsedData.keywords.map((k: any) => ({
            word: k.word,
            reason: k.reason || ''
          }))

          const result = supplementKeywordsToCount(parsedKeywords, request)
          console.debug('[keyword generation complete]', {
            unitKey,
            aiCount: parsedKeywords.length,
            finalCount: result.length,
            keywords: result.map(k => k.word)
          })
          if (result.length >= count) return result
        }

        throw new Error('Invalid JSON format from AI or all keywords were filtered out')
      } catch (error) {
        lastError = error
        if (attempt < KEYWORD_GENERATION_RETRY_COUNT) {
          console.warn(`[키워드 생성] ${model} 실패, 1회 재시도:`, error instanceof Error ? error.message : error)
          continue
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Failed to generate keywords')
  }

  try {
    try {
      return await tryModel(TEXT_GENERATION_MODEL)
    } catch (err: any) {
      console.warn(`[키워드 생성] ${TEXT_GENERATION_MODEL} 최종 실패 → fallback 사용:`, err.message)
      throw err
    }
  } catch (error) {
    console.error('Failed to generate keywords from AI:', error)
    const fallbacks = getFallbackKeywords(subjectName || '', existingKeywords, middleUnitName || '', majorUnitName || '', curriculumContext);
    const result = supplementKeywordsToCount(fallbacks, request)
    console.debug('[keyword fallback complete]', { unitKey, fallbackCount: fallbacks.length, finalCount: result.length, keywords: result.map(k => k.word) });
    return result
  }
}

export const fetchQuestionCategories = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('question_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Failed to fetch question categories:', error)
    throw error
  }
  return data || []
}

type KeywordRoles = {
  subject: string
  setting: string
  method: string
  idea: string
  others: string[]
}

const BAD_JOSA_PATTERNS = ['은(는)', '이(가)', '을(를)', '를(을)', '와(과)', '과(와)', '로(으로)', '으로(로)']
const GENERIC_QUESTION_PATTERNS = ['왜 중요', '특징은 무엇', '관련이 있을까요', '쉽게 설명하는 방법']

const getFinalConsonantIndex = (word: string) => {
  const trimmed = word.trim()
  if (!trimmed) return 0
  const charCode = trimmed.charCodeAt(trimmed.length - 1)
  if (charCode < 0xac00 || charCode > 0xd7a3) return 0
  return (charCode - 0xac00) % 28
}


const withJosa = (word: string, pair: '은/는' | '이/가' | '을/를' | '와/과' | '으로/로') => {
  if (!word) return ''
  const finalIndex = getFinalConsonantIndex(word)
  const final = finalIndex > 0
  if (pair === '은/는') return `${word}${final ? '은' : '는'}`
  if (pair === '이/가') return `${word}${final ? '이' : '가'}`
  if (pair === '을/를') return `${word}${final ? '을' : '를'}`
  if (pair === '와/과') return `${word}${final ? '과' : '와'}`
  if (pair === '으로/로') return `${word}${final && finalIndex !== 8 ? '으로' : '로'}`
  return word
}

const pickKeyword = (keywords: string[], includes: string[], excludes: string[] = []) => {
  return keywords.find(keyword =>
    includes.some(word => keyword.includes(word)) &&
    !excludes.some(word => keyword.includes(word))
  )
}

const analyzeKeywordRoles = (keywords: string[]): KeywordRoles => {
  const cleanKeywords = [...new Set(keywords.map(keyword => keyword.trim()).filter(Boolean))]
  const method = pickKeyword(cleanKeywords, ['실험', '관찰', '조사', '비교', '측정', '확인', '탐구', '만들기']) || ''
  const setting = pickKeyword(cleanKeywords, ['우주', '학교', '생활', '동네', '시장', '교실', '집', '마을', '바다', '숲', '환경']) || ''
  const exactIdea = cleanKeywords.find(keyword => ['물', '나눗셈'].includes(keyword)) || ''
  const idea = exactIdea || pickKeyword(cleanKeywords, ['발명', '발견', '변화', '문제', '해결', '아이디어', '에너지', '원리']) || ''
  const subject = cleanKeywords.find(keyword => keyword !== method && keyword !== setting && keyword !== idea) || cleanKeywords[0] || '주제'

  return {
    subject,
    setting: setting || cleanKeywords.find(keyword => keyword !== subject && keyword !== method && keyword !== idea) || '',
    method: method || cleanKeywords.find(keyword => keyword !== subject && keyword !== setting && keyword !== idea) || '',
    idea: idea || cleanKeywords.find(keyword => keyword !== subject && keyword !== setting && keyword !== method) || '',
    others: cleanKeywords.filter(keyword => ![subject, setting, method, idea].includes(keyword))
  }
}

const buildKeywordContext = (keywords: string[], roles: KeywordRoles) => {
  const { subject, setting, method, idea } = roles

  if (subject === '식물' && keywords.includes('물') && method === '관찰') {
    return '식물이 물을 어떻게 사용하는지 관찰하는 이야기'
  }

  if (subject === '분수' && keywords.includes('나눗셈') && keywords.includes('생활')) {
    return '생활 속 장면에서 분수와 나눗셈을 함께 알아보는 이야기'
  }

  if (subject && setting && method && idea) {
    return `${setting}에서 쓰이는 ${subject} ${withJosa(idea, '을/를')} ${withJosa(method, '으로/로')} 알아보는 이야기`
  }

  if (subject && idea && method) {
    return `${withJosa(subject, '이/가')} 움직이는 데 필요한 ${withJosa(idea, '을/를')} ${withJosa(method, '으로/로')} 알아보는 이야기`
  }

  if (subject && method) {
    return `${withJosa(subject, '을/를')} ${withJosa(method, '으로/로')} 알아보는 이야기`
  }

  return `${keywords.join(', ')}를 하나의 이야기로 연결해 알아보는 이야기`
}

const sanitizeQuestionKeywords = (
  keywords: string[],
  subjectName = '',
  majorUnitName = '',
  middleUnitName = '',
  context?: CurriculumContext
) => {
  const cleaned = validateGeneratedKeywords(
    keywords.map(word => ({ word, reason: '' })),
    majorUnitName,
    middleUnitName,
    subjectName
  ).map(item => item.word)

  if (cleaned.length > 0) return cleaned

  const fallback = getFallbackKeywords(subjectName, [], middleUnitName, majorUnitName, context)
  return validateGeneratedKeywords(fallback, majorUnitName, middleUnitName, subjectName).map(item => item.word).slice(0, 4)
}

const BAD_QUESTION_REGEXES = [
  /용액\s*풍경/,
  /만들기로\s*먼저\s*확인/,
  /내리로\s*확인/,
  /풍경\s*만들기\s*왜/,
  /.+\s.+을\s*생각할\s*때\s*왜\s*.+로\s*먼저\s*확인해야\s*할까요\?$/
]

const hasBadQuestionKeywordUse = (text: string) => {
  if (BAD_QUESTION_REGEXES.some(pattern => pattern.test(text))) return true
  return [...BAD_KEYWORD_TERMS].some(term => new RegExp(`${term}(으로|로|을|를|이|가|은|는)`).test(text))
}
const countKeywordMatches = (text: string, keywords: string[]) => {
  return keywords.filter(keyword => text.includes(keyword)).length
}

const isSimilarQuestion = (a: string, b: string) => {
  const normA = normalizeText(a)
  const normB = normalizeText(b)
  if (normA === normB) return true
  const shorter = normA.length < normB.length ? normA : normB
  const longer = normA.length < normB.length ? normB : normA
  if (shorter.length < 8) return false
  return longer.includes(shorter) || shorter.includes(longer)
}

const isValidQuestionText = (text: string, keywords: string[], existingTexts: string[]) => {
  const trimmed = text.trim()
  if (!trimmed.endsWith('?')) return false
  if (trimmed.length < 12 || trimmed.length > 75) return false
  if (BAD_JOSA_PATTERNS.some(pattern => trimmed.includes(pattern))) return false
  if (GENERIC_QUESTION_PATTERNS.some(pattern => trimmed.includes(pattern))) return false
  if (hasBadQuestionKeywordUse(trimmed)) return false
  if (countKeywordMatches(trimmed, keywords) < Math.min(2, keywords.length)) return false
  if (existingTexts.some(existing => isSimilarQuestion(existing, trimmed))) return false
  return true
}

const categoryCoversAllKeywords = (questions: string[], keywords: string[]) => {
  const joined = questions.join(' ')
  return keywords.every(keyword => joined.includes(keyword))
}

const createFallbackQuestionPool = (categoryCode: string, roles: KeywordRoles, keywords: string[]): string[] => {
  const { subject, setting, method, idea } = roles
  const s = subject || keywords[0] || '주제'
  const scene = setting || (keywords.includes('생활') ? '생활' : '')
  const action = method || (keywords.includes('관찰') ? '관찰' : '탐구')
  const result = idea || keywords.find(keyword => keyword !== s && keyword !== scene && keyword !== action) || '아이디어'
  const actionRo = withJosa(action, '으로/로')
  let target = scene ? `${scene}에서 쓸 ${s} ${result}` : `${s} ${result}`
  if (s === '식물' && result === '물' && action === '관찰') target = '식물이 물을 사용하는 모습'
  if (result === '에너지') target = `${s}에 필요한 에너지`
  const targetObj = withJosa(target, '을/를')
  const sceneText = scene || '우리 생활'

  const templates: Record<string, string[]> = {
    why: [
      `${targetObj} 알아보려면 왜 ${withJosa(action, '이/가')} 필요할까요?`,
      `${s} ${result}를 생각할 때 왜 ${actionRo} 먼저 확인해야 할까요?`,
      `${sceneText}에서 ${withJosa(s, '이/가')} 잘 쓰이려면 왜 ${actionRo} 알아봐야 할까요?`,
      `${s} ${result}와 ${withJosa(action, '은/는')} 왜 함께 생각해야 할까요?`,
      `${sceneText} 문제를 풀 때 ${s} ${result}와 ${withJosa(action, '은/는')} 어떻게 이어질까요?`
    ],
    what_if: [
      `${targetObj} ${action}하지 않고 만든다면 어떤 문제가 생길까요?`,
      `${s} ${result}에 ${withJosa(action, '이/가')} 없다면 ${sceneText}에서 어떤 일이 생길까요?`,
      `${sceneText}에서 ${withJosa(s, '이/가')} 예상과 다르게 움직이면 어떤 장면이 펼쳐질까요?`,
      `${withJosa(action, '을/를')} 건너뛰고 ${targetObj} 완성하면 무엇을 놓칠까요?`,
      `${sceneText} 상황을 모르고 ${s} ${withJosa(result, '을/를')} 다룬다면 누가 불편할까요?`
    ],
    experiment: [
      `${targetObj} 확인하려면 어떤 ${withJosa(action, '을/를')} 해 볼까요?`,
      `${withJosa(s, '이/가')} ${sceneText}에서 잘 쓰일 수 있는지 어떤 ${actionRo} 알아볼까요?`,
      `${s} ${result}가 잘 맞는지 ${sceneText} 장면으로 어떻게 ${action}해 볼까요?`,
      `${sceneText}에 맞는 ${s} ${withJosa(result, '을/를')} 찾으려면 무엇을 먼저 ${action}할까요?`,
      `${s} ${result}의 문제를 발견하려면 ${actionRo} 무엇을 비교해 볼까요?`
    ],
    life: [
      `우리 생활 속 ${s} ${withJosa(result, '은/는')} ${sceneText} ${withJosa(action, '와/과')} 어떻게 연결될까요?`,
      `${targetObj} 알아보는 ${withJosa(action, '이/가')} 우리 생활에 어떤 도움을 줄까요?`,
      `학교나 집에서 ${s} ${withJosa(result, '을/를')} ${actionRo} 알아볼 수 있는 장면은 무엇일까요?`,
      `우리 주변의 ${s} ${withJosa(result, '은/는')} ${sceneText} 문제를 어떻게 해결할까요?`,
      `${sceneText} 속 ${s} ${result} 아이디어를 생활 장면으로 바꾸면 어떤 일이 가능할까요?`
    ],
    compare: [
      `${sceneText}에서 ${withJosa(s, '이/가')} 잘 쓰일지 ${actionRo} 확인할 수 있을까요?`,
      `${s} ${withJosa(result, '은/는')} ${actionRo} 많이 확인할수록 더 좋아질까요?`,
      `${sceneText} 속 ${s}와 다른 장면의 ${s} ${withJosa(result, '은/는')} 무엇이 다를까요?`,
      `${action} 전과 후의 ${s} ${result} 모습은 어떻게 달라질까요?`,
      `${sceneText}에서 필요한 ${s} ${withJosa(result, '은/는')} 정말 ${actionRo} 찾을 수 있을까요?`
    ],
    secret: [
      `${target}에 숨어 있는 ${action}의 비밀은 무엇일까요?`,
      `${withJosa(s, '이/가')} ${sceneText}에서 쓰이게 하는 ${result}의 비밀은 무엇일까요?`,
      `${targetObj} 성공시키는 ${action} 속 숨은 단서는 무엇일까요?`,
      `${s} ${result}가 ${sceneText}에서 특별해지는 비밀을 ${actionRo} 찾을 수 있을까요?`,
      `${sceneText}와 ${s} ${result} 사이에 숨어 있는 ${action}의 단서는 무엇일까요?`
    ]
  }

  return templates[categoryCode] || templates.why
}

export const generateQuestions = async (
  request: any
): Promise<any[]> => {
  const { gradeName, subjectName, majorUnitName, middleUnitName, keyword, categories = [], curriculumContext, selectedKeywords } = request

  const rawKeywords = selectedKeywords && selectedKeywords.length > 0 ? selectedKeywords : (keyword ? [keyword] : ['주제'])
  const keywordsToUse = sanitizeQuestionKeywords(rawKeywords, subjectName || '', majorUnitName || '', middleUnitName || '', curriculumContext).slice(0, 4)
  if (keywordsToUse.length === 0) keywordsToUse.push(middleUnitName || majorUnitName || '주제')
  console.debug('[question keyword validation]', { selectedKeywords: rawKeywords, finalKeywords: keywordsToUse })
  const keywordString = keywordsToUse.join(', ')
  const keywordRoles = analyzeKeywordRoles(keywordsToUse)
  const keywordContext = buildKeywordContext(keywordsToUse, keywordRoles)

  const contextText = curriculumContext ? `
[교과 정보]
대단원 목표: ${curriculumContext.unitGoal || ''}
중단원 학습목표: ${curriculumContext.learningGoal || ''}
성취기준: ${curriculumContext.achievementStandards || ''}
대단원 설명: ${curriculumContext.unitSummary || ''}
중단원 설명: ${curriculumContext.subunitSummary || ''}
내용 체계: ${curriculumContext.contentScope || ''}
핵심 질문: ${curriculumContext.keyQuestions || ''}
` : ''

  const prompt = `
너는 초등학생을 위한 학습만화 질문 설계자입니다.
학생이 선택한 키워드 전체를 하나의 이야기 맥락으로 연결한 뒤, 질문 유형별로 5개씩 질문을 만들어 주세요.

학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원(학습 주제): ${middleUnitName}${contextText}
선택 키워드: ${keywordString}
키워드 역할:
- 중심 대상: ${keywordRoles.subject}
- 배경/상황: ${keywordRoles.setting || '없음'}
- 방법/활동: ${keywordRoles.method || '없음'}
- 결과/아이디어: ${keywordRoles.idea || '없음'}
내부 연결 문장: ${keywordContext}

[질문 유형별 역할]
- 왜 그럴까? (why): 이유와 원리를 묻는 질문
- 만약 없다면? (what_if): 상상과 변화를 묻는 질문
- 실험해 보면? (experiment): 직접 확인하거나 탐구할 수 있는 질문
- 우리 생활에서는? (life): 생활 속 사례와 연결하는 질문
- 정말일까? (compare): 오해, 확인, 검증을 묻는 질문
- 어떤 비밀이 있을까? (secret): 호기심을 자극하는 질문

[반드시 지킬 규칙]
1. 선택 키워드 전체를 하나의 이야기 맥락으로 연결해서 질문을 만드세요.
2. 첫 번째 키워드만 반복하지 마세요.
3. 각 질문은 선택 키워드 중 최소 2개 이상을 자연스럽게 포함하세요.
4. 유형별 질문 5개 전체에는 선택 키워드가 모두 최소 1번 이상 등장해야 합니다.
5. 조사 표현을 절대 괄호로 쓰지 마세요.
6. "은(는)", "이(가)", "을(를)", "와(과)", "로(으로)", "으로(로)" 같은 표현은 금지입니다.
7. "왜 중요할까요?", "특징은 무엇일까요?", "관련이 있을까요?"처럼 너무 일반적인 질문은 금지입니다.
8. 질문은 초등학교 3~6학년 학생이 이해할 수 있게 짧고 자연스럽게 쓰세요.
9. 만화 장면으로 이어질 수 있는 구체적인 질문을 만드세요.
10. 모든 질문은 반드시 물음표(?)로 끝나야 합니다.
11. 같은 의미의 질문을 반복하지 마세요.

응답 형식:
{
  "questions": [
    {
      "categoryCode": "why",
      "questionText": "우주에서 로봇을 발명하려면 왜 실험이 필요할까요?"
    }
  ]
}
`

  const normalizeCategoryCode = (category: any) => {
    if (category.code) return category.code
    if (category.name?.includes('왜')) return 'why'
    if (category.name?.includes('만약')) return 'what_if'
    if (category.name?.includes('실험')) return 'experiment'
    if (category.name?.includes('생활')) return 'life'
    if (category.name?.includes('정말')) return 'compare'
    if (category.name?.includes('비밀')) return 'secret'
    return 'why'
  }

  const getFallbackQuestionsForCategory = (category: any, count: number, existingTexts: string[]): string[] => {
    const categoryCode = normalizeCategoryCode(category)
    const pool = createFallbackQuestionPool(categoryCode, keywordRoles, keywordsToUse)
    const fallbacks: string[] = []

    for (const question of pool) {
      if (fallbacks.length >= count) break
      if (isValidQuestionText(question, keywordsToUse, [...existingTexts, ...fallbacks])) {
        fallbacks.push(question)
      }
    }

    let suffix = 0
    while (fallbacks.length < count && suffix < count * 8) {
      const main = keywordsToUse[suffix % keywordsToUse.length] || middleUnitName || '주제'
      const pair = keywordsToUse[(suffix + 1) % keywordsToUse.length] || main
      const safePool = [
        `${main}은 어떻게 달라질까요?`,
        `${main}과 ${pair}은 어떤 관계일까요?`,
        `${main}을 알아보려면 무엇을 살펴볼까요?`,
        `${main}과 ${pair}을 생활 속 어디에서 볼 수 있을까요?`,
        `${main}에 숨어 있는 중요한 단서는 무엇일까요?`
      ]
      const extra = safePool[suffix % safePool.length]
      if (isValidQuestionText(extra, keywordsToUse, [...existingTexts, ...fallbacks])) {
        fallbacks.push(extra)
      }
      suffix++
    }
    return fallbacks.slice(0, count)
  }

  const enforceCategoryKeywordCoverage = (category: any, questions: any[]) => {
    if (categoryCoversAllKeywords(questions.map(q => q.questionText), keywordsToUse)) return questions

    const fallbackPool = getFallbackQuestionsForCategory(category, 5, [])
    const nextQuestions = [...questions]
    for (const fallback of fallbackPool) {
      if (categoryCoversAllKeywords(nextQuestions.map(q => q.questionText), keywordsToUse)) break
      if (nextQuestions.some(q => q.questionText === fallback)) continue
      const formatted = {
        categoryCode: category.code,
        questionText: fallback,
        keyword: keywordString
      }
      if (nextQuestions.length < 5) {
        nextQuestions.push(formatted)
      } else {
        nextQuestions[nextQuestions.length - 1] = formatted
      }
    }
    return nextQuestions
  }

  const formatQuestionsByCategory = (rawQuestions: any[]) => {
    const validQuestions: any[] = []
    const questionsByCategory: Record<string, any[]> = {}

    categories.forEach((c: any) => {
      questionsByCategory[c.code] = []
    })

    for (const q of rawQuestions) {
      if (!q || !q.questionText || !q.categoryCode) continue

      let text = q.questionText.trim()
      if (!text.endsWith('?')) text += '?'
      if (!questionsByCategory[q.categoryCode]) continue
      if (!isValidQuestionText(text, keywordsToUse, validQuestions.map(vq => vq.questionText))) continue

      const formattedQ = {
        categoryCode: q.categoryCode,
        questionText: text,
        keyword: keywordString
      }
      questionsByCategory[q.categoryCode].push(formattedQ)
      validQuestions.push(formattedQ)
    }

    const finalQuestions: any[] = []
    categories.forEach((c: any) => {
      let catQuestions = questionsByCategory[c.code] || []
      const missingCount = 5 - catQuestions.length
      if (missingCount > 0) {
        const fallbacks = getFallbackQuestionsForCategory(c, missingCount, catQuestions.map(q => q.questionText))
        catQuestions.push(...fallbacks.map(text => ({
          categoryCode: c.code,
          questionText: text,
          keyword: keywordString
        })))
      }
      catQuestions = enforceCategoryKeywordCoverage(c, catQuestions).slice(0, 5)
      finalQuestions.push(...catQuestions)
    })

    return finalQuestions
  }

  const tryModel = async (model: string): Promise<any[]> => {
    if (!model) throw new Error('No model provided')
    const responseText = await Promise.race([
      geminiClient.generateTextWithModel(prompt, model),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000))
    ])

    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(cleanedText)

    if (parsedData && Array.isArray(parsedData.questions)) {
      return formatQuestionsByCategory(parsedData.questions)
    }
    throw new Error('Invalid JSON format from AI')
  }

  try {
    return await tryModel(TEXT_GENERATION_MODEL)
  } catch (error) {
    console.error('Failed to generate questions from AI, using fallback:', error)
    const fallbackFinal: any[] = []
    categories.forEach((c: any) => {
      const fallbacks = getFallbackQuestionsForCategory(c, 5, [])
      fallbackFinal.push(...fallbacks.map(text => ({
        categoryCode: c.code,
        questionText: text,
        keyword: keywordString
      })))
    })
    return fallbackFinal
  }
}

export const saveGeneratedQuestions = async (
  questions: any[],
  contextData: any
): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { grade, subject, semester, unit_id, subunit_id } = contextData

  const inserts = questions.map(q => ({
    user_id: user.id,
    grade,
    subject,
    semester,
    unit_id,
    subunit_id,
    keyword: q.keyword,
    category_code: q.categoryCode,
    question_text: q.questionText,
    is_selected: false
  }))

  const { data, error } = await supabase
    .from('generated_questions')
    .insert(inserts)
    .select()

  if (error) {
    console.error('Failed to save generated questions:', error)
    throw error
  }
  return (data || []).map((q: any) => ({
    ...q,
    categoryCode: q.category_code,
    questionText: q.question_text,
    topicId: q.topic_id,
    selectedKeyword: q.selected_keyword,
    questionCategoryId: q.question_category_id,
    sortOrder: q.sort_order,
    isSelected: q.is_selected,
    createdAt: q.created_at
  }))
}

export const selectGeneratedQuestion = async (
  questionId: string,
  contextData: any
) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // First, set all other questions with same context to false
  await supabase
    .from('generated_questions')
    .update({ is_selected: false })
    .eq('user_id', user.id)
    .eq('keyword', contextData.keyword)
    .eq('subject', contextData.subject || '')
    .eq('grade', contextData.grade || 0)
    
  // Set the selected one to true
  const { error } = await supabase
    .from('generated_questions')
    .update({ is_selected: true })
    .eq('id', questionId)
    .eq('user_id', user.id)

  if (error) throw error
}

export const saveGeneratedTopics = async (
  topics: any[],
  questionId: string | null,
  batchNo: number = 1
): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const inserts = topics.map(t => ({
    user_id: user.id,
    question_id: questionId,
    topic_text: JSON.stringify(t),
    batch_no: batchNo,
    is_selected: false
  }))

  const { data, error } = await supabase
    .from('generated_topics')
    .insert(inserts)
    .select()

  if (error) {
    console.error('Failed to save generated topics:', error)
    throw error
  }
  return data || []
}

export const selectGeneratedTopic = async (
  topicId: string,
  questionId: string | null
) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (questionId) {
    // First, set all other topics for this question to false
    await supabase
      .from('generated_topics')
      .update({ is_selected: false })
      .eq('user_id', user.id)
      .eq('question_id', questionId)
  }
    
  // Set the selected one to true
  const { error } = await supabase
    .from('generated_topics')
    .update({ is_selected: true })
    .eq('id', topicId)
    .eq('user_id', user.id)

  if (error) throw error
}
