/**
 * 마인드맵 편집 캔버스 호스트.
 *  - 중앙 영역 전체를 캔버스로 쓴다: 뷰포트 배경 = 테마 그라데이션이 화면을 가득 채움.
 *  - 배경 장식/캐릭터는 화면 고정. 노드+연결선만 pan/zoom transform 안에서 이동.
 *  - pan(배경 드래그), zoom(휠/핀치/버튼), 노드 드래그, 화면 맞춤(fit).
 *
 * 캡처(PNG/PDF/공유)는 이 캔버스가 아니라 에디터의 숨김 포스터(MindmapArtwork)를
 * 사용한다 → 편집 도구/줌 버튼이 이미지에 들어가지 않는다.
 */
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent, type Ref } from 'react';
import type { MindmapProject } from '../../types/mindmap';
import { worldSize } from '../../utils/mindmapEngine';
import { getTheme } from '../../data/mindmapConfig';
import MindmapNodesLayer from './MindmapNodesLayer';
import { MindmapDecorations } from './MindmapArtwork';

export interface MindmapCanvasHandle {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
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

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const FIT_PAD = 64;
const FIT_MIN = 0.25;

export default function MindmapCanvasHost(props: MindmapCanvasHostProps) {
  const { project, themeId, selectedId, editingId, canvasRef,
    onSelectNode, onNodeDoubleClick, onAddChild, onTitleChange, onFinishEditing,
    onNodeDragStart, onNodeDragMove, onNodeDragEnd } = props;

  const theme = getTheme(themeId || project.themeId);
  const viewportRef = useRef<HTMLDivElement>(null);
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
    const availW = Math.max(100, vp.clientWidth - FIT_PAD * 2);
    const availH = Math.max(100, vp.clientHeight - FIT_PAD * 2);
    const scale = Math.max(FIT_MIN, Math.min(MAX_SCALE, Math.min(availW / w, availH / h)));
    const x = (vp.clientWidth - w * scale) / 2;
    const y = (vp.clientHeight - h * scale) / 2;
    setView({ x, y, scale });
  }, [project.nodes]);

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
  }), [fit]);

  const handleNodeDragStart = useCallback((nodeId: string, e: ReactPointerEvent<HTMLDivElement>) => {
    const node = project.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragStateRef.current = { mode: 'node', nodeId, startPX: e.clientX, startPY: e.clientY, origNX: node.position.x, origNY: node.position.y, moved: false };
    onNodeDragStart?.(nodeId);
  }, [project.nodes, onNodeDragStart]);

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
        setView((v) => ({ ...v, x: ds.origX + (e.clientX - ds.startX), y: ds.origY + (e.clientY - ds.startY) }));
        return;
      }
    };
    const onUp = () => {
      const ds = dragStateRef.current;
      if (ds?.mode === 'node' && ds.moved) onNodeDragEnd?.();
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

  const onViewportPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
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
    if (pointersRef.current.has(e.pointerId)) pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = [...pointersRef.current.values()];
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.scale * (d / pinchRef.current.d)));
      setView((v) => ({ ...v, scale: ns }));
    }
  };

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden"
      style={{ background: theme.palette.background, cursor, touchAction: 'none' }}
      onPointerDown={onViewportPointerDown}
      onPointerMove={onViewportPointerMove}
      onWheel={onWheel}
    >
      {/* 화면 고정 배경 장식만(캐릭터 안내는 캔버스 밖 패널로 이동) */}
      <div className="absolute inset-0 pointer-events-none">
        <MindmapDecorations theme={theme} />
      </div>

      {/* 노드+연결선(pan/zoom transform) */}
      <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: '0 0', willChange: 'transform' }}>
        <MindmapNodesLayer
          nodes={project.nodes}
          theme={theme}
          interactive
          selectedId={selectedId}
          editingId={editingId}
          onSelect={onSelectNode}
          onDoubleClick={onNodeDoubleClick}
          onDragStart={handleNodeDragStart}
          onAddChild={onAddChild}
          onTitleChange={onTitleChange}
          onFinishEditing={onFinishEditing}
        />
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
