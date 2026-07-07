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

export interface CurriculumContext {
  unitSummary?: string;
  unitGoal?: string;
  subunitSummary?: string;
  learningGoal?: string;
  keyQuestions?: string;
  contentScope?: string;
  achievementStandards?: string;
}

export interface TopicGenerationRequest {
  gradeName: string;
  subjectName: string;
  majorUnitName: string;
  middleUnitName: string;
  extraRequest?: string;
  selectedKeywords?: string[];
  selectedQuestion?: GeneratedQuestion | null;
  learningTopicId?: string | null;
  previousTitles?: string[];
  previousIncidents?: string[];
  previousTypes?: string[];
  count?: number;
  curriculumContext?: CurriculumContext;
}

export interface QuestionCategory {
  code: string;
  name: string;
  description: string;
}

export interface GeneratedQuestion {
  id?: string;
  categoryCode: string;
  categoryName: string;
  questionText: string;
  keyword: string;
  isSelected?: boolean;
}

export interface QuestionGenerationRequest {
  gradeName: string;
  subjectName: string;
  majorUnitName: string;
  middleUnitName: string;
  keyword: string;
  categories: QuestionCategory[];
  curriculumContext?: CurriculumContext;
}

export type TopicGenerationState = 'idle' | 'loading' | 'success' | 'error';
export type QuestionGenerationState = 'idle' | 'loading' | 'success' | 'error';
