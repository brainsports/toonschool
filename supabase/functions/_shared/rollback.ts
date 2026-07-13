// 보상 트랜잭션(rollback) 헬퍼.
// Auth와 DB는 단일 트랜잭션으로 묶을 수 없으므로, DB 저장 단계가 실패하면
// 직전에 만든 Auth 사용자/프로필/역할 테이블 행을 되돌려 "고아 계정"이 남지 않게 한다.
// rollback 자체가 실패해도 흐름을 멈추지 않고 로그만 남긴다(본 오류 응답이 우선).
export async function safeRollback(tag: string, label: string, action: () => Promise<unknown>) {
  try {
    await action()
  } catch (e) {
    console.error(`[${tag}] rollback failed: ${label}`, e)
  }
}
