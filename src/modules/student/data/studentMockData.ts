import type {
  TopicRecommendation
} from '../types/studentTopic'
import type {
  StudentProfile,
  AttendanceStatus,
  StudentUnit,
  ComicCut,
  QuizQuestion,
  RewardResult,
  StudentWork,
  UnitSummary,
} from '../types/studentFlow'

export const mockStudentProfile: StudentProfile = {
  id: 'student-001',
  name: '김민준',
  grade: '초5',
  classNumber: '3반',
  studentNumber: 12,
  avatarEmoji: '🦊',
  totalStars: 47,
  totalBadges: 8,
  streakDays: 5,
}

export const mockAttendanceStatus: AttendanceStatus = {
  today: '2026-06-19',
  isCheckedIn: false,
  streakDays: 5,
  weeklyAttendance: [true, true, true, true, false],
  todayReward: {
    stars: 3,
    badge: '🌟',
    message: '5일 연속 출석! 대단해요!',
  },
}

export const mockUnits: StudentUnit[] = [
  { id: 'u1', grade: '초5', subject: '수학', majorUnit: '분수의 연산', subUnit: '분수의 덧셈과 뺄셈' },
  { id: 'u2', grade: '초5', subject: '수학', majorUnit: '분수의 연산', subUnit: '분수의 곱셈' },
]

export const mockMajorUnits: Record<string, string[]> = {
  '초3-국어': ['말놀이와 이야기', '글을 읽어요'],
}

export const mockSubUnits: Record<string, string[]> = {
  '분수의 연산': ['분수의 덧셈과 뺄셈', '분수의 곱셈', '분수의 나눗셈'],
}

export const mockTopicRecommendations: TopicRecommendation[] = [
  { id: 't1', title: '우주 탐사선의 분수 연료 계산', summary: '분수 덧셈으로 우주선 연료를 계산해 행성에 도착해요!', storyType: 'everyday_problem', storyTypeLabel: '생활 속 문제', setting: '우주', incident: '연료 계산', problem: '연료 부족', resolutionDirection: '분수 덧셈', learningConnection: '분수의 덧셈 이해하기', keywords: [], tone: '신비', difficulty: '보통' },
  { id: 't2', title: '피자 나눠먹기 대작전', summary: '친구들과 피자를 분수로 나눠먹으며 분수 뺄셈을 배워요!', storyType: 'everyday_problem', storyTypeLabel: '생활 속 문제', setting: '식당', incident: '피자 나누기', problem: '분배 문제', resolutionDirection: '분수 뺄셈', learningConnection: '분수의 뺄셈 연습', keywords: [], tone: '발랄', difficulty: '쉬움' },
  { id: 't3', title: '마법의 분수 케이크 가게', summary: '케이크를 분수로 잘라 판매하는 마법 가게 이야기예요!', storyType: 'mystery', storyTypeLabel: '신비로운 이야기', setting: '가게', incident: '케이크 자르기', problem: '정확히 자르기', resolutionDirection: '분수 나눗셈', learningConnection: '분수의 나눗셈 기초', keywords: [], tone: '신비', difficulty: '쉬움' },
  { id: 't4', title: '수영장 물 채우기 미션', summary: '분수로 표현된 물의 양을 더해서 수영장을 채워요!', storyType: 'challenge', storyTypeLabel: '도전 미션', setting: '수영장', incident: '물 채우기', problem: '물 양 계산', resolutionDirection: '단위 더하기', learningConnection: '단위와 분수 더하기', keywords: [], tone: '긴장', difficulty: '보통' },
]

export const mockComicCuts: ComicCut[] = [
  { id: 'c1', cutNumber: 1, sceneDescription: '우주선 안에서 계기판을 보고 깜짝 놀라는 장면', speechBubble: '앗! 연료가 3/8밖에 안 남았어!', character: '민준', emotion: '놀람', backgroundEmoji: '🚀' },
  { id: 'c2', cutNumber: 2, sceneDescription: '지도를 보며 고민하는 장면', speechBubble: '행성까지 가려면 연료가 얼마나 필요하지?', character: '민준', emotion: '생각', backgroundEmoji: '🗺️' },
  { id: 'c3', cutNumber: 3, sceneDescription: '계산기를 들고 신나게 계산하는 장면', speechBubble: '3/8 + 1/4 = 5/8! 딱 맞아!', character: '민준', emotion: '신남', backgroundEmoji: '🧮' },
  { id: 'c4', cutNumber: 4, sceneDescription: '행성에 착륙하는 장면', speechBubble: '분수 덕분에 무사히 도착했어!', character: '민준', emotion: '기쁨', backgroundEmoji: '🪐' },
  { id: 'c5', cutNumber: 5, sceneDescription: '외계인 친구를 만나는 장면', speechBubble: '안녕! 분수를 알면 어디서든 친구가 될 수 있어!', character: '민준', emotion: '친근함', backgroundEmoji: '👾' },
  { id: 'c6', cutNumber: 6, sceneDescription: '지구로 돌아오는 장면', speechBubble: '분수의 덧셈 완전 정복! 다음엔 뺄셈도 해볼 거야!', character: '민준', emotion: '자신감', backgroundEmoji: '🌍' },
]

export const mockUnitSummary: UnitSummary = {
  title: '분수의 덧셈과 뺄셈',
  summary: '분수는 전체를 똑같이 나눈 것 중의 일부를 나타내요. 분모가 같은 분수끼리는 분자만 더하거나 빼면 돼요. 분모가 다를 때는 통분을 해서 분모를 같게 만든 다음 계산해요.',
  coreConcepts: [
    { id: 'cc1', title: '분수란?', description: '전체를 똑같이 나눈 것 중 일부를 나타내는 수예요.', emoji: '🍕' },
    { id: 'cc2', title: '같은 분모 계산', description: '분모가 같으면 분자끼리만 더하거나 빼요.', emoji: '🧮' },
    { id: 'cc3', title: '통분이란?', description: '분모가 다를 때 분모를 같게 만드는 것이에요.', emoji: '⚖️' },
  ],
  relatedStory: '옛날 이집트 사람들도 분수를 사용했어요! 농사를 지은 땅을 공평하게 나누기 위해 분수를 사용했답니다. 분수는 수천 년 전부터 우리 생활에 함께했어요.',
}

export const mockQuizQuestions: QuizQuestion[] = [
  { id: 'q1', type: 'OX', question: '1/2 + 1/2 = 1 이다.', options: ['O', 'X'], answer: 'O', emoji: '🤔' },
  { id: 'q2', type: 'multiple', question: '3/5 + 1/5 는 얼마일까요?', options: ['2/5', '3/5', '4/5', '5/5'], answer: '4/5', emoji: '🧮' },
  { id: 'q3', type: 'multiple', question: '분모가 다른 분수를 더할 때 먼저 해야 하는 것은?', options: ['분자 더하기', '통분하기', '분모 더하기', '약분하기'], answer: '통분하기', emoji: '📚' },
  { id: 'q4', type: 'OX', question: '3/4 - 1/4 = 2/4 이다.', options: ['O', 'X'], answer: 'O', emoji: '✏️' },
  { id: 'q5', type: 'multiple', question: '피자 3/8조각과 2/8조각을 합치면?', options: ['5/8', '5/16', '1/4', '6/8'], answer: '5/8', emoji: '🍕' },
]

export const mockRewardResult: RewardResult = {
  stars: 5,
  badges: [
    { id: 'b1', name: '분수 마스터', emoji: '🏆', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { id: 'b2', name: '5일 연속 출석', emoji: '🌟', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { id: 'b3', name: '첫 작품 완성', emoji: '🎨', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  ],
  message: '우와! 대단해요! 분수의 덧셈과 뺄셈을 완전히 마스터했어요! 민준 학생은 정말 훌륭한 만화 작가예요! 🎉',
  completionDate: '2026년 6월 19일',
}

export const mockStudentWorks: StudentWork[] = [
  {
    id: 'w1',
    title: '우주 탐사선의 분수 연료 계산',
    subject: '수학',
    grade: '초5',
    completedAt: '2026-06-18',
    status: '완료',
    stars: 5,
    coverEmoji: '🚀',
    coverGradient: 'from-purple-400 to-blue-500',
  },
  {
    id: 'w2',
    title: '태양계 행성 탐험대',
    subject: '과학',
    grade: '초5',
    completedAt: '2026-06-15',
    status: '완료',
    stars: 4,
    coverEmoji: '🪐',
    coverGradient: 'from-sky-400 to-indigo-500',
  },
  {
    id: 'w3',
    title: '이야기의 기승전결 만들기',
    subject: '국어',
    grade: '초5',
    status: '진행 중',
    stars: 0,
    coverEmoji: '📖',
    coverGradient: 'from-pink-400 to-purple-500',
  },
]
