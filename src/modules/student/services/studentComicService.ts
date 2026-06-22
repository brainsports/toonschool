import { geminiClient } from '../../../shared/lib/gemini';
import type { GeneratedComicScript } from './studentScriptService';
import type { ComicProjectData } from '../components/editor/utils/comicStorage';

export interface ComicGenerationState {
  status: 'idle' | 'generating' | 'success' | 'error';
  errorMessage?: string;
  progress: number;
  message?: string;
  fullImageUrl?: string;
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

const loadReferenceImage = async (url: string, _role: string, id: number) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return {
      referenceType: 'SUBJECT',
      referenceId: id,
      referenceImage: {
        bytesBase64Encoded: base64
      }
    };
  } catch (error) {
    console.error(`Failed to load reference image: ${url}`, error);
    return null;
  }
};

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
DO NOT include any actual dialogue text in the prompt. We only need the actions, expressions, and objects needed for the picture.

Background Bible:
Location: ${bible.primaryLocation}
Mood: ${bible.visualMood}
Time: ${bible.timeOfDay}

Panel Data:
Scene Description: ${cut.sceneDescription || cut.scene || 'None'}
Original Dialogues (For context only, do NOT draw text): ${cut.dialogues?.map((d: any) => `${d.character || d.speaker}: ${d.text}`).join(' / ') || 'None'}

Create a concise, descriptive visual prompt in English for an image generation model. 
Describe the character's facial expressions, poses, and interactions with objects.
DO NOT put any text or speech bubbles in the description.
Just return the prompt text.
`;
  return await geminiClient.generateText(prompt);
};

const stitchImagesToGrid = async (imagesBase64: string[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    // A4 size
    const A4_WIDTH = 1400;
    const A4_HEIGHT = 1980;
    
    // Panel grid: 2 cols x 3 rows
    const PADDING = 20;
    const BORDER_WIDTH = 4;
    const PANEL_WIDTH = Math.floor((A4_WIDTH - PADDING * 3) / 2);
    const PANEL_HEIGHT = Math.floor((A4_HEIGHT - PADDING * 4) / 3);

    canvas.width = A4_WIDTH;
    canvas.height = A4_HEIGHT;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context not available'));

    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

    let loadedCount = 0;
    const imgElements = imagesBase64.map((base64, index) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 6) {
          // All images loaded, draw them
          imagesBase64.forEach((_, i) => {
             const col = i % 2;
             const row = Math.floor(i / 2);
             const x = PADDING + col * (PANEL_WIDTH + PADDING);
             const y = PADDING + row * (PANEL_HEIGHT + PADDING);
             
             // Draw the image
             ctx.drawImage(imgElements[i], x, y, PANEL_WIDTH, PANEL_HEIGHT);
             
             // Draw border
             ctx.strokeStyle = '#000000';
             ctx.lineWidth = BORDER_WIDTH;
             ctx.strokeRect(x, y, PANEL_WIDTH, PANEL_HEIGHT);
          });
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
      img.onerror = () => reject(new Error(`Failed to load image for panel ${index + 1}`));
      img.src = base64;
      return img;
    });
  });
};

export const generateFullComic = async (
  projectData: ComicProjectData,
  script: GeneratedComicScript,
  onProgress: (state: ComicGenerationState) => void
): Promise<string> => {
  let currentState: ComicGenerationState = {
    status: 'generating',
    progress: 0,
    message: '레퍼런스 이미지 불러오는 중...'
  };

  const updateState = (update: Partial<ComicGenerationState>) => {
    currentState = { ...currentState, ...update };
    onProgress(currentState);
  };

  try {
    const referenceImagesPool: any[] = [];
    let refIdCount = 1;
    
    // Load V2 Character Reference Images
    const lineup = await loadReferenceImage('/images/toonschool/characters/v2/character-lineup/toonschool-v2-character-lineup.png', 'V2 전체 캐릭터 라인업', refIdCount++);
    if (lineup) referenceImagesPool.push(lineup);
    
    const refSheet = await loadReferenceImage('/images/toonschool/characters/v2/character-reference-sheet/toonschool-v2-character-reference-sheet.png', 'V2 캐릭터 레퍼런스 시트', refIdCount++);
    if (refSheet) referenceImagesPool.push(refSheet);

    const loadCharImage = async (url: string, role: string) => {
        const img = await loadReferenceImage(url, role, refIdCount++);
        if (img) referenceImagesPool.push(img);
    };

    await Promise.all([
        loadCharImage('/images/toonschool/characters/v2/hana-master/hana-v2-fullbody.png', '하나 선생님 전신'),
        loadCharImage('/images/toonschool/characters/v2/doyoon-master/doyoon-v2-fullbody.png', '도윤 전신'),
        loadCharImage('/images/toonschool/characters/v2/seoa-master/seoa-v2-fullbody.png', '서아 전신')
    ]);

    updateState({ progress: 10, message: '이야기 배경 분석 중...' });
    
    // 1. Generate Scene Bible
    const sceneBible = await generateSceneBible(projectData);

    // 2. Extract visual prompts and generate images panel by panel
    const generatedImages: string[] = [];
    const cuts = projectData.script.cuts; // Use saved script in projectData, not generated script which could be new

    if (!cuts || cuts.length !== 6) {
      throw new Error('정확히 6컷의 대본 데이터가 필요합니다.');
    }

    for (let i = 0; i < cuts.length; i++) {
      const cutNumber = i + 1;
      updateState({ 
        progress: 10 + Math.floor((i / 6) * 70), 
        message: `${cutNumber}번째 컷 시각 장면 데이터 만드는 중...` 
      });

      const visualPrompt = await extractVisualPrompt(cuts[i], sceneBible);

      updateState({ 
        progress: 10 + Math.floor(((i + 0.5) / 6) * 70), 
        message: `${cutNumber}번째 컷 스케치 중...` 
      });

      const fullPrompt = `A high quality, bright, and colorful educational comic panel for elementary school students.
DO NOT generate speech bubbles, captions, or any text (no Korean, no English). We will add text overlay later.
Maintain consistent character appearances referencing the provided images (Hana, Doyoon, Seoa).
Only draw one single panel. No split screen, no collage.

Scene Bible Context:
Location: ${sceneBible.primaryLocation}
Mood: ${sceneBible.visualMood}
Time: ${sceneBible.timeOfDay}

Panel Visual Action:
${visualPrompt}
`;
      // Generate individual panel image (1:1 ratio)
      const panelImageBase64 = await geminiClient.generateImage(fullPrompt, '1:1', referenceImagesPool);
      generatedImages.push(panelImageBase64);
    }

    updateState({ progress: 85, message: '생성된 6장의 그림을 조립하는 중...' });

    // 3. Stitch images together using Canvas
    const stitchedImageBase64 = await stitchImagesToGrid(generatedImages);

    updateState({ status: 'success', progress: 100, message: '만화 완성!', fullImageUrl: stitchedImageBase64 });
    return stitchedImageBase64;

  } catch (error: any) {
    console.error('Error generating full comic:', error);
    updateState({ status: 'error', progress: 0, message: '오류가 발생했습니다.', errorMessage: error.message });
    throw error;
  }
};
