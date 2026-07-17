/**
 * 완성하기 다이얼로그: 완성 조건 점검 + 완성 저장.
 *  - 중심 주제, 큰 가지 3개 이상, 빈 제목 없음, 학생 작성 '나의 생각' 1개 이상.
 */
import { CheckCircle2, Circle, X } from 'lucide-react';
import type { MindmapProject } from '../../types/mindmap';
import { checkCompletion } from '../../utils/mindmapEngine';

export interface MindmapCompleteDialogProps {
  project: MindmapProject;
  onConfirm: () => void;
  onClose: () => void;
}

export default function MindmapCompleteDialog({ project, onConfirm, onClose }: MindmapCompleteDialogProps) {
  const report = checkCompletion(project);
  const checks = [
    { ok: !!project.nodes.find((n) => n.type === 'central')?.title.trim(), label: '중심 주제가 있어요' },
    { ok: project.nodes.filter((n) => n.type === 'main').length >= 3, label: '큰 가지가 3개 이상이에요' },
    { ok: !project.nodes.some((n) => n.type !== 'central' && !n.title.trim()), label: '제목이 빈 가지가 없어요' },
    {
      ok: project.nodes.some((n) => n.type === 'thought' && n.createdBy === 'student' && n.title.trim().length > 0),
      label: "‘나의 생각’을 1개 이상 직접 적었어요",
    },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700" aria-label="닫기">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-black text-slate-800 mb-1">완성하기</h2>
        <p className="text-sm text-slate-500 mb-4">조건을 모두 지나면 완성할 수 있어요.</p>

        <ul className="space-y-2 mb-5">
          {checks.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              {c.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300" />}
              <span className={c.ok ? 'text-slate-700' : 'text-slate-400'}>{c.label}</span>
            </li>
          ))}
        </ul>

        {!report.ok && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 mb-4">
            {report.missing[0]}
          </div>
        )}

        <button
          disabled={!report.ok}
          onClick={onConfirm}
          className="w-full py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {report.ok ? '🎉 완성하기' : '아직 못 끝내요'}
        </button>
      </div>
    </div>
  );
}
