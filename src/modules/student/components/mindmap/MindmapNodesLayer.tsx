/**
 * 마인드맵 노드+연결선 레이어.
 * 배경/장식 없이 "노드 카드 + 곡선 연결선"만 그린다. 에디터(pan/zoom transform 안)와
 * 포스터(fit transform 안)가 공유한다. position 은 노드 중심점 기준이고,
 * worldSize 의 원점(minX,minY) 만큼 평행이동해 top-left 좌표계로 그린다.
 *
 * 모든 색은 인라인 hex(테마 팔레트) → html2canvas(oklch 회피)로 안전하게 캡처.
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

  const edgePath = (from: MindmapNode, to: MindmapNode) => {
    const p = toView(from.position.x, from.position.y);
    const c = toView(to.position.x, to.position.y);
    const dx = c.x - p.x;
    const cx1 = p.x + dx * 0.5;
    const cx2 = c.x - dx * 0.5;
    return `M ${p.x} ${p.y} C ${cx1} ${p.y}, ${cx2} ${c.y}, ${c.x} ${c.y}`;
  };

  return (
    <div ref={layerRef} style={{ position: 'relative', width: w, height: h }}>
      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, overflow: 'visible' }}>
        {edges.map((e) => {
          const col = resolveColor(palette, e.to.colorKey);
          return (
            <path
              key={e.id}
              d={edgePath(e.from, e.to)}
              fill="none"
              stroke={col.border}
              strokeWidth={palette.lineStroke}
              strokeLinecap="round"
              opacity={0.9}
            />
          );
        })}
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
  if (node.type === 'main' || node.type === 'sub') {
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

  const cardStyle: CSSProperties = {
    position: 'absolute',
    left: viewPos.x - size.w / 2,
    top: viewPos.y - size.h / 2,
    width: size.w,
    minHeight: size.h,
    background: fill,
    border: `${isCentral ? 3 : 2}px ${isCentral ? 'dashed' : 'solid'} ${border}`,
    borderRadius: isCentral ? 999 : 18,
    color: isCentral ? palette.centralText : palette.branchText,
    padding: isCentral ? '14px 20px' : '10px 12px',
    boxShadow: selected ? `0 0 0 4px ${border}, 0 8px 20px rgba(0,0,0,0.12)` : '0 4px 12px rgba(0,0,0,0.08)',
    zIndex: selected ? 12 : 5,
    cursor: interactive ? (isCentral ? 'pointer' : 'grab') : 'default',
    userSelect: 'none',
    touchAction: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {number !== null && (
          <span style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: 999, background: border, color: '#fff',
            fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{number}</span>
        )}
        {icon && <span style={{ fontSize: isCentral ? 22 : 18, lineHeight: 1 }}>{icon.emoji}</span>}
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
              flex: 1, minWidth: 0, border: 'none', background: 'rgba(255,255,255,0.7)', borderRadius: 8,
              padding: '4px 6px', fontSize: isCentral ? 20 : 15, fontWeight: 800, color: 'inherit', outline: `2px solid ${border}`,
            }}
          />
        ) : (
          <span style={{
            fontSize: isCentral ? 22 : 15, fontWeight: 800, lineHeight: 1.2, wordBreak: 'keep-all',
            overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>{node.title || '내용 없음'}</span>
        )}
      </div>

      {node.description && !isCentral && (
        <div style={{
          fontSize: 12, lineHeight: 1.4, color: palette.cardText, background: 'rgba(255,255,255,0.6)',
          borderRadius: 10, padding: '5px 8px', marginTop: 2, wordBreak: 'keep-all',
        }}>{node.description}</div>
      )}

      {isThought && (
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.thoughtBorder, marginTop: 2 }}>📝 내가 쓴 생각</div>
      )}

      {interactive && selected && node.type !== 'thought' && onAddChild && (
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
