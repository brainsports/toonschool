import React from 'react';
import type { CanvasElement } from '../types';
import TextElement from './TextElement';
import ImageElement from './ImageElement';
import ShapeElement from './ShapeElement';

interface Props {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<CanvasElement>) => void;
  trRef?: React.RefObject<any>;
}

export default function ElementRenderer(props: Props) {
  if (props.element.visible === false) return null;

  switch (props.element.type) {
    case 'text':
      return <TextElement {...props} />;
    case 'image':
    case 'bubble':
      return <ImageElement {...props} />;
    case 'shape':
      return <ShapeElement {...props} />;
    default:
      return null;
  }
}
