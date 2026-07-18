import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Award, BookOpen, Calendar, ChevronLeft, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { fetchStudentsByTeacher } from '../services/studentService';
import { getTeacherStudentsDream, type StudentDreamRow } from '../services/dreamTeacherService';
import {
  MINDMAP_STATUS_LABELS,
  getStudentMindmapSummary,
  type StudentMindmapSummary,
} from '../../student/services/mindmapEvaluationService';
import {
  GROWTH_AREA_KEYS,
  GROWTH_AREA_LABELS,
  toonmindEvalToAreas,
  type GrowthAreaKey,
} from '../../student/utils/growthAreas';
import type { Student } from '../types';

type Tab = 'growth' | 'comic' | 'toonmind' | 'attendance' | 'praise';

const AREA_COLORS: Record<GrowthAreaKey, string> = {
  understanding: 'bg-pink-500',
  summarizing: 'bg-purple-500',
  expression: 'bg-blue-500',
  problemSolving: 'bg-emerald-500',
  sharing: 'bg-yellow-400',
};

export default function StudentDetailPage() {
  const { studentId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [dream, setDream] = useState<StudentDreamRow | null>(null);
  const [summary, setSummary] = useState<StudentMindmapSummary | null>(null);
  const [tab, setTab] = useState<Tab>('toonmind');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 담당 학생인지 먼저 확인(소유권 격리). 본인 학생 아니면 차단.
        const roster = await fetchStudentsByTeacher(0);
        const found = roster.find((s) => s.id === studentId);
        if (!found) throw new Error('담당 학생만 조회할 수 있습니다.');
        if (cancelled) return;
        setStudent(found);

        const [dreamRows, mindmapSummary] = await Promise.all([
          getTeacherStudentsDream(user?.id ?? '', 0),
          getStudentMindmapSummary(studentId).catch(() => null),
        ]);
        if (cancelled) return;
        setDream(dreamRows.find((row) => row.student.id === studentId) ?? null);
        setSummary(mindmapSummary);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : '학생 정보를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [studentId, user?.id]);

  if (loading) return <PageState text="학생 정보를 불러오는 중입니다..." />;
  if (error || !student) return <PageState text={error || '학생을 찾을 수 없습니다.'} error />;

  const dreamScore = dream?.dreamScore ?? null;
  const level = dream?.level ?? null;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/admin/lms/students')} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-pink-500">
        <ChevronLeft className="h-4 w-4" /> 학생관리로
      </button>

      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-800">{student.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{student.className || `${student.grade}학년`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {level !== null ? (
              <>
                <Badge color="bg-purple-50 text-purple-700">LV.{level} {dream?.chapterTitle}</Badge>
                <Badge color="bg-emerald-50 text-emerald-700">통합 총점 {dreamScore ?? '-'}점</Badge>
                {dream?.pointsToNextLevel != null && <Badge color="bg-sky-50 text-sky-700">다음 레벨까지 {dream.pointsToNextLevel}점</Badge>}
              </>
            ) : (
              <Badge color="bg-slate-100 text-slate-500">레벨 정보 미연동</Badge>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">레벨은 만화·툰마인드·출석·칭찬 등 모든 활동 보상이 합산된 통합 총점으로만 결정됩니다. 툰마인드 전용 레벨은 없습니다.</p>
      </header>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm">
        {([['toonmind', '툰마인드', Brain], ['growth', '성장 기록', Sparkles], ['comic', '만화 작품', BookOpen], ['attendance', '출석', Calendar], ['praise', '칭찬 기록', Award]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex min-h-10 items-center gap-1 rounded-xl px-4 text-sm font-black ${tab === key ? 'bg-pink-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'toonmind' && <ToonMindTab summary={summary} onOpen={(id) => navigate(`/admin/lms/mindmaps/${id}`)} />}
      {tab === 'growth' && <GrowthTab summary={summary} level={level} dreamScore={dreamScore} />}
      {tab === 'comic' && <ComicTab comicCount={null} />}
      {tab === 'attendance' && <AttendanceTab />}
      {tab === 'praise' && <PraiseTab monthlyCount={dream?.monthlyPraiseCount ?? 0} />}
    </div>
  );
}

function ToonMindTab({ summary, onOpen }: { summary: StudentMindmapSummary | null; onOpen: (id: string) => void }) {
  if (!summary) return <Card><p className="text-sm text-slate-400">툰마인드 활동을 불러오지 못했어요.</p></Card>;
  const stats: [string, number | string | null][] = [
    ['전체 작품 수', summary.totalCount],
    ['평균 평가 점수', summary.averageScore !== null ? `${summary.averageScore}점` : '-'],
    ['평가 완료 수', summary.evaluatedCount],
    ['수정 요청 수', summary.revisionRequestedCount],
    ['재제출 수', summary.resubmittedCount],
  ];
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-black text-slate-800">{value}</p>
          </div>
        ))}
      </section>

      {summary.subjectCounts.length > 0 && (
        <Card>
          <h2 className="font-black text-slate-800">과목별 작품 수</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.subjectCounts.map((row) => (
              <span key={row.subject} className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">{row.subject} · {row.count}개</span>
            ))}
          </div>
        </Card>
      )}

      {summary.scoreTrend.length > 1 && (
        <Card>
          <h2 className="font-black text-slate-800">평가 점수 변화</h2>
          <div className="mt-3 flex h-24 items-end gap-2">
            {summary.scoreTrend.map((point, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-gradient-to-t from-pink-400 to-purple-400" style={{ height: `${Math.max(8, (point.totalScore / 100) * 64)}px` }} title={`${point.totalScore}점`} />
                <span className="text-[10px] font-bold text-slate-500">{point.totalScore}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {summary.recentFeedback && (
        <Card>
          <h2 className="font-black text-slate-800">최근 피드백</h2>
          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-purple-50 p-3 text-sm text-slate-700">{summary.recentFeedback}</p>
        </Card>
      )}

      <Card>
        <h2 className="font-black text-slate-800">작품 목록</h2>
        <div className="mt-3 space-y-2">
          {summary.works.length === 0 ? (
            <p className="text-sm text-slate-400">아직 만든 툰마인드가 없어요.</p>
          ) : summary.works.map((work) => (
            <button key={work.id} onClick={() => onOpen(work.id)} className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-700">{work.centralTopic || '제목 없음'}</p>
                <p className="text-xs text-slate-400">{work.subject} · {work.unitTitle} · {work.creationMethod === 'ai' ? 'AI 도움' : '직접 만들기'}</p>
              </div>
              <div className="flex items-center gap-2">
                {work.totalScore !== null && <span className="text-sm font-black text-pink-500">{work.totalScore}점</span>}
                <span className="inline-flex rounded-full bg-purple-50 px-2 py-1 text-[11px] font-black text-purple-700">{MINDMAP_STATUS_LABELS[work.status]}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function GrowthTab({ summary, level, dreamScore }: { summary: StudentMindmapSummary | null; level: number | null; dreamScore: number | null }) {
  // 교사는 학생 만화 평가(student_growth_evaluations)를 RLS 로 읽을 수 없다.
  // 따라서 교사 화면에서는 툰마인드 최신 평가 기반 5대 영역 + 통합 총점/레벨을 보여준다.
  const latestEvaluated = summary?.works.find((w) => w.totalScore !== null) ?? null;
  const areas = useMemo(
    () => (latestEvaluated ? toonmindEvalToAreas(latestEvaluated) : null),
    [latestEvaluated],
  );
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatBox label="현재 레벨" value={level !== null ? `LV.${level}` : '-'} />
        <StatBox label="통합 총점" value={dreamScore !== null ? `${dreamScore}점` : '-'} />
        <StatBox label="최근 툰마인드 평가" value={latestEvaluated?.totalScore !== null && latestEvaluated?.totalScore !== undefined ? `${latestEvaluated.totalScore}점` : '-'} />
      </section>
      <Card>
        <h2 className="font-black text-slate-800">툰마인드 성장 영역 (최근 평가)</h2>
        {areas ? (
          <div className="mt-4 flex flex-col gap-3">
            {GROWTH_AREA_KEYS.map((key) => {
              const raw = areas[key];
              const score = raw ?? 0;
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[13px] font-bold">
                    <span className="text-slate-700">{GROWTH_AREA_LABELS[key]}</span>
                    <span className="text-slate-700">{raw === null ? <span className="text-slate-300">—</span> : score}<span className="text-slate-400 font-medium"> / 20</span></span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${AREA_COLORS[key]}`} style={{ width: `${(score / 20) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">아직 툰마인드 평가 기록이 없어요.</p>
        )}
        <p className="mt-4 text-xs text-slate-400">만화 평가와 툰마인드 평가를 같은 5개 영역으로 옮겨 영역별 평균으로 통합 집계합니다. 만화 평가 영역 점수는 학생 본인의 성장 기록 화면에서 함께 볼 수 있어요.</p>
      </Card>
    </div>
  );
}

function ComicTab({ comicCount }: { comicCount: number | null }) {
  return (
    <Card>
      <h2 className="font-black text-slate-800">만화 작품</h2>
      <p className="mt-3 text-sm text-slate-500">완성한 만화 작품 수: {comicCount ?? '-'}개</p>
      <p className="mt-2 text-xs text-slate-400">만화 작품의 상세 내용과 평가는 각 학생의 마이페이지에서 확인할 수 있어요.</p>
    </Card>
  );
}

function AttendanceTab() {
  return (
    <Card>
      <h2 className="font-black text-slate-800">출석</h2>
      <p className="mt-3 text-sm text-slate-500">출석·연속 출석 점수는 통합 총점에 합산되어 레벨에 반영됩니다.</p>
      <p className="mt-2 text-xs text-slate-400">출석 상세 내역은 학생 화면에서 확인할 수 있어요.</p>
    </Card>
  );
}

function PraiseTab({ monthlyCount }: { monthlyCount: number }) {
  return (
    <Card>
      <h2 className="font-black text-slate-800">칭찬 기록</h2>
      <p className="mt-3 text-sm text-slate-500">이번 달 보낸 칭찬: {monthlyCount}회 (월 3회)</p>
      <p className="mt-2 text-xs text-slate-400">칭찬은 학생에게 50점 꿈점수로 전달되어 통합 총점에 합산됩니다. 칭찬 보내기는 성장 현황 화면에서 할 수 있어요.</p>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl bg-white p-5 shadow-sm">{children}</section>;
}
function StatBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-xl font-black text-slate-800">{value}</p></div>;
}
function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span className={`rounded-full px-3 py-2 text-xs font-black ${color}`}>{children}</span>;
}
function PageState({ text, error }: { text: string; error?: boolean }) {
  return <div className={`rounded-2xl bg-white p-16 text-center font-bold ${error ? 'text-rose-500' : 'text-slate-400'}`}>{text}</div>;
}
