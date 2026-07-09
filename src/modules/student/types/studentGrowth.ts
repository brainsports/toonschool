export interface StudentGrowthEvaluation {
  id: string;
  student_id: string;
  comic_id: string;
  unit_id: string | null;
  understanding_score: number;
  summary_score: number;
  expression_score: number;
  thinking_score: number;
  completion_score: number;
  total_score: number;
  strength_feedback: string;
  improvement_feedback: string;
  evaluated_at: string;
  created_at: string;
}

export interface StudentGrowthDashboardData {
  latest: StudentGrowthEvaluation | null;
  previous: StudentGrowthEvaluation | null;
  delta: number | null;
}
