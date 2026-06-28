import * as fs from 'fs'
import * as path from 'path'

const envPath = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const geminiKeyLine = envContent.split('\n').find(l => l.startsWith('VITE_GEMINI_API_KEY='))
const apiKey = geminiKeyLine ? geminiKeyLine.split('=')[1].trim() : ''

async function callAi(prompt: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  })
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

const prompt = `당신은 초등학생용 교과 학습만화 기획자입니다.

제공된 학습목표와 핵심 내용을 정확히 반영하여 서로 완전히 다른 만화 주제 10개를 만드세요.

각 주제는 제목, 장소, 사건, 문제, 해결 방향이 달라야 합니다.
같은 기본 이야기를 복사해 장르나 번호만 바꾸지 마세요.
모든 주제는 실제 6컷 만화로 전개할 수 있어야 합니다.

‘탐험대’, ‘비밀을 찾아 떠나는’, ‘흥미진진한 모험 이야기’라는 표현을 사용하지 마세요.

[단원 정보]
학년: 4
과목: 수학
대단원: 1. 큰 수
중단원(학습 주제): 10000이 10개인 수
선택한 키워드: 만, 돈, 숫자

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
      "storyTypeLabel": "생활 속 문제"
    }
  ]
}`

callAi(prompt).then(text => {
  const jsonStr = text.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim()
  const data = JSON.parse(jsonStr)
  data.recommendations.forEach((r: any, i: number) => {
    console.log(`[${i+1}] ${r.title} (${r.storyTypeLabel})`)
    console.log(`    ${r.summary}`)
  })
})
