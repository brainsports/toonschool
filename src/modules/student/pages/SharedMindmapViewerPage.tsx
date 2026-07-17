/**
 * 마인드맵 공유 화면(읽기 전용, 공개).
 *  - 누구나(비로그인) share_slug 로 열람.
 *  - 개인정보(이메일/학급/기관/교사/내부 id) 미노출. 편집·삭제 버튼 없음.
 *  - 공유 중지(is_public=false 또는 share_revoked_at) 시 접근 차단.
 *  - 확대/축소, 화면 맞춤, PNG 저장.
 *  - 동적 OG meta(best-effort): document.title/og:title·description 갱신. 동적 og:image 는
 *    정적 URL 이어야 해서 사이트 기본 썸네일로 폴백(§18 한계).
 */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ZoomIn, ZoomOut, Maximize, Download, AlertCircle } from 'lucide-react';
import type { MindmapProject, MindmapPublicShareRow } from '../types/mindmap';
import { getPublicMindmapBySlug, buildShareUrl } from '../services/mindmapService';
import { exportPng } from '../utils/mindmapExport';
import MindmapArtwork from '../components/mindmap/MindmapArtwork';

export default function SharedMindmapViewerPage() {
  const { slug } = useParams();
  const [data, setData] = useState<MindmapPublicShareRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      try {
        const row = await getPublicMindmapBySlug(slug);
        if (cancelled) return;
        if (!row) { setNotFound(true); setLoading(false); return; }
        setData(row);
        setLoading(false);
        // best-effort OG meta.
        try {
          document.title = `${row.title} - 툰스쿨 마인드맵`;
          setMeta('og:title', `${row.title} - 툰스쿨 마인드맵`);
          setMeta('og:description', `${row.subject} ${row.unit_title ? row.unit_title + ' ' : ''}마인드맵 · 툰스쿨`);
          setMeta('og:url', buildShareUrl(slug));
        } catch { /* ignore */ }
      } catch {
        if (!cancelled) { setNotFound(true); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // 보기 영역은 mode='fill' 포스터가 스스로 맞춤(fit). 확대/축소는 외부 transform.

  function handleFit() {
    setZoom(1);
  }

  async function handlePng() {
    const el = posterRef.current;
    if (!el || !data) return;
    setExporting(true);
    try { await exportPng(el, data.title); } finally { setExporting(false); }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#fff3e6 0%,#ffe9f0 55%,#f3e8ff 100%)' }}>
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🧠</div>
          <p className="text-slate-600 font-bold">마인드맵을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg,#fff3e6 0%,#ffe9f0 55%,#f3e8ff 100%)' }}>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-md text-center">
          <div className="text-5xl mb-3">🚫</div>
          <h1 className="text-xl font-black text-slate-800 mb-2">이 작품은 더 이상 공유되지 않아요.</h1>
          <p className="text-slate-500">링크가 만료되었거나 공유가 중지되었어요.</p>
          <a href="/" className="inline-block mt-5 px-5 py-2 rounded-full bg-pink-500 text-white font-bold">툰스쿨으로</a>
        </div>
      </div>
    );
  }

  // 공개 행 → 프로젝트 형태로 렌더(MindmapArtwork 호환). 개인정보 필드는 비움.
  const project: MindmapProject = {
    id: data!.id, studentId: '', organizationId: null, classId: null, studentName: data!.student_name,
    title: data!.title, grade: 0, subject: data!.subject, semester: 1, unitId: '', unitTitle: data!.unit_title,
    centralTopic: data!.central_topic, themeId: data!.theme_id, layoutType: data!.layout_type, status: 'completed',
    nodes: (data!.nodes ?? []) as MindmapProject['nodes'], edges: (data!.edges ?? []) as MindmapProject['edges'],
    thumbnailUrl: null, shareSlug: slug ?? null, isPublic: true, sharedAt: null, shareRevokedAt: null,
    shareThumbnailUrl: data!.share_thumbnail_url, createdAt: data!.created_at, updatedAt: data!.created_at, version: 1,
  };

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: 'linear-gradient(135deg,#fff3e6 0%,#ffe9f0 55%,#f3e8ff 100%)' }}>
      {/* 헤더(안전 정보만) */}
      <header className="shrink-0 bg-white/80 backdrop-blur border-b border-white/60 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-pink-100 text-pink-500 flex items-center justify-center text-lg shrink-0">🧠</span>
          <div className="min-w-0">
            <h1 className="font-black text-slate-800 text-sm truncate">{data!.title}</h1>
            <p className="text-[11px] text-slate-500 truncate">
              {data!.subject}{data!.unit_title ? ` · ${data!.unit_title}` : ''}{data!.student_name ? ` · ${data!.student_name} 작품` : ''}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setZoom((s) => Math.min(2, s + 0.15))} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" title="확대"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => setZoom((s) => Math.max(0.4, s - 0.15))} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" title="축소"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={handleFit} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50" title="화면 맞춤"><Maximize className="w-4 h-4" /></button>
          <button onClick={handlePng} disabled={exporting} className="px-3 py-2 rounded-lg bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 flex items-center gap-1 disabled:opacity-60" title="PNG 저장">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">PNG</span>
          </button>
        </div>
      </header>

      {/* 보기 영역: 같은 포스터 컴포넌트로 자동 맞춤. 확대 시 스크롤. */}
      <div className="flex-1 min-h-0 overflow-auto student-scrollbar p-4 md:p-8">
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '100%' }}>
          <div className="w-full" style={{ maxWidth: 1100, transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            <MindmapArtwork project={project} themeId={project.themeId} mode="fill" interactive={false} showCharacters={false} />
            {/* 미리보기/캡처와 동일한 1.91:1 포스터(숨김, PNG 저장용) */}
            <div aria-hidden style={{ position: 'absolute', left: -99999, top: 0, width: 1200, height: 628 }}>
              <MindmapArtwork project={project} themeId={project.themeId} mode="fixed" width={1200} height={628} artworkRef={posterRef} />
            </div>
          </div>
        </div>
      </div>

      {/* 푸터(서비스 안내) */}
      <footer className="shrink-0 bg-white/80 backdrop-blur border-t border-white/60 px-4 py-2 text-center">
        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" /> 읽기 전용이에요. 툰스쿨에서 직접 만들어 보세요! <a href="/" className="text-pink-500 font-bold">툰스쿨 바로가기</a>
        </p>
      </footer>
    </div>
  );
}

function setMeta(prop: string, content: string) {
  let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
