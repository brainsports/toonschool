/**
 * 마인드맵 핵심 로직: 노드 계통(트리) 연산 · 검증 · 자동 배치.
 * 순수 함수로만 구성하여 UI/저장과 분리한다.
 */
import type { MindmapNode, MindmapProject } from '../types/mindmap';
import { BRANCH_COLOR_KEYS, MINDMAP_LIMITS, LAYOUT } from '../data/mindmapConfig';

/** id 생성. crypto.randomUUID 를 우선 사용(없으면 폴백). */
export function newId(prefix = 'n'): string {
  const g = globalThis as unknown as { crypto?: Crypto };
  if (g.crypto && typeof g.crypto.randomUUID === 'function') {
    return `${prefix}_${g.crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getNode(nodes: MindmapNode[], id: string | null): MindmapNode | undefined {
  if (!id) return undefined;
  return nodes.find((n) => n.id === id);
}

export function getChildren(nodes: MindmapNode[], parentId: string): MindmapNode[] {
  return nodes
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => a.order - b.order);
}

/** 루트(central) 깊이를 0으로 할 때 해당 노드의 깊이. 순환/끊어진 부모는 안전 처리. */
export function getDepth(nodes: MindmapNode[], id: string): number {
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  let depth = 0;
  let cur = byId.get(id);
  const guard = new Set<string>();
  while (cur && cur.parentId && !guard.has(cur.id)) {
    guard.add(cur.id);
    depth += 1;
    cur = byId.get(cur.parentId);
    if (depth > 99) break; // 순환 가드
  }
  return depth;
}

/** nodeId 의 조상에 newParentId 가 있으면 순환이 생긴다. */
export function wouldCreateCycle(
  nodes: MindmapNode[],
  nodeId: string,
  newParentId: string | null
): boolean {
  if (!newParentId) return false;
  if (nodeId === newParentId) return true;
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  let cur = byId.get(newParentId);
  const guard = new Set<string>();
  while (cur) {
    if (cur.id === nodeId) return true;
    if (guard.has(cur.id)) break;
    guard.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return false;
}

/** 노드의 직계 자식 수. */
export function childCount(nodes: MindmapNode[], parentId: string): number {
  return nodes.reduce((acc, n) => acc + (n.parentId === parentId ? 1 : 0), 0);
}

/** 큰 가지(중심 직계 main 노드) 개수. */
export function mainBranchCount(nodes: MindmapNode[]): number {
  const central = nodes.find((n) => n.type === 'central');
  if (!central) return 0;
  return childCount(nodes, central.id);
}

export interface AddNodeOptions {
  type: MindmapNode['type'];
  parentId: string;
  title?: string;
  description?: string;
  icon?: string;
  colorKey?: string;
  createdBy?: MindmapNode['createdBy'];
  shape?: MindmapNode['shape'];
}

/** 새 노드 추가. 제한/순환 위반 시 null 반환(호출자가 안내). */
export function addNode(nodes: MindmapNode[], opts: AddNodeOptions): { nodes: MindmapNode[]; node: MindmapNode | null; reason?: string } {
  const parent = getNode(nodes, opts.parentId);
  if (!parent) return { nodes, node: null, reason: '부모 노드를 찾을 수 없어요.' };

  if (nodes.length >= MINDMAP_LIMITS.maxTotalNodes) {
    return { nodes, node: null, reason: '내용이 너무 많아요. 중요한 내용을 골라 볼까요?' };
  }

  // 깊이 제한: 부모 깊이 + 1 이 maxDepth 이하여야.
  const parentDepth = getDepth(nodes, parent.id);
  // central=0, main=1, sub=2, thought(어디든). 깊이는 maxDepth(3)까지.
  if (opts.type !== 'thought' && parentDepth + 1 > MINDMAP_LIMITS.maxDepth) {
    return { nodes, node: null, reason: '가지가 너무 깊어요. 다른 가지에 연결해 볼까요?' };
  }

  // 큰 가지 개수 제한(중심의 자식으로 main 추가 시).
  if (opts.type === 'main') {
    if (mainBranchCount(nodes) >= MINDMAP_LIMITS.maxMainBranches) {
      return { nodes, node: null, reason: '큰 가지는 8개까지 만들 수 있어요.' };
    }
  }
  // 한 큰 가지의 직계 자식 수 제한.
  if (parent.type === 'main' && opts.type === 'sub') {
    if (childCount(nodes, parent.id) >= MINDMAP_LIMITS.maxSubPerMain) {
      return { nodes, node: null, reason: '작은 가지는 6개까지 만들 수 있어요.' };
    }
  }

  const siblings = getChildren(nodes, parent.id);
  const order = siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 0;
  const colorKey = opts.colorKey ?? pickColorForNew(nodes, parent, opts.type);

  const node: MindmapNode = {
    id: newId(opts.type),
    parentId: opts.parentId,
    type: opts.type,
    title: (opts.title ?? '').slice(0, MINDMAP_LIMITS.maxTitleLength) || '새 가지',
    description: opts.description,
    icon: opts.icon,
    shape: opts.shape ?? defaultShape(opts.type),
    colorKey,
    position: nextChildPosition(nodes, parent),
    order,
    collapsed: false,
    createdBy: opts.createdBy ?? 'student',
  };

  return { nodes: [...nodes, node], node };
}

/** 새 노드에 부여할 색상 키. main 은 순서대로 branchN, sub/thought 는 부모 상속/전용. */
function pickColorForNew(nodes: MindmapNode[], parent: MindmapNode, type: MindmapNode['type']): string {
  if (type === 'main') {
    const used = getChildren(nodes, parent.id).map((c) => c.colorKey);
    const free = BRANCH_COLOR_KEYS.find((k) => !used.includes(k));
    return free ?? BRANCH_COLOR_KEYS[used.length % BRANCH_COLOR_KEYS.length];
  }
  if (type === 'thought') return 'thought';
  return parent.colorKey; // sub 는 부모 가지 색 상속
}

function defaultShape(type: MindmapNode['type']): MindmapNode['shape'] {
  switch (type) {
    case 'central': return 'oval';
    case 'main': return 'rounded';
    case 'sub': return 'rounded';
    case 'thought': return 'rounded';
  }
}

/** 부모 주변의 겹치지 않는 위치 대략 산출(자동 배치 후보). */
export function nextChildPosition(nodes: MindmapNode[], parent: MindmapNode): { x: number; y: number } {
  const siblings = getChildren(nodes, parent.id);
  const n = siblings.length;
  // 부모 위치에서 아래/옆으로 살짝씩 벌림.
  const angleOffset = (n - 1) * 0.4;
  const dir = parent.type === 'central' ? 1 : (parent.position.x >= 0 ? 1 : -1);
  const baseX = parent.position.x + dir * 200;
  const baseY = parent.position.y + (n - 1) * 90 - angleOffset * 20;
  return { x: baseX, y: baseY };
}

export type DeleteMode = 'cascade' | 'lift' | 'cancel';

/** 노드 삭제. cascade: 하위 모두 삭제, lift: 직계 자식을 조부모에게 붙임(중앙은 제외). */
export function deleteNode(
  nodes: MindmapNode[],
  id: string,
  mode: DeleteMode
): MindmapNode[] {
  const target = getNode(nodes, id);
  if (!target || target.type === 'central') return nodes;

  if (mode === 'cascade') {
    const toRemove = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of nodes) {
        if (n.parentId && toRemove.has(n.parentId) && !toRemove.has(n.id)) {
          toRemove.add(n.id);
          changed = true;
        }
      }
    }
    return nodes.filter((n) => !toRemove.has(n.id));
  }

  if (mode === 'lift') {
    const grandparentId = target.parentId;
    const descendants = collectSubtree(nodes, id);
    const directChildren = nodes.filter((n) => n.parentId === id);
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => {
        if (n.parentId === id && grandparentId) {
          return { ...n, parentId: grandparentId };
        }
        return n;
      })
      .filter((n) => !descendants.has(n.id) || directChildren.some((c) => c.id === n.id));
  }
  return nodes;
}

export function collectSubtree(nodes: MindmapNode[], rootId: string): Set<string> {
  const set = new Set<string>([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const n of nodes) {
      if (n.parentId && set.has(n.parentId) && !set.has(n.id)) {
        set.add(n.id);
        changed = true;
      }
    }
  }
  return set;
}

/** 부모 변경(이동). 순환/깊이 위반 시 원본 반환. */
export function reparent(
  nodes: MindmapNode[],
  nodeId: string,
  newParentId: string | null
): { nodes: MindmapNode[]; ok: boolean; reason?: string } {
  const node = getNode(nodes, nodeId);
  if (!node || node.type === 'central') return { nodes, ok: false, reason: '중심 주제는 옮길 수 없어요.' };
  if (newParentId === node.parentId) return { nodes, ok: true };
  if (newParentId && wouldCreateCycle(nodes, nodeId, newParentId)) {
    return { nodes, ok: false, reason: '자기 자신의 가지 아래로는 옮길 수 없어요.' };
  }
  const newParent = getNode(nodes, newParentId);
  if (!newParent && newParentId) return { nodes, ok: false, reason: '목적지를 찾을 수 없어요.' };

  // 깊이 검사(새 부모 기준).
  if (newParent) {
    const newDepth = getDepth(nodes, newParent.id) + 1;
    if (node.type !== 'thought' && newDepth > MINDMAP_LIMITS.maxDepth) {
      return { nodes, ok: false, reason: '가지가 너무 깊어져서 옮길 수 없어요.' };
    }
  }

  const siblings = newParent ? getChildren(nodes, newParent.id) : [];
  const order = siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 0;
  const updated = nodes.map((n) =>
    n.id === nodeId ? { ...n, parentId: newParentId, order } : n
  );
  return { nodes: updated, ok: true };
}

/** 제목 길이 등 입력 제한 적용. */
export function clampTitle(s: string): string {
  return (s ?? '').slice(0, MINDMAP_LIMITS.maxTitleLength);
}
export function clampDescription(s: string): string {
  return (s ?? '').slice(0, MINDMAP_LIMITS.maxDescriptionLength);
}

/** 완성 조건 점검. */
export interface CompletionReport {
  ok: boolean;
  missing: string[];
}
export function checkCompletion(project: MindmapProject): CompletionReport {
  const missing: string[] = [];
  const central = project.nodes.find((n) => n.type === 'central');
  if (!central || !central.title.trim()) missing.push('중심 주제를 적어주세요.');
  const mains = central ? getChildren(project.nodes, central.id) : [];
  if (mains.length < 3) missing.push('큰 가지를 3개 이상 만들어주세요.');
  const emptyTitle = project.nodes.some((n) => n.type !== 'central' && !n.title.trim());
  if (emptyTitle) missing.push('제목이 비어 있는 가지가 있어요.');
  const studentThought = project.nodes.some(
    (n) => n.type === 'thought' && n.createdBy === 'student' && n.title.trim().length > 0
  );
  if (!studentThought) missing.push('나의 생각을 1개 이상 직접 적어주세요.');
  return { ok: missing.length === 0, missing };
}

/**
 * 방사형(radial) 자동 배치.
 * 중심은 (0,0). 큰 가지는 위쪽 270도에 균등 배치(아래쪽은 '나의 생각' 자리).
 * 각 큰 가지의 자식(작은 가지)은 해당 가지 바깥쪽으로 부채꼴로 펼친다.
 * '나의 생각'(thought) 노드는 중심 아래쪽에 가로로 나열(기준 이미지의 하단 영역).
 * 접힌(collapsed) 가지의 자식은 배치에서 제외.
 */
export function autoLayout(nodes: MindmapNode[]): MindmapNode[] {
  const central = nodes.find((n) => n.type === 'central');
  if (!central) return nodes;
  const next = nodes.map((n) => ({ ...n, position: { ...n.position } }));

  const setPos = (id: string, x: number, y: number) => {
    const t = next.find((n) => n.id === id);
    if (t) t.position = { x, y };
  };

  setPos(central.id, 0, 0);
  const allKids = getChildren(next, central.id);
  const mains = allKids.filter((n) => n.type === 'main');
  const thoughts = allKids.filter((n) => n.type === 'thought');

  const total = mains.length;
  mains.forEach((main, i) => {
    // 위쪽(−90도)을 중심으로 ±135도(상단 270도)에 균등 배치. 하단은 '나의 생각' 자리.
    const angle = total <= 1 ? -Math.PI / 2 : -Math.PI / 2 + ((i / (total - 1)) - 0.5) * (Math.PI * 1.5);
    const mx = Math.round(Math.cos(angle) * LAYOUT.mainRadiusX);
    const my = Math.round(Math.sin(angle) * LAYOUT.mainRadiusY);
    setPos(main.id, mx, my);

    if (main.collapsed) return;
    const children = getChildren(next, main.id).filter((n) => n.type !== 'thought');
    const dirX = Math.sign(mx) || 1;
    children.forEach((child, j) => {
      const spread = children.length > 1 ? (j - (children.length - 1) / 2) * 0.4 : 0;
      const a = angle + spread;
      const r = LAYOUT.subSpread;
      const cx = mx + Math.round(Math.cos(a) * r * dirX);
      const cy = my + Math.round(Math.sin(a) * r * 0.85);
      setPos(child.id, cx, cy);

      // 3단계(손자)가 있다면 더 바깥으로.
      if (!child.collapsed) {
        const grands = getChildren(next, child.id);
        grands.forEach((g, k) => {
          const ga = a + (k - (grands.length - 1) / 2) * 0.3;
          setPos(g.id, cx + Math.round(Math.cos(ga) * 150 * dirX), cy + Math.round(Math.sin(ga) * 150));
        });
      }
    });
  });

  // '나의 생각' 은 중심 아래에 가로로 나열.
  const thoughtY = LAYOUT.mainRadiusY + 170;
  const thoughtSpacing = 250;
  thoughts.forEach((th, i) => {
    const x = (i - (thoughts.length - 1) / 2) * thoughtSpacing;
    setPos(th.id, Math.round(x), Math.round(thoughtY));
  });

  return next;
}

/** 콘텐츠 경계 상자(자동 맞춤/이미지 캡처용). */
export function boundingBox(nodes: MindmapNode[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x);
    maxY = Math.max(maxY, n.position.y);
  }
  const pad = 160;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

/** 노드 종류별 픽셀 크기(position 은 중심점 기준). */
export function nodeSize(type: MindmapNode['type']): { w: number; h: number } {
  switch (type) {
    case 'central': return LAYOUT.centralSize;
    case 'main': return LAYOUT.mainSize;
    case 'sub': return LAYOUT.subSize;
    case 'thought': return { w: 220, h: 90 };
  }
}

/** 모든 노드를 포함하는 월드 크기(position=중심 기준, 여백 포함). */
export function worldSize(nodes: MindmapNode[]): { w: number; h: number; minX: number; minY: number } {
  if (nodes.length === 0) return { w: 1200, h: 800, minX: -600, minY: -400 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const s = nodeSize(n.type);
    minX = Math.min(minX, n.position.x - s.w / 2);
    minY = Math.min(minY, n.position.y - s.h / 2);
    maxX = Math.max(maxX, n.position.x + s.w / 2);
    maxY = Math.max(maxY, n.position.y + s.h / 2);
  }
  const pad = 90;
  return { w: maxX - minX + pad * 2, h: maxY - minY + pad * 2, minX: minX - pad, minY: minY - pad };
}

/** 부모→자식으로부터 연결선 목록 생성(접힌 가지는 자식으로 가는 선 숨김). */
export interface DerivedEdge {
  id: string;
  from: MindmapNode;
  to: MindmapNode;
}
export function deriveEdges(nodes: MindmapNode[]): DerivedEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const edges: DerivedEdge[] = [];
  for (const n of nodes) {
    if (!n.parentId) continue;
    const parent = byId.get(n.parentId);
    if (!parent) continue;
    if (parent.collapsed) continue; // 접힌 부모 아래 선은 숨김
    edges.push({ id: `${parent.id}->${n.id}`, from: parent, to: n });
  }
  return edges;
}
