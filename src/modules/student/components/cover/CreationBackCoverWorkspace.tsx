// 창작 과목 뒷표지 제작 워크스페이스.
// 앞표지 스타일·등장인물 설정을 최대한 계승하고, 학생이 고른 내용(2~4개)을 별도 합성.
// AI 이미지에는 텍스트를 넣지 않는다.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StudentUnitSelection } from '../../types/studentCurriculum';
import type { EditorState, CanvasElement } from '../editor/types';
import {
  BACK_COVER_TYPE_PRESETS,
  BACK_COVER_CONTENT_OPTIONS,
  BACK_COVER_MIN_SELECTION,
  BACK_COVER_MAX_SELECTION,
  createDefaultBackCoverState,
  type CreationBackCoverState,
  type CreationFrontCoverState,
  type BackCoverTypePreset,
  type BackCoverContentKey,
  type CoverGenerationRecord,
  type CreationCoverBaseInfo,
} from '../../data/coverPresets';
import { generateCoverImage, generateExtraRequestSuggestions } from '../../services/coverAIService';
import { projectStorage } from '../../utils/projectStorage';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { confirmComicCompletion, COMIC_QUOTA_ENABLED } from '../../../../shared/lib/comicQuota';
import { grantComicCompleteReward, grantLuckyRewardIfNeeded } from '../../services/dreamGardenService';
import CoverTypeCardGrid from './CoverTypeCardGrid';
import AICoverPreview from './AICoverPreview';

// 보상 중복 지급 방지(같은 projectId-학생 조합).
const creationBackRewardRequests = new Set<string>();

interface Props {
  selection: StudentUnitSelection;
  projectId: string;
  onPrev: () => void;
}

const newRecordId = (): string => `gen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// 앞표지에서 baseInfo를 계승(없으면 빈 값).
const inheritBaseFromFront = (projectId: string): CreationCoverBaseInfo => {
  const front = projectStorage.loadCreationFrontCover<CreationFrontCoverState>(projectId);
  if (front?.baseInfo?.title) return { ...front.baseInfo };
  return { title: '', keywords: [] };
};

export default function CreationBackCoverWorkspace({ selection, projectId, onPrev }: Props) {
  const navigate = useNavigate();
  const { profile: authProfile, user } = useAuth();
  const studentId = authProfile?.role === 'student' ? (authProfile.id ?? user?.id) : user?.id;

  const [state, setState] = useState<CreationBackCoverState>(() => {
    const saved = projectStorage.loadCreationBackCover<CreationBackCoverState>(projectId);
    if (saved && (saved.baseInfo?.title || saved.backCoverType)) {
      return { ...saved, generationStatus: 'idle', generationError: null };
    }
    const fresh = createDefaultBackCoverState();
    fresh.baseInfo = inheritBaseFromFront(projectId);
    return fresh;
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    projectStorage.saveCreationBackCover(projectId, state);
  }, [projectId, state]);

  const selectedPreset: BackCoverTypePreset | undefined = useMemo(
    () => BACK_COVER_TYPE_PRESETS.find((p) => p.code === state.backCoverType),
    [state.backCoverType]
  );

  const toggleContent = (key: BackCoverContentKey) => {
    setState((s) => {
      const has = s.selectedContents.includes(key);
      if (has) return { ...s, selectedContents: s.selectedContents.filter((k) => k !== key) };
      if (s.selectedContents.length >= BACK_COVER_MAX_SELECTION) {
        showToast(`최대 ${BACK_COVER_MAX_SELECTION}개까지만 고를 수 있어요.`);
        return s;
      }
      return { ...s, selectedContents: [...s.selectedContents, key] };
    });
  };

  const updateContentText = (key: BackCoverContentKey, text: string) =>
    setState((s) => ({ ...s, contentTexts: { ...s.contentTexts, [key]: text } }));

  const handleLoadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const list = await generateExtraRequestSuggestions(state.baseInfo, 'back');
      setSuggestions(list.length ? list : []);
      if (!list.length) showToast('추천 문장을 못 가져왔어요. 직접 적어도 괜찮아요.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedPreset) {
      showToast('먼저 뒷표지 유형을 골라주세요.');
      return;
    }
    if (isGenerating) return;
    setIsGenerating(true);
    setState((s) => ({ ...s, generationStatus: 'loading', generationError: null }));
    try {
      const { result, prompt } = await generateCoverImage({
        projectId,
        grade: selection.gradeName || undefined,
        subject: selection.subjectName || undefined,
        coverKind: 'back',
        presetCode: selectedPreset.code,
        compositionGuide: selectedPreset.compositionGuide,
        promptRule: selectedPreset.promptRule,
        baseInfo: state.baseInfo,
        additionalPrompt: state.additionalPrompt,
        selectedContents: state.selectedContents,
        inheritFromFront: state.inheritFromFront,
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
          generationError: result.message || '뒷표지를 만들지 못했어요. 다시 시도해 주세요.',
        }));
      }
    } catch {
      setState((s) => ({
        ...s,
        generationStatus: 'error',
        generationError: '뒷표지 생성 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
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

  // 미리보기에 합성할 텍스트 라인들(선택 항목 라벨 + 내용).
  const extraLines = useMemo(() => {
    return state.selectedContents
      .map((key) => {
        const opt = BACK_COVER_CONTENT_OPTIONS.find((o) => o.key === key);
        const text = state.contentTexts[key];
        return opt ? `${opt.emoji} ${opt.label}: ${text || ''}` : '';
      })
      .filter(Boolean);
  }, [state.selectedContents, state.contentTexts]);

  const handleFinish = async () => {
    if (!state.generatedImageUrl) {
      showToast('먼저 뒷표지를 생성해 주세요.');
      return;
    }
    if (state.selectedContents.length < BACK_COVER_MIN_SELECTION) {
      showToast(`뒷표지에 넣을 내용을 최소 ${BACK_COVER_MIN_SELECTION}개 골라주세요.`);
      return;
    }
    if (isFinishing) return;
    setIsFinishing(true);

    // EditorState 저장 — AI 이미지는 background, 선택 내용은 텍스트 요소로(뷰어 호환).
    const elements: CanvasElement[] = [];
    let z = 0;
    state.selectedContents.forEach((key) => {
      const opt = BACK_COVER_CONTENT_OPTIONS.find((o) => o.key === key);
      const text = state.contentTexts[key] || '';
      if (!opt) return;
      elements.push({
        id: `back-content-${key}`, type: 'text',
        x: 100, y: 200 + z * 60, width: 1200, height: 60,
        rotation: 0, zIndex: z++, locked: true, visible: true,
        props: { text: `${opt.label}: ${text}`, layerName: opt.label, fontSize: 26, fill: '#1f2937', fontFamily: 'Pretendard', align: 'left' },
      });
    });

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
        topicTitle: state.baseInfo.title || '',
        lessonTitle: selection.middleUnitName || '',
        unitTitle: selection.majorUnitName || '',
        authorName: state.baseInfo.authorDisplayName || '',
        aiCover: {
          isAiCover: true,
          coverKind: 'back',
          resultUrl: state.generatedImageUrl,
          presetCode: selectedPreset?.code || '',
          generatedAt: new Date().toISOString(),
        },
      },
    };

    const saved = projectStorage.saveBackCover(projectId, editorState);
    if (!saved) {
      showToast('저장에 실패했어요. 저장 공간을 확인해 주세요.');
      setIsFinishing(false);
      return;
    }

    // 만화 1회 확정 + 보상(기존 구조 재사용). 보상은 Set으로 중복 방지.
    if (COMIC_QUOTA_ENABLED && studentId) {
      try {
        await confirmComicCompletion({ studentId, comicId: projectId });
      } catch (e) {
        console.error('[CreationBackCover] confirm comic completion failed', e);
      }
    }
    if (studentId) {
      const requestKey = `${studentId}:${projectId}`;
      if (!creationBackRewardRequests.has(requestKey)) {
        creationBackRewardRequests.add(requestKey);
        try {
          const result = await grantComicCompleteReward(studentId, projectId);
          if (result?.status === 'granted') {
            await grantLuckyRewardIfNeeded(studentId);
          }
        } catch (e) {
          console.error('[CreationBackCover] reward failed', e);
        } finally {
          creationBackRewardRequests.delete(requestKey);
        }
      }
    }

    showToast('만화책이 완성되었어요! 🎉');
    navigate('/student/comic/read', { state: { projectId } });
  };

  return (
    <div className="w-full h-full overflow-y-auto student-scrollbar">
      <div className="max-w-[1280px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        {/* 왼쪽: 도구 */}
        <div className="space-y-5">
          {/* 넣을 내용 선택 */}
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
            <h3 className="font-jua text-lg text-[#1f2937] mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">1</span>
              뒷표지에 넣을 내용 고르기
            </h3>
            <p className="text-xs text-gray-500 mb-3">최소 {BACK_COVER_MIN_SELECTION}개, 최대 {BACK_COVER_MAX_SELECTION}개까지 고를 수 있어요. ({state.selectedContents.length}/{BACK_COVER_MAX_SELECTION})</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BACK_COVER_CONTENT_OPTIONS.map((opt) => {
                const isSelected = state.selectedContents.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => toggleContent(opt.key)}
                    aria-pressed={isSelected}
                    className={`rounded-xl p-2 text-center border-2 transition-all ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-purple-100 bg-white'}`}
                  >
                    <div className="text-2xl">{opt.emoji}</div>
                    <div className="text-xs font-semibold text-[#374151] mt-1 leading-tight">{opt.label}</div>
                  </button>
                );
              })}
            </div>
            {state.selectedContents.length > 0 && (
              <div className="mt-3 space-y-2">
                {state.selectedContents.map((key) => {
                  const opt = BACK_COVER_CONTENT_OPTIONS.find((o) => o.key === key)!;
                  return (
                    <label key={key} className="block">
                      <span className="block text-xs text-gray-500 mb-1">{opt.emoji} {opt.label}</span>
                      <textarea
                        className="input-game-soft min-h-[48px]"
                        placeholder={`${opt.label}을(를) 짧게 적어보세요.`}
                        value={state.contentTexts[key] || ''}
                        onChange={(e) => updateContentText(key, e.target.value)}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </section>

          {/* 뒷표지 유형 */}
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
            <h3 className="font-jua text-lg text-[#1f2937] mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">2</span>
              뒷표지 모습 고르기
            </h3>
            <CoverTypeCardGrid
              presets={BACK_COVER_TYPE_PRESETS}
              selectedCode={state.backCoverType}
              onSelect={(code) => setState((s) => ({ ...s, backCoverType: code as CreationBackCoverState['backCoverType'] }))}
            />
            <label className="flex items-center gap-2 mt-3 text-sm text-[#374151]">
              <input
                type="checkbox"
                checked={state.inheritFromFront}
                onChange={(e) => setState((s) => ({ ...s, inheritFromFront: e.target.checked }))}
              />
              앞표지와 같은 색깔·그림 스타일로 만들기
            </label>
          </section>

          {/* 추가 요청 */}
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
            <h3 className="font-jua text-lg text-[#1f2937] mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-bold">3</span>
              뒷표지에 더 넣고 싶은 모습을 적어 보세요.
            </h3>
            <p className="text-xs text-gray-500 mb-2">안 적어도 만들 수 있어요.</p>
            <textarea
              className="input-game-soft min-h-[64px]"
              placeholder="예: 앞표지와 같은 노을 색깔로 만들어 줘."
              value={state.additionalPrompt}
              onChange={(e) => setState((s) => ({ ...s, additionalPrompt: e.target.value }))}
            />
            <button
              type="button"
              onClick={handleLoadSuggestions}
              disabled={loadingSuggestions}
              className="btn-student btn-student-soft btn-student-sm mt-2"
            >
              {loadingSuggestions ? '문장 만드는 중...' : '✨ AI가 문장 만들어주기'}
            </button>
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

        {/* 오른쪽: 미리보기 + 액션 */}
        <div className="space-y-4">
          <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
            <AICoverPreview
              imageUrl={state.generatedImageUrl}
              loading={state.generationStatus === 'loading'}
              error={state.generationError}
              title={state.baseInfo.title}
              author={state.baseInfo.authorDisplayName}
              badge="뒷표지"
              textLayout={{ showTitle: true, showSubtitle: false, showAuthor: !!state.baseInfo.authorDisplayName, titleScale: 0.8, titlePosition: 'top' }}
              extraLines={extraLines}
            />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !state.backCoverType}
              className="btn-student btn-student-primary btn-student-lg w-full mt-4"
            >
              {isGenerating ? '그리는 중...' : state.generatedImageUrl ? '🔄 다시 생성하기' : '🎨 뒷표지 생성하기'}
            </button>
            {!state.backCoverType && <p className="text-xs text-gray-400 mt-1 text-center">뒷표지 유형을 먼저 골라주세요.</p>}
          </section>

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
                    <img src={r.generatedImageUrl} alt="이전 뒷표지" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onPrev} className="btn-student btn-student-soft btn-student-md flex-1">이전</button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={isFinishing}
              className="btn-student btn-student-primary btn-student-md flex-[2]"
            >
              {isFinishing ? '저장 중...' : '만화 보기 📖'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
