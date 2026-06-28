import LZString from 'lz-string';

// Error to throw when storage is full
export class StorageFullError extends Error {
  constructor(message = 'STORAGE_FULL') {
    super(message);
    this.name = 'StorageFullError';
  }
}

// 1. 공통 저장 유틸 (압축 포함)
export function saveToStorage<T>(key: string, data: T): boolean {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = LZString.compressToUTF16(jsonString);
    localStorage.setItem(key, compressed);
    return true;
  } catch (error: any) {
    console.error(`Failed to save to localStorage (${key})`, error);
    if (error.name === 'QuotaExceededError' || error.message?.includes('exceeded the quota')) {
      throw new StorageFullError('브라우저 저장 공간이 꽉 찼습니다. 필요 없는 데이터를 삭제해 주세요.');
    }
    return false;
  }
}

// 공통 로드 유틸
export function loadFromStorage<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    // 이전 버전(압축 안 된 JSON) 호환성 지원: 
    // 압축 안 된 JSON 문자열은 '{' 또는 '[' 로 시작합니다.
    if (data.startsWith('{') || data.startsWith('[')) {
      try {
        const parsed = JSON.parse(data);
        // 하위 호환을 위해 불러온 후 바로 압축 상태로 다시 저장 (마이그레이션)
        saveToStorage(key, parsed);
        return parsed as T;
      } catch (e) {
        // 일반 파싱 실패 시 무시하고 아래 압축 해제로 넘어감
      }
    }
    
    const decompressed = LZString.decompressFromUTF16(data);
    if (!decompressed) return null;
    return JSON.parse(decompressed) as T;
  } catch (error) {
    console.error(`Failed to load from localStorage (${key})`, error);
    return null;
  }
}

// ---------------------------------------------------------
// 단계별 도메인 래퍼
// ---------------------------------------------------------

export const getUnitKey = (projectId: string) => `toonschool:unit:${projectId}`;
export const getTopicKey = (projectId: string) => `toonschool:topic:${projectId}`;
export const getScriptKey = (projectId: string) => `toonschool:script:${projectId}`;
export const getFrontCoverKey = (projectId: string) => `toonschool:front-cover:${projectId}`;
export const getComicKey = (projectId: string) => `toonschool:comic:${projectId}`;
export const getSummaryKey = (projectId: string) => `toonschool:summary:${projectId}`;
export const getQuizKey = (projectId: string) => `toonschool:quiz:${projectId}`;
export const getBackCoverKey = (projectId: string) => `toonschool:back-cover:${projectId}`;

export const projectStorage = {
  // 1. 단원 선택
  saveUnit: <T>(projectId: string, data: T) => saveToStorage(getUnitKey(projectId), data),
  loadUnit: <T>(projectId: string): T | null => loadFromStorage<T>(getUnitKey(projectId)),
  
  // 2. 주제 만들기
  saveTopic: <T>(projectId: string, data: T) => saveToStorage(getTopicKey(projectId), data),
  loadTopic: <T>(projectId: string): T | null => loadFromStorage<T>(getTopicKey(projectId)),

  // 3. 대본 만들기
  saveScript: <T>(projectId: string, data: T) => saveToStorage(getScriptKey(projectId), data),
  loadScript: <T>(projectId: string): T | null => loadFromStorage<T>(getScriptKey(projectId)),

  // 4. 표지 만들기
  saveFrontCover: <T>(projectId: string, data: T) => saveToStorage(getFrontCoverKey(projectId), data),
  loadFrontCover: <T>(projectId: string): T | null => loadFromStorage<T>(getFrontCoverKey(projectId)),

  // 5. 만화제작 (마스터 데이터)
  saveComic: <T>(projectId: string, data: T) => saveToStorage(getComicKey(projectId), data),
  loadComic: <T>(projectId: string): T | null => loadFromStorage<T>(getComicKey(projectId)),

  // 6. 단원 정리
  saveSummary: <T>(projectId: string, data: T) => saveToStorage(getSummaryKey(projectId), data),
  loadSummary: <T>(projectId: string): T | null => loadFromStorage<T>(getSummaryKey(projectId)),

  // 7. 퀴즈 만들기
  saveQuiz: <T>(projectId: string, data: T) => saveToStorage(getQuizKey(projectId), data),
  loadQuiz: <T>(projectId: string): T | null => loadFromStorage<T>(getQuizKey(projectId)),

  // 8. 뒷표지 꾸미기
  saveBackCover: <T>(projectId: string, data: T) => saveToStorage(getBackCoverKey(projectId), data),
  loadBackCover: <T>(projectId: string): T | null => loadFromStorage<T>(getBackCoverKey(projectId)),
};
