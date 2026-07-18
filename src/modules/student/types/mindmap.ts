/**
 * 마인드맵 에디터 데이터 모델.
 *
 * 설계 원칙:
 * - AI 가 고정 이미지를 만드는 것이 아니라, 노드/연결선 "데이터"를 만든다.
 *   학생은 이 노드를 자유롭게 수정·추가·삭제·이동할 수 있다.
 * - 부모-자식 관계는 node.parentId 가 단일 진실 원천이다. 연결선(edge)은 parentId 로부터
 *   렌더링 시 파생된다(동기화 버그 방지). edges 컬럼은 저장 호환/확장용으로만 유지.
 * - 색상은 colorKey 로 추상화 → 테마 팔레트가 실제 색을 결정. 테마를 바꿔도
 *   학생이 입력한 내용·위치는 그대로 유지된다.
 */

/** 노드의 역할(깊이에 따른 종류). */
export type MindmapNodeType = 'central' | 'main' | 'sub' | 'detail' | 'thought';

/** 노드 외곽 모양. 테마/카드 종류에 따라 다양하게 표현. */
export type MindmapNodeShape = 'circle' | 'rounded' | 'cloud' | 'star' | 'oval';

/** 누가 만들었는지. '나의 생각' 완성 조건은 학생 작성 노드 존재 여부로 판단. */
export type MindmapCreatedBy = 'student' | 'ai';

/** 단일 마인드맵 노드. */
export interface MindmapNode {
  id: string;
  /** 부모 노드 id. 중심 주제는 null. */
  parentId: string | null;
  type: MindmapNodeType;
  title: string;
  description?: string;
  /** 아이콘 키(mindmapConfig 의 ICON_KEYS 참조). */
  icon?: string;
  shape: MindmapNodeShape;
  /** 테마 팔레트 내 색상 키(예: 'branch1'). 중앙은 'central'. */
  colorKey: string;
  /** 캔버스 세계 좌표. 자동 배치 또는 드래그로 갱신. */
  position: { x: number; y: number };
  /** 같은 부모 안에서의 정렬 순서. */
  order: number;
  /** 접기/펼치기. */
  collapsed: boolean;
  createdBy: MindmapCreatedBy;
}

/** 연결선. parentId 로부터 파생되지만, 저장/확장을 위해 명시적으로 보관할 수도 있다. */
export interface MindmapEdge {
  id: string;
  fromId: string;
  toId: string;
}

/** '나의 생각' 작성 항목 틀. */
export type ThoughtPromptKey =
  | 'newly_learned'
  | 'most_important'
  | 'more_curious'
  | 'daily_practice'
  | 'explain_to_friend';

export const THOUGHT_PROMPTS: Record<ThoughtPromptKey, string> = {
  newly_learned: '새롭게 알게 된 점',
  most_important: '가장 중요하다고 생각한 내용',
  more_curious: '더 궁금한 점',
  daily_practice: '생활 속에서 실천할 점',
  explain_to_friend: '친구에게 설명하고 싶은 점',
};

/** 프로젝트 상태. */
export type MindmapProjectStatus =
  | 'draft'
  | 'completed'
  | 'submitted'
  | 'pending_review'
  | 'evaluated'
  | 'revision_requested'
  | 'resubmitted';

export type MindmapCreationMethod = 'direct' | 'ai';

/** 화면 배치 방식. 기본 방사형(radial) = 기준 이미지처럼 중심에서 퍼짐. */
export type MindmapLayoutType = 'radial' | 'tree';

/** 저장/전송용 마인드맵 프로젝트. */
export interface MindmapProject {
  id: string;
  studentId: string;
  organizationId: string | null;
  classId: string | null;
  studentName: string | null;

  title: string;
  grade: number;
  gradeName?: string;
  subject: string;
  subjectCode?: string;
  semester: number;
  unitId: string;
  unitTitle: string;

  centralTopic: string;
  themeId: string;
  layoutType: MindmapLayoutType;
  status: MindmapProjectStatus;
  creationMethod: MindmapCreationMethod;
  submittedAt: string | null;
  evaluatedAt: string | null;
  resubmittedAt: string | null;
  revisionCount: number;
  lastRenderOk: boolean;

  nodes: MindmapNode[];
  /** parentId 파생 연결선을 보조/미리보기용으로만 사용. */
  edges: MindmapEdge[];

  /** 썸네일(data URL). Storage 버킷 의존을 피해 인라인 보관. */
  thumbnailUrl: string | null;

  shareSlug: string | null;
  isPublic: boolean;
  sharedAt: string | null;
  shareRevokedAt: string | null;
  /** 공유용 대표 이미지(data URL). */
  shareThumbnailUrl: string | null;

  createdAt: string;
  updatedAt: string;
  /** 동시 저장 충돌 방지(오래된 저장이 최신 내용을 덮어쓰지 않도록). */
  version: number;
}

/** Supabase 행(Row) 타입. camelCase ↔ snake_case 변환은 서비스가 담당. */
export interface MindmapProjectRow {
  id: string;
  student_id: string;
  organization_id: string | null;
  class_id: string | null;
  student_name: string | null;
  title: string;
  grade: number;
  grade_name: string | null;
  subject: string;
  subject_code: string | null;
  semester: number;
  unit_id: string;
  unit_title: string;
  central_topic: string;
  theme_id: string;
  layout_type: MindmapLayoutType;
  status: MindmapProjectStatus;
  creation_method: MindmapCreationMethod;
  submitted_at: string | null;
  evaluated_at: string | null;
  resubmitted_at: string | null;
  revision_count: number;
  last_render_ok: boolean;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  thumbnail_url: string | null;
  share_slug: string | null;
  is_public: boolean;
  shared_at: string | null;
  share_revoked_at: string | null;
  share_thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  version: number;
}

/** 공개 공유 조회용(개인정보 최소화된) 행. */
export interface MindmapPublicShareRow {
  id: string;
  title: string;
  subject: string;
  unit_title: string;
  central_topic: string;
  theme_id: string;
  layout_type: MindmapLayoutType;
  student_name: string | null;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  share_thumbnail_url: string | null;
  created_at: string;
}
