import type { GeneratedComicScript, CoverDialogue } from '../../../services/studentScriptService';

interface ScriptCoverDialoguePanelProps {
  scriptData: GeneratedComicScript;
  onChange: (newData: GeneratedComicScript) => void;
}

export default function ScriptCoverDialoguePanel({ scriptData, onChange }: ScriptCoverDialoguePanelProps) {
  const dialogue = scriptData.coverDialogue || { hana: '', doyoon: '', seoa: '' };

  const handleChange = (speaker: keyof CoverDialogue, value: string) => {
    if (Array.from(value).length > 28) return;
    onChange({
      ...scriptData,
      coverDialogue: { ...dialogue, [speaker]: value }
    });
  };

  const speakers = [
    { key: 'hana' as const, name: '하나 선생님', role: '주제 질문' },
    { key: 'doyoon' as const, name: '도윤', role: '개념·원리' },
    { key: 'seoa' as const, name: '서아', role: '적용·생각' }
  ];

  return (
    <div className="flex flex-col h-full text-[#303442]">
      <h2 className="text-xl font-jua text-[#202330] mb-2">표지에 넣을 대화</h2>
      <p className="text-xs text-[#626776] mb-4">하나 선생님의 질문과 도윤·서아의 답을 확인해요.</p>
      
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
        {speakers.map((sp) => {
          const text = dialogue[sp.key] || '';
          const count = Array.from(text).length;
          const isOver = count > 28;

          return (
            <div key={sp.key} className="bg-white border border-[#dfe2ea] rounded-xl p-3 shadow-sm relative">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-bold text-[#202330]">{sp.name}</h3>
                <span className="text-[10px] font-bold text-[#ff2778] bg-[#ffe6ef] px-1.5 py-0.5 rounded-md">
                  {sp.role}
                </span>
              </div>
              
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => handleChange(sp.key, e.target.value)}
                  rows={2}
                  className={`w-full p-2.5 text-sm bg-[#f8f9fc] border rounded-xl outline-none transition-all resize-none ${
                    isOver
                      ? 'border-[#ff2778] focus:border-[#ff2778] focus:ring-1 focus:ring-[#ff2778]'
                      : 'border-[#dfe2ea] focus:border-[#4d82f3] focus:ring-1 focus:ring-[#4d82f3]'
                  }`}
                  placeholder={`${sp.name}의 대사를 적어주세요`}
                />
                <div className={`absolute right-2 bottom-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  isOver ? 'text-[#ff2778] bg-[#ffe6ef]' : 'text-[#8f95a6] bg-[#e5e7eb]'
                }`}>
                  {count} / 28
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
