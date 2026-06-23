import type { GeneratedComicScript, CoverKeyConcept } from '../../../services/studentScriptService';

interface ScriptKeyConceptPanelProps {
  scriptData: GeneratedComicScript;
  onChange: (newData: GeneratedComicScript) => void;
}

export default function ScriptKeyConceptPanel({ scriptData, onChange }: ScriptKeyConceptPanelProps) {
  const concepts = scriptData.keyConcepts || [];

  const handleConceptChange = (index: number, field: keyof CoverKeyConcept, value: string) => {
    const newConcepts = [...concepts];
    if (!newConcepts[index]) {
      newConcepts[index] = { id: `concept-${index + 1}`, title: '', description: '' };
    }
    newConcepts[index] = { ...newConcepts[index], [field]: value };
    onChange({ ...scriptData, keyConcepts: newConcepts });
  };

  return (
    <div className="flex flex-col h-full text-[#303442]">
      <h2 className="text-xl font-jua text-[#202330] mb-2">표지에 넣을 핵심 개념</h2>
      <p className="text-xs text-[#626776] mb-4">선택한 학습 내용에서 가장 중요한 개념 3가지를 정리해요.</p>
      
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
        {[0, 1, 2].map((index) => {
          const concept = concepts[index] || { id: `concept-${index + 1}`, title: '', description: '' };
          const titleCount = Array.from(concept.title).length;
          const descCount = Array.from(concept.description).length;
          const isTitleOver = titleCount > 10;
          const isDescOver = descCount > 30;

          return (
            <div key={index} className="bg-white border border-[#dfe2ea] rounded-xl p-3 shadow-sm relative">
              <h3 className="text-sm font-bold text-[#202330] mb-2">핵심 개념 {index + 1}</h3>
              
              <div className="space-y-3">
                {/* 제목 */}
                <div className="relative">
                  <input
                    type="text"
                    value={concept.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (Array.from(val).length <= 10) handleConceptChange(index, 'title', val);
                    }}
                    className={`w-full p-2.5 text-sm bg-[#f8f9fc] border rounded-xl outline-none transition-all ${
                      isTitleOver
                        ? 'border-[#ff2778] focus:border-[#ff2778] focus:ring-1 focus:ring-[#ff2778]'
                        : 'border-[#dfe2ea] focus:border-[#4d82f3] focus:ring-1 focus:ring-[#4d82f3]'
                    }`}
                    placeholder="제목 (예: 계산 원리)"
                  />
                  <div className={`absolute right-2 top-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isTitleOver ? 'text-[#ff2778] bg-[#ffe6ef]' : 'text-[#8f95a6] bg-[#e5e7eb]'
                  }`}>
                    {titleCount} / 10
                  </div>
                </div>

                {/* 설명 */}
                <div className="relative">
                  <textarea
                    value={concept.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (Array.from(val).length <= 30) handleConceptChange(index, 'description', val);
                    }}
                    rows={2}
                    className={`w-full p-2.5 text-sm bg-[#f8f9fc] border rounded-xl outline-none transition-all resize-none ${
                      isDescOver
                        ? 'border-[#ff2778] focus:border-[#ff2778] focus:ring-1 focus:ring-[#ff2778]'
                        : 'border-[#dfe2ea] focus:border-[#4d82f3] focus:ring-1 focus:ring-[#4d82f3]'
                    }`}
                    placeholder="설명 (예: 사칙연산의 뜻을 이해해요)"
                  />
                  <div className={`absolute right-2 bottom-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isDescOver ? 'text-[#ff2778] bg-[#ffe6ef]' : 'text-[#8f95a6] bg-[#e5e7eb]'
                  }`}>
                    {descCount} / 30
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
