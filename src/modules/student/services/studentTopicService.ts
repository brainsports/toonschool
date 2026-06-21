import { geminiClient } from '../../../shared/lib/gemini'
import { supabase } from '../../../shared/lib/supabase'
import type { TopicRecommendation, TopicGenerationRequest, KeywordItem } from '../types/studentTopic'

interface ExtraData {
  learningGoal: string
  keyQuestions: string
  contentScope: string
  achievementStandards: string
}

function normalizeText(text: string) {
  return text.replace(/[\s\d.,!?]/g, '').toLowerCase()
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

const buildPrompt = (request: TopicGenerationRequest, existing: TopicRecommendation[], count: number, extraData: ExtraData) => {
  const { gradeName, subjectName, majorUnitName, middleUnitName, extraRequest, selectedKeywords, previousTitles } = request
  const { learningGoal, keyQuestions, contentScope, achievementStandards } = extraData

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
${learningGoal ? `학습목표: ${learningGoal}` : ''}
${keyQuestions ? `핵심 질문: ${keyQuestions}` : ''}
${contentScope ? `내용 체계: ${contentScope}` : ''}
${achievementStandards ? `성취기준: ${achievementStandards}` : ''}
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

export const generateTopicRecommendations = async (
  request: TopicGenerationRequest
): Promise<TopicRecommendation[]> => {
  let learningGoal = ''
  let keyQuestions = ''
  let contentScope = ''
  let achievementStandards = ''

  if (request.learningTopicId) {
    try {
      const { data } = await supabase
        .from('curriculum_subunits')
        .select('*')
        .eq('id', request.learningTopicId)
        .single()
        
      if (data) {
        learningGoal = data.learning_goal || ''
        keyQuestions = data.key_questions || ''
        contentScope = data.content_scope || ''
        achievementStandards = data.achievement_standards || data.student_achievement_standards || ''
      }
    } catch (e) {
      console.error('Failed to fetch subunit info:', e)
    }
  }

  const extraData: ExtraData = { learningGoal, keyQuestions, contentScope, achievementStandards }

  let validRecommendations: TopicRecommendation[] = []
  let attempts = 0
  const MAX_ATTEMPTS = 3
  
  while (validRecommendations.length < 10 && attempts < MAX_ATTEMPTS) {
    const countToGenerate = 10 - validRecommendations.length
    const prompt = buildPrompt(request, validRecommendations, countToGenerate, extraData)
    
    try {
      const responseText = await geminiClient.generateText(prompt)
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
      // On error, we just increment attempt and try again
    }
    
    attempts++
  }
  
  if (validRecommendations.length === 0) {
    console.error(`[AI 추천 생성] ${MAX_ATTEMPTS}번 시도했으나 유효한 주제를 생성하지 못했습니다.`)
    throw new Error('AI 추천 주제를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  
  return validRecommendations.slice(0, 10).map((r, i) => ({
    ...r,
    id: `topic-${Date.now()}-${i}`,
    learningTopicId: request.learningTopicId
  }))
}

const getFallbackKeywords = (subjectName: string): KeywordItem[] => {
  const words: Record<string, string[]> = {
    '국어': ['인물', '마음', '대화', '장면', '표현', '상상', '친구', '사건', '감정', '이야기'],
    '영어': ['친구', '학교', '여행', '음식', '동물', '길찾기', '대화', '게임', '파티', '미션'],
    '수학': ['문제해결', '규칙', '숫자', '도형', '분수', '계산', '게임', '미션', '퍼즐', '나누기'],
    '사회': ['지도', '마을', '역사', '문화', '여행', '시장', '국토', '탐험', '사람들', '변화'],
    '과학': ['실험', '관찰', '생물', '환경', '에너지', '변화', '탐정', '로봇', '우주', '발명']
  }

  const fallbackWords = words[subjectName] || words['국어']
  return fallbackWords.map(word => ({
    word,
    reason: '기본 추천 키워드입니다.'
  }))
}

export const generateKeywords = async (
  request: TopicGenerationRequest
): Promise<KeywordItem[]> => {
  const { gradeName, subjectName, majorUnitName, middleUnitName } = request

  const prompt = `
너는 초등학생을 위한 학습만화 선생님입니다.
아래 단원 정보를 바탕으로 학습만화 이야기에 쓸 만한 핵심 키워드 10개를 추천해 주세요.

학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원: ${middleUnitName}

조건:
1. 키워드는 반드시 학습 내용과 관련 있어야 합니다.
2. 초등학생이 이해할 수 있는 쉬운 명사형 단어여야 합니다.
3. 이야기 소재, 배경, 사건 등으로 활용하기 좋아야 합니다.
4. 너무 어려운 전문 용어는 피하거나 쉬운 표현으로 바꿉니다.
5. 10개 키워드는 서로 너무 비슷하면 안 됩니다.
6. 결과는 JSON 형태로만 반환합니다. 마크다운 코드블록은 쓰지 않습니다.

반환 형식:
{
  "keywords": [
    {
      "word": "생태계",
      "reason": "생물들이 서로 영향을 주고받는 관계를 이야기로 만들기 좋습니다."
    }
  ]
}
`

  try {
    const responseText = await geminiClient.generateText(prompt)
    const cleanedText = responseText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
    const parsedData = JSON.parse(cleanedText)

    if (parsedData && Array.isArray(parsedData.keywords) && parsedData.keywords.length > 0) {
      return parsedData.keywords
    }
    
    throw new Error('Invalid JSON format from AI')
  } catch (error) {
    console.error('Failed to generate keywords from AI:', error)
    return getFallbackKeywords(subjectName)
  }
}
