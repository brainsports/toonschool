import { MessageSquare, MessageCircle, Info, AlertCircle, RotateCcw, EyeOff, Eye } from 'lucide-react';
import type { ComicCutElement, BubbleTail } from '../editor/utils/comicStorage';

interface Props {
  onAddElement: (element: Omit<ComicCutElement, 'id'>) => void;
  // 선택된 요소(말풍선)가 있으면 말꼬리 속성 패널을 함께 표시.
  selectedElement?: ComicCutElement | null;
  onUpdateElement?: (id: string, updates: Partial<ComicCutElement>) => void;
}

const DEFAULT_TAIL: BubbleTail = { direction: 'down', length: 40, width: 36, offset: 0, visible: true };

// tail 값(없으면 기본값)을 풀어 반환 — 입력 컨트롤 표시용.
const resolveTail = (el?: ComicCutElement | null): BubbleTail | null => {
  if (!el || el.type !== 'speechBubble') return null;
  return {
    direction: el.tail?.direction || DEFAULT_TAIL.direction,
    length: el.tail?.length ?? DEFAULT_TAIL.length,
    width: el.tail?.width ?? DEFAULT_TAIL.width,
    offset: el.tail?.offset ?? DEFAULT_TAIL.offset,
    visible: el.tail?.visible !== false,
  };
};

const DIRECTIONS: { value: BubbleTail['direction']; label: string }[] = [
  { value: 'down', label: '↓ 아래' },
  { value: 'up', label: '↑ 위' },
  { value: 'left', label: '← 왼쪽' },
  { value: 'right', label: '→ 오른쪽' },
];

export default function ComicSpeechBubblePanel({ onAddElement, selectedElement, onUpdateElement }: Props) {
  const bubbles = [
    { id: 'basic', name: '기본 말풍선', icon: MessageSquare, type: 'basic', bgColor: '#ffffff', textColor: '#000000', borderColor: '#000000' },
    { id: 'thought', name: '생각 말풍선', icon: MessageCircle, type: 'thought', bgColor: '#ffffff', textColor: '#000000', borderColor: '#3b82f6' },
    { id: 'explain', name: '설명 말풍선', icon: Info, type: 'explain', bgColor: '#fef3c7', textColor: '#92400e', borderColor: '#f59e0b' },
    { id: 'emphasis', name: '강조 말풍선', icon: AlertCircle, type: 'emphasis', bgColor: '#fee2e2', textColor: '#b91c1c', borderColor: '#ef4444' },
  ] as const;

  const handleAddBubble = (bubble: typeof bubbles[number]) => {
    onAddElement({
      type: 'speechBubble',
      bubbleType: bubble.type,
      text: '내용을 입력하세요',
      x: 100,
      y: 100,
      width: 250,
      height: 120,
      rotation: 0,
      zIndex: 0,
      style: { backgroundColor: bubble.bgColor, borderColor: bubble.borderColor, textColor: bubble.textColor, fontSize: 24 },
    });
  };

  const tail = resolveTail(selectedElement);
  const tailOffset = tail?.offset ?? 0;
  const selId = selectedElement?.id;

  // 말꼬리 속성 부분 업데이트 헬퍼.
  const updateTail = (patch: Partial<BubbleTail>) => {
    if (!onUpdateElement || !selId || !tail) return;
    onUpdateElement(selId, { tail: { ...tail, ...patch } });
  };

  return (
    <div className="flex flex-col h-full space-y-6 text-slate-200 p-4">
      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-4">말풍선 추가</h3>
        <p className="text-xs text-slate-500 mb-6">말풍선을 클릭하면 화면에 추가됩니다.</p>
        <div className="grid grid-cols-2 gap-3">
          {bubbles.map((bubble) => {
            const Icon = bubble.icon;
            return (
              <button
                key={bubble.id}
                onClick={() => handleAddBubble(bubble)}
                className="flex flex-col items-center p-4 bg-slate-900/50 hover:bg-slate-700/50 border border-white/10 rounded-xl transition-all hover:scale-105 hover:border-purple-500/50"
              >
                <div className="w-12 h-12 mb-2 rounded-full bg-slate-800 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-slate-300" />
                </div>
                <span className="text-sm font-bold text-slate-300">{bubble.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 말꼬리 편집 — 선택된 말풍선이 있을 때만 */}
      {tail && selId && onUpdateElement && (
        <div className="border-t border-white/10 pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300">말꼬리 편집</h3>
            <button
              onClick={() => onUpdateElement(selId, { tail: undefined })}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-white/10 rounded-md px-2 py-1 hover:bg-slate-700/50"
              title="기본 꼬리(아래쪽 중앙)로 되돌리기"
            >
              <RotateCcw className="w-3 h-3" /> 기본으로
            </button>
          </div>

          {/* 방향 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">방향</label>
            <div className="grid grid-cols-2 gap-2">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => updateTail({ direction: d.value })}
                  className={`text-xs font-bold py-2 rounded-lg border transition-all ${
                    tail.direction === d.value
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-slate-900/50 border-white/10 text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 길이 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">길이: {tail.length}px</label>
            <input
              type="range" min={20} max={140} step={2} value={tail.length}
              onChange={(e) => updateTail({ length: Number(e.target.value) })}
              className="w-full accent-purple-500"
            />
          </div>

          {/* 폭 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">폭: {tail.width}px</label>
            <input
              type="range" min={10} max={80} step={2} value={tail.width}
              onChange={(e) => updateTail({ width: Number(e.target.value) })}
              className="w-full accent-purple-500"
            />
            <div className="flex gap-2 mt-2">
              {[
                { label: '얇게', w: 18 },
                { label: '보통', w: 36 },
                { label: '굵게', w: 60 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => updateTail({ width: p.w })}
                  className="flex-1 text-xs font-bold py-1.5 rounded-md border border-white/10 bg-slate-900/50 text-slate-300 hover:bg-slate-700/50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 시작 위치 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              시작 위치: {tailOffset > 0 ? '오른쪽/아래' : tailOffset < 0 ? '왼쪽/위' : '가운데'} ({Math.round(tailOffset * 100)})
            </label>
            <input
              type="range" min={-1} max={1} step={0.05} value={tailOffset}
              onChange={(e) => updateTail({ offset: Number(e.target.value) })}
              className="w-full accent-purple-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">캔버스에서 분홍색 끝점 핸들을 직접 드래그해도 조절할 수 있어요.</p>
          </div>

          {/* 표시/숨김 */}
          <button
            onClick={() => updateTail({ visible: !tail.visible })}
            className={`w-full flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-lg border transition-all ${
              tail.visible
                ? 'bg-slate-900/50 border-white/10 text-slate-300 hover:bg-slate-700/50'
                : 'bg-pink-600/20 border-pink-500/50 text-pink-300'
            }`}
          >
            {tail.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {tail.visible ? '말꼬리 숨기기' : '말꼬리 보이기'}
          </button>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">
          말풍선을 선택하면 말꼬리(방향·길이·폭·위치)를 편집할 수 있어요.
        </p>
      </div>
    </div>
  );
}
