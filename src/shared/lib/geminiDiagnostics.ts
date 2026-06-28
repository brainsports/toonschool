/**
 * Gemini API Smoke Test (개발 환경 전용)
 *
 * 브라우저 콘솔에서 실행:
 *   window.runGeminiSmokeTest()
 *
 * API 키는 절대 로그에 출력하지 않습니다.
 */

import { TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL } from '../../config/models';
import { geminiClient, GeminiError } from './gemini';

interface ModelTestResult {
  model: string;
  status: 'ok' | 'error';
  httpStatus?: number;
  errorCode?: string;
  elapsedMs: number;
  responsePreview?: string;
}

async function testModel(model: string, prompt: string): Promise<ModelTestResult> {
  const start = Date.now();
  try {
    const result = await geminiClient.generateTextWithModel(prompt, model);
    return {
      model,
      status: 'ok',
      elapsedMs: Date.now() - start,
      responsePreview: result.substring(0, 60).replace(/\n/g, ' '),
    };
  } catch (err: any) {
    const httpStatus = err instanceof GeminiError ? err.httpStatus : undefined;
    const errorCode = err instanceof GeminiError ? err.errorCode : 'UNKNOWN';
    return {
      model,
      status: 'error',
      httpStatus,
      errorCode,
      elapsedMs: Date.now() - start,
    };
  }
}

function printResult(result: ModelTestResult) {
  const icon = result.status === 'ok' ? '✅' : '❌';
  const parts = [
    `${icon} ${result.model}`,
    `${result.elapsedMs}ms`,
  ];
  if (result.status === 'ok') {
    parts.push(`응답: "${result.responsePreview}"`);
  } else {
    parts.push(`HTTP ${result.httpStatus ?? '?'}`);
    parts.push(`errorCode: ${result.errorCode}`);
  }
  if (result.status === 'ok') {
    console.log(parts.join(' | '));
  } else {
    console.error(parts.join(' | '));
  }
}

export async function runGeminiSmokeTest(singleCutPromptSample?: string): Promise<void> {
  console.group('🔬 Gemini Smoke Test');
  console.log('API 키 유무:', !!geminiClient.getApiKey() ? '있음' : '❌ 없음');
  console.log('Primary 모델:', TEXT_GENERATION_MODEL);
  console.log('Fallback 모델:', TEXT_FALLBACK_MODEL);
  console.log('');

  const shortPrompt = 'Respond with "OK" only.';

  // a. Primary 모델 짧은 텍스트
  console.log('[a] Primary 모델 단순 텍스트 테스트...');
  const resultA = await testModel(TEXT_GENERATION_MODEL, shortPrompt);
  printResult(resultA);

  // b. Fallback 모델 짧은 텍스트
  console.log('[b] Fallback 모델 단순 텍스트 테스트...');
  const resultB = await testModel(TEXT_FALLBACK_MODEL, shortPrompt);
  printResult(resultB);

  // c. 실제 1번 컷 SINGLE_CUT_PROMPT (있을 경우)
  if (singleCutPromptSample) {
    console.log('[c] 실제 1번 컷 프롬프트 테스트...');
    const resultC = await testModel(TEXT_GENERATION_MODEL, singleCutPromptSample);
    printResult(resultC);
  }

  // 종합 판단
  console.log('');
  if (resultA.status === 'error' && resultB.status === 'error') {
    if (resultA.httpStatus === 503 || resultB.httpStatus === 503) {
      console.error('🚨 진단: Gemini 모델이 현재 혼잡합니다. 코드 문제가 아닌 API/모델 문제입니다.');
    } else if (resultA.httpStatus === 429 || resultB.httpStatus === 429) {
      console.error('🚨 진단: API 요청 한도 초과. 잠시 후 다시 시도해 주세요.');
    } else if (resultA.httpStatus === 401 || resultA.httpStatus === 403) {
      console.error('🚨 진단: API 키 또는 권한 문제. VITE_GEMINI_API_KEY 환경변수를 확인해 주세요.');
    } else {
      console.error('🚨 진단: 두 모델 모두 실패. 네트워크 또는 계정 문제를 확인해 주세요.');
    }
  } else if (resultA.status === 'error' && resultB.status === 'ok') {
    console.warn('⚠️ 진단: Primary 모델 실패, Fallback 정상. Fallback으로 생성 가능합니다.');
  } else if (resultA.status === 'ok') {
    console.log('✅ 진단: Primary 모델 정상 동작 중. 이미지 생성 Worker 상태를 확인하세요.');
  }

  console.groupEnd();
}

// 개발 환경에서 window에 등록
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).runGeminiSmokeTest = runGeminiSmokeTest;
  console.log('[ToonSchool] Smoke test 함수 등록됨. 콘솔에서 window.runGeminiSmokeTest() 실행 가능');
}
