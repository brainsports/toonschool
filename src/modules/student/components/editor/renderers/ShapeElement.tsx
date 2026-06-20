import React, { useEffect, useRef } from 'react';
import { Rect, Circle, Ellipse, Star } from 'react-konva';
import type { CanvasElement } from '../types';

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
  trRef?: React.RefObject<any>;
}

export default function ShapeElement({ element, isSelected, onSelect, onChange, trRef }: Props) {
  const shapeRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, trRef]);

  const commonProps = {
    ref: shapeRef,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    fill: element.props.fill || '#cccccc',
    stroke: element.props.stroke,
    strokeWidth: element.props.strokeWidth,
    opacity: element.props.opacity ?? 1,
    shadowColor: element.props.shadowColor,
    shadowBlur: element.props.shadowBlur,
    shadowOpacity: element.props.shadowOpacity,
    draggable: !element.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (e: any) => {
      onChange({ x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: () => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onChange({
        x: node.x(),
        y: node.y(),
        width: Math.max(5, node.width() * scaleX),
        height: Math.max(5, node.height() * scaleY),
        rotation: node.rotation(),
      });
    }
  };

  switch (element.props.shapeType) {
    case 'circle':
      return <Circle {...commonProps} radius={element.width / 2} width={undefined} height={undefined} />;
    case 'ellipse':
      return <Ellipse {...commonProps} radiusX={element.width / 2} radiusY={element.height / 2} width={undefined} height={undefined} />;
    case 'star':
      return <Star {...commonProps} numPoints={5} innerRadius={element.width / 4} outerRadius={element.width / 2} width={undefined} height={undefined} />;
    case 'rect':
    default:
      return <Rect {...commonProps} cornerRadius={element.props.cornerRadius || 0} />;
  }
}
