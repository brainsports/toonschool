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
 * 좌·우 수평 트리 자동 배치.
 *  - 중심(central)은 (0,0).
 *  - 모든 1차 가지(main)는 중심의 **왼쪽 또는 오른쪽**에만 배치(위/아래 금지).
 *  - 좌·우 개수를 최대한 균형 있게 분배(홀수면 한쪽이 1개 더 많음).
 *  - 2차 가지(sub)는 부모 가지의 **바깥 방향**으로(왼쪽 가지→더 왼쪽, 오른쪽→더 오른쪽).
 *  - 3차 가지(grand)는 더 바깥으로.
 *  - 각 1차 가지의 "서브트리 높이"를 계산해 세로로 포개 쌓아 선/노드 겹침 방지.
 *  - '나의 생각'(thought)은 1차 가지가 아닌 보조 노드이므로 중심 아래에 가로로 나열.
 *  - 접힌(collapsed) 가지의 자식은 배치에서 제외.
 */
export function autoLayout(nodes: MindmapNode[]): MindmapNode[] {
  const central = nodes.find((n) => n.type === 'central');
  if (!central) return nodes;
  const next = nodes.map((n) => ({ ...n, position: { ...n.position } }));
  const byId = new Map(next.map((n) => [n.id, n] as const));
  const setPos = (id: string, x: number, y: number) => {
    const t = byId.get(id);
    if (t) t.position = { x: Math.round(x), y: Math.round(y) };
  };

  setPos(central.id, 0, 0);
  const allKids = getChildren(next, central.id);
  const mains = allKids.filter((n) => n.type === 'main');
  const thoughts = allKids.filter((n) => n.type === 'thought');

  // 서브트리(2차+3차)의 세로 높이 계산.
  const grandUnitH = LAYOUT.grandSize.h + LAYOUT.childGapY;
  const subtreeHeight = (mainId: string): number => {
    const subs = getChildren(next, mainId).filter((n) => n.type !== 'thought');
    if (subs.length === 0) return LAYOUT.mainSize.h + LAYOUT.mainGapY;
    let total = 0;
    for (const s of subs) {
      const grands = getChildren(next, s.id);
      const gh = grands.length > 0 ? grands.length * grandUnitH : LAYOUT.subSize.h;
      total += Math.max(LAYOUT.subSize.h, gh);
      total += LAYOUT.childGapY;
    }
    return Math.max(LAYOUT.mainSize.h + LAYOUT.mainGapY, total);
  };

  // 좌·우 균형 분배(인덱스 짝수→오른쪽, 홀수→왼쪽). 홀수 개면 오른쪽이 1개 더 많음.
  const leftMains: MindmapNode[] = [];
  const rightMains: MindmapNode[] = [];
  mains.forEach((m, i) => (i % 2 === 0 ? rightMains : leftMains).push(m));

  let maxHalfH = 0;
  const layoutSide = (list: MindmapNode[], sign: -1 | 1) => {
    if (list.length === 0) return;
    const bands = list.map((m) => ({ m, h: subtreeHeight(m.id) }));
    const totalH = bands.reduce((s, b) => s + b.h, 0);
    let cursor = -totalH / 2;
    for (const b of bands) {
      const my = cursor + b.h / 2;
      const mx = sign * LAYOUT.mainDx;
      setPos(b.m.id, mx, my);
      cursor += b.h;
      if (b.m.collapsed) continue;
      const subs = getChildren(next, b.m.id).filter((n) => n.type !== 'thought');
      // 자식들을 메인 y 중심으로 균등 배치(바깥 방향).
      const childTotal = subs.reduce((s, _s, j) => s + (j > 0 ? LAYOUT.childGapY : 0) + LAYOUT.subSize.h, 0);
      let cy = my - childTotal / 2 + LAYOUT.subSize.h / 2;
      subs.forEach((s) => {
        const cx = mx + sign * LAYOUT.childDx;
        setPos(s.id, cx, cy);
        // 3차 가지는 더 바깥으로, 부모 sub 근처에 세로 정렬.
        if (!s.collapsed) {
          const grands = getChildren(next, s.id);
          let gy = cy - ((grands.length - 1) * grandUnitH) / 2;
          grands.forEach((g) => {
            setPos(g.id, cx + sign * LAYOUT.grandDx, gy);
            gy += grandUnitH;
          });
        }
        cy += LAYOUT.subSize.h + LAYOUT.childGapY;
      });
    }
    maxHalfH = Math.max(maxHalfH, totalH / 2);
  };

  layoutSide(leftMains, -1);
  layoutSide(rightMains, 1);

  // '나의 생각' 은 모든 1차 가지 아래, 중심 아래에 가로로 나열.
  const thoughtY = maxHalfH + LAYOUT.thoughtDy;
  thoughts.forEach((th, i) => {
    const x = (i - (thoughts.length - 1) / 2) * LAYOUT.thoughtGapX;
    setPos(th.id, x, thoughtY);
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
    case 'thought': return LAYOUT.thoughtSize;
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
