// 툰어휘사전 lookup-korean-word Edge Function 호출 래퍼.
// supabase-js functions.invoke 는 현재 세션의 access_token 을 자동으로 Authorization 헤더에 포함한다.
import { supabase } from '../../../shared/lib/supabase'
import type {
  VocabularyQuery,
  VocabularySuccessResponse,
  VocabularyErrorResponse,
  VocabularyErrorCode,
  LookupState,
} from '../types/vocabulary'

// 호출 결과를 프론트 상태(LookupState)로 정규화.
// - functions.invoke 가 네트워크/게이트웨이 오류를 throw 하거나 error 를 반환하면 상태로 매핑.
// - HTTP 상태 코드(401/404/400/5xx)를 기준으로 UI 분기.
export async function lookupKoreanWord(query: VocabularyQuery): Promise<LookupState> {
  const { data, error } = await supabase.functions.invoke('lookup-korean-word', {
    body: query,
  })

  if (error) {
    // supabase-js 는 함수가 throw 하거나 비-2xx 일 때 FunctionsHttpError 를 준다.
    // context 오브젝트에 HTTP 상태가 있을 수 있다.
    const ctx = (error as { context?: { status?: number } }).context
    const status = ctx?.status
    if (status === 401) {
      return { status: 'unauthorized', data: null, message: '로그인이 만료되었어요. 다시 로그인해 주세요.' }
    }
    // 그 외는 일반 오류로 처리(상세는 콘솔만).
    return { status: 'error', data: null, message: '단어를 찾는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.' }
  }

  // 정상 응답(success=true)
  if (data && (data as VocabularySuccessResponse).success) {
    const ok = data as VocabularySuccessResponse
    if (!ok.results || ok.results.length === 0) {
      return { status: 'empty', data: null, message: '사전에서 해당 단어를 찾지 못했어요. 낱말을 다시 확인해 주세요.' }
    }
    return { status: 'success', data: ok, message: null }
  }

  // 함수가 반환한 오류 응답(success=false) — code/message 그대로 매핑
  const err = data as VocabularyErrorResponse
  const code: VocabularyErrorCode = (err?.code as VocabularyErrorCode) || 'INTERNAL_ERROR'
  if (code === 'UNAUTHORIZED') {
    return { status: 'unauthorized', data: null, message: '로그인이 만료되었어요. 다시 로그인해 주세요.' }
  }
  if (code === 'WORD_NOT_FOUND') {
    return { status: 'empty', data: null, message: err?.message || '사전에서 해당 단어를 찾지 못했어요. 낱말을 다시 확인해 주세요.' }
  }
  return { status: 'error', data: null, message: err?.message || '단어를 찾는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.' }
}
