// 툰스쿨 학생 UI 전용 타입 정의

export type StudentGrade = '초3' | '초4' | '초5' | '초6'

export type StudentSubject = '국어' | '영어' | '수학' | '사회' | '과학'

export interface StudentProfile {
  id: string
  name: string
  grade: StudentGrade
  classNumber: string
  studentNumber: number
  avatarEmoji: string
  totalStars: number
  totalBadges: number
  streakDays: number
}

export interface AttendanceStatus {
  today: string // YYYY-MM-DD
  isCheckedIn: boolean
  streakDays: number
  weeklyAttendance: boolean[] // 월~금
  todayReward: AttendanceReward
}

export interface AttendanceReward {
  stars: number
  badge?: string
  message: string
}

export interface StudentUnit {
  id: string
  grade: StudentGrade
  subject: StudentSubject
  majorUnit: string
  subUnit: string
}

export interface ComicCut {
  id: string
  cutNumber: number
  sceneDescription: string
  speechBubble: string
  character: string
  emotion: string
  backgroundEmoji: string
}

export interface QuizQuestion {
  id: string
  type: 'OX' | 'multiple' | 'image'
  question: string
  options?: string[]
  answer: string | number
  emoji: string
}

export interface RewardResult {
  stars: number
  badges: RewardBadge[]
  message: string
  completionDate: string
}

export interface RewardBadge {
  id: string
  name: string
  emoji: string
  color: string
}

export type StudentFlowStep =
  | 'start'
  | 'login'
  | 'attendance'
  | 'my'
  | 'today'
  | 'select-unit'
  | 'topic'
  | 'comic-cut'
  | 'comic-full'
  | 'summary'
  | 'quiz'
  | 'back-cover'
  | 'complete'

export interface StudentWork {
  id: string
  title: string
  subject: StudentSubject
  grade: StudentGrade
  completedAt?: string
  status: '진행 중' | '완료' | '시작 전'
  stars: number
  coverEmoji: string
  coverGradient: string
}

export interface UnitSummary {
  title: string
  summary: string
  coreConcepts: CoreConcept[]
  relatedStory: string
}

export interface CoreConcept {
  id: string
  title: string
  description: string
  emoji: string
}
