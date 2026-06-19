import { geminiClient } from '../../../shared/lib/gemini'
import type { TopicRecommendation, TopicGenerationRequest } from '../types/studentTopic'

export const generateTopicRecommendations = async (
  request: TopicGenerationRequest
): Promise<TopicRecommendation[]> => {
  const { gradeName, subjectName, majorUnitName, middleUnitName, extraRequest } = request

  const prompt = `
너는 초등학생을 위한 학습만화 주제 추천 선생님입니다.

아래 단원 정보를 바탕으로 학습만화로 만들기 좋은 주제 10개를 추천해 주세요.

학년: ${gradeName}
과목: ${subjectName}
대단원: ${majorUnitName}
중단원: ${middleUnitName}
추가 요청: ${extraRequest || '없음'}

조건:
1. 반드시 위 단원과 직접 관련 있어야 합니다.
2. 초등학생이 좋아할 만한 이야기형 주제여야 합니다.
3. 제목은 20자 이내로 짧게 작성합니다.
4. 설명은 한 문장으로 작성합니다.
5. 난이도는 쉬움, 보통, 도전 중 하나로 표시합니다.
6. 배울 점에는 이 주제로 배울 핵심 개념을 적습니다.
7. 결과는 JSON 배열로만 반환합니다.
8. 마크다운 코드블록은 쓰지 않습니다.

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
