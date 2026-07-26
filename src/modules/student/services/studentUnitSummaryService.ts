import { geminiClient } from '../../../shared/lib/gemini'
import type { CreativeStorySettings } from '../data/creativeCategories'

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
  // '창작' 과목일 때 전달. 교과 단원/학습목표 대신 창작 설정을 맥락으로 사용.
  creativeSettings?: CreativeStorySettings
}

// 창작 설정을 요약 프롬프트용 문장으로 정리.
const formatCreativeLines = (s: CreativeStorySettings): string => {
  const lines = [`- 분야: ${s.categoryName}`, `- 종류: ${s.genreName}`, `- 소재: ${s.materialName}`]
  if (s.protagonistName) lines.push(`- 주인공: ${s.protagonistCustomText || s.protagonistName}`)
  if (s.backgroundName) lines.push(`- 배경: ${s.backgroundCustomText || s.backgroundName}`)
  if (s.moodName) lines.push(`- 분위기: ${s.moodName}`)
  if (s.endingName) lines.push(`- 결말 방향: ${s.endingName}`)
  return lines.join('\n')
}

// 작품 정보 블록. 창작이면 [창작 설정], 교과면 단원/학습목표.
const buildWorkInfoBlock = (p: GenerateSummaryParams): string => {
  if (p.creativeSettings) {
    return `[현재 만화 작품 정보]
과목: 창작 (자유 주제)
${formatCreativeLines(p.creativeSettings)}
만화 제목: ${p.topicTitle || ''}
만화 줄거리: ${p.topicSummary || ''}
${p.comicText ? `만화 대사 일부: ${p.comicText}` : ''}`
  }
  return `[현재 만화 작품 정보]
과목: ${p.subjectName || ''}
단원: ${p.majorUnitName || ''} - ${p.middleUnitName || ''}
학습목표: ${p.learningGoal || ''}
만화 제목: ${p.topicTitle || ''}
만화 줄거리: ${p.topicSummary || ''}
${p.comicText ? `만화 대사 일부: ${p.comicText}` : ''}`
}

export const generateWorldStories = async (
  params: GenerateSummaryParams
): Promise<Record<'history' | 'latest' | 'life', WorldStory>> => {
  const isCreative = !!params.creativeSettings
  const workInfo = buildWorkInfoBlock(params)

  const prompt = `당신은 초등학생용 만화 학습 도우미입니다.
학생이 방금 만든 만화 작품의 내용${isCreative ? '과 창작 설정' : '과 학습 단원'}을 바탕으로, ${isCreative ? "이야기 정리용 '세상 속 이야기' 3가지를 만들어주세요." : "단원 정리용 '세상 속 이야기' 3가지를 만들어주세요."}

${workInfo}

위 내용을 바탕으로 아래 3가지 유형(역사 이야기, 최신 이야기, 생활 연결)의 짧은 글을 생성하세요.
내용은 방금 진행한 위 만화 작품의 문맥이나 소재${isCreative ? '와 주제' : ', 학습 개념'}와 반드시 연결되어야 합니다.
초등학생이 쉽게 이해할 수 있는 친절하고 부드러운 말투로, 각 2~3문장 정도의 짧은 분량으로 작성하세요.
${isCreative ? '교과 학습 단원이 아니므로 교과 개념을 억지로 끼워 넣지 말고, 학생의 창작 이야기 소재를 자연스럽게 확장하세요.' : ''}

반드시 아래 JSON 형식으로만 응답하세요. 마크다운(\`\`\`)은 제외하세요.
{
  "history": {
    "title": "역사와 관련된 흥미로운 제목",
    "content": "과거에는 이 소재나 비슷한 이야기가 어떻게 등장했는지 설명하는 내용"
  },
  "latest": {
    "title": "최신 뉴스나 과학과 관련된 제목",
    "content": "현대 사회에서 이 소재나 비슷한 주제가 어떻게 활용되는지 설명하는 내용"
  },
  "life": {
    "title": "일상생활과 관련된 제목",
    "content": "초등학생의 일상생활 속에서 이 소재나 주제를 어떻게 찾아볼 수 있는지 설명하는 내용"
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
  const isCreative = !!params.creativeSettings
  const workInfo = buildWorkInfoBlock(params)

  const prompt = `당신은 초등학생용 만화 학습 도우미입니다.
학생이 방금 만든 만화 작품의 내용${isCreative ? '과 창작 설정' : '과 학습 단원'}을 바탕으로, ${isCreative ? "이야기 정리용 'OX 문제' 5개를 만들어주세요." : "단원 정리용 'OX 문제' 5개를 만들어주세요."}

${workInfo}

위 내용을 바탕으로 만화의 스토리${isCreative ? '나 핵심 소재' : '나 핵심 학습 개념'}에 대한 OX 퀴즈를 만드세요.
초등학생이 친구에게 내는 퀴즈처럼 약간 재치 있고 너무 어렵지 않아야 합니다.
정답(O 또는 X)이 한쪽으로만 쏠리지 않게 섞어주세요. (예: O 3개, X 2개 등)
${isCreative ? '교과 지식이 아닌 학생의 창작 이야기 내용을 기준으로 문제를 만드세요.' : ''}

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
