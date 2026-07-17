/**
 * 학생 마인드맵 편집 페이지.
 *  - 프로젝트 로드(또는 신규 생성) → 자동 저장 · 실행 취소/다시 실행 · 노드 편집.
 *  - 좌측 도구 · 중앙 캔버스(이동/확대/드래그) · 우측 노드 편집 패널.
 *  - 완성 · 친구 공유 · PNG/PDF/인쇄.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Undo2, Redo2, Wand2, LayoutGrid, Eye, CheckCircle2, Share2, Image, FileType, Printer, HelpCircle, Plus, Sparkles, Palette } from 'lucide-react';
import type { MindmapNode, MindmapProject } from '../types/mindmap';
import type { AiPartialAction } from '../types/mindmapAi';
import { MINDMAP_THEMES, MINDMAP_ICONS, getTheme } from '../data/mindmapConfig';
import {
  addNode, autoLayout, checkCompletion, clampDescription, clampTitle, deleteNode as engineDelete,
  getChildren, getNode, newId, reparent,
} from '../utils/mindmapEngine';
import {
  enableShare, getMindmap, revokeShare, saveMindmap,
  generateMindmapFull, generateMindmapPartial, aiResponseToNodes,
} from '../services/mindmapService';
import { exportPng, exportPdf, printMindmap, makeThumbnailDataUrl } from '../utils/mindmapExport';
import MindmapCanvasHost, { type MindmapCanvasHandle } from '../components/mindmap/MindmapCanvasHost';
import MindmapArtwork from '../components/mindmap/MindmapArtwork';
import MindmapRightPanel from '../components/mindmap/MindmapRightPanel';
import MindmapShareDialog from '../components/mindmap/MindmapShareDialog';
import MindmapCompleteDialog from '../components/mindmap/MindmapCompleteDialog';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

export default function StudentMindmapEditorPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [project, setProject] = useState<MindmapProject | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);

  const [past, setPast] = useState<MindmapProject[]>([]);
  const [future, setFuture] = useState<MindmapProject[]>([]);
  const canvasRef = useRef<MindmapCanvasHandle>(null);
  const firstLoadRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedVersion = useRef<number>(0);
  // 최신 project 를 이벤트 핸들러에서 안전하게 읽기 위한 미러(동기적 커밋에 사용).
  const projectRef = useRef<MindmapProject | null>(null);
  useEffect(() => { projectRef.current = project; }, [project]);

  // ---- 로드 ----
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!projectId) { setLoadError('잘못된 접근이에요.'); return; }
      try {
        const p = await getMindmap(projectId);
        if (cancelled) return;
        if (!p) { setLoadError('작품을 불러오지 못했어요.'); return; }
        setProject(p);
        lastSavedVersion.current = p.version;
        setSaveStatus('saved');
      } catch {
        if (!cancelled) setLoadError('작품을 불러오는 중 문제가 생겼어요.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [projectId]);

  // ---- 자동 저장(디바운스). 첫 로드 시엔 저장하지 않는다. ----
  useEffect(() => {
    if (!project) return;
    if (firstLoadRef.current) { firstLoadRef.current = false; return; }
    setSaveStatus('saving');
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(async () => {
      if (!project) return;
      const online = navigator.onLine;
      if (!online) { setSaveStatus('offline'); return; }
      try {
        const saved = await saveMindmap(project);
        if (saved) { lastSavedVersion.current = saved.version; setSaveStatus('saved'); }
        else setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 1200);
    return () => { if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current); };
  }, [project]);

  // ---- 커밋(히스토리Push) ----
  const commit = useCallback((updater: (prev: MindmapProject) => MindmapProject) => {
    const prev = projectRef.current;
    if (!prev) return;
    const next = updater(prev);
    projectRef.current = next;
    setPast((p) => [...p, prev].slice(-60));
    setFuture([]);
    setProject(next);
  }, []);
  const liveUpdate = useCallback((updater: (prev: MindmapProject) => MindmapProject) => {
    setProject((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      projectRef.current = next;
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const last = past[past.length - 1];
    const cur = projectRef.current;
    projectRef.current = last;
    setPast(past.slice(0, -1));
    if (cur) setFuture((f) => [...f, cur]);
    setProject(last);
  }, [past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const cur = projectRef.current;
    projectRef.current = next;
    setFuture(future.slice(0, -1));
    if (cur) setPast((p) => [...p, cur]);
    setProject(next);
  }, [future]);

  // ---- 노드 변경 ----
  const updateNode = useCallback((id: string, patch: Partial<MindmapNode>) => {
    commit((p) => ({ ...p, nodes: p.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  }, [commit]);

  const setTitle = (id: string, title: string) => updateNode(id, { title: clampTitle(title) });

  const addChild = useCallback((parentId: string, type: MindmapNode['type']) => {
    commit((p) => {
      const res = addNode(p.nodes, { parentId, type, title: '', createdBy: 'student' });
      if (!res.node) { setAiMsg(res.reason || '추가하지 못했어요.'); return p; }
      setSelectedId(res.node.id);
      setEditingId(res.node.id);
      return { ...p, nodes: res.nodes };
    });
  }, [commit]);

  const handleDelete = useCallback((id: string) => {
    const node = project?.nodes.find((n) => n.id === id);
    if (!node) return;
    const hasChildren = getChildren(project!.nodes, id).length > 0;
    let mode: 'cascade' | 'lift' = 'cascade';
    if (hasChildren) {
      const choice = confirm('이 가지 아래 내용도 함께 지울까요?\n\n[확인] = 하위 가지까지 삭제\n[취소] = 하위 가지는 살려두고 이 가지만 삭제');
      if (choice === undefined) return;
      mode = choice ? 'cascade' : 'lift';
    } else {
      if (!confirm('이 가지를 지울까요?')) return;
    }
    commit((p) => {
      const next = engineDelete(p.nodes, id, mode);
      return { ...p, nodes: next };
    });
    setSelectedId(null);
  }, [project, commit]);

  const handleReparent = useCallback((id: string, newParentId: string | null) => {
    commit((p) => {
      const res = reparent(p.nodes, id, newParentId);
      if (!res.ok) { setAiMsg(res.reason || '옮기지 못했어요.'); return p; }
      return { ...p, nodes: res.nodes };
    });
  }, [commit]);

  const handleClone = useCallback((id: string) => {
    commit((p) => {
      const node = getNode(p.nodes, id);
      if (!node) return p;
      const res = addNode(p.nodes, {
        parentId: node.parentId ?? p.nodes.find((n) => n.type === 'central')?.id ?? '',
        type: node.type === 'main' ? 'main' : 'sub',
        title: node.title + ' 복사',
        description: node.description,
        icon: node.icon,
        colorKey: node.colorKey,
        createdBy: 'student',
      });
      if (!res.node) return p;
      setSelectedId(res.node.id);
      return { ...p, nodes: res.nodes };
    });
  }, [commit]);

  const handleAutoArrange = useCallback(() => {
    commit((p) => ({ ...p, nodes: autoLayout(p.nodes) }));
    setTimeout(() => canvasRef.current?.fit(), 50);
  }, [commit]);

  const handleTheme = useCallback((themeId: string) => {
    commit((p) => ({ ...p, themeId }));
  }, [commit]);

  // ---- 노드 드래그 ----
  const onNodeDragStartCb = useCallback(() => {
    const prev = projectRef.current;
    if (!prev) return;
    setPast((p) => [...p, prev].slice(-60));
    setFuture([]);
  }, []);
  const onNodeDragMoveCb = useCallback((id: string, x: number, y: number) => {
    liveUpdate((p) => ({ ...p, nodes: p.nodes.map((n) => (n.id === id ? { ...n, position: { x: Math.round(x), y: Math.round(y) } } : n)) }));
  }, [liveUpdate]);
  const onNodeDragEndCb = useCallback(() => { /* autosave effect 처리 */ }, []);

  // ---- AI 전체 생성 ----
  const handleAiFull = useCallback(async () => {
    if (!project) return;
    setAiLoading(true); setAiMsg(null);
    try {
      const central = project.nodes.find((n) => n.type === 'central');
      const res = await generateMindmapFull({
        grade: project.grade, subject: project.subject, semester: project.semester,
        unitTitle: project.unitTitle, centralTopic: project.centralTopic || project.unitTitle,
      });
      if (!res.data) { setAiMsg(res.message || 'AI 가 만들지 못했어요.'); return; }
      commit((p) => {
        const nodes = aiResponseToNodes(res.data!, central);
        // 학생 '나의 생각' 틀 1개 보존/추가.
        const hasStudentThought = nodes.some((n) => n.type === 'thought' && n.createdBy === 'student');
        const centralNode = nodes.find((n) => n.type === 'central')!;
        const finalNodes = hasStudentThought ? nodes : [
          ...nodes,
          { id: newId('thought'), parentId: centralNode.id, type: 'thought' as const, title: '', description: '새롭게 알게 된 점을 적어 보세요.', icon: 'pencil', shape: 'rounded' as const, colorKey: 'thought', position: { x: 0, y: 0 }, order: 99, collapsed: false, createdBy: 'student' as const },
        ];
        return { ...p, nodes: autoLayout(finalNodes), centralTopic: res.data!.centralTopic || p.centralTopic };
      });
      setTimeout(() => canvasRef.current?.fit(), 80);
    } finally {
      setAiLoading(false);
    }
  }, [project, commit]);

  // ---- AI 부분(선택 노드) ----
  const handleAiPartial = useCallback(async (action: AiPartialAction) => {
    if (!project || !selectedId) { setAiMsg('노드를 먼저 선택해 주세요.'); return; }
    const node = getNode(project.nodes, selectedId);
    if (!node) return;
    setAiLoading(true); setAiMsg(null);
    try {
      const central = project.nodes.find((n) => n.type === 'central');
      const branch = node.type === 'main' ? node : (node.parentId ? getNode(project.nodes, node.parentId) : undefined);
      const res = await generateMindmapPartial({
        action,
        nodeTitle: node.title,
        nodeDescription: node.description,
        centralTopic: central?.title,
        branchTitle: branch?.title,
        grade: project.grade, subject: project.subject, unitTitle: project.unitTitle,
      });
      if (!res.data) { setAiMsg(res.message || 'AI 가 추천하지 못했어요.'); return; }
      commit((p) => {
        let nodes = p.nodes;
        if (res.data!.suggestedDescription) {
          nodes = nodes.map((n) => n.id === node.id ? { ...n, description: clampDescription(res.data!.suggestedDescription!) } : n);
        }
        for (const c of res.data!.children || []) {
          const r = addNode(nodes, { parentId: node.id, type: node.type === 'sub' ? 'sub' : 'sub', title: c.title, description: c.description, icon: c.icon, colorKey: node.colorKey, createdBy: 'ai' });
          if (r.node) nodes = r.nodes;
        }
        return { ...p, nodes: autoLayout(nodes) };
      });
      setTimeout(() => canvasRef.current?.fit(), 80);
    } finally {
      setAiLoading(false);
    }
  }, [project, selectedId, commit]);

  // ---- 완성 ----
  const handleComplete = useCallback(() => {
    commit((p) => ({ ...p, status: 'completed' as const }));
    setShowComplete(false);
    setAiMsg('🎉 완성했어요! 이제 친구에게 공유할 수 있어요.');
  }, [commit]);

  // ---- 공유 ----
  const shareUrl = project?.shareSlug ? `${window.location.origin}/mindmap/share/${project.shareSlug}` : null;
  const handleEnableShare = useCallback(async () => {
    if (!project) return;
    setIsEnabling(true);
    try {
      const el = canvasRef.current?.getWorldEl();
      let thumb: string | null = null;
      if (el) { try { thumb = await makeThumbnailDataUrl(el); } catch { thumb = null; } }
      const updated = await enableShare(project, thumb);
      commit(() => updated);
    } finally {
      setIsEnabling(false);
    }
  }, [project, commit]);
  const handleRevokeShare = useCallback(async () => {
    if (!project) return;
    const updated = await revokeShare(project);
    commit(() => updated);
    setShowShare(false);
  }, [project, commit]);

  // ---- 내보내기 ----
  const doExport = useCallback(async (kind: 'png' | 'pdf' | 'print') => {
    const el = canvasRef.current?.getWorldEl();
    if (!el || !project) return;
    setShowExport(false);
    try {
      if (kind === 'png') await exportPng(el, project.title);
      else if (kind === 'pdf') await exportPdf(el, project.title);
      else await printMindmap(el, project.title);
    } catch (e) {
      console.error('[mindmap] export failed', e);
      setAiMsg('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }, [project]);

  const selectedNode = useMemo(() => (project && selectedId ? getNode(project.nodes, selectedId) : undefined), [project, selectedId]);

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="text-5xl mb-3">😢</div>
        <p className="text-slate-700 font-bold mb-4">{loadError}</p>
        <button onClick={() => navigate('/student/mypage')} className="px-5 py-2 rounded-full bg-pink-500 text-white font-bold">작품함으로</button>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">🧠</div>
          <p className="text-slate-500 font-bold">마인드맵을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const completion = checkCompletion(project);

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-100 overflow-hidden">
      {/* 상단 도구 모음 */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 flex-wrap z-30">
        <button onClick={() => navigate('/student/mypage')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="뒤로"><ArrowLeft className="w-5 h-5" /></button>
        <input
          value={project.title}
          maxLength={40}
          onChange={(e) => liveUpdate((p) => ({ ...p, title: e.target.value.slice(0, 40) }))}
          className="font-bold text-slate-800 bg-transparent border border-transparent hover:border-slate-200 focus:border-pink-300 rounded-lg px-2 py-1 text-sm min-w-[120px] max-w-[200px] focus:outline-none"
        />
        <SaveStatusBadge status={saveStatus} />
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <button onClick={undo} disabled={past.length === 0} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30" title="실행 취소"><Undo2 className="w-5 h-5" /></button>
        <button onClick={redo} disabled={future.length === 0} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-30" title="다시 실행"><Redo2 className="w-5 h-5" /></button>
        <button onClick={handleAutoArrange} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="자동 정렬"><LayoutGrid className="w-5 h-5" /></button>
        <button onClick={() => canvasRef.current?.fit()} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="화면 맞춤"><Eye className="w-5 h-5" /></button>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => handleAiFull()} disabled={aiLoading} className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 disabled:opacity-60 flex items-center gap-1">
            <Wand2 className="w-4 h-4" /> {aiLoading ? '만드는 중...' : 'AI 전체 만들기'}
          </button>
          <div className="relative">
            <button onClick={() => setShowExport((s) => !s)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="저장/인쇄"><Image className="w-5 h-5" /></button>
            {showExport && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExport(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 py-1 w-40 z-50 text-sm">
                  <button onClick={() => doExport('png')} className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"><Image className="w-4 h-4 text-slate-400" /> PNG 저장</button>
                  <button onClick={() => doExport('pdf')} className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"><FileType className="w-4 h-4 text-slate-400" /> PDF 저장</button>
                  <button onClick={() => doExport('print')} className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"><Printer className="w-4 h-4 text-slate-400" /> 인쇄</button>
                </div>
              </>
            )}
          </div>
          <button onClick={() => setShowPreview(true)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 flex items-center gap-1"><Eye className="w-4 h-4" /> 미리보기</button>
          <button onClick={() => setShowComplete(true)} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 ${project.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}><CheckCircle2 className="w-4 h-4" /> 완성</button>
          <button onClick={() => setShowShare(true)} className="px-3 py-1.5 rounded-lg bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 flex items-center gap-1"><Share2 className="w-4 h-4" /> 친구에게 공유</button>
        </div>
      </header>

      {aiMsg && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 text-amber-700 text-sm px-4 py-1.5 flex items-center justify-between">
          <span>{aiMsg}</span>
          <button onClick={() => setAiMsg(null)} className="text-amber-500 font-bold">✕</button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        {/* 좌측 도구 */}
        <aside className="w-[140px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto student-scrollbar p-2 hidden md:block">
          <button onClick={() => { const c = project.nodes.find((n) => n.type === 'central'); if (c) addChild(c.id, 'main'); }} className="w-full mb-1.5 p-2 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold hover:bg-sky-100 flex flex-col items-center gap-1">
            <Plus className="w-4 h-4" /> 큰 가지 추가
          </button>
          <button onClick={() => { if (selectedNode) addChild(selectedNode.id, 'sub'); else { const c = project.nodes.find((n) => n.type === 'central'); if (c) addChild(c.id, 'main'); } }} className="w-full mb-1.5 p-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 flex flex-col items-center gap-1">
            <Plus className="w-4 h-4" /> 작은 가지 추가
          </button>
          <button onClick={() => handleAiFull()} disabled={aiLoading} className="w-full mb-1.5 p-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 disabled:opacity-50 flex flex-col items-center gap-1">
            <Wand2 className="w-4 h-4" /> AI 전체 만들기
          </button>
          <button onClick={() => { if (selectedNode) handleAiPartial('add_children'); else setAiMsg('노드를 먼저 선택해 주세요.'); }} disabled={aiLoading} className="w-full mb-1.5 p-2 rounded-xl bg-pink-50 text-pink-700 text-xs font-bold hover:bg-pink-100 disabled:opacity-50 flex flex-col items-center gap-1">
            <Sparkles className="w-4 h-4" /> AI 내용 추천
          </button>

          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 px-1 mb-1 flex items-center gap-1"><Palette className="w-3 h-3" /> 테마</div>
            <div className="grid grid-cols-3 gap-1">
              {MINDMAP_THEMES.map((t) => (
                <button key={t.id} onClick={() => handleTheme(t.id)} title={t.name} className={`aspect-square rounded-lg text-lg flex items-center justify-center border-2 ${project.themeId === t.id ? 'border-pink-400' : 'border-transparent hover:border-slate-200'}`} style={{ background: getTheme(t.id).palette.background }}>
                  {t.emoji}
                </button>
              ))}
            </div>
          </div>

          {selectedNode && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 px-1 mb-1">아이콘</div>
              <div className="grid grid-cols-4 gap-1 max-h-44 overflow-y-auto student-scrollbar">
                {MINDMAP_ICONS.map((ic) => (
                  <button key={ic.key} onClick={() => updateNode(selectedNode.id, { icon: ic.key })} title={ic.label} className={`aspect-square rounded-md text-base flex items-center justify-center ${selectedNode.icon === ic.key ? 'bg-pink-100 ring-1 ring-pink-300' : 'hover:bg-slate-100'}`}>{ic.emoji}</button>
                ))}
                <button onClick={() => updateNode(selectedNode.id, { icon: undefined })} title="아이콘 없음" className="aspect-square rounded-md text-xs text-slate-400 hover:bg-slate-100 flex items-center justify-center">✕</button>
              </div>
            </div>
          )}

          <button onClick={() => setShowHelp(true)} className="w-full mt-2 p-2 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-50 flex flex-col items-center gap-1">
            <HelpCircle className="w-4 h-4" /> 도움말
          </button>
        </aside>

        {/* 중앙 캔버스 */}
        <main className="flex-1 min-w-0 relative">
          <MindmapCanvasHost
            canvasRef={canvasRef}
            project={project}
            themeId={project.themeId}
            selectedId={selectedId}
            editingId={editingId}
            onSelectNode={setSelectedId}
            onNodeDoubleClick={(id) => setEditingId(id)}
            onAddChild={(pid) => { const parent = getNode(project.nodes, pid); addChild(pid, parent?.type === 'central' ? 'main' : 'sub'); }}
            onTitleChange={setTitle}
            onFinishEditing={() => setEditingId(null)}
            onNodeDragStart={onNodeDragStartCb}
            onNodeDragMove={onNodeDragMoveCb}
            onNodeDragEnd={onNodeDragEndCb}
          />
          {completion.ok && project.status !== 'completed' && (
            <div className="absolute left-1/2 -translate-x-1/2 top-3 bg-white/90 backdrop-blur border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shadow z-20">
              🌟 완성 조건을 갖췄어요! 상단 “완성”을 눌러보세요.
            </div>
          )}
        </main>

        {/* 우측 패널 */}
        <MindmapRightPanel
          project={project}
          selectedNode={selectedNode}
          aiLoading={aiLoading}
          onUpdateNode={updateNode}
          onAddChild={addChild}
          onAiPartial={handleAiPartial}
          onReparent={handleReparent}
          onClone={handleClone}
          onDelete={handleDelete}
        />
      </div>

      {showShare && project && (
        <MindmapShareDialog
          project={project}
          shareUrl={shareUrl}
          isEnabling={isEnabling}
          onEnable={handleEnableShare}
          onRevoke={handleRevokeShare}
          onClose={() => setShowShare(false)}
        />
      )}
      {showComplete && project && (
        <MindmapCompleteDialog project={project} onConfirm={handleComplete} onClose={() => setShowComplete(false)} />
      )}
      {showPreview && project && (
        <PreviewModal project={project} onClose={() => setShowPreview(false)} />
      )}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

function SaveStatusBadge({ status }: { status: SaveStatus }) {
  const map: Record<SaveStatus, { text: string; cls: string }> = {
    idle: { text: '', cls: '' },
    saving: { text: '저장 중...', cls: 'text-slate-500 bg-slate-100' },
    saved: { text: '저장했어요', cls: 'text-emerald-600 bg-emerald-50' },
    error: { text: '저장하지 못했어요', cls: 'text-red-500 bg-red-50' },
    offline: { text: '인터넷 연결을 확인해 주세요', cls: 'text-amber-600 bg-amber-50' },
  };
  if (status === 'idle') return null;
  const m = map[status];
  return <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${m.cls}`}>{m.text}</span>;
}

function PreviewModal({ project, onClose }: { project: MindmapProject; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">미리보기</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-50" ref={ref}>
          <div style={{ transform: 'scale(0.62)', transformOrigin: 'top center' }}>
            <MindmapArtworkStatic project={project} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-700">✕</button>
        <h2 className="text-lg font-black text-slate-800 mb-3">사용 방법</h2>
        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
          <li>중심 주제를 두 번 눌러 고쳐요.</li>
          <li>“AI 전체 만들기” 로 풍성하게 시작해요.</li>
          <li>노드를 선택하고 + 로 가지를 늘려요.</li>
          <li>노드를 끌어서 옮기고, 마우스 휠로 확대해요.</li>
          <li>오른쪽에서 색·모양·아이콘·설명을 꾸며요.</li>
          <li>“나의 생각”을 직접 적고 완성해요.</li>
          <li>완성하면 친구에게 공유할 수 있어요!</li>
        </ul>
      </div>
    </div>
  );
}

// 정적(읽기 전용) 아트워크 래핑 컴포넌트.
function MindmapArtworkStatic({ project }: { project: MindmapProject }) {
  return <MindmapArtwork project={project} themeId={project.themeId} interactive={false} showCharacters />;
}
