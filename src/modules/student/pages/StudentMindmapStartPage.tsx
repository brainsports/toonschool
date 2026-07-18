/**
 * 마인드맵 시작 화면.
 * 순서: 학년 → 학기 → 과목 → 단원 → 중심 주제 → 제작 방식(직접/AI).
 * 기존 커리큘럼 데이터(studentCurriculumService)를 재사용하고 중복 생성하지 않는다.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, PenLine, ChevronRight, Wand2, Lightbulb } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { supabase } from '../../../shared/lib/supabase';
import StudentPageShell from '../components/layout/StudentPageShell';
import {
  getStudentGrades,
  getSubjectsByGradeAndSemester,
  getMajorUnitsByGradeSemesterAndSubject,
  getMiddleUnitsByMajorUnit,
} from '../services/studentCurriculumService';
import {
  createMindmap, generateMindmapFull, aiResponseToNodes, saveMindmap,
  generateTopicSuggestions,
} from '../services/mindmapService';
import type { MindmapProject } from '../types/mindmap';

type Grade = { id: string; value: number; label: string };
type Subject = { id: string; name: string; code?: string };
type Major = { id: string; unitNumber: number; unitName: string };
type Middle = { id: string; subunitNumber: number; subunitName: string; subunitSummary?: string };

export default function StudentMindmapStartPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [grades, setGrades] = useState<Grade[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [semester, setSemester] = useState<number>(1);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [major, setMajor] = useState<Major | null>(null);
  const [middles, setMiddles] = useState<Middle[]>([]);
  const [middle, setMiddle] = useState<Middle | null>(null);
  const [centralTopic, setCentralTopic] = useState('');
  const [mode, setMode] = useState<'manual' | 'ai' | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  // 단원(또는 작은 단원)이 선택되면 AI 중심 주제 추천(실패해도 직접 입력은 가능).
  useEffect(() => {
    let cancelled = false;
    const valid = !!(grade && subject && major);
    // 모든 setState 는 비동기 콜백 안에서(동기식 effect 본문 setState 회피).
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (!valid) { setTopics([]); setTopicsError(null); setTopicsLoading(false); return; }
      setTopicsLoading(true); setTopicsError(null); setTopics([]);
      try {
        const res = await generateTopicSuggestions({
          grade: grade!.value, subject: subject!.name, semester,
          unitTitle: major!.unitName, subunitTitle: middle?.subunitName,
        });
        if (!cancelled && res.data && res.data.topics.length) setTopics(res.data.topics.slice(0, 5));
      } catch {
        if (!cancelled) setTopicsError('추천을 불러오지 못했어요. 직접 입력할 수 있어요.');
      } finally {
        if (!cancelled) setTopicsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [grade, subject, major, middle, semester]);

  useEffect(() => {
    getStudentGrades().then(setGrades).catch(() => setGrades([]));
  }, []);

  useEffect(() => {
    if (!grade) return;
    let cancelled = false;
    getSubjectsByGradeAndSemester(grade.value, semester)
      .then((s) => { if (cancelled) return; setSubjects(s); setSubject(null); setMajors([]); setMajor(null); setMiddles([]); setMiddle(null); })
      .catch(() => { if (!cancelled) setSubjects([]); });
    return () => { cancelled = true; };
  }, [grade, semester]);

  useEffect(() => {
    if (!grade || !subject) return;
    let cancelled = false;
    getMajorUnitsByGradeSemesterAndSubject(grade.value, semester, subject.id, subject.code)
      .then((m) => { if (cancelled) return; setMajors(m); setMajor(null); setMiddles([]); setMiddle(null); })
      .catch(() => { if (!cancelled) setMajors([]); });
    return () => { cancelled = true; };
  }, [grade, semester, subject]);

  useEffect(() => {
    if (!major) return;
    let cancelled = false;
    getMiddleUnitsByMajorUnit(major.id)
      .then((m) => { if (cancelled) return; setMiddles(m); setMiddle(null); })
      .catch(() => { if (!cancelled) setMiddles([]); });
    return () => { cancelled = true; };
  }, [major]);

  const canFinish = !!grade && !!subject && !!major && centralTopic.trim().length > 0 && !!mode;

  async function getStudentCtx() {
    const studentId = user?.id ?? '';
    let classId: string | null = profile?.center_id ?? null; // fallback
    let orgId: string | null = profile?.organization_id ?? null;
    try {
      const { data } = await supabase.from('students').select('class_id, organization_id, name').eq('id', studentId).maybeSingle();
      if (data) {
        classId = data.class_id ?? classId;
        orgId = data.organization_id ?? orgId;
      }
    } catch { /* ignore */ }
    return { studentId, classId, orgId, studentName: profile?.name ?? null };
  }

  async function handleStart() {
    if (!user || !grade || !subject || !major || !mode) return;
    setBusy(true); setErr(null);
    try {
      const ctx = await getStudentCtx();
      const unitTitle = middle ? `${major.unitName} - ${middle.subunitName}` : major.unitName;
      const project = await createMindmap({
        studentId: ctx.studentId,
        organizationId: ctx.orgId,
        classId: ctx.classId,
        studentName: ctx.studentName,
        grade: grade.value,
        gradeName: grade.label,
        subject: subject.name,
        subjectCode: subject.code,
        semester,
        unitId: major.id,
        unitTitle,
        centralTopic: centralTopic.trim(),
        title: `${centralTopic.trim()} 마인드맵`,
      });

      if (mode === 'ai') {
        const res = await generateMindmapFull({
          grade: grade.value, subject: subject.name, semester,
          unitTitle: major.unitName, centralTopic: centralTopic.trim(),
        });
        if (res.data) {
          const central = project.nodes.find((n) => n.type === 'central');
          const aiNodes = aiResponseToNodes(res.data, central);
          // 빈 thought 틀은 만들지 않음(에디터에서 '나의 생각 추가'로 직접 입력).
          const updated: MindmapProject = { ...project, nodes: aiNodes, centralTopic: res.data.centralTopic || project.centralTopic };
          await saveMindmap(updated);
        }
      }
      navigate(`/student/mindmap/edit/${project.id}`);
    } catch (e) {
      console.error(e);
      setErr('시작하지 못했어요. 잠시 후 다시 시도해 주세요.');
      setBusy(false);
    }
  }

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="2xl">
      <div className="max-w-2xl mx-auto w-full px-4 py-6">
        <button onClick={() => navigate('/student/mypage')} className="text-sm text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> 작품함으로
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-500 flex items-center justify-center text-xl">🧠</div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">마인드맵 만들기</h1>
          </div>
          <p className="text-slate-500 font-bold mb-6">어떤 내용을 생각지도로 정리해 볼까요?</p>

          {/* 1. 학년 */}
          <Section n={1} title="학년 선택" done={!!grade}>
            <div className="flex flex-wrap gap-2">
              {grades.length === 0 && <Muted>학년을 불러오는 중...</Muted>}
              {grades.map((g) => (
                <Chip key={g.id} active={grade?.id === g.id} onClick={() => setGrade(g)}>{g.label}</Chip>
              ))}
            </div>
          </Section>

          {/* 2. 학기 */}
          <Section n={2} title="학기 선택" done>
            <div className="flex gap-2">
              {[1, 2].map((s) => (
                <Chip key={s} active={semester === s} onClick={() => setSemester(s)}>{s}학기</Chip>
              ))}
            </div>
          </Section>

          {/* 3. 과목 */}
          <Section n={3} title="과목 선택" done={!!grade} disabled={!grade}>
            <div className="flex flex-wrap gap-2">
              {!grade && <Muted>먼저 학년을 골라주세요.</Muted>}
              {subjects.map((s) => (
                <Chip key={s.id} active={subject?.id === s.id} onClick={() => setSubject(s)}>{s.name}</Chip>
              ))}
              {grade && subjects.length === 0 && <Muted>이 학기에 만들 수 있는 과목이 없어요.</Muted>}
            </div>
          </Section>

          {/* 4. 단원 */}
          <Section n={4} title="단원 선택" done={!!subject} disabled={!subject}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {!subject && <Muted>먼저 과목을 골라주세요.</Muted>}
                {majors.map((m) => (
                  <Chip key={m.id} active={major?.id === m.id} onClick={() => setMajor(m)}>{m.unitNumber}. {m.unitName}</Chip>
                ))}
              </div>
              {major && middles.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">작은 단원(선택)</div>
                  <div className="flex flex-wrap gap-2">
                    {middles.map((m) => (
                      <Chip key={m.id} active={middle?.id === m.id} onClick={() => setMiddle(m)}>{m.subunitName}</Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* 5. 중심 주제 */}
          <Section n={5} title="중심 주제 입력" done={!!major} disabled={!major}>
            <input
              value={centralTopic}
              maxLength={40}
              onChange={(e) => setCentralTopic(e.target.value)}
              placeholder={major ? `예: ${major.unitName}` : '단원을 먼저 골라주세요'}
              disabled={!major}
              className="w-full border-2 border-slate-200 focus:border-pink-300 rounded-xl px-4 py-3 font-bold text-slate-700 focus:outline-none disabled:bg-slate-50"
            />
            <div className="text-[11px] text-slate-400 mt-1">마인드맵 한가운데 들어갈 주제를 적어요. 추천을 고르거나 직접 써도 돼요.</div>

            {/* AI 중심 주제 추천 */}
            {major && topicsLoading && (
              <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 font-bold">
                <Lightbulb className="w-4 h-4 animate-pulse" /> 주제를 생각하고 있어요…
              </div>
            )}
            {!topicsLoading && topics.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-bold text-purple-600 mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> AI 추천 주제 (누르면 입력돼요)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topics.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCentralTopic(t)}
                      className={`text-left px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors ${centralTopic === t ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-purple-100 bg-purple-50/50 text-slate-700 hover:border-purple-300'}`}
                    >
                      <span className="mr-1">💡</span>{t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!topicsLoading && topicsError && (
              <div className="mt-3 text-xs text-slate-400">{topicsError}</div>
            )}
          </Section>

          {/* 6. 제작 방식 */}
          <Section n={6} title="제작 방식 선택" done={centralTopic.trim().length > 0} disabled={centralTopic.trim().length === 0}>
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={centralTopic.trim().length === 0}
                onClick={() => setMode('manual')}
                className={`p-4 rounded-2xl border-2 text-left disabled:opacity-50 ${mode === 'manual' ? 'border-pink-400 bg-pink-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <PenLine className="w-6 h-6 text-pink-500 mb-1" />
                <div className="font-bold text-slate-800">직접 만들기</div>
                <div className="text-xs text-slate-500">하나씩 내 손으로 만들어요.</div>
              </button>
              <button
                disabled={centralTopic.trim().length === 0}
                onClick={() => setMode('ai')}
                className={`p-4 rounded-2xl border-2 text-left disabled:opacity-50 ${mode === 'ai' ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <Wand2 className="w-6 h-6 text-purple-500 mb-1" />
                <div className="font-bold text-slate-800">AI와 함께 만들기</div>
                <div className="text-xs text-slate-500">AI가 풍성하게 시작해요.</div>
              </button>
            </div>
          </Section>

          {err && <div className="text-sm text-red-500 font-bold mt-3">{err}</div>}

          <button
            onClick={handleStart}
            disabled={!canFinish || busy}
            className="mt-6 w-full py-3.5 rounded-2xl bg-pink-500 text-white font-black text-lg hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {busy ? (
              <><Sparkles className="w-5 h-5 animate-pulse" /> 마인드맵 시작하는 중...</>
            ) : (
              <>마인드맵 시작하기 <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
          {mode === 'ai' && <p className="text-[11px] text-slate-400 text-center mt-2">AI 생성은 서버 배포 후 실제 동작하며, 지금은 안전한 예시로 미리 볼 수 있어요.</p>}
        </div>
      </div>
    </StudentPageShell>
  );
}

function Section({ n, title, done, disabled, children }: { n: number; title: string; done?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <section className={`mb-5 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>{n}</span>
        <h2 className="font-bold text-slate-700">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-full text-sm font-bold border-2 transition-colors ${active ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300'}`}
    >
      {children}
    </button>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-sm text-slate-400 font-medium">{children}</span>;
}
