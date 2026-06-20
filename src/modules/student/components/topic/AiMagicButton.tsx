import { Wand2 } from 'lucide-react'
import type { TopicGenerationState } from '../../types/studentTopic'

interface AiMagicButtonProps {
  genState: TopicGenerationState
  disabled: boolean
  onClick: () => void
}

export default function AiMagicButton({ genState, disabled, onClick }: AiMagicButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center w-full py-6 md:py-8 text-2xl font-jua
        ${disabled
          ? 'btn-neon-disabled'
          : 'btn-neon-purple'
        }`}
    >
      <Wand2 className={`w-8 h-8 mr-3 stroke-[3] ${genState === 'loading' ? 'animate-spin' : 'animate-bounce-gentle'}`} />
      <span>{genState === 'idle' ? 'AI 추천 마법 부리기 ✨' : '새로운 주제 다시 받기 🔄'}</span>
    </button>
  )
}
