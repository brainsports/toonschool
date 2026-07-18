/**
 * 툰마인드 노드+연결선 레이어.
 * 배경/장식 없이 “노드 카드 + 크레용 연결선”만 그린다. 에디터(pan/zoom transform 안)와
 * 포스터(fit transform 안)가 공유 → 편집 화면과 미리보기가 동일하게 렌더링된다.
 *
 *  - 3차(sub) 노드: 긴 가로형 설명 카드(제목 + 2~3줄 설명).
 *  - 연결선: 가지별 색상 + 크레용 질감(feTurbulence/feDisplacementMap 약하게) + 둥근 끝.
 *  - 연결점: 부모/자식의 좌우(또는 상하) 가장자리 중앙 → 선이 카드 텍스트를 관통하지 않음.
 *  - 색은 인라인 hex(테마 팔레트) → html2canvas(oklch 회피).
 */
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type Ref } from 'react';
import type { MindmapNode } from '../../types/mindmap';
import { getIcon, resolveColor, type MindmapTheme } from '../../data/mindmapConfig';
import { deriveEdges, getChildren, nodeSize, worldSize } from '../../utils/mindmapEngine';

export interface MindmapNodesLayerProps {
  nodes: MindmapNode[];
  theme: MindmapTheme;
  interactive?: boolean;
  selectedId?: string | null;
  editingId?: string | null;
  layerRef?: Ref<HTMLDivElement>;
  onSelect?: (id: string | null) => void;
  onDoubleClick?: (id: string) => void;
  onDragStart?: (id: string, e: ReactPointerEvent<HTMLDivElement>) => void;
  onAddChild?: (parentId: string) => void;
  onTitleChange?: (id: string, title: string) => void;
  onFinishEditing?: () => void;
}

export default function MindmapNodesLayer(props: MindmapNodesLayerProps) {
  const {
    nodes, theme, interactive = false, selectedId, editingId, layerRef,
    onSelect, onDoubleClick, onDragStart, onAddChild, onTitleChange, onFinishEditing,
  } = props;
  const palette = theme.palette;
  const { w, h, minX, minY } = worldSize(nodes);
  const edges = deriveEdges(nodes);
  const toView = (x: number, y: number) => ({ x: x - minX, y: y - minY });

  // 부모/자식 가장자리 중앙을 잇는 곡선. 좌우/상하 방향에 따라 연결점 선택.
  const edgePath = (from: MindmapNode, to: MindmapNode) => {
    const fs = nodeSize(from.type);
    const ts = nodeSize(to.type);
    const dx = to.position.x - from.position.x;
    const dy = to.position.y - from.position.y;
    let sx: number, sy: number, ex: number, ey: number;
    if (Math.abs(dx) < Math.abs(dy) - 1) {
      // 세로 방향(주로 중심→'나의 생각'): 부모 아래 중앙 → 자식 위 중앙
      sx = from.position.x; sy = from.position.y + fs.h / 2;
      ex = to.position.x; ey = to.position.y - ts.h / 2;
    } else if (dx < 0) {
      // 자식이 왼쪽: 부모 왼 중앙 → 자식 오른 중앙
      sx = from.position.x - fs.w / 2; sy = from.position.y;
      ex = to.position.x + ts.w / 2; ey = to.position.y;
    } else {
      // 자식이 오른쪽: 부모 오른 중앙 → 자식 왼 중앙
      sx = from.position.x + fs.w / 2; sy = from.position.y;
      ex = to.position.x - ts.w / 2; ey = to.position.y;
    }
    const p = toView(sx, sy);
    const c = toView(ex, ey);
    const mx = (p.x + c.x) / 2;
    return `M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${c.y}, ${c.x} ${c.y}`;
  };

  return (
    <div ref={layerRef} style={{ position: 'relative', width: w, height: h }}>
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
        <defs>
          {/* 크레용 질감: 잡음으로 경로를 미세하게 울퉁불퉁하게. 약하게 적용. */}
          <filter id="mm-crayon" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.7" numOctaves="2" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#mm-crayon)">
          {edges.map((e) => {
            const col = resolveColor(palette, e.to.colorKey);
            const isMainEdge = e.from.type === 'central';
            const w2 = isMainEdge ? Math.max(5, palette.lineStroke) : Math.max(3.5, palette.lineStroke - 1.5);
            return (
              <g key={e.id}>
                {/* 크레용 느낌: 살짝 어긋난 옅은 두께선을 아래에 깜 */}
                <path d={edgePath(e.from, e.to)} fill="none" stroke={col.border} strokeWidth={w2 + 2} strokeLinecap="round" strokeLinejoin="round" opacity={0.25} />
                <path d={edgePath(e.from, e.to)} fill="none" stroke={col.border} strokeWidth={w2} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
              </g>
            );
          })}
        </g>
      </svg>
      {nodes.map((n) => (
        <NodeCard
          key={n.id}
          node={n}
          theme={theme}
          viewPos={toView(n.position.x, n.position.y)}
          size={nodeSize(n.type)}
          number={numberFor(nodes, n)}
          interactive={interactive}
          selected={selectedId === n.id}
          editing={editingId === n.id}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onDragStart={onDragStart}
          onAddChild={onAddChild}
          onTitleChange={onTitleChange}
          onFinishEditing={onFinishEditing}
        />
      ))}
    </div>
  );
}

function numberFor(allNodes: MindmapNode[], node: MindmapNode): number | null {
  if (node.type === 'main' || node.type === 'sub' || node.type === 'detail') {
    const siblings = getChildren(allNodes, node.parentId ?? '').filter((n) => n.type === node.type);
    const idx = siblings.findIndex((n) => n.id === node.id);
    return idx >= 0 ? idx + 1 : null;
  }
  return null;
}

function NodeCard({
  node, theme, viewPos, size, number, interactive, selected, editing,
  onSelect, onDoubleClick, onDragStart, onAddChild, onTitleChange, onFinishEditing,
}: {
  node: MindmapNode;
  theme: MindmapTheme;
  viewPos: { x: number; y: number };
  size: { w: number; h: number };
  number: number | null;
  interactive: boolean;
  selected: boolean;
  editing: boolean;
  onSelect?: (id: string | null) => void;
  onDoubleClick?: (id: string) => void;
  onDragStart?: (id: string, e: ReactPointerEvent<HTMLDivElement>) => void;
  onAddChild?: (parentId: string) => void;
  onTitleChange?: (id: string, title: string) => void;
  onFinishEditing?: () => void;
}) {
  const palette = theme.palette;
  const { fill, border } = resolveColor(palette, node.colorKey);
  const icon = getIcon(node.icon);
  const isCentral = node.type === 'central';
  const isThought = node.type === 'thought';
  const isDetail = node.type === 'detail'; // 3차 설명 카드(가로형 긴 카드)
  // 3차(설명) 카드는 내용에 맞춰 세로로 자라되, 너무 길면 3줄까지만(말줄임).
  const detailDesc = isDetail ? (node.description || '').trim() : '';

  const cardStyle: CSSProperties = {
    position: 'absolute',
    left: viewPos.x - size.w / 2,
    top: viewPos.y - size.h / 2,
    width: size.w,
    minHeight: size.h,
    background: fill,
    border: `${isCentral ? 3 : 2}px ${isCentral ? 'dashed' : 'solid'} ${border}`,
    borderRadius: isCentral ? 999 : 16,
    color: isCentral ? palette.centralText : palette.branchText,
    padding: isCentral ? '14px 20px' : isDetail ? '10px 14px' : '8px 12px',
    boxShadow: selected ? `0 0 0 4px ${border}, 0 8px 20px rgba(0,0,0,0.12)` : '0 4px 12px rgba(0,0,0,0.08)',
    zIndex: selected ? 12 : 5,
    cursor: interactive ? (isCentral ? 'pointer' : 'grab') : 'default',
    userSelect: 'none',
    touchAction: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: isDetail ? 5 : 3,
    transition: 'box-shadow 120ms ease',
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    onSelect?.(node.id);
    if (!editing && onDragStart) onDragStart(node.id, e);
  };

  return (
    <div
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onClick={(e) => { e.stopPropagation(); if (interactive) onSelect?.(node.id); }}
      onDoubleClick={(e) => { e.stopPropagation(); if (interactive && onDoubleClick) onDoubleClick(node.id); }}
    >
      {/* 제목줄 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {number !== null && (
          <span style={{
            flexShrink: 0, width: 21, height: 21, borderRadius: 999, background: border, color: '#fff',
            fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{number}</span>
        )}
        {icon && <span style={{ fontSize: isCentral ? 22 : isDetail ? 16 : 17, lineHeight: 1, flexShrink: 0 }}>{icon.emoji}</span>}
        {editing ? (
          <input
            autoFocus
            defaultValue={node.title}
            onBlur={(e) => { onTitleChange?.(node.id, e.target.value); onFinishEditing?.(); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { onTitleChange?.(node.id, (e.target as HTMLInputElement).value); onFinishEditing?.(); }
              if (e.key === 'Escape') onFinishEditing?.();
            }}
            style={{
              flex: 1, minWidth: 0, border: 'none', background: 'rgba(255,255,255,0.75)', borderRadius: 8,
              padding: '3px 6px', fontSize: isCentral ? 20 : isDetail ? 14 : 15, fontWeight: 800, color: 'inherit', outline: `2px solid ${border}`,
            }}
          />
        ) : (
          <span style={{
            fontSize: isCentral ? 22 : isDetail ? 14 : 15, fontWeight: 800, lineHeight: 1.25,
            wordBreak: 'keep-all', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1,
          }}>{node.title}</span>
        )}
      </div>

      {/* 3차 설명: 긴 가로형 카드의 본문. 2~3줄, 말줄임, 단어 단위 줄바꿈. */}
      {isDetail && detailDesc && !editing && (
        <div style={{
          fontSize: 12.5, lineHeight: 1.5, color: palette.cardText, background: 'rgba(255,255,255,0.62)',
          borderRadius: 10, padding: '6px 9px', wordBreak: 'keep-all', overflowWrap: 'anywhere',
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
        }}>{detailDesc}</div>
      )}

      {isThought && (
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.thoughtBorder, marginTop: 2 }}>📝 내가 쓴 생각</div>
      )}

      {interactive && selected && (node.type === 'central' || node.type === 'main' || node.type === 'sub') && onAddChild && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
          style={{
            position: 'absolute', right: -14, bottom: -14, width: 30, height: 30, borderRadius: 999,
            border: `2px solid ${border}`, background: '#fff', color: border, fontSize: 20, fontWeight: 800,
            lineHeight: '24px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', zIndex: 20,
          }}
          aria-label="하위 가지 추가" title="하위 가지 추가">+</button>
      )}
    </div>
  );
}
