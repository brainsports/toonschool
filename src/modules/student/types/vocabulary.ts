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

// ── 학생별 단어장(나의 단어장) 저장 관련 ──
// 테이블: public.student_vocabulary_words (마이그레이션 20260721120000).

// 저장 출처. 시작 화면처럼 작업물이 없으면 source_id 는 null 이 될 수 있다.
export type VocabularySourceType = 'mindmap_start' | 'mindmap_editor' | 'comic_editor'

// 단어장 한 행(조회/목록용). 컬럼명은 스네이크 그대로 매핑.
export interface SavedVocabularyWord {
  id: string
  student_id: string
  word: string
  normalized_word: string
  part_of_speech: string | null
  dictionary_definition: string | null
  easy_definition: string | null
  daily_example: string | null
  subject_example: string | null
  summary: string | null
  source_type: VocabularySourceType | null
  source_id: string | null
  created_at: string
  updated_at: string
}

// 저장(저장/갱신) 요청 페이로드.
export interface SaveVocabularyWordPayload {
  word: string
  part_of_speech?: string | null
  dictionary_definition?: string | null
  easy_definition?: string | null
  daily_example?: string | null
  subject_example?: string | null
  summary?: string | null
  source_type?: VocabularySourceType | null
  source_id?: string | null
}

// 저장 결과 — 새로 저장했는지, 기존 단어를 갱신했는지 구분(UX 안내용).
export interface SaveVocabularyResult {
  word: SavedVocabularyWord
  mode: 'created' | 'updated'
}

// 단어장 목록 조회 옵션.
export interface VocabularyListOptions {
  search?: string
  sort?: 'recent' | 'alpha'
}
