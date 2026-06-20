import { geminiClient } from '../../../shared/lib/gemini'
import type { TopicRecommendation, TopicGenerationRequest, KeywordItem } from '../types/studentTopic'

export const generateTopicRecommendations = async (
  request: TopicGenerationRequest
): Promise<TopicRecommendation[]> => {
  const { gradeName, subjectName, majorUnitName, middleUnitName, extraRequest, selectedKeywords } = request

  const prompt = `
너는 초등학생을 위한 학습만화 주제 추천 선생님입니다.

아래 단원 정보${selectedKeywords?.length ? '와 학생이 선택한 핵심 키워드' : ''}를 바탕으로 학습만화로 만들기 좋은 주제 10개를 추천해 주세요.

학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원: ${middleUnitName}
${selectedKeywords?.length ? `선택한 키워드: ${selectedKeywords.join(', ')}` : ''}
추가 요청: ${extraRequest || '없음'}

조건:
1. 반드시 위 단원과 직접 관련 있어야 합니다.
${selectedKeywords?.length ? '2. 선택한 키워드를 이야기 소재나 배경, 사건에 자연스럽게 반영해야 합니다.' : '2. 초등학생이 좋아할 만한 이야기형 주제여야 합니다.'}
3. 10개의 추천안은 서로 다른 사건, 배경, 갈등을 가져야 하며, 제목이 비슷하게 반복되면 안 됩니다.
4. 제목은 20자 이내로 짧게 작성하며 사건형 제목으로 만듭니다.
5. 설명은 한 문장으로 작성합니다.
6. 난이도는 쉬움, 보통, 도전 중 하나로 표시합니다.
7. 배울 점에는 이 주제로 배울 핵심 개념을 적습니다.
8. 결과는 JSON 배열로만 반환합니다.
9. 마크다운 코드블록은 쓰지 않습니다.

반환 형식:
[
  {
    "title": "주제 제목",
    "shortDescription": "짧은 설명",
    "difficulty": "쉬움",
    "learningPoint": "배울 점",
    "storyMood": "탐험"
  }
]
`

  try {
    const responseText = await geminiClient.generateText(prompt)
    
    // JSON 문자열 파싱 시도 (마크다운 코드블록이 섞여있을 수 있으므로 전처리)
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(cleanedText)
    
    if (Array.isArray(parsedData) && parsedData.length > 0) {
      // id 부여
      return parsedData.map((item, index) => ({
        id: `topic-${Date.now()}-${index}`,
        title: item.title || '제목 없음',
        shortDescription: item.shortDescription || '',
        difficulty: item.difficulty || '보통',
        learningPoint: item.learningPoint || '',
        storyMood: item.storyMood || '모험'
      }))
    }
    
    throw new Error('Invalid JSON format from AI')
  } catch (error) {
    console.error('Failed to generate topics from AI:', error)
    return getFallbackTopics(request)
  }
}

// AI 실패 시 규칙 기반 Fallback (단원명 활용)
const getFallbackTopics = (request: TopicGenerationRequest): TopicRecommendation[] => {
  const { middleUnitName } = request
  const unit = middleUnitName || '학습'
  
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `fallback-${Date.now()}-${i}`,
    title: `${unit} 탐험대 ${i + 1}`,
    shortDescription: `${unit}의 비밀을 찾아 떠나는 흥미진진한 모험 이야기입니다.`,
    difficulty: i < 3 ? '쉬움' : i < 7 ? '보통' : '도전',
    learningPoint: `${unit}에 대해 재미있게 배울 수 있어요.`,
    storyMood: i % 2 === 0 ? '탐험' : '신비'
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
    const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
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
