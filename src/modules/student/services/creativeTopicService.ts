// 창작 과목 전용 주제/키워드 생성 서비스.
// 기존 studentTopicService(교과 단원 기반)와 분리 — 창작은 creativeSettings 기반으로 생성.
// 호출 시점: 학생이 창작 분야 → 세부 설정 → 주제 선택을 마친 이후에만.
import { geminiClient } from '../../../shared/lib/gemini';
import { TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL } from '../../../config/models';
import { getCreativeCategory, type CreativeStorySettings } from '../data/creativeCategories';

export interface CreativeTopic {
  id: string;
  title: string;
  summary: string;
}

const safetyNoteFor = (settings: CreativeStorySettings): string => {
  const cat = getCreativeCategory(settings.categoryId);
  return cat?.safetyNote ? `안전: ${cat.safetyNote}` : '';
};

// 창작 주제 5개 생성. 사건 중심 15~32자, '이야기' 반복 금지, 분야/소재 반영.
export const generateCreativeTopics = async (
  settings: CreativeStorySettings,
  gradeName: string
): Promise<CreativeTopic[]> => {
  const lines = [
    `- 분야: ${settings.categoryName}`,
    `- 세부 장르: ${settings.genreName}`,
    `- 이야기 소재: ${settings.materialName}`,
    `- 주인공: ${settings.protagonistCustomText || settings.protagonistName || '자유'}`,
    `- 배경: ${settings.backgroundCustomText || settings.backgroundName || '자유'}`,
    `- 분위기: ${settings.moodName || '자유'}`,
    `- 결말 방향: ${settings.endingName || 'AI가 자유롭게'}`,
    `- 대상 학년: ${gradeName}`,
  ].join('\n');

  const prompt = `너는 초등학교(3~6학년) 학생의 창작 만화를 도와주는 선생님이다.
학생이 고른 창작 설정:
${lines}

이 설정으로 6컷 만화 주제 5개를 제안해 줘.
규칙:
1. 각 주제 제목은 15~32자로, 사건이나 상황이 드러나야 한다. (예: "마법 도서관에서 사라진 책을 찾는 세 친구")
2. 추상적 제목("마법 이야기", "우정 이야기", "모험 이야기" 등)은 만들지 않는다. 제목을 "이야기"로 끝내지 않는다.
3. 학생이 고른 분야, 소재, 주인공, 배경, 분위기가 자연스럽게 드러나야 한다.
4. 5개 주제는 서로 다른 사건과 갈등을 가져야 한다.
5. 선정적·잔인·혐오·범죄 모방 요소, 유명 만화/영화의 고유 캐릭터 복제는 절대 금지.
6. 초등학생이 이해하기 쉬운 표현.
${safetyNoteFor(settings) ? '7. ' + safetyNoteFor(settings) : ''}

반드시 JSON 배열 5개로만 반환. 각 원소는 {"id":"c1"~"c5", "title":"주제 제목", "summary":"한 줄 설명"}. 마크다운 코드블록 없이 순수 JSON만.`;

  for (const model of [TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL]) {
    if (!model) continue;
    try {
      const text = await geminiClient.generateTextWithModel(prompt, model);
      if (text.includes('API Key가 설정되지 않았습니다') || text.includes('오류가 발생했습니다')) {
        throw new Error(text);
      }
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr)) {
        const topics = arr
          .filter((x: any) => x && typeof x.title === 'string' && x.title.trim())
          .map((x: any, i: number) => ({
            id: typeof x.id === 'string' ? x.id : `c${i + 1}`,
            title: String(x.title).trim().slice(0, 60),
            summary: typeof x.summary === 'string' ? x.summary.trim() : '',
          }));
        if (topics.length) return topics.slice(0, 5);
      }
    } catch {
      // 다음 모델 폴백
    }
  }
  return [];
};

// 조사형/문장형/형용사·동사 의심 표현 제거.
const cleanKeyword = (w: string): string => {
  let s = w.trim();
  // 조사로 끝나면 제거
  s = s.replace(/(이|가|을|를|의|에|에서|와|과|로|으로|은|는|도|만|라|야)$/, '');
  // 공백/문장이면 제거(명사 아님)
  if (/\s/.test(s) || s.length < 2 || s.length > 8) return '';
  return s;
};

// 창작 키워드 10개 생성. 명사/명사구만.
export const generateCreativeKeywords = async (
  settings: CreativeStorySettings,
  topic: string
): Promise<string[]> => {
  const lines = [
    `- 분야: ${settings.categoryName}`,
    `- 세부 장르: ${settings.genreName}`,
    `- 소재: ${settings.materialName}`,
    `- 주인공: ${settings.protagonistCustomText || settings.protagonistName || ''}`,
    `- 배경: ${settings.backgroundCustomText || settings.backgroundName || ''}`,
    `- 분위기: ${settings.moodName || ''}`,
    `- 결말: ${settings.endingName || ''}`,
    `- 최종 주제: ${topic}`,
  ].join('\n');

  const prompt = `너는 초등학교 학생의 창작 만화를 도와주는 선생님이다.
학생이 고른 설정:
${lines}

이 내용으로 6컷 만화를 만들 때 도움이 되는 핵심 키워드 10개를 만들어.
규칙:
- 반드시 명사 또는 명사구만. (예: 마법학교, 도서관, 마법책, 비밀문, 세친구, 단서, 수호자, 우정, 봉인, 모험)
- 형용사, 동사, 문장 사용 금지. (예: "재미있는", "찾아간다" 금지)
- 조사로 끝내지 않는다.
- 2~8글자.
- 중복 금지.
- 너무 추상적 단어 금지.
- 분야, 소재, 주인공, 배경과 관련된 단어 우선.
- 유명 만화/영화 고유 캐릭터 이름 사용 금지.
구성 권장: 인물 2, 장소 2, 사건/물건 3, 감정·관계 명사 1, 결말·목표 명사 2.

반드시 JSON 문자열 배열 10개로만 반환. 마크다운 없이 순수 JSON.`;

  for (const model of [TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL]) {
    if (!model) continue;
    try {
      const text = await geminiClient.generateTextWithModel(prompt, model);
      if (text.includes('API Key가 설정되지 않았습니다') || text.includes('오류가 발생했습니다')) {
        throw new Error(text);
      }
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const arr = JSON.parse(cleaned);
      if (Array.isArray(arr)) {
        const kws = arr
          .filter((x) => typeof x === 'string')
          .map((x) => cleanKeyword(x as string))
          .filter(Boolean);
        // 중복 제거
        const unique = Array.from(new Set(kws));
        if (unique.length) return unique.slice(0, 10);
      }
    } catch {
      // 폴백
    }
  }
  return [];
};
