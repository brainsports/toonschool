// 창작 과목 표지/뒤표지 이미지 생성 Edge Function.
// 한 함수에서 coverKind('front' | 'back') 로 표지·뒤표지를 모두 처리한다.
//
// 기존 generate-comic-background 의 인증/비동기/Storage/generation_jobs 패턴을 재사용.
//  - 이미지 모델: 기존 만화 배경 생성이 동작 중인 GEMINI_IMAGE_MODEL(기본 gemini-3.1-flash-image)을 그대로 사용 → 사전 검증된 모델.
//  - Storage: 기존 버킷 toonschool-generated-backgrounds 재사용, 경로 covers/{userId}/{projectId}/{coverKind}/ 로 분리.
//  - 캐시 테이블: 1차 생략. 같은 프로젝트로 돌아오면 프런트가 저장된 결과를 재사용하고, "다시 생성" 시에만 새 이미지를 만든다.
//  - 한도: 월별 만화 한도 RPC(reserve/confirm)는 건드리지 않는다. 이미지 비용 보호용 작품당 제한만 적용 — 일반 3회/데모 2회(coverKind별).
//    기존 데모 일일 6컷 한도(DEMO_IMAGE_DAILY_LIMIT)와는 합산하지 않는다.
//
// 보안: GEMINI_API_KEY/SUPABASE_SERVICE_ROLE_KEY는 Deno.env(Secret)에서만 사용. 프런트 비노출.
// 로그: requestId/jobId/coverKind/단계별 소요만. API키·토큰·프롬프트 전문·개인정보는 절대 출력하지 않는다.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'
import { createAdminClient, resolveCaller } from '../_shared/client.ts'
import { base64ToBytes } from '../_shared/comicCache.ts'

const TAG = 'generate-cover-image'
const CACHE_BUCKET = 'toonschool-generated-backgrounds' // 기존 버킷 재사용
const IMAGE_MODEL = Deno.env.get('GEMINI_IMAGE_MODEL') || 'gemini-3.1-flash-image'
const STALE_PROCESSING_MS = 3 * 60 * 1000
// 작품당 coverKind별 이미지 생성 제한(비용 보호). 일반 3회, 데모 2회.
const COVER_LIMIT_NORMAL = 3
const COVER_LIMIT_DEMO = 2
// generation_jobs 재사용 시 cover 구분용 cut_number 매핑(만화 컷은 1~6 그대로 사용).
const COVER_CUT_NO: Record<'front' | 'back', number> = { front: 0, back: 7 }

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
  new Response(JSON.stringify({ success: false, code, message, error: message, ...extra }), { headers: jsonHeaders, status: 200 })

// Gemini 이미지 생성. 429/5xx/fetch 오류 1회 재시도. 기존 만화 EF와 동일 호출 방식(검증됨).
async function generateImage(prompt: string, coverKind: 'front' | 'back', jobId: string) {
  const geminiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiKey) {
    log('configError', { note: 'GEMINI_API_KEY missing' })
    throw Object.assign(new Error('config'), { code: 'SERVER_CONFIG' })
  }
  const start = Date.now()
  const doCall = async () => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${geminiKey}`
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    })
  }
  let res = await doCall().catch((e) => { throw Object.assign(new Error('fetch_fail'), { code: 'PROVIDER_ERROR', cause: String(e).slice(0, 80) }) })
  if (!res.ok && [429, 500, 502, 503, 504].includes(res.status)) {
    log('imageApiRetry', { coverKind, http: res.status, jobId })
    await new Promise((r) => setTimeout(r, 2000))
    res = await doCall().catch((e) => { throw Object.assign(new Error('fetch_fail'), { code: 'PROVIDER_ERROR', cause: String(e).slice(0, 80) }) })
  }
  const elapsedMs = Date.now() - start
  if (!res.ok) {
    const http = res.status
    log('imageApiFailed', { coverKind, http, elapsedMs, jobId })
    const code = http === 429 ? 'RATE_LIMITED' : http >= 500 ? 'PROVIDER_5XX' : http === 401 || http === 403 ? 'GEMINI_AUTH' : 'PROVIDER_ERROR'
    throw Object.assign(new Error(`http_${http}`), { code, httpStatus: http })
  }
  const data = await res.json().catch(() => ({}))
  const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData
  const base64 = inline?.data
  const mime = inline?.mimeType || 'image/jpeg'
  if (!base64) {
    log('imageApiEmpty', { coverKind, elapsedMs, jobId })
    throw Object.assign(new Error('no_image'), { code: 'NO_IMAGE' })
  }
  log('imageApiSuccess', { coverKind, elapsedMs, jobId })
  return { base64, mime, elapsedMs }
}

const userMessage = (code: string): string => {
  switch (code) {
    case 'RATE_LIMITED': return '잠시 요청이 많아요. 잠시 후 다시 시도해 주세요.'
    case 'UNAUTHORIZED': return '로그인이 만료되었어요. 다시 로그인해 주세요.'
    case 'INVALID_INPUT': return '표지 만들기 정보가 부족해요. 작품 정보를 다시 확인해 주세요.'
    case 'FORBIDDEN':
    case 'INVALID_PROJECT': return '이 작품에 접근할 수 없어요.'
    case 'COVER_LIMIT': return '이 작품에서 표지를 여러 번 만들었어요. 마음에 드는 표지를 골라보거나, 다른 작품에서 만들어 보세요.'
    case 'NO_IMAGE':
    case 'PROVIDER_5XX':
    case 'PROVIDER_ERROR':
    case 'GEMINI_AUTH': return '표지 그림을 만들지 못했어요. 다시 만들어 주세요.'
    case 'STORAGE_ERROR':
    case 'DB_ERROR': return '이미지 저장 중 문제가 발생했어요.'
    default: return '표지 생성 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
  }
}

type CoverKind = 'front' | 'back'

type CoverTask = {
  admin: ReturnType<typeof createAdminClient>
  jobId: string
  coverKind: CoverKind
  userId: string
  projectId: string
  prompt: string
  startedAt: number
}

const completeGeneration = async ({ admin, jobId, coverKind, userId, projectId, prompt, startedAt }: CoverTask) => {
  try {
    const { base64, mime, elapsedMs: geminiMs } = await generateImage(prompt, coverKind, jobId)
    const bytes = base64ToBytes(base64)
    const ext = mime.includes('png') ? 'png' : 'jpg'
    // 기존 버킷 안에 covers/{userId}/{projectId}/{coverKind}/ 경로로 분리.
    const storagePath = `covers/${userId}/${projectId}/${coverKind}/${jobId}.${ext}`
    const { error: uploadError } = await admin.storage.from(CACHE_BUCKET).upload(storagePath, bytes, { contentType: mime, upsert: false })
    if (uploadError) throw Object.assign(new Error('storage'), { code: 'STORAGE_ERROR' })
    const resultUrl = admin.storage.from(CACHE_BUCKET).getPublicUrl(storagePath).data.publicUrl
    const elapsedMs = Date.now() - startedAt
    const { error: completeError } = await admin.from('generation_jobs').update({
      status: 'completed', result_url: resultUrl, completed_at: new Date().toISOString(), elapsed_ms: elapsedMs,
    }).eq('id', jobId)
    if (completeError) throw Object.assign(new Error('job complete'), { code: 'DB_ERROR' })
    log('done', { coverKind, elapsedMs, geminiMs, jobId: jobId.slice(0, 8) })
  } catch (err: any) {
    const code = err?.code || 'INTERNAL_ERROR'
    const elapsedMs = Date.now() - startedAt
    log('coverError', { coverKind, code, elapsedMs, jobId: jobId.slice(0, 8) })
    await admin.from('generation_jobs').update({
      status: 'failed', error_message: code, completed_at: new Date().toISOString(), elapsed_ms: elapsedMs,
    }).eq('id', jobId).catch(() => {})
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('허용되지 않은 요청 방식입니다.', 'INVALID_INPUT')

  const t0 = Date.now()
  let jobId: string | null = null
  let coverKind: CoverKind = 'front'
  let projectId = ''
  const admin = createAdminClient()

  try {
    // 1) 인증
    const caller = await resolveCaller(admin, req.headers.get('Authorization'))
    const userId = caller.id

    // 2) 입력 검증
    const body = await req.json().catch(() => ({}))
    projectId = typeof body.projectId === 'string' ? body.projectId : ''
    const k = body.coverKind
    coverKind = k === 'front' || k === 'back' ? k : ''
    const presetCode = typeof body.presetCode === 'string' ? body.presetCode : ''
    const prompt = typeof body.prompt === 'string' ? body.prompt : ''
    const requestId = typeof body.requestId === 'string' ? body.requestId : ''
    if (!projectId) throw Object.assign(new Error('no project'), { code: 'INVALID_INPUT' })
    if (coverKind !== 'front' && coverKind !== 'back') throw Object.assign(new Error('bad coverKind'), { code: 'INVALID_INPUT' })
    if (prompt.length < 10) throw Object.assign(new Error('no prompt'), { code: 'INVALID_INPUT' })

    const coverCutNo = COVER_CUT_NO[coverKind]

    // 3) 소유권 1차 검증: 같은 projectId의 기존 작업이 다른 사용자 소유면 거부.
    //    프런트가 보낸 projectId를 그대로 신뢰하지 않고, 서버가 확인한 userId와 비교한다.
    //    (완전 소유권 — 학생 본인/담당 교사-작품 소유자 매핑 — 은 project/소유자 테이블 조회가 필요해
    //     운영 스키마 확인 후 추가 적용을 권장. Storage 경로의 사용자 식별자는 이 userId를 사용.)
    const { data: ownerRow } = await admin.from('generation_jobs')
      .select('user_id').eq('project_id', projectId).limit(1).maybeSingle()
    if (ownerRow?.user_id && ownerRow.user_id !== userId) {
      log('forbidden', { coverKind, reason: 'owner_mismatch' })
      return fail(userMessage('FORBIDDEN'), 'FORBIDDEN')
    }

    // 4) 진행중 중복 가드: 같은 project+coverKind 의 최근 processing 작업이 있으면 중복 생성 방지.
    //    (동시 요청 1차 방어 — 두 번째 요청을 IN_PROGRESS 로 막아 비용 중복 호출을 줄인다.)
    const { data: recent } = await admin.from('generation_jobs')
      .select('id,status,started_at,request_id').eq('project_id', projectId).eq('cut_number', coverCutNo)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS).toISOString()
    if (recent?.status === 'processing' && recent.started_at && recent.started_at > staleBefore) {
      // 동일 requestId 면 같은 요청으로 보고 기존 job 반환(멱등). 아니면 진행중 안내.
      if (requestId && recent.request_id && recent.request_id === requestId) {
        log('idempotentReuse', { coverKind, jobId: String(recent.id).slice(0, 8) })
        return ok({ coverKind, jobId: String(recent.id), cacheHit: false, processing: true, elapsedMs: Date.now() - t0 })
      }
      log('inProgress', { coverKind, jobId: String(recent.id).slice(0, 8) })
      return fail('이 표지는 이미 만들고 있어요. 잠시만 기다려 주세요.', 'IN_PROGRESS', { jobId: recent.id })
    }

    // 5) 작품당 coverKind별 생성 제한(비용 보호).
    //    processing + completed 를 모두 세어 동시 요청/진행중 작업까지 포함(원자성 보완).
    //    월별 만화 한도 RPC는 건드리지 않는다.
    //    (완전 원자성 — 동시 insert 레이스 — 은 RPC/트랜잭션이 필요하므로 별도 보고.)
    const { data: profile } = await admin.from('profiles').select('is_demo').eq('id', userId).maybeSingle()
    const isDemo = profile?.is_demo === true
    const limit = isDemo ? COVER_LIMIT_DEMO : COVER_LIMIT_NORMAL
    const { count } = await admin.from('generation_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId).eq('cut_number', coverCutNo).in('status', ['processing', 'completed'])
    const used = count || 0
    if (used >= limit) {
      log('coverLimit', { coverKind, used, limit, isDemo })
      return fail(userMessage('COVER_LIMIT'), 'COVER_LIMIT', { used, limit })
    }

    // 6) job 선점(processing). cut_number 에 cover 매핑값(0/7)을 넣어 만화 컷(1~6)과 구분.
    const { data: inserted, error: ie } = await admin.from('generation_jobs').insert({
      project_id: projectId, cut_number: coverCutNo,
      prompt_data: { coverKind, presetCode, promptLength: prompt.length },
      status: 'processing', started_at: new Date().toISOString(),
      user_id: userId, request_id: requestId, style_key: presetCode || undefined,
    }).select().single()
    if (ie || !inserted) {
      log('jobInsertFailed', { coverKind, err: ie?.message?.slice(0, 60) })
      throw Object.assign(new Error('job insert'), { code: 'DB_ERROR' })
    }
    jobId = String(inserted.id)
    log('jobClaimed', { coverKind, jobId: jobId.slice(0, 8), used, limit })

    EdgeRuntime.waitUntil(completeGeneration({ admin, jobId, coverKind, userId, projectId, prompt, startedAt: t0 }))
    return ok({ coverKind, jobId, cacheHit: false, processing: true, elapsedMs: Date.now() - t0 })
  } catch (err: any) {
    const code = err?.code || 'INTERNAL_ERROR'
    const elapsedMs = Date.now() - t0
    log('error', { coverKind, code, elapsedMs, jobId: jobId ? jobId.slice(0, 8) : '-', err: String(err.message || err).replace(/key=[^&\s]+/g, 'key=***').slice(0, 80) })
    if (jobId) {
      await admin.from('generation_jobs').update({
        status: 'failed', error_message: code, completed_at: new Date().toISOString(), elapsed_ms: elapsedMs,
      }).eq('id', jobId).catch(() => {})
    }
    if (code === 'SERVER_CONFIG') return fail('서버 설정 오류입니다.', 'SERVER_CONFIG')
    if (code === 'UNAUTHORIZED') return fail(userMessage(code), 'UNAUTHORIZED')
    return fail(userMessage(code), code)
  }
})
