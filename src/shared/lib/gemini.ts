import { supabase } from './supabase'
import { TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL } from '../../config/models'
import { httpStatusToErrorCode } from './geminiLogger'

/**
 * HTTP 상태코드별 에러 클래스
 * - errorCode 필드로 UI에서 원인 구분 가능
 * - API 키는 절대 포함하지 않음
 */
export class GeminiError extends Error {
  errorCode: string;
  httpStatus?: number;

  constructor(message: string, errorCode: string, httpStatus?: number) {
    super(message);
    this.name = 'GeminiError';
    this.errorCode = errorCode;
    this.httpStatus = httpStatus;
  }
}

/**
 * Supabase Edge Function (generate-learning-text)을 경유한 Gemini 텍스트 생성
 * - 브라우저에 API Key가 노출되지 않으며, 서버(Deno) Secret의 GEMINI_API_KEY를 안전하게 사용함
 */
async function generateTextWithModel(prompt: string, model: string): Promise<string> {
  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke('generate-learning-text', {
      body: { prompt, model },
    });

    const elapsedMs = Date.now() - startTime;

    if (error) {
      const httpStatus = (error as any).status || 500;
      const errorCode = httpStatusToErrorCode(httpStatus);
      console.error(`[GeminiEF] model=${model} error=${error.message} elapsed=${elapsedMs}ms`);
      throw new GeminiError(
        error.message || `Edge Function 호출 오류 (${httpStatus})`,
        errorCode,
        httpStatus
      );
    }

    if (!data || !data.success) {
      const httpStatus = data?.httpStatus || 400;
      const errorCode = data?.code || httpStatusToErrorCode(httpStatus);
      const userMsg = data?.message || 'AI 응답 생성에 실패했습니다.';
      console.error(`[GeminiEF] model=${model} code=${errorCode} elapsed=${elapsedMs}ms`);
      throw new GeminiError(userMsg, errorCode, httpStatus);
    }

    const text = data.text;
    if (!text || typeof text !== 'string') {
      console.error(`[GeminiEF] model=${model} unexpected response format elapsed=${elapsedMs}ms`);
      throw new GeminiError('응답을 생성하지 못했습니다. (데이터 형식 오류)', 'GEMINI_EMPTY', undefined);
    }

    console.log(`[GeminiEF] model=${model} http=200 elapsed=${elapsedMs}ms`);
    return text;
  } catch (err: any) {
    if (err instanceof GeminiError) {
      throw err;
    }
    const elapsedMs = Date.now() - startTime;
    console.error(`[GeminiEF] model=${model} network/unexpected error=${err?.message || err} elapsed=${elapsedMs}ms`);
    throw new GeminiError('AI 서비스 연결에 실패했습니다.', 'NETWORK_ERROR', undefined);
  }
}

export const geminiClient = {
  /**
   * 보안 향상: 클라이언트에는 API 키가 저장되지 않으며 Edge Function에서 안전하게 관리됨.
   */
  getApiKey: (): string => 'managed-via-edge-function',

  /**
   * Gemini 텍스트 생성 (Supabase Edge Function 경유)
   */
  generateText: async (prompt: string): Promise<string> => {
    // 1차 시도: primary 모델
    try {
      return await generateTextWithModel(prompt, TEXT_GENERATION_MODEL);
    } catch (primaryErr: any) {
      const primaryStatus = primaryErr instanceof GeminiError ? primaryErr.httpStatus : undefined;

      // fallback 모델이 설정되어 있고 재시도 가능한 에러인 경우에만 fallback 시도
      const isRetryable =
        primaryStatus === 503 ||
        primaryStatus === 500 ||
        primaryStatus === 502 ||
        primaryStatus === 504 ||
        primaryErr?.errorCode === 'NETWORK_ERROR' ||
        primaryErr?.errorCode === 'TIMEOUT';

      const hasFallback = typeof TEXT_FALLBACK_MODEL === 'string' && TEXT_FALLBACK_MODEL.length > 0;

      if (isRetryable && hasFallback) {
        console.warn(
          `[GeminiEF] primary model failed (http=${primaryStatus ?? 'network'}). Trying fallback: ${TEXT_FALLBACK_MODEL}`
        );
        try {
          return await generateTextWithModel(prompt, TEXT_FALLBACK_MODEL);
        } catch (fallbackErr: any) {
          console.error(`[GeminiEF] fallback model also failed. Giving up.`);
          throw fallbackErr;
        }
      }

      throw primaryErr;
    }
  },

  /**
   * 지정 모델로 직접 Edge Function 호출
   */
  generateTextWithModel: async (prompt: string, model: string): Promise<string> => {
    return generateTextWithModel(prompt, model);
  },
}
