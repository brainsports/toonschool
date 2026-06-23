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
      className="btn-primary-action flex items-center justify-center w-full py-6 md:py-8 text-2xl font-jua shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <Wand2 className={`w-8 h-8 mr-3 stroke-[3] ${genState === 'loading' ? 'animate-spin' : 'animate-bounce-gentle'}`} />
      <span>
        {genState === 'loading' 
          ? '추천 주제를 만들고 있어요...' 
          : genState === 'idle' 
            ? 'AI 추천 마법 부리기 ✨' 
            : '새로운 키워드로 다시 받기 🔄'}
      </span>
    </button>
  )
}
