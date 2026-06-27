// ─────────────────────────────────────────────────────────────────────────
// 텍스트 생성 모델 (2026-06-27 실증 테스트 결과)
//
// smoke test 결과:
//   gemini-3.5-flash   → 성공 (약 20초, 현재 부하 있음)
//   gemini-3.1-flash-lite → 503 실패 → fallback 후보에서 제거
//   gemini-2.x 계열    → 404 (이 API 키에서 미지원)
//
// 결론: primary = gemini-3.5-flash, fallback = 없음 (불안정한 모델 fallback 금지)
// Gemini 텍스트 실패 시 → 로컬 fallback 프롬프트로 이미지 생성 진행
// ─────────────────────────────────────────────────────────────────────────
export const TEXT_GENERATION_MODEL = 'gemini-3.5-flash';
export const TEXT_FALLBACK_MODEL = ''; // 실제 사용 가능한 fallback 없음 → 빈 문자열

// ─────────────────────────────────────────────────────────────────────────
// 이미지 생성 모델 (Worker에서 사용, models/list 확인)
// - PRIMARY: gemini-3-pro-image
// - FALLBACK: gemini-3.1-flash-image
// ─────────────────────────────────────────────────────────────────────────
export const IMAGE_GENERATION_MODEL = 'gemini-3-pro-image';
export const FALLBACK_IMAGE_GENERATION_MODEL = 'gemini-3.1-flash-image';
