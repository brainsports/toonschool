import { TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL } from '../../config/models'
import { httpStatusToErrorCode } from './geminiLogger'

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || ''

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
 * 단일 모델로 Gemini 텍스트 생성
 * - API 키는 절대 로그에 출력하지 않음
 */
async function generateTextWithModel(prompt: string, model: string): Promise<string> {
  const startTime = Date.now();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  const elapsedMs = Date.now() - startTime;

  if (!response.ok) {
    const errorCode = httpStatusToErrorCode(response.status);
    let userMessage: string;

    switch (response.status) {
      case 503:
        userMessage = 'Gemini 모델이 현재 응답하지 않습니다. (503)';
        break;
      case 429:
        userMessage = 'API 요청 한도를 초과했습니다. (429)';
        break;
      case 401:
      case 403:
        userMessage = 'API 키 또는 권한 문제입니다. (401/403)';
        break;
      case 404:
        userMessage = '모델을 찾을 수 없습니다. (404)';
        break;
      default:
        userMessage = `Gemini API 오류 (${response.status})`;
    }

    console.error(`[Gemini] model=${model} http=${response.status} elapsed=${elapsedMs}ms`);
    throw new GeminiError(userMessage, errorCode, response.status);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error(`[Gemini] model=${model} unexpected response format elapsed=${elapsedMs}ms`);
    throw new GeminiError('응답을 생성하지 못했습니다. (데이터 형식 오류)', 'GEMINI_EMPTY', undefined);
  }

  console.log(`[Gemini] model=${model} http=200 elapsed=${elapsedMs}ms`);
  return text;
}

export const geminiClient = {
  getApiKey: (): string => GEMINI_API_KEY,

  /**
   * Gemini 텍스트 생성
   *
   * 정책 (2026-06-27 smoke test 기준):
   * - Primary: TEXT_GENERATION_MODEL (gemini-3.5-flash)
   * - Fallback: TEXT_FALLBACK_MODEL가 설정된 경우에만 시도 (현재 빈 문자열 → fallback 없음)
   * - 503 → 로컬 fallback 프롬프트로 이미지 생성 진행 (호출자에서 처리)
   * - 429/401/403 → 즉시 에러 (재시도해도 소용없음)
   * - 불안정한 모델(503 확인된 모델)로 fallback하지 않음
   */
  generateText: async (prompt: string): Promise<string> => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('[Gemini] API key is not configured.')
      throw new GeminiError(
        'API Key가 설정되지 않았습니다. .env 파일을 확인해 주세요.',
        'GEMINI_NO_KEY'
      );
    }

    // 1차 시도: primary 모델
    try {
      return await generateTextWithModel(prompt, TEXT_GENERATION_MODEL);
    } catch (primaryErr: any) {
      const primaryStatus = primaryErr instanceof GeminiError ? primaryErr.httpStatus : undefined;

      // fallback 모델이 설정되어 있고 503/5xx/네트워크 오류인 경우에만 fallback 시도
      const isRetryable =
        primaryStatus === 503 ||
        primaryStatus === 500 ||
        primaryStatus === 502 ||
        primaryStatus === 504 ||
        primaryErr?.name === 'TypeError' ||
        primaryErr?.message?.includes('fetch');

      const hasFallback = (TEXT_FALLBACK_MODEL as string).length > 0;

      if (isRetryable && hasFallback) {
        console.warn(
          `[Gemini] primary model failed (http=${primaryStatus ?? 'network'}). Trying fallback: ${TEXT_FALLBACK_MODEL}`
        );
        try {
          return await generateTextWithModel(prompt, TEXT_FALLBACK_MODEL);
        } catch (fallbackErr: any) {
          console.error(`[Gemini] fallback model also failed. Giving up.`);
          throw fallbackErr;
        }
      }

      // fallback 없거나 재시도 불필요한 에러 → 원래 에러 throw
      // 호출자(studentComicService)에서 GeminiError를 catch해 로컬 fallback 처리
      throw primaryErr;
    }
  },

  /**
   * 지정 모델로 직접 호출 (smoke test 등 용도)
   */
  generateTextWithModel: async (prompt: string, model: string): Promise<string> => {
    return generateTextWithModel(prompt, model);
  },
}
