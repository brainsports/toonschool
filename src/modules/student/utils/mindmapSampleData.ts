/**
 * 로컬 검증용 샘플 마인드맵 생성기.
 *
 * 목적: 운영 Edge Function(generate-mindmap)이 아직 배포되지 않은 상태에서도
 * 편집기 UI · 응답 처리 · 노드 변환 흐름을 로컬 브라우저에서 검증하기 위한
 * "안전한 로컬 폴백" 데이터를 만든다.
 *
 * 주의: 이 파일은 실제 AI 호출을 대체하지 않는다. 운영 배포 후에는
 * supabase.functions.invoke('generate-mindmap') 호출이 정상 동작해야 하며,
 * 이 샘플은 EF 가 도달 불가일 때만 사용된다(mindmapService 가 이 사실을 콘솔/플래그로 명시).
 */
import type {
  AiBranch,
  AiFullMindmapResponse,
  AiLeaf,
  AiPartialMindmapResponse,
  AiPartialRequest,
} from '../types/mindmapAi';

/** 주제 키워드에서 과목/단원 맥락에 맞는 풍성한 예시 가지를 만든다. */
export function buildSampleMindmap(params: {
  centralTopic: string;
  subject?: string;
  unitTitle?: string;
}): AiFullMindmapResponse {
  const topic = params.centralTopic?.trim() || (params.unitTitle?.trim() || '탐구 주제');
  const subject = params.subject ?? '';

  // 과목 계열별로 다양한 요소(핵심/과정/원인결과/특징/예시/생활연결/질문)를 담은 가지 제공.
  const banks: Record<string, AiBranch[]> = {
    과학: [
      { title: '무엇인가요?', icon: 'idea', children: [
        { title: `${topic}의 뜻`, description: `${topic}이(가) 무엇인지 알아요.`, icon: 'search' },
        { title: '생김새와 특징', description: '어떤 모습이고 무엇이 특별한지 알아요.', icon: 'leaf' },
      ]},
      { title: '어떻게 될까요?', icon: 'clock', children: [
        { title: '변하는 과정', description: '차례대로 어떻게 변하는지 살펴봐요.', icon: 'sprout' },
        { title: '결과 알아보기', description: '결국 어떻게 되는지 알아요.', icon: 'fruit' },
      ]},
      { title: '왜 그럴까요?', icon: 'question', children: [
        { title: '원인 생각하기', description: '왜 그런 일이 일어나는지 추측해요.', icon: 'lightbulb' },
        { title: '조건 알아보기', description: '무엇이 필요한지 알아요.', icon: 'sun' },
      ]},
      { title: '직접 해봐요', icon: 'pencil', children: [
        { title: '관찰하기', description: '직접 보고 변화를 기록해요.', icon: 'search' },
        { title: '생활 속 예시', description: '주변에서 쉽게 찾아봐요.', icon: 'home' },
      ]},
      { title: '더 궁금해요', icon: 'question', children: [
        { title: '탐구 질문', description: '더 알고 싶은 점을 적어요.', icon: 'question' },
      ]},
    ],
    사회: [
      { title: '어디에 있나요?', icon: 'map', children: [
        { title: '위치 알아보기', description: '어느 곳에 있는지 찾아요.', icon: 'globe' },
        { title: '주변 환경', description: '자연과 사람의 모습을 알아요.', icon: 'cloud' },
      ]},
      { title: '사람들의 생활', icon: 'home', children: [
        { title: '주로 하는 일', description: '사람들이 무엇을 하며 살아요.', icon: 'friends' },
        { title: '함께 사는 모습', description: '이웃과 어떻게 지내는지 알아요.', icon: 'heart' },
      ]},
      { title: '왜 그렇게 살까요?', icon: 'question', children: [
        { title: '환경과 생활', description: '자연이 생활에 미치는 영향을 알아요.', icon: 'weather' },
      ]},
      { title: '오늘날의 모습', icon: 'clock', children: [
        { title: '변한 점', description: '과거와 다른 점을 찾아요.', icon: 'gear' },
        { title: '생활 속 연결', description: '우리 생활과 연결해요.', icon: 'home' },
      ]},
    ],
  };

  const fallback: AiBranch[] = [
    { title: '알게 된 점', icon: 'idea', children: [
      { title: `${topic}의 핵심`, description: '가장 중요한 점을 적어요.', icon: 'star' },
      { title: '특징 살피기', description: '무엇이 특별한지 알아요.', icon: 'search' },
    ]},
    { title: '차례대로 보기', icon: 'clock', children: [
      { title: '처음에는', description: '시작을 살펴요.', icon: 'seed' },
      { title: '다음에는', description: '이어지는 과정이에요.', icon: 'sprout' },
      { title: '마지막에는', description: '결과를 알아요.', icon: 'fruit' },
    ]},
    { title: '왜 그럴까요?', icon: 'question', children: [
      { title: '원인 생각하기', description: '이유를 추측해요.', icon: 'lightbulb' },
    ]},
    { title: '생활 속에서', icon: 'home', children: [
      { title: '찾아보기', description: '주변에서 만나요.', icon: 'search' },
      { title: '실천하기', description: '내가 할 수 있는 일이에요.', icon: 'heart' },
    ]},
    { title: '더 궁금해요', icon: 'question', children: [
      { title: '탐구 질문', description: '더 알고 싶은 점이에요.', icon: 'question' },
    ]},
  ];

  const branches = banks[subject] ?? fallback;
  return { centralTopic: topic, branches: branches.slice(0, 5) };
}

/** 부분 생성 로컬 폴백. 선택 노드에 어울리는 자식/제안을 만든다. */
export function buildSamplePartial(req: AiPartialRequest): AiPartialMindmapResponse {
  const t = req.nodeTitle?.trim() || '이 내용';
  const children: AiLeaf[] = [];
  switch (req.action) {
    case 'add_children':
      children.push(
        { title: `${t}의 특징`, description: '어떤 특징이 있는지 알아요.', icon: 'star' },
        { title: `${t}의 예시`, description: '쉬운 예를 들어요.', icon: 'lightbulb' },
        { title: `${t}와 관련된 것`, description: '비슷하거나 다른 것을 찾아요.', icon: 'search' }
      );
      break;
    case 'simplify':
      return { children: [], suggestedTitle: t, suggestedDescription: `${t}을(를) 아주 짧고 쉽게 정리하면 이래요.` };
    case 'detail':
      return { children: [], suggestedTitle: t, suggestedDescription: `${t}에 대해 조금 더 자세히 설명해 볼게요. 왜 그런지 이유와 과정을 차근차근 살펴요.` };
    case 'example':
      return { children: [], suggestedTitle: t, suggestedDescription: `예를 들어 보면, ${t}을(를) 일상에서 이렇게 볼 수 있어요.` };
    case 'daily':
      return { children: [], suggestedTitle: t, suggestedDescription: `우리 생활에서 ${t}은(는) 이렇게 나타나요. 직접 찾아보면 재미있어요.` };
    case 'question':
      children.push({ title: `${t}에 대해 더 생각해 볼 질문`, description: '왜 그럴까? 어떻게 다를까?', icon: 'question' });
      break;
  }
  return { children };
}
