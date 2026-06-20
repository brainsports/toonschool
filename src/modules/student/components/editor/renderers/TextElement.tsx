import React, { useRef, useEffect, useState } from 'react';
import { Text, Group, Rect } from 'react-konva';
import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
  trRef?: React.RefObject<any>;
}

export default function TextElement({ element, isSelected, onSelect, onChange, trRef }: Props) {
  const textRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isSelected && !isEditing && trRef && trRef.current && groupRef.current) {
      trRef.current.nodes([groupRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isEditing, trRef]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  useEffect(() => {
    if (isEditing && isSelected && groupRef.current) {
      // Create DOM textarea over the canvas
      const stage = groupRef.current.getStage();
      if (!stage) return;
      
      
      // Calculate absolute position
      const textPosition = textRef.current.getAbsolutePosition();

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const stageBox = stage.container().getBoundingClientRect();
      const scale = stage.scaleX();

      textarea.value = element.props.text || '';
      textarea.style.position = 'absolute';
      textarea.style.top = `${stageBox.top + textPosition.y}px`;
      textarea.style.left = `${stageBox.left + textPosition.x}px`;
      textarea.style.width = `${element.width * scale}px`;
      textarea.style.height = `${element.height * scale}px`;
      textarea.style.fontSize = `${(element.props.fontSize || 40) * scale}px`;
      textarea.style.border = '2px dashed #a855f7';
      textarea.style.padding = '0px';
      textarea.style.margin = '0px';
      textarea.style.overflow = 'hidden';
      textarea.style.background = 'none';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.lineHeight = '1.2';
      textarea.style.fontFamily = element.props.fontFamily || 'Pretendard, sans-serif';
      textarea.style.transformOrigin = 'left top';
      textarea.style.textAlign = element.props.align || 'left';
      textarea.style.color = element.props.fill || '#000000';
      textarea.style.zIndex = '99999';

      textarea.focus();

      const removeTextarea = () => {
        if (textarea.parentNode) {
          textarea.parentNode.removeChild(textarea);
        }
        setIsEditing(false);
      };

      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          onChange({ props: { ...element.props, text: textarea.value } });
          removeTextarea();
        }
        if (e.key === 'Escape') {
          removeTextarea();
        }
      });

      textarea.addEventListener('blur', () => {
        onChange({ props: { ...element.props, text: textarea.value } });
        removeTextarea();
      });

      // Hide text node while editing
      if (trRef?.current) trRef.current.nodes([]);
      textRef.current.hide();

      return () => {
        removeTextarea();
        if (textRef.current) textRef.current.show();
      };
    }
  }, [isEditing, isSelected, element.id]);

  const hasBackground = element.props.backgroundColor && element.props.backgroundColor !== 'transparent';

  return (
    <Group
      ref={groupRef}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      draggable={!element.locked && !isEditing}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragEnd={(e: any) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={() => {
        const node = groupRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(50, node.width() * scaleX),
          height: Math.max(20, node.height() * scaleY),
          rotation: node.rotation(),
          props: {
            ...element.props,
            // fontSize doesn't scale on transform, just width/height
          }
        });
      }}
    >
      {hasBackground && (
        <Rect
          x={0}
          y={0}
          width={element.width}
          height={element.height}
          fill={element.props.backgroundColor}
          opacity={element.props.backgroundOpacity ?? 1}
          cornerRadius={element.props.backgroundRadius || 0}
        />
      )}
      <Text
        ref={textRef}
        text={element.props.text || '텍스트를 입력하세요'}
        fontSize={element.props.fontSize || 40}
        fontFamily={element.props.fontFamily || 'Pretendard'}
        fill={element.props.fill || '#000000'}
        align={element.props.align || 'left'}
        verticalAlign={element.props.verticalAlign || 'middle'}
        width={element.width}
        height={element.height}
        wrap="word"
        ellipsis={true}
      />
    </Group>
  );
}
