import React, { useRef, useState } from 'react';
import type { ComicCutEditData, ComicCutElement } from '../editor/utils/comicStorage';

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
  const [resizingHandle, setResizingHandle] = useState<'nw' | 'se' | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [elStartSize, setElStartSize] = useState({ width: 0, height: 0 });

  const handlePointerDownBg = (e: React.PointerEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === 'comic-bg-image') {
      onSelectElement(null);
    }
  };

  const handleElementPointerDown = (e: React.PointerEvent, el: ComicCutElement) => {
    e.stopPropagation();
    onSelectElement(el.id);
    
    // Check if clicking resize handle
    const target = e.target as HTMLElement;
    if (target.dataset.resizeHandle) {
      setResizingId(el.id);
      setResizingHandle(target.dataset.resizeHandle as 'nw' | 'se');
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

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId) {
      const dx = (e.clientX - dragStartPos.x) / scale;
      const dy = (e.clientY - dragStartPos.y) / scale;
      onUpdateElement(draggingId, {
        x: elStartPos.x + dx,
        y: elStartPos.y + dy
      });
    } else if (resizingId && resizingHandle) {
      const dx = (e.clientX - resizeStartPos.x) / scale;
      const dy = (e.clientY - resizeStartPos.y) / scale;
      
      const el = data.elements.find(e => e.id === resizingId);
      if (!el) return;

      if (resizingHandle === 'se') {
        // Preserve aspect ratio for characters
        if (el.type === 'character') {
          const ratio = elStartSize.width / elStartSize.height;
          const newWidth = Math.max(50, elStartSize.width + dx);
          onUpdateElement(resizingId, {
            width: newWidth,
            height: newWidth / ratio
          });
        } else {
          onUpdateElement(resizingId, {
            width: Math.max(50, elStartSize.width + dx),
            height: Math.max(30, elStartSize.height + dy)
          });
        }
      } else if (resizingHandle === 'nw') {
        if (el.type === 'character') {
          const ratio = elStartSize.width / elStartSize.height;
          let newWidth = elStartSize.width - dx;
          if (newWidth < 50) newWidth = 50;
          
          const newHeight = newWidth / ratio;
          const newX = elStartPos.x + elStartSize.width - newWidth;
          const newY = elStartPos.y + elStartSize.height - newHeight;

          onUpdateElement(resizingId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
          });
        } else {
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
    <div className="w-full h-full overflow-hidden relative">
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
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
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
                <div 
                  className="w-full h-full bg-white border-4 border-black rounded-[40px] flex items-center justify-center p-4 relative"
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
                  {/* Bubble Tail - simplified for now */}
                  <div className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-black">
                    <div className="absolute -top-[27px] -left-[10px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px]" style={{ borderTopColor: el.style?.backgroundColor || 'white' }} />
                  </div>
                  
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
              )}

              {/* Resize Handles */}
              {isSelected && (
                <>
                  <div 
                    data-resize-handle="nw"
                    className="absolute -top-4 -left-4 w-8 h-8 bg-white border-4 border-purple-500 rounded-full cursor-nw-resize z-50 hover:scale-110 transition-transform"
                  />
                  <div 
                    data-resize-handle="se"
                    className="absolute -bottom-4 -right-4 w-8 h-8 bg-white border-4 border-purple-500 rounded-full cursor-se-resize z-50 hover:scale-110 transition-transform"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
