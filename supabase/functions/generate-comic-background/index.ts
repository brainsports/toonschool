// 만화 배경 이미지 생성 Edge Function (한 호출 = 한 컷).
// 로컬 comicQueueWorker 없이 Vercel(프런트) + Supabase(EF) 만으로 이미지가 생성되도록 한다.
//
// 책임: JWT 인증 → 입력 검증 → 캐시 조회(HIT 시 즉시 반환) → 중복/진행중 선점 →
//       Gemini 이미지 생성 → comic_assets 업로드(result_url) → 캐시 저장 → generation_jobs completed.
//
// 보안: GEMINI_API_KEY/SUPABASE_SERVICE_ROLE_KEY는 Deno.env(Secret)에서만 사용. 프런트 비노출.
// 로그: requestId/jobId/cut/단계별 소요만. API키·토큰·프롬프트 전문·개인정보는 절대 출력하지 않는다.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'
import { createAdminClient, resolveCaller } from '../_shared/client.ts'
import {
  createComicBackgroundCacheKey,
  createCacheStoragePath,
  base64ToBytes,
  normalizeBackgroundPrompt,
  type ComicBackgroundCacheInput,
} from '../_shared/comicCache.ts'

const TAG = 'generate-comic-background'
const CACHE_BUCKET = 'toonschool-generated-backgrounds'
const IMAGE_MODEL = Deno.env.get('GEMINI_IMAGE_MODEL') || 'gemini-3.1-flash-image'
const STALE_PROCESSING_MS = 3 * 60 * 1000 // 이 시간 이상 processing이면 좀비로 간주하고 재선점
const RECENT_JOB_WINDOW_MS = 60 * 60 * 1000 // 최근 완료 job 재사용 윈도우

function log(stage: string, fields: Record<string, unknown> = {}) {
  // 안전: 혹시라도 키/토큰/프롬프트가 들어오면 제거
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(fields)) {
    if (/key|token|prompt|secret|authorization/i.test(k)) continue
    safe[k] = v
  }
  console.log([`[${TAG}]`, stage, ...Object.entries(safe).map(([k, v]) => `${k}=${v}`)].join(' | '))
}

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify({ success: true, ...body }), { headers: jsonHeaders, status: 200 })
// 비즈니스 결과(성공/실패 모두)는 HTTP 200 + 본문 {success, code, message} 로 반환.
// supabase-js functions.invoke 는 비-2xx 응답 본문을 data 로 파싱하지 않으므로, 클라이언트가
// data.success/code 를 단일 경로로 처리하도록 항상 200 을 사용한다(의미는 code 로 전달).
const fail = (message: string, code: string, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ success: false, code, message, error: message, ...extra }), { headers: jsonHeaders, status: 200 })

// Gemini 이미지 생성. 재시도 가능 오류(429/5xx/fetch) 1회 재시도. 429는 RATE_LIMITED로 프런트 백오프 유도.
async function generateImage(prompt: string, cutNumber: number, jobId: string) {
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
    log('imageApiRetry', { cut: cutNumber, http: res.status, jobId })
    await new Promise((r) => setTimeout(r, 2000))
    res = await doCall().catch((e) => { throw Object.assign(new Error('fetch_fail'), { code: 'PROVIDER_ERROR', cause: String(e).slice(0, 80) }) })
  }
  const elapsedMs = Date.now() - start
  if (!res.ok) {
    const http = res.status
    log('imageApiFailed', { cut: cutNumber, http, elapsedMs, jobId })
    const code = http === 429 ? 'RATE_LIMITED' : http >= 500 ? 'PROVIDER_5XX' : http === 401 || http === 403 ? 'GEMINI_AUTH' : 'PROVIDER_ERROR'
    throw Object.assign(new Error(`http_${http}`), { code, httpStatus: http })
  }
  const data = await res.json().catch(() => ({}))
  const inline = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData
  const base64 = inline?.data
  const mime = inline?.mimeType || 'image/jpeg'
  if (!base64) {
    log('imageApiEmpty', { cut: cutNumber, elapsedMs, jobId })
    throw Object.assign(new Error('no_image'), { code: 'NO_IMAGE' })
  }
  log('imageApiSuccess', { cut: cutNumber, elapsedMs, jobId })
  return { base64, mime, elapsedMs }
}

const userMessage = (code: string): string => {
  switch (code) {
    case 'RATE_LIMITED': return '잠시 요청이 많아요. 잠시 후 다시 시도해 주세요.'
    case 'UNAUTHORIZED': return '로그인이 만료되었어요. 다시 로그인해 주세요.'
    case 'INVALID_INPUT': return '배경 생성 정보가 부족해요. 만화를 다시 만들어 주세요.'
    case 'NO_IMAGE':
    case 'PROVIDER_5XX':
    case 'PROVIDER_ERROR':
    case 'GEMINI_AUTH': return '이 컷의 배경을 만들지 못했어요. 해당 컷만 다시 만들어 주세요.'
    case 'STORAGE_ERROR':
    case 'DB_ERROR': return '이미지 저장 중 문제가 발생했어요.'
    default: return '배경 생성 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
  }
}
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return fail('허용되지 않은 요청 방식입니다.', 'INVALID_INPUT')

  const t0 = Date.now()
  let jobId: string | null = null
  let cutNumber = 0
  let projectId = ''
  const admin = createAdminClient()

  try {
    // 1) 인증 (학생 세션 JWT)
    const caller = await resolveCaller(admin, req.headers.get('Authorization'))
    const userId = caller.id

    // 2) 입력 파싱/검증
    const body = await req.json().catch(() => ({}))
    projectId = typeof body.projectId === 'string' ? body.projectId : ''
    cutNumber = Number(body.cutNumber) || 0
    const prompt = typeof body.prompt === 'string' ? body.prompt : ''
    const requestId = typeof body.requestId === 'string' ? body.requestId : ''
    const c = body.cache || {}
    const cacheInput: ComicBackgroundCacheInput = {
      grade: c.grade, subject: c.subject, semester: c.semester,
      unitId: c.unitId, subunitId: c.subunitId, topicTitle: c.topicTitle,
      cutNo: cutNumber, backgroundPrompt: typeof c.backgroundPrompt === 'string' ? c.backgroundPrompt : prompt,
      styleKey: c.styleKey,
    }
    if (!projectId) throw Object.assign(new Error('no project'), { code: 'INVALID_INPUT' })
    if (cutNumber < 1 || cutNumber > 6) throw Object.assign(new Error('bad cut'), { code: 'INVALID_INPUT' })
    if (prompt.length < 10) throw Object.assign(new Error('no prompt'), { code: 'INVALID_INPUT' })

    // 3) 캐시 키
    const cacheKey = await createComicBackgroundCacheKey(cacheInput)

    // 4) 캐시 조회 → HIT 시 즉시 반환 (Gemini 미호출)
    const { data: cached } = await admin
      .from('comic_background_cache').select('id,public_url,reused_count')
      .eq('cache_key', cacheKey).maybeSingle()
    if (cached?.public_url) {
      await admin.from('comic_background_cache').update({
        reused_count: (cached.reused_count || 0) + 1, last_used_at: new Date().toISOString(),
      }).eq('id', cached.id).catch(() => {})
      log('cacheHit', { cut: cutNumber, jobId: cacheKey.slice(0, 11) })
      return ok({ cutNumber, resultUrl: cached.public_url, cacheHit: true, elapsedMs: Date.now() - t0, cacheKey })
    }
    log('cacheMiss', { cut: cutNumber })

    // 5) 진행중 중복 가드: 같은 project+cut의 최근 processing 작업이 최근에 시작됐으면 중복 생성 방지.
    //    (콘텐츠 기반 재사용은 위 단계 4 캐시 키가 담당. project+cut 기반 '완료 job 재사용'은
    //     같은 컷을 다른 프롬프트로 재생성할 때 이전 이미지를 잘못 돌려주므로 사용하지 않는다.)
    const { data: recent } = await admin.from('generation_jobs')
      .select('id,status,started_at').eq('project_id', projectId).eq('cut_number', cutNumber)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS).toISOString()
    if (recent?.status === 'processing' && recent.started_at && recent.started_at > staleBefore) {
      // 동일 컷의 진행중 호출이 있음 → 프런트가 잠시 후 재시도(IN_PROGRESS)
      log('inProgress', { cut: cutNumber, jobId: String(recent.id).slice(0, 8) })
      return fail('이 컷은 이미 만들고 있어요. 잠시만 기다려 주세요.', 'IN_PROGRESS', { jobId: recent.id })
    }

    // 6) job 선점(processing)
    const { data: inserted, error: ie } = await admin.from('generation_jobs').insert({
      project_id: projectId, cut_number: cutNumber,
      prompt_data: { cutNumber, styleKey: cacheInput.styleKey, promptLength: prompt.length },
      status: 'processing', started_at: new Date().toISOString(),
      user_id: userId, cache_key: cacheKey, request_id: requestId, style_key: cacheInput.styleKey,
    }).select().single()
    if (ie || !inserted) {
      log('jobInsertFailed', { cut: cutNumber, err: ie?.message?.slice(0, 60) })
      throw Object.assign(new Error('job insert'), { code: 'DB_ERROR' })
    }
    jobId = inserted.id
    log('jobClaimed', { cut: cutNumber, jobId: String(jobId).slice(0, 8) })

    // 7) Gemini 이미지 생성
    const { base64, mime, elapsedMs: geminiMs } = await generateImage(prompt, cutNumber, String(jobId))

    // 8) 캐시 버킷 업로드 → 정규 URL
    //    라이브 프런트 경로(doGenerateSingleComicCut)와 동일하게 캐시 버킷(toonschool-generated-backgrounds)
    //    의 public URL 을 정규 저장 URL 로 사용. comic_assets 는 라이브 경로가 임시/삭제 취급하므로 EF 에서는 생략.
    const bytes = base64ToBytes(base64)
    const cachePath = createCacheStoragePath(cacheInput, cacheKey, mime.includes('png') ? 'png' : 'jpg')
    const { error: upErr } = await admin.storage.from(CACHE_BUCKET)
      .upload(cachePath, bytes, { contentType: mime, upsert: true })
    if (upErr) {
      log('storageUploadFailed', { cut: cutNumber, err: upErr.message?.slice(0, 60), jobId: String(jobId).slice(0, 8) })
      throw Object.assign(new Error('storage'), { code: 'STORAGE_ERROR' })
    }
    const resultUrl = admin.storage.from(CACHE_BUCKET).getPublicUrl(cachePath).data.publicUrl

    // 9) 캐시 DB 행 upsert (public_url = resultUrl) — 같은 조건 재사용(HIT) 보장
    await admin.from('comic_background_cache').upsert({
      cache_key: cacheKey, grade: cacheInput.grade, subject: cacheInput.subject, semester: cacheInput.semester,
      unit_id: cacheInput.unitId, subunit_id: cacheInput.subunitId, topic_title: cacheInput.topicTitle,
      cut_no: cutNumber, style_key: cacheInput.styleKey || 'toonschool-v2',
      normalized_prompt: normalizeBackgroundPrompt(cacheInput.backgroundPrompt), background_prompt: cacheInput.backgroundPrompt,
      storage_bucket: CACHE_BUCKET, storage_path: cachePath, public_url: resultUrl,
      mime_type: mime, last_used_at: new Date().toISOString(),
    }, { onConflict: 'cache_key' }).catch((e) => log('cacheDbFailed', { cut: cutNumber, err: String(e).slice(0, 60) }))

    // 10) job completed (result_url = 캐시 버킷 정규 URL)
    const elapsedMs = Date.now() - t0
    await admin.from('generation_jobs').update({
      status: 'completed', result_url: resultUrl, completed_at: new Date().toISOString(), elapsed_ms: elapsedMs,
    }).eq('id', jobId)

    log('done', { cut: cutNumber, elapsedMs, geminiMs, cacheHit: false, jobId: String(jobId).slice(0, 8) })
    return ok({ cutNumber, resultUrl, cacheHit: false, elapsedMs, geminiMs, jobId })
  } catch (err: any) {
    const code = err?.code || 'INTERNAL_ERROR'
    const elapsedMs = Date.now() - t0
    log('error', { cut: cutNumber, code, elapsedMs, jobId: jobId ? String(jobId).slice(0, 8) : '-', err: String(err.message || err).replace(/key=[^&\s]+/g, 'key=***').slice(0, 80) })
    // job failed 기록(선점된 경우만)
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
