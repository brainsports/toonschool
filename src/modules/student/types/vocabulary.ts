// 툰어휘사전 Edge Function(lookup-korean-word) 요청/응답 타입.
// 백엔드 응답 형식(supabase/functions/lookup-korean-word/index.ts)과 일치.

export interface VocabularyQuery {
  word: string
  grade?: number
  subject?: string
  unit?: string
}

export interface VocabularyResult {
  targetCode: number
  word: string
  pronunciation: string | null
  partOfSpeech: string | null
  senseOrder: number
  officialDefinition: string
  officialExample: string | null
  easyDefinition: string | null
  dailyExample: string | null
  schoolExample: string | null
  keyPoint: string | null
}

export type VocabularyAiStatus = 'success' | 'unavailable'

export interface VocabularySuccessResponse {
  success: true
  query: VocabularyQuery
  source: { name: string; license: string }
  results: VocabularyResult[]
  aiStatus: VocabularyAiStatus
}

// 오류 응답(공통 형태). code 는 백엔드 ErrorCode 참조.
export type VocabularyErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_WORD'
  | 'UNAUTHORIZED'
  | 'METHOD_NOT_ALLOWED'
  | 'WORD_NOT_FOUND'
  | 'DICTIONARY_API_ERROR'
  | 'INTERNAL_ERROR'

export interface VocabularyErrorResponse {
  success: false
  code: VocabularyErrorCode
  message: string
}

// 프론트에서 사용하는 통합 결과(성공 데이터 + 상태 메타).
export type LookupStatus = 'idle' | 'loading' | 'success' | 'empty' | 'unauthorized' | 'error'

export interface LookupState {
  status: LookupStatus
  data: VocabularySuccessResponse | null
  message: string | null
}
