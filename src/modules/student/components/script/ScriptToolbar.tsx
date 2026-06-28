import { Sparkles, LayoutGrid, Lightbulb, MessageCircle, Undo2, Redo2 } from 'lucide-react';
import type { ScriptToolType } from './StudentScriptEditor';

interface ScriptToolbarProps {
  activeTool: ScriptToolType;
  onSelectTool: (tool: ScriptToolType) => void;
}

export default function ScriptToolbar({ activeTool, onSelectTool }: ScriptToolbarProps) {
  const tools = [
    { id: 'ai', icon: Sparkles, label: 'AI 생성' },
    { id: 'cut', icon: LayoutGrid, label: '컷 편집' },
    { id: 'concept', icon: Lightbulb, label: '핵심 개념' },
    { id: 'coverDialogue', icon: MessageCircle, label: '표지 대화' }
  ] as const;

  return (
    <div className="w-full h-full flex flex-col items-center py-4 bg-[#f3f4f7] border-r border-[#dfe2ea]">
      <div className="flex flex-col gap-4 w-full px-2">
        {tools.map(tool => {
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all group relative ${
                isActive 
                  ? 'bg-[#ff2778] text-[#ffffff]' 
                  : 'text-[#555b6b] bg-transparent hover:bg-[#ffe6ef] hover:text-[#ff2778]'
              }`}
              title={tool.label}
            >
              <tool.icon className={`w-6 h-6 mb-1.5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-[10px] font-jua text-center whitespace-nowrap leading-tight">
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-3 w-full px-2 pt-4 border-t border-[#dfe2ea]">
        <button className="flex flex-col items-center justify-center p-2 rounded-xl text-[#555b6b] bg-transparent hover:bg-[#ffe6ef] hover:text-[#ff2778] transition-colors">
          <Undo2 className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-jua">취소</span>
        </button>
        <button className="flex flex-col items-center justify-center p-2 rounded-xl text-[#555b6b] bg-transparent hover:bg-[#ffe6ef] hover:text-[#ff2778] transition-colors">
          <Redo2 className="w-5 h-5 mb-1" />
          <span className="text-[9px] font-jua">다시</span>
        </button>
      </div>
    </div>
  );
}
