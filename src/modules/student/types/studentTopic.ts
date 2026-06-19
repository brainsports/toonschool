export interface TopicRecommendation {
  id: string
  title: string
  shortDescription: string
  difficulty: '쉬움' | '보통' | '도전'
  learningPoint: string
  storyMood: string
}

export interface TopicGenerationRequest {
  gradeName: string
  subjectName: string
  majorUnitName: string
  middleUnitName: string
  extraRequest?: string
}

export type TopicGenerationState = 'idle' | 'loading' | 'success' | 'error'
