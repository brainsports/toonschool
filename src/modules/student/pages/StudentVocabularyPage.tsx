/**
 * 나의 단어장 — 툰어휘사전에서 저장한 단어를 다시 확인하는 화면.
 * 학생 본인의 단어만 조회/삭제(RLS). 검색 · 정렬(최근/가나다) · 상세 열기 · 삭제 지원.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Trash2, ChevronDown, BookOpen, BookMarked, Sparkles } from 'lucide-react';
import StudentPageShell from '../components/layout/StudentPageShell';
import { useAuth } from '../../../shared/contexts/AuthContext';
import {
  getStudentVocabulary,
  deleteVocabularyWord,
} from '../services/vocabularyService';
import type { SavedVocabularyWord, VocabularySourceType } from '../types/vocabulary';

type SortKey = 'recent' | 'alpha';

const SOURCE_LABEL: Record<NonNullable<VocabularySourceType>, string> = {
  mindmap_start: '툰마인드 시작',
  mindmap_editor: '툰마인드 편집',
  comic_editor: '만화 만들기',
};

function sourceLabel(s: VocabularySourceType | null): string {
  return s ? SOURCE_LABEL[s] : '툰어휘사전';
}

function formatSavedDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}월 ${d.getDate()}일에 저장`;
  } catch {
    return '저장됨';
  }
}

export default function StudentVocabularyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id ?? '';

  const [words, setWords] = useState<SavedVocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentVocabulary(studentId, { search, sort });
      setWords(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '단어장을 불러오지 못했어요.');
    } finally {
      setLoading(false);
    }
  }, [studentId, search, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!studentId) return;
      if (deletingId) return; // 중복 클릭 방지
      if (!window.confirm('이 단어를 단어장에서 삭제할까요?')) return;
      setDeletingId(id);
      try {
        await deleteVocabularyWord(studentId, id);
        setWords((prev) => prev.filter((w) => w.id !== id));
      } catch (e) {
        setError(e instanceof Error ? e.message : '삭제하지 못했어요.');
      } finally {
        setDeletingId(null);
      }
    },
    [studentId, deletingId],
  );

  const toggleOpen = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <StudentPageShell bgVariant="pastel" maxWidth="2xl">
      <div className="max-w-3xl mx-auto w-full px-4 py-6">
        <button
          onClick={() => navigate('/student/mypage')}
          className="text-sm text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> 마이페이지로
        </button>

        {/* 헤더 카드 */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-500 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800">나의 단어장</h1>
          </div>
          <p className="text-slate-500 font-bold mb-4">툰어휘사전에서 저장한 단어를 모아뒀어요!</p>

          {/* 검색 + 정렬 */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border-2 border-slate-200 focus-within:border-sky-300 rounded-xl px-3 py-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                value={search}
                maxLength={30}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="단어 찾기"
                className="flex-1 min-w-0 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-400"
              />
              {search ? (
                <button onClick={() => setSearch('')} aria-label="지우기" className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            <div className="flex gap-2">
              {([['recent', '최근순'], ['alpha', '가나다순']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${sort === key ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-sky-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 본문 */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
            <div className="text-slate-400 font-bold">단어장을 불러오는 중...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 rounded-3xl border border-red-100 p-6 text-center">
            <p className="text-red-500 font-bold">{error}</p>
            <button onClick={() => void load()} className="mt-3 text-sm font-bold text-red-500 underline">다시 시도</button>
          </div>
        ) : words.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="flex flex-col gap-3">
            {words.map((w) => (
              <WordCard
                key={w.id}
                word={w}
                open={openId === w.id}
                onToggle={() => toggleOpen(w.id)}
                onDelete={() => void handleDelete(w.id)}
                deleting={deletingId === w.id}
              />
            ))}
          </div>
        )}
      </div>
    </StudentPageShell>
  );
}

function WordCard({
  word,
  open,
  onToggle,
  onDelete,
  deleting,
}: {
  word: SavedVocabularyWord;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* 헤더(항상 표시) */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/60 transition-colors"
      >
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-black text-slate-800 break-keep">{word.word}</span>
            {word.part_of_speech ? (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{word.part_of_speech}</span>
            ) : null}
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{sourceLabel(word.source_type)}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-slate-500 font-bold truncate">{word.dictionary_definition || word.easy_definition || '저장한 단어'}</p>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{formatSavedDate(word.updated_at)}</div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* 상세(펼침) */}
      {open ? (
        <div className="px-4 pb-4 flex flex-col gap-2.5">
          {word.easy_definition ? <Field color="green" label="쉬운 뜻" text={word.easy_definition} /> : null}
          {word.daily_example ? <Field color="pink" label="생활 예문" text={word.daily_example} /> : null}
          {word.subject_example ? <Field color="purple" label="교과 예문" text={word.subject_example} /> : null}
          {word.summary ? <Field color="yellow" label="한마디 정리" text={word.summary} /> : null}
          {word.dictionary_definition ? <Field color="blue" label="사전 뜻" text={word.dictionary_definition} /> : null}

          <div className="flex justify-end pt-1">
            <button
              onClick={onDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" /> {deleting ? '삭제 중...' : '삭제하기'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const FIELD_STYLES: Record<'blue' | 'green' | 'pink' | 'purple' | 'yellow', string> = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-emerald-50 text-emerald-700',
  pink: 'bg-pink-50 text-pink-700',
  purple: 'bg-purple-50 text-purple-700',
  yellow: 'bg-amber-50 text-amber-700',
};

function Field({ color, label, text }: { color: 'blue' | 'green' | 'pink' | 'purple' | 'yellow'; label: string; text: string }) {
  return (
    <div className={`rounded-xl p-3 break-keep ${FIELD_CARD_BG[color]}`}>
      <div className={`inline-block text-[11px] font-black px-2 py-0.5 rounded-full mb-1 ${FIELD_STYLES[color]}`}>{label}</div>
      <p className="text-sm text-slate-700 font-medium leading-relaxed">{text}</p>
    </div>
  );
}

const FIELD_CARD_BG: Record<'blue' | 'green' | 'pink' | 'purple' | 'yellow', string> = {
  blue: 'bg-blue-50/50',
  green: 'bg-emerald-50/50',
  pink: 'bg-pink-50/50',
  purple: 'bg-purple-50/50',
  yellow: 'bg-amber-50/50',
};

function EmptyState({ search }: { search: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-300 flex items-center justify-center mb-3">
        <Sparkles className="w-8 h-8" />
      </div>
      {search ? (
        <p className="text-slate-600 font-black mb-1">찾는 단어가 없어요.</p>
      ) : (
        <>
          <p className="text-slate-600 font-black mb-1">아직 저장한 단어가 없어요.</p>
          <p className="text-slate-400 text-sm font-bold">툰어휘사전에서 궁금한 단어를 저장해 보세요!</p>
        </>
      )}
    </div>
  );
}
