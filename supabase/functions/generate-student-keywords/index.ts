// 학생 키워드 생성 Edge Function.
// React 프런트엔드 → (이 함수) → Gemini API. 별도 백엔드/Vercel Route 없음.
//
// 책임: JWT 인증 → 입력 검증 → Gemini 텍스트(JSON) 키워드 생성 → 응답 검증/보충 → 반환.
//
// 보안: GEMINI_API_KEY·SUPABASE_SERVICE_ROLE_KEY 는 Deno.env(Secret)에서만 사용. 프런트 비노출.
// 로그: 단계·소요시간·개수만. 키·토큰·프롬프트 전문·개인정보는 절대 출력하지 않는다.
// 응답: 항상 HTTP 200 + 본문 {ok, code, message, keywords, source, model, durationMs, requestId}.
//       supabase-js.invoke 가 본문을 단일 경로로 파싱하도록 한다(의미는 code 로 전달).
//
// 핵심 최적화(2026-07): flash 계열 모델의 thinking(사고) 토큰이 기본 ON 이라
// 키워드 한 번 생성에 9~11초 + maxOutputTokens 를 사고 토큰이 소진해 응답이 비어
// 파싱 실패→재시도(최악 24초) 하던 문제를 thinkingBudget=0 + JSON 모드로 해결.
// 결과 평균 약 2.5~3초, 파싱 실패 제거.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'
import { createAdminClient, resolveCaller } from '../_shared/client.ts'

const TAG = 'student-keywords'
// 모델은 환경변수(GEMINI_KEYWORD_MODEL)로 교체 가능. 기본값은 GA 안정 모델(mindmap과 동일).
const KEYWORD_MODEL = Deno.env.get('GEMINI_KEYWORD_MODEL') || 'gemini-2.5-flash'

// 외부 AI 호출 제한 시간. 이 안에 응답이 없으면 즉시 서버 fallback.
const AI_TIMEOUT_MS = 8000
// 429/5xx 일시적 오류에만 1회 재시도 (짧은 backoff).
const RETRY_BACKOFF_MS = 800
const MIN_COUNT = 1
const MAX_COUNT = 10

type CurriculumContext = {
  unitGoal?: string
  learningGoal?: string
  achievementStandards?: string
  unitSummary?: string
  subunitSummary?: string
  contentScope?: string
  keyQuestions?: string
}

type KeywordItem = { word: string; reason: string }

function log(stage: string, fields: Record<string, unknown> = {}) {
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (/key|token|prompt|secret|authorization/i.test(k)) continue
    safe[k] = v
  }
  console.log([`[${TAG}]`, stage, ...Object.entries(safe).map(([k, v]) => `${k}=${v}`)].join(' | '))
}

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify({ ok: true, ...body }), { headers: jsonHeaders, status: 200 })
const fail = (message: string, code: string, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ ok: false, code, message, ...extra }), { headers: jsonHeaders, status: 200 })

const userMessage = (code: string): string => {
  switch (code) {
    case 'UNAUTHORIZED': return '로그인이 만료되었어요. 다시 로그인해 주세요.'
    case 'INVALID_INPUT': return '키워드를 만들 정보가 부족해요. 학년·과목·단원을 다시 확인해 주세요.'
    case 'TIMEOUT': return '잠시 후 다시 시도해 주세요.'
    default: return '키워드를 만드는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
  }
}

// ---------------------------------------------------------------------------
// Gemini 호출: thinkingBudget=0 + JSON 모드. AbortController 타임아웃 + 1회 재시도.
// mindmap/generateJson 패턴을 키워드용으로 단축.
// ---------------------------------------------------------------------------
async function generateKeywordsJson(prompt: string): Promise<string> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) {
    log('configError', { note: 'GEMINI_API_KEY missing' })
    throw Object.assign(new Error('config'), { code: 'SERVER_CONFIG' })
  }
  const doCall = async (signal: AbortSignal) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${KEYWORD_MODEL}:generateContent?key=${geminiKey}`
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          maxOutputTokens: 2048,
          // flash 계열 사고 토큰을 끄지 않으면 9~11초 + maxOutputTokens 소진으로 빈 응답.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })
  }

  const attempt = async (): Promise<string> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
    let res: Response
    try {
      res = await doCall(controller.signal)
    } catch (e) {
      clearTimeout(timer)
      const aborted = (e as Error)?.name === 'AbortError'
      throw Object.assign(new Error(aborted ? 'timeout' : 'fetch_fail'), {
        code: aborted ? 'TIMEOUT' : 'PROVIDER_ERROR',
        retryable: !aborted,
      })
    }
    clearTimeout(timer)
    if (!res.ok) {
      const http = res.status
      const retryable = [429, 500, 502, 503, 504].includes(http)
      throw Object.assign(new Error(`http_${http}`), { code: 'PROVIDER_ERROR', httpStatus: http, retryable })
    }
    const data = await res.json().catch(() => ({}))
    const parts = data?.candidates?.[0]?.content?.parts as Array<{ text?: string }> | undefined
    const text = parts?.map((p) => p?.text ?? '').join('') ?? ''
    if (!text) throw Object.assign(new Error('empty'), { code: 'BAD_MODEL_OUTPUT', retryable: false })
    return text
  }

  try {
    return await attempt()
  } catch (e) {
    const err = e as { retryable?: boolean; code?: string }
    if (err.retryable) {
      log('retry', { code: err.code })
      await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS))
      return await attempt() // 2차 실패는 호출자에서 fallback 처리
    }
    throw e
  }
}

// ---------------------------------------------------------------------------
// 키워드 품질 규칙 (studentTopicService.ts 에서 충실히 이식).
// ---------------------------------------------------------------------------
const BANNED_KEYWORD_TERMS = new Set([
  '탐구야', '즐겁게', '놀자', '놀자!', '해보자', '하기', '되기', '알기',
  '생각', '이야기', '활동', '재미', '공부', '학습',
  '우리', '학생', '사람들', '경우', '위치', '설명', '과정', '의미', '종류',
  '이유', '까닭', '모습', '방식', '결과', '효과', '특성',
  '이해', '평가', '목표', '성취', '기준',
  '관찰', '실험', '탐구', '비교', '변화', '결과', '활동', '기록', '확인', '정리'
])

const BAD_KEYWORD_TERMS = new Set([
  '만들기', '내리', '내리는', '그리기', '꾸미기', '하기', '보기', '알아보기',
  '확인하기', '생각하기', '비교하기', '관찰하기', '실험하기', '탐구하기',
  '정리하기', '설명하기', '생각', '확인', '결과', '탐구', '활동'
])

const SCIENCE_CONCEPT_ALLOWLIST = new Set([
  '용해', '용액', '용질', '용매', '물', '가루', '녹기', '진하기', '섞임', '눈',
  '동물', '서식지', '먹이', '생김새', '보호색', '사막', '북극', '날개',
  '식물', '뿌리', '줄기', '잎', '꽃', '씨', '햇빛', '양분',
  '공기', '온도', '자석', '전기', '소리', '그림자', '지층', '화석'
])
const SCIENCE_LOW_VALUE_TERMS = new Set(['풍경', '장면', '모습', '생각', '확인', '결과', '탐구', '활동'])

const REQUIRED_BAD_KEYWORD_TERMS = new Set([
  '있다', '없다', '된다', '하다', '필요하다', '움직이다', '설명하다',
  '설명함', '알아보기', '생각하기', '비교하기', '관찰하기',
  '미션', '모험', '탐정', '비밀기지', '퀘스트', '게임',
  '것', '내용', '문제', '방법', '이유'
])
const REQUIRED_JOSA_ENDINGS = ['에서', '으로', '로', '은', '는', '이', '가', '을', '를', '의', '와', '과']
const REQUIRED_TRAILING_VERBS = /(있다|없다|된다|하다|필요하다|움직이다|설명하다)$/
const REQUIRED_EXPLANATION_WORDS = /(설명함|알아보기|생각하기|비교하기|관찰하기)$/

const SCIENCE_GENERIC_KEYWORDS = new Set(['관찰', '실험', '탐구', '비교', '변화', '결과', '활동', '확인', '기록', '정리', '에너지'])
const SCIENCE_DEFAULT_SAFE_KEYWORDS = ['관찰', '실험', '변화', '비교', '현상', '원리', '자연', '물질', '에너지', '생명']

const FINAL_JOSA_ENDINGS = ['에서', '에게', '에는', '으로', '부터', '까지', '로', '은', '는', '이', '가', '을', '를', '의', '와', '과', '에', '도', '만']
const BANNED_FINAL_KEYWORDS = [
  '의해', '통해', '위해', '대한', '관한', '때문에', '경우', '동안',
  '질문', '단서', '장면', '미션', '모험', '퀘스트', '게임', '이야기',
  '주인공', '친구', '해결', '문제', '방법', '이유', '내용', '것'
]

const normalizeRequiredKeyword = (word: string) => {
  return (word || '')
    .replace(/[!?,.()[\]{}<>"'“”‘’]/g, ' ')
    .replace(/\s+(에서|으로|로|은|는|이|가|을|를|의|와|과)\s+/g, ' ')
    .replace(/(\S+)(에서|으로|로|은|는|이|가|을|를|의|와|과)\s+/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

const isRequiredBadKeyword = (word: string) => {
  const parts = word.split(/\s+/).filter(Boolean)
  if (parts.length < 1 || parts.length > 3) return true
  if (parts.some((part) => REQUIRED_BAD_KEYWORD_TERMS.has(part))) return true
  if (REQUIRED_BAD_KEYWORD_TERMS.has(word)) return true
  if (REQUIRED_TRAILING_VERBS.test(word) || REQUIRED_EXPLANATION_WORDS.test(word)) return true
  return REQUIRED_JOSA_ENDINGS.some((josa) => word.endsWith(josa))
}

const isActivityKeyword = (word: string) => {
  if (SCIENCE_CONCEPT_ALLOWLIST.has(word)) return false
  if (BAD_KEYWORD_TERMS.has(word)) return true
  if (/(하기|보기|만들기|그리기|꾸미기|알아보기|확인하기|생각하기|비교하기|관찰하기|실험하기|탐구하기|정리하기|설명하기)$/.test(word)) return true
  return /기$/.test(word) && !SCIENCE_CONCEPT_ALLOWLIST.has(word)
}

const isVerbStemKeyword = (word: string) => {
  return ['내리', '만들', '그리', '꾸미', '하', '보', '알아보', '확인하', '생각하', '비교하', '관찰하', '실험하', '탐구하', '정리하', '설명하'].includes(word)
}

const isBadKeyword = (word: string, subjectName = '') => {
  const cleaned = word.trim()
  if (!cleaned) return true
  if (BAD_KEYWORD_TERMS.has(cleaned)) return true
  if (isActivityKeyword(cleaned)) return true
  if (isVerbStemKeyword(cleaned)) return true
  if (subjectName === '과학' && SCIENCE_LOW_VALUE_TERMS.has(cleaned) && !SCIENCE_CONCEPT_ALLOWLIST.has(cleaned)) return true
  return false
}

const validateGeneratedKeywords = (
  candidates: KeywordItem[],
  majorUnitName: string,
  middleUnitName: string,
  subjectName = ''
): KeywordItem[] => {
  const punctuationRegex = /[!?,.()\[\]{}<>]/
  const chapterWords = new Set([
    (majorUnitName || '').replace(/\s/g, ''),
    (middleUnitName || '').replace(/\s/g, '')
  ])
  const validated: KeywordItem[] = []
  const seen = new Set<string>()

  for (const item of candidates) {
    if (!item || !item.word) continue
    const original = item.word.trim()
    const w = normalizeRequiredKeyword(original)
    let reason = ''
    if (!w) reason = 'empty'
    else if (punctuationRegex.test(w)) reason = 'punctuation'
    else if (isRequiredBadKeyword(w)) reason = 'required-filter'
    else if (BANNED_KEYWORD_TERMS.has(w) || isBadKeyword(w, subjectName)) reason = 'banned-or-activity'
    else if (chapterWords.has(w.replace(/\s/g, ''))) reason = 'whole-unit-title'
    if (reason) continue
    if (!seen.has(w)) {
      seen.add(w)
      validated.push({ ...item, word: w })
    }
  }
  return validated.slice(0, 10)
}

const normalizeKeywordWord = (word: string) => {
  let normalized = (word || '')
    .replace(/[!?,.()[\]{}<>"'“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  let changed = true
  while (changed && normalized.length > 1) {
    changed = false
    for (const ending of FINAL_JOSA_ENDINGS) {
      if (normalized.length > ending.length + 1 && normalized.endsWith(ending)) {
        normalized = normalized.slice(0, -ending.length).trim()
        changed = true
        break
      }
    }
  }
  return normalized.replace(/\s+/g, ' ').trim()
}

const finalizeKeywords = (keywords: string[]): string[] => {
  const result: string[] = []
  const seen = new Set<string>()
  for (const raw of keywords) {
    const normalized = normalizeKeywordWord(raw)
    if (!normalized) continue
    const parts = normalized.split(/\s+/).filter(Boolean)
    if (parts.length < 1 || parts.length > 3) continue
    if (BANNED_FINAL_KEYWORDS.some((banned) => normalized.includes(banned))) continue
    if (REQUIRED_TRAILING_VERBS.test(normalized) || REQUIRED_EXPLANATION_WORDS.test(normalized)) continue
    if (parts.some((part) => REQUIRED_BAD_KEYWORD_TERMS.has(part))) continue
    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

const getScienceUnitFallbackWords = (majorUnitName: string, middleUnitName: string, context?: CurriculumContext) => {
  const source = [majorUnitName, middleUnitName, context?.unitGoal, context?.learningGoal, context?.unitSummary, context?.subunitSummary, context?.contentScope, context?.keyQuestions].filter(Boolean).join(' ')
  if (source.includes('태양계') || source.includes('태양') || source.includes('별')) {
    return ['태양', '지구', '빛', '열', '별', '태양계', '낮', '밤', '그림자', '온도', '에너지', '생명', '식물', '계절']
  }
  if (source.includes('온도') || source.includes('열') || source.includes('기체') || source.includes('대류')) {
    return ['열', '온도', '기체', '공기', '대류', '이동', '실험', '변화', '흐름', '입자']
  }
  if (source.includes('용해') || source.includes('용액') || source.includes('녹')) {
    return ['용해', '용액', '용질', '용매', '물', '가루', '녹기', '진하기', '섞임', '눈']
  }
  if (source.includes('동물') || source.includes('서식지')) {
    return ['동물', '서식지', '먹이', '생김새', '보호색', '사막', '북극', '날개', '다리', '몸']
  }
  if (source.includes('식물')) {
    return ['식물', '뿌리', '줄기', '잎', '꽃', '열매', '물', '햇빛', '바람', '양분']
  }
  return []
}

const extractUnitKeywordCandidates = (
  majorUnitName: string,
  middleUnitName: string,
  context?: CurriculumContext,
  subjectName = ''
) => {
  const scored = new Map<string, number>()
  const addWord = (word: string, score: number) => {
    const cleaned = word.trim()
    if (cleaned.length < 2 || cleaned.length > 5) return
    if (SCIENCE_GENERIC_KEYWORDS.has(cleaned)) return
    if (isBadKeyword(cleaned, subjectName)) return
    scored.set(cleaned, (scored.get(cleaned) || 0) + score)
  }
  const addFromText = (text: string | undefined, score: number) => {
    if (!text) return
    const candidates = text.match(/[가-힣]{2,6}/g) || []
    candidates.forEach((word) => addWord(word, score))
  }
  getScienceUnitFallbackWords(majorUnitName, middleUnitName, context).forEach((word) => addWord(word, 8))
  addFromText(middleUnitName, 5)
  addFromText(majorUnitName, 4)
  addFromText(context?.learningGoal, 4)
  addFromText(context?.subunitSummary, 3)
  addFromText(context?.unitGoal, 3)
  addFromText(context?.unitSummary, 2)
  addFromText(context?.contentScope, 2)
  addFromText(context?.achievementStandards, 2)
  addFromText(context?.keyQuestions, 2)
  return [...scored.entries()].sort((a, b) => b[1] - a[1]).map(([word]) => word).slice(0, 10)
}

type FallbackRequest = {
  subjectName?: string
  majorUnitName?: string
  middleUnitName?: string
  count?: number
  existingKeywords?: string[]
  curriculumContext?: CurriculumContext
}

const getFallbackKeywords = (req: FallbackRequest): KeywordItem[] => {
  const subjectName = req.subjectName || ''
  const middleUnitName = req.middleUnitName || ''
  const majorUnitName = req.majorUnitName || ''
  const context = req.curriculumContext
  const existingKeywords = req.existingKeywords || []
  const specificMap: Record<string, string[]> = {
    '산지': ['산맥', '백두대간', '태백산맥', '지리산', '설악산', '국토', '고원'],
    '하천': ['강줄기', '상류', '하류', '나루터', '국토', '강변'],
    '강': ['강줄기', '상류', '하류', '나루터', '국토', '강변'],
    '평야': ['농사', '들판', '국토'],
    '해안': ['바다', '갯벌', '해수욕장', '항구', '어촌', '국토'],
    '섬': ['제주도', '울릉도', '독도', '화산섬', '항구', '어촌', '바다'],
    '도시': ['빌딩', '아파트', '공장', '교통', '버스', '지하철', '시장'],
    '촌락': ['농촌', '어촌', '산지촌', '논밭', '마을', '국토', '고장'],
    '지형': ['평야', '해안', '국토', '고장', '지형도'],
    '국토': ['우리나라', '국토', '고장', '지도', '바다']
  }

  let fallbackWords: string[] = []
  const combinedName = `${majorUnitName} ${middleUnitName}`
  const scienceFallbackWords = (subjectName === '과학' || subjectName === '怨쇳븰') ? getScienceUnitFallbackWords(majorUnitName, middleUnitName, context) : []
  const unitCandidates = extractUnitKeywordCandidates(majorUnitName, middleUnitName, context, subjectName)
  fallbackWords = [...fallbackWords, ...scienceFallbackWords, ...unitCandidates]
  if (combinedName) {
    for (const [key, words] of Object.entries(specificMap)) {
      if (combinedName.includes(key)) fallbackWords = [...fallbackWords, ...words]
    }
  }
  if (fallbackWords.length === 0) {
    const defaultWords: Record<string, string[]> = {
      '국어': ['인물', '마음', '대화', '표현', '상상', '사건', '감정', '글', '단어'],
      '영어': ['학교', '여행', '음식', '동물', '대화', '파티', '단어', '문장', '인사'],
      '수학': ['규칙', '숫자', '도형', '분수', '계산', '퍼즐', '크기', '모양', '길이'],
      '사회': ['지형', '국토', '기후', '산업', '교통', '도시', '농촌', '바다', '고장', '지도'],
      '과학': ['생물', '동물', '식물', '날씨', '공기', '물', '흙', '소리', '빛', '자석']
    }
    fallbackWords = defaultWords[subjectName] || defaultWords['국어']
  }
  fallbackWords = [...new Set(fallbackWords)]
  if (subjectName === '과학') fallbackWords = fallbackWords.filter((word) => !SCIENCE_GENERIC_KEYWORDS.has(word))
  fallbackWords = fallbackWords.filter((word) => !isBadKeyword(word, subjectName))
  if (existingKeywords.length > 0) fallbackWords = fallbackWords.filter((w) => !existingKeywords.includes(w))
  return fallbackWords.map((word) => ({ word, reason: '학습 주제와 관련된 추천 키워드입니다.' }))
}

const getSafeKeywordPool = (req: FallbackRequest) => {
  const subjectName = req.subjectName || ''
  const pool = [
    ...getScienceUnitFallbackWords(req.majorUnitName || '', req.middleUnitName || '', req.curriculumContext),
    ...(req.middleUnitName?.match(/[가-힣]{1,6}/g) || []),
    ...(req.majorUnitName?.match(/[가-힣]{1,6}/g) || [])
  ]
  if (subjectName === '과학' || subjectName === '怨쇳븰') pool.push(...SCIENCE_DEFAULT_SAFE_KEYWORDS)
  return pool
}

// AI 결과 + fallback 보충으로 targetCount 개수를 채운다.
const supplementKeywordsToCount = (candidates: KeywordItem[], req: FallbackRequest): KeywordItem[] => {
  const targetCount = Math.min(Math.max(req.count || 2, MIN_COUNT), MAX_COUNT)
  const result: KeywordItem[] = []
  const seen = new Set(finalizeKeywords(req.existingKeywords || []))
  const addItems = (items: KeywordItem[]) => {
    const validated = validateGeneratedKeywords(items, req.majorUnitName || '', req.middleUnitName || '', req.subjectName || '')
    for (const item of validated) {
      if (!item?.word) continue
      const finalized = finalizeKeywords([item.word])
      if (finalized.length === 0) continue
      const word = finalized[0]
      if (seen.has(word)) continue
      result.push({ ...item, word })
      seen.add(word)
      if (result.length >= targetCount) break
    }
  }
  addItems(candidates)
  let guard = 0
  while (result.length < targetCount && guard < 10) {
    const fallback = getFallbackKeywords({ ...req, existingKeywords: [...seen] })
    const before = result.length
    addItems(fallback)
    guard++
    if (result.length === before) break
  }
  if (result.length < targetCount) {
    addItems(getSafeKeywordPool(req).map((word) => ({ word, reason: '단원 내용에 맞춰 보충한 안전 키워드입니다.' })))
  }
  return result.slice(0, targetCount)
}

// ---------------------------------------------------------------------------
// 프롬프트 (studentTopicService.ts generateKeywords 프롬프트와 동일).
// ---------------------------------------------------------------------------
const KEYWORD_GENERATION_RULES = `[중요 조건]
1. 키워드는 반드시 초등학생이 만화 이야기 소재로 바로 사용할 수 있는 '명사' 또는 '교과 핵심 개념어'여야 합니다.
2. 한 키워드는 공백 없는 짧은 단어여야 합니다.
3. 문장형 표현은 절대 금지합니다.
4. 형용사, 부사, 동사형 표현은 금지합니다.
5. '하기', '알기', '되기', '해보자', '놀자', '탐구야', '즐겁게' 같은 활동형 표현은 금지합니다.
6. 조사나 어미가 붙은 단어는 제외하고 원형만 추출하세요.
7. 특수문자, 느낌표, 물음표, 쉼표, 마침표가 포함되지 않게 하세요.
8. 단원명이나 중단원명을 단순히 띄어쓰기만 해서 만든 단어는 제외합니다.
9. '생각', '이야기', '활동', '재미', '공부', '학습' 등 너무 넓고 애매한 단어는 제외하세요.
10. 학생이 만화 장면으로 바로 떠올릴 수 있는 구체적인 사물, 인물, 장소, 사건 중심의 명사를 우선하세요.
11. 가장 우선순위가 높은 것은 '중단원(학습 주제)'의 핵심 개념입니다.
12. 서로 비슷하지 않은 단어들로 최대 10개까지 추천해 주세요.
13. 결과는 JSON 형태로만 반환합니다. 마크다운 코드블록은 쓰지 않습니다.
14. 과학 과목에서는 '관찰', '실험', '탐구', '결과', '비교', '변화' 같은 공통 활동어만 반복하지 마세요.
15. 대단원명, 중단원명, 학습목표, 단원 설명에 들어 있는 구체 명사(예: 동물, 사막, 북극, 서식지, 보호색, 먹이, 생김새, 날개, 뿌리, 줄기)를 우선하세요. 단, 단원과 맞을 때만 사용하세요.`

function buildKeywordPrompt(ctx: {
  gradeName: string
  subjectName: string
  majorUnitName: string
  middleUnitName: string
  count: number
  existingKeywords: string[]
  curriculumContext?: CurriculumContext
}): string {
  const { gradeName, subjectName, majorUnitName, middleUnitName, count, existingKeywords, curriculumContext } = ctx
  const existingKeywordsText = existingKeywords.length > 0
    ? `\n\n이미 생성된 다음 키워드들은 제외하고 완전히 새로운 단어로 만들어주세요:\n[${existingKeywords.join(', ')}]`
    : ''
  const contextText = curriculumContext ? `
[교과 정보]
대단원 목표: ${curriculumContext.unitGoal || ''}
중단원 학습목표: ${curriculumContext.learningGoal || ''}
성취기준: ${curriculumContext.achievementStandards || ''}
대단원 설명: ${curriculumContext.unitSummary || ''}
중단원 설명: ${curriculumContext.subunitSummary || ''}
내용 체계: ${curriculumContext.contentScope || ''}
핵심 질문: ${curriculumContext.keyQuestions || ''}
` : ''
  return `
너는 초등학생을 위한 학습만화 선생님입니다.
아래 단원 정보와 교과 정보를 바탕으로 학습만화 이야기에 쓸 만한 핵심 키워드 ${count}개를 추천해 주세요.

학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원(학습 주제): ${middleUnitName}${contextText}${existingKeywordsText}
${KEYWORD_GENERATION_RULES}

반환 형식:
{
  "keywords": [
    {
      "word": "산맥",
      "reason": "우리나라 산지 지형의 특징을 보여주는 구체적인 장소입니다."
    }
  ]
}
`
}

// Gemini 응답 텍스트 → 키워드 배열 파싱(JSON 모드이지만 방어적 추출 유지).
function parseKeywordText(text: string): KeywordItem[] {
  let parsed: any = null
  try {
    parsed = JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try { parsed = JSON.parse(m[0]) } catch { /* fallthrough */ }
    }
  }
  if (!parsed || !Array.isArray(parsed.keywords)) return []
  return parsed.keywords
    .filter((k: any) => k && typeof k === 'object' && k.word)
    .map((k: any) => ({ word: String(k.word), reason: k.reason ? String(k.reason) : '' }))
}

// ---------------------------------------------------------------------------
// 메인 핸들러
// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('허용되지 않은 요청 방식입니다.', 'INVALID_INPUT')

  const t0 = Date.now()
  const admin = createAdminClient()

  try {
    const caller = await resolveCaller(admin, req.headers.get('Authorization'))
    const requestId = `${caller.id.slice(0, 8)}-${t0.toString(36)}`
    log('authed', { requestId })

    const body = await req.json().catch(() => ({}))
    const gradeName = typeof body?.gradeName === 'string' ? body.gradeName.slice(0, 30) : ''
    const subjectName = typeof body?.subjectName === 'string' ? body.subjectName.slice(0, 30) : ''
    const majorUnitName = typeof body?.majorUnitName === 'string' ? body.majorUnitName.slice(0, 60) : ''
    const middleUnitName = typeof body?.middleUnitName === 'string' ? body.middleUnitName.slice(0, 60) : ''
    const count = Math.min(Math.max(Number(body?.count) || 2, MIN_COUNT), MAX_COUNT)
    const existingKeywords = Array.isArray(body?.existingKeywords)
      ? body.existingKeywords.filter((k: unknown): k is string => typeof k === 'string').map((k: string) => k.slice(0, 30)).slice(0, 30)
      : []
    const ctxRaw = body?.curriculumContext
    const curriculumContext: CurriculumContext | undefined =
      ctxRaw && typeof ctxRaw === 'object'
        ? {
            unitGoal: typeof ctxRaw.unitGoal === 'string' ? ctxRaw.unitGoal.slice(0, 600) : undefined,
            learningGoal: typeof ctxRaw.learningGoal === 'string' ? ctxRaw.learningGoal.slice(0, 600) : undefined,
            achievementStandards: typeof ctxRaw.achievementStandards === 'string' ? ctxRaw.achievementStandards.slice(0, 1200) : undefined,
            unitSummary: typeof ctxRaw.unitSummary === 'string' ? ctxRaw.unitSummary.slice(0, 1200) : undefined,
            subunitSummary: typeof ctxRaw.subunitSummary === 'string' ? ctxRaw.subunitSummary.slice(0, 1200) : undefined,
            contentScope: typeof ctxRaw.contentScope === 'string' ? ctxRaw.contentScope.slice(0, 1200) : undefined,
            keyQuestions: typeof ctxRaw.keyQuestions === 'string' ? ctxRaw.keyQuestions.slice(0, 1200) : undefined,
          }
        : undefined

    if (!middleUnitName && !majorUnitName) {
      return fail(userMessage('INVALID_INPUT'), 'INVALID_INPUT', { requestId, durationMs: Date.now() - t0 })
    }

    const fbReq: FallbackRequest = { subjectName, majorUnitName, middleUnitName, count, existingKeywords, curriculumContext }
    const prompt = buildKeywordPrompt({ gradeName, subjectName, majorUnitName, middleUnitName, count, existingKeywords, curriculumContext })

    let aiKeywords: KeywordItem[] = []
    let source: 'ai' | 'fallback' = 'fallback'
    let aiElapsed = 0
    try {
      const aiT0 = Date.now()
      const text = await generateKeywordsJson(prompt)
      aiElapsed = Date.now() - aiT0
      aiKeywords = parseKeywordText(text)
      log('aiDone', { aiMs: aiElapsed, raw: aiKeywords.length })
    } catch (e) {
      const code = (e as { code?: string })?.code || 'PROVIDER_ERROR'
      log('aiError', { code, aiMs: Date.now() - t0 })
    }

    // AI 결과를 검증·보충. AI 키워드가 1개라도 있으면 source='ai'(fallback 보충 혼용 허용).
    const result = supplementKeywordsToCount(aiKeywords, fbReq)
    if (aiKeywords.length > 0 && result.length > 0) source = 'ai'

    const durationMs = Date.now() - t0
    log('done', { source, count: result.length, durationMs, requestId })

    return ok({
      keywords: result,
      source,
      model: source === 'ai' ? KEYWORD_MODEL : null,
      durationMs,
      requestId,
      ...(source === 'fallback' ? { warning: 'AI 응답 지연으로 기본 키워드를 제공했어요.' } : {}),
    })
  } catch (err) {
    const errObj = err as { code?: string }
    const code = errObj?.code || 'INTERNAL_ERROR'
    if (code === 'UNAUTHORIZED') return fail(userMessage('UNAUTHORIZED'), 'UNAUTHORIZED', { durationMs: Date.now() - t0 })
    log('unhandled', { code, msg: String((err as Error)?.message || '').slice(0, 80) })
    return fail(userMessage('INTERNAL_ERROR'), code, { durationMs: Date.now() - t0 })
  }
})
