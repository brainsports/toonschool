import { supabase } from '../../../shared/lib/supabase';
import { geminiClient } from '../../../shared/lib/gemini';
import type { StudentGrowthEvaluation, StudentGrowthDashboardData } from '../types/studentGrowth';
import { loadComicProjectData } from '../components/editor/utils/comicStorage';

const FALLBACK_EVALUATION = {
  understanding_score: 18,
  summary_score: 18,
  expression_score: 18,
  thinking_score: 18,
  completion_score: 18,
  total_score: 90,
  strength_feedback: '작품을 끝까지 완성하며 배운 내용을 잘 표현했어요.',
  improvement_feedback: '다음 작품에서는 핵심 내용을 조금 더 짧고 분명하게 정리해 보세요.'
};

export async function getLatestStudentGrowthEvaluation(studentId: string): Promise<StudentGrowthEvaluation | null> {
  const { data, error } = await supabase
    .from('student_growth_evaluations')
    .select('*')
    .eq('student_id', studentId)
    .order('evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[studentGrowthService] getLatestStudentGrowthEvaluation error:', error);
    return null;
  }
  return data;
}

export async function getPreviousStudentGrowthEvaluation(studentId: string, latestEvaluatedAt: string): Promise<StudentGrowthEvaluation | null> {
  const { data, error } = await supabase
    .from('student_growth_evaluations')
    .select('*')
    .eq('student_id', studentId)
    .lt('evaluated_at', latestEvaluatedAt)
    .order('evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[studentGrowthService] getPreviousStudentGrowthEvaluation error:', error);
    return null;
  }
  return data;
}

export async function getStudentGrowthDashboard(studentId: string): Promise<StudentGrowthDashboardData> {
  const latest = await getLatestStudentGrowthEvaluation(studentId);
  let previous = null;
  let delta = null;

  if (latest) {
    previous = await getPreviousStudentGrowthEvaluation(studentId, latest.evaluated_at);
    if (previous) {
      delta = latest.total_score - previous.total_score;
    }
  }

  return { latest, previous, delta };
}

export async function createStudentGrowthEvaluation(input: Omit<StudentGrowthEvaluation, 'id' | 'evaluated_at' | 'created_at'>): Promise<StudentGrowthEvaluation | null> {
  const { data, error } = await supabase
    .from('student_growth_evaluations')
    .insert(input)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('[studentGrowthService] createStudentGrowthEvaluation error:', error);
    return null;
  }
  return data;
}

export async function createGrowthEvaluationForSharedComic(projectId: string, studentId: string): Promise<StudentGrowthEvaluation | null> {
  try {
    // 1. 중복 평가 확인
    const { data: existing } = await supabase
      .from('student_growth_evaluations')
      .select('*')
      .eq('student_id', studentId)
      .eq('comic_id', projectId)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    // 2. 작품 데이터 수집
    const projectData = loadComicProjectData(projectId);
    let evaluationData = { ...FALLBACK_EVALUATION };

    if (projectData) {
      const pd = projectData as any;
      const comicContent = JSON.stringify({
        title: pd.title || pd.topicTitle || pd.content?.topicTitle,
        subject: pd.subject || pd.content?.subject,
        summary: pd.summary || pd.content?.summary,
        script: pd.script,
        selectedStoryDescription: pd.selectedStoryDescription
      });

      const prompt = `
당신은 초등학생을 가르치는 따뜻하고 격려하는 선생님입니다.
학생이 배운 내용을 바탕으로 만화를 완성했습니다. 아래의 작품 데이터를 보고 5가지 항목을 평가해주세요.

작품 데이터:
${comicContent}

평가 기준 (각 항목 20점 만점):
1. understanding_score: 단원의 핵심 개념이 작품에 잘 들어갔는가
2. summary_score: 중요한 내용을 짧고 정확하게 정리했는가
3. expression_score: 대사와 장면 흐름이 자연스러운가
4. thinking_score: 질문, 퀴즈, 생활 적용, 문제 해결 장면이 있는가
5. completion_score: 작품을 끝까지 완성했고 공유 가능한 상태인가 (완성 작품이므로 보통 18~20점 부여)

프롬프트 문체:
- 초등학생에게 말하는 따뜻한 선생님 말투로 작성해주세요. 비난은 금지합니다.
- strength_feedback: 이번 작품에서 잘한 점 1문장.
- improvement_feedback: 다음에 더 좋아질 점 1문장.

아래 JSON 형식으로만 응답해주세요 (다른 말은 하지 마세요):
{
  "understanding_score": 19,
  "summary_score": 18,
  "expression_score": 17,
  "thinking_score": 19,
  "completion_score": 20,
  "total_score": 93,
  "strength_feedback": "단원의 핵심 내용을 만화 장면에 잘 담았어요.",
  "improvement_feedback": "대사를 조금 더 짧게 쓰면 친구들이 더 쉽게 읽을 수 있어요."
}
`;
      try {
        const aiResponseText = await geminiClient.generateText(prompt);
        // Extract JSON from response
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (
            typeof parsed.understanding_score === 'number' &&
            typeof parsed.total_score === 'number' &&
            typeof parsed.strength_feedback === 'string'
          ) {
            evaluationData = {
              understanding_score: parsed.understanding_score,
              summary_score: parsed.summary_score,
              expression_score: parsed.expression_score,
              thinking_score: parsed.thinking_score,
              completion_score: parsed.completion_score,
              total_score: parsed.total_score,
              strength_feedback: parsed.strength_feedback,
              improvement_feedback: parsed.improvement_feedback
            };
          }
        }
      } catch (aiError) {
        console.error('[studentGrowthService] AI 평가 실패, fallback 사용:', aiError);
      }
    }

    // 3. 평가 결과 저장
    const pd = projectData as any;
    const unitId = pd?.content?.curriculum?.unitId || null;
    
    return await createStudentGrowthEvaluation({
      student_id: studentId,
      comic_id: projectId,
      unit_id: unitId,
      ...evaluationData
    });

  } catch (error) {
    console.error('[studentGrowthService] 성장기록 생성 중 오류:', error);
    return null;
  }
}
