// 창작 과목 앞표지 제작 워크스페이스.
// 기본 정보 자동 입력 + 표지 유형(8종) 선택 + 추가 요청 + AI 추천 문장 + 생성/미리보기/편집.
// 제목·부제·작가명은 AI 이미지에 넣지 않고 AICoverPreview 에서 별도 합성한다.
import { useEffect, useMemo, useState } from 'react';
import type { StudentUnitSelection } from '../../types/studentCurriculum';
import type { TopicRecommendation } from '../../types/studentTopic';
import type { EditorState, CanvasElement } from '../editor/types';
import {
  FRONT_COVER_TYPE_PRESETS,
  createDefaultFrontCoverState,
  type CreationFrontCoverState,
  type CoverTypePreset,
  type CoverGenerationRecord,
} from '../../data/coverPresets';
import { generateCoverImage, generateExtraRequestSuggestions } from '../../services/coverAIService';
import { projectStorage } from '../../utils/projectStorage';
import { showToast } from '../../utils/toast';
import CoverTypeCardGrid from './CoverTypeCardGrid';
import AICoverPreview from './AICoverPreview';

interface Props {
  selection: StudentUnitSelection;
  topic: TopicRecommendation;
  projectId: string;
  onComplete: () => void;
  onPrev: () => void;
}

// 앞 단계 데이터에서 표지 기본 정보를 자동 채움.
const buildInitialBaseInfo = (topic: TopicRecommendation): CreationFrontCoverState['baseInfo'] => ({
  title: topic.title || '',
  subtitle: '',
  mainCharacter: '',
  supportingCharacters: '',
  location: topic.setting || '',
  importantObject: '',
  mood: topic.tone || '',
  storySummary: topic.summary || '',
  keywords: topic.selectedKeywords?.length ? topic.selectedKeywords : topic.keywords || [],
  authorDisplayName: '',
});

const newRecordId = (): string =>
  `gen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function CreationFrontCoverWorkspace({ selection, topic, projectId, onComplete, onPrev }: Props) {
  const [state, setState] = useState<CreationFrontCoverState>(() => {
    const saved = projectStorage.loadCreationFrontCover<CreationFrontCoverState>(projectId);
    if (saved && saved.baseInfo?.title) return { ...saved, generationStatus: 'idle', generationError: null };
    const fresh = createDefaultFrontCoverState();
    fresh.baseInfo = buildInitialBaseInfo(topic);
    return fresh;
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 변경 시마다 상세 상태 저장(이어서 만들기 복원용).
  useEffect(() => {
    projectStorage.saveCreationFrontCover(projectId, state);
  }, [projectId, state]);

  const selectedPreset: CoverTypePreset | undefined = useMemo(
    () => FRONT_COVER_TYPE_PRESETS.find((p) => p.code === state.coverType),
    [state.coverType]
  );

  const updateBaseInfo = (patch: Partial<CreationFrontCoverState['baseInfo']>) =>
    setState((s) => ({ ...s, baseInfo: { ...s.baseInfo, ...patch }, updatedAt: new Date().toISOString() }));
  const updateTextLayout = (patch: Partial<CreationFrontCoverState['textLayout']>) =>
    setState((s) => ({ ...s, textLayout: { ...s.textLayout, ...patch } }));

  const handleLoadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const list = await generateExtraRequestSuggestions(state.baseInfo, 'front');
      setSuggestions(list.length ? list : []);
      if (!list.length) showToast('추천 문장을 못 가져왔어요. 직접 적어도 괜찮아요.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPreset) {
      showToast('먼저 표지 유형을 골라주세요.');
      return;
    }
    if (isGenerating) return; // 중복 클릭 방지
    setIsGenerating(true);
    setState((s) => ({ ...s, generationStatus: 'loading', generationError: null }));
    try {
      const { result, prompt } = await generateCoverImage({
        projectId,
        grade: selection.gradeName || undefined,
        subject: selection.subjectName || undefined,
        coverKind: 'front',
        presetCode: selectedPreset.code,
        compositionGuide: selectedPreset.compositionGuide,
        promptRule: selectedPreset.promptRule,
        baseInfo: state.baseInfo,
        additionalPrompt: state.additionalPrompt,
      });
      if (result.success && result.resultUrl) {
        const record: CoverGenerationRecord = {
          id: newRecordId(),
          generatedImageUrl: result.resultUrl,
          presetCode: selectedPreset.code,
          additionalPrompt: state.additionalPrompt,
          prompt,
          createdAt: new Date().toISOString(),
        };
        setState((s) => ({
          ...s,
          generationStatus: 'success',
          generatedImageUrl: result.resultUrl,
          generationHistory: [record, ...s.generationHistory].slice(0, 8),
          selectedGenerationId: record.id,
        }));
      } else {
        setState((s) => ({
          ...s,
          generationStatus: 'error',
          generationError: result.message || '표지를 만들지 못했어요. 다시 시도해 주세요.',
        }));
      }
    } catch {
      setState((s) => ({
        ...s,
        generationStatus: 'error',
        generationError: '표지 생성 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectHistory = (id: string) => {
    const rec = state.generationHistory.find((r) => r.id === id);
    if (!rec) return;
    setState((s) => ({
      ...s,
      selectedGenerationId: id,
      generatedImageUrl: rec.generatedImageUrl,
      generationStatus: 'success',
      generationError: null,
    }));
  };

  const handleComplete = () => {
    if (!state.generatedImageUrl) {
      showToast('먼저 표지를 생성해 주세요.');
      return;
    }
    // EditorState 구성 — AI 이미지는 background, 텍스트는 별도 합성 요소로 저장(뷰어 호환).
    const elements: CanvasElement[] = [];
    let z = 0;
    const pushText = (id: string, props: CanvasElement['props']) => {
      elements.push({
        id, type: 'text', x: 100, y: 60 + z * 10, width: 1200, height: 120,
        rotation: 0, zIndex: z++, locked: true, visible: true, props,
      });
    };
    if (state.textLayout.showTitle && state.baseInfo.title) {
      pushText('cover-title', {
        text: state.baseInfo.title, layerName: '작품 제목',
        fontSize: Math.round(64 * state.textLayout.titleScale), fill: '#1f2937',
        fontFamily: 'Jua', align: 'center',
      });
    }
    if (state.textLayout.showSubtitle && state.baseInfo.subtitle) {
      pushText('cover-subtitle', {
        text: state.baseInfo.subtitle, layerName: '부제목',
        fontSize: 30, fill: '#374151', fontFamily: 'Pretendard', align: 'center',
      });
    }
    if (state.textLayout.showAuthor && state.baseInfo.authorDisplayName) {
      pushText('cover-author', {
        text: `글: ${state.baseInfo.authorDisplayName}`, layerName: '작가',
        fontSize: 24, fill: '#374151', fontFamily: 'Pretendard', align: 'center',
      });
    }

    const editorState: EditorState = {
      version: '1.1',
      elements,
      background: state.generatedImageUrl,
      canvasWidth: 1400,
      canvasHeight: 1980,
      metadata: {
        projectId,
        subject: selection.subjectId || '',
        subjectName: selection.subjectName || '',
        grade: selection.gradeName || '',
        topicTitle: topic.title || '',
        topicId: topic.id || '',
        lessonTitle: selection.middleUnitName || '',
        unitTitle: selection.majorUnitName || '',
        aiCover: {
          isAiCover: true,
          coverKind: 'front',
          resultUrl: state.generatedImageUrl,
          presetCode: selectedPreset?.code || '',
          generatedAt: new Date().toISOString(),
        },
      },
    };

    const ok = projectStorage.saveFrontCover(projectId, editorState);
    if (!ok) {
      showToast('저장에 실패했어요. 저장 공간을 확인해 주세요.');
      return;
    }
    showToast('표지를 저장했어요!');
    onComplete();
  };

  return (
    <div className="w-full h-full overflow-y-auto student-scrollbar">
      <div className="max-w-[1280px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* 왼쪽: 작업도구 */}
        <div className="space-y-5">
          {/* 기본 정보 */}
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
            <h3 className="font-jua text-lg text-[#1f2937] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">1</span>
              작품 정보 확인
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="작품 제목">
                <input className="input-game-soft" value={state.baseInfo.title} onChange={(e) => updateBaseInfo({ title: e.target.value })} />
              </Field>
              <Field label="부제목(선택)">
                <input className="input-game-soft" value={state.baseInfo.subtitle || ''} onChange={(e) => updateBaseInfo({ subtitle: e.target.value })} />
              </Field>
              <Field label="주인공">
                <input className="input-game-soft" placeholder="예: 서아" value={state.baseInfo.mainCharacter || ''} onChange={(e) => updateBaseInfo({ mainCharacter: e.target.value })} />
              </Field>
              <Field label="함께 나오는 인물">
                <input className="input-game-soft" placeholder="예: 도윤, 시계 로봇" value={state.baseInfo.supportingCharacters || ''} onChange={(e) => updateBaseInfo({ supportingCharacters: e.target.value })} />
              </Field>
              <Field label="주요 장소">
                <input className="input-game-soft" value={state.baseInfo.location || ''} onChange={(e) => updateBaseInfo({ location: e.target.value })} />
              </Field>
              <Field label="중요한 물건">
                <input className="input-game-soft" placeholder="예: 빛나는 손목시계" value={state.baseInfo.importantObject || ''} onChange={(e) => updateBaseInfo({ importantObject: e.target.value })} />
              </Field>
              <Field label="표지 분위기">
                <input className="input-game-soft" value={state.baseInfo.mood || ''} onChange={(e) => updateBaseInfo({ mood: e.target.value })} />
              </Field>
              <Field label="작가 표시 이름">
                <input className="input-game-soft" placeholder="표지에 표시할 이름" value={state.baseInfo.authorDisplayName || ''} onChange={(e) => updateBaseInfo({ authorDisplayName: e.target.value })} />
              </Field>
            </div>
          </section>

          {/* 표지 유형 */}
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
            <h3 className="font-jua text-lg text-[#1f2937] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">2</span>
              표지 모습 고르기
            </h3>
            <CoverTypeCardGrid
              presets={FRONT_COVER_TYPE_PRESETS}
              selectedCode={state.coverType}
              onSelect={(code) => setState((s) => ({ ...s, coverType: code as CreationFrontCoverState['coverType'] }))}
            />
          </section>

          {/* 추가 요청 */}
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
            <h3 className="font-jua text-lg text-[#1f2937] mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">3</span>
              표지에 더 넣고 싶은 모습을 적어 보세요.
            </h3>
            <p className="text-xs text-gray-500 mb-2">예처럼 짧게 적어도 괜찮아요. 안 적어도 만들 수 있어요.</p>
            <textarea
              className="input-game-soft min-h-[72px]"
              placeholder="예: 하늘에 거대한 고래가 날아다니게 해 줘."
              value={state.additionalPrompt}
              onChange={(e) => setState((s) => ({ ...s, additionalPrompt: e.target.value }))}
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSuggestions}
                disabled={loadingSuggestions}
                className="btn-student btn-student-soft btn-student-sm"
              >
                {loadingSuggestions ? '문장 만드는 중...' : '✨ AI가 문장 만들어주기'}
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setState((st) => ({ ...st, additionalPrompt: s }))}
                    className="block w-full text-left text-sm bg-purple-50 hover:bg-purple-100 rounded-lg px-3 py-1.5 text-[#374151]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 오른쪽: 미리보기 + 편집 */}
        <div className="space-y-4">
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
            <AICoverPreview
              imageUrl={state.generatedImageUrl}
              loading={state.generationStatus === 'loading'}
              error={state.generationError}
              title={state.baseInfo.title}
              subtitle={state.baseInfo.subtitle}
              author={state.baseInfo.authorDisplayName}
              badge="창작"
              textLayout={state.textLayout}
            />

            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !state.coverType}
              className="btn-student btn-student-primary btn-student-lg w-full mt-4"
            >
              {isGenerating ? '그리는 중...' : state.generatedImageUrl ? '🔄 다시 생성하기' : '🎨 표지 생성하기'}
            </button>
            {!state.coverType && <p className="text-xs text-gray-400 mt-1 text-center">표지 유형을 먼저 골라주세요.</p>}
          </section>

          {/* 편집 도구 */}
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100 space-y-3">
            <h4 className="font-jua text-base text-[#1f2937]">글자 편집</h4>
            <label className="flex items-center justify-between text-sm">
              <span>제목 표시</span>
              <input type="checkbox" checked={state.textLayout.showTitle} onChange={(e) => updateTextLayout({ showTitle: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>부제목 표시</span>
              <input type="checkbox" checked={state.textLayout.showSubtitle} onChange={(e) => updateTextLayout({ showSubtitle: e.target.checked })} />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>작가명 표시</span>
              <input type="checkbox" checked={state.textLayout.showAuthor} onChange={(e) => updateTextLayout({ showAuthor: e.target.checked })} />
            </label>
            <div>
              <div className="text-sm mb-1 flex justify-between"><span>제목 크기</span><span>{Math.round(state.textLayout.titleScale * 100)}%</span></div>
              <input type="range" min={0.6} max={1.6} step={0.1} value={state.textLayout.titleScale} onChange={(e) => updateTextLayout({ titleScale: parseFloat(e.target.value) })} className="w-full" />
            </div>
            <div className="text-sm">
              <div className="mb-1">제목 위치</div>
              <div className="flex gap-2">
                {(['top', 'center'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => updateTextLayout({ titlePosition: pos })}
                    className={`flex-1 py-1.5 rounded-lg text-sm border ${state.textLayout.titlePosition === pos ? 'bg-purple-500 text-white border-purple-500' : 'bg-white border-purple-200 text-[#374151]'}`}
                  >
                    {pos === 'top' ? '위쪽' : '가운데'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 이전 결과 */}
          {state.generationHistory.length > 0 && (
            <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
              <h4 className="font-jua text-base text-[#1f2937] mb-2">이전 결과</h4>
              <div className="grid grid-cols-3 gap-2">
                {state.generationHistory.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectHistory(r.id)}
                    className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 ${state.selectedGenerationId === r.id ? 'border-purple-500' : 'border-transparent'}`}
                  >
                    <img src={r.generatedImageUrl} alt="이전 표지" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 하단 액션 */}
          <div className="flex gap-2">
            <button type="button" onClick={onPrev} className="btn-student btn-student-soft btn-student-md flex-1">이전</button>
            <button type="button" onClick={handleComplete} className="btn-student btn-student-primary btn-student-md flex-[2]">
              이 표지 사용하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
