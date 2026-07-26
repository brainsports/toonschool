import React, { useRef, useState } from 'react';
import type { ComicCutEditData, ComicCutElement, BubbleTail } from '../editor/utils/comicStorage';

// 말꼬리 기본값. tail 이 없는 기존 말풍선은 이 값으로 렌더링(하위 호환).
const DEFAULT_TAIL: BubbleTail = { direction: 'down', length: 40, width: 36, offset: 0, visible: true };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// 요소의 tail 설정을 기본값과 합쳐 완전한 설정으로 반환.
const resolveTail = (el: ComicCutElement): BubbleTail => ({
  direction: el.tail?.direction || DEFAULT_TAIL.direction,
  length: el.tail?.length ?? DEFAULT_TAIL.length,
  width: el.tail?.width ?? DEFAULT_TAIL.width,
  offset: el.tail?.offset ?? DEFAULT_TAIL.offset,
  visible: el.tail?.visible !== false,
});

// 말꼬리 삼각형 정점(SVG points 문자열)과 끝점(tip, 버블 국소 좌표계)을 계산.
// base 를 버블 안쪽으로 inset 시켜, 버블 박스가 base stroke 를 덮어 자연스럽게 이어지게 한다.
const tailGeometry = (
  w: number,
  h: number,
  cfg: BubbleTail
): { points: string; tip: { x: number; y: number } } => {
  const inset = 6;
  const length = Math.max(12, cfg.length ?? DEFAULT_TAIL.length!);
  const tw = Math.max(10, cfg.width ?? DEFAULT_TAIL.width!);
  const offset = clamp(cfg.offset ?? 0, -1, 1);

  if (cfg.direction === 'up') {
    const cx = w / 2 + offset * Math.max(0, w / 2 - tw / 2 - 10);
    const by = inset;
    const tipY = -length;
    return { points: `${cx - tw / 2},${by} ${cx + tw / 2},${by} ${cx},${tipY}`, tip: { x: cx, y: tipY } };
  }
  if (cfg.direction === 'left') {
    const cy = h / 2 + offset * Math.max(0, h / 2 - tw / 2 - 10);
    const bx = inset;
    const tipX = -length;
    return { points: `${bx},${cy - tw / 2} ${bx},${cy + tw / 2} ${tipX},${cy}`, tip: { x: tipX, y: cy } };
  }
  if (cfg.direction === 'right') {
    const cy = h / 2 + offset * Math.max(0, h / 2 - tw / 2 - 10);
    const bx = w - inset;
    const tipX = w + length;
    return { points: `${bx},${cy - tw / 2} ${bx},${cy + tw / 2} ${tipX},${cy}`, tip: { x: tipX, y: cy } };
  }
  // down (기본)
  const cx = w / 2 + offset * Math.max(0, w / 2 - tw / 2 - 10);
  const by = h - inset;
  const tipY = h + length;
  return { points: `${cx - tw / 2},${by} ${cx + tw / 2},${by} ${cx},${tipY}`, tip: { x: cx, y: tipY } };
};

// 말꼬리 SVG. 버블 박스보다 아래(z 낮음)에 둬 base 가 박스에 덮이게 함.
function BubbleTailSvg({ el }: { el: ComicCutElement }) {
  const cfg = resolveTail(el);
  if (!cfg.visible) return null;
  const { points } = tailGeometry(el.width, el.height, cfg);
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={el.width}
      height={el.height}
      style={{ overflow: 'visible' }}
    >
      <polygon
        points={points}
        fill={el.style?.backgroundColor || 'white'}
        stroke={el.style?.borderColor || 'black'}
        strokeWidth={8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  data: ComicCutEditData;
  containerWidth: number;
  containerHeight: number;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<ComicCutElement>) => void;
}

export default function ComicCanvas({
  data,
  containerWidth,
  containerHeight,
  selectedElementId,
  onSelectElement,
  onUpdateElement
}: Props) {
  const CANVAS_WIDTH = 1400;
  const scale = containerWidth > 0 ? containerWidth / CANVAS_WIDTH : 1;
  const CANVAS_HEIGHT = scale > 0 ? containerHeight / scale : 990;

  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [elStartPos, setElStartPos] = useState({ x: 0, y: 0 });

  // Resizing state
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizingHandle, setResizingHandle] = useState<'nw' | 'se' | 'ne' | 'sw' | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [elStartSize, setElStartSize] = useState({ width: 0, height: 0 });

  // 말꼬리 끝점 드래그 상태(speechBubble 전용).
  const [tailDraggingId, setTailDraggingId] = useState<string | null>(null);

  const handlePointerDownBg = (e: React.PointerEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'comic-bg-image') {
      onSelectElement(null);
    }
  };

  const handleElementPointerDown = (e: React.PointerEvent, el: ComicCutElement) => {
    e.stopPropagation();
    onSelectElement(el.id);

    const target = e.target as HTMLElement;

    // 말꼬리 끝점 핸들 — 드래그로 방향/길이/위치를 조절.
    if (target.dataset.tailHandle === 'tip') {
      setTailDraggingId(el.id);
      target.setPointerCapture(e.pointerId);
      return;
    }

    // Check if clicking resize handle
    if (target.dataset.resizeHandle) {
      setResizingId(el.id);
      setResizingHandle(target.dataset.resizeHandle as 'nw' | 'se' | 'ne' | 'sw');
      setResizeStartPos({ x: e.clientX, y: e.clientY });
      setElStartSize({ width: el.width, height: el.height });
      setElStartPos({ x: el.x, y: el.y });
      target.setPointerCapture(e.pointerId);
    } else {
      setDraggingId(el.id);
      setDragStartPos({ x: e.clientX, y: e.clientY });
      setElStartPos({ x: el.x, y: el.y });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const resizeSelectedCharacter = (
    handle: 'nw' | 'se' | 'ne' | 'sw',
    pointerPosition: { clientX: number; clientY: number }
  ) => {
    if (!canvasRef.current || !resizingId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = (pointerPosition.clientX - rect.left) / scale;
    const currentY = (pointerPosition.clientY - rect.top) / scale;
    
    const startX = (resizeStartPos.x - rect.left) / scale;
    const startY = (resizeStartPos.y - rect.top) / scale;

    const dx = currentX - startX;
    const dy = currentY - startY;

    const MIN_SIZE = 50;
    const ratio = elStartSize.width / elStartSize.height;

    let newX = elStartPos.x;
    let newY = elStartPos.y;
    let newWidth = elStartSize.width;
    let newHeight = elStartSize.height;

    if (handle === 'se') {
      newWidth = elStartSize.width + dx;
      if (newWidth < MIN_SIZE) newWidth = MIN_SIZE;
      newHeight = newWidth / ratio;
    } else if (handle === 'nw') {
      newWidth = elStartSize.width - dx;
      if (newWidth < MIN_SIZE) newWidth = MIN_SIZE;
      newHeight = newWidth / ratio;
      newX = elStartPos.x + elStartSize.width - newWidth;
      newY = elStartPos.y + elStartSize.height - newHeight;
    } else if (handle === 'ne') {
      newWidth = elStartSize.width + dx;
      if (newWidth < MIN_SIZE) newWidth = MIN_SIZE;
      newHeight = newWidth / ratio;
      newY = elStartPos.y + elStartSize.height - newHeight;
    } else if (handle === 'sw') {
      newWidth = elStartSize.width - dx;
      if (newWidth < MIN_SIZE) newWidth = MIN_SIZE;
      newHeight = newWidth / ratio;
      newX = elStartPos.x + elStartSize.width - newWidth;
    }

    console.log(`[Resize Dev Log] handle: ${handle}, dx: ${dx.toFixed(2)}, dy: ${dy.toFixed(2)}, newX: ${newX.toFixed(2)}, newY: ${newY.toFixed(2)}, newWidth: ${newWidth.toFixed(2)}, newHeight: ${newHeight.toFixed(2)}`);

    onUpdateElement(resizingId, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // 말꼬리 끝점 드래그 → 포인터 위치로 방향/길이/오프셋 갱신.
    if (tailDraggingId) {
      const el = data.elements.find((x) => x.id === tailDraggingId);
      if (!el || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left) / scale;
      const py = (e.clientY - rect.top) / scale;
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      const dx = px - cx;
      const dy = py - cy;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const halfW = el.width / 2;
      const halfH = el.height / 2;
      let direction: BubbleTail['direction'];
      let length: number;
      let offset: number;
      if (absX > absY) {
        direction = dx >= 0 ? 'right' : 'left';
        length = absX - halfW;
        offset = clamp(dy / Math.max(20, halfH - 20), -1, 1);
      } else {
        direction = dy >= 0 ? 'down' : 'up';
        length = absY - halfH;
        offset = clamp(dx / Math.max(20, halfW - 20), -1, 1);
      }
      onUpdateElement(tailDraggingId, {
        tail: { direction, length: Math.max(20, Math.round(length)), offset: Math.round(offset * 100) / 100, visible: true },
      });
      return;
    }

    if (draggingId) {
      const dx = (e.clientX - dragStartPos.x) / scale;
      const dy = (e.clientY - dragStartPos.y) / scale;
      onUpdateElement(draggingId, {
        x: elStartPos.x + dx,
        y: elStartPos.y + dy
      });
    } else if (resizingId && resizingHandle) {
      const el = data.elements.find(e => e.id === resizingId);
      if (!el) return;

      if (el.type === 'character') {
        resizeSelectedCharacter(resizingHandle, { clientX: e.clientX, clientY: e.clientY });
      } else {
        const dx = (e.clientX - resizeStartPos.x) / scale;
        const dy = (e.clientY - resizeStartPos.y) / scale;
        
        if (resizingHandle === 'se') {
          onUpdateElement(resizingId, {
            width: Math.max(50, elStartSize.width + dx),
            height: Math.max(30, elStartSize.height + dy)
          });
        } else if (resizingHandle === 'nw') {
          let newWidth = elStartSize.width - dx;
          let newHeight = elStartSize.height - dy;
          let newX = elStartPos.x + dx;
          let newY = elStartPos.y + dy;

          if (newWidth < 50) {
            newWidth = 50;
            newX = elStartPos.x + elStartSize.width - 50;
          }
          if (newHeight < 30) {
            newHeight = 30;
            newY = elStartPos.y + elStartSize.height - 30;
          }

          onUpdateElement(resizingId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (tailDraggingId) {
      if (e.target instanceof HTMLElement && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
      setTailDraggingId(null);
    }
    if (draggingId) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
    if (resizingId) {
      if (e.target instanceof HTMLElement && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
      setResizingId(null);
      setResizingHandle(null);
    }
  };

  return (
    <div 
      className="w-full h-full overflow-hidden relative"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div 
        ref={canvasRef}
        onPointerDown={handlePointerDownBg}
        className="absolute top-0 left-0 bg-white flex-shrink-0 touch-none select-none overflow-hidden"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      >
        {/* Background Image */}
        {data.backgroundImageUrl ? (
          <img 
            id="comic-bg-image"
            src={data.backgroundImageUrl} 
            alt="Cut Background" 
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
          />
        ) : (
          <div id="comic-bg-image" className="absolute inset-0 w-full h-full bg-slate-100 flex items-center justify-center z-0">
            <span className="text-slate-400 font-jua text-4xl">배경 이미지가 없습니다</span>
          </div>
        )}

        {/* Elements */}
        {[...data.elements].sort((a, b) => a.zIndex - b.zIndex).map(el => {
          const isSelected = selectedElementId === el.id;
          
          return (
            <div
              key={el.id}
              onPointerDown={(e) => handleElementPointerDown(e, el)}
              className={`absolute cursor-move outline-none touch-none ${isSelected ? 'ring-4 ring-purple-500 ring-offset-2' : ''}`}
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: el.zIndex,
                transform: `rotate(${el.rotation || 0}deg)`,
              }}
            >
              {el.type === 'character' && (
                <div 
                  className="w-full h-full overflow-hidden"
                  style={{
                    clipPath: el.crop ? `inset(${el.crop.top}px ${el.crop.right}px ${el.crop.bottom}px ${el.crop.left}px)` : 'none'
                  }}
                >
                  <img 
                    src={el.imageUrl} 
                    alt="Character"
                    className="w-full h-full pointer-events-none"
                    style={{
                      objectFit: (el.cropScale && el.cropScale !== 1) ? 'cover' : 'contain',
                      transform: `scale(${el.flipX ? -1 : 1}, 1) scale(${el.cropScale || 1}) translate(${el.cropX || 0}px, ${el.cropY || 0}px)`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
              )}

              {el.type === 'speechBubble' && (
                <div className="w-full h-full relative">
                  {/* 말꼬리(SVG). 버블 박스 아래에 렌더 → base가 박스에 덮임. */}
                  <BubbleTailSvg el={el} />
                  <div
                    className="absolute inset-0 bg-white border-4 border-black rounded-[40px] flex items-center justify-center p-4"
                    style={{
                      backgroundColor: el.style?.backgroundColor || 'white',
                      borderColor: el.style?.borderColor || 'black',
                    }}
                  >
                    {el.speaker && (
                      <div className="absolute -top-3 left-4 bg-purple-600 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold z-10 shadow-sm border border-white/20 truncate max-w-[80%]">
                        {el.speaker}
                      </div>
                    )}

                    <textarea
                      className="w-full h-full bg-transparent resize-none outline-none text-center font-jua"
                      style={{
                        fontSize: el.style?.fontSize || 32,
                        color: el.style?.textColor || 'black',
                      }}
                      value={el.text}
                      onChange={(e) => onUpdateElement(el.id, { text: e.target.value })}
                      onPointerDown={(e) => e.stopPropagation()} // Allow text selection
                    />
                  </div>
                </div>
              )}

              {/* Resize handles moved to overlay */}
            </div>
          );
        })}

        {/* Resize Handles Overlay (Always on top) */}
        {selectedElementId && (() => {
          const el = data.elements.find(e => e.id === selectedElementId);
          if (!el) return null;
          return (
            <div
              className="absolute pointer-events-none touch-none"
              style={{
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: 9999,
                transform: `rotate(${el.rotation || 0}deg)`,
              }}
            >
              <div 
                data-resize-handle="nw"
                onPointerDown={(e) => handleElementPointerDown(e, el)}
                className="absolute -top-4 -left-4 w-8 h-8 bg-white border-4 border-purple-500 rounded-full cursor-nw-resize z-50 pointer-events-auto hover:scale-110 transition-transform"
              />
              <div 
                data-resize-handle="se"
                onPointerDown={(e) => handleElementPointerDown(e, el)}
                className="absolute -bottom-4 -right-4 w-8 h-8 bg-white border-4 border-purple-500 rounded-full cursor-se-resize z-50 pointer-events-auto hover:scale-110 transition-transform"
              />
              {el.type === 'character' && (
                <>
                  <div
                    data-resize-handle="ne"
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    className="absolute -top-4 -right-4 w-8 h-8 bg-white border-4 border-purple-500 rounded-full cursor-ne-resize z-50 pointer-events-auto hover:scale-110 transition-transform"
                  />
                  <div
                    data-resize-handle="sw"
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    className="absolute -bottom-4 -left-4 w-8 h-8 bg-white border-4 border-purple-500 rounded-full cursor-sw-resize z-50 pointer-events-auto hover:scale-110 transition-transform"
                  />
                </>
              )}
              {el.type === 'speechBubble' && resolveTail(el).visible && (() => {
                const tip = tailGeometry(el.width, el.height, resolveTail(el)).tip;
                return (
                  <div
                    data-tail-handle="tip"
                    onPointerDown={(e) => handleElementPointerDown(e, el)}
                    title="말꼬리 끝점 (드래그하여 방향·길이·위치 조절)"
                    className="absolute w-7 h-7 bg-white border-4 border-pink-500 rounded-full cursor-move z-50 pointer-events-auto hover:scale-110 transition-transform"
                    style={{ left: tip.x - 14, top: tip.y - 14 }}
                  />
                );
              })()}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
