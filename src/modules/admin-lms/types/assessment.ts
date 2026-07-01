// ──────────────────────────────────────────────
// 툰스쿨 관리 LMS - 평가 타입 정의
// Supabase 테이블: assessment_records, assessment_area_scores, assessment_reports
// ──────────────────────────────────────────────

/** 5대 평가영역 */
export interface AssessmentAreaScores {
  understanding: number    // 단원 이해력 (0~20)
  summarizing: number      // 요약·정리력 (0~20)
  expression: number       // 이야기 표현력 (0~20)
  problemSolving: number   // 문제해결·퀴즈 활용력 (0~20)
  sharing: number          // 성장·공유 태도 (0~20)
}

/** 성장 단계 */
export type GrowthStage = 'seed' | 'sprout' | 'tree' | 'fruit'

export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  seed: '🌱 씨앗',
  sprout: '🌿 새싹',
  tree: '🌳 나무',
  fruit: '🍎 열매',
}

export const GROWTH_STAGE_DESC: Record<GrowthStage, string> = {
  seed: '아직 배우는 중이에요',
  sprout: '기본 내용을 이해했어요',
  tree: '내용을 정리하고 표현할 수 있어요',
  fruit: '친구에게 설명하고 공유할 수 있어요',
}

export function getGrowthStage(totalScore: number): GrowthStage {
  if (totalScore >= 85) return 'fruit'
  if (totalScore >= 65) return 'tree'
  if (totalScore >= 40) return 'sprout'
  return 'seed'
}

/** assessment_records 테이블 대응 */
export interface AssessmentRecord {
  id: string
  studentId: string
  studentName: string
  classId: string
  className: string
  grade: number
  period: string          // 예: '2026-1학기'
  totalScore: number      // 0~100
  growthStage: GrowthStage
  areas: AssessmentAreaScores
  lastAssessedAt: string
  initialScore?: number   // 최초 진단 점수
}

/** assessment_reports 테이블 대응 */
export interface AssessmentReport {
  id: string
  studentId: string
  recordId: string
  aiComment: string       // AI 300자 성장 평가서
  teacherComment: string  // 선생님 한 줄 의견
  createdAt: string
}

export const AREA_LABELS: Record<keyof AssessmentAreaScores, string> = {
  understanding: '단원 이해력',
  summarizing: '요약·정리력',
  expression: '이야기 표현력',
  problemSolving: '문제해결·퀴즈 활용력',
  sharing: '성장·공유 태도',
}

export const AREA_COLORS: Record<keyof AssessmentAreaScores, string> = {
  understanding: '#ff6b9d',
  summarizing: '#a78bfa',
  expression: '#60a5fa',
  problemSolving: '#34d399',
  sharing: '#fbbf24',
}
