import type { MindmapCreationMethod, MindmapNode, MindmapProjectStatus } from './mindmap';

export interface MindmapNodeFeedback {
  nodeId: string;
  nodeTitle: string;
  content: string;
  authorId: string;
  createdAt: string;
}

export interface MindmapEvaluation {
  id: string;
  mindmapId: string;
  version: number;
  studentId: string;
  teacherId: string;
  classId: string | null;
  status: 'evaluated' | 'revision_requested';
  understandingScore: number;
  connectionScore: number;
  detailScore: number;
  accuracyScore: number;
  presentationScore: number;
  totalScore: number;
  teacherFeedback: string;
  nodeFeedback: MindmapNodeFeedback[];
  excellentPraise: boolean;
  evaluatedAt: string;
}

export interface TeacherMindmapItem {
  id: string;
  studentId: string;
  studentName: string;
  classId: string | null;
  className: string;
  grade: number;
  subject: string;
  semester: number;
  unitId: string;
  unitTitle: string;
  centralTopic: string;
  creationMethod: MindmapCreationMethod;
  status: MindmapProjectStatus;
  nodes: MindmapNode[];
  thumbnailUrl: string | null;
  version: number;
  submittedAt: string | null;
  updatedAt: string;
  evaluation: MindmapEvaluation | null;
}
