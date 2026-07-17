/**
 * 마인드맵 편집 캔버스 호스트.
 *  - 뷰포트 이동(pan): 배경 드래그.
 *  - 확대/축소(zoom): 휠, 핀치(두 손가락), 버튼.
 *  - 노드 드래그: 노드에서 pointerdown → 위치 갱신(onNodePositionChange).
 *  - 화면 맞춤(fit): world 를 뷰포트에 맞춤.
 *
 * 변환: transform wrapper 에 translate+scale(transformOrigin 0,0). world 중심을 초기에 맞춤.
 */
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, type Ref } from 'react';
import type { MindmapProject } from '../../types/mindmap';
import { worldSize } from '../../utils/mindmapEngine';
import MindmapArtwork from './MindmapArtwork';

export interface MindmapCanvasHandle {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getWorldEl: () => HTMLDivElement | null;
}

export interface MindmapCanvasHostProps {
  project: MindmapProject;
  themeId?: string;
  selectedId?: string | null;
  editingId?: string | null;
  canvasRef?: Ref<MindmapCanvasHandle>;
  onSelectNode?: (id: string | null) => void;
  onNodeDoubleClick?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  onTitleChange?: (id: string, title: string) => void;
  onFinishEditing?: () => void;
  onNodeDragStart?: (id: string) => void;
  onNodeDragMove?: (id: string, x: number, y: number) => void;
  onNodeDragEnd?: () => void;
}

interface View { x: number; y: number; scale: number; }

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;

export default function MindmapCanvasHost(props: MindmapCanvasHostProps) {
  const { project, themeId, selectedId, editingId, canvasRef,
    onSelectNode, onNodeDoubleClick, onAddChild, onTitleChange, onFinishEditing,
    onNodeDragStart, onNodeDragMove, onNodeDragEnd } = props;

  const viewportRef = useRef<HTMLDivElement>(null);
  const worldElRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 0.6 });
  const [ready, setReady] = useState(false);
  const [cursor, setCursor] = useState<'grab' | 'grabbing'>('grab');

  const dragStateRef = useRef<
    | { mode: 'pan'; startX: number; startY: number; origX: number; origY: number }
    | { mode: 'node'; nodeId: string; startPX: number; startPY: number; origNX: number; origNY: number; moved: boolean }
    | null
  >(null);

  const pinchRef = useRef<{ d: number; scale: number } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const fit = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const { w, h } = worldSize(project.nodes);
    const pad = 48;
    const availW = vp.clientWidth - pad * 2;
    const availH = vp.clientHeight - pad * 2;
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(availW / w, availH / h)));
    const x = (vp.clientWidth - w * scale) / 2;
    const y = (vp.clientHeight - h * scale) / 2;
    setView({ x, y, scale });
  }, [project.nodes]);

  // 초기/노드 수 변화 시 1회 자동 맞춤(ready 전까지만).
  useEffect(() => {
    if (ready) return;
    const vp = viewportRef.current;
    if (!vp) return;
    fit();
    setReady(true);
  }, [ready, fit]);

  useImperativeHandle(canvasRef, () => ({
    fit,
    zoomIn: () => setView((v) => ({ ...v, scale: Math.min(MAX_SCALE, v.scale + 0.15) })),
    zoomOut: () => setView((v) => ({ ...v, scale: Math.max(MIN_SCALE, v.scale - 0.15) })),
    getWorldEl: () => worldElRef.current,
  }), [fit]);

  // ----- 노드 드래그 시작(Artwork 노드에서 호출) -----
  const handleNodeDragStart = useCallback((nodeId: string, e: ReactPointerEvent<HTMLDivElement>) => {
    const node = project.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (e.button !== undefined && e.button !== 0) return; // 좌클릭만
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragStateRef.current = {
      mode: 'node',
      nodeId,
      startPX: e.clientX,
      startPY: e.clientY,
      origNX: node.position.x,
      origNY: node.position.y,
      moved: false,
    };
    onNodeDragStart?.(nodeId);
  }, [project.nodes, onNodeDragStart]);

  // ----- 범용 pointermove/up(pan + node drag + pinch) -----
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (ds?.mode === 'node') {
        const dx = (e.clientX - ds.startPX) / view.scale;
        const dy = (e.clientY - ds.startPY) / view.scale;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) ds.moved = true;
        onNodeDragMove?.(ds.nodeId, ds.origNX + dx, ds.origNY + dy);
        return;
      }
      if (ds?.mode === 'pan') {
        const nx = ds.origX + (e.clientX - ds.startX);
        const ny = ds.origY + (e.clientY - ds.startY);
        setView((v) => ({ ...v, x: nx, y: ny }));
        return;
      }
    };
    const onUp = () => {
      const ds = dragStateRef.current;
      if (ds?.mode === 'node' && ds.moved) {
        onNodeDragEnd?.();
      }
      dragStateRef.current = null;
      pointersRef.current.clear();
      pinchRef.current = null;
      setCursor('grab');
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [view.scale, onNodeDragMove, onNodeDragEnd]);

  // ----- 휠 줌(포인터 중심) -----
  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setView((v) => {
      const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * delta));
      const k = ns / v.scale;
      return { scale: ns, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  };

  // ----- 배경 드래그(pan) / 핀치 -----
  const onViewportPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 노드 카드 클릭은 여기로 안 옴(버블링 stopPropagation). 여기 오면 배경.
    onSelectNode?.(null);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchRef.current = { d, scale: view.scale };
      dragStateRef.current = null;
      return;
    }
    dragStateRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, origX: view.x, origY: view.y };
    setCursor('grabbing');
  };
  const onViewportPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = [...pointersRef.current.values()];
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.scale * (d / pinchRef.current.d)));
      setView((v) => ({ ...v, scale: ns }));
    }
  };

  const { w, h } = worldSize(project.nodes);

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        background: '#f1f5f9',
        cursor,
        touchAction: 'none',
      }}
      onPointerDown={onViewportPointerDown}
      onPointerMove={onViewportPointerMove}
      onWheel={onWheel}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <MindmapArtwork
          project={project}
          themeId={themeId}
          interactive
          selectedId={selectedId}
          editingId={editingId}
          scale={view.scale}
          worldRef={worldElRef}
          onSelectNode={onSelectNode}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDragStart={handleNodeDragStart}
          onAddChild={onAddChild}
          onTitleChange={onTitleChange}
          onFinishEditing={onFinishEditing}
        />
        {/* 월드 외곽을 시각적으로 안정화(크기 참조용 투명 박스). */}
        <div style={{ position: 'absolute', left: -1, top: -1, width: w + 2, height: h + 2, pointerEvents: 'none' }} />
      </div>

      {/* 줌 컨트롤 */}
      <div className="absolute right-3 bottom-3 flex flex-col gap-1.5 z-30">
        <button onClick={() => setView((v) => ({ ...v, scale: Math.min(MAX_SCALE, v.scale + 0.15) }))} className="w-9 h-9 rounded-lg bg-white shadow border border-slate-200 text-slate-700 font-bold hover:bg-slate-50" title="확대">＋</button>
        <button onClick={() => setView((v) => ({ ...v, scale: Math.max(MIN_SCALE, v.scale - 0.15) }))} className="w-9 h-9 rounded-lg bg-white shadow border border-slate-200 text-slate-700 font-bold hover:bg-slate-50" title="축소">－</button>
        <button onClick={fit} className="w-9 h-9 rounded-lg bg-white shadow border border-slate-200 text-xs text-slate-700 font-bold hover:bg-slate-50" title="화면 맞춤">맞춤</button>
      </div>
    </div>
  );
}
