export type CharacterName = '하나 선생님' | '도윤' | '서아';

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


export type CharacterAsset = {
  id: string;
  name: string;
  characterName: CharacterName;
  imageUrl: string;
  layerName: string;
};

export const CHARACTER_ASSETS: CharacterAsset[] = [
  // 하나 선생님
  { id: 'hana-front', name: '기본', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/hana-master/hana-v2-front.png', layerName: '하나 선생님 기본' },
  { id: 'hana-fullbody', name: '전신', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/hana-master/hana-v2-fullbody.png', layerName: '하나 선생님 전신' },
  { id: 'hana-side', name: '측면', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/hana-master/hana-v2-side.png', layerName: '하나 선생님 측면' },
  { id: 'hana-normal', name: '정면', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/expressions/hana/hana-normal.png', layerName: '하나 선생님 정면' },
  { id: 'hana-smile', name: '웃음', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/expressions/hana/hana-smile.png', layerName: '하나 선생님 웃음' },
  { id: 'hana-thinking', name: '생각', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/expressions/hana/hana-thinking.png', layerName: '하나 선생님 생각' },
  { id: 'hana-surprise', name: '놀람', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/expressions/hana/hana-surprise.png', layerName: '하나 선생님 놀람' },
  { id: 'hana-explain', name: '설명', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/expressions/hana/hana-explain.png', layerName: '하나 선생님 설명' },
  { id: 'hana-cheer', name: '응원', characterName: '하나 선생님', imageUrl: '/images/toonschool/characters/v2/expressions/hana/hana-cheer.png', layerName: '하나 선생님 응원' },

  // 도윤
  { id: 'doyoon-front', name: '기본', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/doyoon-master/doyoon-v2-front.png', layerName: '도윤 기본' },
  { id: 'doyoon-fullbody', name: '전신', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/doyoon-master/doyoon-v2-fullbody.png', layerName: '도윤 전신' },
  { id: 'doyoon-side', name: '측면', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/doyoon-master/doyoon-v2-side.png', layerName: '도윤 측면' },
  { id: 'doyoon-normal', name: '정면', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-normal.png', layerName: '도윤 정면' },
  { id: 'doyoon-smile', name: '웃음', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-smile.png', layerName: '도윤 웃음' },
  { id: 'doyoon-thinking', name: '생각', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-thinking.png', layerName: '도윤 생각' },
  { id: 'doyoon-surprise', name: '놀람', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-surprise.png', layerName: '도윤 놀람' },
  { id: 'doyoon-explain', name: '설명', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-explain.png', layerName: '도윤 설명' },
  { id: 'doyoon-cheer', name: '응원', characterName: '도윤', imageUrl: '/images/toonschool/characters/v2/expressions/doyoon/doyoon-cheer.png', layerName: '도윤 응원' },

  // 서아
  { id: 'seoa-front', name: '기본', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/seoa-master/seoa-v2-front.png', layerName: '서아 기본' },
  { id: 'seoa-fullbody', name: '전신', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/seoa-master/seoa-v2-fullbody.png', layerName: '서아 전신' },
  { id: 'seoa-side', name: '측면', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/seoa-master/seoa-v2-side.png', layerName: '서아 측면' },
  { id: 'seoa-normal', name: '정면', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/expressions/seoa/seoa-normal.png', layerName: '서아 정면' },
  { id: 'seoa-smile', name: '웃음', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/expressions/seoa/seoa-smile.png', layerName: '서아 웃음' },
  { id: 'seoa-thinking', name: '생각', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/expressions/seoa/seoa-thinking.png', layerName: '서아 생각' },
  { id: 'seoa-surprise', name: '놀람', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/expressions/seoa/seoa-surprise.png', layerName: '서아 놀람' },
  { id: 'seoa-explain', name: '설명', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/expressions/seoa/seoa-explain.png', layerName: '서아 설명' },
  { id: 'seoa-cheer', name: '응원', characterName: '서아', imageUrl: '/images/toonschool/characters/v2/expressions/seoa/seoa-cheer.png', layerName: '서아 응원' },
];
