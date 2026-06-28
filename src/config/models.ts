// ─────────────────────────────────────────────────────────────────────────
// 텍스트 생성 모델 (2026-06-28 업데이트)
//
// primary = gemini-3-flash-preview, fallback = gemini-3.5-flash
// ─────────────────────────────────────────────────────────────────────────
export const TEXT_GENERATION_MODEL = 'gemini-3-flash-preview';
export const TEXT_FALLBACK_MODEL = 'gemini-3.5-flash';

// ─────────────────────────────────────────────────────────────────────────
// 이미지 생성 모델 (Worker에서 사용, models/list 확인)
// - PRIMARY: gemini-3-pro-image
// - FALLBACK: gemini-3.1-flash-image
// ─────────────────────────────────────────────────────────────────────────
export const IMAGE_GENERATION_MODEL = 'gemini-3-pro-image';
export const FALLBACK_IMAGE_GENERATION_MODEL = 'gemini-3.1-flash-image';
