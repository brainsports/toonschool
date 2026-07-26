/**
 * 로컬 검증용 샘플 데이터(EF 미배포시 폴백).
 * 실제 AI 를 대체하지 않으며, 운영 배포 후에는 generate-mindmap EF 가 정상 동작한다.
 * 클라이언트 검증(1차 4~6, 2차 ≥2, 4차 설명 10~49자)을 통과하도록 구성.
 */
import type {
  AiBranch,
  AiFullMindmapResponse,
  AiLeaf,
  AiPartialMindmapResponse,
  AiPartialRequest,
} from '../types/mindmapAi';

/** 중심 주제 추천(로컬 폴백). 단원/과목 맥락에 맞는 3~5개 문장. */
export function buildSampleTopics(params: {
  subject?: string;
  unitTitle?: string;
  subunitTitle?: string;
}): string[] {
  const unit = params.subunitTitle?.trim() || params.unitTitle?.trim() || '이 단원';
  const subject = params.subject ?? '';
  if (subject === '과학' || /물|상태|변화/.test(unit)) {
    return [
      '물은 어떻게 얼음이 될까요?',
      '얼음은 왜 녹을까요?',
      '물은 어디로 사라질까요?',
      '우리 생활에서 물의 상태 변화 찾기',
      '물의 세 가지 모습을 알아보아요',
    ];
  }
  return [
    `${unit}에서 가장 중요한 점은 무엇일까요?`,
    `${unit}을(를) 우리 생활에서 찾아볼 수 있을까요?`,
    `${unit}의 과정을 차례대로 정리해 볼까요?`,
    `${unit}에서 더 궁금한 점은 무엇일까요?`,
  ];
}

/** 주제 맥락에 맞는 예시 툰마인드(1차 4~6, 2차 2~4, 4차 설명 10~49자). */
export function buildSampleMindmap(params: {
  centralTopic: string;
  subject?: string;
  unitTitle?: string;
}): AiFullMindmapResponse {
  const topic = params.centralTopic?.trim() || params.unitTitle?.trim() || '탐구 주제';
  const subject = params.subject ?? '';
  const isScience = subject === '과학' || /물|식물|상태|자석|날씨/.test(params.unitTitle ?? '');

  const banks: Record<string, AiBranch[]> = {
    science: [
      branch('무엇인가요?', 'idea', [
        leaf(`${topic}의 뜻`, 'search', `${topic}이(가) 무엇인지 쉽게 알아봐요.`),
        leaf('생김새와 특징', 'leaf', `색깔과 크기, 모습으로 특징을 찾아봐요.`),
      ]),
      branch('어떻게 될까요?', 'clock', [
        leaf('차례대로 변하는 과정', 'sprout', `시간 순서대로 어떻게 변하는지 봐요.`),
        leaf('결과 알아보기', 'fruit', `변화가 끝나면 어떤 결과가 나타나는지 봐요.`),
        leaf('필요한 조건', 'sun', `변하려면 꼭 필요한 조건이 있어요.`),
      ]),
      branch('왜 그럴까요?', 'question', [
        leaf('원인 생각하기', 'lightbulb', `겉모습 뒤에 숨은 원인을 생각해 봐요.`),
        leaf('비교하며 알아보기', 'search', `비슷한 것과 다른 것을 비교해 봐요.`),
      ]),
      branch('생활 속 예시', 'home', [
        leaf('주변에서 찾기', 'search', `주변에서 쉽게 찾아볼 수 있어요.`),
        leaf('직접 해보기', 'pencil', `직접 관찰하면 더 오래 기억에 남아요.`),
      ]),
      branch('더 궁금해요', 'question', [
        leaf('탐구 질문 만들기', 'question', `궁금한 점을 질문으로 만들어 봐요.`),
        leaf('더 알아볼 방법', 'book', `책과 영상으로 더 알아봐요.`),
      ]),
    ],
    generic: [
      branch('알게 된 점', 'idea', [
        leaf(`${topic}의 핵심`, 'star', `${topic}의 가장 중요한 점이에요.`),
        leaf('특징 살피기', 'search', `여러 특징을 하나씩 살펴봐요.`),
      ]),
      branch('차례대로 보기', 'clock', [
        leaf('처음에는', 'seed', `무엇에서 시작하는지 알아봐요.`),
        leaf('다음에는', 'sprout', `다음 단계가 어떻게 이어지는지 봐요.`),
        leaf('마지막에는', 'fruit', `마지막에 어떤 결과가 나오는지 봐요.`),
      ]),
      branch('왜 그럴까요?', 'question', [
        leaf('원인 생각하기', 'lightbulb', `이유를 나만의 말로 설명해 봐요.`),
        leaf('예에서 확인하기', 'search', `여러 예에서 같은 이유를 찾아봐요.`),
      ]),
      branch('생활 속에서', 'home', [
        leaf('찾아보기', 'search', `주변에서 비슷한 모습을 찾아봐요.`),
        leaf('실천하기', 'heart', `배운 점을 내 생활에 적용해 봐요.`),
      ]),
      branch('더 궁금해요', 'question', [
        leaf('탐구 질문', 'question', `더 알고 싶은 점을 적어봐요.`),
        leaf('더 공부할 거리', 'book', `책이나 영상으로 더 알아봐요.`),
      ]),
    ],
  };

  const branches = (isScience ? banks.science : banks.generic).slice(0, 5);
  return { centralTopic: topic, branches };
}

function branch(title: string, icon: string, children: AiLeaf[]): AiBranch {
  return { title, icon, children };
}
// 2차(짧은 세부 주제) + 그 아래 3차 설명 카드 1개(description 을 detail 로 내림).
function leaf(title: string, icon: string, description: string): AiLeaf {
  const d = description.trim();
  return { title, icon, details: d ? [{ title, description: d }] : [] };
}

/** 부분 생성 로컬 폴백(선택 노드 아래에 들어갈 자식/설명 제안). */
export function buildSamplePartial(req: AiPartialRequest): AiPartialMindmapResponse {
  const t = req.nodeTitle?.trim() || '이 내용';
  const pl = (title: string, icon: string, description: string): AiLeaf => ({ title, icon, description });
  const children: AiLeaf[] = [];
  switch (req.action) {
    case 'add_children':
      children.push(
        pl(`${t}의 특징`, 'star', `${t}의 중요한 특징을 살펴봐요.`),
        pl(`${t}의 예시`, 'lightbulb', `일상에서 겪는 예로 알아봐요.`),
        pl(`${t}와 관련된 것`, 'search', `비슷한 것과 비교해 봐요.`)
      );
      break;
    case 'simplify':
      return { children: [], suggestedTitle: t, suggestedDescription: `${t}을(를) 짧고 쉬운 말로 바꿔봐요.` };
    case 'detail':
      return { children: [], suggestedTitle: t, suggestedDescription: `${t}의 이유를 살펴봐요.` };
    case 'example':
      return { children: [], suggestedTitle: t, suggestedDescription: `예를 들어 일상에서 이렇게 나타나요.` };
    case 'daily':
      return { children: [], suggestedTitle: t, suggestedDescription: `생활 속에서 자주 보이는 모습이에요.` };
    case 'question':
      children.push(pl(`${t}에 대해 더 생각해 볼 질문`, 'question', `${t}과(와) 관련된 질문을 떠올려 봐요.`));
      break;
  }
  return { children };
}
