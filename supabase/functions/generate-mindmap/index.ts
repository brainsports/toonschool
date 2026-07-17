// 마인드맵 AI 생성 Edge Function.
// React 프런트엔드 → (이 함수) → AI API. 별도 백엔드/워커/Vercel Route 없음.
//
// 책임: JWT 인증 → 입력 검증 → Gemini 텍스트(JSON) 생성 → 응답 검증 → 반환.
//  - 전체 생성(full): 학년·과목·단원·중심주제 로 큰 가지 4~6 + 작은 가지 2~4 + 설명.
//  - 부분 생성(partial): 선택 노드에 대한 추천 자식/요약/상세/예시/생활연결/질문.
//
// 보안: GEMINI_API_KEY·SUPABASE_SERVICE_ROLE_KEY 는 Deno.env(Secret)에서만 사용. 프런트 비노출.
// 로그: 단계·소요시간만. 키·토큰·프롬프트 전문·개인정보는 절대 출력하지 않는다.
// 응답: 항상 HTTP 200 + 본문 {success, code, message, data}. supabase-js.invoke 가 본문을
//       단일 경로로 파싱하도록 한다(의미는 code 로 전달).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'
import { createAdminClient, resolveCaller } from '../_shared/client.ts'

const TAG = 'generate-mindmap'
const TEXT_MODEL = Deno.env.get('GEMINI_TEXT_MODEL') || 'gemini-2.5-flash'
const MIN_BRANCHES = 4
const MAX_BRANCHES = 6
const MIN_LEAVES = 2
const MAX_LEAVES = 4
const DESC_MAX = 200
const TOPICS_MIN = 3
const TOPICS_MAX = 5

function log(stage: string, fields: Record<string, unknown> = {}) {
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (/key|token|prompt|secret|authorization/i.test(k)) continue
    safe[k] = v
  }
  console.log([`[${TAG}]`, stage, ...Object.entries(safe).map(([k, v]) => `${k}=${v}`)].join(' | '))
}

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify({ success: true, ...body }), { headers: jsonHeaders, status: 200 })
const fail = (message: string, code: string, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ success: false, code, message, ...extra }), { headers: jsonHeaders, status: 200 })

const userMessage = (code: string): string => {
  switch (code) {
    case 'UNAUTHORIZED': return '로그인이 만료되었어요. 다시 로그인해 주세요.'
    case 'INVALID_INPUT': return '마인드맵을 만들 정보가 부족해요. 학년·과목·단원을 다시 확인해 주세요.'
    case 'RATE_LIMITED': return '잠시 요청이 많아요. 잠시 후 다시 시도해 주세요.'
    case 'TIMEOUT': return 'AI 가 생각하는 시간이 조금 걸렸어요. 다시 시도해 주세요.'
    case 'BAD_MODEL_OUTPUT': return 'AI 가 올바른 형태로 답하지 못했어요. 다시 시도해 주세요.'
    case 'PROVIDER_5XX':
    case 'PROVIDER_ERROR':
    case 'GEMINI_AUTH': return 'AI 가 응답하지 못했어요. 잠시 후 다시 시도해 주세요.'
    default: return '마인드맵을 만드는 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
  }
}

// Gemini 텍스트(JSON) 호출. responseMimeType=application_json 으로 강제 후 프런트에서 재검증.
async function generateJson(prompt: string, timeoutMs = 45000): Promise<unknown> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) {
    log('configError', { note: 'GEMINI_API_KEY missing' })
    throw Object.assign(new Error('config'), { code: 'SERVER_CONFIG' })
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const doCall = async (signal: AbortSignal) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${geminiKey}`
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
        },
      }),
    })
  }
  let res: Response
  try {
    res = await doCall(controller.signal)
  } catch (e) {
    clearTimeout(timer)
    const aborted = (e as Error)?.name === 'AbortError'
    throw Object.assign(new Error(aborted ? 'timeout' : 'fetch_fail'), {
      code: aborted ? 'TIMEOUT' : 'PROVIDER_ERROR',
      cause: String(e).slice(0, 80),
    })
  }
  clearTimeout(timer)
  // 재시도 가능 오류 1회.
  if (!res.ok && [429, 500, 502, 503, 504].includes(res.status)) {
    log('retry', { http: res.status })
    await new Promise((r) => setTimeout(r, 1500))
    try {
      res = await doCall(controller.signal)
    } catch (e) {
      throw Object.assign(new Error('fetch_fail'), { code: 'PROVIDER_ERROR', cause: String(e).slice(0, 80) })
    }
  }
  if (!res.ok) {
    const http = res.status
    const code = http === 429 ? 'RATE_LIMITED'
      : http >= 500 ? 'PROVIDER_5XX'
      : http === 401 || http === 403 ? 'GEMINI_AUTH'
      : 'PROVIDER_ERROR'
    throw Object.assign(new Error(`http_${http}`), { code, httpStatus: http })
  }
  const data = await res.json().catch(() => ({}))
  const parts = data?.candidates?.[0]?.content?.parts as Array<{ text?: string }> | undefined
  const text = parts?.map((p) => p?.text ?? '').join('') ?? ''
  if (!text) {
    throw Object.assign(new Error('empty'), { code: 'BAD_MODEL_OUTPUT' })
  }
  try {
    return JSON.parse(text)
  } catch {
    // 모델이 JSON 앞뒤로 텍스트를 붙인 경우 방어적 추출.
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try { return JSON.parse(m[0]) } catch { /* fallthrough */ }
    }
    throw Object.assign(new Error('parse'), { code: 'BAD_MODEL_OUTPUT' })
  }
}

// ---------------------------------------------------------------------------
// 입력 정제/검증
// ---------------------------------------------------------------------------
const MAX_STR = 200
function cleanStr(v: unknown, max = MAX_STR): string {
  if (typeof v !== 'string') return ''
  // HTML/스크립트 태그 제거 + 과도한 공백 정리.
  let s = v.replace(/<[^>]*>/g, '').replace(/```/g, '').trim()
  if (s.length > max) s = s.slice(0, max)
  return s
}

function isBadText(s: string): boolean {
  // 스크립트/이벤트 핸들러 사전 차단.
  return /<script|javascript:|on\w+\s*=/i.test(s)
}

type ValidatedLeaf = { title: string; description?: string; icon?: string }
type ValidatedBranch = ValidatedLeaf & { children: ValidatedLeaf[] }
type ValidatedPartial = { children: ValidatedLeaf[]; suggestedTitle?: string; suggestedDescription?: string }

function validateBranches(raw: unknown): { branches: ValidatedBranch[]; centralTopic: string } | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const centralTopic = cleanStr(obj.centralTopic, 40)
  const branchesRaw = Array.isArray(obj.branches) ? obj.branches : null
  if (!branchesRaw) return null
  const branches: ValidatedBranch[] = []
  for (const b of branchesRaw.slice(0, MAX_BRANCHES)) {
    if (!b || typeof b !== 'object') continue
    const bo = b as Record<string, unknown>
    const title = cleanStr(bo.title, 30)
    if (!title || isBadText(title)) continue
    const childrenRaw = Array.isArray(bo.children) ? bo.children : []
    const children: ValidatedLeaf[] = []
    for (const c of childrenRaw.slice(0, MAX_LEAVES)) {
      if (!c || typeof c !== 'object') continue
      const co = c as Record<string, unknown>
      const ctitle = cleanStr(co.title, 30)
      if (!ctitle || isBadText(ctitle)) continue
      const cdesc = cleanStr(co.description, DESC_MAX)
      if (cdesc && isBadText(cdesc)) continue
      children.push({ title: ctitle, description: cdesc, icon: cleanStr(co.icon, 20) || undefined })
    }
    if (children.length === 0) continue // 2차 가지가 없는 1차 가지는 버린다
    branches.push({
      title,
      description: cleanStr(bo.description, MAX_STR) || undefined,
      icon: cleanStr(bo.icon, 20) || undefined,
      children,
    })
  }
  if (branches.length === 0) return null
  return { branches, centralTopic }
}

function validatePartial(raw: unknown): ValidatedPartial | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const childrenRaw = Array.isArray(obj.children) ? obj.children : []
  const children: ValidatedLeaf[] = []
  for (const c of childrenRaw.slice(0, MAX_LEAVES)) {
    if (!c || typeof c !== 'object') continue
    const co = c as Record<string, unknown>
    const ctitle = cleanStr(co.title, 30)
    if (!ctitle || isBadText(ctitle)) continue
    const cdesc = cleanStr(co.description, MAX_STR)
    if (cdesc && isBadText(cdesc)) continue
    children.push({ title: ctitle, description: cdesc, icon: cleanStr(co.icon, 20) || undefined })
  }
  const out: ValidatedPartial = { children }
  if (typeof obj.suggestedTitle === 'string') {
    const t = cleanStr(obj.suggestedTitle, 30)
    if (t && !isBadText(t)) out.suggestedTitle = t
  }
  if (typeof obj.suggestedDescription === 'string') {
    const d = cleanStr(obj.suggestedDescription, MAX_STR)
    if (d && !isBadText(d)) out.suggestedDescription = d
  }
  if (children.length === 0 && !out.suggestedDescription) return null
  return out
}

function validateTopics(raw: unknown): string[] | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const arr = Array.isArray(obj.topics) ? obj.topics : null
  if (!arr) return null
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of arr) {
    const s = cleanStr(t, 40)
    if (!s || isBadText(s)) continue
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
    if (out.length >= TOPICS_MAX) break
  }
  return out.length >= TOPICS_MIN ? out : null
}

// ---------------------------------------------------------------------------
// 프롬프트
// ---------------------------------------------------------------------------
function fullPrompt(ctx: {
  grade?: number; subject?: string; semester?: number; unitTitle?: string; centralTopic: string;
}): string {
  const gradeTxt = ctx.grade ? `초등학교 ${ctx.grade}학년` : '초등학교'
  const subjTxt = ctx.subject ? `${ctx.subject} 과목` : ''
  const unitTxt = ctx.unitTitle ? `"${ctx.unitTitle}" 단원` : ''
  return `당신은 초등학교 ${gradeTxt} 학생을 돕는 친절하고 꼼꼼한 선생님이다. ${[subjTxt, unitTxt].filter(Boolean).join(' ')}에서 배우는 내용으로 마인드맵을 만들어 준다.

중심 주제: "${ctx.centralTopic}"

[구조 규칙 — 반드시 지킨다]
- 큰 가지(branch)는 정확히 ${MIN_BRANCHES}~${MAX_BRANCHES}개. 중심 주제를 이해하는 데 꼭 필요한 서로 다른 핵심 영역으로 나눈다(비슷한 의지 반복 금지).
- 각 큰 가지 아래 작은 가지(children)를 ${MIN_LEAVES}~${MAX_LEAVES}개 만든다.
- 큰 가지 title: 4~15자, 짧고 명확.
- 작은 가지 title: 4~20자, 짧은 구.
- 작은 가지 description: 한글 기준 50~200자의 자세하고 쉬운 온전한 문장. 정의·원리·특징·과정·생활 예시 중 어울리는 것을 구체적으로 설명. 어려운 교과 용어가 나오면 곧바로 쉬운 말로 풀어쓴다. 절대 빈 값/“내용 없음”/임시 문구/같은 문장 반복 금지. "${ctx.centralTopic}" 단원에 맞는 사실만.

[말투] 초등학생이 혼자 읽어도 이해되는 친절한 말투. 틀리거나 불확실한 사실은 만들지 않는다.
[icon] 다음 키 중 하나만: idea,sun,water,air,soil,seed,sprout,leaf,flower,fruit,tree,root,star,heart,book,pencil,question,search,lightbulb,home,friends,clock,weather,music,art,number,letter,map,globe,animal,bird,fish,rocket,cloud,rain,fire,snow,magnet,gear,thermometer. 알맞지 않으면 생략.

반드시 다음 JSON 형태로만 응답한다(JSON 외 설명·코드블록 금지):
{"centralTopic":"${ctx.centralTopic}","branches":[{"title":"큰가지제목","icon":"아이콘키","description":"한 줄 요약","children":[{"title":"작은가지제목","icon":"아이콘키","description":"50~200자의 자세하고 쉬운 설명"}]}]}`
}

function topicsPrompt(ctx: {
  grade?: number; subject?: string; semester?: number; unitTitle?: string; subunitTitle?: string;
}): string {
  const gradeTxt = ctx.grade ? `초등학교 ${ctx.grade}학년` : '초등학교'
  const subjTxt = ctx.subject ? `${ctx.subject} 과목` : ''
  const unitTxt = ctx.unitTitle ? `"${ctx.unitTitle}" 단원` : ''
  const subTxt = ctx.subunitTitle ? `(작은 단원: "${ctx.subunitTitle}")` : ''
  return `당신은 초등학교 ${gradeTxt} 학생을 돕는 선생님이다. ${[subjTxt, unitTxt, subTxt].filter(Boolean).join(' ')}에서 마인드맵의 중심 주제로 쓰기 좋은 질문/주제를 ${TOPICS_MIN}~${TOPICS_MAX}개 추천해 준다.

규칙:
- 반드시 이 단원과 직접 관련된 구체적인 주제만. 단원과 관련 없는 추상적·일반적 주제 금지.
- 초등학생이 이해하기 쉬운 한글 문장(물음표로 끝나는 질문형도 좋음). 각 10~30자.
- 비슷한 주제 반복 금지.

반드시 다음 JSON 형태로만 응답한다(JSON 외 금지):
{"topics":["주제1","주제2","주제3"]}`
}

type PartialReq = { action: string; nodeTitle: string; nodeDescription: string }
type PartialCtx = { centralTopic?: string; branchTitle?: string; grade?: number; subject?: string; unitTitle?: string }
function partialPrompt(req: PartialReq, ctx: PartialCtx): string {
  const gradeTxt = ctx.grade ? `초등학교 ${ctx.grade}학년` : '초등학교'
  const actionTxt: Record<string, string> = {
    add_children: '선택한 노드 아래에 들어갈 작은 가지(자식) 2~3개를 추천한다. children 배열을 채운다.',
    simplify: '선택한 노드의 설명을 초등학생이 이해하기 쉽게 더 짧고 명확하게 바꾼 suggestedDescription을 제안한다.',
    detail: '선택한 노드의 설명을 조금 더 자세하지만 여전히 쉽게 풀어쓴 suggestedDescription을 제안한다.',
    example: '선택한 노드와 관련된 실제 예시를 suggestedDescription으로 제안한다.',
    daily: '선택한 노드를 우리 생활과 연결한 suggestedDescription을 제안한다.',
    question: '선택한 노드와 관련해 더 생각해 볼 탐구 질문 1~2개를 children(title=질문)으로 제안한다.',
  }
  const act = actionTxt[req.action as string] ?? actionTxt.add_children
  return `당신은 ${gradeTxt} 학생을 돕는 친절한 선생님이다.
중심 주제: "${ctx.centralTopic ?? ''}", 큰 가지: "${ctx.branchTitle ?? ''}"
선택한 노드 제목: "${req.nodeTitle ?? ''}"
선택한 노드 설명: "${req.nodeDescription ?? ''}"
요청: ${act}

조건: 쉬운 온전한 문장, 틀린 사실 금지, 친절한 말투. icon 키는 idea,lightbulb,star,search,heart,home,book,question,leaf,sprout,fruit,sun,water 중에서만.
반드시 다음 JSON 형태로만 응답한다(JSON 이외 금지):
{"children":[{"title":"","description":"","icon":""}],"suggestedTitle":"","suggestedDescription":""}`
}

// ---------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('허용되지 않은 요청 방식입니다.', 'INVALID_INPUT')

  const t0 = Date.now()
  const admin = createAdminClient()

  try {
    const caller = await resolveCaller(admin, req.headers.get('Authorization'))
    log('authed', { uid: caller.id.slice(0, 8) })

    const body = await req.json().catch(() => ({}))
    const mode = body?.mode === 'partial' ? 'partial' : body?.mode === 'topics' ? 'topics' : 'full'

    if (mode === 'topics') {
      const ctx = {
        grade: Number(body?.grade) || undefined,
        subject: cleanStr(body?.subject, 20) || undefined,
        semester: Number(body?.semester) || undefined,
        unitTitle: cleanStr(body?.unitTitle, 40) || undefined,
        subunitTitle: cleanStr(body?.subunitTitle, 40) || undefined,
      }
      if (!ctx.unitTitle && !ctx.subject) return fail('학년·과목·단원을 먼저 선택해 주세요.', 'INVALID_INPUT')
      log('topicsStart', {})
      let raw: unknown
      try {
        raw = await generateJson(topicsPrompt(ctx))
      } catch (e) {
        const code = (e as { code?: string })?.code || 'PROVIDER_ERROR'
        log('topicsAiError', { code, elapsedMs: Date.now() - t0 })
        return fail(userMessage(code), code)
      }
      const topics = validateTopics(raw)
      if (!topics) {
        log('topicsBadOutput', { elapsedMs: Date.now() - t0 })
        return fail(userMessage('BAD_MODEL_OUTPUT'), 'BAD_MODEL_OUTPUT')
      }
      log('topicsDone', { count: topics.length, elapsedMs: Date.now() - t0 })
      return ok({ data: { topics } })
    }

    if (mode === 'full') {
      const centralTopic = cleanStr(body?.centralTopic, 40)
      if (!centralTopic) return fail('중심 주제를 입력해 주세요.', 'INVALID_INPUT')
      const ctx = {
        grade: Number(body?.grade) || undefined,
        subject: cleanStr(body?.subject, 20) || undefined,
        semester: Number(body?.semester) || undefined,
        unitTitle: cleanStr(body?.unitTitle, 40) || undefined,
        centralTopic,
      }
      log('fullStart', { mode })
      let raw: unknown
      try {
        raw = await generateJson(fullPrompt(ctx))
      } catch (e) {
        const code = (e as { code?: string })?.code || 'PROVIDER_ERROR'
        log('fullAiError', { code, elapsedMs: Date.now() - t0 })
        return fail(userMessage(code), code)
      }
      const validated = validateBranches(raw)
      if (!validated) {
        log('fullBadOutput', { elapsedMs: Date.now() - t0 })
        return fail(userMessage('BAD_MODEL_OUTPUT'), 'BAD_MODEL_OUTPUT')
      }
      log('fullDone', { branches: validated.branches.length, elapsedMs: Date.now() - t0 })
      return ok({ data: { centralTopic: validated.centralTopic || centralTopic, branches: validated.branches } })
    }

    // partial
    const req2 = {
      action: cleanStr(body?.action, 20) || 'add_children',
      nodeTitle: cleanStr(body?.nodeTitle, 30),
      nodeDescription: cleanStr(body?.nodeDescription, MAX_STR),
    }
    if (!req2.nodeTitle) return fail('선택한 노드의 제목이 없어요.', 'INVALID_INPUT')
    const ctx = {
      centralTopic: cleanStr(body?.centralTopic, 40) || undefined,
      branchTitle: cleanStr(body?.branchTitle, 30) || undefined,
      grade: Number(body?.grade) || undefined,
      subject: cleanStr(body?.subject, 20) || undefined,
      unitTitle: cleanStr(body?.unitTitle, 40) || undefined,
    }
    log('partialStart', { action: req2.action })
    let raw: unknown
    try {
      raw = await generateJson(partialPrompt(req2, ctx))
    } catch (e) {
      const code = (e as { code?: string })?.code || 'PROVIDER_ERROR'
      log('partialAiError', { code, elapsedMs: Date.now() - t0 })
      return fail(userMessage(code), code)
    }
    const validated = validatePartial(raw)
    if (!validated) {
      log('partialBadOutput', { elapsedMs: Date.now() - t0 })
      return fail(userMessage('BAD_MODEL_OUTPUT'), 'BAD_MODEL_OUTPUT')
    }
    log('partialDone', { kids: validated.children?.length ?? 0, elapsedMs: Date.now() - t0 })
    return ok({ data: validated })
  } catch (err) {
    const errObj = err as { code?: string; message?: string }
    const code = errObj?.code || 'INTERNAL_ERROR'
    if (code === 'UNAUTHORIZED') return fail(userMessage(code), code)
    log('unhandled', { code, msg: String(errObj?.message || '').slice(0, 80) })
    return fail(userMessage(code), code)
  }
})
