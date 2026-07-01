// ──────────────────────────────────────────────
// 서비스 - 평가 (현재 mock, 추후 Supabase 연결)
// TODO: assessment_records, assessment_area_scores, assessment_reports 연결
// ──────────────────────────────────────────────
import type { AssessmentRecord, AssessmentReport } from '../types/assessment'
import { MOCK_ASSESSMENTS, MOCK_REPORTS } from '../data/mockAssessments'

export async function fetchAssessmentsByClass(classId: string): Promise<AssessmentRecord[]> {
  return Promise.resolve(MOCK_ASSESSMENTS.filter(a => a.classId === classId))
}

export async function fetchAssessmentByStudent(studentId: string): Promise<AssessmentRecord | null> {
  return Promise.resolve(MOCK_ASSESSMENTS.find(a => a.studentId === studentId) ?? null)
}

export async function fetchReportByStudent(studentId: string): Promise<AssessmentReport | null> {
  return Promise.resolve(MOCK_REPORTS.find(r => r.studentId === studentId) ?? null)
}

export async function saveTeacherComment(reportId: string, comment: string): Promise<void> {
  // TODO: supabase.from('assessment_reports').update({ teacher_comment: comment })...
  const report = MOCK_REPORTS.find(r => r.id === reportId)
  if (report) report.teacherComment = comment
}
