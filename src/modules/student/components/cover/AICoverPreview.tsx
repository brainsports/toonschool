// 창작 표지/뒤표지 미리보기 — AI 이미지 위에 제목/부제/작가명 등 텍스트를 별도 합성(DOM 오버레이).
// AI 이미지 자체에는 한글 텍스트를 넣지 않는다(깨짐·개인정보 방지).
import type { CoverTextLayout } from '../../data/coverPresets';

interface AICoverPreviewProps {
  imageUrl: string | null;
  loading?: boolean;
  error?: string | null;
  // 합성할 텍스트
  title?: string;
  subtitle?: string;
  author?: string;
  badge?: string; // '창작' 과목 표시 등
  textLayout: CoverTextLayout;
  // 뒤표지용 추가 텍스트 라인들(자유 형식)
  extraLines?: string[];
}

export default function AICoverPreview({
  imageUrl, loading, error,
  title, subtitle, author, badge,
  textLayout, extraLines,
}: AICoverPreviewProps) {
  const titleScale = textLayout.titleScale ?? 1.0;
  const titleTop = textLayout.titlePosition === 'top';

  return (
    <div className="relative w-full max-w-[360px] mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gradient-to-br from-purple-50 to-sky-50">
      {/* 배경 이미지 */}
      {imageUrl ? (
        <img src={imageUrl} alt="표지 미리보기" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-purple-400">
          <div className="text-5xl mb-3">🎨</div>
          <div className="font-jua text-lg text-[#6b7280]">
            {loading ? '그림을 그리고 있어요...' : '표지 유형을 고르고\n생성하기를 눌러주세요'}
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="animate-spin w-10 h-10 border-4 border-purple-300 border-t-transparent rounded-full" />
        </div>
      )}

      {/* 상단 배지 */}
      {badge && (
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-purple-500/90 text-white text-xs font-bold shadow">
          {badge}
        </div>
      )}

      {/* 제목/부제 합성 */}
      {textLayout.showTitle && title && (
        <div
          className={`absolute left-0 right-0 px-4 text-center ${titleTop ? 'top-6' : 'top-1/2 -translate-y-1/2'}`}
          style={{ transform: titleTop ? undefined : 'translateY(-50%)' }}
        >
          <div
            className="font-jua text-[#1f2937] leading-tight drop-shadow-[0_2px_6px_rgba(255,255,255,0.9)]"
            style={{ fontSize: `${30 * titleScale}px` }}
          >
            {title}
          </div>
          {textLayout.showSubtitle && subtitle && (
            <div className="mt-1 text-sm font-semibold text-[#374151] drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)]">
              {subtitle}
            </div>
          )}
        </div>
      )}

      {/* 추가 텍스트 라인(뒤표지용) */}
      {extraLines && extraLines.length > 0 && (
        <div className="absolute left-4 right-4 bottom-14 space-y-1.5">
          {extraLines.map((line, i) => (
            <div
              key={i}
              className="text-xs sm:text-sm text-[#1f2937] bg-white/85 rounded-lg px-3 py-1.5 shadow-sm leading-snug"
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {/* 작가명 */}
      {textLayout.showAuthor && author && (
        <div className="absolute bottom-3 right-3 text-xs font-semibold text-[#374151] bg-white/85 rounded-full px-3 py-1 shadow-sm">
          글: {author}
        </div>
      )}

      {error && (
        <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white text-xs text-center py-2 px-3">
          {error}
        </div>
      )}
    </div>
  );
}
