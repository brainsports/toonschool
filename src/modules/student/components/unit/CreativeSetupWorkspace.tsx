// 창작 과목 설정 워크스페이스.
// 흐름: 창작 분야 선택 → 세부 설정(장르/소재 필수 + 주인공/배경/분위기/결말) → 요약 → 주제 만들기.
// '창작'은 교과 단원이 아니므로, 이 화면에서 선택한 CreativeStorySettings 를 이후 주제/키워드/대본에 전달.
import { useMemo, useState } from 'react';
import {
  CREATIVE_CATEGORIES,
  CREATIVE_PROTAGONISTS,
  CREATIVE_MOODS,
  CREATIVE_ENDINGS,
  CREATIVE_COMMON_BACKGROUNDS,
  CREATIVE_INPUT_LIMITS,
  getCreativeCategory,
  summarizeCreativeSettings,
  type CreativeStorySettings,
} from '../../data/creativeCategories';
import { projectStorage } from '../../utils/projectStorage';
import { showToast } from '../../utils/toast';

interface Props {
  projectId: string;
  gradeName?: string;
  initial?: CreativeStorySettings | null;
  onComplete: (settings: CreativeStorySettings) => void;
  onBack: () => void;
}

type Field = 'genre' | 'material' | 'protagonist' | 'background';

// 간이 검증: 공백/개인정보 패턴. 학생에게 쉬운 안내.
const validateCustom = (text: string): string | null => {
  const t = text.trim();
  if (!t) return '내용을 적어 주세요.';
  if (/\b\d{2,3}[-.]?\d{3,4}[-.]?\d{4}\b/.test(t)) return '전화번호는 적지 말아 주세요.';
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(t)) return '이메일은 적지 말아 주세요.';
  if (/(씨발|병신|존나|개새|fuck|shit)/i.test(t)) return '다른 친구가 함께 봐도 좋은 내용으로 적어 주세요.';
  return null;
};

export default function CreativeSetupWorkspace({ projectId, initial, onComplete, onBack }: Props) {
  const [settings, setSettings] = useState<CreativeStorySettings>(
    () =>
      initial ?? {
        categoryId: '',
        categoryName: '',
        genreName: '',
        materialName: '',
        endingId: 'ai',
        endingName: CREATIVE_ENDINGS.find((e) => e.id === 'ai')?.label,
        characterMode: 'standard',
      }
  );
  // 직접 입력 모드 필드
  const [customField, setCustomField] = useState<Field | null>(null);
  const [customText, setCustomText] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  const category = useMemo(() => getCreativeCategory(settings.categoryId), [settings.categoryId]);

  const handleSelectCategory = (id: string) => {
    const cat = getCreativeCategory(id);
    if (!cat) return;
    // 분야 변경 시 장르/소재/배경 초기화(이전 주제·키워드 무효화). 분위기는 추천값으로.
    setSettings((s) => ({
      ...s,
      categoryId: id,
      categoryName: cat.name,
      genreName: '',
      materialName: '',
      backgroundName: undefined,
      backgroundCustomText: undefined,
      moodId: cat.recommendedMoodId,
      moodName: CREATIVE_MOODS.find((m) => m.id === cat.recommendedMoodId)?.label,
    }));
    setCustomField(null);
    setCustomError(null);
    // 설정 변경 시 이전 키워드/주제 무효화를 위해 projectStorage 키를 같이 갱신해 두는 것은 호출측(onComplete)에서 처리.
  };

  const openCustom = (field: Field) => {
    setCustomField(field);
    setCustomText('');
    setCustomError(null);
  };

  const confirmCustom = () => {
    if (!customField) return;
    const err = validateCustom(customText);
    if (err) {
      setCustomError(err);
      return;
    }
    const limit =
      customField === 'genre'
        ? CREATIVE_INPUT_LIMITS.genre
        : customField === 'material'
        ? CREATIVE_INPUT_LIMITS.material
        : customField === 'protagonist'
        ? CREATIVE_INPUT_LIMITS.protagonist
        : CREATIVE_INPUT_LIMITS.background;
    const value = customText.trim().slice(0, limit);
    setSettings((s) => {
      const patch: Partial<CreativeStorySettings> = {};
      if (customField === 'genre') patch.genreName = value;
      else if (customField === 'material') patch.materialName = value;
      else if (customField === 'protagonist') {
        patch.protagonistName = '직접 입력';
        patch.protagonistCustomText = value;
      } else if (customField === 'background') {
        patch.backgroundName = '직접 입력';
        patch.backgroundCustomText = value;
      }
      return { ...s, ...patch };
    });
    setCustomField(null);
  };

  const isComplete = !!(settings.categoryId && settings.genreName && settings.materialName);

  const handleProceed = () => {
    if (!isComplete) {
      if (!settings.categoryId) showToast('창작 분야를 골라 주세요.');
      else if (!settings.genreName) showToast('세부 장르를 하나 골라 주세요.');
      else if (!settings.materialName) showToast('이야기 소재를 하나 골라 주세요.');
      return;
    }
    const finalSettings: CreativeStorySettings = { ...settings, createdAt: new Date().toISOString() };
    // 이어서 만들기 복원용 저장.
    projectStorage.saveCreativeSettings(projectId, finalSettings);
    onComplete(finalSettings);
  };

  const summaryRows = isComplete ? summarizeCreativeSettings(settings) : [];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-6 space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="font-jua text-2xl text-[#1f2937] mb-1">어떤 이야기를 만들어 볼까요? 🎨</h2>
        <p className="text-sm text-gray-500">창작 분야를 고르면, 그 분야에 맞는 이야기를 만들 수 있어요.</p>
      </div>

      {/* 1단계: 창작 분야 */}
      <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100">
        <h3 className="font-jua text-lg text-[#1f2937] mb-3 flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-pink-100 border border-pink-300 flex items-center justify-center text-sm text-pink-600 font-bold">1</span>
          창작 분야를 골라 주세요
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CREATIVE_CATEGORIES.map((cat) => {
            const isSelected = settings.categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                aria-pressed={isSelected}
                className={`relative rounded-2xl p-3 text-center border-2 transition-all min-h-[110px] flex flex-col items-center justify-center ${
                  isSelected
                    ? 'border-pink-400 bg-pink-50 ring-2 ring-pink-200'
                    : 'border-purple-100 bg-white hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                <span className="text-4xl mb-1" aria-hidden>{cat.icon}</span>
                <span className="font-jua text-base text-[#303442] leading-tight">{cat.name}</span>
                <span className="text-[11px] text-gray-500 mt-0.5 leading-snug">{cat.description}</span>
                {isSelected && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center shadow">✓</span>
                )}
              </button>
            );
          })}
        </div>
        {category?.safetyNote && (
          <p className="text-xs text-amber-600 mt-3">⚠ {category.safetyNote}</p>
        )}
      </section>

      {/* 2단계: 세부 설정 (분야 선택 후) */}
      {category && (
        <section className="bg-white/90 rounded-2xl p-5 shadow-sm border border-purple-100 space-y-5 animate-fade-in">
          <h3 className="font-jua text-lg text-[#1f2937] flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-pink-100 border border-pink-300 flex items-center justify-center text-sm text-pink-600 font-bold">2</span>
            세부 설정
          </h3>

          {/* 세부 장르 (필수) */}
          <ChipGroup
            label="세부 장르 *"
            options={category.genres}
            selected={settings.genreName}
            onSelect={(v) => setSettings((s) => ({ ...s, genreName: v }))}
            onCustom={() => openCustom('genre')}
            isCustom={settings.genreName === '직접 입력' || (settings.genreName && !category.genres.includes(settings.genreName)) ? true : false}
          />

          {/* 이야기 소재 (필수) */}
          <ChipGroup
            label="이야기 소재 *"
            options={category.materials}
            selected={settings.materialName}
            onSelect={(v) => setSettings((s) => ({ ...s, materialName: v }))}
            onCustom={() => openCustom('material')}
            isCustom={settings.materialName === '직접 입력' || (settings.materialName && !category.materials.includes(settings.materialName)) ? true : false}
          />

          {/* 주인공 */}
          <ChipGroup
            label="주인공"
            options={CREATIVE_PROTAGONISTS}
            selected={settings.protagonistName || ''}
            onSelect={(v) => setSettings((s) => ({ ...s, protagonistName: v, protagonistCustomText: v === '직접 입력' ? s.protagonistCustomText : undefined }))}
            onCustom={() => openCustom('protagonist')}
            isCustom={settings.protagonistName === '직접 입력'}
          />

          {/* 배경 (분야 추천 + 공통) */}
          <div>
            <ChipGroup
              label="배경 (추천)"
              options={category.backgrounds}
              selected={settings.backgroundName || ''}
              onSelect={(v) => setSettings((s) => ({ ...s, backgroundName: v, backgroundCustomText: undefined }))}
            />
            <details className="mt-2">
              <summary className="text-xs text-purple-600 cursor-pointer">다른 배경 보기</summary>
              <div className="mt-2">
                <ChipGroup
                  label=""
                  options={CREATIVE_COMMON_BACKGROUNDS}
                  selected={settings.backgroundName || ''}
                  onSelect={(v) => {
                    if (v === '직접 입력') openCustom('background');
                    else setSettings((s) => ({ ...s, backgroundName: v, backgroundCustomText: undefined }));
                  }}
                  onCustom={() => openCustom('background')}
                  isCustom={settings.backgroundName === '직접 입력'}
                />
              </div>
            </details>
          </div>

          {/* 분위기 (단일 선택) */}
          <div>
            <div className="text-sm font-semibold text-[#374151] mb-2">분위기</div>
            <div className="flex flex-wrap gap-2">
              {CREATIVE_MOODS.map((m) => {
                const isSelected = settings.moodId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, moodId: m.id, moodName: m.label }))}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      isSelected ? 'bg-purple-500 text-white border-purple-500' : 'bg-white border-purple-100 text-[#374151] hover:border-purple-300'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 결말 (단일 선택) */}
          <div>
            <div className="text-sm font-semibold text-[#374151] mb-2">결말 방향</div>
            <div className="flex flex-wrap gap-2">
              {CREATIVE_ENDINGS.map((e) => {
                const isSelected = settings.endingId === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, endingId: e.id, endingName: e.label }))}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                      isSelected ? 'bg-purple-500 text-white border-purple-500' : 'bg-white border-purple-100 text-[#374151] hover:border-purple-300'
                    }`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 캐릭터 방식 (표준 / 자유) */}
          <div>
            <div className="text-sm font-semibold text-[#374151] mb-1">캐릭터 방식</div>
            <p className="text-xs text-gray-500 mb-2">만화에 어떤 캐릭터를 쓸지 정해 보세요.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, characterMode: 'standard' }))}
                aria-pressed={settings.characterMode !== 'free'}
                className={`text-left rounded-xl p-3 border-2 transition-all ${
                  settings.characterMode !== 'free'
                    ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-purple-100 bg-white hover:border-purple-300'
                }`}
              >
                <div className="font-jua text-sm text-[#303442]">표준 캐릭터로 만들기</div>
                <div className="text-xs text-gray-500 mt-0.5">도윤, 서아, 하나 선생님이 등장해요. 빠르고 일관돼요.</div>
              </button>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, characterMode: 'free' }))}
                aria-pressed={settings.characterMode === 'free'}
                className={`text-left rounded-xl p-3 border-2 transition-all ${
                  settings.characterMode === 'free'
                    ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-purple-100 bg-white hover:border-purple-300'
                }`}
              >
                <div className="font-jua text-sm text-[#303442]">이야기에 맞는 자유 캐릭터로 만들기</div>
                <div className="text-xs text-gray-500 mt-0.5">주인공·분위기에 맞춘 자유 캐릭터가 대본에 반영돼요.</div>
              </button>
            </div>
            {settings.characterMode === 'free' && (
              <div className="mt-2 animate-fade-in">
                <input
                  className="input-game-soft"
                  placeholder="추가로 넣고 싶은 캐릭터 모습을 적어 보세요 (선택). 예: 파란 로브를 입은 마법사"
                  maxLength={60}
                  value={settings.customCharacterDescription || ''}
                  onChange={(e) => setSettings((s) => ({ ...s, customCharacterDescription: e.target.value }))}
                />
                <p className="text-[11px] text-amber-600 mt-1">※ 지금은 대본·표지에 반영됩니다. 만화 칸의 캐릭터 그림은 아직 표준 캐릭터로 배치돼요.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 직접 입력 모달 */}
      {customField && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setCustomField(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-jua text-lg mb-2">
              {customField === 'genre' && '세부 장르 직접 입력'}
              {customField === 'material' && '이야기 소재 직접 입력'}
              {customField === 'protagonist' && '주인공 직접 입력'}
              {customField === 'background' && '배경 직접 입력'}
            </h4>
            <p className="text-xs text-gray-500 mb-2">
              최대{' '}
              {customField === 'genre'
                ? CREATIVE_INPUT_LIMITS.genre
                : customField === 'material'
                ? CREATIVE_INPUT_LIMITS.material
                : customField === 'protagonist'
                ? CREATIVE_INPUT_LIMITS.protagonist
                : CREATIVE_INPUT_LIMITS.background}
              자까지 적을 수 있어요.
            </p>
            <input
              className="input-game-soft"
              autoFocus
              maxLength={
                customField === 'genre'
                  ? CREATIVE_INPUT_LIMITS.genre
                  : customField === 'material'
                  ? CREATIVE_INPUT_LIMITS.material
                  : customField === 'protagonist'
                  ? CREATIVE_INPUT_LIMITS.protagonist
                  : CREATIVE_INPUT_LIMITS.background
              }
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmCustom()}
            />
            {customError && <p className="text-xs text-red-500 mt-1">{customError}</p>}
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={() => setCustomField(null)} className="btn-student btn-student-soft btn-student-sm flex-1">취소</button>
              <button type="button" onClick={confirmCustom} className="btn-student btn-student-primary btn-student-sm flex-1">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* 요약 + 진행 */}
      {isComplete && (
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 shadow-sm border border-purple-200">
          <h3 className="font-jua text-lg text-[#1f2937] mb-3">내가 고른 이야기 📖</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {summaryRows.map((r) => (
              <div key={r.label} className="bg-white/70 rounded-lg px-3 py-1.5">
                <span className="text-gray-500">{r.label}: </span>
                <span className="font-semibold text-[#303442]">{r.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 하단 액션 */}
      <div className="flex gap-2 sticky bottom-2">
        <button type="button" onClick={onBack} className="btn-student btn-student-soft btn-student-md flex-1">이전</button>
        <button
          type="button"
          onClick={handleProceed}
          disabled={!isComplete}
          className="btn-student btn-student-primary btn-student-md flex-[2]"
        >
          {isComplete ? '이 설정으로 주제 만들기 ✨' : '분야·장르·소재를 골라주세요'}
        </button>
      </div>
    </div>
  );
}

// 칩 그룹 (옵션 선택 + 직접 입력 버튼).
function ChipGroup({
  label,
  options,
  selected,
  onSelect,
  onCustom,
  isCustom,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onCustom?: () => void;
  isCustom?: boolean;
}) {
  return (
    <div>
      {label && <div className="text-sm font-semibold text-[#374151] mb-2">{label}</div>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = !isCustom && selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              aria-pressed={isSelected}
              className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all min-h-[36px] ${
                isSelected ? 'bg-purple-500 text-white border-purple-500' : 'bg-white border-purple-100 text-[#374151] hover:border-purple-300'
              }`}
            >
              {opt}
            </button>
          );
        })}
        {onCustom && (
          <button
            type="button"
            onClick={onCustom}
            aria-pressed={isCustom}
            className={`px-3 py-1.5 rounded-full text-sm border-2 border-dashed transition-all min-h-[36px] ${
              isCustom ? 'bg-purple-500 text-white border-purple-500' : 'bg-white border-purple-200 text-purple-500 hover:border-purple-400'
            }`}
          >
            ✏️ 직접 입력
          </button>
        )}
      </div>
    </div>
  );
}
