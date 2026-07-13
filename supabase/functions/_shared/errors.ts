// 표준화된 오류/응답 처리.
// - RequestError: HTTP 상태 코드 + 기계용 code + 사람용 message를 함께 들고 다닌다.
// - 응답 헬퍼: 모든 계정 생성 EF가 동일한 JSON 형태(섹션 7 표준 응답)를 반환하도록 강제.
//
// 중요: 내부 DB 오류 문구, Service Role 정보, SQL, 스택 정보는 사용자 응답에 노출하지 않고
// Edge Function 로그(console.error)에만 남긴다. 사용자에게는 code + 친절한 한국어 message만 전달.
import { jsonHeaders } from './cors.ts'

export type ErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'DUPLICATE_LOGIN_ID'
  | 'DUPLICATE_EMAIL'
  | 'ACCOUNT_CREATION_FAILED'
  | 'INTERNAL_ERROR'
  | 'SERVER_CONFIG'

export class RequestError extends Error {
  status: number
  code: ErrorCode
  constructor(message: string, status = 400, code: ErrorCode = 'INVALID_INPUT') {
    super(message)
    this.name = 'RequestError'
    this.status = status
    this.code = code
  }
}

// 성공 응답: { success, userId, role, message }
export function successResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify({ success: true, ...body }), {
    headers: jsonHeaders,
    status,
  })
}

// 오류 응답: { success:false, code, message } + 동일한 message를 error 필드에도(레거시 FE 호환)
export function errorResponse(message: string, status: number, code: ErrorCode): Response {
  return new Response(
    JSON.stringify({ success: false, code, message, error: message }),
    { headers: jsonHeaders, status }
  )
}

// try/catch의 catch 공통 처리. RequestError면 해당 상태/코드, 그 외는 500 서버 오류.
// 원본 error는 로그로만 남기고, 사용자에게는 일반화된 메시지를 반환한다.
export function handleCaughtError(tag: string, error: unknown, fallback: string): Response {
  if (error instanceof RequestError) {
    console.error(`[${tag}] ${error.code} (${error.status}): ${error.message}`)
    return errorResponse(error.message, error.status, error.code)
  }
  // 예상치 못한 서버 오류. 상세는 로그에만.
  console.error(`[${tag}] unexpected error:`, error)
  return errorResponse(fallback, 500, 'ACCOUNT_CREATION_FAILED')
}
