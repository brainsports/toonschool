export type StoryType =
  | 'everyday_problem'
  | 'mistake_discovery'
  | 'mystery'
  | 'competition'
  | 'invention'
  | 'decision'
  | 'school_incident'
  | 'role_play'
  | 'twist'
  | 'challenge';

export interface TopicRecommendation {
  id: string;
  title: string;
  summary: string;
  storyType: StoryType;
  storyTypeLabel: string;
  setting: string;
  incident: string;
  problem: string;
  resolutionDirection: string;
  learningConnection: string;
  keywords: string[];
  tone: string;
  difficulty: '쉬움' | '보통' | '도전';
  learningTopicId?: string | null;
}

export interface KeywordItem {
  word: string;
  reason?: string;
}

export interface TopicGenerationRequest {
  gradeName: string;
  subjectName: string;
  majorUnitName: string;
  middleUnitName: string;
  extraRequest?: string;
  selectedKeywords?: string[];
  learningTopicId?: string | null;
  previousTitles?: string[];
  previousIncidents?: string[];
  previousTypes?: string[];
  count?: number;
}

export type TopicGenerationState = 'idle' | 'loading' | 'success' | 'error';
