// 창작 표지/뒤표지 이미지 캐시 키 생성(프런트).
// 주의: 실제 캐시 조회/저장은 Edge Function(generate-cover-image) 측 _shared/coverCache.ts 에서 담당한다.
// 이 파일은 캐시 키(및 EF에 전달할 cache payload)만 만든다.
// EF 측 coverCache.ts 는 신규 EF 배포 승인 후 동일 알고리즘으로 작성되어야 한다.

export interface CoverCachePayload {
  grade?: string;
  subject?: string; // '창작' → 'creative'
  projectId?: string;
  coverKind: 'front' | 'back';
  presetCode: string;
  visualContext: string; // 시각 묘사 요약(제목/작가 제외)
  additionalPrompt: string;
  inheritFromFront: boolean;
  cacheKey: string;
}

// comicBackgroundCacheService.ts 의 정규화와 동일 규칙(양측 동기화 필수).
const normalize = (s?: string): string => {
  if (!s) return '';
  return s.trim().replace(/\s+/g, ' ').toLowerCase().replace(/\n/g, '').replace(/[,."']/g, '');
};

export const createCoverCacheKey = async (input: Omit<CoverCachePayload, 'cacheKey'>): Promise<string> => {
  const parts = [
    'cover',
    input.grade || 'grade-none',
    input.subject || 'creative',
    input.projectId || 'project-none',
    input.coverKind,
    input.presetCode,
    normalize(input.visualContext),
    normalize(input.additionalPrompt),
    input.inheritFromFront ? 'inherit' : 'no-inherit',
  ];
  const raw = parts.join('|');
  const data = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `cover_${hashHex}`;
};

// subject 이름을 스토리지/캐시 경로용 slug로. comicCache.ts 의 mapSubject 와 동일.
export const mapSubjectForCover = (subject?: string): string => {
  if (!subject) return 'unknown';
  const mapping: Record<string, string> = {
    국어: 'korean', 수학: 'math', 사회: 'social', 과학: 'science', 영어: 'english', 창작: 'creative',
  };
  return mapping[subject] || 'unknown';
};

// EF에 전달할 캐시 페이로드 조립.
export const buildCoverCachePayload = async (input: Omit<CoverCachePayload, 'cacheKey' | 'subject'> & { subject?: string }): Promise<CoverCachePayload> => {
  const cacheKey = await createCoverCacheKey(input);
  return {
    ...input,
    subject: mapSubjectForCover(input.subject),
    cacheKey,
  };
};
