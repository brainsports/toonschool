import { ChevronLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import MindmapWorksSection from '../components/mindmap/MindmapWorksSection';
import StudentPageShell from '../components/layout/StudentPageShell';

export default function StudentMindmapListPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  return (
    <StudentPageShell bgVariant="pastel" maxWidth="2xl">
      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/student/mypage')} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm" aria-label="내 작품으로 돌아가기">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800">내 툰마인드</h1>
              <p className="text-sm font-bold text-slate-500">만든 작품과 선생님 피드백을 한곳에서 살펴봐요.</p>
            </div>
          </div>
          <button onClick={() => navigate('/student/mindmap')} className="flex min-h-12 items-center gap-2 rounded-full bg-purple-500 px-6 font-black text-white shadow-lg shadow-purple-200">
            <Plus className="h-5 w-5" /> 툰마인드 만들기
          </button>
        </header>
        <MindmapWorksSection studentId={profile?.id ?? user?.id ?? ''} />
      </main>
    </StudentPageShell>
  );
}
