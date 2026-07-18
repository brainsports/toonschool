import { supabase } from '../../../shared/lib/supabase';
import { fetchStudentsByTeacher } from '../../admin-lms/services/studentService';
import type { MindmapProject, MindmapProjectStatus } from '../types/mindmap';
import type {
  MindmapEvaluation,
  MindmapNodeFeedback,
  TeacherMindmapItem,
} from '../types/mindmapEvaluation';

export const MINDMAP_STATUS_LABELS: Record<MindmapProjectStatus, string> = {
  draft: '작성 중',
  completed: '제출 준비',
  submitted: '제출 완료',
  pending_review: '확인 대기',
  evaluated: '평가 완료',
  revision_requested: '수정 요청',
  resubmitted: '재제출',
};

export const EVALUATION_RUBRICS = [
  { key: 'understandingScore', label: '핵심 내용 이해', description: '단원의 중요한 내용을 정확하게 담았는지 평가합니다.' },
  { key: 'connectionScore', label: '중심 주제와 가지 연결', description: '중심 주제와 가지의 관계가 자연스러운지 평가합니다.' },
  { key: 'detailScore', label: '내용의 구체성', description: '자세하고 이해하기 쉽게 설명했는지 평가합니다.' },
  { key: 'accuracyScore', label: '내용의 정확성', description: '잘못된 개념이나 오해가 없는지 평가합니다.' },
  { key: 'presentationScore', label: '표현과 구성', description: '구조와 글자, 색상, 배치가 읽기 편한지 평가합니다.' },
] as const;

export const QUICK_PRAISE = [
  '중심 주제를 잘 정했어요.',
  '중요한 내용을 빠짐없이 넣었어요.',
  '가지 연결이 아주 자연스러워요.',
  '설명을 자신의 말로 잘 표현했어요.',
  '툰마인드가 보기 쉽게 정리되었어요.',
  '지난 작품보다 훨씬 발전했어요.',
];

export const QUICK_REVISION = [
  '중요한 내용을 한 가지 더 찾아보세요.',
  '중심 주제와 관련이 적은 가지를 다시 살펴보세요.',
  '설명을 한 문장 더 자세히 적어보세요.',
  '같은 내용이 반복되지 않았는지 확인해 보세요.',
  '틀린 개념이 없는지 교과서를 다시 확인해 보세요.',
  '글자가 겹치지 않도록 가지 위치를 조정해 보세요.',
];

interface EvaluationRow {
  id: string;
  mindmap_id: string;
  version: number;
  student_id: string;
  teacher_id: string;
  class_id: string | null;
  status: 'evaluated' | 'revision_requested';
  understanding_score: number;
  connection_score: number;
  detail_score: number;
  accuracy_score: number;
  presentation_score: number;
  total_score: number;
  teacher_feedback: string;
  node_feedback: MindmapNodeFeedback[];
  excellent_praise: boolean;
  evaluated_at: string;
}

function evaluationFromRow(row: EvaluationRow): MindmapEvaluation {
  return {
    id: row.id,
    mindmapId: row.mindmap_id,
    version: row.version,
    studentId: row.student_id,
    teacherId: row.teacher_id,
    classId: row.class_id,
    status: row.status,
    understandingScore: row.understanding_score,
    connectionScore: row.connection_score,
    detailScore: row.detail_score,
    accuracyScore: row.accuracy_score,
    presentationScore: row.presentation_score,
    totalScore: row.total_score,
    teacherFeedback: row.teacher_feedback,
    nodeFeedback: row.node_feedback ?? [],
    excellentPraise: row.excellent_praise,
    evaluatedAt: row.evaluated_at,
  };
}

export function scoreMessage(score: number): string {
  if (score >= 90) return '아주 잘했어요';
  if (score >= 75) return '잘했어요';
  if (score >= 60) return '조금만 더 생각해 봐요';
  return '다시 살펴봐요';
}

export function validateSubmission(project: MindmapProject): string[] {
  const issues: string[] = [];
  const central = project.nodes.find((node) => node.type === 'central');
  const mains = project.nodes.filter((node) => node.parentId === central?.id && node.type === 'main');
  if (!central?.title.trim()) issues.push('중심 주제를 적어 주세요.');
  if (mains.length < 4) issues.push('1차 가지를 4개 이상 만들어 주세요.');
  for (const main of mains) {
    const children = project.nodes.filter((node) => node.parentId === main.id);
    if (children.length < 1) issues.push(`“${main.title || '이름 없는 가지'}”에 2차 가지를 하나 이상 더해 주세요.`);
  }
  if (project.nodes.some((node) => !node.title.trim())) issues.push('비어 있는 가지 이름을 채워 주세요.');
  const explanationLength = project.nodes.reduce((sum, node) => sum + (node.description?.trim().length ?? 0), 0);
  if (explanationLength < 20) issues.push('설명을 합쳐서 20글자 이상 적어 주세요.');
  if (!project.lastRenderOk) issues.push('화면에 잘 보이지 않는 부분을 고친 뒤 다시 저장해 주세요.');
  return [...new Set(issues)];
}

export async function submitMindmapForReview(project: MindmapProject): Promise<void> {
  const issues = validateSubmission(project);
  if (issues.length) throw new Error(issues.join('\n'));
  const { error } = await supabase.rpc('submit_mindmap', { p_mindmap_id: project.id });
  if (error) throw new Error(error.message || '제출하지 못했어요.');
}

export async function getMindmapEvaluations(mindmapId: string): Promise<MindmapEvaluation[]> {
  const { data, error } = await supabase
    .from('mindmap_evaluations')
    .select('*')
    .eq('mindmap_id', mindmapId)
    .order('evaluated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as EvaluationRow[]).map(evaluationFromRow);
}

export async function listTeacherMindmaps(): Promise<TeacherMindmapItem[]> {
  const students = await fetchStudentsByTeacher(0);
  if (!students.length) return [];
  const studentMap = new Map(students.map((student) => [student.id, student]));
  const ids = students.map((student) => student.id);
  const { data: projects, error } = await supabase
    .from('mindmap_projects')
    .select('id,student_id,student_name,class_id,grade,grade_name,subject,semester,unit_id,unit_title,central_topic,creation_method,status,nodes,thumbnail_url,version,submitted_at,evaluated_at,revision_count,updated_at')
    .in('student_id', ids)
    .order('submitted_at', { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  const projectIds = (projects ?? []).map((row) => row.id as string);
  let evaluations: EvaluationRow[] = [];
  if (projectIds.length) {
    const result = await supabase.from('mindmap_evaluations').select('*').in('mindmap_id', projectIds);
    if (result.error) throw new Error(result.error.message);
    evaluations = (result.data ?? []) as EvaluationRow[];
  }
  const latest = new Map<string, MindmapEvaluation>();
  for (const row of evaluations.sort((a, b) => b.version - a.version)) {
    if (!latest.has(row.mindmap_id)) latest.set(row.mindmap_id, evaluationFromRow(row));
  }
  return (projects ?? []).map((row) => {
    const student = studentMap.get(row.student_id as string);
    return {
      id: row.id as string,
      studentId: row.student_id as string,
      studentName: (row.student_name as string | null) || student?.name || '학생',
      classId: row.class_id as string | null,
      className: student?.className || `${row.grade}학년`,
      grade: Number(row.grade),
      subject: row.subject as string,
      semester: Number(row.semester),
      unitId: row.unit_id as string,
      unitTitle: row.unit_title as string,
      centralTopic: row.central_topic as string,
      creationMethod: (row.creation_method as 'direct' | 'ai') ?? 'direct',
      status: row.status as MindmapProjectStatus,
      nodes: (row.nodes ?? []) as TeacherMindmapItem['nodes'],
      thumbnailUrl: row.thumbnail_url as string | null,
      version: Number(row.version),
      submittedAt: row.submitted_at as string | null,
      evaluatedAt: (row.evaluated_at as string | null) ?? null,
      revisionCount: Number(row.revision_count ?? 0),
      updatedAt: row.updated_at as string,
      evaluation: latest.get(row.id as string) ?? null,
    };
  });
}

export interface SaveEvaluationInput {
  mindmapId: string;
  status: 'evaluated' | 'revision_requested';
  understandingScore: number;
  connectionScore: number;
  detailScore: number;
  accuracyScore: number;
  presentationScore: number;
  feedback: string;
  nodeFeedback: MindmapNodeFeedback[];
  excellentPraise: boolean;
}

export async function saveMindmapEvaluation(input: SaveEvaluationInput): Promise<MindmapEvaluation> {
  const scores = [
    input.understandingScore,
    input.connectionScore,
    input.detailScore,
    input.accuracyScore,
    input.presentationScore,
  ];
  if (scores.some((score) => !Number.isFinite(score) || score < 0 || score > 20)) {
    throw new Error('각 점수는 0점부터 20점 사이로 입력해 주세요.');
  }
  const { data, error } = await supabase.rpc('save_mindmap_evaluation', {
    p_mindmap_id: input.mindmapId,
    p_status: input.status,
    p_understanding: input.understandingScore,
    p_connection: input.connectionScore,
    p_detail: input.detailScore,
    p_accuracy: input.accuracyScore,
    p_presentation: input.presentationScore,
    p_feedback: input.feedback,
    p_node_feedback: input.nodeFeedback,
    p_excellent_praise: input.excellentPraise,
  });
  if (error) throw new Error(error.message || '평가를 저장하지 못했습니다.');
  return evaluationFromRow(data as EvaluationRow);
}

export interface StudentMindmapWorkSummary {
  id: string;
  subject: string;
  unitTitle: string;
  centralTopic: string;
  status: MindmapProjectStatus;
  creationMethod: 'direct' | 'ai';
  submittedAt: string | null;
  evaluatedAt: string | null;
  revisionCount: number;
  totalScore: number | null;
  teacherFeedback: string | null;
  understandingScore: number | null;
  connectionScore: number | null;
  detailScore: number | null;
  accuracyScore: number | null;
  presentationScore: number | null;
}

export interface StudentMindmapSummary {
  works: StudentMindmapWorkSummary[];
  totalCount: number;
  subjectCounts: { subject: string; count: number }[];
  evaluatedCount: number;
  revisionRequestedCount: number;
  resubmittedCount: number;
  averageScore: number | null;
  recent: StudentMindmapWorkSummary | null;
  recentFeedback: string | null;
  scoreTrend: { evaluatedAt: string; totalScore: number }[];
}

/**
 * 특정 학생의 툰마인드 활동 요약(교사 학생상세 화면용).
 * 담당 교사는 is_assigned_mindmap_teacher RLS 로 본인 학생 범위 읽기 허용.
 */
export async function getStudentMindmapSummary(studentId: string): Promise<StudentMindmapSummary> {
  const { data: projects, error } = await supabase
    .from('mindmap_projects')
    .select('id,subject,unit_title,central_topic,status,creation_method,submitted_at,evaluated_at,revision_count')
    .eq('student_id', studentId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);

  const projectRows = (projects ?? []) as Array<{
    id: string; subject: string; unit_title: string; central_topic: string;
    status: MindmapProjectStatus; creation_method: 'direct' | 'ai';
    submitted_at: string | null; evaluated_at: string | null; revision_count: number;
  }>;
  const projectIds = projectRows.map((row) => row.id);

  let evaluations: EvaluationRow[] = [];
  if (projectIds.length) {
    const result = await supabase.from('mindmap_evaluations').select('*').in('mindmap_id', projectIds);
    if (result.error) throw new Error(result.error.message);
    evaluations = (result.data ?? []) as EvaluationRow[];
  }

  // 작품별 최신 평가(버전 내림차순).
  const latestEvalByProject = new Map<string, EvaluationRow>();
  for (const row of evaluations.sort((a, b) => b.version - a.version)) {
    if (!latestEvalByProject.has(row.mindmap_id)) latestEvalByProject.set(row.mindmap_id, row);
  }

  const works: StudentMindmapWorkSummary[] = projectRows.map((row) => {
    const ev = latestEvalByProject.get(row.id);
    return {
      id: row.id,
      subject: row.subject || '',
      unitTitle: row.unit_title || '',
      centralTopic: row.central_topic || '',
      status: row.status,
      creationMethod: row.creation_method ?? 'direct',
      submittedAt: row.submitted_at,
      evaluatedAt: row.evaluated_at,
      revisionCount: Number(row.revision_count ?? 0),
      totalScore: ev?.total_score ?? null,
      teacherFeedback: ev?.teacher_feedback ?? null,
      understandingScore: ev ? ev.understanding_score : null,
      connectionScore: ev ? ev.connection_score : null,
      detailScore: ev ? ev.detail_score : null,
      accuracyScore: ev ? ev.accuracy_score : null,
      presentationScore: ev ? ev.presentation_score : null,
    };
  });

  const evaluated = evaluations.filter((row) => row.status === 'evaluated');
  const evaluatedScores = evaluated.map((row) => row.total_score);
  const averageScore = evaluatedScores.length
    ? Math.round((evaluatedScores.reduce((a, b) => a + b, 0) / evaluatedScores.length) * 10) / 10
    : null;

  const subjectMap = new Map<string, number>();
  for (const work of works) {
    const key = work.subject || '미지정';
    subjectMap.set(key, (subjectMap.get(key) ?? 0) + 1);
  }

  const scoreTrend = evaluated
    .slice()
    .sort((a, b) => new Date(a.evaluated_at).getTime() - new Date(b.evaluated_at).getTime())
    .map((row) => ({ evaluatedAt: row.evaluated_at, totalScore: row.total_score }));

  const recentFeedback = evaluated
    .slice()
    .sort((a, b) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime())
    .find((row) => (row.teacher_feedback ?? '').trim())?.teacher_feedback ?? null;

  return {
    works,
    totalCount: works.length,
    subjectCounts: [...subjectMap.entries()].map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count),
    evaluatedCount: works.filter((w) => w.status === 'evaluated').length,
    revisionRequestedCount: works.filter((w) => w.status === 'revision_requested').length,
    resubmittedCount: works.filter((w) => w.status === 'resubmitted').length,
    averageScore,
    recent: works[0] ?? null,
    recentFeedback,
    scoreTrend,
  };
}
