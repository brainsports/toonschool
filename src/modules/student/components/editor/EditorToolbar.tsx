import { MousePointer2, Type, Users, MessageSquare, Image as ImageIcon, Shapes, Layout, Layers, Undo, Redo } from 'lucide-react';
import type { EditorToolType } from './types';

interface Props {
  activeTool: EditorToolType;
  onChangeTool: (tool: EditorToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showBackgroundTool?: boolean;
}

export default function EditorToolbar({ activeTool, onChangeTool, onUndo, onRedo, canUndo, canRedo, showBackgroundTool = false }: Props) {
  const tools: { id: EditorToolType; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: '선택' },
    { id: 'text', icon: Type, label: '텍스트' },
    { id: 'character', icon: Users, label: '캐릭터' },
    { id: 'bubble', icon: MessageSquare, label: '말풍선' },
    { id: 'graphic', icon: ImageIcon, label: '그래픽' },
    { id: 'shape', icon: Shapes, label: '도형' },
    ...(showBackgroundTool ? [{ id: 'background' as EditorToolType, icon: Layout, label: '배경' }] : []),
    { id: 'layer', icon: Layers, label: '레이어' },
  ];

  return (
    <div className="flex flex-col items-center py-4 gap-2 h-full overflow-y-auto w-full">
      {tools.map(tool => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => onChangeTool(tool.id)}
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${isActive ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
            title={tool.label}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">{tool.label}</span>
          </button>
        );
      })}
      
      <div className="h-px w-10 bg-white/10 my-2" />
      
      <button onClick={onUndo} disabled={!canUndo} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${canUndo ? 'text-slate-400 hover:text-slate-200 hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'}`}>
        <Undo className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-bold">취소</span>
      </button>
      <button onClick={onRedo} disabled={!canRedo} className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${canRedo ? 'text-slate-400 hover:text-slate-200 hover:bg-white/10' : 'text-slate-600 cursor-not-allowed'}`}>
        <Redo className="w-5 h-5 mb-1" />
        <span className="text-[10px] font-bold">다시실행</span>
      </button>
    </div>
  );
}
