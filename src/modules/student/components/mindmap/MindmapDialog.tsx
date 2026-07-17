/**
 * 툰스쿨 전용 범용 다이얼로그(한국어). 브라우저 기본 confirm/alert 미사용.
 *  - ESC 로 닫기, 바깥 클릭으로 닫기, 포커스 이동, 접근성 속성(role/aria).
 *  - danger 표시 시 확인 버튼이 빨강으로 위험 동작임을 명확히.
 */
import { useEffect, useRef, type ReactNode } from 'react';

export interface MindmapDialogProps {
  open: boolean;
  title: string;
  /** 본문(문구 또는 요소). */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  confirmDisabled?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

export default function MindmapDialog({
  open, title, children, confirmLabel = '확인', cancelLabel = '취소',
  danger = false, confirmDisabled = false, onConfirm, onClose,
}: MindmapDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // 포커스 이동(확인 버튼이 있으면 확인, 아니면 닫기).
    const t = setTimeout(() => {
      if (confirmRef.current) confirmRef.current.focus();
      else (document.querySelector<HTMLButtonElement>('[data-mm-dialog-close]'))?.focus();
    }, 0);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="text-lg font-black text-slate-800 mb-3">{title}</h2>
        {children && <div className="text-sm text-slate-600 leading-relaxed mb-5">{children}</div>}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            data-mm-dialog-close
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              ref={confirmRef}
              type="button"
              disabled={confirmDisabled}
              onClick={onConfirm}
              className={`px-4 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-pink-500 hover:bg-pink-600'}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
