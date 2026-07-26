/**
 * 툰마인드 편집기 오른쪽 패널: 선택한 노드의 세부 편집.
 * 선택이 없으면 작품 정보와 사용 안내를 표시.
 */
import type { MindmapNode, MindmapProject } from '../../types/mindmap';
import { resolveColor, getTheme, BRANCH_COLOR_KEYS, MINDMAP_LIMITS } from '../../data/mindmapConfig';
import { clampDescription, clampTitle, collectSubtree, getChildren, getNode } from '../../utils/mindmapEngine';
import type { AiPartialAction } from '../../types/mindmapAi';
import { Trash2, Copy, Plus, Sparkles, ChevronDown } from 'lucide-react';

export interface MindmapRightPanelProps {
  project: MindmapProject;
  selectedNode?: MindmapNode;
  aiLoading: boolean;
  onUpdateNode: (id: string, patch: Partial<MindmapNode>) => void;
  onAddChild: (parentId: string, type: MindmapNode['type']) => void;
  onAiPartial: (action: AiPartialAction) => void;
  onReparent: (id: string, newParentId: string | null) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
}

const SHAPES: { key: MindmapNode['shape']; label: string }[] = [
  { key: 'rounded', label: '둥근 사각형' },
  { key: 'oval', label: '타원' },
  { key: 'circle', label: '원' },
  { key: 'cloud', label: '구름' },
  { key: 'star', label: '별' },
];

const AI_ACTIONS: { key: AiPartialAction; label: string; emoji: string }[] = [
  { key: 'add_children', label: '하위 내용 추천', emoji: '🌱' },
  { key: 'simplify', label: '쉽게 줄이기', emoji: '✂️' },
  { key: 'detail', label: '자세히 설명', emoji: '🔎' },
  { key: 'example', label: '예시 추가', emoji: '💡' },
  { key: 'daily', label: '생활 속 사례', emoji: '🏠' },
  { key: 'question', label: '생각 질문 만들기', emoji: '❓' },
];

export default function MindmapRightPanel(props: MindmapRightPanelProps) {
  const { project, selectedNode, aiLoading, onUpdateNode, onAddChild, onAiPartial, onReparent, onClone, onDelete } = props;

  if (!selectedNode) {
    return (
      <aside className="w-[280px] shrink-0 h-full bg-white border-l border-slate-200 overflow-y-auto student-scrollbar p-4 hidden lg:block">
        <div className="rounded-2xl bg-gradient-to-br from-pink-50 to-sky-50 border border-pink-100 p-4">
          <h3 className="font-bold text-slate-800 mb-1">작품 정보</h3>
          <dl className="text-sm text-slate-600 space-y-1">
            <div><dt className="inline font-bold">제목: </dt><dd className="inline">{project.title}</dd></div>
            <div><dt className="inline font-bold">과목: </dt><dd className="inline">{project.subject}</dd></div>
            <div><dt className="inline font-bold">단원: </dt><dd className="inline">{project.unitTitle || '-'}</dd></div>
            <div><dt className="inline font-bold">중심 주제: </dt><dd className="inline">{project.centralTopic}</dd></div>
            <div><dt className="inline font-bold">상태: </dt><dd className="inline">{project.status === 'completed' ? '완성' : '만드는 중'}</dd></div>
          </dl>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 leading-relaxed">
          <p className="font-bold text-slate-700 mb-2">💡 이렇게 해 보세요</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>노드를 눌러 선택해요.</li>
            <li>노드를 끌어서 옮겨요.</li>
            <li>두 번 눌러 제목을 고쳐요.</li>
            <li>선택한 노드의 + 로 가지를 추가해요.</li>
            <li>마우스 휠로 확대·축소해요.</li>
          </ul>
        </div>
      </aside>
    );
  }

  const theme = getTheme(project.themeId);
  const palette = theme.palette;
  const isCentral = selectedNode.type === 'central';
  const isThought = selectedNode.type === 'thought';

  // 유효한 부모 후보(자기 자신과 자손 제외).
  const forbidden = collectSubtree(project.nodes, selectedNode.id);
  const parentCandidates = project.nodes.filter(
    (n) => !forbidden.has(n.id) && n.id !== selectedNode.id && n.type !== 'thought'
  );

  return (
    <aside className="w-[280px] shrink-0 h-full bg-white border-l border-slate-200 overflow-y-auto student-scrollbar p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800">
          {isCentral ? '중심 주제' : isThought ? '나의 생각' : selectedNode.type === 'main' ? '1차 가지' : selectedNode.type === 'sub' ? '2차 가지' : '3차 설명 카드'} 편집
        </h3>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: resolveColor(palette, selectedNode.colorKey).fill, color: '#4a3a2a' }}
        >
          {selectedNode.createdBy === 'ai' ? 'AI' : '나'}
        </span>
      </div>

      <label className="block text-xs font-bold text-slate-500 mb-1">제목</label>
      <input
        value={selectedNode.title}
        maxLength={30}
        onChange={(e) => onUpdateNode(selectedNode.id, { title: clampTitle(e.target.value) })}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-pink-300"
      />

      {/* 설명 입력 — 4차(detail) 노드만 49자 이하(10자 이상) 규칙 적용. 1~3차는 기존 200자 유지. */}
      {(() => {
        const isDetail = selectedNode.type === 'detail';
        const descMax = isDetail ? MINDMAP_LIMITS.maxDetailDescriptionLength : MINDMAP_LIMITS.maxDescriptionLength;
        const descMin = isDetail ? MINDMAP_LIMITS.minDetailDescriptionLength : 0;
        const descValue = selectedNode.description ?? '';
        const invalid = isDetail && (descValue.length < descMin || descValue.length > descMax);
        return (
          <>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              {isDetail ? '설명(한 문장, 49자 이하)' : '짧은 설명'}
            </label>
            <textarea
              value={descValue}
              maxLength={descMax}
              rows={3}
              onChange={(e) => onUpdateNode(selectedNode.id, {
                // 4차(detail)는 49자 입력 제한(maxLength)에 맡기고 자동 절삭하지 않아
                // 기존 긴 데이터가 깎이지 않도록 한다. 1~3차는 기존 clamp(200) 유지.
                description: isDetail ? e.target.value : clampDescription(e.target.value),
              })}
              placeholder={isDetail ? '핵심만 한 문장으로 적어 보세요.' : '쉽게 한 문장으로 적어 보세요.'}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
            <div className="flex items-center justify-between mb-1">
              {isDetail && descValue.length < descMin ? (
                <span className="text-[10px] text-rose-500">설명을 {descMin}자 이상 작성해 주세요.</span>
              ) : isDetail && descValue.length > descMax ? (
                <span className="text-[10px] text-rose-500">설명은 {descMax}자까지 작성할 수 있어요.</span>
              ) : <span />}
              <span className={`text-[10px] ${invalid ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>{descValue.length}/{descMax}</span>
            </div>
            <div className="mb-3" />
          </>
        );
      })()}

      {/* 색상 */}
      {!isCentral && (
        <>
          <label className="block text-xs font-bold text-slate-500 mb-1">색상</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(isThought ? ['thought'] : BRANCH_COLOR_KEYS).map((key) => {
              const c = resolveColor(palette, key);
              const active = selectedNode.colorKey === key;
              return (
                <button
                  key={key}
                  onClick={() => onUpdateNode(selectedNode.id, { colorKey: key })}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: c.fill, borderColor: active ? '#1f2937' : c.border, transform: active ? 'scale(1.12)' : undefined }}
                  aria-label={`색상 ${key}`}
                />
              );
            })}
          </div>
        </>
      )}

      {/* 모양 */}
      <label className="block text-xs font-bold text-slate-500 mb-1">모양</label>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {SHAPES.map((s) => (
          <button
            key={s.key}
            onClick={() => onUpdateNode(selectedNode.id, { shape: s.key })}
            className={`text-xs py-1.5 rounded-lg border ${selectedNode.shape === s.key ? 'bg-pink-50 border-pink-300 text-pink-600 font-bold' : 'border-slate-200 text-slate-600'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 접기 토글(자식이 있을 때) */}
      {getChildren(project.nodes, selectedNode.id).length > 0 && (
        <button
          onClick={() => onUpdateNode(selectedNode.id, { collapsed: !selectedNode.collapsed })}
          className="w-full text-sm py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 mb-3 flex items-center justify-center gap-1"
        >
          <ChevronDown className="w-4 h-4" />
          {selectedNode.collapsed ? '가지 펼치기' : '가지 접기'}
        </button>
      )}

      {/* 하위 가지 추가(중심→1차, 1차→2차, 2차→3차) */}
      {!isThought && selectedNode.type !== 'detail' && (
        <button
          onClick={() => onAddChild(selectedNode.id, isCentral ? 'main' : selectedNode.type === 'main' ? 'sub' : 'detail')}
          className="w-full text-sm py-2 rounded-lg bg-sky-500 text-white font-bold hover:bg-sky-600 mb-3 flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" /> 하위 가지 추가
        </button>
      )}

      {/* AI 추천 */}
      <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 mb-3">
        <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> 도윤이의 AI 추천</p>
        <div className="grid grid-cols-2 gap-1.5">
          {AI_ACTIONS.map((a) => (
            <button
              key={a.key}
              disabled={aiLoading}
              onClick={() => onAiPartial(a.key)}
              className="text-[11px] py-1.5 rounded-lg bg-white border border-purple-100 text-purple-700 hover:bg-purple-100 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <span>{a.emoji}</span>{a.label}
            </button>
          ))}
        </div>
      </div>

      {/* 부모 변경 */}
      {!isCentral && (
        <>
          <label className="block text-xs font-bold text-slate-500 mb-1">다른 가지로 옮기기</label>
          <select
            value={selectedNode.parentId ?? ''}
            onChange={(e) => onReparent(selectedNode.id, e.target.value || null)}
            className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm mb-3 bg-white"
          >
            <option value={getNode(project.nodes, selectedNode.parentId)?.id ?? ''}>(현재 위치 유지)</option>
            <option value="">— 중심 주제에 연결 —</option>
            {parentCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || '제목 없음'} ({typeLabel(c.type)})
              </option>
            ))}
          </select>
        </>
      )}

      {/* 복제 / 삭제 */}
      <div className="flex gap-2 mt-2">
        {!isCentral && (
          <button
            onClick={() => onClone(selectedNode.id)}
            className="flex-1 text-sm py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1"
          >
            <Copy className="w-4 h-4" /> 복제
          </button>
        )}
        {!isCentral && (
          <button
            onClick={() => onDelete(selectedNode.id)}
            className="flex-1 text-sm py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> 삭제
          </button>
        )}
      </div>

      <div className="mt-3 text-[10px] text-slate-400">
        수정 내용은 자동으로 저장돼요.
      </div>
    </aside>
  );
}

function typeLabel(t: MindmapNode['type']): string {
  return t === 'central' ? '중심' : t === 'main' ? '1차' : t === 'sub' ? '2차' : t === 'detail' ? '3차' : '생각';
}
