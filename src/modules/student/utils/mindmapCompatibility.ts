import type { MindmapNode } from '../types/mindmap';
import {
  autoLayout,
  getChildren,
  getDepth,
  isPlaceholderText,
  normalizeNodeTypesByDepth,
} from './mindmapEngine';

/** 제목 비교용 정규화. 공백·문장부호 차이만 있는 제목도 같은 제목으로 본다. */
function comparableTitle(title: string): string {
  return title
    .normalize('NFKC')
    .toLocaleLowerCase('ko-KR')
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

/**
 * 과거 AI 결과에서 제목만 반복하는 중간 노드를 안전하게 접어 올린다.
 * 학생 작성 노드나 독립 설명이 있는 노드는 보존하며, 한 번 변환한 결과에는 다시 적용되지 않는다.
 */
export function upgradeOldStructure(input: MindmapNode[]): MindmapNode[] {
  let nodes = input;
  let changed = false;

  // 가장 깊은 후보부터 처리하면 여러 겹의 중복도 부모 관계를 안전하게 갱신할 수 있다.
  while (true) {
    const candidate = [...nodes]
      .filter((node) => node.type !== 'central' && node.type !== 'thought')
      .sort((a, b) => getDepth(nodes, b.id) - getDepth(nodes, a.id))
      .find((node) => {
        if (node.createdBy !== 'ai' || !isPlaceholderText(node.description) || !node.parentId) return false;
        const children = getChildren(nodes, node.id).filter((child) => child.type !== 'thought');
        if (children.length !== 1) return false;
        const ownTitle = comparableTitle(node.title);
        const childTitle = comparableTitle(children[0].title);
        return ownTitle.length > 0 && ownTitle === childTitle;
      });

    if (!candidate) break;
    const child = getChildren(nodes, candidate.id).find((node) => node.type !== 'thought');
    if (!child) break;
    nodes = nodes
      .filter((node) => node.id !== candidate.id)
      .map((node) => (
        node.id === child.id
          ? {
              ...node,
              parentId: candidate.parentId,
              order: candidate.order,
              icon: node.icon ?? candidate.icon,
              colorKey: node.colorKey || candidate.colorKey,
            }
          : node
      ));
    changed = true;
  }

  const normalized = normalizeNodeTypesByDepth(nodes);
  if (normalized !== nodes) {
    nodes = normalized;
    changed = true;
  }
  if (!changed) return input;
  return autoLayout(nodes);
}
