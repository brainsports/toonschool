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
  metadata?: {
    projectId?: string;
    subject?: string;
    subjectName?: string;
    grade?: string;
    topicTitle?: string;
    topicId?: string;
    lessonTitle?: string;
    unitTitle?: string;
    /** 창작 과목 뒷표지 작가명(뷰어 표시용). */
    authorName?: string;
    /** 창작 과목 AI 표지/뒤표지 결과 메타 — 뷰어/플립북에서 히어로 이미지 식별에만 사용. */
    aiCover?: {
      isAiCover?: boolean;
      coverKind?: 'front' | 'back';
      resultUrl?: string;
      presetCode?: string;
      generatedAt?: string;
    };
  };
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
