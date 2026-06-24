export type CharacterSubject =
  | 'korean'
  | 'english'
  | 'math'
  | 'science'
  | 'social'
  | 'official';

export type CharacterAsset = {
  id: string;
  name: string;
  characterName: '도윤' | '하나 선생님' | '서아';
  subject: CharacterSubject;
  imageUrl: string;
  layerName: string;
};

export const V2_CHARACTER_AVATARS = {
  hana: '/images/toonschool/characters/v2/hana-v2-front.png',
  doyoon: '/images/toonschool/characters/v2/doyoon-v2-front.png',
  seoa: '/images/toonschool/characters/v2/seoa-v2-front.png',
};

export const V2_CHARACTER_EXPRESSIONS = {
  hana: {
    normal: '/images/toonschool/characters/v2/expressions/hana/hana-normal.png',
    smile: '/images/toonschool/characters/v2/expressions/hana/hana-smile.png',
    thinking: '/images/toonschool/characters/v2/expressions/hana/hana-thinking.png',
    surprise: '/images/toonschool/characters/v2/expressions/hana/hana-surprise.png',
    explain: '/images/toonschool/characters/v2/expressions/hana/hana-explain.png',
    cheer: '/images/toonschool/characters/v2/expressions/hana/hana-cheer.png',
  },
  doyoon: {
    normal: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-normal.png',
    smile: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-smile.png',
    thinking: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-thinking.png',
    surprise: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-surprise.png',
    explain: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-explain.png',
    cheer: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-cheer.png',
  },
  seoa: {
    normal: '/images/toonschool/characters/v2/expressions/seoa/seoa-normal.png',
    smile: '/images/toonschool/characters/v2/expressions/seoa/seoa-smile.png',
    thinking: '/images/toonschool/characters/v2/expressions/seoa/seoa-thinking.png',
    surprise: '/images/toonschool/characters/v2/expressions/seoa/seoa-surprise.png',
    explain: '/images/toonschool/characters/v2/expressions/seoa/seoa-explain.png',
    cheer: '/images/toonschool/characters/v2/expressions/seoa/seoa-cheer.png',
  },
};

export const CHARACTER_ASSETS: CharacterAsset[] = [
  // 공용 (Official)
  {
    id: 'official-hana',
    name: '공용 하나 선생님',
    characterName: '하나 선생님',
    subject: 'official',
    imageUrl: V2_CHARACTER_AVATARS.hana,
    layerName: '공용 하나 선생님'
  },
  {
    id: 'official-doyoon',
    name: '공용 도윤',
    characterName: '도윤',
    subject: 'official',
    imageUrl: V2_CHARACTER_AVATARS.doyoon,
    layerName: '공용 도윤'
  },
  {
    id: 'official-seoa',
    name: '공용 서아',
    characterName: '서아',
    subject: 'official',
    imageUrl: V2_CHARACTER_AVATARS.seoa,
    layerName: '공용 서아'
  },

  // 국어 (Korean)
  {
    id: 'korean-doyoon',
    name: '국어 도윤',
    characterName: '도윤',
    subject: 'korean',
    imageUrl: '/images/toonschool/characters/subjects/korean/doyoon-reading.png',
    layerName: '국어 도윤'
  },
  {
    id: 'korean-hana',
    name: '국어 하나 선생님',
    characterName: '하나 선생님',
    subject: 'korean',
    imageUrl: '/images/toonschool/characters/subjects/korean/hana-reading.png',
    layerName: '국어 하나 선생님'
  },
  {
    id: 'korean-seoa',
    name: '국어 서아',
    characterName: '서아',
    subject: 'korean',
    imageUrl: '/images/toonschool/characters/subjects/korean/seoa-writing.png',
    layerName: '국어 서아'
  },

  // 영어 (English)
  {
    id: 'english-doyoon',
    name: '영어 도윤',
    characterName: '도윤',
    subject: 'english',
    imageUrl: '/images/toonschool/characters/subjects/english/doyoon-english.png',
    layerName: '영어 도윤'
  },
  {
    id: 'english-hana',
    name: '영어 하나 선생님',
    characterName: '하나 선생님',
    subject: 'english',
    imageUrl: '/images/toonschool/characters/subjects/english/hana-english.png',
    layerName: '영어 하나 선생님'
  },
  {
    id: 'english-seoa',
    name: '영어 서아',
    characterName: '서아',
    subject: 'english',
    imageUrl: '/images/toonschool/characters/subjects/english/seoa-english.png',
    layerName: '영어 서아'
  },

  // 수학 (Math)
  {
    id: 'math-doyoon',
    name: '수학 도윤',
    characterName: '도윤',
    subject: 'math',
    imageUrl: '/images/toonschool/characters/subjects/math/doyoon-math.png',
    layerName: '수학 도윤'
  },
  {
    id: 'math-hana',
    name: '수학 하나 선생님',
    characterName: '하나 선생님',
    subject: 'math',
    imageUrl: '/images/toonschool/characters/subjects/math/hana-math.png',
    layerName: '수학 하나 선생님'
  },
  {
    id: 'math-seoa',
    name: '수학 서아',
    characterName: '서아',
    subject: 'math',
    imageUrl: '/images/toonschool/characters/subjects/math/seoa-math.png',
    layerName: '수학 서아'
  },

  // 과학 (Science)
  {
    id: 'science-doyoon',
    name: '과학 도윤',
    characterName: '도윤',
    subject: 'science',
    imageUrl: '/images/toonschool/characters/subjects/science/doyoon-science.png',
    layerName: '과학 도윤'
  },
  {
    id: 'science-hana',
    name: '과학 하나 선생님',
    characterName: '하나 선생님',
    subject: 'science',
    imageUrl: '/images/toonschool/characters/subjects/science/hana-science.png',
    layerName: '과학 하나 선생님'
  },
  {
    id: 'science-seoa',
    name: '과학 서아',
    characterName: '서아',
    subject: 'science',
    imageUrl: '/images/toonschool/characters/subjects/science/seoa-science.png',
    layerName: '과학 서아'
  },

  // 사회 (Social)
  {
    id: 'social-doyoon',
    name: '사회 도윤',
    characterName: '도윤',
    subject: 'social',
    imageUrl: '/images/toonschool/characters/subjects/social/doyoon-social.png',
    layerName: '사회 도윤'
  },
  {
    id: 'social-hana',
    name: '사회 하나 선생님',
    characterName: '하나 선생님',
    subject: 'social',
    imageUrl: '/images/toonschool/characters/subjects/social/hana-social.png',
    layerName: '사회 하나 선생님'
  },
  {
    id: 'social-seoa',
    name: '사회 서아',
    characterName: '서아',
    subject: 'social',
    imageUrl: '/images/toonschool/characters/subjects/social/seoa-social.png',
    layerName: '사회 서아'
  }
];

export function normalizeSubject(rawSubject?: string | null): CharacterSubject | 'official' {
  if (!rawSubject) return 'official';
  const s = rawSubject.toLowerCase();
  if (s.includes('국어') || s.includes('korean')) return 'korean';
  if (s.includes('영어') || s.includes('english')) return 'english';
  if (s.includes('수학') || s.includes('math')) return 'math';
  if (s.includes('과학') || s.includes('science')) return 'science';
  if (s.includes('사회') || s.includes('social')) return 'social';
  return 'official';
}
