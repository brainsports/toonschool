import { generateTopicRecommendations } from './src/modules/student/services/studentTopicService';

async function main() {
  console.log('Starting...');
  const request = {
    gradeName: '초4',
    subjectName: '수학',
    majorUnitName: '큰 수',
    middleUnitName: '10000이 10개인 수',
    selectedKeywords: ['숫자', '계산', '규칙', '문제해결'],
    learningTopicId: null, // Just to test the prompt generation and parsing
    previousTitles: [],
    previousIncidents: [],
    previousTypes: []
  };

  try {
    const topics = await generateTopicRecommendations(request);
    console.log('Generated topics length:', topics.length);
    console.log(JSON.stringify(topics, null, 2));
  } catch (error) {
    console.error('Error generating topics:', error);
  }
}

main();
