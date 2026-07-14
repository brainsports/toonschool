// 만화 배경 생성 Edge Function(generate-comic-background) 호출 헬퍼.
// 한 컷당 1회 호출. 서버는 항상 HTTP 200 + {success, code, message, ...} 본문을 반환하므로
// data.success / data.code 로 결과를 판별한다.
// 재시도 가능 오류(RATE_LIMITED/IN_PROGRESS/PROVIDER_5XX/PROVIDER_ERROR)는 지수 백오프로 최대 3회 재시도.
import { supabase } from './supabase';

export interface ComicBackgroundCachePayload {
  grade?: string;
  subject?: string;
  semester?: string;
  unitId?: string;
  subunitId?: string;
  topicTitle?: string;
  styleKey?: string;
  backgroundPrompt: string; // 캐시 키용 visual prompt (전체 이미지 프롬프트 아님)
}

export interface GenerateComicBackgroundParams {
  projectId: string;
  cutNumber: number;
  prompt: string; // fully-assembled 이미지 프롬프트
  cache: ComicBackgroundCachePayload;
  requestId?: string;
}

export interface GenerateComicBackgroundResult {
  success: boolean;
  cutNumber: number;
  resultUrl: string;
  cacheHit: boolean;
  elapsedMs?: number;
  geminiMs?: number;
  jobId?: string;
  reusedJob?: boolean;
  code?: string;      // RATE_LIMITED / IN_PROGRESS / NO_IMAGE / PROVIDER_* / STORAGE_ERROR / DB_ERROR / UNAUTHORIZED / INVALID_INPUT / SERVER_CONFIG / INVOKE_ERROR
  message?: string;   // 사용자 노출용 메시지
}

const RETRYABLE_CODES = new Set([
  'RATE_LIMITED', 'IN_PROGRESS', 'PROVIDER_5XX', 'PROVIDER_ERROR',
]);

export async function invokeGenerateComicBackground(
  params: GenerateComicBackgroundParams
): Promise<GenerateComicBackgroundResult> {
  const maxAttempts = 3;
  let attempt = 0;
  let backoff = 1000;

  while (true) {
    attempt++;
    const { data, error } = await supabase.functions.invoke('generate-comic-background', {
      body: {
        projectId: params.projectId,
        cutNumber: params.cutNumber,
        prompt: params.prompt,
        cache: params.cache,
        requestId: params.requestId,
      },
    });

    if (error) {
      // 네트워크/게이트웨이 오류. 본문이 없으므로 INVOKE_ERROR 로 간주(재시도 가능).
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, backoff));
        backoff *= 2;
        continue;
      }
      return {
        success: false, cutNumber: params.cutNumber, resultUrl: '', cacheHit: false,
        code: 'INVOKE_ERROR', message: '이 컷의 배경을 만들지 못했어요. 해당 컷만 다시 만들어 주세요.',
      };
    }

    const result = (data || {}) as GenerateComicBackgroundResult;
    if (result.success) {
      return { ...result, cutNumber: params.cutNumber };
    }

    // success:false — code 기반 재시도 여부 결정
    const code = result.code || 'UNKNOWN';
    if (RETRYABLE_CODES.has(code) && attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
      continue;
    }
    return { ...result, cutNumber: params.cutNumber };
  }
}
