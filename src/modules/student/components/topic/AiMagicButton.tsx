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
      className="btn-primary-action !bg-[#6366F1] hover:!bg-[#4F46E5] !text-white flex items-center justify-center w-full max-w-[320px] min-w-[260px] mx-auto py-3 md:py-4 text-xl font-jua shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <Wand2 className={`w-6 h-6 mr-3 stroke-[3] ${genState === 'loading' ? 'animate-spin' : 'animate-bounce-gentle'}`} />
      <span>
        {genState === 'loading' 
          ? '추천 주제를 만들고 있어요...' 
          : genState === 'idle' 
            ? '이야기 추천 ✨' 
            : '새로운 이야기로 다시 받기 🔄'}
      </span>
    </button>
  )
}
