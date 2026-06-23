
interface Props {
  cutNumber: number;
  scriptData: any;
  onRegenBackground: () => void;
}

export default function BackgroundInfoPanel({ cutNumber, scriptData, onRegenBackground }: Props) {
  const cutScript = scriptData?.cuts?.find((c: any) => c.cutNumber === cutNumber);

  if (!cutScript) {
    return (
      <div className="flex flex-col h-full p-4 text-slate-300">
        <p>컷 스크립트 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 text-slate-200">
      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-2">장면 이름</h3>
        <p className="text-lg font-jua text-white bg-slate-900/50 p-3 rounded-xl border border-white/5">{cutScript.scene}</p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-2">배경 설명</h3>
        <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-white/5 leading-relaxed">{cutScript.description || cutScript.scene}</p>
      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-400 mb-2">등장 캐릭터</h3>
        <div className="flex gap-2 flex-wrap">
          {cutScript.characters?.map((char: string) => (
            <span key={char} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold border border-purple-500/30">
              {char}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/10">
        <button 
          onClick={onRegenBackground}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors shadow-lg border border-purple-400/30"
        >
          배경 다시 만들기
        </button>
        <p className="text-xs text-slate-500 text-center mt-2">
          현재 배경이 마음에 들지 않으면 새로 생성할 수 있어요.
        </p>
      </div>
    </div>
  );
}
