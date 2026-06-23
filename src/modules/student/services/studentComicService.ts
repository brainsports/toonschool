import { geminiClient } from '../../../shared/lib/gemini';
import type { GeneratedComicScript } from './studentScriptService';
import type { ComicProjectData } from '../components/editor/utils/comicStorage';

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
    if (cutData?.customBackgroundPrompt) {
      visualPrompt = cutData.customBackgroundPrompt;
    } else {
      visualPrompt = await extractVisualPrompt(cut, sceneBible);
    }

    updateState({ progress: 60, message: '스케치 중...' });
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

    const panelImageBase64 = await geminiClient.generateImage(fullPrompt, '1:1', []);

    updateState({ progress: 80, message: '그림 최적화 중...' });

    const { compressImageDataUrl } = await import('../../../shared/lib/imageUtils');
    const compressedImage = await compressImageDataUrl(panelImageBase64, 800, 0.8);

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

