/**
 * 마인드맵 AI 생성 응답 계약(Edge Function ↔ 프런트).
 * Edge Function(supabase/functions/generate-mindmap)이 이 형태의 JSON 을 반환한다.
 * 프런트는 응답을 검증한 뒤 노드로 변환한다.
 */

/** AI 가 생성하는 큰 가지. */
export interface AiBranch {
  title: string;
  description?: string;
  icon?: string;
  /** 작은 가지(설명 카드). */
  children: AiLeaf[];
}

export interface AiLeaf {
  title: string;
  description?: string;
  icon?: string;
}

/** 전체 생성 응답. */
export interface AiFullMindmapResponse {
  centralTopic: string;
  branches: AiBranch[];
}

/** 중심 주제 추천 응답(3~5개). */
export interface AiTopicsResponse {
  topics: string[];
}

/** 부분(선택 노드) 생성 응답. */
export interface AiPartialMindmapResponse {
  /** 선택한 노드 아래에 붙일 추천 자식. */
  children: AiLeaf[];
  /** 선택한 노드의 제목/설명을 바꾸는 제안(있을 때). */
  suggestedTitle?: string;
  suggestedDescription?: string;
}

export type AiPartialAction =
  | 'add_children'
  | 'simplify'
  | 'detail'
  | 'example'
  | 'daily'
  | 'question';

export interface AiPartialRequest {
  action: AiPartialAction;
  /** 기준 노드(및 컨텍스트)의 현재 제목/설명. */
  nodeTitle: string;
  nodeDescription?: string;
  /** 선택 노드의 상위 가지 문맥(중심 주제 + 큰 가지 제목 등). */
  centralTopic?: string;
  branchTitle?: string;
  grade?: number;
  subject?: string;
  unitTitle?: string;
}

/** Edge Function 공통 래퍼. */
export interface EfEnvelope<T> {
  success: boolean;
  code?: string;
  message?: string;
  data?: T;
}
