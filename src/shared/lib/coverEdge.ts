// 창작 표지/뒤표지 이미지 생성 Edge Function(generate-cover-image) 호출 헬퍼.
// comicEdge.ts 의 패턴(재시도 3회 + 지수 백오프, 비동기 폴링)을 재사용.
//
// 주의: 대상 EF 'generate-cover-image' 와 캐시 테이블 cover_image_cache 는
// 만화 생성 보호 영역(Edge Function/DB)이므로 별도 승인 후 배포된다.
// 배포 전 호출 시 FunctionsError(INVOKE_ERROR)를 반환한다.
// UI는 result.message 로 사용자에게 안내한다.
import { supabase } from './supabase';
import type { CoverCachePayload } from '../../modules/student/services/coverCacheService';

export interface GenerateCoverImageParams {
  projectId: string;
  coverKind: 'front' | 'back';
  presetCode: string;
  prompt: string; // fully-assembled 이미지 프롬프트
  cache: CoverCachePayload;
  requestId?: string;
}

export interface GenerateCoverImageResult {
  success: boolean;
  coverKind: 'front' | 'back';
  resultUrl: string;
  cacheHit: boolean;
  processing?: boolean;
  elapsedMs?: number;
  jobId?: string;
  code?: string; // RATE_LIMITED / IN_PROGRESS / NO_IMAGE / PROVIDER_* / STORAGE_ERROR / DB_ERROR / UNAUTHORIZED / INVALID_INPUT / SERVER_CONFIG / INVOKE_ERROR / POLL_TIMEOUT / FUNCTION_NOT_READY
  message?: string;
}

const RETRYABLE_CODES = new Set(['RATE_LIMITED', 'IN_PROGRESS', 'PROVIDER_5XX', 'PROVIDER_ERROR']);

// 비동기 작업 폴링 — 기존 generation_jobs 테이블 재사용(jobId로 상태/result_url 조회).
export const waitForCoverJob = async (
  jobId: string,
  coverKind: 'front' | 'back',
  timeoutMs = 300_000
): Promise<GenerateCoverImageResult> => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const { data, error } = await supabase
      .from('generation_jobs')
      .select('status,result_url,elapsed_ms,error_message')
      .eq('id', jobId)
      .single();
    if (!error && data?.status === 'completed' && data.result_url) {
      return {
        success: true, coverKind, resultUrl: data.result_url, cacheHit: false,
        elapsedMs: data.elapsed_ms ?? Date.now() - startedAt, jobId,
      };
    }
    if (!error && data?.status === 'failed') {
      return {
        success: false, coverKind, resultUrl: '', cacheHit: false, jobId,
        code: 'PROVIDER_ERROR', message: data.error_message || '그림 생성에 실패했어요. 다시 만들어 주세요.',
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  return {
    success: false, coverKind, resultUrl: '', cacheHit: false, jobId,
    code: 'POLL_TIMEOUT', message: '그림 생성 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.',
  };
};

export const invokeGenerateCoverImage = async (
  params: GenerateCoverImageParams
): Promise<GenerateCoverImageResult> => {
  const maxAttempts = 3;
  let attempt = 0;
  let backoff = 1000;

  while (true) {
    attempt++;
    const { data, error } = await supabase.functions.invoke('generate-cover-image', {
      body: {
        projectId: params.projectId,
        coverKind: params.coverKind,
        presetCode: params.presetCode,
        prompt: params.prompt,
        cache: params.cache,
        requestId: params.requestId,
      },
    });

    if (error) {
      // EF가 아직 배포되지 않은 경우 FunctionsError(HTTP 404/FunctionsHttpError) → 재시도 무의미.
      // 그 외 네트워크 오류는 재시도 가능.
      const isNotReady =
        error.name === 'FunctionsHttpError' ||
        error.name === 'FunctionsRelayError' ||
        /not\s+found|404|relay/i.test(error.message || '');
      if (isNotReady) {
        return {
          success: false, coverKind: params.coverKind, resultUrl: '', cacheHit: false,
          code: 'FUNCTION_NOT_READY',
          message: 'AI 표지 만들기 기능이 곧 준비됩니다. 잠시 후 다시 시도해 주세요.',
        };
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, backoff));
        backoff *= 2;
        continue;
      }
      return {
        success: false, coverKind: params.coverKind, resultUrl: '', cacheHit: false,
        code: 'INVOKE_ERROR', message: '표지를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
      };
    }

    const result = (data || {}) as GenerateCoverImageResult;
    if (result.success) {
      return { ...result, coverKind: params.coverKind };
    }

    const code = result.code || 'UNKNOWN';
    if (RETRYABLE_CODES.has(code) && attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, backoff));
      backoff *= 2;
      continue;
    }
    return { ...result, coverKind: params.coverKind };
  }
};
