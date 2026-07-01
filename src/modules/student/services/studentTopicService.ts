import { TEXT_GENERATION_MODEL, TEXT_FALLBACK_MODEL } from '../../../config/models'
import { geminiClient } from '../../../shared/lib/gemini'
import { supabase } from '../../../shared/lib/supabase'
import type { TopicRecommendation, TopicGenerationRequest, KeywordItem, CurriculumContext } from '../types/studentTopic'

function normalizeText(text: string) {
  return text.replace(/[\s\d.,!?]/g, '').toLowerCase()
}

function filterAndCleanKeyword(word: string): string | null {
  if (!word) return null;
  
  let cleaned = word.trim();
  if (cleaned.length <= 1) return null;

  // 특정 어간 변환 (초등학생이 이해하기 쉬운 명사로)
  if (cleaned.endsWith('알아보')) cleaned = cleaned.replace(/알아보$/, '이해');
  if (cleaned.endsWith('바탕으')) cleaned = cleaned.replace(/바탕으$/, '바탕');

  const bannedContains = ['설명할', '알다', '있다', '없다', '말하다', '비교하다', '할수', '대해', '대하여', '알수', '알아보기', '살펴보기', '배우기', '이해하기'];
  for (const ban of bannedContains) {
    if (cleaned.includes(ban)) return null;
  }
  
  if (/[다요까죠](?:\s|$)/.test(cleaned)) return null;

  const suffixList = [
    '하며', '하고', '하는', '되며', '되고', '하다', '하', 
    '으로', '에서', '에게', '보다', '처럼', '위해', '대한',
    '을', '를', '이', '가', '은', '는', '와', '과', '의', '에', '로', '부터', '까지', '과함께', '와함께'
  ];
  
  let stripped = false;
  do {
    stripped = false;
    if (!cleaned.includes(' ')) {
      for (const suffix of suffixList) {
        if (cleaned.endsWith(suffix) && cleaned.length - suffix.length >= 2) {
          cleaned = cleaned.slice(0, -suffix.length);
          stripped = true;
          break;
        }
      }
    } else {
      const parts = cleaned.split(' ');
      const lastPart = parts[parts.length - 1];
      for (const suffix of suffixList) {
        if (lastPart.endsWith(suffix) && lastPart.length - suffix.length >= 2) {
          parts[parts.length - 1] = lastPart.slice(0, -suffix.length);
          cleaned = parts.join(' ');
          stripped = true;
          break;
        }
      }
    }
  } while (stripped);

  const bannedExactWords = ['위치', '특징', '설명', '내용', '학습', '단원', '주제', '수업', '우리', '학생', '평가', '이해', '목표', '성취', '기준', '지도', '마을', '역사', '문화', '여행', '시장', '사람들', '변화', '탐험', '방법', '이유', '까닭', '모습', '의미', '종류', '과정'];
  
  if (bannedExactWords.includes(cleaned)) return null;
  if (cleaned.length <= 1) return null;

  return cleaned;
}

function deduplicate(recs: TopicRecommendation[], existing: TopicRecommendation[], bannedTitles: string[]): TopicRecommendation[] {
  const allTitles = [...existing.map(e => e.title), ...bannedTitles]
  const allIncidents = [...existing.map(e => e.incident)]
  const uniqueNew: TopicRecommendation[] = []

  for (const rec of recs) {
    if (!rec.title || !rec.summary || !rec.incident) continue

    const normTitle = normalizeText(rec.title)
    const normIncident = normalizeText(rec.incident)

    // 금지어 검사
    if (normTitle.includes('탐험대') || normTitle.includes('비밀을찾아') || normTitle.includes('흥미진진한모험')) {
      continue
    }

    // 중복 검사
    const isDuplicate = allTitles.some(t => normalizeText(t) === normTitle) || 
                        allIncidents.some(i => normalizeText(i) === normIncident)

    if (!isDuplicate) {
      uniqueNew.push(rec)
      allTitles.push(rec.title)
      allIncidents.push(rec.incident)
    }
  }

  return uniqueNew
}

const buildPrompt = (request: TopicGenerationRequest, existing: TopicRecommendation[], count: number, extraData: CurriculumContext) => {
  const { gradeName, subjectName, majorUnitName, middleUnitName, extraRequest, selectedKeywords, previousTitles } = request
  const { learningGoal, keyQuestions, contentScope, achievementStandards, unitSummary, unitGoal, subunitSummary } = extraData

  const allBannedTitles = [
    ...(previousTitles || []),
    ...existing.map(r => r.title)
  ]

  return `당신은 초등학생용 교과 학습만화 기획자입니다.

제공된 학습목표와 핵심 내용을 정확히 반영하여 서로 완전히 다른 만화 주제 ${count}개를 만드세요.

각 주제는 제목, 장소, 사건, 문제, 해결 방향이 달라야 합니다.
같은 기본 이야기를 복사해 장르나 번호만 바꾸지 마세요.
모든 주제는 실제 6컷 만화로 전개할 수 있어야 합니다.

‘탐험대’, ‘비밀을 찾아 떠나는’, ‘흥미진진한 모험 이야기’라는 표현을 사용하지 마세요.

제목은 구체적이고 자연스러운 한 편의 만화 제목으로 작성하세요.
설명에는 주인공이 어디에서 어떤 문제를 만나며 학습 개념을 어떻게 활용하는지가 드러나야 합니다.

${allBannedTitles.length > 0 ? `이전에 생성된 아래 제목이나 사건과 유사한 내용은 제외하고 새로운 내용을 만드세요.\n제외할 제목: ${allBannedTitles.join(', ')}\n` : ''}

[단원 정보]
학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원(학습 주제): ${middleUnitName}
${unitGoal ? `대단원 목표: ${unitGoal}` : ''}
${learningGoal ? `학습목표: ${learningGoal}` : ''}
${keyQuestions ? `핵심 질문: ${keyQuestions}` : ''}
${achievementStandards ? `성취기준: ${achievementStandards}` : ''}
${unitSummary ? `대단원 요약: ${unitSummary}` : ''}
${subunitSummary ? `중단원 요약: ${subunitSummary}` : ''}
${contentScope ? `내용 체계: ${contentScope}` : ''}
${selectedKeywords?.length ? `선택한 키워드: ${selectedKeywords.join(', ')}` : ''}
${extraRequest ? `추가 요청: ${extraRequest}` : ''}

[조건]
1. 한글 기준 8~22자 제목
2. 설명은 1~2문장 (45~90자)
3. 10가지 다양한 이야기 유형(everyday_problem 등)을 골고루 배정

응답은 지정된 JSON 형식으로만 반환하세요.
{
  "recommendations": [
    {
      "title": "제목 (예: 만 원권 열 장은 얼마일까?)",
      "summary": "구체적인 사건과 문제가 포함된 설명",
      "storyType": "everyday_problem",
      "storyTypeLabel": "생활 속 문제",
      "setting": "장소",
      "incident": "발생한 사건",
      "problem": "해결할 문제",
      "resolutionDirection": "해결 방향",
      "learningConnection": "학습 개념의 사용 방법",
      "keywords": ["키워드1", "키워드2"],
      "tone": "전체적인 톤",
      "difficulty": "보통"
    }
  ]
}
`
}

export const fetchCurriculumContext = async (
  majorUnitId?: string | null,
  middleUnitId?: string | null
): Promise<CurriculumContext> => {
  const context: CurriculumContext = {}

  if (majorUnitId) {
    try {
      const { data } = await supabase
        .from('curriculum_units')
        .select('unit_summary, unit_goal')
        .eq('id', majorUnitId)
        .single()
      if (data) {
        context.unitSummary = data.unit_summary || ''
        context.unitGoal = data.unit_goal || ''
      }
    } catch (e) {
      console.error('Failed to fetch unit info:', e)
    }
  }

  if (middleUnitId) {
    try {
      const { data } = await supabase
        .from('curriculum_subunits')
        .select(`
          subunit_summary,
          learning_goal,
          key_questions,
          content_scope,
          subunit_achievement_standards(
            achievement_standards(
              standard_text,
              student_friendly_text
            )
          )
        `)
        .eq('id', middleUnitId)
        .single()
        
      if (data) {
        context.subunitSummary = data.subunit_summary || ''
        context.learningGoal = data.learning_goal || ''
        
        if (typeof data.key_questions === 'string') context.keyQuestions = data.key_questions
        else if (data.key_questions) context.keyQuestions = JSON.stringify(data.key_questions)
        
        if (typeof data.content_scope === 'string') context.contentScope = data.content_scope
        else if (data.content_scope) context.contentScope = JSON.stringify(data.content_scope)
        
        const standards: string[] = []
        if (Array.isArray(data.subunit_achievement_standards)) {
          data.subunit_achievement_standards.forEach((sas: any) => {
            const std = sas.achievement_standards
            if (std) {
              if (std.student_friendly_text) standards.push(std.student_friendly_text)
              else if (std.standard_text) standards.push(std.standard_text)
            }
          })
        }
        context.achievementStandards = standards.join('\\n')
      }
    } catch (e) {
      console.error('Failed to fetch subunit info:', e)
    }
  }

  return context
}

function attachJosa(word: string, type: '은는' | '이가' | '을를' | '과와'): string {
  if (!word) return '';
  const lastChar = word.charCodeAt(word.length - 1);
  if (lastChar < 0xac00 || lastChar > 0xd7a3) {
    // 한글이 아닌 경우 기본값 반환
    return word + (type === '은는' ? '은' : type === '이가' ? '이' : type === '을를' ? '을' : '과');
  }
  const hasJongseong = (lastChar - 0xac00) % 28 > 0;
  switch (type) {
    case '은는': return word + (hasJongseong ? '은' : '는');
    case '이가': return word + (hasJongseong ? '이' : '가');
    case '을를': return word + (hasJongseong ? '을' : '를');
    case '과와': return word + (hasJongseong ? '과' : '와');
  }
}

const FALLBACK_THEMES = [
  {
    type: 'everyday_problem',
    label: '생활 속 문제',
    getTitle: (k: string) => [
      `급식 시간에 시작된 ${k} 소동`,
      `우리 반 ${k} 대소동`,
      `동생 때문에 알게 된 ${k}`
    ],
    getSummary: (concept: string) => `하나, 도윤, 서아가 학교나 집에서 겪은 작은 사건을 통해 ${attachJosa(concept, '을를')} 자연스럽게 이해하는 이야기`,
    setting: '학교, 집',
    incident: `평범한 일상 속에서 문제가 발생함`,
    problem: `친구들 또는 가족과 의견이 부딪힘`,
    resolutionDirection: `서로 대화하며 오해를 풀고 해결책을 찾음`,
    tone: '유쾌한, 공감되는',
  },
  {
    type: 'mystery',
    label: '미스터리',
    getTitle: (k: string) => [
      `밤마다 움직이는 ${k}의 비밀`,
      `학교 괴담 속 ${k}`,
      `사라진 ${attachJosa(k, '을를')} 찾아라`
    ],
    getSummary: (concept: string) => `친구들이 학교에 퍼진 수상한 소문을 따라가며 ${concept}의 단서를 찾는 이야기`,
    setting: '방과 후 학교, 어두운 복도',
    incident: `학교에 이상한 소문이 퍼짐`,
    problem: `정체를 알 수 없는 미스터리한 일을 겪음`,
    resolutionDirection: `용기를 내어 진실을 파헤침`,
    tone: '흥미진진한, 조금 오싹한',
  },
  {
    type: 'challenge',
    label: '게임/메타버스',
    getTitle: (k: string) => [
      `${k} 퀘스트에 접속하라`,
      `게임 속 ${k} 미션`,
      `메타버스에서 만난 ${k}`
    ],
    getSummary: (concept: string) => `하나, 도윤, 서아가 게임 속 미션을 해결하며 ${attachJosa(concept, '을를')} 단계별로 익히는 이야기`,
    setting: '가상현실 게임 속',
    incident: `새로운 게임 퀘스트가 시작됨`,
    problem: `어려운 미션을 통과해야만 로그아웃할 수 있음`,
    resolutionDirection: `팀워크를 발휘해 미션을 클리어함`,
    tone: '액션, 긴장감 있는',
  },
  {
    type: 'adventure',
    label: '마법/판타지',
    getTitle: (k: string) => [
      `마법 지도에 나타난 ${k}`,
      `${k} 주문을 완성하라`,
      `마법 학교의 ${k} 수업`
    ],
    getSummary: (concept: string) => `친구들이 마법 도구를 사용해 ${concept}의 원리를 발견하는 이야기`,
    setting: '마법 학교',
    incident: `마법 도구가 오작동을 일으킴`,
    problem: `마법의 부작용으로 곤란한 상황에 빠짐`,
    resolutionDirection: `올바른 주문과 방법을 알아내어 원래대로 되돌림`,
    tone: '신비로운, 환상적인',
  },
  {
    type: 'animal_pet',
    label: '동물/펫 일상',
    getTitle: (k: string) => [
      `고양이가 발견한 ${k}`,
      `강아지 탐험대와 ${k}`,
      `반려동물 회의의 ${k}`
    ],
    getSummary: (concept: string) => `동물 친구들이 생활 속 장면을 관찰하며 ${attachJosa(concept, '을를')} 재미있게 보여주는 이야기`,
    setting: '동네 놀이터, 동물들의 비밀 기지',
    incident: `주인 몰래 동물들만의 회의가 열림`,
    problem: `동물들의 시선에서 이해할 수 없는 일이 생김`,
    resolutionDirection: `동물들만의 기발한 방법으로 상황을 정리함`,
    tone: '귀여운, 엉뚱한',
  },
  {
    type: 'superpower_hero',
    label: '초능력/히어로',
    getTitle: (k: string) => [
      `${k} 히어로 출동`,
      `초능력으로 지켜낸 ${k}`,
      `${k} 배틀의 승자는?`
    ],
    getSummary: (concept: string) => `친구들이 각자의 능력을 사용해 문제를 해결하며 ${concept}의 특징을 이해하는 이야기`,
    setting: '위기에 처한 도시',
    incident: `도시에 갑자기 문제가 발생함`,
    problem: `자신의 초능력만으로는 해결하기 어려움`,
    resolutionDirection: `서로의 능력을 합쳐 퀴즈 배틀로 위기를 극복함`,
    tone: '활기찬, 역동적인',
  },
  {
    type: 'detective',
    label: '추리/탐정',
    getTitle: (k: string) => [
      `탐정단과 ${k} 사건`,
      `사라진 ${k}의 단서`,
      `교실 속 ${k} 미스터리`
    ],
    getSummary: (concept: string) => `하나, 도윤, 서아가 단서를 모아 ${concept}의 핵심을 추리하는 이야기`,
    setting: '탐정 사무소가 된 교실',
    incident: `중요한 물건이 사라지거나 이상한 일이 벌어짐`,
    problem: `단서가 부족해 범인이나 원인을 찾기 힘듦`,
    resolutionDirection: `작은 흔적들을 모아 날카로운 추리로 진실을 밝혀냄`,
    tone: '진지한, 호기심 넘치는',
  },
  {
    type: 'comedy',
    label: '유머/개그',
    getTitle: (k: string) => [
      `${k} 때문에 난리 난 우리 반`,
      `갑자기 ${attachJosa(k, '이가')} 되어버렸다`,
      `웃다가 알게 된 ${k}`
    ],
    getSummary: (concept: string) => `친구들이 엉뚱한 실수와 웃긴 상황을 겪으며 ${attachJosa(concept, '을를')} 자연스럽게 배우는 이야기`,
    setting: '왁자지껄한 교실',
    incident: `말도 안 되는 황당한 실수를 저지름`,
    problem: `상황이 갈수록 꼬이고 커져만 감`,
    resolutionDirection: `우연하고 웃긴 계기로 문제가 단숨에 풀림`,
    tone: '폭소 유발, 과장된',
  },
  {
    type: 'idol',
    label: '아이돌/성장',
    getTitle: (k: string) => [
      `${k} 오디션 대작전`,
      `무대 위에서 빛난 ${k}`,
      `비밀 아이돌의 ${k} 미션`
    ],
    getSummary: (concept: string) => `친구들이 무대나 방송 준비 과정에서 ${attachJosa(concept, '을를')} 활용해 문제를 해결하는 이야기`,
    setting: '오디션 대기실, 방송국 무대',
    incident: `무대에 오르기 직전 예상치 못한 사고가 남`,
    problem: `준비한 것을 제대로 보여주기 힘든 상황`,
    resolutionDirection: `순발력과 연습한 실력을 발휘해 위기를 넘김`,
    tone: '감동적인, 응원하게 되는',
  },
  {
    type: 'survival',
    label: '서바이벌/모험',
    getTitle: (k: string) => [
      `무인도에서 만난 ${k}`,
      `${attachJosa(k, '은는')} 없이는 살아남을 수 없어`,
      `이세계 생존 미션: ${k}`
    ],
    getSummary: (concept: string) => `친구들이 낯선 환경에서 살아남기 위해 ${attachJosa(concept, '을를')} 활용하는 이야기`,
    setting: '무인도, 낯선 이세계',
    incident: `갑자기 낯선 환경에 갇혀버림`,
    problem: `가지고 있는 물건이 부족하고 위험이 다가옴`,
    resolutionDirection: `주변 환경의 특징을 관찰해 생존 도구를 만들어냄`,
    tone: '긴장감 있는, 생존형',
  }
];

function isTitleSimilar(title1: string, title2: string): boolean {
  const norm1 = normalizeText(title1);
  const norm2 = normalizeText(title2);
  if (norm1 === norm2) return true;
  // 70% 유사도 검사 (단순 길이 대비 공통 문자율)
  let commonCount = 0;
  for (let i = 0; i < norm1.length; i++) {
    if (norm2.includes(norm1[i])) commonCount++;
  }
  const ratio = commonCount / Math.max(norm1.length, norm2.length);
  return ratio > 0.7;
}

const getFallbackTopicRecommendations = (
  request: TopicGenerationRequest,
  extraData: CurriculumContext,
  countToGenerate: number,
  existingTitles: string[]
): TopicRecommendation[] => {
  const { selectedKeywords = [], middleUnitName = '' } = request;
  
  // 교과개념: 중단원명 우선, 없으면 키워드
  const concept = extraData.subunitSummary || extraData.learningGoal || middleUnitName || selectedKeywords[0] || '학습 내용';
  
  const recommendations: TopicRecommendation[] = [];
  const usedTypes = new Set<string>(request.previousTypes || []);
  const usedTitles = new Set<string>(existingTitles.map(normalizeText));
  
  let keywordIndex = 0;
  
  // 랜덤 대신 순차적이되, 시작 지점을 기존 개수 등에 맞춰서 다양하게
  let startIndex = (request.previousTitles?.length || 0) % FALLBACK_THEMES.length;
  
  for (let i = 0; i < countToGenerate; i++) {
    let found = false;
    for (let attempts = 0; attempts < FALLBACK_THEMES.length; attempts++) {
      const themeIndex = (startIndex + attempts) % FALLBACK_THEMES.length;
      const theme = FALLBACK_THEMES[themeIndex];
      
      // 이미 같은 타입이 나온 경우 (가능한 한 피하기 위해)
      if (usedTypes.has(theme.type) && usedTypes.size < FALLBACK_THEMES.length) continue;
      
      const keyword = selectedKeywords[keywordIndex % Math.max(selectedKeywords.length, 1)] || middleUnitName || '새로운 주제';
      const titleOptions = theme.getTitle(keyword);
      
      let selectedTitle = '';
      for (const t of titleOptions) {
        if (!existingTitles.some(et => isTitleSimilar(et, t)) && !usedTitles.has(normalizeText(t))) {
          selectedTitle = t;
          break;
        }
      }
      
      if (selectedTitle) {
        recommendations.push({
          id: `fallback-${Date.now()}-${i}`,
          title: selectedTitle,
          summary: theme.getSummary(concept),
          storyType: theme.type as any,
          storyTypeLabel: theme.label,
          setting: theme.setting,
          incident: theme.incident,
          problem: theme.problem,
          resolutionDirection: theme.resolutionDirection,
          learningConnection: `${concept} 개념을 활용함`,
          keywords: selectedKeywords,
          tone: theme.tone,
          difficulty: '보통',
          learningTopicId: request.learningTopicId
        });
        usedTypes.add(theme.type);
        usedTitles.add(normalizeText(selectedTitle));
        startIndex = (themeIndex + 1) % FALLBACK_THEMES.length; // 다음 번엔 다음 테마부터 찾기
        keywordIndex++;
        found = true;
        break;
      }
    }
    
    // 만약 도저히 못 찾았다면, 무작위로 하나 억지로라도 만듦
    if (!found) {
      const theme = FALLBACK_THEMES[startIndex % FALLBACK_THEMES.length];
      const keyword = selectedKeywords[keywordIndex % Math.max(selectedKeywords.length, 1)] || middleUnitName || '비밀';
      recommendations.push({
        id: `fallback-${Date.now()}-${i}-forced`,
        title: `놀라운 ${keyword} 이야기 ${i + 1}`,
        summary: theme.getSummary(concept),
        storyType: theme.type as any,
        storyTypeLabel: theme.label,
        setting: theme.setting,
        incident: theme.incident,
        problem: theme.problem,
        resolutionDirection: theme.resolutionDirection,
        learningConnection: `${concept} 개념을 활용함`,
        keywords: selectedKeywords,
        tone: theme.tone,
        difficulty: '보통',
        learningTopicId: request.learningTopicId
      });
      keywordIndex++;
      startIndex = (startIndex + 1) % FALLBACK_THEMES.length;
    }
  }

  return recommendations;
}

export const generateTopicRecommendations = async (
  request: TopicGenerationRequest
): Promise<TopicRecommendation[]> => {
  // Use provided context or fetch it
  let extraData: CurriculumContext = request.curriculumContext || {};
  if (!request.curriculumContext && request.learningTopicId) {
    extraData = await fetchCurriculumContext(null, request.learningTopicId);
  }

  const countToGenerate = request.count || 2
  let validRecommendations: TopicRecommendation[] = []
  let attempts = 0
  const MAX_ATTEMPTS = 3
  
  while (validRecommendations.length < countToGenerate && attempts < MAX_ATTEMPTS) {
    const currentCountToGenerate = countToGenerate - validRecommendations.length
    const prompt = buildPrompt(request, validRecommendations, currentCountToGenerate, extraData)
    
    const tryModel = async (model: string): Promise<string> => {
      if (!model) throw new Error('No model provided');
      return await Promise.race([
        geminiClient.generateTextWithModel(prompt, model),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 7000))
      ]);
    };

    try {
      let responseText: string;
      try {
        responseText = await tryModel(TEXT_GENERATION_MODEL);
      } catch (err: any) {
        console.warn(`[AI 추천 생성] ${TEXT_GENERATION_MODEL} 실패:`, err.message);
        if (TEXT_FALLBACK_MODEL) {
          try {
            responseText = await tryModel(TEXT_FALLBACK_MODEL);
          } catch (err2: any) {
            console.warn(`[AI 추천 생성] ${TEXT_FALLBACK_MODEL} 실패:`, err2.message);
            throw err2;
          }
        } else {
          throw err;
        }
      }
      
      const cleanedText = responseText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
      
      let parsedData;
      try {
        parsedData = JSON.parse(cleanedText)
      } catch (parseError) {
        console.error(`[AI 추천 생성] JSON 파싱 실패:`, parseError)
        console.error(`[AI 추천 생성] 원본 텍스트:`, cleanedText)
        attempts++
        continue
      }
      
      if (parsedData && Array.isArray(parsedData.recommendations)) {
        console.log(`[AI 추천 생성] 시도 ${attempts + 1}/${MAX_ATTEMPTS}`)
        console.log(`- 검증 전 추천 개수: ${parsedData.recommendations.length}`)
        
        // 11. 한 번의 요청에서 일부 항목만 잘못되어도 전체 결과를 폐기하지 말고 정상 항목은 사용합니다.
        const wellFormed = parsedData.recommendations.filter((rec: any) => 
          rec && typeof rec === 'object' && rec.title && rec.summary && rec.incident
        )
        console.log(`- 필수 필드 검증 후: ${wellFormed.length}`)

        const unique = deduplicate(wellFormed, validRecommendations, request.previousTitles || [])
        console.log(`- 검증 후 남은 추천 개수 (중복/금지어 제외): ${unique.length}`)
        
        validRecommendations = [...validRecommendations, ...unique]
      } else {
        console.warn(`[AI 추천 생성] 실패: 올바른 JSON 배열이 아님`, parsedData)
      }
    } catch (error) {
      console.error(`[AI 추천 생성] 통신 오류 발생 (시도 ${attempts + 1}):`, error)
      // 통신/타임아웃 오류 시 무의미한 재시도를 막고 즉시 빠져나감 (빠른 fallback 처리)
      break;
    }
    
    attempts++
  }
  
  if (validRecommendations.length < countToGenerate) {
    const missingCount = countToGenerate - validRecommendations.length;
    console.warn(`[AI 추천 생성] ${missingCount}개 부족하여 fallback 주제를 사용합니다.`)
    const allExistingTitles = [
      ...(request.previousTitles || []),
      ...validRecommendations.map(r => r.title)
    ];
    const fallbacks = getFallbackTopicRecommendations(request, extraData, missingCount, allExistingTitles);
    validRecommendations = [...validRecommendations, ...fallbacks];
  }
  
  return validRecommendations.slice(0, countToGenerate).map((r, i) => ({
    ...r,
    id: r.id || `topic-${Date.now()}-${i}`,
    learningTopicId: request.learningTopicId
  }))
}

const getFallbackKeywords = (
  subjectName: string, 
  existingKeywords: string[] = [], 
  middleUnitName: string = '', 
  majorUnitName: string = '', 
  context?: CurriculumContext
): KeywordItem[] => {
  const specificMap: Record<string, string[]> = {
    '산지': ['우리나라 산지', '산지 분포', '산맥', '백두대간', '높은 산지', '지형', '국토', '산지의 특징'],
    '하천': ['우리나라 하천', '하천 분포', '상류와 하류', '침식과 퇴적', '유역', '강줄기', '지형', '국토'],
    '강': ['우리나라 하천', '하천 분포', '상류와 하류', '침식과 퇴적', '유역', '강줄기', '지형', '국토'],
    '평야': ['평야', '논', '농사', '곡창 지대', '평지', '들판', '하천', '지형', '국토', '마을'],
    '해안': ['해안', '바다', '갯벌', '섬', '해수욕장', '항구', '어업', '지형', '국토', '자연'],
    '섬': ['섬', '바다', '화산섬', '제주도', '울릉도', '독도', '해안', '지형', '국토', '어업'],
    '도시': ['도시', '인구', '교통', '공업', '빌딩', '아파트', '상업', '산업', '발달', '생활'],
    '촌락': ['촌락', '농촌', '어촌', '산지촌', '농사', '마을', '자연', '생활', '인구', '전통']
  }

  let fallbackWords: string[] = []
  const combinedName = `${majorUnitName} ${middleUnitName}`

  if (combinedName) {
    for (const [key, words] of Object.entries(specificMap)) {
      if (combinedName.includes(key)) {
        fallbackWords = [...fallbackWords, ...words]
      }
    }
  }

  const extractNouns = (text: string) => {
    if (!text) return [];
    const words = text.split(/[\s,()<>\[\]"']+/);
    return words.map(filterAndCleanKeyword).filter((w): w is string => !!w);
  }

  const contextWords: string[] = [];
  
  if (context) {
    const coreText = `${context.subunitSummary || ''} ${context.achievementStandards || ''}`;
    contextWords.push(...extractNouns(coreText));
    
    const goalText = `${context.learningGoal || ''} ${context.unitGoal || ''}`;
    contextWords.push(...extractNouns(goalText));
  }

  fallbackWords = [...fallbackWords, ...extractNouns(combinedName), ...contextWords];

  if (fallbackWords.length === 0) {
    const defaultWords: Record<string, string[]> = {
      '국어': ['인물', '마음', '대화', '장면', '표현', '상상', '친구', '사건', '감정', '이야기'],
      '영어': ['친구', '학교', '여행', '음식', '동물', '길찾기', '대화', '게임', '파티', '미션'],
      '수학': ['문제해결', '규칙', '숫자', '도형', '분수', '계산', '게임', '미션', '퍼즐', '나누기'],
      '사회': ['지형', '국토', '환경', '기후', '산업', '교통', '인구', '법', '정치', '경제'],
      '과학': ['실험', '관찰', '생물', '환경', '에너지', '변화', '탐구', '로봇', '우주', '발명']
    }
    fallbackWords = defaultWords[subjectName] || defaultWords['국어']
  }

  fallbackWords = fallbackWords.map(filterAndCleanKeyword).filter((w): w is string => !!w);
  fallbackWords = [...new Set(fallbackWords)]

  if (existingKeywords.length > 0) {
    fallbackWords = fallbackWords.filter(w => !existingKeywords.includes(w))
  }

  return fallbackWords.slice(0, 10).map(word => ({
    word,
    reason: '학습 주제와 관련된 추천 키워드입니다.'
  }))
}

export const generateKeywords = async (
  request: TopicGenerationRequest & { count?: number; existingKeywords?: string[] }
): Promise<KeywordItem[]> => {
  const { gradeName, subjectName, majorUnitName, middleUnitName, count = 2, existingKeywords = [], curriculumContext } = request

  const existingKeywordsText = existingKeywords.length > 0 
    ? `\n\n이미 생성된 다음 키워드들은 제외하고 완전히 새로운 단어로 만들어주세요:\n[${existingKeywords.join(', ')}]` 
    : ''

  const contextText = curriculumContext ? `
[교과 정보]
대단원 목표: ${curriculumContext.unitGoal || ''}
중단원 학습목표: ${curriculumContext.learningGoal || ''}
성취기준: ${curriculumContext.achievementStandards || ''}
중단원 설명: ${curriculumContext.subunitSummary || ''}
` : '';

  const prompt = `
너는 초등학생을 위한 학습만화 선생님입니다.
아래 단원 정보와 교과 정보를 바탕으로 학습만화 이야기에 쓸 만한 핵심 키워드 ${count}개를 추천해 주세요.

학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원(학습 주제): ${middleUnitName}${contextText}${existingKeywordsText}

[중요 조건]
1. 키워드는 반드시 완전한 명사 또는 명사구로만 작성한다. 동사형, 형용사형, 부사형, 조사로 끝나는 표현, 잘린 어간은 절대 작성하지 않는다. 예: 배려하며, 대화하, 알아보, 대화하고, 바탕으 금지. 예: 배려, 대화, 경청, 존중, 대화 예절, 갈등 해결 허용.
2. 가장 우선순위가 높은 것은 '중단원(학습 주제)'입니다. 중단원명에서 직접 뽑을 수 있는 핵심 개념을 최우선으로 생성하세요.
3. 중단원명 다음으로는 대단원명과 관련된 개념을 고려하세요.
4. 초등학생이 바로 이해할 수 있는 쉬운 명사로 만들고, 2~8글자 정도의 단어를 우선합니다.
5. 과목 전체에 해당하는 너무 넓고 일반적인 단어(예: 지도, 마을, 역사, 문화, 여행, 시장, 사람들, 변화 등)는 최대한 제외하세요.
6. ${count}개 키워드는 서로 너무 비슷하면 안 됩니다.
7. 결과는 JSON 형태로만 반환합니다. 마크다운 코드블록은 쓰지 않습니다.

반환 형식:
{
  "keywords": [
    {
      "word": "산맥",
      "reason": "우리나라 산지 지형의 특징을 설명하는 핵심 개념입니다."
    }
  ]
}
`

  const tryModel = async (model: string): Promise<KeywordItem[]> => {
    if (!model) throw new Error('No model provided');
    
    // 7초 타임아웃
    const responseText = await Promise.race([
      geminiClient.generateTextWithModel(prompt, model),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 7000))
    ]);

    const cleanedText = responseText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
    const parsedData = JSON.parse(cleanedText)

    if (parsedData && Array.isArray(parsedData.keywords) && parsedData.keywords.length > 0) {
      const validKeywords = parsedData.keywords.filter((k: any) => {
        if (!k || typeof k !== 'object' || !k.word) return false;
        const cleaned = filterAndCleanKeyword(k.word);
        if (!cleaned) return false;
        k.word = cleaned;
        return true;
      });
      
      if (validKeywords.length > 0) {
        return validKeywords.slice(0, count);
      }
    }
    
    throw new Error('Invalid JSON format from AI or all keywords were filtered out')
  }

  try {
    try {
      return await tryModel(TEXT_GENERATION_MODEL);
    } catch (err: any) {
      console.warn(`[키워드 생성] ${TEXT_GENERATION_MODEL} 실패:`, err.message);
      if (TEXT_FALLBACK_MODEL) {
        try {
          return await tryModel(TEXT_FALLBACK_MODEL);
        } catch (err2: any) {
          console.warn(`[키워드 생성] ${TEXT_FALLBACK_MODEL} 실패:`, err2.message);
          throw err2;
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Failed to generate keywords from AI:', error)
    return getFallbackKeywords(subjectName || '', existingKeywords, middleUnitName || '', majorUnitName || '', curriculumContext).slice(0, count)
  }
}
