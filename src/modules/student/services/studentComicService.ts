import { geminiClient, GeminiError } from '../../../shared/lib/gemini';
import { supabase } from '../../../shared/lib/supabase';
import { logStage, startTimer, getErrorMessageByCode } from '../../../shared/lib/geminiLogger';
import type { GeneratedComicScript } from './studentScriptService';
import type { ComicProjectData } from '../components/editor/utils/comicStorage';
import { findCachedComicBackground, saveComicBackgroundToCache } from './comicBackgroundCacheService';
import type { ComicBackgroundCacheParams } from './comicBackgroundCacheService';
import {
  getSubjectBackgroundRule,
  getCutSceneGuide,
  COMMON_ART_STYLE_HEADER,
  COMMON_NEGATIVE_RULES
} from './comicBackgroundRuleService';

export const IMAGE_GENERATION_POLL_TIMEOUT_MS = 180000;
export const SINGLE_CUT_TIMEOUT_MS = 180000;
export const FULL_COMIC_TIMEOUT_MS = 480000;


export interface ComicGenerationState {
  status: 'idle' | 'generating' | 'success' | 'error';
  errorMessage?: string;
  errorCode?: string;      // GEMINI_503 / GEMINI_429 / GEMINI_AUTH / TIMEOUT / POLL_TIMEOUT 등
  progress: number;
  message?: string;
  cutImages?: string[];
  startedAt?: number;
  elapsedMs?: number;
}

export interface StorySceneBible {
  topicTitle: string;
  subject: string;
  learningConcept: string;
  primaryLocation: string;
  secondaryLocations: string[];
  timeOfDay: string;
  requiredObjects: string[];
  centralEvent: string;
  visualMood: string;
  forbiddenLocations: string[];
}

export const getLearningRoleForCut = (cutNumber: number): string => {
  switch (cutNumber) {
    case 1: return "퀘스트 시작 / 문제 상황 제시";
    case 2: return "기초 개념 및 위치 탐색";
    case 3: return "핵심 개념(지형, 분포 등)의 본격적인 이해";
    case 4: return "개념이 실제 생활이나 환경에 미치는 영향 파악";
    case 5: return "오해 바로잡기, 비교 또는 문제 해결의 단서 획득";
    case 6: return "개념 정리 및 학습 마무리";
    default: return "장면 전환";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fallback 값 생성 (Gemini 호출 실패 시 로컬에서 즉시 생성)
// ─────────────────────────────────────────────────────────────────────────────

function makeFallbackSceneBible(projectData: ComicProjectData): StorySceneBible {
  return {
    topicTitle: projectData.topicTitle,
    subject: projectData.subject,
    learningConcept: projectData.coreConcepts[0] || '',
    primaryLocation: '밝고 안전한 교육적 장소',
    secondaryLocations: [],
    timeOfDay: '낮',
    requiredObjects: [],
    centralEvent: projectData.selectedStoryDescription,
    visualMood: '밝고 긍정적인 분위기',
    forbiddenLocations: [],
  };
}

function makeFallbackVisualPrompt(cut: any, projectData: ComicProjectData, cutNumber: number): string {
  const sceneDesc = cut.sceneDescription || (cut as any).scene || '';
  const rule = getSubjectBackgroundRule(projectData.subject, projectData.topicTitle);
  const cutGuide = getCutSceneGuide(rule, cutNumber);
  
  return `${COMMON_ART_STYLE_HEADER}\nSubject: ${projectData.subject}. Topic: ${projectData.topicTitle}.\nScene: ${sceneDesc}.\nCut Guide: ${cutGuide}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// [핵심 최적화] sceneBible + extractVisualPrompt → 단일 Gemini 호출로 통합
// ─────────────────────────────────────────────────────────────────────────────

interface SceneBibleAndVisualPrompt {
  sceneBible: StorySceneBible;
  visualPrompt: string;
}

const generateSceneBibleAndVisualPrompt = async (
  projectData: ComicProjectData,
  cut: any,
  cutNumber: number
): Promise<SceneBibleAndVisualPrompt> => {
  const elapsed = startTimer();

  logStage({ cutNumber, stage: 'combinedPromptGen', status: 'start', modelName: 'gemini-text' });

  const fullScriptContext = projectData.script?.cuts?.map(c => `Cut ${c.cutNumber}: ${c.sceneDescription || (c as any).scene || ''}`).join('\n') || 'None';

  const subjectRule = getSubjectBackgroundRule(projectData.subject, projectData.topicTitle);
  const cutGuide = getCutSceneGuide(subjectRule, cutNumber);

  const prompt = `You are a professional comic director for an educational comic.
Analyze the story and generate both a scene bible AND a visual prompt for one panel.

Subject: ${projectData.subject}
Grade: ${projectData.grade}
Topic Title: ${projectData.topicTitle}
Story Setting: ${projectData.selectedStoryDescription}
Core Concepts: ${projectData.coreConcepts.join(', ')}
Full Story Flow:
${fullScriptContext}

Current Cut Number: ${cutNumber}
Current Cut Learning Role: ${getLearningRoleForCut(cutNumber)}
Current Panel Scene: ${cut.sceneDescription || (cut as any).scene || 'None'}

=== SUBJECT-SPECIFIC STYLE GUIDE ===
Art Style: ${subjectRule.artStyle}
Color Palette: ${subjectRule.colorPalette}
Cut ${cutNumber} Scene Guide: ${cutGuide}
Allowed Visual Symbols: ${subjectRule.visualSymbols}
Additional Forbidden: ${subjectRule.forbiddenElements}

Output ONLY valid JSON with NO markdown:
{
  "sceneBible": {
    "topicTitle": "string",
    "subject": "string",
    "learningConcept": "string",
    "primaryLocation": "string",
    "secondaryLocations": ["string"],
    "timeOfDay": "string",
    "requiredObjects": ["string"],
    "centralEvent": "string",
    "visualMood": "string",
    "forbiddenLocations": ["string"]
  },
  "visualPrompt": "A concise English background-only description for an image generation model. Include visual symbols from the style guide if applicable. NO people, characters, or text."
}`;

  try {
    const responseText = await geminiClient.generateText(prompt);
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr) as SceneBibleAndVisualPrompt;

    logStage({
      cutNumber, stage: 'combinedPromptGen', status: 'success',
      elapsedMs: elapsed(), note: 'sceneBible+visualPrompt 통합 생성 성공'
    });

    return parsed;
  } catch (err: any) {
    const elapsedMs = elapsed();
    const errorCode = err instanceof GeminiError ? err.errorCode : 'PARSE_ERROR';
    logStage({
      cutNumber, stage: 'combinedPromptGen', status: 'fallback',
      elapsedMs, errorCode,
      note: 'fallback값 사용'
    });

    // Gemini 실패해도 fallback으로 이미지 생성까지 진행
    return {
      sceneBible: makeFallbackSceneBible(projectData),
      visualPrompt: makeFallbackVisualPrompt(cut, projectData, cutNumber),
    };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// translateUserDescriptionToBackground (재생성 시 사용)
// ─────────────────────────────────────────────────────────────────────────────

export const translateUserDescriptionToBackground = async (
  originalPrompt: string,
  userDescription: string,
  bible: StorySceneBible
): Promise<string> => {
  const prompt = `You are a background description translator for an educational comic.
Translate the user's edit request into a "background and objects ONLY" description in Korean.

Scene Context:
Location: ${bible.primaryLocation}
Mood: ${bible.visualMood}
Time: ${bible.timeOfDay}

Original Background Prompt:
${originalPrompt}

User's Edit Request:
${userDescription}

CRITICAL RULES:
1. Remove all mentions of people, characters, animals acting as characters.
2. Remove all dialogue, speech bubbles, and text.
3. Focus entirely on the environment, scenery, atmosphere, and objects.
4. Keep it concise, descriptive, and in Korean.

Translate:`;
  return await geminiClient.generateText(prompt);
};

// ─────────────────────────────────────────────────────────────────────────────
// buildSingleCutBackgroundPrompt
// ─────────────────────────────────────────────────────────────────────────────

export interface SingleCutPromptParams {
  subject: string;
  topicTitle: string;
  storyTitle: string;
  fullStoryFlow: string;
  cutNo: number;
  currentPanelScene: string;
  visualPrompt: string;
  primaryLocation: string;
  visualMood: string;
  timeOfDay: string;
  originalBackgroundPrompt?: string;
  editedUserDescription?: string;
  previousCutBackgroundPrompt?: string;
  nextCutBackgroundPrompt?: string;
  seriesStylePrompt?: string;
  styleKey?: string;
  learningRole?: string;
  educationalConcept?: string;
}

const buildSingleCutBackgroundPrompt = (params: SingleCutPromptParams): string => {
  const isFirstCut = params.cutNo === 1;
  const cutSpecificInstruction = isFirstCut 
    ? `- This is Cut 1. It creates the opening scene.
- It provides the "visual style baseline" (color, clarity, tone) for the entire comic.
- Set the primary environment according to the Cut 1 Scene Guide.`
    : `- Maintain the same illustration style, color harmony, clarity, and educational tone as cut 1.
- Allow location continuity if the script dictates that the scene occurs in the same place. Do NOT unconditionally change the location for every cut.
- Change the framing, angle, or focus to highlight this cut's specific concept, even if the location is the same.`;

  const subjectRule = getSubjectBackgroundRule(params.subject, params.topicTitle);
  const cutGuide = getCutSceneGuide(subjectRule, params.cutNo);

  return `${COMMON_ART_STYLE_HEADER}

=== SUBJECT-SPECIFIC STYLE GUIDE ===
Subject: ${params.subject}
Art Style: ${subjectRule.artStyle}
Color Palette: ${subjectRule.colorPalette}
Cut ${params.cutNo} Scene Guide: ${cutGuide}
Allowed Visual Symbols: ${subjectRule.visualSymbols}
Additional Forbidden: ${subjectRule.forbiddenElements}

=== STORY CONTEXT ===
- Full Story Flow:
${params.fullStoryFlow}

- Current Cut Learning Role:
  Cut ${params.cutNo}: ${params.learningRole || 'None'}

- Current Panel Scene:
  ${params.currentPanelScene}

- Educational Background Knowledge:
  ${params.educationalConcept || 'None'}

- Cut Specific Instruction:
  ${cutSpecificInstruction}
  User Edit Request: ${params.editedUserDescription || 'None'}

- Background Only Prompt:
  ${params.visualPrompt}

=== HARD NEGATIVE RULES ===
${COMMON_NEGATIVE_RULES}

한국어 추가 지침: 현재 컷 역할과 교과 개념에 맞는 1개의 배경 장면만 그리세요. 사람/캐릭터/글자/말풍선 금지. 장소가 이어지면 배경 연속성을 유지하되 구도를 다르게 하세요.`;
};

// ─────────────────────────────────────────────────────────────────────────────
// generateFullComic
// ─────────────────────────────────────────────────────────────────────────────

export const generateFullComic = async (
  projectData: ComicProjectData,
  _script: GeneratedComicScript,
  onProgress: (state: ComicGenerationState) => void
): Promise<string[]> => {
  let currentState: ComicGenerationState = {
    status: 'generating',
    progress: 0,
    message: '이야기 배경 분석 중...'
  };

  const updateState = (update: Partial<ComicGenerationState>) => {
    currentState = { ...currentState, ...update };
    onProgress(currentState);
  };

  try {
    const generatedImages: string[] = [];
    const originalPrompts: string[] = [];
    const cuts = projectData.script.cuts;

    if (!cuts || cuts.length !== 6) {
      throw new Error('정확히 6컷의 대본 데이터가 필요합니다.');
    }

    for (let i = 0; i < cuts.length; i++) {
      const cutNumber = i + 1;
      updateState({
        progress: 10 + Math.floor((i / 6) * 70),
        message: `${cutNumber}번째 컷 시각 장면 데이터 만드는 중...`
      });

      const { loadComicCutData } = await import('../components/editor/utils/comicStorage');
      const cutData = loadComicCutData(projectData.projectId, cutNumber);

      // [통합 호출] sceneBible + visualPrompt 단일 Gemini 호출
      let visualPrompt = '';
      let sceneBible: StorySceneBible;

      if (cutData?.customBackgroundPrompt) {
        visualPrompt = cutData.customBackgroundPrompt;
        sceneBible = makeFallbackSceneBible(projectData);
      } else {
        const combined = await generateSceneBibleAndVisualPrompt(projectData, cuts[i], cutNumber);
        sceneBible = combined.sceneBible;
        visualPrompt = combined.visualPrompt;
      }
      originalPrompts.push(visualPrompt);

      const cacheParams: ComicBackgroundCacheParams = {
        grade: projectData.grade,
        subject: projectData.subject,
        semester: projectData.semester,
        unitId: projectData.mainUnit,
        subunitId: projectData.subUnit,
        topicTitle: projectData.topicTitle,
        cutNo: cutNumber,
        backgroundPrompt: visualPrompt
      };

      const cacheResult = await findCachedComicBackground(cacheParams);

      if (cacheResult.hit) {
        generatedImages.push(cacheResult.publicUrl);
        continue;
      }

      updateState({
        progress: 10 + Math.floor(((i + 0.5) / 6) * 70),
        message: `${cutNumber}번째 컷 스케치 중...`
      });

      const prevCutData = cutNumber > 1 ? loadComicCutData(projectData.projectId, cutNumber - 1) : null;
      const nextCutData = cutNumber < 6 ? loadComicCutData(projectData.projectId, cutNumber + 1) : null;

      const fullScriptContext = cuts.map((c: any, idx: number) => `Cut ${idx + 1}: ${c.sceneDescription || c.scene || ''}`).join('\n');

      const fullPrompt = buildSingleCutBackgroundPrompt({
        subject: projectData.subject,
        topicTitle: projectData.topicTitle,
        storyTitle: projectData.selectedStoryDescription,
        fullStoryFlow: fullScriptContext,
        cutNo: cutNumber,
        currentPanelScene: cuts[i].sceneDescription || (cuts[i] as any).scene || 'None',
        visualPrompt: visualPrompt,
        primaryLocation: sceneBible.primaryLocation,
        visualMood: sceneBible.visualMood,
        timeOfDay: sceneBible.timeOfDay,
        originalBackgroundPrompt: visualPrompt,
        editedUserDescription: cutData?.customBackgroundPrompt || '',
        previousCutBackgroundPrompt: prevCutData?.originalBackgroundPrompt,
        nextCutBackgroundPrompt: nextCutData?.originalBackgroundPrompt,
        seriesStylePrompt: 'toonschool-v2',
        styleKey: cacheParams.styleKey,
        learningRole: getLearningRoleForCut(cutNumber),
        educationalConcept: sceneBible.learningConcept
      });

      console.log(`[ToonSchool Background] GENERATE_FULL_COMIC CUT=${cutNumber} PROMPT:\n${fullPrompt}`);

      updateState({ progress: 10 + Math.floor(((i + 0.6) / 6) * 70), message: `${cutNumber}번째 컷 서버 대기열 등록 중...` });

      logStage({ cutNumber, stage: 'enqueueJob', status: 'start' });
      const { data: jobData, error: jobError } = await supabase
        .from('generation_jobs')
        .insert({
          project_id: projectData.projectId,
          cut_number: cutNumber,
          prompt_data: { prompt: fullPrompt },
          status: 'queued'
        })
        .select()
        .single();

      if (jobError || !jobData) {
        logStage({ cutNumber, stage: 'enqueueJob', status: 'error', errorCode: 'ENQUEUE_FAILED' });
        throw Object.assign(new Error(`대기열 등록 실패: ${jobError?.message || '알 수 없는 오류'}`), { errorCode: 'ENQUEUE_FAILED' });
      }
      logStage({ cutNumber, stage: 'enqueueJob', status: 'success', note: `jobId=${jobData.id}` });

      let panelImageBase64 = '';
      const jobId = jobData.id;
      const maxWaitTime = FULL_COMIC_TIMEOUT_MS;
      const pollStart = Date.now();
      let isCompleted = false;

      logStage({ cutNumber, stage: 'pollImageJob', status: 'start', note: `jobId=${jobId}` });

      while (Date.now() - pollStart < maxWaitTime) {
        const { data: pollData, error: pollError } = await supabase
          .from('generation_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (pollError) {
          console.error('Job poll error:', pollError);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        const elapsedMs = Date.now() - pollStart;
        const currentStatus = pollData.status;

        if (elapsedMs % 15000 < 3000) {
           console.log(`[Job Monitor] job_id=${jobId} | cut=${cutNumber} | status=${currentStatus} | created_at=${pollData.created_at} | started_at=${pollData.started_at || 'null'} | elapsed_ms=${elapsedMs}`);
        }

        if (currentStatus === 'queued') {
          if (elapsedMs > SINGLE_CUT_TIMEOUT_MS) {
            throw Object.assign(new Error('생성 대기 시간이 초과되었습니다.'), { errorCode: 'POLL_TIMEOUT' });
          } else if (elapsedMs > 60000) {
            console.warn(`[Job Monitor] Worker 미실행 의심. 60초 이상 queued 상태입니다. job_id=${jobId}`);
            updateState({ progress: 10 + Math.floor(((i + 0.6) / 6) * 70), message: '잠시만 기다려 주세요...' });
          } else {
            updateState({ progress: 10 + Math.floor(((i + 0.6) / 6) * 70), message: `${cutNumber}번째 컷 순서를 기다리고 있어요...` });
          }
        } else if (currentStatus === 'processing') {
          if (elapsedMs > SINGLE_CUT_TIMEOUT_MS) {
            updateState({ progress: 10 + Math.floor(((i + 0.7) / 6) * 70), message: '조금 더 걸리고 있어요...' });
          } else if (elapsedMs > 120000) {
            updateState({ progress: 10 + Math.floor(((i + 0.7) / 6) * 70), message: '그림을 만들고 있어요...' });
          } else {
            updateState({ progress: 10 + Math.floor(((i + 0.7) / 6) * 70), message: `${cutNumber}번째 컷 그리는 중...` });
          }
        } else if (currentStatus === 'completed') {
          panelImageBase64 = pollData.result_url;
          isCompleted = true;
          logStage({ cutNumber, stage: 'pollImageJob', status: 'success', elapsedMs });
          break;
        } else if (currentStatus === 'failed') {
          const isWorkerError = pollData.error_message?.includes('만료') || pollData.error_message?.includes('Worker');
          const errorCode = isWorkerError ? 'WORKER_ERROR' : 'PROVIDER_ERROR';
          console.error(`[Job Monitor] failed | error_code=${errorCode} | error_message=${pollData.error_message}`);
          logStage({ cutNumber, stage: 'pollImageJob', status: 'error', errorCode, note: pollData.error_message });
          throw Object.assign(new Error(pollData.error_message || '서버 이미지 생성 실패'), { errorCode });
        }

        await new Promise(r => setTimeout(r, 3000));
      }

      if (!isCompleted) {
        const finalStatus = (await supabase.from('generation_jobs').select('status').eq('id', jobId).single()).data?.status || 'unknown';
        logStage({ cutNumber, stage: 'pollImageJob', status: 'error', errorCode: 'POLL_TIMEOUT', elapsedMs: Date.now() - pollStart, note: `last_status=${finalStatus}` });
        
        let msg = '잠시 후 다시 시도해 주세요.';
        if (finalStatus === 'queued') msg = '그림을 다시 만들어 볼게요.';
        else if (finalStatus === 'processing') msg = '그림을 다시 만들어 볼게요.';
        console.error(`[Job Monitor] POLL_TIMEOUT | status=${finalStatus} | msg=${msg}`);

        throw Object.assign(new Error(msg), { errorCode: 'POLL_TIMEOUT' });
      }

      updateState({
        progress: 10 + Math.floor(((i + 0.8) / 6) * 70),
        message: `${cutNumber}번째 컷 최적화 중...`
      });

      const { compressImageDataUrl } = await import('../../../shared/lib/imageUtils');
      const compressedImage = await compressImageDataUrl(panelImageBase64, 800, 0.8);
      generatedImages.push(compressedImage);

      saveComicBackgroundToCache(cacheResult.cacheKey, compressedImage, cacheParams).catch(err => {
        console.error('Failed to save background to cache', err);
      });
    }

    updateState({ progress: 95, message: '생성된 6장의 그림을 저장하는 중...' });

    const { loadComicCutData, saveComicCutData } = await import('../components/editor/utils/comicStorage');
    for (let i = 0; i < cuts.length; i++) {
      const cutNumber = i + 1;
      let cutData = loadComicCutData(projectData.projectId, cutNumber);
      if (!cutData) {
        cutData = { cutNumber, elements: [], updatedAt: new Date().toISOString() };
      }
      cutData.backgroundImageUrl = generatedImages[i];
      cutData.originalBackgroundPrompt = originalPrompts[i];
      cutData.updatedAt = new Date().toISOString();
      saveComicCutData(projectData.projectId, cutNumber, cutData);
    }

    updateState({ status: 'success', progress: 100, message: '만화 배경 생성 완료!', cutImages: generatedImages });
    return generatedImages;

  } catch (error: any) {
    console.error('Error generating full comic:', error);
    const errorCode = error.errorCode || (error instanceof GeminiError ? error.errorCode : undefined);
    const displayMessage = errorCode ? getErrorMessageByCode(errorCode) : '생성 중 오류가 발생했습니다.';

    updateState({
      status: 'error',
      progress: 0,
      message: displayMessage,
      errorMessage: displayMessage,
      errorCode,
    });
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// generateSingleComicCut (timeout wrapper)
// ─────────────────────────────────────────────────────────────────────────────

export const generateSingleComicCut = async (
  projectData: ComicProjectData,
  cutNumber: number,
  onProgress: (state: ComicGenerationState) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    let isTimeout = false;
    // 텍스트 생성 ~30s + 이미지 생성 ~240s + 여유 = 300초 (5분)
    // 단, 무한 로딩 방지: 반드시 이 시간 후 실패 상태로 전환됨
    const TIMEOUT_MS = FULL_COMIC_TIMEOUT_MS;

    const timeoutId = setTimeout(() => {
      isTimeout = true;
      logStage({ cutNumber, stage: 'pollImageJob', status: 'error', errorCode: 'TIMEOUT', elapsedMs: TIMEOUT_MS });
      const msg = getErrorMessageByCode('TIMEOUT');
      onProgress({
        status: 'error',
        progress: 0,
        message: msg,
        errorMessage: msg,
        errorCode: 'TIMEOUT',
      });
      reject(Object.assign(new Error(msg), { errorCode: 'TIMEOUT' }));
    }, TIMEOUT_MS);

    const wrappedOnProgress = (state: ComicGenerationState) => {
      if (!isTimeout) onProgress(state);
    };

    doGenerateSingleComicCut(projectData, cutNumber, wrappedOnProgress)
      .then(res => {
        if (!isTimeout) {
          clearTimeout(timeoutId);
          resolve(res);
        }
      })
      .catch(err => {
        if (!isTimeout) {
          clearTimeout(timeoutId);
          reject(err);
        }
      });
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// doGenerateSingleComicCut (실제 구현)
// ─────────────────────────────────────────────────────────────────────────────

const doGenerateSingleComicCut = async (
  projectData: ComicProjectData,
  cutNumber: number,
  onProgress: (state: ComicGenerationState) => void
): Promise<string> => {
  let currentState: ComicGenerationState = {
    status: 'generating',
    progress: 0,
    message: '이야기 배경 분석 중...',
    startedAt: Date.now()
  };

  const updateState = (update: Partial<ComicGenerationState>) => {
    currentState = { ...currentState, ...update };
    onProgress(currentState);
  };

  try {
    const { loadComicCutData, saveComicCutData } = await import('../components/editor/utils/comicStorage');
    let cutData = loadComicCutData(projectData.projectId, cutNumber);

    const cutIndex = cutNumber - 1;
    const cut = projectData.script.cuts[cutIndex];
    if (!cut) throw Object.assign(new Error('대본 데이터를 찾을 수 없습니다.'), { errorCode: 'NO_SCRIPT' });

    updateState({ progress: 20, message: '이야기 배경 분석 중...' });

    // ── [핵심] Gemini 호출 횟수 최소화 ──────────────────────────────────────
    // 기존: sceneBible 호출 + extractVisualPrompt 호출 = 최소 2회
    // 변경: combinedPromptGen 단일 호출 = 1회 (실패 시 로컬 fallback)
    // ─────────────────────────────────────────────────────────────────────────

    let visualPrompt = '';
    let editedUserDescription = '';
    let isRegeneration = false;
    let originalBackgroundPrompt = cutData?.originalBackgroundPrompt;
    let sceneBible: StorySceneBible;

    if (cutData?.customBackgroundPrompt && cutData.customBackgroundPrompt.trim() !== '') {
      isRegeneration = true;
      editedUserDescription = cutData.customBackgroundPrompt;

      if (!originalBackgroundPrompt) {
        // 원본 프롬프트가 없으면 새로 생성 (1회 호출)
        const combined = await generateSceneBibleAndVisualPrompt(projectData, cut, cutNumber);
        sceneBible = combined.sceneBible;
        originalBackgroundPrompt = combined.visualPrompt;
      } else {
        sceneBible = makeFallbackSceneBible(projectData);
      }

      updateState({ progress: 35, message: '배경 설명 변환 중...' });

      // 사용자 요청 번역 (재생성 시에만)
      try {
        visualPrompt = await translateUserDescriptionToBackground(
          originalBackgroundPrompt!,
          editedUserDescription,
          sceneBible
        );
      } catch (err: any) {
        console.warn('[ComicService] translateUserDescriptionToBackground 실패, fallback 사용', err);
        visualPrompt = `초등학생 학습 만화 배경 이미지. 사람, 캐릭터, 말풍선, 글자 없이 장면 배경만 표현. 추가 요구사항: ${editedUserDescription}`;
      }
    } else {
      // [통합 호출] sceneBible + visualPrompt 단일 Gemini 호출
      const combined = await generateSceneBibleAndVisualPrompt(projectData, cut, cutNumber);
      sceneBible = combined.sceneBible;
      visualPrompt = combined.visualPrompt;
      originalBackgroundPrompt = visualPrompt;
    }

    updateState({ progress: 50, message: '시각 장면 데이터 완료, 이미지 준비 중...' });

    const prevCutData = cutNumber > 1 ? loadComicCutData(projectData.projectId, cutNumber - 1) : null;
    const nextCutData = cutNumber < 6 ? loadComicCutData(projectData.projectId, cutNumber + 1) : null;
    const previousCutBackgroundPrompt = prevCutData?.originalBackgroundPrompt;
    const nextCutBackgroundPrompt = nextCutData?.originalBackgroundPrompt;

    const promptVersion = isRegeneration ? 'single-cut-background-v4-context-locked' : 'toonschool-v2-single-background-v2';

    const cacheParams: ComicBackgroundCacheParams = {
      grade: projectData.grade,
      subject: projectData.subject,
      semester: projectData.semester,
      unitId: projectData.mainUnit,
      subunitId: projectData.subUnit,
      topicTitle: projectData.topicTitle,
      cutNo: cutNumber,
      backgroundPrompt: isRegeneration ? visualPrompt : originalBackgroundPrompt,
      styleKey: promptVersion
    };

    const cacheResult = await findCachedComicBackground(cacheParams);

    if (cacheResult.hit) {
      console.log(`[ToonSchool Background Cache] HIT cut=${cutNumber}`);
      if (!cutData) {
        cutData = { cutNumber, elements: [], updatedAt: new Date().toISOString() };
      }
      cutData.backgroundImageUrl = cacheResult.publicUrl;
      cutData.originalBackgroundPrompt = originalBackgroundPrompt;
      cutData.updatedAt = new Date().toISOString();
      saveComicCutData(projectData.projectId, cutNumber, cutData);
      updateState({ status: 'success', progress: 100, message: '완료!' });
      return cacheResult.publicUrl;
    }

    console.log(`[ToonSchool Background Cache] MISS cut=${cutNumber}`);

    // ── buildSingleCutPrompt ─────────────────────────────────────────────────
    logStage({ cutNumber, stage: 'buildSingleCutPrompt', status: 'start' });
    const fullScriptContext = projectData.script.cuts.map((c: any, idx: number) => `Cut ${idx + 1}: ${c.sceneDescription || c.scene || ''}`).join('\n');

    const fullPrompt = buildSingleCutBackgroundPrompt({
      subject: projectData.subject,
      topicTitle: projectData.topicTitle,
      storyTitle: projectData.selectedStoryDescription,
      fullStoryFlow: fullScriptContext,
      cutNo: cutNumber,
      currentPanelScene: cut.sceneDescription || (cut as any).scene || 'None',
      visualPrompt: visualPrompt,
      primaryLocation: sceneBible.primaryLocation,
      visualMood: sceneBible.visualMood,
      timeOfDay: sceneBible.timeOfDay,
      originalBackgroundPrompt: originalBackgroundPrompt,
      editedUserDescription: editedUserDescription,
      previousCutBackgroundPrompt: previousCutBackgroundPrompt,
      nextCutBackgroundPrompt: nextCutBackgroundPrompt,
      seriesStylePrompt: 'toonschool-v2',
      styleKey: cacheParams.styleKey,
      learningRole: getLearningRoleForCut(cutNumber),
      educationalConcept: sceneBible.learningConcept
    });
    console.log(`[ToonSchool Background] SINGLE_CUT_PROMPT:\n${fullPrompt}`);
    logStage({ cutNumber, stage: 'buildSingleCutPrompt', status: 'success' });

    // ── enqueueJob ────────────────────────────────────────────────────────────
    updateState({ progress: 60, message: '서버 대기열에 등록 중...' });
    logStage({ cutNumber, stage: 'enqueueJob', status: 'start' });

    const { data: jobData, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        project_id: projectData.projectId,
        cut_number: cutNumber,
        prompt_data: { prompt: fullPrompt },
        status: 'queued'
      })
      .select()
      .single();

    if (jobError || !jobData) {
      logStage({ cutNumber, stage: 'enqueueJob', status: 'error', errorCode: 'ENQUEUE_FAILED' });
      throw Object.assign(new Error(`대기열 등록 실패: ${jobError?.message || '알 수 없는 오류'}`), { errorCode: 'ENQUEUE_FAILED' });
    }
    logStage({ cutNumber, stage: 'enqueueJob', status: 'success', note: `jobId=${jobData.id}` });

    // ── pollImageJob ──────────────────────────────────────────────────────────
    let panelImageBase64 = '';
    const jobId = jobData.id;
    // 이미지 생성 polling: 180초 (텍스트 ~30s 소요 후 남은 시간 최대 확보)
    // 무한 로딩 방지: 이 시간 초과 시 POLL_TIMEOUT 에러로 전환 (300초 = 5분)
    const maxWaitTime = FULL_COMIC_TIMEOUT_MS;
    const pollStart = Date.now();
    let isCompleted = false;
    let finalElapsedMs = 0;

    logStage({ cutNumber, stage: 'pollImageJob', status: 'start', note: `jobId=${jobId}` });
    updateState({ progress: 70, message: '서버 대기열에 등록되었어요. 순서를 기다리는 중...' });

    while (Date.now() - pollStart < maxWaitTime) {
      const { data: pollData, error: pollError } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (pollError) {
        console.error('Job poll error:', pollError);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      const elapsedMs = Date.now() - pollStart;
      const currentStatus = pollData.status;

      if (elapsedMs % 15000 < 3000) {
         console.log(`[Job Monitor] job_id=${jobId} | cut=${cutNumber} | status=${currentStatus} | created_at=${pollData.created_at} | started_at=${pollData.started_at || 'null'} | elapsed_ms=${elapsedMs}`);
      }

      if (currentStatus === 'queued') {
        if (elapsedMs > SINGLE_CUT_TIMEOUT_MS) {
          throw Object.assign(new Error('생성 대기 시간이 초과되었습니다.'), { errorCode: 'POLL_TIMEOUT' });
        } else if (elapsedMs > 60000) {
          console.warn(`[Job Monitor] Worker 미실행 의심. 60초 이상 queued 상태입니다. job_id=${jobId}`);
          updateState({ progress: 72, message: '잠시만 기다려 주세요...' });
        } else {
          updateState({ progress: 72, message: '생성 순서를 기다리고 있어요...' });
        }
      } else if (currentStatus === 'processing') {
        if (elapsedMs > SINGLE_CUT_TIMEOUT_MS) {
          updateState({ progress: 85, message: '조금 더 걸리고 있어요...' });
        } else if (elapsedMs > 120000) {
          updateState({ progress: 85, message: '그림을 만들고 있어요...' });
        } else {
          updateState({ progress: 85, message: '그림을 그리는 중이에요...' });
        }
      } else if (currentStatus === 'completed') {
        updateState({ progress: 95, message: '생성 완료!' });
        panelImageBase64 = pollData.result_url;
        isCompleted = true;
        finalElapsedMs = pollData.elapsed_ms || elapsedMs;
        logStage({ cutNumber, stage: 'pollImageJob', status: 'success', elapsedMs: finalElapsedMs });
        break;
      } else if (currentStatus === 'failed') {
        const isWorkerError = pollData.error_message?.includes('만료') || pollData.error_message?.includes('Worker');
        const errorCode = isWorkerError ? 'WORKER_ERROR' : 'PROVIDER_ERROR';
        console.error(`[Job Monitor] failed | error_code=${errorCode} | error_message=${pollData.error_message}`);
        logStage({ cutNumber, stage: 'pollImageJob', status: 'error', errorCode, note: pollData.error_message });
        throw Object.assign(new Error(pollData.error_message || '서버 이미지 생성 실패'), { errorCode });
      }

      await new Promise(r => setTimeout(r, 3000));
    }

    if (!isCompleted) {
      const finalStatus = (await supabase.from('generation_jobs').select('status').eq('id', jobId).single()).data?.status || 'unknown';
      logStage({ cutNumber, stage: 'pollImageJob', status: 'error', errorCode: 'POLL_TIMEOUT', elapsedMs: Date.now() - pollStart, note: `last_status=${finalStatus}` });
      
      let msg = '잠시 후 다시 시도해 주세요.';
      if (finalStatus === 'queued') msg = '그림을 다시 만들어 볼게요.';
      else if (finalStatus === 'processing') msg = '그림을 다시 만들어 볼게요.';
      console.error(`[Job Monitor] POLL_TIMEOUT | status=${finalStatus} | msg=${msg}`);

      throw Object.assign(new Error(msg), { errorCode: 'POLL_TIMEOUT' });
    }

    const compressedImage = panelImageBase64;

    const forbiddenWordsCheck = ['comic page', 'panels', 'speech bubbles', '말풍선', '만화칸', '사람', '캐릭터', 'people', 'character', 'text'];
    const hasForbiddenWords = forbiddenWordsCheck.some(w => visualPrompt.toLowerCase().includes(w));
    if (hasForbiddenWords) {
      console.warn(`[ToonSchool Background] 재생성 프롬프트에 금지어가 포함되어 있습니다. (cut=${cutNumber})`);
    }

    const metadata: any = {
      generationMode: isRegeneration ? 'single-cut-regenerate' : 'single-cut-background',
      hasForbiddenWords,
      promptVersion
    };
    if (isRegeneration) {
      metadata.originalBackgroundPrompt = originalBackgroundPrompt;
      metadata.editedUserDescription = editedUserDescription;
      metadata.backgroundOnlyInterpretation = visualPrompt;
    }

    saveComicBackgroundToCache(cacheResult.cacheKey, compressedImage, cacheParams, metadata).then(() => {
      console.log(`[ToonSchool Background Cache] SAVED cut=${cutNumber}`);
    }).catch(err => {
      console.error('Failed to save background to cache', err);
    });

    // ── saveCutResult ─────────────────────────────────────────────────────────
    logStage({ cutNumber, stage: 'saveCutResult', status: 'start' });
    updateState({ progress: 98, message: '그림을 저장하는 중...' });

    if (!cutData) {
      cutData = { cutNumber, elements: [], updatedAt: new Date().toISOString() };
    }
    cutData.backgroundImageUrl = compressedImage;
    cutData.originalBackgroundPrompt = originalBackgroundPrompt;
    cutData.updatedAt = new Date().toISOString();
    saveComicCutData(projectData.projectId, cutNumber, cutData);
    logStage({ cutNumber, stage: 'saveCutResult', status: 'success' });

    updateState({ status: 'success', progress: 100, message: '완료!', elapsedMs: finalElapsedMs });
    return compressedImage;

  } catch (error: any) {
    console.error(`Error generating comic cut ${cutNumber}:`, error);

    const errorCode = error.errorCode || (error instanceof GeminiError ? error.errorCode : 'UNKNOWN');
    const displayMessage = getErrorMessageByCode(errorCode);

    updateState({
      status: 'error',
      progress: 0,
      message: displayMessage,
      errorMessage: displayMessage,
      errorCode,
    });
    throw error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// checkCutGenerationStatus
// ─────────────────────────────────────────────────────────────────────────────

export const checkCutGenerationStatus = async (projectId: string, cutNumber: number) => {
  const { data, error } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('project_id', projectId)
    .eq('cut_number', cutNumber)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0];
};
