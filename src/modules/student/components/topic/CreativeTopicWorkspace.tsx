// 창작 과목 주제 만들기 워크스페이스.
// 흐름: 창작 설정(분야/세부설정) → 주제 5개 자동 생성 → 1개 선택 → 키워드 자동 생성 → 대본 만들기.
// 교과 흐름(키워드 먼저 → 주제)과 순서가 반대이므로 별도 컴포넌트로 분리.
import { useEffect, useRef, useState } from 'react';
import { Sparkles, RefreshCw, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react';
import type { StudentUnitSelection } from '../../types/studentCurriculum';
import {
  summarizeCreativeSettings,
  type CreativeStorySettings,
} from '../../data/creativeCategories';
import {
  generateCreativeTopics,
  generateCreativeKeywords,
  type CreativeTopic,
} from '../../services/creativeTopicService';
import { projectStorage } from '../../utils/projectStorage';

// 대본 만들기로 넘길 데이터. 기존 projectStorage.saveTopic 구조를 그대로 따르되
// creativeSettings 와 creativeSettingsKey(설정 변경 감지용)를 추가로 포함.
export interface CreativeTopicSelectionData {
  selection: StudentUnitSelection;
  topic: { id: string; title: string; summary: string };
  extraRequest: string;
  selectedKeywords: string[];
  creativeSettings: CreativeStorySettings;
}

interface Props {
  projectId: string;
  selection: StudentUnitSelection;
  creativeSettings: CreativeStorySettings;
  onPrev: () => void;
  onProceed: (data: CreativeTopicSelectionData) => void;
}

// 창작 설정 변경 감지용 키. 분야/세부설정/주인공/배경/분위기/결말 어느 하나라도 바뀌면
// 기존 주제·키워드를 무효화하기 위해 쓴다.
export const creativeSettingsKey = (s: CreativeStorySettings | null | undefined): string => {
  if (!s) return '';
  return [
    s.categoryId,
    s.genreName,
    s.materialName,
    s.protagonistCustomText || s.protagonistName || '',
    s.backgroundCustomText || s.backgroundName || '',
    s.moodId || '',
    s.endingId || '',
  ].join('|');
};

export default function CreativeTopicWorkspace({
  projectId,
  selection,
  creativeSettings,
  onPrev,
  onProceed,
}: Props) {
  const [topics, setTopics] = useState<CreativeTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isGenTopics, setIsGenTopics] = useState(false);
  const [isGenKeywords, setIsGenKeywords] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 중복 주제 생성 방지용 동기 가드(StrictMode 중복 호출 + 자동 effect 보호).
  const lastHandledKeyRef = useRef<string>('');
  const genTopicsGuardRef = useRef(false);

  const gradeName = selection.gradeName || '';
  const settingsKey = creativeSettingsKey(creativeSettings);

  // 주제 5개 생성
  const genTopics = async () => {
    if (genTopicsGuardRef.current) return;
    genTopicsGuardRef.current = true;
    setIsGenTopics(true);
    setErrorMsg(null);
    try {
      const result = await generateCreativeTopics(creativeSettings, gradeName);
      if (!result.length) {
        setTopics([]);
        setErrorMsg('주제를 만들지 못했어요. 다시 시도해 주세요.');
      } else {
        setTopics(result);
      }
    } catch {
      setTopics([]);
      setErrorMsg('주제를 만들지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsGenTopics(false);
      genTopicsGuardRef.current = false;
    }
  };

  // 키워드 생성(주제 선택 후에만 호출)
  const genKeywords = async (topicTitle: string) => {
    setIsGenKeywords(true);
    try {
      const result = await generateCreativeKeywords(creativeSettings, topicTitle);
      setKeywords(result);
    } catch {
      setKeywords([]);
    } finally {
      setIsGenKeywords(false);
    }
  };

  // 마운트 / 창작 설정 변경 시: 저장본 복원 or 주제 재생성.
  useEffect(() => {
    if (!creativeSettings?.categoryId) return;
    // 같은 settingsKey 에 대해 이미 처리했다면 무시(StrictMode 중복 호출 방지).
    if (lastHandledKeyRef.current === settingsKey) return;
    lastHandledKeyRef.current = settingsKey;

    const saved = projectId ? projectStorage.loadTopic<any>(projectId) : null;
    if (
      saved?.creativeSettings &&
      saved.topic &&
      creativeSettingsKey(saved.creativeSettings) === settingsKey
    ) {
      // 설정이 그대로라면 이전 주제·키워드 복원.
      setTopics([
        { id: saved.topic.id, title: saved.topic.title, summary: saved.topic.summary || '' },
      ]);
      setSelectedTopicId(saved.topic.id);
      setKeywords(Array.isArray(saved.selectedKeywords) ? saved.selectedKeywords : []);
      return;
    }
    // 설정이 바뀌었거나 저장이 없으면 주제를 새로 만든다.
    setTopics([]);
    setSelectedTopicId(null);
    setKeywords([]);
    genTopics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsKey, projectId]);

  const handleSelectTopic = (id: string) => {
    if (selectedTopicId === id) return;
    setSelectedTopicId(id);
    setKeywords([]);
    const t = topics.find((x) => x.id === id);
    if (t) genKeywords(t.title);
  };

  const handleRegenerate = async () => {
    if (isGenTopics) return;
    setSelectedTopicId(null);
    setKeywords([]);
    // 다시 만들 때는 가드를 새로 통과하도록 lastHandledKey 초기화.
    lastHandledKeyRef.current = '';
    await genTopics();
    lastHandledKeyRef.current = settingsKey;
  };

  const selectedTopic = topics.find((t) => t.id === selectedTopicId) || null;
  const canProceed = !!selectedTopic;

  const handleProceed = () => {
    if (!selectedTopic) return;
    const data: CreativeTopicSelectionData = {
      selection,
      topic: {
        id: selectedTopic.id,
        title: selectedTopic.title,
        summary: selectedTopic.summary || '',
      },
      extraRequest: '',
      selectedKeywords: keywords,
      creativeSettings,
    };
    onProceed(data);
  };

  const summaryRows = summarizeCreativeSettings(creativeSettings);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-6 space-y-6 animate-fade-in pb-12">
      {/* 내가 고른 설정 요약 */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 shadow-sm border border-purple-200">
        <h3 className="font-jua text-lg text-[#1f2937] mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-purple-100 border border-purple-300 flex items-center justify-center text-sm text-purple-600 font-bold">
            ✦
          </span>
          내가 고른 이야기 설정
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
          {summaryRows.map((r) => (
            <div key={r.label} className="bg-white/70 rounded-lg px-3 py-1.5">
              <span className="text-gray-500">{r.label}: </span>
              <span className="font-semibold text-[#303442]">{r.value}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-purple-500 mt-3">
          이 설정을 바탕으로 주제 5개를 만들어 드려요. 마음에 드는 주제를 하나 골라주세요.
        </p>
      </section>

      {/* 주제 5개 */}
      <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="font-jua text-lg text-[#1f2937] flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-pink-100 border border-pink-300 flex items-center justify-center text-sm text-pink-600 font-bold">
              1
            </span>
            만화 주제 5개
          </h3>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isGenTopics}
            className="btn-student btn-student-soft btn-student-sm"
          >
            {isGenTopics ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>다시 만들기</span>
          </button>
        </div>

        {isGenTopics && topics.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-[#f4f1ff] rounded-2xl border border-purple-200">
            <div className="relative">
              <Loader2 className="w-9 h-9 text-purple-500 animate-spin" />
              <span className="absolute -top-2 -right-2 text-xl animate-bounce">🤖</span>
            </div>
            <p className="text-sm font-jua text-[#38314f] animate-pulse">주제를 만들고 있어요...</p>
          </div>
        ) : errorMsg && topics.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 bg-red-50/60 rounded-2xl border border-red-200">
            <p className="text-sm font-jua text-red-500">{errorMsg}</p>
            <button
              type="button"
              onClick={() => {
                lastHandledKeyRef.current = '';
                genTopics().then(() => {
                  lastHandledKeyRef.current = settingsKey;
                });
              }}
              className="btn-student btn-student-primary btn-student-sm"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topics.map((t) => {
              const isSelected = selectedTopicId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTopic(t.id)}
                  aria-pressed={isSelected}
                  className={`relative text-left rounded-2xl p-4 border-2 transition-all ${
                    isSelected
                      ? 'border-pink-400 bg-pink-50 ring-2 ring-pink-200'
                      : 'border-purple-100 bg-white hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                >
                  <p className="font-jua text-base text-[#303442] leading-snug pr-6">{t.title}</p>
                  {t.summary && (
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{t.summary}</p>
                  )}
                  {isSelected && (
                    <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 키워드 (주제 선택 후) */}
      {selectedTopic && (
        <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100 animate-fade-in">
          <h3 className="font-jua text-lg text-[#1f2937] mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-sky-100 border border-sky-300 flex items-center justify-center text-sm text-sky-600 font-bold">
              2
            </span>
            이야기 키워드
          </h3>
          {isGenKeywords ? (
            <div className="py-6 flex items-center justify-center gap-2 text-sky-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-jua text-sm">키워드를 만들고 있어요...</span>
            </div>
          ) : keywords.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {keywords.map((k) => (
                  <span
                    key={k}
                    className="px-3 py-1.5 rounded-full text-sm bg-sky-100 text-sky-700 border-2 border-sky-200 font-semibold"
                  >
                    {k}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                고른 주제에서 뽑은 키워드예요. 이 키워드로 대본을 만들어 드려요.
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500">키워드를 만들지 못했어요. 주제를 다시 골라주세요.</p>
          )}
        </section>
      )}

      {/* 하단 액션 */}
      <div className="flex gap-2 sticky bottom-2">
        <button type="button" onClick={onPrev} className="btn-student btn-student-soft btn-student-md flex-1">
          <ArrowLeft className="w-4 h-4" />
          이전
        </button>
        <button
          type="button"
          onClick={handleProceed}
          disabled={!canProceed}
          className="btn-student btn-student-primary btn-student-md flex-[2]"
        >
          <Sparkles className="w-4 h-4" />
          {canProceed ? '대본 만들기 🚀' : '주제를 골라주세요'}
          {canProceed && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
