/**
 * 성장 현황 5대 영역 통합 집계 — 순수 함수(부작용 없음).
 *
 * 설계(요구사항 #10):
 *  만화 평가 원본(student_growth_evaluations)과 툰마인드 평가 원본(mindmap_evaluations)은
 *  별도로 저장되며, 성장 현황 화면에서만 통합 집계한다.
 *  한 영역에 여러 평가 항목이 연결되면 합산이 아닌 평균을 사용한다.
 *
 *  5대 성장 영역(만화 학생 노출 라벨 기준):
 *    understanding  배운 내용 이해
 *    summarizing    핵심 정리
 *    expression     창의적 표현
 *    problemSolving 생각 확장
 *    sharing        완성 태도
 *
 *  툰마인드 평가 항목 → 영역 매핑(요구사항 #10):
 *    핵심 내용 이해(understandingScore) → 배운 내용 이해(understanding)
 *    중심 주제와 가지 연결(connectionScore) → 핵심 정리(summarizing)
 *    내용의 구체성(detailScore) → 생각 확장(problemSolving)
 *    내용의 정확성(accuracyScore) → 배운 내용 이해(understanding)  [같은 영역 2개 → 평균]
 *    표현과 구성(presentationScore) → 창의적 표현(expression)
 *    (완성 태도 영역은 툰마인드 항목과 직접 대응이 없어 null → 만화 평가로 채운다)
 *
 *  null = "이 출처에 해당 영역 데이터가 없다" 를 뜻한다(0점과 구분).
 */

export type GrowthAreaKey = 'understanding' | 'summarizing' | 'expression' | 'problemSolving' | 'sharing';

/** 5대 영역 점수. null = 해당 출처에 데이터 없음. */
export type GrowthAreas = Record<GrowthAreaKey, number | null>;

export const GROWTH_AREA_KEYS: GrowthAreaKey[] = ['understanding', 'summarizing', 'expression', 'problemSolving', 'sharing'];

export const GROWTH_AREA_LABELS: Record<GrowthAreaKey, string> = {
  understanding: '배운 내용 이해',
  summarizing: '핵심 정리',
  expression: '창의적 표현',
  problemSolving: '생각 확장',
  sharing: '완성 태도',
};

const EMPTY_AREAS: GrowthAreas = { understanding: null, summarizing: null, expression: null, problemSolving: null, sharing: null };

function clamp20(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(20, Math.round(value)));
}

/** 만화 평가 5항목 → 5대 영역(1:1). */
export function comicEvalToAreas(input: {
  understanding_score?: number | null;
  summary_score?: number | null;
  expression_score?: number | null;
  thinking_score?: number | null;
  completion_score?: number | null;
} | null): GrowthAreas {
  if (!input) return { ...EMPTY_AREAS };
  return {
    understanding: clamp20(input.understanding_score),
    summarizing: clamp20(input.summary_score),
    expression: clamp20(input.expression_score),
    problemSolving: clamp20(input.thinking_score),
    sharing: clamp20(input.completion_score),
  };
}

/** 툰마인드 평가 5항목 → 5대 영역(매핑 + understanding 평균). camelCase(MindmapEvaluation 호환). */
export function toonmindEvalToAreas(input: {
  understandingScore?: number | null;
  connectionScore?: number | null;
  detailScore?: number | null;
  accuracyScore?: number | null;
  presentationScore?: number | null;
} | null): GrowthAreas {
  if (!input) return { ...EMPTY_AREAS };
  const understanding = clamp20(input.understandingScore);
  const accuracy = clamp20(input.accuracyScore);
  // 같은 영역에 2개 항목 → 평균(둘 다 있을 때만).
  const hasBoth = understanding !== null && accuracy !== null;
  const hasOne = understanding !== null || accuracy !== null;
  const understandingArea = hasBoth
    ? clamp20(((understanding as number) + (accuracy as number)) / 2)
    : hasOne
      ? (understanding ?? accuracy)
      : null;
  return {
    understanding: understandingArea,
    summarizing: clamp20(input.connectionScore),
    expression: clamp20(input.presentationScore),
    problemSolving: clamp20(input.detailScore),
    sharing: null, // 툰마인드 항목과 직접 대응 없음 → 만화 평가로 채움
  };
}

/** 여러 출처의 영역 점수를 영역별로 평균(데이터 있는 출처만). 모두 null이면 null. */
export function averageAreas(...sets: (GrowthAreas | null | undefined)[]): GrowthAreas {
  const result: GrowthAreas = { ...EMPTY_AREAS };
  for (const key of GROWTH_AREA_KEYS) {
    const values = sets
      .filter((set): set is GrowthAreas => Boolean(set))
      .map((set) => set[key])
      .filter((value): value is number => value !== null && Number.isFinite(value));
    result[key] = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }
  return result;
}

/** 영역 총점(0~100). null 영역은 0으로 간주. 출처 데이터가 전혀 없으면 null. */
export function areasTotal(areas: GrowthAreas): number | null {
  const hasAny = GROWTH_AREA_KEYS.some((key) => areas[key] !== null);
  if (!hasAny) return null;
  return GROWTH_AREA_KEYS.reduce((sum, key) => sum + (areas[key] ?? 0), 0);
}

/** 영역 점수를 화면용 {label, score, maxScore} 배열로 변환(null은 0 표시). */
export function areasToBars(areas: GrowthAreas): { label: string; score: number; maxScore: number }[] {
  return GROWTH_AREA_KEYS.map((key) => ({
    label: GROWTH_AREA_LABELS[key],
    score: areas[key] ?? 0,
    maxScore: 20,
  }));
}
