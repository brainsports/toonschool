import type { StudentUnitSelection } from '../../types/studentCurriculum';
import type { TopicRecommendation } from '../../types/studentTopic';
import type { GeneratedComicScript } from '../../services/studentScriptService';

interface ScriptPreviewBoardProps {
  zoomPercent: number;
  selectionData: {
    selection: StudentUnitSelection;
    topic: TopicRecommendation;
  };
  selectedCut: number | null;
  onSelectCut: (cut: number) => void;
  scriptData: GeneratedComicScript | null;
}

export default function ScriptPreviewBoard({ zoomPercent, selectionData, selectedCut, onSelectCut, scriptData }: ScriptPreviewBoardProps) {
  const cuts = [1, 2, 3, 4, 5, 6];

  return (
    <div 
      className="origin-top transition-transform duration-200 ease-out flex flex-col items-center"
      style={{ 
        transform: `scale(${zoomPercent / 100})`,
        width: '1000px', // 기준 캔버스 너비
        backgroundColor: '#ffffff',
        boxShadow: '0 8px 24px rgba(38, 42, 58, 0.10)',
        padding: '40px',
        minHeight: '1414px', // A4 비율 대략
      }}
    >
      {/* 대본 상단 헤더 영역 */}
      <div className="w-full text-center mb-12 border-b-2 border-[#dfe2ea] pb-8">
        <div className="text-[#555b6b] font-bold mb-4 flex items-center justify-center gap-3">
          <span className="bg-[#f3f4f7] px-3 py-1 rounded-full">{selectionData.selection.gradeName} {selectionData.selection.subjectName}</span>
          <span className="bg-[#ffe8f0] text-[#ff2778] px-3 py-1 rounded-full">{selectionData.topic.title}</span>
        </div>
        <h1 className="text-4xl font-jua text-[#202330] mb-4">{selectionData.topic.summary}</h1>
        <p className="text-xl text-[#555b6b] font-medium">6컷 만화 대본</p>
      </div>

      {/* 2x3 컷 그리드 */}
      <div className="grid grid-cols-2 gap-8 w-full">
        {cuts.map(cut => {
          const isSelected = selectedCut === cut;
          const panelData = scriptData?.cuts?.find(p => p.cutNumber === cut);
          
          return (
            <div 
              key={cut}
              onClick={() => onSelectCut(cut)}
              className={`
                aspect-[4/3] rounded-2xl border-4 flex flex-col p-6 cursor-pointer transition-all relative overflow-hidden
                ${isSelected ? 'border-[#ff2778] bg-[#fff5f8] shadow-[0_0_30px_rgba(255,39,120,0.3)] scale-[1.02] z-10' : 'border-[#dfe2ea] bg-[#ffffff] hover:border-[#ff9ebc]'}
              `}
            >
              {/* 컷 상단 헤더 */}
              <div className="flex items-center gap-3 mb-4 border-b border-dashed border-[#dfe2ea] pb-3 shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-jua border ${isSelected ? 'bg-[#ff2778] text-white border-[#ff2778]' : 'bg-[#f3f4f7] text-[#555b6b] border-[#dfe2ea]'}`}>
                  {cut}
                </div>
                {panelData && (
                  <div className="flex flex-col">
                    <span className="font-jua text-lg text-[#303442]">{panelData.role}</span>
                    <span className="text-xs text-[#626776]">{panelData.characters.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* 컷 내용 */}
              <div className="flex-1 flex flex-col justify-center min-h-0 overflow-y-auto pr-2">
                {!panelData ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-xl font-jua text-[#8f95a6]">이야기를 기다리고 있어요</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 상황 설명 */}
                    <div className="bg-[#f8f9fa] rounded-lg p-3 border border-[#dfe2ea]">
                      <p className="text-sm text-[#555b6b] italic">"{panelData.scene}"</p>
                    </div>
                    
                    {/* 대사 목록 */}
                    <div className="space-y-3">
                      {panelData.dialogues.map((dialogue, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <span className="text-xs font-bold text-[#ff2778]">{dialogue.speaker}</span>
                          <div className={`rounded-2xl px-4 py-2 text-sm text-[#303442] shadow-sm border ${dialogue.speaker.includes('선생님') ? 'bg-[#fff0f5] border-[#ffccdc]' : 'bg-white border-[#dfe2ea]'}`}>
                            {dialogue.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 학습 요점 (6컷 등 특정 위치에 강조 표시) */}
                    {panelData.learningPoint && (
                      <div className="mt-2 pt-2 border-t border-[#dfe2ea]">
                        <span className="text-xs font-bold text-[#626776]">학습 요점: </span>
                        <span className="text-xs text-[#555b6b]">{panelData.learningPoint}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
