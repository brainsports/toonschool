import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type { GeneratedComicScript, ScriptCut, ScriptDialogue } from '../../services/studentScriptService';

interface ScriptCutEditorProps {
  scriptData: GeneratedComicScript;
  onChange: (newData: GeneratedComicScript) => void;
  selectedCut: number | null;
  onSelectCut: (cut: number | null) => void;
}

export default function ScriptCutEditor({ scriptData, onChange, selectedCut, onSelectCut }: ScriptCutEditorProps) {
  // If selectedCut is null, default to 1
  const currentCutNumber = selectedCut || 1;
  const currentCutIndex = currentCutNumber - 1;
  const currentCut = scriptData.cuts[currentCutIndex];

  if (!currentCut) {
    return <div className="p-4 text-[#555b6b]">컷 데이터가 없습니다.</div>;
  }

  const handleCutChange = (field: keyof ScriptCut, value: any) => {
    const newCuts = [...scriptData.cuts];
    newCuts[currentCutIndex] = { ...currentCut, [field]: value };
    onChange({ ...scriptData, cuts: newCuts });
  };

  const handleDialogueChange = (dialogueIndex: number, field: keyof ScriptDialogue, value: string) => {
    const newDialogues = [...currentCut.dialogues];
    newDialogues[dialogueIndex] = { ...newDialogues[dialogueIndex], [field]: value };
    handleCutChange('dialogues', newDialogues);
  };

  const handleAddDialogue = () => {
    if (currentCut.dialogues.length >= 3) return;
    const newDialogues = [...currentCut.dialogues, { speaker: '도윤', text: '' }];
    handleCutChange('dialogues', newDialogues);
  };

  const handleRemoveDialogue = (index: number) => {
    const newDialogues = currentCut.dialogues.filter((_, i) => i !== index);
    handleCutChange('dialogues', newDialogues);
  };

  const handleMoveDialogue = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentCut.dialogues.length - 1) return;

    const newDialogues = [...currentCut.dialogues];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newDialogues[index], newDialogues[swapIndex]] = [newDialogues[swapIndex], newDialogues[index]];
    handleCutChange('dialogues', newDialogues);
  };


  return (
    <div className="flex flex-col h-full text-[#303442]">
      <h2 className="text-xl font-jua text-[#202330] mb-4">컷별 대화 편집</h2>
      
      {/* 컷 선택 탭 */}
      <div className="flex flex-wrap gap-1 mb-4">
        {[1, 2, 3, 4, 5, 6].map(num => (
          <button
            key={num}
            onClick={() => onSelectCut(num)}
            className={`flex-1 py-2 font-jua text-sm rounded-lg border transition-all ${
              currentCutNumber === num
                ? 'bg-[#ffe6ef] border-[#ff2778] text-[#ff2778]'
                : 'bg-white border-[#dfe2ea] text-[#555b6b] hover:bg-slate-50'
            }`}
          >
            {num}컷
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {/* 컷 제목 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#626776]">컷 제목</label>
          <input
            type="text"
            value={currentCut.role}
            onChange={(e) => handleCutChange('role', e.target.value)}
            className="w-full p-2.5 text-sm bg-white border border-[#dfe2ea] rounded-xl focus:border-[#ff2778] focus:ring-1 focus:ring-[#ff2778] outline-none transition-all"
            placeholder="컷 제목을 입력하세요 (예: 이야기 시작)"
          />
        </div>

        {/* 장면 설명 */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#626776]">장면 설명 (그림 생성용, 말풍선 노출 X)</label>
          <textarea
            value={currentCut.scene}
            onChange={(e) => handleCutChange('scene', e.target.value)}
            rows={2}
            className="w-full p-2.5 text-sm bg-white border border-[#dfe2ea] rounded-xl focus:border-[#ff2778] focus:ring-1 focus:ring-[#ff2778] outline-none transition-all resize-none"
            placeholder="장면을 묘사해주세요"
          />
        </div>


        {/* 대사 목록 */}
        <div className="space-y-2 pt-2 border-t border-[#dfe2ea]">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-[#626776]">대사 편집 (최대 3개)</label>
            <button
              onClick={handleAddDialogue}
              disabled={currentCut.dialogues.length >= 3}
              className="flex items-center gap-1 text-[11px] font-bold text-[#ff2778] hover:bg-[#ffe6ef] px-2 py-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>
          
          <div className="space-y-3">
            {currentCut.dialogues.map((dialogue, index) => {
              const charCount = Array.from(dialogue.text).length;
              const isOverLimit = charCount > 20;

              return (
                <div key={index} className="bg-white border border-[#dfe2ea] rounded-xl p-3 shadow-sm relative group">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={dialogue.speaker}
                      onChange={(e) => handleDialogueChange(index, 'speaker', e.target.value)}
                      placeholder="화자"
                      className="w-20 text-xs font-bold p-1.5 bg-[#f3f4f7] border border-transparent rounded-lg focus:border-[#d5d9e2] outline-none"
                    />
                    <div className="flex-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleMoveDialogue(index, 'up')} disabled={index === 0} className="p-1 text-[#8f95a6] hover:text-[#303442] disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleMoveDialogue(index, 'down')} disabled={index === currentCut.dialogues.length - 1} className="p-1 text-[#8f95a6] hover:text-[#303442] disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleRemoveDialogue(index)} className="p-1 text-[#8f95a6] hover:text-[#ff2778]"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      value={dialogue.text}
                      onChange={(e) => {
                        const newText = e.target.value;
                        handleDialogueChange(index, 'text', newText);
                      }}
                      rows={2}
                      placeholder="대사를 입력하세요 (20자 이내)"
                      className={`w-full p-2.5 text-sm bg-[#f8f9fc] border rounded-xl outline-none transition-all resize-none ${
                        isOverLimit 
                          ? 'border-[#f59e0b] focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b]' 
                          : 'border-[#dfe2ea] focus:border-[#4d82f3] focus:ring-1 focus:ring-[#4d82f3]'
                      }`}
                    />
                    <div className={`absolute bottom-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isOverLimit ? 'text-[#d97706] bg-[#fef3c7]' : 'text-[#8f95a6] bg-[#e5e7eb]'
                    }`}>
                      권장 20자 / 현재 {charCount}자
                    </div>
                  </div>
                </div>
              );
            })}
            
            {currentCut.dialogues.length === 0 && (
              <div className="text-sm text-center text-[#8f95a6] py-4 bg-white border border-dashed border-[#dfe2ea] rounded-xl">
                대사가 없습니다. 대사를 추가해 보세요.
              </div>
            )}
          </div>
        </div>

        {/* 학습 요점 */}
        <div className="space-y-1.5 pt-2 border-t border-[#dfe2ea]">
          <label className="text-xs font-bold text-[#626776]">학습 요점</label>
          <input
            type="text"
            value={currentCut.learningPoint}
            onChange={(e) => handleCutChange('learningPoint', e.target.value)}
            className="w-full p-2.5 text-sm bg-white border border-[#dfe2ea] rounded-xl focus:border-[#ff2778] focus:ring-1 focus:ring-[#ff2778] outline-none transition-all"
            placeholder="이 컷의 학습 요점을 간략히 입력하세요"
          />
        </div>
      </div>
    </div>
  );
}
