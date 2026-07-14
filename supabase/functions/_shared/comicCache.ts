// 만화 배경 캐시 키/경로 생성 (Deno, Edge Function 전용).
// 프런트(src/modules/student/services/comicBackgroundCacheService.ts)의 로직과
// 동일 알고리즘을 사용 — 기존 캐시 행과 동일한 키가 생성되어야 기존 HIT 데이터를 재사용할 수 있다.
// 두 곳을 수정할 때는 반드시 같이 맞출 것.

export interface ComicBackgroundCacheInput {
  grade?: string
  subject?: string
  semester?: string
  unitId?: string
  subunitId?: string
  topicTitle?: string
  cutNo: number
  backgroundPrompt: string // 캐시 키용(visual prompt). 전체 이미지 프롬프트가 아님.
  styleKey?: string
}

// 프런트 normalizeBackgroundPrompt 와 동일.
export const normalizeBackgroundPrompt = (prompt: string): string => {
  let normalized = (prompt || '').trim()
  normalized = normalized.replace(/\s+/g, ' ')
  normalized = normalized.toLowerCase()
  normalized = normalized.replace(/[\r\n]+/g, ' ')
  normalized = normalized.replace(/[,."']/g, '')
  return normalized
}

// 프런트 createComicBackgroundCacheKey 와 동일.
export const createComicBackgroundCacheKey = async (
  params: ComicBackgroundCacheInput
): Promise<string> => {
  const normalizedPrompt = normalizeBackgroundPrompt(params.backgroundPrompt)
  const parts = [
    'background',
    params.grade || 'unknown',
    params.subject || 'unknown',
    params.semester || 'unknown',
    params.unitId || 'unknown',
    params.subunitId || 'unknown',
    params.cutNo.toString(),
    params.styleKey || 'toonschool-v2',
    normalizedPrompt,
  ]
  const rawKey = parts.join('|')
  const data = new TextEncoder().encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  return `bg_${hashHex}`
}

// --- Storage 경로 (캐시 버킷 toonschool-generated-backgrounds 용). 프런트 createStoragePath 와 동일 ---
const mapSubject = (subject?: string): string => {
  if (!subject) return 'unknown'
  const mapping: Record<string, string> = {
    국어: 'korean', 수학: 'math', 사회: 'social', 과학: 'science', 영어: 'english',
  }
  return mapping[subject] || 'unknown'
}
const normalizeGrade = (grade?: string): string => {
  if (!grade) return 'grade-unknown'
  const match = grade.match(/\d+/)
  return match ? `grade-${match[0]}` : 'grade-unknown'
}
const toSafeSlug = (str: string): string => str.replace(/[^a-zA-Z0-9-_]/g, '')

export const createCacheStoragePath = (
  params: ComicBackgroundCacheInput,
  cacheKey: string,
  extension = 'jpg'
): string => {
  const gradeStr = normalizeGrade(params.grade)
  const subjectStr = mapSubject(params.subject)
  const semesterStr = !params.semester || params.semester === 'unknown' ? 'semester-none' : `semester-${params.semester}`
  const unitStr = !params.unitId || params.unitId === 'unknown' ? 'unit-none' : `unit-${params.unitId}`
  const cutStr = `cut-${params.cutNo}`
  const pathParts = [gradeStr, subjectStr, semesterStr, unitStr]
  if (params.subunitId && params.subunitId !== 'unknown') pathParts.push(`subunit-${params.subunitId}`)
  pathParts.push(cutStr)
  const safe = pathParts.map(toSafeSlug)
  return `${safe.join('/')}/${toSafeSlug(cacheKey)}.${toSafeSlug(extension)}`
}

// base64 -> Uint8Array (Deno). data:image/jpeg;base64, 접두사 제거 후 디코딩.
export const base64ToBytes = (dataUrlOrBase64: string): Uint8Array => {
  const base64 = dataUrlOrBase64.replace(/^data:image\/\w+;base64,/, '')
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}
