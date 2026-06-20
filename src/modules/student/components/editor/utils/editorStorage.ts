import type { EditorState } from '../types';

export const saveEditorState = (key: string, state: EditorState) => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save editor state', e);
  }
};

export const loadEditorState = (key: string): EditorState | null => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      if (!parsed.coverTemplateId) {
        parsed.coverTemplateId = 'common-01';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load editor state', e);
  }
  return null;
};
