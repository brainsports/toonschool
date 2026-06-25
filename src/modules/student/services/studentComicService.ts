import { geminiClient } from '../../../shared/lib/gemini';
import type { GeneratedComicScript } from './studentScriptService';
import type { ComicProjectData } from '../components/editor/utils/comicStorage';
import { findCachedComicBackground, saveComicBackgroundToCache } from './comicBackgroundCacheService';
import type { ComicBackgroundCacheParams } from './comicBackgroundCacheService';

export interface ComicGenerationState {
  status: 'idle' | 'generating' | 'success' | 'error';
  errorMessage?: string;
  progress: number;
  message?: string;
  cutImages?: string[];
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

// Removed unused TOONSCHOOL_V2_CHARACTER_REFERENCES and loadReferenceImage

const generateSceneBible = async (projectData: ComicProjectData): Promise<StorySceneBible> => {
  const prompt = `You are a professional comic director setting the overarching scene bible for an educational comic.
Analyze the following story and script to create a cohesive scene bible. Do NOT generate new dialogues or events.

Subject: ${projectData.subject}
Grade: ${projectData.grade}
Topic Title: ${projectData.topicTitle}
Story Setting: ${projectData.selectedStoryDescription}
Core Concepts: ${projectData.coreConcepts.join(', ')}

Output ONLY valid JSON matching this interface:
{
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
}

Ensure the location and visual mood match the educational topic perfectly.
`;

  const responseText = await geminiClient.generateText(prompt);
  try {
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr) as StorySceneBible;
  } catch (err) {
    console.error('Failed to parse StorySceneBible JSON', err);
    throw new Error('장면 배경 정보 추출에 실패했습니다.');
  }
};

const extractVisualPrompt = async (cut: any, bible: StorySceneBible): Promise<string> => {
  const prompt = `Extract purely visual instructions for one comic panel. 
DO NOT include any actual dialogue text in the prompt. We only need the objects, background, and environment needed for the picture.
CRITICAL REQUIREMENT: There should be NO human characters and NO people in this description.

Background Bible:
Location: ${bible.primaryLocation}
Mood: ${bible.visualMood}
Time: ${bible.timeOfDay}

Panel Data:
Scene Description: ${cut.sceneDescription || cut.scene || 'None'}

Create a concise, descriptive visual prompt in English for an image generation model focusing on the BACKGROUND and OBJECTS.
DO NOT put any text or speech bubbles in the description.
DO NOT include any human characters.
Just return the prompt text.
`;
  return await geminiClient.generateText(prompt);
};

export interface SingleCutPromptParams {
  subject: string;
  topicTitle: string;
  storyTitle: string;
  cutNo: number;
  visualPrompt: string; // The background only interpretation
  primaryLocation: string;
  visualMood: string;
  timeOfDay: string;
  originalBackgroundPrompt?: string;
  editedUserDescription?: string;
  previousCutBackgroundPrompt?: string;
  nextCutBackgroundPrompt?: string;
  seriesStylePrompt?: string;
  styleKey?: string;
}

const buildSingleCutBackgroundPrompt = (params: SingleCutPromptParams): string => {
  return `A high quality, bright, and colorful educational scene background for elementary school students.

- Series Context:
  Subject: ${params.subject}
  Topic: ${params.topicTitle}
  Story: ${params.storyTitle}
  Style/Tone: ${params.seriesStylePrompt || params.styleKey || 'toonschool-v2-single-background-v2'}

- Current Cut Anchor:
  Cut Number: ${params.cutNo}
  Original Background Prompt: ${params.originalBackgroundPrompt || 'None'}
  Previous Cut Background: ${params.previousCutBackgroundPrompt || 'None'}
  Next Cut Background: ${params.nextCutBackgroundPrompt || 'None'}

- User Edit Request:
  ${params.editedUserDescription || 'None'}

- Background Only Interpretation:
  ${params.visualPrompt}

- Visual Consistency:
  Keep the exact same visual style, color palette, camera angle, density, and educational illustration tone as the rest of the 6-cut series. Do not change the art style.

- Hard Negative Rules:
  no people, no characters, no animals as characters, no speech bubbles, no text, no letters, no comic panels, no comic page, no worksheet, no poster, no framed image, background only, full bleed

한국어 추가 지침: 오직 하나의 배경 장면만 그려 주세요. 사용자의 수정 요청을 반영하되, 전체 6컷 맥락과 화풍을 반드시 유지하세요. 사람, 캐릭터, 글자, 말풍선은 절대 그리지 마세요.`;
};

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
    // 1. Generate Scene Bible
    const sceneBible = await generateSceneBible(projectData);

    // 2. Extract visual prompts and generate images panel by panel
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

      let visualPrompt = '';
      if (cutData?.customBackgroundPrompt) {
        visualPrompt = cutData.customBackgroundPrompt;
      } else {
        visualPrompt = await extractVisualPrompt(cuts[i], sceneBible);
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

      const fullPrompt = `A high quality, bright, and colorful educational scene background for elementary school students.
CRITICAL INSTRUCTIONS:
- single background scene only
- no comic panels
- no panel grid
- no page layout
- no speech bubbles
- no text
- no characters
- no people
- background only
- object-focused educational scene

한국어 추가 지침: 만화 프레임이나 칸을 절대 그리지 마세요. 4컷/6컷 페이지 레이아웃 금지. 말풍선 없음, 글자 없음, 사람/캐릭터 없음. 오직 하나의 단일 배경 장면만 꽉 차게 그리세요. 학습 개념과 상황을 보여주는 배경과 사물 중심의 초등학생용 밝고 선명한 그림.

Scene Bible Context:
Location: ${sceneBible.primaryLocation}
Mood: ${sceneBible.visualMood}
Time: ${sceneBible.timeOfDay}

Background Visual Action (Focus on environment and objects ONLY):
${visualPrompt}
`;
      // Generate individual panel image (1:1 ratio) without character references
      const panelImageBase64 = await geminiClient.generateImage(fullPrompt, '1:1', []);
      
      updateState({ 
        progress: 10 + Math.floor(((i + 0.8) / 6) * 70), 
        message: `${cutNumber}번째 컷 최적화 중...` 
      });
      
      const { compressImageDataUrl } = await import('../../../shared/lib/imageUtils');
      const compressedImage = await compressImageDataUrl(panelImageBase64, 800, 0.8);
      
      generatedImages.push(compressedImage);

      // Save to cache asynchronously
      saveComicBackgroundToCache(cacheResult.cacheKey, compressedImage, cacheParams).catch(err => {
        console.error('Failed to save background to cache', err);
      });
    }

    updateState({ progress: 95, message: '생성된 6장의 그림을 저장하는 중...' });

    // Store each image individually in ComicCutEditData
    const { loadComicCutData, saveComicCutData } = await import('../components/editor/utils/comicStorage');
    for (let i = 0; i < cuts.length; i++) {
      const cutNumber = i + 1;
      let cutData = loadComicCutData(projectData.projectId, cutNumber);
      if (!cutData) {
        cutData = {
          cutNumber,
          elements: [],
          updatedAt: new Date().toISOString()
        };
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
    
    let displayMessage = '생성 중 오류가 발생했습니다.';
    let detailedError = error.message;

    if (error.message === 'STORAGE_FULL') {
      displayMessage = '저장 공간 부족';
      detailedError = '저장 공간이 부족합니다. 기존 컷 이미지를 정리하거나 이미지 저장 방식을 변경해야 합니다.';
    } else if (error.message?.toLowerCase().includes('fetch') || error.message?.includes('API') || error.message?.includes('HTTP')) {
      displayMessage = '네트워크/API 오류';
    } else if (error.message?.toLowerCase().includes('parse') || error.message?.includes('JSON')) {
      displayMessage = '데이터 처리 오류';
    }

    updateState({ 
      status: 'error', 
      progress: 0, 
      message: displayMessage, 
      errorMessage: detailedError 
    });
    throw error;
  }
};

export const translateUserDescriptionToBackground = async (
  originalPrompt: string,
  userDescription: string,
  bible: StorySceneBible
): Promise<string> => {
  const prompt = `You are a background description translator for an educational comic.
The user wants to modify an existing background cut. 
However, the user might have described actions, characters, or dialogue.
Your job is to translate their request into a "background and objects ONLY" description.

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

Translate the user's intent into a background-only visual description:
`;
  return await geminiClient.generateText(prompt);
};

export const generateSingleComicCut = async (
  projectData: ComicProjectData,
  cutNumber: number,
  onProgress: (state: ComicGenerationState) => void
): Promise<string> => {
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
    const { loadComicCutData, saveComicCutData } = await import('../components/editor/utils/comicStorage');
    let cutData = loadComicCutData(projectData.projectId, cutNumber);

    updateState({ progress: 20, message: '이야기 배경 분석 중...' });
    
    const sceneBible = await generateSceneBible(projectData);
    
    const cutIndex = cutNumber - 1;
    const cut = projectData.script.cuts[cutIndex];
    if (!cut) throw new Error('대본 데이터를 찾을 수 없습니다.');

    updateState({ progress: 40, message: '시각 장면 데이터 만드는 중...' });
    
    let visualPrompt = '';
    let editedUserDescription = '';
    let isRegeneration = false;
    let originalBackgroundPrompt = cutData?.originalBackgroundPrompt;

    if (cutData?.customBackgroundPrompt && cutData.customBackgroundPrompt.trim() !== '') {
      isRegeneration = true;
      editedUserDescription = cutData.customBackgroundPrompt;
      // If we don't have original prompt saved (legacy), use the scene description or something
      if (!originalBackgroundPrompt) {
        originalBackgroundPrompt = await extractVisualPrompt(cut, sceneBible);
      }
      visualPrompt = await translateUserDescriptionToBackground(originalBackgroundPrompt, editedUserDescription, sceneBible);
    } else {
      visualPrompt = await extractVisualPrompt(cut, sceneBible);
      originalBackgroundPrompt = visualPrompt; // First time generation
    }

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
        cutData = {
          cutNumber,
          elements: [],
          updatedAt: new Date().toISOString()
        };
      }
      cutData.backgroundImageUrl = cacheResult.publicUrl;
      cutData.originalBackgroundPrompt = originalBackgroundPrompt;
      cutData.updatedAt = new Date().toISOString();
      saveComicCutData(projectData.projectId, cutNumber, cutData);

      updateState({ status: 'success', progress: 100, message: '완료!' });
      return cacheResult.publicUrl;
    }

    console.log(`[ToonSchool Background Cache] MISS cut=${cutNumber}`);

    updateState({ progress: 60, message: '스케치 중...' });
    
    console.log(`[ToonSchool Background] REGENERATE_SINGLE_CUT cut=${cutNumber}`);
    const fullPrompt = buildSingleCutBackgroundPrompt({
      subject: projectData.subject,
      topicTitle: projectData.topicTitle,
      storyTitle: projectData.selectedStoryDescription,
      cutNo: cutNumber,
      visualPrompt: visualPrompt,
      primaryLocation: sceneBible.primaryLocation,
      visualMood: sceneBible.visualMood,
      timeOfDay: sceneBible.timeOfDay,
      originalBackgroundPrompt: originalBackgroundPrompt,
      editedUserDescription: editedUserDescription,
      previousCutBackgroundPrompt: previousCutBackgroundPrompt,
      nextCutBackgroundPrompt: nextCutBackgroundPrompt,
      seriesStylePrompt: 'toonschool-v2',
      styleKey: cacheParams.styleKey
    });
    console.log(`[ToonSchool Background] SINGLE_CUT_PROMPT:\n${fullPrompt}`);

    const panelImageBase64 = await geminiClient.generateImage(fullPrompt, '1:1', []);

    updateState({ progress: 80, message: '그림 최적화 중...' });

    const { compressImageDataUrl } = await import('../../../shared/lib/imageUtils');
    const compressedImage = await compressImageDataUrl(panelImageBase64, 800, 0.8);

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

    // Save to cache asynchronously
    saveComicBackgroundToCache(cacheResult.cacheKey, compressedImage, cacheParams, metadata).then(() => {
      console.log(`[ToonSchool Background Cache] SAVED cut=${cutNumber}`);
    }).catch(err => {
      console.error('Failed to save background to cache', err);
    });

    updateState({ progress: 90, message: '그림을 저장하는 중...' });

    if (!cutData) {
      cutData = {
        cutNumber,
        elements: [],
        updatedAt: new Date().toISOString()
      };
    }
    cutData.backgroundImageUrl = compressedImage;
    cutData.updatedAt = new Date().toISOString();
    saveComicCutData(projectData.projectId, cutNumber, cutData);

    updateState({ status: 'success', progress: 100, message: '완료!' });
    return compressedImage;
  } catch (error: any) {
    console.error(`Error generating comic cut ${cutNumber}:`, error);
    
    let displayMessage = '생성 중 오류가 발생했습니다.';
    let detailedError = error.message;

    if (error.message === 'STORAGE_FULL') {
      displayMessage = '저장 공간 부족';
      detailedError = '저장 공간이 부족합니다. 기존 컷 이미지를 정리하거나 이미지 저장 방식을 변경해야 합니다.';
    } else if (error.message?.toLowerCase().includes('fetch') || error.message?.includes('API') || error.message?.includes('HTTP')) {
      displayMessage = '네트워크/API 오류';
    } else if (error.message?.toLowerCase().includes('parse') || error.message?.includes('JSON')) {
      displayMessage = '데이터 처리 오류';
    }

    updateState({ 
      status: 'error', 
      progress: 0, 
      message: displayMessage, 
      errorMessage: detailedError 
    });
    throw error;
  }
};

