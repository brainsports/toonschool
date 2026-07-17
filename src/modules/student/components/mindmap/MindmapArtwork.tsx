/**
 * 마인드맵 아트워크 렌더러.
 * 에디터(편집 가능), 공유 뷰어(읽기 전용), PNG/PDF 내보내기 캡처가 모두 이 컴포넌트를
 * 공유한다. ".mm-world" 루트 요소에 명시적 width/height 가 있고, 노드/배경은 인라인 hex
 * 스타일로 그려져 html2canvas(oklch 문제 회피)로 안전하게 캡처된다.
 *
 * position 은 노드 중심점 기준. 월드 원점(minX,minY) 만큼 평행이동해 top-left 좌표계로 변환.
 */
import { type CSSProperties, type PointerEvent as ReactPointerEvent, type Ref } from 'react';
import type { MindmapNode, MindmapProject } from '../../types/mindmap';
import { getTheme, getIcon, resolveColor, type MindmapTheme } from '../../data/mindmapConfig';
import {
  deriveEdges,
  nodeSize,
  worldSize,
  getChildren,
} from '../../utils/mindmapEngine';
import { V2_CHARACTER_EXPRESSIONS } from '../../data/characterAssets';

export interface MindmapArtworkProps {
  project: MindmapProject;
  themeId?: string;
  /** 편집 상호작용 on. false 면 읽기 전용(공유/미리보기). */
  interactive?: boolean;
  selectedId?: string | null;
  editingId?: string | null;
  /** 노드 드래그 시 화면→월드 변환에 필요한 현재 배율. */
  scale?: number;
  /** 캐릭터 안내 말풍선 표시 여부(공유 뷰어에선 끔). */
  showCharacters?: boolean;
  worldRef?: Ref<HTMLDivElement>;
  onSelectNode?: (id: string | null) => void;
  onNodeDoubleClick?: (id: string) => void;
  onNodeDragStart?: (id: string, e: ReactPointerEvent<HTMLDivElement>) => void;
  onAddChild?: (parentId: string) => void;
  onTitleChange?: (id: string, title: string) => void;
  onFinishEditing?: () => void;
}

export default function MindmapArtwork(props: MindmapArtworkProps) {
  const {
    project,
    themeId,
    interactive = false,
    selectedId,
    editingId,
    showCharacters = true,
    worldRef,
    onSelectNode,
    onNodeDoubleClick,
    onNodeDragStart,
    onAddChild,
    onTitleChange,
    onFinishEditing,
  } = props;

  const theme: MindmapTheme = getTheme(themeId || project.themeId);
  const palette = theme.palette;
  const nodes = project.nodes;
  const { w, h, minX, minY } = worldSize(nodes);
  const edges = deriveEdges(nodes);

  const toView = (x: number, y: number) => ({ x: x - minX, y: y - minY });

  const edgePath = (from: MindmapNode, to: MindmapNode) => {
    const p = toView(from.position.x, from.position.y);
    const c = toView(to.position.x, to.position.y);
    const dx = c.x - p.x;
    // 부드러운 3차 베지어. 가로/세로 혼합 제어점.
    const cx1 = p.x + dx * 0.5;
    const cy1 = p.y;
    const cx2 = c.x - dx * 0.5;
    const cy2 = c.y;
    return `M ${p.x} ${p.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${c.x} ${c.y}`;
  };

  const thoughtNodes = nodes.filter((n) => n.type === 'thought');
  const thoughtCentroid =
    thoughtNodes.length > 0
      ? toView(
          thoughtNodes.reduce((s, n) => s + n.position.x, 0) / thoughtNodes.length,
          Math.min(...thoughtNodes.map((n) => n.position.y)) - 60
        )
      : null;

  const worldStyle: CSSProperties = {
    position: 'relative',
    width: w,
    height: h,
    background: palette.background,
    borderRadius: 28,
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    fontFamily:
      '"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif',
  };

  return (
    <div className="mm-world" ref={worldRef} style={worldStyle} data-mm-world="true">
      {/* 배경 장식(구름/별/꽃). 인라인 hex/emoji 로 oklch 회피. */}
      <Decorations theme={theme} />

      {/* 연결선(SVG). 월드 좌표계 = (view) top-left. */}
      <svg
        width={w}
        height={h}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      >
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

      {/* '나의 생각' 영역 라벨. */}
      {thoughtCentroid && (
        <div
          style={{
            position: 'absolute',
            left: thoughtCentroid.x,
            top: thoughtCentroid.y,
            zIndex: 2,
            background: palette.thought,
            border: `2px dashed ${palette.thoughtBorder}`,
            color: palette.centralText,
            borderRadius: 999,
            padding: '6px 16px',
            fontWeight: 800,
            fontSize: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            pointerEvents: 'none',
            transform: 'translateX(-50%)',
          }}
        >
          ✏️ 나의 생각
        </div>
      )}

      {/* 노드 카드들 */}
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
          onSelect={onSelectNode}
          onDoubleClick={onNodeDoubleClick}
          onDragStart={onNodeDragStart}
          onAddChild={onAddChild}
          onTitleChange={onTitleChange}
          onFinishEditing={onFinishEditing}
        />
      ))}

      {/* 캐릭터 안내(작게, 모서리). */}
      {showCharacters && <CharacterHints theme={theme} project={project} />}
    </div>
  );
}

/** 노드의 번호(큰 가지 순서 / 작은 가지 순서). 없으면 null. */
function numberFor(allNodes: MindmapNode[], node: MindmapNode): number | null {
  if (node.type === 'main' || node.type === 'sub') {
    const siblings = getChildren(allNodes, node.parentId ?? '').filter(
      (n) => n.type === node.type
    );
    const idx = siblings.findIndex((n) => n.id === node.id);
    return idx >= 0 ? idx + 1 : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
function NodeCard({
  node,
  theme,
  viewPos,
  size,
  number,
  interactive,
  selected,
  editing,
  onSelect,
  onDoubleClick,
  onDragStart,
  onAddChild,
  onTitleChange,
  onFinishEditing,
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
    boxShadow: selected
      ? `0 0 0 4px ${border}, 0 8px 20px rgba(0,0,0,0.12)`
      : '0 4px 12px rgba(0,0,0,0.08)',
    zIndex: selected ? 12 : 5,
    cursor: interactive ? (node.type === 'central' ? 'pointer' : 'grab') : 'default',
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
      onClick={(e) => {
        e.stopPropagation();
        if (interactive) onSelect?.(node.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (interactive && onDoubleClick) onDoubleClick(node.id);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {number !== null && (
          <span
            style={{
              flexShrink: 0,
              width: 22,
              height: 22,
              borderRadius: 999,
              background: border,
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {number}
          </span>
        )}
        {icon && <span style={{ fontSize: isCentral ? 22 : 18, lineHeight: 1 }}>{icon.emoji}</span>}
        {editing ? (
          <input
            autoFocus
            defaultValue={node.title}
            onBlur={(e) => {
              onTitleChange?.(node.id, e.target.value);
              onFinishEditing?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onTitleChange?.(node.id, (e.target as HTMLInputElement).value);
                onFinishEditing?.();
              }
              if (e.key === 'Escape') onFinishEditing?.();
            }}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 8,
              padding: '4px 6px',
              fontSize: isCentral ? 20 : 15,
              fontWeight: 800,
              color: 'inherit',
              outline: `2px solid ${border}`,
            }}
          />
        ) : (
          <span
            style={{
              fontSize: isCentral ? 22 : 15,
              fontWeight: 800,
              lineHeight: 1.2,
              wordBreak: 'keep-all',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {node.title || '내용 없음'}
          </span>
        )}
      </div>

      {node.description && !isCentral && (
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.35,
            color: palette.cardText,
            background: 'rgba(255,255,255,0.55)',
            borderRadius: 10,
            padding: '4px 8px',
            marginTop: 2,
            wordBreak: 'keep-all',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {node.description}
        </div>
      )}

      {isThought && (
        <div style={{ fontSize: 11, fontWeight: 700, color: palette.thoughtBorder, marginTop: 2 }}>
          📝 내가 쓴 생각
        </div>
      )}

      {/* 선택 시 하위 가지 추가 버튼(중심/큰가지/작은가지). */}
      {interactive && selected && node.type !== 'thought' && onAddChild && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onAddChild(node.id);
          }}
          style={{
            position: 'absolute',
            right: -14,
            bottom: -14,
            width: 30,
            height: 30,
            borderRadius: 999,
            border: `2px solid ${border}`,
            background: '#fff',
            color: border,
            fontSize: 20,
            fontWeight: 800,
            lineHeight: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            zIndex: 20,
          }}
          aria-label="하위 가지 추가"
          title="하위 가지 추가"
        >
          +
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function Decorations({ theme }: { theme: MindmapTheme }) {
  const decos = theme.decorations;
  const spots = [
    { left: '4%', top: '6%', size: 40 },
    { left: '88%', top: '5%', size: 34 },
    { left: '12%', top: '78%', size: 30 },
    { left: '82%', top: '84%', size: 38 },
    { left: '46%', top: '3%', size: 28 },
  ];
  return (
    <>
      {/* 부드러운 구름 원 */}
      <div style={{ position: 'absolute', left: '6%', top: '10%', width: 120, height: 60, background: theme.palette.cloud, borderRadius: 999, opacity: 0.7, filter: 'blur(2px)', zIndex: 0 }} />
      <div style={{ position: 'absolute', right: '8%', top: '14%', width: 150, height: 70, background: theme.palette.cloud, borderRadius: 999, opacity: 0.65, filter: 'blur(2px)', zIndex: 0 }} />
      {spots.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: s.left,
            top: s.top,
            fontSize: s.size,
            opacity: 0.85,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          {decos[i % decos.length]}
        </span>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
function CharacterHints({ project }: { theme: MindmapTheme; project: MindmapProject }) {
  // 편집 화면 안내: 왼쪽 위(하나), 오른쪽 위(도윤), 왼쪽 아래(서아).
  const hints = [
    {
      img: V2_CHARACTER_EXPRESSIONS.hana.explain,
      bubble: '주제를 중심에 두고, 큰 가지를 뻗어 보세요!',
      pos: { left: 8, top: 8 } as CSSProperties,
      bg: '#fff3e6',
    },
    {
      img: V2_CHARACTER_EXPRESSIONS.doyoon.thinking,
      bubble: '더 궁금한 점은 가지에 + 를 눌러 추가해요.',
      pos: { right: 8, top: 8 } as CSSProperties,
      bg: '#eaf3ff',
    },
    {
      img: V2_CHARACTER_EXPRESSIONS.seoa.smile,
      bubble: '“나의 생각”도 꼭 직접 적어 보세요.',
      pos: { left: 8, bottom: 8 } as CSSProperties,
      bg: '#ffeaf2',
    },
  ];
  // 공유/완성 화면에선 캐릭터를 줄이지 않기 위해 showCharacters 로 제어(호출측).
  void project;
  return (
    <>
      {hints.map((h, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            zIndex: 14,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 6,
            maxWidth: 230,
            ...h.pos,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: h.bg,
              border: '2px solid rgba(0,0,0,0.05)',
              borderRadius: 14,
              padding: '8px 10px',
              fontSize: 12.5,
              fontWeight: 700,
              color: '#4a3a2a',
              lineHeight: 1.35,
              boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
              wordBreak: 'keep-all',
            }}
          >
            {h.bubble}
          </div>
          <img src={h.img} alt="안내 캐릭터" style={{ width: 64, height: 64, objectFit: 'contain' }} />
        </div>
      ))}
    </>
  );
}
