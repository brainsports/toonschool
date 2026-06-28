import { generateTopicRecommendations } from '../src/modules/student/services/studentTopicService'


async function test() {
  const req = {
    gradeName: '4',
    subjectName: '수학',
    majorUnitName: '1. 큰 수',
    middleUnitName: '10000이 10개인 수',
    learningTopicId: 'some-id',
    selectedKeywords: ['만', '돈', '숫자']
  }
  
  console.log('Generating topics...')
  const topics = await generateTopicRecommendations(req)
  console.log('Result count:', topics.length)
  topics.forEach((t, i) => {
    console.log(`[${i+1}] ${t.title} (${t.storyTypeLabel})`)
    console.log(`    ${t.summary}`)
  })
}

test()
