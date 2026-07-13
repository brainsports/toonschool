// 계정 생성 Edge Function들이 공통으로 사용하는 CORS 헤더.
// 브라우저에서 supabase.functions.invoke 로 호출할 때 필요.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
} as const

export const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
} as const
