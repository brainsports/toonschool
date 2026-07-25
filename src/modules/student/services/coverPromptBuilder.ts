// 창작 표지/뒤표지 AI 이미지 프롬프트 빌더.
// 기존 comicBackgroundRuleService 의 COMMON_* 상수는 "만화 배경(캐릭터 없음)" 전용이라
// 표지(캐릭터 포함)에는 재사용하지 않고, 표지 전용 스타일/네거티브를 따로 둔다.
// 핵심 원칙: 작품 제목·부제·작가명은 프롬프트에 넣지 않는다(한글 깨짐·개인정보 방지).
//            AI는 배경/캐릭터/물건/분위기/구도만 생성하고, 텍스트는 툰스쿨이 별도 합성한다.
import type {
  CreationCoverBaseInfo,
  BackCoverContentKey,
} from '../data/coverPresets';

// 표지 전용 스타일 헤더 — 캐릭터를 포함하는 밝은 학습만화 표지 일러스트.
export const COVER_STYLE_HEADER = `A high quality, bright, and cheerful book cover illustration for elementary school students.
Japanese anime-style educational illustration. Soft cell-shaded 2D art. Clean outlines. Bright pastel colors.
NOT photorealistic. NOT 3D render. NOT scary. Hand-drawn 2D illustration feel.
Friendly, age-appropriate manga/comic book cover look. Portrait orientation (book cover proportions).`;

// 표지 네거티브 — 문자/말풍선/로고는 금지, 캐릭터는 허용.
export const COVER_NEGATIVE_RULES = `no text, no words, no letters, no handwriting, no speech bubbles, no captions, no titles drawn in the image, no logos, no watermarks, no UI elements, no photographic realism, nothing scary or violent, no blood, no realistic weapons, no copyrighted or franchise characters, no real-person likenesses, no brand logos`;

const COVER_SAFETY_RULES = `Child-safe content. No scary, violent, gory, or sexual content. No realistic weapons or blood. Characters must look like friendly cartoon/anime characters, never real people. No copyrighted characters from other franchises (no Disney, Pokémon, Marvel, etc.).`;

const COVER_TITLE_SPACE_RULE = `Leave clear empty space at the TOP of the cover (about the top 25% of the frame) so a Korean title can be overlaid later by the app. Do not draw any text, logo, or busy detail in that space.`;

const sanitize = (s?: string): string => (s || '').trim();

export interface BuildCoverPromptInput {
  coverKind: 'front' | 'back';
  baseInfo: CreationCoverBaseInfo;
  compositionGuide: string; // 프리셋의 구도 설명
  promptRule: string; // 프리셋의 유형별 규칙
  additionalPrompt?: string; // 학생 추가 요청
  selectedContents?: BackCoverContentKey[]; // 뒤표지 선택 항목
  inheritFromFront?: boolean; // 뒤표지가 앞표지 스타일 계승
}

// 작품 기본 정보에서 "시각 묘사"만 추출 (title/authorDisplayName 제외).
const buildVisualContext = (baseInfo: CreationCoverBaseInfo): string => {
  const ctx: string[] = [];
  if (baseInfo.mainCharacter) ctx.push(`Main character: ${baseInfo.mainCharacter} (a friendly cartoon/anime child character).`);
  if (baseInfo.supportingCharacters) ctx.push(`Supporting characters: ${baseInfo.supportingCharacters}.`);
  if (baseInfo.location) ctx.push(`Main location/setting: ${baseInfo.location}.`);
  if (baseInfo.importantObject) ctx.push(`Important object: ${baseInfo.importantObject}.`);
  if (baseInfo.mood) ctx.push(`Mood/atmosphere: ${baseInfo.mood}.`);
  if (baseInfo.storySummary) ctx.push(`Story summary (visual context only): ${baseInfo.storySummary}.`);
  if (baseInfo.keywords && baseInfo.keywords.length > 0) ctx.push(`Visual theme keywords: ${baseInfo.keywords.join(', ')}.`);
  return ctx.join('\n');
};

export const buildCoverPrompt = (input: BuildCoverPromptInput): string => {
  const { coverKind, baseInfo, compositionGuide, promptRule, additionalPrompt, selectedContents, inheritFromFront } = input;
  const parts: string[] = [];

  parts.push(COVER_STYLE_HEADER);

  // 1) 유형별 구도 + 규칙
  parts.push(`=== COVER TYPE COMPOSITION ===\n${compositionGuide}\n${promptRule}`);

  // 2) 스토리 시각 컨텍스트 (시각 묘사만)
  const visualContext = buildVisualContext(baseInfo);
  if (visualContext) parts.push(`=== STORY VISUAL CONTEXT ===\n${visualContext}`);

  // 3) 학생 추가 요청
  if (sanitize(additionalPrompt)) {
    parts.push(`=== STUDENT EXTRA REQUEST ===\n${sanitize(additionalPrompt)}`);
  }

  // 4) 표지/뒤표지 요건
  if (coverKind === 'back') {
    const lines = ['=== BACK COVER REQUIREMENTS ===', 'This is the BACK cover of the same book.'];
    if (inheritFromFront) {
      lines.push('Keep the SAME art style, color palette, character outfits and hair as the front cover so the front and back look like one consistent book.');
    }
    lines.push('Use a SIMPLER background than the front cover.');
    lines.push('Keep the center and top area mostly empty so text can be overlaid later.');
    lines.push('Place any characters small and to the side so they never overlap the text area.');
    if (selectedContents && selectedContents.length > 0) {
      lines.push(`Text to be overlaid later includes: ${selectedContents.join(', ')}. Reserve space accordingly.`);
    }
    parts.push(lines.join('\n'));
  } else {
    parts.push(`=== FRONT COVER REQUIREMENTS ===\nThis is the FRONT cover. Make the protagonist and the key object clearly visible and appealing.`);
    parts.push(COVER_TITLE_SPACE_RULE);
  }

  // 5) 안전 + 네거티브
  parts.push(`=== CHILD SAFETY ===\n${COVER_SAFETY_RULES}`);
  parts.push(`=== HARD NEGATIVE RULES ===\n${COVER_NEGATIVE_RULES}`);

  return parts.filter(Boolean).join('\n\n');
};

// 추가 요청 문장에서 이름 패턴을 단순 차단하는 1차 세안화(정교 모더레이션은 별도).
// 학생이 실수로 작가명/학급을 적어 넣었을 때 프롬프트 반입을 줄인다.
export const sanitizeExtraRequest = (raw: string): string => {
  if (!raw) return '';
  // "내 이름은 OOO", "학급 OO", 전화번호/이메일 패턴 제거
  return raw
    .replace(/(내 이름은|제 이름은|학급|반 번호|전화번호|이메일)[^,.\n]*/gi, '')
    .replace(/\b\d{2,3}[-.]?\d{3,4}[-.]?\d{4}\b/g, '') // 전화번호
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '') // 이메일
    .trim();
};
