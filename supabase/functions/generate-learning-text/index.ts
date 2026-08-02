// 초등학생 학습 텍스트 및 프롬프트 생성용 범용 Edge Function.
// React 프런트엔드 (gemini.ts) → (이 함수) → Gemini REST API.
//
// 책임: JWT 인증/CORS → 입력 및 모델 검증 → Gemini 텍스트 생성 → 응답 반환.
// 보안: GEMINI_API_KEY는 Deno.env(Secret)에서만 사용. 프런트엔드 절대 비노출.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, jsonHeaders } from '../_shared/cors.ts'

const TAG = 'generate-learning-text'

// 허용할 Gemini 모델 화이트리스트
const ALLOWED_MODELS: Record<string, string> = {
  'gemini-3-flash-preview': 'gemini-3-flash-preview',
  'gemini-3.5-flash': 'gemini-3.5-flash',
  'gemini-2.5-flash': 'gemini-2.5-flash',
  'gemini-1.5-flash': 'gemini-1.5-flash',
}

const DEFAULT_MODEL = Deno.env.get('GEMINI_TEXT_MODEL') || 'gemini-3-flash-preview'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const t0 = Date.now()
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      return fail('잘못된 요청 형식입니다.', 'INVALID_INPUT')
    }

    const { prompt, model: requestedModel } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return fail('프롬프트 내용이 필요합니다.', 'INVALID_INPUT')
    }

    // 프롬프트 최대 길이 제한 (15,000자)
    if (prompt.length > 15000) {
      return fail('프롬프트 길이가 허용 한도를 초과했습니다.', 'PROMPT_TOO_LONG')
    }

    // 모델 검증 및 결정
    let targetModel = DEFAULT_MODEL
    if (requestedModel && typeof requestedModel === 'string' && ALLOWED_MODELS[requestedModel]) {
      targetModel = ALLOWED_MODELS[requestedModel]
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      log('configError', { note: 'GEMINI_API_KEY missing in Edge Function Secret' })
      return fail('AI 서비스 설정이 올바르지 않습니다.', 'SERVER_CONFIG')
    }

    const controller = new AbortController()
    const timeoutMs = 30000 // 30초 타임아웃
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${geminiKey}`

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      })
    } catch (fetchErr: any) {
      clearTimeout(timer)
      if (fetchErr.name === 'AbortError') {
        log('timeout', { model: targetModel, elapsedMs: Date.now() - t0 })
        return fail('AI 응답 시간이 초과되었습니다.', 'TIMEOUT')
      }
      log('fetchError', { err: String(fetchErr?.message || fetchErr) })
      return fail('AI 서비스 연결 실패', 'NETWORK_ERROR')
    }
    clearTimeout(timer)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      log('geminiError', { status: response.status, err: errText.slice(0, 100) })

      if (response.status === 429) {
        return fail('Gemini 요청이 많아 일시적으로 제한되었습니다.', 'RATE_LIMITED', { httpStatus: 429 })
      }
      if (response.status === 401 || response.status === 403) {
        return fail('AI API 인증 오류가 발생했습니다.', 'GEMINI_AUTH', { httpStatus: response.status })
      }
      return fail(`Gemini API 오류 (${response.status})`, 'GEMINI_ERROR', { httpStatus: response.status })
    }

    const json = await response.json()
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text || typeof text !== 'string') {
      log('emptyResponse', { model: targetModel })
      return fail('응답을 생성하지 못했습니다.', 'GEMINI_EMPTY')
    }

    log('success', { model: targetModel, elapsedMs: Date.now() - t0, textLen: text.length })
    return ok({ text, model: targetModel, elapsedMs: Date.now() - t0 })
  } catch (err: any) {
    log('unhandledError', { err: String(err?.message || err) })
    return fail('서버 처리 중 오류가 발생했습니다.', 'INTERNAL_ERROR')
  }
})
