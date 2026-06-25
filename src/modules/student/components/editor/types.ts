export type ElementType = 'text' | 'image' | 'shape' | 'bubble';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  props: Record<string, any>;
}

export interface EditorState {
  version: '1.1';
  elements: CanvasElement[];
  background?: string; // Legacy
  coverTemplateId?: string; // New
  canvasWidth: number;
  canvasHeight: number;
}

export type EditorToolType = 'select' | 'text' | 'character' | 'bubble' | 'graphic' | 'shape' | 'background' | 'layer';

export interface EditorProps {
  initialState?: EditorState;
  onSave?: (state: EditorState) => void;
  readOnly?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  onPrev?: () => void;
  onNext?: (state: EditorState) => void;
  prevText?: string;
  nextText?: string;
  mode?: 'front-cover' | 'comic-cut' | 'default';
  subject?: string;
  onCompleteCover?: (currentState: EditorState) => EditorState | void;
  isCoverCompleted?: boolean;
  topicTitle?: string;
}
