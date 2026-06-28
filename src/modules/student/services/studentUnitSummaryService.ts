import { geminiClient } from '../../../shared/lib/gemini'

export interface WorldStory {
  type: 'history' | 'latest' | 'life'
  title: string
  content: string
}

export interface OXQuestion {
  id: string
  answer: 'O' | 'X'
  question: string
}

export interface GenerateSummaryParams {
  gradeName?: string
  subjectName?: string
  majorUnitName?: string
  middleUnitName?: string
  learningGoal?: string
  selectedKeywords?: string[]
  topicTitle?: string
  topicSummary?: string
  scriptSummary?: string
  comicText?: string
}

export const generateWorldStories = async (
  params: GenerateSummaryParams
): Promise<Record<'history' | 'latest' | 'life', WorldStory>> => {
  const { subjectName, majorUnitName, middleUnitName, learningGoal, topicTitle, topicSummary, comicText } = params

  const prompt = `당신은 초등학생용 교과 학습 도우미입니다.
학생이 방금 만든 만화 작품의 내용과 학습 단원을 바탕으로, 단원 정리용 '세상 속 이야기' 3가지를 만들어주세요.

[현재 만화 작품 정보]
과목: ${subjectName || ''}
단원: ${majorUnitName || ''} - ${middleUnitName || ''}
학습목표: ${learningGoal || ''}
만화 제목: ${topicTitle || ''}
만화 줄거리: ${topicSummary || ''}
${comicText ? `만화 대사 일부: ${comicText}` : ''}

위 내용을 바탕으로 아래 3가지 유형(역사 이야기, 최신 이야기, 생활 연결)의 짧은 글을 생성하세요.
내용은 방금 진행한 위 만화 작품의 문맥이나 소재, 학습 개념과 반드시 연결되어야 합니다.
초등학생이 쉽게 이해할 수 있는 친절하고 부드러운 말투로, 각 2~3문장 정도의 짧은 분량으로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요. 마크다운(\`\`\`)은 제외하세요.
{
  "history": {
    "title": "역사와 관련된 흥미로운 제목",
    "content": "과거에는 이 개념이 어떻게 쓰였는지, 어떤 역사적 사실이 있는지 설명하는 내용"
  },
  "latest": {
    "title": "최신 과학이나 뉴스와 관련된 제목",
    "content": "현대 사회나 우주, 과학 등에서 이 개념이나 소재가 어떻게 활용되는지 설명하는 내용"
  },
  "life": {
    "title": "일상생활과 관련된 제목",
    "content": "초등학생의 일상생활 속에서 이 개념이나 소재를 어떻게 찾아볼 수 있는지 설명하는 내용"
  }
}
`

  try {
    const responseText = await geminiClient.generateText(prompt)
    const cleanedText = responseText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
    const parsedData = JSON.parse(cleanedText)

    if (parsedData.history && parsedData.latest && parsedData.life) {
      return {
        history: { type: 'history', title: parsedData.history.title, content: parsedData.history.content },
        latest: { type: 'latest', title: parsedData.latest.title, content: parsedData.latest.content },
        life: { type: 'life', title: parsedData.life.title, content: parsedData.life.content }
      }
    }
    throw new Error('Invalid JSON format from AI')
  } catch (error) {
    console.error('Failed to generate world stories:', error)
    throw new Error('세상 속 이야기를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
}

export const generateOXQuizzes = async (
  params: GenerateSummaryParams
): Promise<OXQuestion[]> => {
  const { subjectName, majorUnitName, middleUnitName, learningGoal, topicTitle, topicSummary, comicText } = params

  const prompt = `당신은 초등학생용 교과 학습 도우미입니다.
학생이 방금 만든 만화 작품의 내용과 학습 단원을 바탕으로, 단원 정리용 'OX 문제' 5개를 만들어주세요.

[현재 만화 작품 정보]
과목: ${subjectName || ''}
단원: ${majorUnitName || ''} - ${middleUnitName || ''}
학습목표: ${learningGoal || ''}
만화 제목: ${topicTitle || ''}
만화 줄거리: ${topicSummary || ''}
${comicText ? `만화 대사 일부: ${comicText}` : ''}

위 내용을 바탕으로 만화의 스토리나 핵심 학습 개념에 대한 OX 퀴즈를 만드세요.
초등학생이 친구에게 내는 퀴즈처럼 약간 재치 있고 너무 어렵지 않아야 합니다.
정답(O 또는 X)이 한쪽으로만 쏠리지 않게 섞어주세요. (예: O 3개, X 2개 등)

반드시 아래 JSON 형식으로만 응답하세요. 마크다운(\`\`\`)은 제외하세요.
{
  "quizzes": [
    {
      "id": "1",
      "answer": "O",
      "question": "문제 내용"
    },
    ...총 5개
  ]
}
`

  try {
    const responseText = await geminiClient.generateText(prompt)
    const cleanedText = responseText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
    const parsedData = JSON.parse(cleanedText)

    if (parsedData && Array.isArray(parsedData.quizzes) && parsedData.quizzes.length === 5) {
      return parsedData.quizzes.map((q: any) => ({
        id: q.id || Math.random().toString(36).substr(2, 9),
        answer: q.answer === 'O' || q.answer === 'X' ? q.answer : 'O',
        question: q.question
      }))
    }
    throw new Error('Invalid JSON format from AI')
  } catch (error) {
    console.error('Failed to generate OX quizzes:', error)
    throw new Error('OX 문제를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
}
