/**
 * Gemini 생성 파이프라인 stage별 진단 로그 유틸리티
 * - API 키 절대 미출력
 * - cutNumber, stage, modelName, retryCount, elapsedMs, httpStatus만 출력
 */

export type GenerationStage =
  | 'sceneBible'
  | 'extractVisualPrompt'
  | 'combinedPromptGen'
  | 'buildSingleCutPrompt'
  | 'enqueueJob'
  | 'pollImageJob'
  | 'saveCutResult';

export type StageStatus = 'start' | 'success' | 'error' | 'fallback' | 'skip';

export interface StageLogParams {
  cutNumber: number;
  stage: GenerationStage;
  status: StageStatus;
  modelName?: string;
  retryCount?: number;
  elapsedMs?: number;
  httpStatus?: number;
  errorCode?: string;   // e.g. GEMINI_503, GEMINI_429
  note?: string;        // 추가 설명 (API 키 포함 절대 금지)
}

const STAGE_ICONS: Record<StageStatus, string> = {
  start:    '⏳',
  success:  '✅',
  error:    '❌',
  fallback: '🔄',
  skip:     '⏭️',
};

/**
 * Stage별 진단 로그를 콘솔에 출력합니다.
 * API 키는 절대 출력하지 않습니다.
 */
export function logStage(params: StageLogParams): void {
  const { cutNumber, stage, status, modelName, retryCount, elapsedMs, httpStatus, errorCode, note } = params;
  const icon = STAGE_ICONS[status];

  const parts: string[] = [
    `[ToonSchool]`,
    `${icon}`,
    `cut=${cutNumber}`,
    `stage=${stage}`,
    `status=${status}`,
  ];

  if (modelName) parts.push(`model=${modelName}`);
  if (retryCount !== undefined) parts.push(`retry=${retryCount}`);
  if (elapsedMs !== undefined) parts.push(`elapsed=${elapsedMs}ms`);
  if (httpStatus !== undefined) parts.push(`http=${httpStatus}`);
  if (errorCode) parts.push(`errorCode=${errorCode}`);
  if (note) parts.push(`note=${note}`);

  const msg = parts.join(' | ');

  if (status === 'error') {
    console.error(msg);
  } else if (status === 'fallback') {
    console.warn(msg);
  } else {
    console.log(msg);
  }
}

/**
 * elapsedMs를 계산하기 위한 타이머 시작 함수
 */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * HTTP 상태코드를 에러코드로 변환
 */
export function httpStatusToErrorCode(status: number): string {
  switch (status) {
    case 503: return 'GEMINI_503';
    case 429: return 'GEMINI_429';
    case 401: return 'GEMINI_401';
    case 403: return 'GEMINI_403';
    case 404: return 'GEMINI_404';
    default:  return `GEMINI_${status}`;
  }
}

/**
 * HTTP 상태코드별 사용자 표시 메시지
 */
export function getErrorMessageByCode(errorCode: string): string {
  switch (errorCode) {
    case 'GEMINI_503':
      return '그림을 다시 만들어 볼게요. 잠시 후 다시 시도해 주세요.';
    case 'GEMINI_429':
      return '그림을 다시 만들어 볼게요. 잠시 후 다시 시도해 주세요.';
    case 'GEMINI_401':
    case 'GEMINI_403':
      return '그림을 다시 만들어 볼게요. 잠시 후 다시 시도해 주세요.';
    case 'GEMINI_404':
      return '그림을 다시 만들어 볼게요. 잠시 후 다시 시도해 주세요.';
    case 'TIMEOUT':
      return '그림 생성에 실패했어요. 이 컷만 다시 생성해 주세요.';
    case 'POLL_TIMEOUT':
      return '그림 생성에 실패했어요. 이 컷만 다시 생성해 주세요.';
    case 'WORKER_FAILED':
      return '그림 생성에 실패했어요. 다시 시도해 주세요.';
    case 'ENQUEUE_FAILED':
      return '그림을 다시 만들어 볼게요. 잠시 후 다시 시도해 주세요.';
    default:
      return '그림 생성에 실패했어요. 다시 시도해 주세요.';
  }
}
