// 창작 표지/뒤표지 유형 선택 카드 그리드 (공통).
// 드롭다운 대신 초등학생이 크게 누르기 쉬운 카드형 선택지.
interface CoverTypeCardData {
  code: string;
  name: string;
  description: string;
  preview: { emoji: string; gradient: string };
  fitGenres?: string[];
}

interface CoverTypeCardGridProps {
  presets: CoverTypeCardData[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  columns?: number;
}

export default function CoverTypeCardGrid({ presets, selectedCode, onSelect, columns = 4 }: CoverTypeCardGridProps) {
  const gridCols =
    columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  return (
    <div className={`grid ${gridCols} gap-3`}>
      {presets.map((p) => {
        const isSelected = selectedCode === p.code;
        return (
          <button
            key={p.code}
            type="button"
            onClick={() => onSelect(p.code)}
            aria-pressed={isSelected}
            className={[
              'relative rounded-2xl p-3 text-left transition-all border-2 shadow-sm',
              'hover:-translate-y-0.5 hover:shadow-md',
              isSelected
                ? 'border-purple-400 bg-white ring-2 ring-purple-200'
                : 'border-purple-100 bg-white/80',
            ].join(' ')}
          >
            <div className={`mb-2 h-14 rounded-xl bg-gradient-to-br ${p.preview.gradient} flex items-center justify-center text-3xl`}>
              <span aria-hidden>{p.preview.emoji}</span>
            </div>
            <div className="font-jua text-base text-[#303442] leading-tight">{p.name}</div>
            <div className="text-xs text-gray-500 mt-0.5 leading-snug">{p.description}</div>
            {isSelected && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center shadow">
                ✓
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
