// ──────────────────────────────────────────────
// 샘플 데이터 - 평가
// ──────────────────────────────────────────────
import type { AssessmentRecord, AssessmentReport } from '../types/assessment'
import { getGrowthStage } from '../types/assessment'

export const MOCK_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: 'asr-1', studentId: 'stu-501', studentName: '이도준',
    classId: 'cls-7', className: '5학년 1반', grade: 5,
    period: '2026-1학기',
    totalScore: 88, growthStage: getGrowthStage(88),
    areas: { understanding: 18, summarizing: 17, expression: 18, problemSolving: 17, sharing: 18 },
    lastAssessedAt: '2026.06.25', initialScore: 62,
  },
  {
    id: 'asr-2', studentId: 'stu-502', studentName: '김나연',
    classId: 'cls-7', className: '5학년 1반', grade: 5,
    period: '2026-1학기',
    totalScore: 72, growthStage: getGrowthStage(72),
    areas: { understanding: 15, summarizing: 14, expression: 14, problemSolving: 15, sharing: 14 },
    lastAssessedAt: '2026.06.25', initialScore: 55,
  },
  {
    id: 'asr-3', studentId: 'stu-503', studentName: '박준서',
    classId: 'cls-7', className: '5학년 1반', grade: 5,
    period: '2026-1학기',
    totalScore: 58, growthStage: getGrowthStage(58),
    areas: { understanding: 12, summarizing: 11, expression: 12, problemSolving: 12, sharing: 11 },
    lastAssessedAt: '2026.06.24', initialScore: 48,
  },
  {
    id: 'asr-4', studentId: 'stu-504', studentName: '최아린',
    classId: 'cls-7', className: '5학년 1반', grade: 5,
    period: '2026-1학기',
    totalScore: 95, growthStage: getGrowthStage(95),
    areas: { understanding: 19, summarizing: 19, expression: 19, problemSolving: 19, sharing: 19 },
    lastAssessedAt: '2026.06.26', initialScore: 70,
  },
  {
    id: 'asr-5', studentId: 'stu-505', studentName: '정민재',
    classId: 'cls-7', className: '5학년 1반', grade: 5,
    period: '2026-1학기',
    totalScore: 35, growthStage: getGrowthStage(35),
    areas: { understanding: 7, summarizing: 7, expression: 7, problemSolving: 7, sharing: 7 },
    lastAssessedAt: '2026.06.23', initialScore: 30,
  },
  {
    id: 'asr-6', studentId: 'stu-506', studentName: '홍수빈',
    classId: 'cls-7', className: '5학년 1반', grade: 5,
    period: '2026-1학기',
    totalScore: 76, growthStage: getGrowthStage(76),
    areas: { understanding: 15, summarizing: 16, expression: 15, problemSolving: 15, sharing: 15 },
    lastAssessedAt: '2026.06.25', initialScore: 60,
  },
]

export const MOCK_REPORTS: AssessmentReport[] = [
  {
    id: 'rep-1', studentId: 'stu-501', recordId: 'asr-1',
    aiComment: '이도준 학생은 단원의 핵심 내용을 잘 이해하고 있으며, 만화 장면을 통해 설명하는 힘이 좋아지고 있습니다. 요점 정리 문장이 점점 짧고 분명해지고 있어 학습 내용 전달력이 향상되었습니다. 퀴즈 결과에서도 오답이 줄어드는 성장이 확인됩니다. 앞으로는 친구들과 더 적극적으로 작품을 공유하며 설명하는 연습을 이어가면 열매 단계를 더 깊이 완성할 수 있습니다.',
    teacherComment: '',
    createdAt: '2026.06.25',
  },
  {
    id: 'rep-4', studentId: 'stu-504', recordId: 'asr-4',
    aiComment: '최아린 학생은 모든 평가 영역에서 고르게 높은 성취를 보이고 있습니다. 만화 표현이 생동감 있고, 요약 정리 능력이 뛰어납니다. 친구의 작품에 피드백을 주는 공유 활동에서도 긍정적인 태도가 돋보입니다. 앞으로도 이 수준을 유지하고, 더 다양한 단원에 도전해 보기를 권합니다.',
    teacherComment: '정말 열심히 하는 학생입니다. 칭찬해 주었습니다.',
    createdAt: '2026.06.26',
  },
]
