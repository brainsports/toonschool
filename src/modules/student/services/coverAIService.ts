// 창작 표지/뒤표지 AI 서비스(프런트).
// - 추가 요청문 추천 3개: 기존 Gemini 텍스트 호출(geminiClient) 재사용.
// - 표지/뒤표지 이미지 생성: coverPromptBuilder + coverCacheService + coverEdge(EF) 조합.
//   이미지 생성 EF(generate-cover-image)는 만화 생성 보호 영역이라 별도 승인 후 배포.
import { geminiClient } from '../../../shared/lib/gemini';
import { TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL } from '../../../config/models';
import type { CreationCoverBaseInfo, BackCoverContentKey } from '../data/coverPresets';
import { buildCoverPrompt, sanitizeExtraRequest } from './coverPromptBuilder';
import { buildCoverCachePayload } from './coverCacheService';
import {
  invokeGenerateCoverImage,
  waitForCoverJob,
  type GenerateCoverImageResult,
} from '../../../shared/lib/coverEdge';

// 학생용 추가 요청문 후보 3개 생성.
export const generateExtraRequestSuggestions = async (
  baseInfo: CreationCoverBaseInfo,
  coverKind: 'front' | 'back'
): Promise<string[]> => {
  const ctx = [
    baseInfo.title && `제목: ${baseInfo.title}`,
    baseInfo.mainCharacter && `주인공: ${baseInfo.mainCharacter}`,
    baseInfo.supportingCharacters && `조연: ${baseInfo.supportingCharacters}`,
    baseInfo.location && `장소: ${baseInfo.location}`,
    baseInfo.importantObject && `중요 물건: ${baseInfo.importantObject}`,
    baseInfo.mood && `분위기: ${baseInfo.mood}`,
    baseInfo.keywords?.length && `키워드: ${baseInfo.keywords.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const target = coverKind === 'back' ? '뒤표지(배경 단순, 글자 여백 확보)' : '앞표지(주인공과 핵심 물건 강조)';

  const prompt = `초등학생이 만화 ${target}에 더 넣고 싶은 모습을 3개 제안해 줘.
각 문장은 아이가 쉽게 읽도록 짧고 친근한 "~하게 해 줘." 형태로 만들어.
작품 정보:
${ctx}
반드시 JSON 문자열 배열 3개로만 반환. 예: ["문장1", "문장2", "문장3"] 마크다운 코드블록 없이 순수 JSON만.`;

  for (const model of [TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL]) {
    if (!model) continue;
    try {
      const text = await geminiClient.generateTextWithModel(prompt, model);
      if (text.includes('API Key가 설정되지 않았습니다') || text.includes('오류가 발생했습니다')) {
        throw new Error(text);
      }
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr)) {
        return arr.filter((x) => typeof x === 'string' && x.trim()).slice(0, 3);
      }
    } catch {
      // 다음 모델로 폴백
    }
  }
  return [];
};

export interface GenerateCoverImageInput {
  projectId: string;
  grade?: string;
  subject?: string; // '창작'
  coverKind: 'front' | 'back';
  presetCode: string;
  compositionGuide: string;
  promptRule: string;
  baseInfo: CreationCoverBaseInfo;
  additionalPrompt: string;
  selectedContents?: BackCoverContentKey[];
  inheritFromFront?: boolean;
}

export interface GenerateCoverImageOutput {
  result: GenerateCoverImageResult;
  prompt: string; // 생성에 사용된 최종 프롬프트(이력 보관용)
}

// 표지/뒤표지 이미지 생성 — 프롬프트 조립 → 캐시 페이로드 → EF 호출 → (비동기면) 폴링.
export const generateCoverImage = async (input: GenerateCoverImageInput): Promise<GenerateCoverImageOutput> => {
  const safeAdditional = sanitizeExtraRequest(input.additionalPrompt);
  const prompt = buildCoverPrompt({
    coverKind: input.coverKind,
    baseInfo: input.baseInfo,
    compositionGuide: input.compositionGuide,
    promptRule: input.promptRule,
    additionalPrompt: safeAdditional,
    selectedContents: input.selectedContents,
    inheritFromFront: input.inheritFromFront,
  });

  const visualContext = [
    input.baseInfo.mainCharacter,
    input.baseInfo.supportingCharacters,
    input.baseInfo.location,
    input.baseInfo.importantObject,
    input.baseInfo.mood,
    input.baseInfo.storySummary,
  ]
    .filter(Boolean)
    .join(' ');

  const cache = await buildCoverCachePayload({
    grade: input.grade,
    subject: input.subject,
    projectId: input.projectId,
    coverKind: input.coverKind,
    presetCode: input.presetCode,
    visualContext,
    additionalPrompt: safeAdditional,
    inheritFromFront: !!input.inheritFromFront,
  });

  let result = await invokeGenerateCoverImage({
    projectId: input.projectId,
    coverKind: input.coverKind,
    presetCode: input.presetCode,
    prompt,
    cache,
  });

  // 비동기 응답(processing + jobId)이면 폴링 대기.
  if (result.success && result.processing && result.jobId) {
    result = await waitForCoverJob(result.jobId, input.coverKind);
  }

  return { result, prompt };
};
