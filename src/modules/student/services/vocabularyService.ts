// 툰어휘사전 lookup-korean-word Edge Function 호출 래퍼 + 학생별 단어장(나의 단어장) 저장/조회/삭제.
// supabase-js functions.invoke 는 현재 세션의 access_token 을 자동으로 Authorization 헤더에 포함한다.
// 단어장 쿼리는 RLS(student_id = auth.uid())에 의해 본인 단어만 접근 가능하다.
import { supabase } from '../../../shared/lib/supabase'
import type {
  VocabularyQuery,
  VocabularySuccessResponse,
  VocabularyErrorResponse,
  VocabularyErrorCode,
  LookupState,
  SavedVocabularyWord,
  SaveVocabularyWordPayload,
  SaveVocabularyResult,
  VocabularyListOptions,
} from '../types/vocabulary'

const VOCAB_TABLE = 'student_vocabulary_words'

// 중복 저장 판별용 정규화: 앞뒤 공백 제거 + 내부 띄어쓰기 하나로 축약 + 소문자.
// (DB UNIQUE(student_id, normalized_word) 기준과 동일)
export function normalizeWord(word: string): string {
  return word.trim().replace(/\s+/g, ' ').toLowerCase()
}

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

// ── 학생별 단어장(나의 단어장) ──

// 저장(또는 갱신). 동일 학생 + 동일 단어(normalized_word)면 행을 갱신한다.
// student_id 는 RLS 가 auth.uid() 와 일치해야 하므로 호출처에서 로그인 학생 id 를 전달한다.
// 반환 mode: created(새 저장) / updated(기존 단어 갱신). UX 안내 분기용.
export async function saveVocabularyWord(
  studentId: string,
  payload: SaveVocabularyWordPayload,
): Promise<SaveVocabularyResult> {
  if (!studentId) throw new Error('로그인이 필요해요.')
  const normalized = normalizeWord(payload.word)
  if (!normalized) throw new Error('단어를 확인해 주세요.')

  const row = {
    student_id: studentId,
    word: payload.word.trim(),
    normalized_word: normalized,
    part_of_speech: payload.part_of_speech ?? null,
    dictionary_definition: payload.dictionary_definition ?? null,
    easy_definition: payload.easy_definition ?? null,
    daily_example: payload.daily_example ?? null,
    subject_example: payload.subject_example ?? null,
    summary: payload.summary ?? null,
    source_type: payload.source_type ?? null,
    source_id: payload.source_id ?? null,
  }

  // onConflict 로 (student_id, normalized_word) 중복 시 갱신.
  // 같은 트랜잭션에서 now() 가 같으므로, 새 행은 created_at === updated_at 이다.
  const { data, error } = await supabase
    .from(VOCAB_TABLE)
    .upsert(row, { onConflict: 'student_id,normalized_word' })
    .select()
    .single()

  if (error) {
    // 세션 만료(401) 안내.
    if (/jwt|auth|token|401/i.test(error.message)) {
      throw new Error('로그인이 만료되었어요. 다시 로그인해 주세요.')
    }
    throw new Error('저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }

  const word = data as unknown as SavedVocabularyWord
  const mode: 'created' | 'updated' = word.created_at === word.updated_at ? 'created' : 'updated'
  return { word, mode }
}

// 특정 단어가 이미 저장되어 있는지 조회(저장 버튼 상태 표시용).
export async function getSavedVocabularyWord(
  studentId: string,
  word: string,
): Promise<SavedVocabularyWord | null> {
  if (!studentId) return null
  const normalized = normalizeWord(word)
  if (!normalized) return null
  const { data } = await supabase
    .from(VOCAB_TABLE)
    .select('*')
    .eq('student_id', studentId)
    .eq('normalized_word', normalized)
    .maybeSingle()
  return (data as unknown as SavedVocabularyWord) ?? null
}

// 나의 단어장 목록. search(단어 부분일치) + sort(최근순/가나다순).
export async function getStudentVocabulary(
  studentId: string,
  options: VocabularyListOptions = {},
): Promise<SavedVocabularyWord[]> {
  if (!studentId) return []
  const { search, sort = 'recent' } = options
  let query = supabase.from(VOCAB_TABLE).select('*').eq('student_id', studentId)
  if (search && search.trim()) {
    query = query.ilike('word', `%${search.trim()}%`)
  }
  query = sort === 'alpha'
    ? query.order('normalized_word', { ascending: true })
    : query.order('updated_at', { ascending: false })
  const { data, error } = await query
  if (error) {
    if (/jwt|auth|token|401/i.test(error.message)) {
      throw new Error('로그인이 만료되었어요. 다시 로그인해 주세요.')
    }
    throw new Error('단어장을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
  return (data as unknown as SavedVocabularyWord[]) ?? []
}

// 단어 삭제. RLS 로 본인 것만 삭제 가능.
export async function deleteVocabularyWord(studentId: string, wordId: string): Promise<void> {
  if (!studentId || !wordId) return
  const { error } = await supabase
    .from(VOCAB_TABLE)
    .delete()
    .eq('id', wordId)
    .eq('student_id', studentId)
  if (error) {
    if (/jwt|auth|token|401/i.test(error.message)) {
      throw new Error('로그인이 만료되었어요. 다시 로그인해 주세요.')
    }
    throw new Error('삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
}
