/**
 * 로컬 검증용 샘플 데이터(EF 미배포시 폴백).
 * 실제 AI 를 대체하지 않으며, 운영 배포 후에는 generate-mindmap EF 가 정상 동작한다.
 * 클라이언트 검증(1차 4~6, 2차 ≥2, 설명 50~200자)을 통과하도록 풍성하게 구성.
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

/** 주제 맥락에 맞는 풍성한 예시 툰마인드(1차 4~6, 2차 2~4, 설명 50~200자). */
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
        leaf(`${topic}의 뜻`, 'search', `${topic}이(가) 무엇인지 쉬운 말로 알아봅시다. 우리 주변에서 쉽게 만날 수 있고, 일상생활과 아주 밀접하게 관련된 중요한 개념이에요.`),
        leaf('생김새와 특징', 'leaf', `눈으로 직접 관찰하면 어떤 모습인지 알 수 있어요. 색깔, 크기, 단단함 같은 특징을 살펴보면 ${topic}을(를) 더 쉽게 이해할 수 있어요.`),
      ]),
      branch('어떻게 될까요?', 'clock', [
        leaf('차례대로 변하는 과정', 'sprout', `시간이 지나면서 ${topic}은(는) 일정한 순서대로 변해요. 처음에는 어떤 상태였는지, 다음에는 어떻게 달라지는지 차례로 살펴보면 규칙을 찾을 수 있어요.`),
        leaf('결과 알아보기', 'fruit', `변화가 모두 끝나면 어떤 결과가 나타나는지 알아봅시다. 그 결과는 우리 생활 곳곳에서 자주 볼 수 있어요.`),
        leaf('필요한 조건', 'sun', `${topic}이(가) 변하려면 온도나 공기처럼 꼭 필요한 조건이 있어요. 조건이 달라지면 결과도 달라질 수 있어요.`),
      ]),
      branch('왜 그럴까요?', 'question', [
        leaf('원인 생각하기', 'lightbulb', `왜 그런 일이 일어나는지 이유를 생각해 봅시다. 겉보기 현상 뒤에는 분명한 원인이 숨어 있어요.`),
        leaf('비교하며 알아보기', 'search', `비슷한 것과 다른 것을 비교하면 차이점이 뚜렷하게 보여요. 비교는 올바른 이유를 찾는 좋은 방법이에요.`),
      ]),
      branch('생활 속 예시', 'home', [
        leaf('주변에서 찾기', 'search', `우리 집이나 학교 주변에서 ${topic}과(와) 관련된 것을 찾아봅시다. 생각보다 아주 많은 곳에서 만날 수 있어요.`),
        leaf('직접 해보기', 'pencil', `직접 관찰하고 기록해 보면 책으로만 배울 때보다 훨씬 더 오래 기억에 남아요. 안전에 주의하며 해봅시다.`),
      ]),
      branch('더 궁금해요', 'question', [
        leaf('탐구 질문 만들기', 'question', `${topic}에 대해 더 알고 싶은 점을 직접 질문으로 만들어 봅시다. 좋은 질문은 새로운 학습의 시작이에요.`),
        leaf('더 알아볼 방법', 'book', `${topic}을(를) 더 알기 위해 책이나 영상, 관찰을 활용해 봅시다. 다양한 방법으로 찾으면 더 재미있어요.`),
      ]),
    ],
    generic: [
      branch('알게 된 점', 'idea', [
        leaf(`${topic}의 핵심`, 'star', `${topic}에서 가장 중요한 점은 무엇인지 쉽게 정리해 봅시다. 핵심을 알면 나머지 내용도 이해하기 쉬워져요.`),
        leaf('특징 살피기', 'search', `${topic}이(가) 가진 여러 특징을 하나씩 살펴보면, 왜 그런지 이유를 더 잘 알 수 있어요.`),
      ]),
      branch('차례대로 보기', 'clock', [
        leaf('처음에는', 'seed', `${topic}의 시작을 살펴봅시다. 무엇에서부터 출발하는지 알면 전체 흐름을 이해하기 쉬워져요.`),
        leaf('다음에는', 'sprout', `이어지는 과정을 차례로 살펴봅시다. 한 단계가 다음 단계에 어떤 영향을 주는지 생각해 보면 좋아요.`),
        leaf('마지막에는', 'fruit', `최종적으로 어떤 결과가 나타나는지 정리해 봅시다. 결과를 알면 전체를 한눈에 알 수 있어요.`),
      ]),
      branch('왜 그럴까요?', 'question', [
        leaf('원인 생각하기', 'lightbulb', `왜 그런지 이유를 나만의 말로 설명해 봅시다. 이유를 설명하면 더 깊이 이해하게 돼요.`),
        leaf('예에서 확인하기', 'search', `여러 예를 살펴 이유가 맞는지 확인해 봅시다. 비슷한 예에서 같은 이유를 찾으면 확신이 생겨요.`),
      ]),
      branch('생활 속에서', 'home', [
        leaf('찾아보기', 'search', `우리 주변에서 ${topic}과(와) 비슷한情形을 찾아봅시다. 실생활과 연결하면 훨씬 재미있어요.`),
        leaf('실천하기', 'heart', `${topic}에서 배운 점을 내 생활에 어떻게 적용할 수 있을지 구체적으로 적어 봅시다.`),
      ]),
      branch('더 궁금해요', 'question', [
        leaf('탐구 질문', 'question', `${topic}에 대해 더 알고 싶은 점을 적어봅시다. 궁금함이 곧 새로운 배움이에요.`),
        leaf('더 공부할 거리', 'book', `${topic}과(와) 관련된 책이나 영상을 찾아 더 알아봐요. 스스로 찾는 공부가 오래 기억에 남아요.`),
      ]),
    ],
  };

  const branches = (isScience ? banks.science : banks.generic).slice(0, 5);
  return { centralTopic: topic, branches };
}

function branch(title: string, icon: string, children: AiLeaf[]): AiBranch {
  return { title, icon, children };
}
// 2차(짧은 세부 주제) + 그 아래 3차 설명 카드 1개. 두 단계의 제목은 반복하지 않는다.
function leaf(title: string, icon: string, description: string): AiLeaf {
  const d = description.trim();
  const detailTitle = title.endsWith('알아보기') ? `${title} 자세히` : `${title} 알아보기`;
  return { title, icon, details: d ? [{ title: detailTitle.slice(0, 30), description: d }] : [] };
}

/** 부분 생성 로컬 폴백(선택 노드 아래에 들어갈 자식/설명 제안). */
export function buildSamplePartial(req: AiPartialRequest): AiPartialMindmapResponse {
  const t = req.nodeTitle?.trim() || '이 내용';
  const pl = (title: string, icon: string, description: string): AiLeaf => ({ title, icon, description });
  const children: AiLeaf[] = [];
  switch (req.action) {
    case 'add_children':
      children.push(
        pl(`${t}의 특징`, 'star', `${t}이(가) 가진 중요한 특징을 쉬운 말로 살펴봅시다. 특징을 알면 다른 것과 구별하기 쉬워져요.`),
        pl(`${t}의 예시`, 'lightbulb', `${t}을(를) 우리가 자주 겪는 상황으로 예를 들어 설명해 볼게요. 예시를 통해 더 쉽게 이해할 수 있어요.`),
        pl(`${t}와 관련된 것`, 'search', `${t}과(와) 비슷하거나 다른 것을 비교해 보면, 각각의 특징이 더 뚜렷하게 보여요.`)
      );
      break;
    case 'simplify':
      return { children: [], suggestedTitle: t, suggestedDescription: `${t}을(를) 아주 짧고 쉬운 말로 바꾸어 설명해 볼게요. 핵심만 짚어 보면 어린이도 금방 이해할 수 있어요.` };
    case 'detail':
      return { children: [], suggestedTitle: t, suggestedDescription: `${t}에 대해 조금 더 자세히 이야기해 볼게요. 왜 그런지 이유와, 그 과정이 어떻게 진행되는지를 차근차근 살펴보면 훨씬 깊이 알 수 있어요.` };
    case 'example':
      return { children: [], suggestedTitle: t, suggestedDescription: `예를 들어 보면, ${t}은(는) 우리 일상에서 이렇게 나타나요. 직접 겪은 경험을 떠올려 보면 더 쉽게 이해할 수 있어요.` };
    case 'daily':
      return { children: [], suggestedTitle: t, suggestedDescription: `우리 생활 속에서 ${t}은(는) 이런 모습으로 자주 나타나요. 주변을 둘러보며 직접 찾아보면 학습이 더 재미있어져요.` };
    case 'question':
      children.push(pl(`${t}에 대해 더 생각해 볼 질문`, 'question', `${t}과(와) 관련해서 “왜 그럴까?” “다르게 되면 어떻게 될까?” 같은 질문을 떠올려 봅시다.`));
      break;
  }
  return { children };
}
