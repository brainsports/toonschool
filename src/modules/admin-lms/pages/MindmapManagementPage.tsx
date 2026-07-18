import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Brain, CheckCircle2, Clock3, Download, Search, Send, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  MINDMAP_STATUS_LABELS,
  listTeacherMindmaps,
  saveMindmapEvaluation,
} from '../../student/services/mindmapEvaluationService';
import type { MindmapProjectStatus } from '../../student/types/mindmap';
import type { TeacherMindmapItem } from '../../student/types/mindmapEvaluation';
import { fetchStudentsByTeacher } from '../services/studentService';
import type { Student } from '../types';

type SortKey = 'recent' | 'oldest' | 'name' | 'score-desc' | 'score-asc';
type ViewTab = 'works' | 'stats';

const inputClass = 'min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-pink-400';
const PAGE_NOW = Date.now();

export default function MindmapManagementPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<TeacherMindmapItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ViewTab>('works');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('all');
  const [grade, setGrade] = useState('all');
  const [subject, setSubject] = useState('all');
  const [semester, setSemester] = useState('all');
  const [unit, setUnit] = useState('all');
  const [method, setMethod] = useState('all');
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [works, roster] = await Promise.all([listTeacherMindmaps(), fetchStudentsByTeacher(0)]);
      setItems(works);
      setStudents(roster);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '툰마인드 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const options = useMemo(() => ({
    classes: unique(items.map((item) => [item.classId ?? '', item.className] as const).filter(([id]) => id)),
    grades: unique(items.map((item) => [String(item.grade), `${item.grade}학년`] as const)),
    subjects: unique(items.map((item) => [item.subject, item.subject] as const).filter(([value]) => value)),
    units: unique(items.map((item) => [item.unitId || item.unitTitle, item.unitTitle] as const).filter(([value]) => value)),
  }), [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = items.filter((item) => {
      if (query && !`${item.studentName} ${item.centralTopic}`.toLowerCase().includes(query)) return false;
      if (classId !== 'all' && item.classId !== classId) return false;
      if (grade !== 'all' && String(item.grade) !== grade) return false;
      if (subject !== 'all' && item.subject !== subject) return false;
      if (semester !== 'all' && String(item.semester) !== semester) return false;
      if (unit !== 'all' && (item.unitId || item.unitTitle) !== unit) return false;
      if (method !== 'all' && item.creationMethod !== method) return false;
      if (status !== 'all' && item.status !== status) return false;
      if (date && item.submittedAt?.slice(0, 10) !== date) return false;
      if (onlyMissing && item.submittedAt) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === 'oldest') return time(a.submittedAt) - time(b.submittedAt);
      if (sort === 'name') return a.studentName.localeCompare(b.studentName, 'ko');
      if (sort === 'score-desc') return (b.evaluation?.totalScore ?? -1) - (a.evaluation?.totalScore ?? -1);
      if (sort === 'score-asc') return (a.evaluation?.totalScore ?? 101) - (b.evaluation?.totalScore ?? 101);
      return time(b.submittedAt) - time(a.submittedAt);
    });
  }, [items, search, classId, grade, subject, semester, unit, method, status, date, sort, onlyMissing]);

  const summary = useMemo(() => {
    const weekAgo = PAGE_NOW - 7 * 86_400_000;
    return {
      total: items.length,
      week: items.filter((item) => time(item.submittedAt) >= weekAgo).length,
      pending: items.filter((item) => ['submitted', 'pending_review', 'resubmitted'].includes(item.status)).length,
      revision: items.filter((item) => item.status === 'revision_requested').length,
      evaluated: items.filter((item) => item.status === 'evaluated').length,
      missing: students.filter((student) => !items.some((item) => item.studentId === student.id && item.submittedAt)).length,
    };
  }, [items, students]);

  function toggleAll() {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((item) => item.id)));
  }

  async function requestBulkRevision() {
    if (!bulkFeedback.trim() || selected.size === 0) return;
    setBulkBusy(true);
    try {
      const targets = items.filter((item) => selected.has(item.id) && ['submitted', 'pending_review', 'resubmitted'].includes(item.status));
      await Promise.all(targets.map((item) => saveMindmapEvaluation({
        mindmapId: item.id,
        status: 'revision_requested',
        understandingScore: 0,
        connectionScore: 0,
        detailScore: 0,
        accuracyScore: 0,
        presentationScore: 0,
        feedback: bulkFeedback.trim(),
        nodeFeedback: [],
        excellentPraise: false,
      })));
      setSelected(new Set());
      setBulkFeedback('');
      await load();
    } catch (cause) {
      alert(cause instanceof Error ? cause.message : '공통 피드백을 보내지 못했습니다.');
    } finally {
      setBulkBusy(false);
    }
  }

  function exportWorkbook(mode: 'results' | 'submissions') {
    const rows = filtered.map((item) => mode === 'results' ? {
      학생: item.studentName, 학급: item.className, 과목: item.subject, 단원: item.unitTitle,
      중심주제: item.centralTopic, 상태: MINDMAP_STATUS_LABELS[item.status],
      점수: item.evaluation?.totalScore ?? '', 제출일: formatDate(item.submittedAt),
      피드백: item.evaluation?.teacherFeedback ?? '',
    } : {
      학생: item.studentName, 학급: item.className, 과목: item.subject, 단원: item.unitTitle,
      제출여부: item.submittedAt ? '제출' : '미제출', 제출일: formatDate(item.submittedAt),
      상태: MINDMAP_STATUS_LABELS[item.status],
    });
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, mode === 'results' ? '평가 결과' : '제출 현황');
    XLSX.writeFile(book, mode === 'results' ? '툰마인드_평가결과.xlsx' : '툰마인드_제출현황.xlsx');
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-black text-slate-800">툰마인드 관리</h1>
        <p className="mt-1 text-sm text-slate-500">담당 학급의 제출 작품만 안전하게 확인하고 평가할 수 있습니다.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {([
          ['전체 작품 수', summary.total, Brain, 'text-purple-600 bg-purple-50'],
          ['이번 주 제출 수', summary.week, Send, 'text-sky-600 bg-sky-50'],
          ['확인 대기 수', summary.pending, Clock3, 'text-amber-600 bg-amber-50'],
          ['수정 요청 수', summary.revision, Search, 'text-rose-600 bg-rose-50'],
          ['평가 완료 수', summary.evaluated, CheckCircle2, 'text-emerald-600 bg-emerald-50'],
          ['미제출 학생 수', summary.missing, Users, 'text-slate-600 bg-slate-100'],
        ] as const).map(([label, value, Icon, color]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-slate-500">{String(label)}</p>
            <p className="mt-1 text-2xl font-black text-slate-800">{String(value)}</p>
          </div>
        ))}
      </section>

      <div className="flex gap-2 rounded-2xl bg-white p-2 shadow-sm">
        <TabButton active={tab === 'works'} onClick={() => setTab('works')}>작품 목록</TabButton>
        <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}><BarChart3 className="h-4 w-4" /> 통계</TabButton>
      </div>

      {tab === 'stats' ? (
        <Statistics items={items} students={students} />
      ) : (
        <>
          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input aria-label="학생 이름 검색" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="학생 이름 또는 중심 주제 검색" className={inputClass} />
              <Select label="학급" value={classId} onChange={setClassId} options={options.classes} />
              <Select label="학년" value={grade} onChange={setGrade} options={options.grades} />
              <Select label="과목" value={subject} onChange={setSubject} options={options.subjects} />
              <Select label="학기" value={semester} onChange={setSemester} options={[['1', '1학기'], ['2', '2학기']]} />
              <Select label="단원" value={unit} onChange={setUnit} options={options.units} />
              <Select label="제작 방식" value={method} onChange={setMethod} options={[['direct', '직접 만들기'], ['ai', 'AI 도움']]} />
              <Select label="작품 상태" value={status} onChange={setStatus} options={Object.entries(MINDMAP_STATUS_LABELS)} />
              <input aria-label="제출 날짜" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              <Select label="정렬" value={sort} onChange={(value) => setSort(value as SortKey)} options={[
                ['recent', '최근 제출순'], ['oldest', '오래된 제출순'], ['name', '학생 이름순'],
                ['score-desc', '점수 높은순'], ['score-asc', '점수 낮은순'],
              ]} includeAll={false} />
              <label className="flex min-h-10 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-600">
                <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} /> 미제출 학생만 보기
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} />
                {filtered.length}개 작품 · {selected.size}개 선택
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => exportWorkbook('results')} className="flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" /> 평가 결과 엑셀</button>
                <button onClick={() => exportWorkbook('submissions')} className="flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"><Download className="h-4 w-4" /> 제출 현황</button>
              </div>
              {selected.size > 0 && (
                <div className="flex w-full flex-col gap-2 rounded-xl bg-rose-50 p-3 sm:flex-row">
                  <input value={bulkFeedback} onChange={(e) => setBulkFeedback(e.target.value)} placeholder="선택 학생에게 보낼 공통 수정 안내" className={`${inputClass} flex-1`} />
                  <button disabled={bulkBusy || !bulkFeedback.trim()} onClick={requestBulkRevision} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">선택 학생 수정 요청</button>
                </div>
              )}
            </div>
            {loading ? <State text="담당 학급 작품을 불러오는 중입니다..." /> :
             error ? <State text={error} error /> :
             filtered.length === 0 ? <State text="조건에 맞는 툰마인드가 없습니다." /> :
             <MindmapList items={filtered} selected={selected} setSelected={setSelected} onOpen={(id) => navigate(`/admin/lms/mindmaps/${id}`)} />}
          </section>
        </>
      )}
    </div>
  );
}

function MindmapList({ items, selected, setSelected, onOpen }: {
  items: TeacherMindmapItem[]; selected: Set<string>; setSelected: (value: Set<string>) => void; onOpen: (id: string) => void;
}) {
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr>
            <th className="p-3"></th><th>학생</th><th>학년/반</th><th>과목·단원</th><th>중심 주제</th>
            <th>제작</th><th>가지 수</th><th>제출/수정일</th><th>상태</th><th>점수</th><th>관리</th>
          </tr></thead>
          <tbody>{items.map((item) => {
            const { main, sub } = branchCounts(item);
            return <tr key={item.id} className="border-t border-slate-100">
              <td className="p-3"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} /></td>
              <td className="font-bold text-slate-700">{item.studentName}</td><td>{item.className}</td>
              <td>{item.subject}<br/><span className="text-xs text-slate-400">{item.unitTitle}</span></td>
              <td className="max-w-44 truncate font-semibold">{item.centralTopic}</td>
              <td>{item.creationMethod === 'ai' ? 'AI 도움' : '직접 만들기'}</td><td>{main} / {sub}</td>
              <td className="text-xs">{formatDate(item.submittedAt)}<br/><span className="text-slate-400">{formatDate(item.updatedAt)}</span></td>
              <td><StatusBadge status={item.status} /></td><td className="font-black">{item.evaluation?.totalScore ?? '-'}</td>
              <td><button onClick={() => onOpen(item.id)} className="rounded-lg bg-pink-500 px-3 py-2 text-xs font-bold text-white">{item.evaluation ? '피드백 보기' : '보기 · 평가하기'}</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div className="grid gap-3 p-3 lg:hidden">
        {items.map((item) => {
          const { main, sub } = branchCounts(item);
          return <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <label className="flex items-center gap-2 font-black text-slate-800"><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />{item.studentName}</label>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-3 font-bold text-slate-700">{item.centralTopic}</p>
            <p className="mt-1 text-xs text-slate-500">{item.className} · {item.subject} · {item.unitTitle}</p>
            <p className="mt-2 text-xs text-slate-500">{item.creationMethod === 'ai' ? 'AI 도움' : '직접 만들기'} · 1차 {main}개 · 2차 {sub}개 · {formatDate(item.submittedAt)}</p>
            <button onClick={() => onOpen(item.id)} className="mt-4 min-h-11 w-full rounded-xl bg-pink-500 font-bold text-white">보기 · 평가하기</button>
          </article>;
        })}
      </div>
    </>
  );
}

function Statistics({ items, students }: { items: TeacherMindmapItem[]; students: Student[] }) {
  const subjects = groupAverage(items, (item) => item.subject || '미지정');
  const methods = groupCount(items, (item) => item.creationMethod === 'ai' ? 'AI 도움' : '직접 제작');
  const rubric = [
    ['핵심 이해', average(items, 'understandingScore')], ['가지 연결', average(items, 'connectionScore')],
    ['구체성', average(items, 'detailScore')], ['정확성', average(items, 'accuracyScore')],
    ['표현·구성', average(items, 'presentationScore')],
  ] as const;
  return <div className="grid gap-4 lg:grid-cols-2">
    <StatCard title="과목별 평균 점수" values={subjects} suffix="점" />
    <StatCard title="제작 방식 비율" values={methods} suffix="개" />
    <StatCard title="평가 항목별 평균" values={rubric} suffix="점" />
    <StatCard title="최근 4주 제출 추이" values={weekGroups(items)} suffix="개" />
    <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
      <h2 className="font-black text-slate-800">미제출 학생 목록</h2>
      <p className="mt-3 text-sm text-slate-500">{students.filter((student) => !items.some((item) => item.studentId === student.id && item.submittedAt)).map((student) => student.name).join(', ') || '모두 제출했어요.'}</p>
    </div>
  </div>;
}

function StatCard({ title, values, suffix }: { title: string; values: readonly (readonly [string, number])[]; suffix: string }) {
  const max = Math.max(1, ...values.map(([, value]) => value));
  return <div className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-black text-slate-800">{title}</h2>
    <div className="mt-4 space-y-3">{values.map(([label, value]) => <div key={label}>
      <div className="mb-1 flex justify-between text-xs font-bold text-slate-600"><span>{label}</span><span>{value}{suffix}</span></div>
      <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400" style={{ width: `${value / max * 100}%` }} /></div>
    </div>)}</div>
  </div>;
}

function Select({ label, value, onChange, options, includeAll = true }: { label: string; value: string; onChange: (value: string) => void; options: readonly (readonly [string, string])[]; includeAll?: boolean }) {
  return <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
    {includeAll && <option value="all">{label}: 전체</option>}
    {options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}
  </select>;
}
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={`flex min-h-10 items-center gap-1 rounded-xl px-5 text-sm font-black ${active ? 'bg-pink-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{children}</button>;
}
function State({ text, error }: { text: string; error?: boolean }) { return <div className={`p-12 text-center text-sm font-bold ${error ? 'text-rose-500' : 'text-slate-400'}`}>{text}</div>; }
function StatusBadge({ status }: { status: MindmapProjectStatus }) { return <span className="inline-flex rounded-full bg-purple-50 px-2 py-1 text-[11px] font-black text-purple-700">{MINDMAP_STATUS_LABELS[status]}</span>; }
function unique(values: readonly (readonly [string, string])[]) { return [...new Map(values).entries()]; }
function time(value: string | null) { return value ? new Date(value).getTime() : 0; }
function formatDate(value: string | null) { return value ? new Date(value).toLocaleDateString('ko-KR') : '-'; }
function branchCounts(item: TeacherMindmapItem) { return { main: item.nodes.filter((n) => n.type === 'main').length, sub: item.nodes.filter((n) => n.type === 'sub').length }; }
function groupCount(items: TeacherMindmapItem[], key: (item: TeacherMindmapItem) => string): [string, number][] {
  const map = new Map<string, number>(); items.forEach((item) => map.set(key(item), (map.get(key(item)) ?? 0) + 1)); return [...map.entries()];
}
function groupAverage(items: TeacherMindmapItem[], key: (item: TeacherMindmapItem) => string): [string, number][] {
  const map = new Map<string, number[]>(); items.forEach((item) => { if (item.evaluation) map.set(key(item), [...(map.get(key(item)) ?? []), item.evaluation.totalScore]); });
  return [...map].map(([name, values]) => [name, Math.round(values.reduce((a, b) => a + b, 0) / values.length)]);
}
function average(items: TeacherMindmapItem[], key: 'understandingScore' | 'connectionScore' | 'detailScore' | 'accuracyScore' | 'presentationScore') {
  const values = items.map((item) => item.evaluation?.[key]).filter((value): value is number => typeof value === 'number');
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : 0;
}
function weekGroups(items: TeacherMindmapItem[]): [string, number][] {
  return [3, 2, 1, 0].map((offset) => {
    const end = PAGE_NOW - offset * 7 * 86_400_000, start = end - 7 * 86_400_000;
    return [`${4 - offset}주`, items.filter((item) => time(item.submittedAt) >= start && time(item.submittedAt) < end).length];
  });
}
