/**
 * 간단한 한국어 토스트. message 가 있으면 하단에 잠깐 표시 후 자동 소멸.
 * 부모가 message 를 끄면(clear) 사라진다.
 */
import { useEffect } from 'react';

export interface MindmapToastProps {
  message: string | null;
  onDone: () => void;
  durationMs?: number;
  tone?: 'info' | 'success' | 'error';
}

export default function MindmapToast({ message, onDone, durationMs = 2600, tone = 'success' }: MindmapToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDone]);

  if (!message) return null;
  const cls = tone === 'error' ? 'bg-red-500' : tone === 'info' ? 'bg-slate-700' : 'bg-emerald-500';
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-8 z-[220] px-4 py-2.5 rounded-full text-white font-bold text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200" role="status" aria-live="polite" style={{ background: undefined }}>
      <span className={`inline-block px-3 py-1 rounded-full ${cls}`}>{message}</span>
    </div>
  );
}
