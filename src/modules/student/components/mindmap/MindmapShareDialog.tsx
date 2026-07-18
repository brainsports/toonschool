/**
 * 친구에게 공유하기 다이얼로그.
 *  - 완성된 작품만 공유 가능(초안은 차단).
 *  - share_slug 생성 → 링크 복사 / Web Share API(지원 시 기본 공유창) / 미지원 시 복사.
 *  - 공유 중지(기존 링크 즉시 차단).
 */
import { useState } from 'react';
import { Share2, Copy, Check, X, Link2, AlertCircle } from 'lucide-react';
import type { MindmapProject } from '../../types/mindmap';
import MindmapDialog from './MindmapDialog';

export interface MindmapShareDialogProps {
  project: MindmapProject;
  shareUrl: string | null;
  isEnabling: boolean;
  onEnable: () => Promise<void>;
  onRevoke: () => Promise<void>;
  onClose: () => void;
}

export default function MindmapShareDialog(props: MindmapShareDialogProps) {
  const { project, shareUrl, isEnabling, onEnable, onRevoke, onClose } = props;
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const draft = project.status !== 'completed';

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('복사하지 못했어요. 링크를 직접 복사해 주세요.');
    }
  };

  const handleWebShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.share({
        title: `${project.title} - 툰마인드 | 툰스쿨`,
        text: `${project.subject} ${project.unitTitle ? project.unitTitle + ' ' : ''}툰마인드를 만들었어요. 구경해 줘!`,
        url: shareUrl,
      });
    } catch {
      // 사용자 취소 등은 무시.
    }
  };

  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const handleRevoke = async () => {
    setRevoking(true);
    try {
      await onRevoke();
    } finally {
      setRevoking(false);
      setConfirmRevoke(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700" aria-label="닫기">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Share2 className="w-5 h-5 text-pink-500" />
          <h2 className="text-lg font-black text-slate-800">친구에게 공유하기</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">완성된 툰마인드를 친구에게 보여줘요. 친구는 로그인 없이 볼 수 있어요.</p>

        {draft && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 flex gap-2 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>아직 완성되지 않았어요. 먼저 “완성하기”로 마무리해 주세요.</span>
          </div>
        )}

        {!project.isPublic && !draft && (
          <button
            disabled={isEnabling}
            onClick={() => onEnable().catch(() => setError('공유 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'))}
            className="w-full py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Link2 className="w-5 h-5" />
            {isEnabling ? '공유 링크 만드는 중...' : '공유 링크 만들기'}
          </button>
        )}

        {project.isPublic && shareUrl && (
          <>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-3">
              <div className="text-xs font-bold text-slate-500 mb-1">공유 링크</div>
              <div className="text-sm text-slate-700 break-all font-mono bg-white rounded-lg px-2 py-1.5 border border-slate-200">{shareUrl}</div>
            </div>
            <div className="flex gap-2 mb-3">
              {canShare ? (
                <button onClick={handleWebShare} className="flex-1 py-2.5 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 flex items-center justify-center gap-1">
                  <Share2 className="w-4 h-4" /> 공유하기
                </button>
              ) : null}
              <button onClick={handleCopy} className={`flex-1 py-2.5 rounded-xl border font-bold flex items-center justify-center gap-1 ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                {copied ? <><Check className="w-4 h-4" /> 복사됨</> : <><Copy className="w-4 h-4" /> 링크 복사</>}
              </button>
            </div>
            {!canShare && (
              <p className="text-xs text-slate-400 mb-3">이 기기에서는 기본 공유창을 지원하지 않아요. 링크를 복사해서 카카오톡 등에 붙여넣어 보내요.</p>
            )}
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 mb-3">
              🟢 지금 공유 중이에요. 친구가 링크로 볼 수 있어요.
            </div>
            <button
              disabled={revoking}
              onClick={() => setConfirmRevoke(true)}
              className="w-full py-2 rounded-xl border border-red-200 text-red-500 font-bold hover:bg-red-50 disabled:opacity-60"
            >
              {revoking ? '공유 중지 중...' : '공유 중지하기'}
            </button>
          </>
        )}

        {error && <p className="text-sm text-red-500 mt-3 text-center">{error}</p>}
      </div>
      <MindmapDialog
        open={confirmRevoke}
        title="공유를 중지할까요?"
        confirmLabel="공유 중지하기"
        cancelLabel="취소"
        danger
        confirmDisabled={revoking}
        onConfirm={handleRevoke}
        onClose={() => setConfirmRevoke(false)}
      >
        <p>친구가 가진 링크로 더 이상 이 툰마인드를 볼 수 없어요. 나중에 다시 공유할 수 있어요.</p>
      </MindmapDialog>
    </div>
  );
}
