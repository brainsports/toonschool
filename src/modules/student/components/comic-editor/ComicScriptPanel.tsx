import { Plus } from 'lucide-react';
import type { ComicCutElement } from '../editor/utils/comicStorage';

interface Props {
  scriptData: any;
  cutNumber: number;
  onAddElement: (element: Omit<ComicCutElement, 'id'>) => void;
}

export default function ComicScriptPanel({ scriptData, cutNumber, onAddElement }: Props) {
  const cut = scriptData?.cuts?.find((c: any) => c.cutNumber === cutNumber);

  if (!cut) {
    return (
      <div className="flex flex-col h-full space-y-6 text-slate-200 p-4">
        <p className="text-slate-400 text-sm text-center mt-10">대본 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const handleAddDialogue = (dialogue: { character: string; text: string }) => {
    onAddElement({
      type: 'speechBubble',
      bubbleType: 'basic',
      speaker: dialogue.character,
      text: dialogue.text,
      x: 100,
      y: 100,
      width: 300,
      height: 150,
      rotation: 0,
      zIndex: 0,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        textColor: '#000000',
        fontSize: 24
      }
    });
  };

  return (
    <div className="flex flex-col h-full text-slate-200">
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-400 mb-2">{cutNumber}컷 대본</h3>
        <p className="text-xs text-slate-500 mb-6">원하는 대사를 클릭하면 캔버스에 말풍선으로 추가됩니다.</p>
        
        {cut.sceneDescription && (
          <div className="mb-6 p-3 bg-slate-900/50 rounded-xl border border-white/5">
            <h4 className="text-xs font-bold text-slate-400 mb-1">장면 설명</h4>
            <p className="text-sm text-slate-300">{cut.sceneDescription}</p>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400">대사 목록</h4>
          {cut.dialogues?.map((d: any, idx: number) => (
            <button
              key={idx}
              onClick={() => handleAddDialogue(d)}
              className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-600/50 border border-transparent hover:border-purple-500/50 rounded-xl transition-all group flex flex-col gap-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">{d.character}</span>
                <Plus className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <span className="text-sm text-white leading-relaxed">{d.text}</span>
            </button>
          ))}
          {(!cut.dialogues || cut.dialogues.length === 0) && (
            <p className="text-slate-500 text-sm py-4 text-center">이 컷에는 대사가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
