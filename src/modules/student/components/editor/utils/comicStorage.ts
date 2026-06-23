import { saveToStorage, loadFromStorage, StorageFullError } from '../../../utils/projectStorage';

export const getComicStorageKey = (topicId: string, cutNumber?: number) => {
  if (cutNumber !== undefined) {
    return `canvas_comic_state_${topicId}_cut_${cutNumber}`;
  }
  return `comic_project_data_${topicId}`;
};

export interface ComicProjectData {
  projectId: string;
  grade: string;
  semester?: string;
  subject: string;
  mainUnit?: string;
  subUnit?: string;

  topicTitle: string;
  selectedStoryDescription: string;
  coreConcepts: string[];

  script: {
    version: number;
    updatedAt: string;
    cuts: Array<{
      cutNumber: 1 | 2 | 3 | 4 | 5 | 6;
      title: string;
      sceneDescription: string;
      learningPoint?: string;
      dialogues: Array<{
        character: string;
        text: string;
      }>;
    }>;
  };

  characterReferences: {
    version: 'v2';
    hana?: string[];
    doyoon?: string[];
    seoa?: string[];
  };

  cover?: {
    imageUrl?: string;
    updatedAt?: string;
  };

  fullComic?: {
    imageUrl?: string;
    promptVersion?: string;
    scriptVersion?: number;
    createdAt?: string;
  };
}

export const saveComicProjectData = (projectId: string, data: ComicProjectData) => {
  try {
    const success = saveToStorage(`comic_project_data_${projectId}`, data);
    if (!success) throw new StorageFullError();
  } catch (e: any) {
    console.error('Failed to save comic project data', e);
    throw e;
  }
};

export const loadComicProjectData = (projectId: string): ComicProjectData | null => {
  return loadFromStorage<ComicProjectData>(`comic_project_data_${projectId}`);
};

// 하위 호환성을 위해 유지하되, 새로 구현되는 코드에서는 loadComicProjectData 사용을 권장합니다.
export interface ComicMasterData {
  topicId: string;
  masterImage?: string; 
  cutImages: string[];
  createdAt: number;
}

export const saveComicMasterData = (topicId: string, data: ComicMasterData) => {
  try {
    const success = saveToStorage(`comic_master_data_${topicId}`, data);
    if (!success) throw new StorageFullError();
  } catch (e: any) {
    console.error('Failed to save master data', e);
    throw e;
  }
};

export const loadComicMasterData = (topicId: string): ComicMasterData | null => {
  return loadFromStorage<ComicMasterData>(`comic_master_data_${topicId}`);
};

// ----------------------------------------------------------------------
// New V2 Comic Cut Editor Storage
// ----------------------------------------------------------------------

export interface ComicCutElement {
  id: string;
  type: "character" | "speechBubble" | "image" | "text" | "shape";
  characterId?: "hana" | "doyoon" | "seoa";
  speaker?: string;
  text?: string;
  bubbleType?: "basic" | "thought" | "explain" | "emphasis";
  imageUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  flipX?: boolean;
  zIndex: number;
  crop?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  cropScale?: number;
  cropX?: number;
  cropY?: number;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    fontSize?: number;
  };
  [key: string]: any;
}

export interface ComicCutEditData {
  cutNumber: number;
  backgroundImageUrl?: string;
  customBackgroundPrompt?: string;
  backgroundInfo?: {
    sceneTitle?: string;
    description?: string;
    recommendedCharacterPosition?: string;
    recommendedBubblePosition?: string;
    caution?: string;
  };
  elements: ComicCutElement[];
  updatedAt: string;
}

export const getComicCutStorageKey = (topicId: string, cutNumber: number) => {
  return `toonschool:comic:${topicId}:cut:${cutNumber}`;
};

export const saveComicCutData = (topicId: string, cutNumber: number, data: ComicCutEditData) => {
  try {
    const success = saveToStorage(getComicCutStorageKey(topicId, cutNumber), data);
    if (!success) throw new StorageFullError();
  } catch (e: any) {
    console.error(`Failed to save comic cut ${cutNumber} data`, e);
    throw e;
  }
};

export const loadComicCutData = (topicId: string, cutNumber: number): ComicCutEditData | null => {
  return loadFromStorage<ComicCutEditData>(getComicCutStorageKey(topicId, cutNumber));
};

