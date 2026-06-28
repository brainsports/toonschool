import { supabase } from '../../../shared/lib/supabase'
import { geminiClient } from '../../../shared/lib/gemini'
import { TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL } from '../../../config/models'

export interface ScriptDialogue {
  speaker: string;
  text: string;
}

export interface ScriptCut {
  cutNumber: 1 | 2 | 3 | 4 | 5 | 6;
  role: string;
  scene: string;
  characters: string[];
  dialogues: ScriptDialogue[];
  learningPoint: string;
}

export interface CoverKeyConcept {
  id: string;
  title: string;
  description: string;
}

export interface CoverDialogue {
  hana: string;
  doyoon: string;
  seoa: string;
}

export interface GeneratedComicScript {
  title: string;
  learningTopicId: string;
  learningGoal: string;
  keyConcepts?: CoverKeyConcept[];
  coverDialogue?: CoverDialogue;
  generationStatus?: {
    script: 'idle' | 'loading' | 'success' | 'error';
    coverContent: 'idle' | 'loading' | 'success' | 'error';
  };
  cuts: ScriptCut[];
}

export interface ScriptGenerationRequest {
  gradeName: string;
  subjectName: string;
  majorUnitName: string;
  middleUnitName: string;
  middleUnitId: string; // 중단원 ID (fallback용)
  learningTopicId: string; // 실제로는 TopicRecommendation.id가 들어옴
  storyTitle: string;
  storySummary: string;
  keywords: string[];
  setting: string;
  incident: string;
  problem: string;
  resolutionDirection: string;
  learningConnection: string;
  onStatusUpdate?: (msg: string) => void;
}

export const generateScript = async (
  request: ScriptGenerationRequest
): Promise<GeneratedComicScript> => {
  let learningObjective = '해당 단원의 핵심 개념을 이해하고 설명할 수 있다.';
  let coreConcept = '주어진 이야기와 키워드를 활용해 상황을 해결하는 과정';
  let misconception = '단순히 정답만 외우지 않고 원리를 이해해야 함';

  try {
    const { data, error } = await supabase
      .from('curriculum_subunits')
      .select('learning_goal, content_scope, key_questions')
      .eq('id', request.middleUnitId)
      .single();

    if (!error && data) {
      if (data.learning_goal) learningObjective = data.learning_goal;
      if (data.content_scope) coreConcept = data.content_scope;
      if (data.key_questions) misconception = data.key_questions;
    }
  } catch (err) {
    console.error('Failed to fetch from curriculum_subunits', err);
  }

  const prompt = `
너는 초등학생을 위한 6컷 학습만화 대본 작가야.
아래의 정보를 바탕으로 정해진 6컷 전개 방식에 맞춰 대본을 작성해 줘.

[학습 정보]
학년: ${request.gradeName}
과목: ${request.subjectName}
단원: ${request.majorUnitName} > ${request.middleUnitName}
학습목표: ${learningObjective}
핵심 개념: ${coreConcept}
주의사항(오개념): ${misconception}

[이야기 정보]
이야기 제목: ${request.storyTitle}
이야기 요약: ${request.storySummary}
핵심 키워드: ${request.keywords.join(', ')}
이야기 배경: ${request.setting}
주요 사건: ${request.incident}
해결할 문제: ${request.problem}
해결 방향: ${request.resolutionDirection}
학습 연결: ${request.learningConnection}

[등장인물 규칙]
- 기본 등장인물: "하나 선생님", "도윤", "서아" (이름을 절대 임의로 바꾸지 마세요. hana, doyoon 같은 영문 ID도 사용 금지)
- 하나 선생님: 핵심 개념을 알려주거나 정리하는 역할 (최소 2개 컷 등장)
- 도윤: 질문, 발견, 계산, 적용에 참여하는 활발한 학생
- 서아: 질문, 발견, 계산, 적용에 참여하는 차분한 학생
- 보조 인물: 이야기 배경(예: 길동, 보부상 등)에 필요한 인물이 있다면 '보조 인물'로만 추가하며, 기본 등장인물 3명을 대체할 수 없음.
- 컷당 등장인물: 한 컷에 1~2명만 등장하여 화면이 복잡해지지 않도록 함.

[고정된 6컷 전개 방식 (반드시 이 역할과 순서를 지켜라)]
1컷 (이야기 시작): 선택한 배경과 인물, 해결할 문제가 등장
2컷 (궁금증 발견): 학습 개념이 필요한 구체적인 상황 발생
3컷 (개념 이해): 하나 선생님이 핵심 원리를 쉽고 정확하게 설명
4컷 (직접 해결): 도윤 또는 서아가 이야기 속 문제를 계산하거나 해결 (교과 개념과 계산 결과는 반드시 정확해야 함)
5컷 (확인과 바로잡기): 실수나 오해를 확인하고 올바르게 수정
6컷 (이야기 완성): 사건을 해결하고 핵심 개념을 짧게 정리
(6컷 전체가 자연스럽게 하나의 이야기로 연결되어야 합니다.)

[대사 및 장면 작성 규칙]
- 한 컷당 대사는 2~3개로 제한합니다.
- 대사 하나당 글자 수는 공백을 포함하여 **절대 20자를 넘지 않도록** 극도로 짧고 간결하게 작성하세요. 초등학생이 실제로 말하는 것처럼 쉬운 표현을 사용해야 합니다.
- 설명이 길어지면 한 대사를 길게 쓰지 말고, 대사를 여러 개로 나누거나 다음 컷으로 넘기세요.
- 장면 설명(scene)은 그림 생성을 위한 구체적인 문장(인물, 장소, 행동, 표정 등)으로 최대 60자 이내로 작성하세요.
- 학습 요점(learningPoint)은 교과 내용 검토를 위한 정보로 최대 40자 이내로 작성하세요.

반환 형식 예시 (정확히 아래 JSON 구조를 지켜야 함. 마크다운 코드블록 등은 제외하고 순수 JSON 객체만 반환할 것):
{
  "title": "${request.storyTitle}",
  "learningGoal": "이번 대본의 학습 목표 (학습 정보 기반으로 작성)",
  "cuts": [
    {
      "cutNumber": 1,
      "role": "이야기 시작",
      "scene": "그림으로 표현할 구체적인 장면",
      "characters": ["등장인물1", "등장인물2"],
      "dialogues": [
        { "speaker": "등장인물 이름", "text": "실제 대사" }
      ],
      "learningPoint": "이 컷의 학습 요점"
    }
    // ... 6컷까지 정확히 작성
  ]
}
`;

  const modelsToTry = [TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL];
  
  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    if (!model) continue;
    
    let attempt = 0;
    const maxRetries = 1;

    while (attempt <= maxRetries) {
      try {
        const responseText = await geminiClient.generateTextWithModel(prompt, model);
        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        if (cleanedText.includes('API Key가 설정되지 않았습니다') || cleanedText.includes('오류가 발생했습니다')) {
          throw new Error(cleanedText);
        }

        const parsedData = JSON.parse(cleanedText) as GeneratedComicScript;
        parsedData.learningTopicId = request.learningTopicId;

        if (!parsedData.cuts || parsedData.cuts.length !== 6) {
          throw new Error('6컷이 아닙니다.');
        }

        let hanaCount = 0;

        parsedData.cuts.forEach((cut, index) => {
          if (cut.cutNumber !== index + 1) throw new Error('컷 번호가 올바르지 않습니다.');
          if (!cut.scene) throw new Error('장면 설명이 없습니다.');
          if (!cut.characters || cut.characters.length === 0) throw new Error('등장인물이 없습니다.');
          if (!cut.dialogues || cut.dialogues.length === 0) throw new Error('대사가 없습니다.');
          
          cut.characters = cut.characters.map(char => {
            if (char.toLowerCase() === 'hana' || char.includes('하나')) return '하나 선생님';
            if (char.toLowerCase() === 'doyoon' || char.includes('도윤')) return '도윤';
            if (char.toLowerCase() === 'seoa' || char.includes('서아')) return '서아';
            return char;
          });

          cut.dialogues.forEach(dialogue => {
            if (dialogue.speaker.toLowerCase() === 'hana' || dialogue.speaker.includes('하나')) dialogue.speaker = '하나 선생님';
            if (dialogue.speaker.toLowerCase() === 'doyoon' || dialogue.speaker.includes('도윤')) dialogue.speaker = '도윤';
            if (dialogue.speaker.toLowerCase() === 'seoa' || dialogue.speaker.includes('서아')) dialogue.speaker = '서아';
            
            if (Array.from(dialogue.text).length > 20) {
              dialogue.text = Array.from(dialogue.text).slice(0, 20).join('');
            }
          });

          if (cut.characters.includes('하나 선생님')) {
            hanaCount++;
          }
        });

        if (hanaCount < 2) {
          throw new Error('하나 선생님이 최소 2개 컷에 등장해야 합니다.');
        }

        return parsedData;

      } catch (error: any) {
        attempt++;
        const status = error.httpStatus;
        
        console.warn(`대본 생성 실패 (모델: ${model}, 시도 ${attempt}/${maxRetries + 1}):`, error);

        if (status === 404) {
          break; // 즉시 다음 모델로
        }

        if (status === 503) {
          if (attempt <= maxRetries) {
            if (request.onStatusUpdate) {
              request.onStatusUpdate('서버가 바쁩니다. 2초 후 다시 시도합니다...');
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          } else {
            break;
          }
        }
        
        break; // 다른 오류도 다음 모델로
      }
    }
    
    if (i < modelsToTry.length - 1 && request.onStatusUpdate) {
      request.onStatusUpdate('AI 서버가 바빠 예비 모델로 다시 시도 중입니다...');
    }
  }

  if (request.onStatusUpdate) {
    request.onStatusUpdate('잠시 후 다시 시도해 주세요. 기본 대본으로 대체합니다.');
  }
  console.warn('모든 모델이 실패하여 로컬 기본 대본으로 대체합니다.');
  return getFallbackScript(request, learningObjective);
};

export const generateCoverContent = async (
  script: GeneratedComicScript,
  request: ScriptGenerationRequest
): Promise<{ keyConcepts: CoverKeyConcept[], coverDialogue: CoverDialogue }> => {
  const prompt = `중단원 학습 목표와 완성된 6컷 대본을 바탕으로 앞표지에 사용할 핵심 개념 3가지와 표지 대화 3개를 작성한다.

[학습 정보]
- 학년/과목: ${request.gradeName} ${request.subjectName}
- 단원: ${request.majorUnitName} > ${request.middleUnitName}
- 중단원 학습 목표: ${script.learningGoal}

[대본 정보]
- 주제: ${request.storyTitle}
- 컷별 학습 요점:
${script.cuts.map(c => `  ${c.cutNumber}컷: ${c.learningPoint}`).join('\n')}

[핵심 개념 추출 규칙]
핵심 개념은 이야기 줄거리가 아니라 교과에서 꼭 알아야 할 지식이어야 한다.
핵심 개념은 정확히 3개다.
1. 핵심 개념 또는 용어
2. 원리 또는 방법
3. 적용 또는 문제 해결

각 핵심 개념 제목은 10자 이내다.
각 설명은 30자 이내의 한 문장이다.

[표지 대화 작성 규칙]
표지 대화는 하나 선생님, 도윤, 서아에게 한 문장씩 작성한다.

하나 선생님은 학습 주제에 관한 호기심 질문을 한다.
도윤은 핵심 개념이나 원리를 설명한다.
서아는 적용 방법이나 자신의 생각을 말한다.

세 문장은 질문과 답으로 자연스럽게 이어져야 한다.
각 문장은 28자 이내다.
대본의 사건만 요약하지 않는다.
막연한 감탄이나 홍보 문구를 작성하지 않는다.

JSON 이외의 설명은 출력하지 않는다. 반드시 아래 JSON 구조만 반환한다:
{
  "keyConcepts": [
    { "title": "개념 제목", "description": "설명" },
    { "title": "원리 제목", "description": "설명" },
    { "title": "적용 제목", "description": "설명" }
  ],
  "coverDialogue": {
    "hana": "질문",
    "doyoon": "개념이나 원리 답",
    "seoa": "적용이나 생각 답"
  }
}
`;

  const responseText = await geminiClient.generateText(prompt);
  const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const parsedData = JSON.parse(cleanedText);

  if (!parsedData.keyConcepts || parsedData.keyConcepts.length !== 3) {
    throw new Error('핵심 개념 3개가 생성되지 않았습니다.');
  }

  if (!parsedData.coverDialogue || !parsedData.coverDialogue.hana || !parsedData.coverDialogue.doyoon || !parsedData.coverDialogue.seoa) {
    throw new Error('표지 대화 3개가 생성되지 않았습니다.');
  }

  return {
    keyConcepts: parsedData.keyConcepts.map((c: any, i: number) => ({
      id: `concept-${i + 1}`,
      title: Array.from(c.title).slice(0, 10).join(''),
      description: Array.from(c.description).slice(0, 30).join('')
    })),
    coverDialogue: {
      hana: Array.from(parsedData.coverDialogue.hana).slice(0, 28).join(''),
      doyoon: Array.from(parsedData.coverDialogue.doyoon).slice(0, 28).join(''),
      seoa: Array.from(parsedData.coverDialogue.seoa).slice(0, 28).join('')
    }
  };
};

export const getFallbackScript = (request: ScriptGenerationRequest, learningObjective: string): GeneratedComicScript => {
  return {
    title: request.storyTitle,
    learningTopicId: request.learningTopicId,
    learningGoal: learningObjective,
    keyConcepts: [
      { id: 'concept-1', title: '무엇인지', description: `${request.middleUnitName}의 뜻과 의미를 이해해요.` },
      { id: 'concept-2', title: '어떤 원리인지', description: `개념에 숨어있는 핵심 원리를 알 수 있어요.` },
      { id: 'concept-3', title: '어디에 적용하는지', description: `배운 원리를 실제 문제 해결에 활용해요.` }
    ],
    coverDialogue: {
      hana: `${request.middleUnitName}은 무엇일까요?`,
      doyoon: `핵심 원리를 적용하면 쉽게 이해할 수 있어요!`,
      seoa: `우리 생활 속에서도 찾아볼 수 있어요!`
    },
    generationStatus: {
      script: 'success',
      coverContent: 'success'
    },
    cuts: [
      {
        cutNumber: 1,
        role: '이야기 시작',
        scene: '교실에서 도윤과 서아가 책을 보며 의문을 가집니다.',
        characters: ['도윤', '서아'],
        dialogues: [
          { speaker: '도윤', text: '이 단원의 개념은 어떻게 이해해야 할까?' },
          { speaker: '서아', text: '맞아, 일상생활에서도 어떻게 쓰이는지 궁금해.' }
        ],
        learningPoint: '새로운 개념에 대한 호기심'
      },
      {
        cutNumber: 2,
        role: '궁금증 발견',
        scene: '서아가 자신의 예상을 조심스럽게 말합니다.',
        characters: ['도윤', '서아'],
        dialogues: [
          { speaker: '서아', text: '어쩌면 이전에 배운 원리와 비슷하지 않을까?' }
        ],
        learningPoint: '이전 학습과의 연관성 추론'
      },
      {
        cutNumber: 3,
        role: '개념 이해',
        scene: '하나 선생님이 다가와 핵심 개념을 친절하게 설명해주십니다.',
        characters: ['하나 선생님', '도윤'],
        dialogues: [
          { speaker: '하나 선생님', text: '그럴 때는 이렇게 원리를 적용해보면 쉽게 이해할 수 있단다.' },
          { speaker: '도윤', text: '아하! 그런 방법이 있었군요!' }
        ],
        learningPoint: '주요 핵심 개념 이해'
      },
      {
        cutNumber: 4,
        role: '직접 해결',
        scene: '도윤과 서아가 실생활 사례를 상상하며 적용해봅니다.',
        characters: ['도윤', '서아'],
        dialogues: [
          { speaker: '도윤', text: '그럼 이 원리를 우리 생활 속 문제에도 적용할 수 있겠네!' },
          { speaker: '서아', text: '맞아! 이렇게 해결하면 되겠어.' }
        ],
        learningPoint: '실생활 사례 적용'
      },
      {
        cutNumber: 5,
        role: '확인과 바로잡기',
        scene: '선생님이 아이들이 놓치기 쉬운 부분을 다시 한번 짚어주십니다.',
        characters: ['하나 선생님', '서아'],
        dialogues: [
          { speaker: '서아', text: '그럼 모든 경우에 다 이렇게 하면 되나요?' },
          { speaker: '하나 선생님', text: '좋은 질문이야. 하지만 이 경우에는 다른 원리가 적용되니 주의해야 해.' }
        ],
        learningPoint: '오개념 바로잡기 및 주의사항'
      },
      {
        cutNumber: 6,
        role: '이야기 완성',
        scene: '도윤과 서아가 배운 내용을 깔끔하게 정리합니다.',
        characters: ['도윤', '서아'],
        dialogues: [
          { speaker: '서아', text: '오늘 배운 핵심 원리는 정말 유용해.' },
          { speaker: '도윤', text: '다음에도 이 원리를 활용해서 문제를 해결해보자!' }
        ],
        learningPoint: '최종 학습 내용 요약'
      }
    ]
  };
};
