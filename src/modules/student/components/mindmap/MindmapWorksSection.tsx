/**
 * 학생 작품함 - 마인드맵 섹션.
 * 만화 작품(기존)과 분리해 마인드맵 작품만 보여준다.
 * 카드: 썸네일/제목/과목·단원/상태/공유 표시 + 보기·수정·공유·삭제.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Eye, Share2, Trash2, Image as ImageIcon, Plus, CheckCircle2 } from 'lucide-react';
import { listMyMindmaps, deleteMindmap, getMindmap, type MindmapListItem } from '../../services/mindmapService';
import { exportPng } from '../../utils/mindmapExport';
import MindmapArtwork from './MindmapArtwork';
import type { MindmapProject } from '../../types/mindmap';

export default function MindmapWorksSection({ studentId }: { studentId: string }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<MindmapListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<MindmapProject | null>(null);

  const refresh = () => {
    setLoading(true);
    listMyMindmaps(studentId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    listMyMindmaps(studentId)
      .then((items) => { if (!cancelled) setItems(items); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [studentId]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 마인드맵을 삭제할까요?')) return;
    await deleteMindmap(id, studentId);
    refresh();
  };

  const handleShare = async (item: MindmapListItem) => {
    if (item.status !== 'completed') {
      alert('완성된 마인드맵만 공유할 수 있어요. 에디터에서 완성해 주세요.');
      navigate(`/student/mindmap/edit/${item.id}`);
      return;
    }
    if (item.isPublic && item.shareSlug) {
      const url = `${window.location.origin}/mindmap/share/${item.shareSlug}`;
      if (typeof navigator.share === 'function') {
        try { await navigator.share({ title: `${item.title} - 툰스쿨 마인드맵`, url }); return; } catch { /* fallthrough */ }
      }
      try { await navigator.clipboard.writeText(url); alert('공유 링크를 복사했어요.'); }
      catch { alert('복사하지 못했어요.'); }
    } else {
      navigate(`/student/mindmap/edit/${item.id}`);
    }
  };

  const openPreview = async (id: string) => {
    const p = await getMindmap(id);
    setPreview(p);
  };

  return (
    <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-50 text-purple-500 rounded-lg text-base">🧠</div>
          <h3 className="font-bold text-slate-800">나의 마인드맵</h3>
        </div>
        <button onClick={() => navigate('/student/mindmap')} className="text-xs font-bold text-purple-500 hover:bg-purple-50 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
          <Plus className="w-3 h-3" /> 만들기
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-28"><span className="text-slate-400 font-medium text-sm">불러오는 중...</span></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center bg-purple-50/50 rounded-xl border border-purple-100 border-dashed">
          <span className="text-2xl mb-2">🧠</span>
          <p className="text-slate-600 font-medium mb-3 text-sm">아직 만든 마인드맵이 없어요.</p>
          <button onClick={() => navigate('/student/mindmap')} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> 마인드맵 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col">
              <div className="aspect-[4/3] relative bg-gradient-to-br from-pink-50 to-purple-50 cursor-pointer" onClick={() => openPreview(it.id)}>
                {it.thumbnailUrl ? (
                  <img src={it.thumbnailUrl} alt={it.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🧠</div>
                )}
                <span className="absolute top-1.5 left-1.5 text-[10px] font-bold text-white bg-purple-500 px-1.5 py-0.5 rounded">마인드맵</span>
                {it.isPublic && <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" />공유중</span>}
                {it.status === 'completed' && !it.isPublic && <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-white bg-emerald-500 px-1.5 py-0.5 rounded">완성</span>}
                {it.status !== 'completed' && <span className="absolute bottom-1.5 right-1.5 text-[10px] font-bold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded">만드는 중</span>}
              </div>
              <div className="p-2 flex flex-col gap-1">
                <p className="text-xs font-bold text-slate-700 truncate">{it.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{it.subject}{it.unitTitle ? ` · ${it.unitTitle}` : ''}</p>
                <div className="flex items-center gap-1 mt-1">
                  <IconBtn title="보기" onClick={() => openPreview(it.id)}><Eye className="w-3.5 h-3.5" /></IconBtn>
                  <IconBtn title="수정" onClick={() => navigate(`/student/mindmap/edit/${it.id}`)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
                  <IconBtn title="친구에게 공유" onClick={() => handleShare(it)}><Share2 className="w-3.5 h-3.5" /></IconBtn>
                  <IconBtn title="삭제" danger onClick={() => handleDelete(it.id)}><Trash2 className="w-3.5 h-3.5" /></IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && <PreviewModal project={preview} onClose={() => setPreview(null)} onEdit={() => { navigate(`/student/mindmap/edit/${preview.id}`); }} />}
    </div>
  );
}

function IconBtn({ children, onClick, title, danger }: { children: ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title} className={`flex-1 py-1.5 rounded-md flex items-center justify-center ${danger ? 'text-red-400 hover:bg-red-50' : 'text-slate-500 hover:bg-slate-100'}`}>
      {children}
    </button>
  );
}

function PreviewModal({ project, onClose, onEdit }: { project: MindmapProject; onClose: () => void; onEdit: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const handlePng = async () => {
    const el = ref.current;
    if (!el) return;
    setBusy(true);
    try { await exportPng(el, project.title); } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{project.title}</h3>
            <p className="text-xs text-slate-400 truncate">{project.subject}{project.unitTitle ? ` · ${project.unitTitle}` : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePng} disabled={busy} className="px-3 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-sm font-bold flex items-center gap-1 disabled:opacity-60"><ImageIcon className="w-4 h-4" /> PNG</button>
            <button onClick={onEdit} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 text-sm font-bold flex items-center gap-1"><Pencil className="w-4 h-4" /> 수정</button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl px-2">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-50">
          <div className="flex justify-center" style={{ transform: 'scale(0.6)', transformOrigin: 'top center' }}>
            <MindmapArtwork project={project} themeId={project.themeId} interactive={false} showCharacters worldRef={ref} />
          </div>
        </div>
      </div>
    </div>
  );
}
