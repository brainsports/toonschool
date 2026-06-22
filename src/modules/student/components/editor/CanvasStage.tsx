import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Transformer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import type { EditorState, CanvasElement } from './types';
import ElementRenderer from './renderers/ElementRenderer';
import { COMMON_COVER_TEMPLATES, DEFAULT_COVER_TEMPLATE_ID } from '../../data/coverTemplates';

interface Props {
  state: EditorState;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onChangeElement: (id: string, newAttrs: Partial<CanvasElement>) => void;
  stageRef: React.RefObject<any>;
  containerWidth: number;
  containerHeight: number;
  zoomPercent: number | null;
}

// 별도 컴포넌트로 분리하여 useImage 훅 사용
function CoverBackground({ coverTemplateId, canvasWidth, canvasHeight }: { coverTemplateId?: string, canvasWidth: number, canvasHeight: number }) {
  const template = COMMON_COVER_TEMPLATES.find(t => t.id === coverTemplateId) || COMMON_COVER_TEMPLATES.find(t => t.id === DEFAULT_COVER_TEMPLATE_ID);
  const [img, status] = useImage(template?.imageUrl || '', 'anonymous');
  
  if (status === 'failed') {
    console.error(`Failed to load cover image: ${template?.imageUrl}`);
  }
  
  if (!img) return null; // 로딩 중에는 표시하지 않음 (또는 로딩 표시)

  return (
    <KonvaImage
      x={0}
      y={0}
      width={canvasWidth}
      height={canvasHeight}
      image={img}
      listening={false} // pointer-events: none 효과 (선택 불가)
      draggable={false}
    />
  );
}

export default function CanvasStage({ state, selectedElementId, onSelectElement, onChangeElement, stageRef, containerWidth, containerHeight, zoomPercent }: Props) {
  const trRef = useRef<any>(null);
  
  const SCROLL_PADDING = 40;
  
  // Calculate scaling
  const fitScale = Math.min(
    Math.max(1, containerWidth - SCROLL_PADDING * 2) / state.canvasWidth,
    Math.max(1, containerHeight - SCROLL_PADDING * 2) / state.canvasHeight
  );
  
  const scale = zoomPercent === null ? fitScale : zoomPercent / 100;

  const scaledWidth = state.canvasWidth * scale;
  const scaledHeight = state.canvasHeight * scale;

  const stageWidth = Math.max(containerWidth, scaledWidth + SCROLL_PADDING * 2);
  const stageHeight = Math.max(containerHeight, scaledHeight + SCROLL_PADDING * 2);

  const xOffset = (stageWidth - scaledWidth) / 2;
  const yOffset = (stageHeight - scaledHeight) / 2;

  // Render elements ordered by zIndex
  const sortedElements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);

  const checkDeselect = (e: any) => {
    // deselect when clicked on empty area (paper base is also considered "empty" for deselect purposes if it doesn't trigger select)
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      onSelectElement(null);
    }
  };

  useEffect(() => {
    // If no element is selected, clear transformer
    if (!selectedElementId && trRef.current) {
      trRef.current.nodes([]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedElementId]);

  return (
    <Stage
      width={stageWidth}
      height={stageHeight}
      onMouseDown={checkDeselect}
      onTouchStart={checkDeselect}
      ref={stageRef}
    >
      <Layer x={xOffset} y={yOffset} scaleX={scale} scaleY={scale}>
        {/* Base Paper with Drop Shadow (클릭 시 선택 해제를 위해 onClick 추가) */}
        <ElementRenderer 
          element={{
            id: 'paper-base', type: 'shape',
            x: 0, y: 0, width: state.canvasWidth, height: state.canvasHeight,
            rotation: 0, zIndex: -10, locked: true, visible: true,
            props: { shapeType: 'rect', fill: '#ffffff', shadowColor: '#000', shadowBlur: 30, shadowOpacity: 0.15 }
          }}
          isSelected={false}
          onSelect={() => onSelectElement(null)}
          onChange={() => {}}
        />

        {/* 최하단 전용 배경 (표지) */}
        <CoverBackground 
          coverTemplateId={state.coverTemplateId} 
          canvasWidth={state.canvasWidth} 
          canvasHeight={state.canvasHeight} 
        />

        {/* 기존 방식의 배경 (하위 호환) */}
        {state.background && !state.coverTemplateId && (
          <ElementRenderer 
            element={{
              id: 'bg-legacy', type: 'image',
              x: 0, y: 0, width: state.canvasWidth, height: state.canvasHeight,
              rotation: 0, zIndex: -1, locked: true, visible: true,
              props: { src: state.background }
            }}
            isSelected={false}
            onSelect={() => onSelectElement(null)}
            onChange={() => {}}
          />
        )}

        {sortedElements.map((el) => (
          <ElementRenderer
            key={el.id}
            element={el}
            isSelected={el.id === selectedElementId}
            onSelect={() => onSelectElement(el.id)}
            onChange={(newAttrs) => onChangeElement(el.id, newAttrs)}
            trRef={trRef}
          />
        ))}

        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
          anchorSize={24} // Larger handles for touch
          anchorCornerRadius={12}
          borderStroke="#8b5cf6" // Purple
          anchorStroke="#8b5cf6"
          anchorFill="#ffffff"
          borderStrokeWidth={2}
          anchorStrokeWidth={2}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
        />
      </Layer>
    </Stage>
  );
}
