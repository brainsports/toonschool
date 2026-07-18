/**
 * 성장 현황 통합 집계 서비스(요구사항 #10).
 *
 * 만화 평가(student_growth_evaluations)와 툰마인드 평가(mindmap_evaluations)를
 * 각각 별도로 가져와 5대 영역으로 변환한 뒤, 통합은 영역별 평균으로 계산한다.
 *
 * 계산을 읽기 시점에 수행한다 → 툰마인드 평가가 변경/추가되면 자동으로 반영된다.
 * (별도 집계 테이블을 두지 않아 staleness/stale-aggregation 문제가 없다.)
 *
 * 주의(RLS): 만화 평가(student_growth_evaluations)는 본인만 읽을 수 있다.
 * 따라서 본 서비스는 학생 본인 컨텍스트에서 사용한다(학생 마이페이지).
 * 교사 화면은 툰마인드 평가(mindmap_evaluations, 담당 학생 범위 읽기 허용)를 사용한다.
 */
import { supabase } from '../../../shared/lib/supabase';
import { getStudentGrowthDashboard } from './studentGrowthService';
import {
  areasTotal,
  averageAreas,
  comicEvalToAreas,
  toonmindEvalToAreas,
  type GrowthAreas,
} from '../utils/growthAreas';
import type { StudentGrowthEvaluation } from '../types/studentGrowth';

interface MindmapEvaluationLite {
  id: string;
  totalScore: number;
  evaluatedAt: string;
  understandingScore: number;
  connectionScore: number;
  detailScore: number;
  accuracyScore: number;
  presentationScore: number;
  teacherFeedback: string;
}

interface EvaluationRow {
  id: string;
  total_score: number;
  evaluated_at: string;
  understanding_score: number;
  connection_score: number;
  detail_score: number;
  accuracy_score: number;
  presentation_score: number;
  teacher_feedback: string;
}

function liteFromRow(row: EvaluationRow): MindmapEvaluationLite {
  return {
    id: row.id,
    totalScore: row.total_score,
    evaluatedAt: row.evaluated_at,
    understandingScore: row.understanding_score,
    connectionScore: row.connection_score,
    detailScore: row.detail_score,
    accuracyScore: row.accuracy_score,
    presentationScore: row.presentation_score,
    teacherFeedback: row.teacher_feedback ?? '',
  };
}

export interface UnifiedGrowthDashboard {
  comic: {
    latest: StudentGrowthEvaluation | null;
    previous: StudentGrowthEvaluation | null;
    delta: number | null;
    areas: GrowthAreas;
    total: number | null;
  };
  toonmind: {
    latest: MindmapEvaluationLite | null;
    evaluatedCount: number;
    areas: GrowthAreas;
    total: number | null;
  };
  unified: {
    areas: GrowthAreas;
    total: number | null;
  };
  /** 두 출처 중 하나라도 데이터가 있는지(빈 상태 판정용). */
  hasAny: boolean;
}

export async function getUnifiedGrowthDashboard(studentId: string): Promise<UnifiedGrowthDashboard> {
  // 만화 평가 + 직전 대비 delta(기존 서비스 재사용).
  const comicDashboard = await getStudentGrowthDashboard(studentId);
  const comicAreas = comicEvalToAreas(comicDashboard.latest);

  // 툰마인드 평가: 본인 최근 평가 1건 + 평가 완료 건수.
  const [latestEval, countResult] = await Promise.all([
    supabase
      .from('mindmap_evaluations')
      .select('id,total_score,evaluated_at,understanding_score,connection_score,detail_score,accuracy_score,presentation_score,teacher_feedback')
      .eq('student_id', studentId)
      .eq('status', 'evaluated')
      .order('evaluated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('mindmap_evaluations').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('status', 'evaluated'),
  ]);

  let toonmindLatest: MindmapEvaluationLite | null = null;
  if (latestEval.error) {
    // 테이블이 없거나 RLS 미적용시 조용히 폴백(만화만 표시).
    console.error('[growthAggregationService] toonmind latest fetch error:', latestEval.error);
  } else if (latestEval.data) {
    toonmindLatest = liteFromRow(latestEval.data as EvaluationRow);
  }
  const evaluatedCount = countResult.error ? 0 : countResult.count ?? 0;
  const toonmindAreas = toonmindEvalToAreas(toonmindLatest);

  const unifiedAreas = averageAreas(comicAreas, toonmindAreas);

  return {
    comic: {
      latest: comicDashboard.latest,
      previous: comicDashboard.previous,
      delta: comicDashboard.delta,
      areas: comicAreas,
      total: comicDashboard.latest?.total_score ?? areasTotal(comicAreas),
    },
    toonmind: {
      latest: toonmindLatest,
      evaluatedCount,
      areas: toonmindAreas,
      total: toonmindLatest?.totalScore ?? areasTotal(toonmindAreas),
    },
    unified: {
      areas: unifiedAreas,
      total: areasTotal(unifiedAreas),
    },
    hasAny: Boolean(comicDashboard.latest) || Boolean(toonmindLatest),
  };
}
