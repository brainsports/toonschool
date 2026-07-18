import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download, Maximize2, Minus, Plus, Printer, Save } from 'lucide-react';
import MindmapArtwork, { POSTER_H, POSTER_W } from '../../student/components/mindmap/MindmapArtwork';
import {
  EVALUATION_RUBRICS,
  MINDMAP_STATUS_LABELS,
  QUICK_PRAISE,
  QUICK_REVISION,
  getMindmapEvaluations,
  listTeacherMindmaps,
  saveMindmapEvaluation,
  scoreMessage,
} from '../../student/services/mindmapEvaluationService';
import { getMindmap } from '../../student/services/mindmapService';
import type { MindmapProject } from '../../student/types/mindmap';
import type { MindmapEvaluation, MindmapNodeFeedback, TeacherMindmapItem } from '../../student/types/mindmapEvaluation';
import { exportPdf, exportPng, printMindmap } from '../../student/utils/mindmapExport';
import { useAuth } from '../../../shared/contexts/AuthContext';

type ScoreKey = 'understandingScore' | 'connectionScore' | 'detailScore' | 'accuracyScore' | 'presentationScore';
const scoreKeys: ScoreKey[] = ['understandingScore', 'connectionScore', 'detailScore', 'accuracyScore', 'presentationScore'];

export default function MindmapEvaluationPage() {
  const { mindmapId = '' } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const artRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<MindmapProject | null>(null);
  const [item, setItem] = useState<TeacherMindmapItem | null>(null);
  const [history, setHistory] = useState<MindmapEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.72);
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    understandingScore: 15, connectionScore: 15, detailScore: 15, accuracyScore: 15, presentationScore: 15,
  });
  const [feedback, setFeedback] = useState('');
  const [nodeFeedback, setNodeFeedback] = useState<MindmapNodeFeedback[]>([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [nodeText, setNodeText] = useState('');
  const [excellent, setExcellent] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTeacherMindmaps(), getMindmap(mindmapId), getMindmapEvaluations(mindmapId)])
      .then(([items, loadedProject, evaluations]) => {
        if (cancelled) return;
        const scoped = items.find((candidate) => candidate.id === mindmapId);
        if (!scoped || !loadedProject) throw new Error('담당 학생의 작품만 열 수 있습니다.');
        setItem(scoped);
        setProject(loadedProject);
        setHistory(evaluations);
        const latest = evaluations[0];
        if (latest) {
          setScores({
            understandingScore: latest.understandingScore,
            connectionScore: latest.connectionScore,
            detailScore: latest.detailScore,
            accuracyScore: latest.accuracyScore,
            presentationScore: latest.presentationScore,
          });
          setFeedback(latest.teacherFeedback);
          setNodeFeedback(latest.nodeFeedback);
          setExcellent(latest.excellentPraise);
        }
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : '작품을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [mindmapId]);

  const total = useMemo(() => scoreKeys.reduce((sum, key) => sum + scores[key], 0), [scores]);
  const editable = item ? ['submitted', 'pending_review', 'resubmitted'].includes(item.status) : false;

  function setAllCollapsed(collapsed: boolean) {
    setProject((current) => current ? { ...current, nodes: current.nodes.map((node) => node.type === 'central' ? node : { ...node, collapsed }) } : current);
  }

  function addNodeFeedback() {
    const node = project?.nodes.find((candidate) => candidate.id === selectedNode);
    if (!node || !nodeText.trim() || !profile?.id) return;
    setNodeFeedback((current) => [...current.filter((entry) => entry.nodeId !== node.id), {
      nodeId: node.id,
      nodeTitle: node.title,
      content: nodeText.trim(),
      authorId: profile.id,
      createdAt: new Date().toISOString(),
    }]);
    setNodeText('');
  }

  async function save(status: 'evaluated' | 'revision_requested') {
    if (!item) return;
    setSaving(true);
    try {
      const saved = await saveMindmapEvaluation({
        mindmapId: item.id,
        status,
        ...scores,
        feedback,
        nodeFeedback,
        excellentPraise: excellent,
      });
      setHistory((current) => [saved, ...current.filter((entry) => entry.id !== saved.id)]);
      setItem((current) => current ? { ...current, status, evaluation: saved } : current);
      alert(status === 'evaluated' ? '평가를 완료했습니다.' : '학생에게 수정 요청을 보냈습니다.');
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : '평가를 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  }

  async function exportArt(kind: 'png' | 'pdf' | 'print') {
    if (!artRef.current || !project) return;
    if (kind === 'png') await exportPng(artRef.current, project.title);
    else if (kind === 'pdf') await exportPdf(artRef.current, project.title);
    else await printMindmap(artRef.current, project.title);
  }

  if (loading) return <PageState text="마인드맵과 평가 이력을 불러오는 중입니다..." />;
  if (error || !project || !item) return <PageState text={error || '작품이 없습니다.'} error />;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/admin/lms/mindmaps')} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-pink-500">
        <ChevronLeft className="h-4 w-4" /> 마인드맵 관리로
      </button>
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-800">{item.centralTopic}</h1>
            <p className="mt-1 text-sm text-slate-500">{item.studentName} · {item.className} · {item.subject} {item.semester}학기 · {item.unitTitle}</p>
          </div>
          <span className="rounded-full bg-purple-50 px-3 py-2 text-xs font-black text-purple-700">{MINDMAP_STATUS_LABELS[item.status]}</span>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <section ref={frameRef} className="min-w-0 overflow-hidden rounded-2xl bg-slate-900 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-3 text-white">
            <Tool onClick={() => setZoom((value) => Math.min(1.4, value + 0.1))}><Plus className="h-4 w-4" /> 확대</Tool>
            <Tool onClick={() => setZoom((value) => Math.max(0.35, value - 0.1))}><Minus className="h-4 w-4" /> 축소</Tool>
            <Tool onClick={() => setZoom(0.72)}>화면 맞춤</Tool>
            <Tool onClick={() => frameRef.current?.requestFullscreen()}><Maximize2 className="h-4 w-4" /> 전체 화면</Tool>
            <Tool onClick={() => setAllCollapsed(false)}>가지 펼치기</Tool>
            <Tool onClick={() => setAllCollapsed(true)}>가지 접기</Tool>
            <Tool onClick={() => void exportArt('png')}><Download className="h-4 w-4" /> 이미지</Tool>
            <Tool onClick={() => void exportArt('pdf')}>PDF</Tool>
            <Tool onClick={() => void exportArt('print')}><Printer className="h-4 w-4" /> 인쇄</Tool>
          </div>
          <div className="h-[64vh] min-h-[480px] overflow-auto bg-slate-100 p-4">
            <div className="mx-auto origin-top" style={{ width: POSTER_W, transform: `scale(${zoom})`, marginBottom: POSTER_H * (zoom - 1) }}>
              <MindmapArtwork project={project} themeId={project.themeId} mode="fixed" width={POSTER_W} height={POSTER_H} artworkRef={artRef} />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-800">작품 정보</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Info label="제작 방식" value={item.creationMethod === 'ai' ? 'AI 도움' : '직접 만들기'} />
              <Info label="수정 횟수" value={`${project.revisionCount}회`} />
              <Info label="작성 시작일" value={formatDate(project.createdAt)} />
              <Info label="제출일" value={formatDate(project.submittedAt)} />
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-slate-800">평가 기준</h2>
              <div className="text-right"><strong className="text-2xl text-pink-500">{total}</strong><span className="text-sm text-slate-400"> / 100</span><p className="text-xs font-bold text-purple-600">{scoreMessage(total)}</p></div>
            </div>
            <div className="mt-4 space-y-4">
              {EVALUATION_RUBRICS.map((rubric) => {
                const key = rubric.key as ScoreKey;
                return <div key={key}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm font-black text-slate-700">{rubric.label}</p><p className="text-[11px] text-slate-400">{rubric.description}</p></div>
                    <input aria-label={`${rubric.label} 세부 점수`} type="number" min={0} max={20} value={scores[key]} onChange={(e) => setScores((current) => ({ ...current, [key]: Math.max(0, Math.min(20, Number(e.target.value))) }))} className="h-9 w-16 rounded-lg border border-slate-200 text-center font-black" />
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1">{[5, 10, 15, 20].map((score) => <button key={score} onClick={() => setScores((current) => ({ ...current, [key]: score }))} className={`rounded-lg py-2 text-xs font-black ${scores[key] === score ? 'bg-pink-500 text-white' : 'bg-slate-50 text-slate-500'}`}>{score}점</button>)}</div>
                </div>;
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-800">선생님 피드백</h2>
            <div className="mt-3 flex flex-wrap gap-1">{QUICK_PRAISE.map((text) => <Quick key={text} onClick={() => setFeedback((value) => `${value}${value ? '\n' : ''}${text}`)}>{text}</Quick>)}</div>
            <div className="mt-2 flex flex-wrap gap-1">{QUICK_REVISION.map((text) => <Quick key={text} revision onClick={() => setFeedback((value) => `${value}${value ? '\n' : ''}${text}`)}>{text}</Quick>)}</div>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={5} placeholder="학생에게 전할 따뜻하고 구체적인 피드백을 적어 주세요." className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-pink-400" />
            <label className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-600"><input type="checkbox" checked={excellent} onChange={(e) => setExcellent(e.target.checked)} /> 우수 칭찬 보상 보내기 (+30점)</label>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-800">가지별 피드백</h2>
            <select value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)} className="mt-3 min-h-10 w-full rounded-xl border border-slate-200 px-3 text-sm">
              <option value="">피드백을 남길 가지 선택</option>
              {project.nodes.filter((node) => node.type !== 'central').map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
            </select>
            <div className="mt-2 flex gap-2">
              <input value={nodeText} onChange={(e) => setNodeText(e.target.value)} placeholder="이 가지에 대한 안내" className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm" />
              <button onClick={addNodeFeedback} className="rounded-xl bg-purple-500 px-3 text-sm font-bold text-white">추가</button>
            </div>
            <div className="mt-3 space-y-2">{nodeFeedback.map((entry) => <div key={entry.nodeId} className="rounded-xl bg-purple-50 p-3 text-xs"><strong className="text-purple-700">{entry.nodeTitle}</strong><p className="mt-1 text-slate-600">{entry.content}</p></div>)}</div>
          </section>

          {editable && <div className="sticky bottom-3 grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 shadow-xl">
            <button disabled={saving} onClick={() => void save('revision_requested')} className="min-h-12 rounded-xl bg-rose-100 font-black text-rose-600 disabled:opacity-50">수정 요청</button>
            <button disabled={saving} onClick={() => void save('evaluated')} className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-emerald-500 font-black text-white disabled:opacity-50"><Save className="h-4 w-4" /> 평가 완료</button>
          </div>}

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-black text-slate-800">이전 평가 이력</h2>
            <div className="mt-3 space-y-2">{history.length ? history.map((evaluation) => <div key={evaluation.id} className="rounded-xl bg-slate-50 p-3 text-xs"><strong>버전 {evaluation.version} · {evaluation.totalScore}점</strong><span className="float-right text-slate-400">{formatDate(evaluation.evaluatedAt)}</span><p className="mt-1 whitespace-pre-wrap text-slate-500">{evaluation.teacherFeedback || '피드백 없음'}</p></div>) : <p className="text-sm text-slate-400">아직 평가 이력이 없습니다.</p>}</div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Tool({ onClick, children }: { onClick: () => void; children: React.ReactNode }) { return <button onClick={onClick} className="flex min-h-9 items-center gap-1 rounded-lg bg-white/10 px-3 text-xs font-bold hover:bg-white/20">{children}</button>; }
function Quick({ onClick, children, revision }: { onClick: () => void; children: React.ReactNode; revision?: boolean }) { return <button onClick={onClick} className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold ${revision ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>{children}</button>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold text-slate-400">{label}</dt><dd className="mt-1 font-bold text-slate-700">{value}</dd></div>; }
function formatDate(value: string | null) { return value ? new Date(value).toLocaleDateString('ko-KR') : '-'; }
function PageState({ text, error }: { text: string; error?: boolean }) { return <div className={`rounded-2xl bg-white p-16 text-center font-bold ${error ? 'text-rose-500' : 'text-slate-400'}`}>{text}</div>; }
