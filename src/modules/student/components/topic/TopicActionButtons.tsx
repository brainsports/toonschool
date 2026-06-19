import { ArrowLeft, ArrowRight } from 'lucide-react'

interface TopicActionButtonsProps {
  type: 'desktop-prev' | 'mobile-prev' | 'next'
  onClick: () => void
  disabled?: boolean
}

export default function TopicActionButtons({ type, onClick, disabled = false }: TopicActionButtonsProps) {
  if (type === 'desktop-prev') {
    return (
      <div className="hidden lg:flex lg:fixed lg:left-60 lg:top-24 z-40">
        <button
          onClick={onClick}
          className="card-glass card-glass-interactive flex items-center justify-center px-8 py-3.5 rounded-full text-slate-200 font-jua text-base md:text-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3] mr-2" />
          <span>이전</span>
        </button>
      </div>
    )
  }

  if (type === 'mobile-prev') {
    return (
      <div className="flex lg:hidden gap-4 mt-4">
        <button
          onClick={onClick}
          className="card-glass card-glass-interactive flex items-center justify-center flex-1 py-4 text-slate-200 font-jua text-lg"
        >
          <ArrowLeft className="w-5 h-5 stroke-[3] mr-2" />
          <span>이전</span>
        </button>
      </div>
    )
  }

  if (type === 'next') {
    return (
      <>
        {/* 데스크톱 다음 버튼 */}
        <div className="hidden lg:flex lg:fixed lg:right-10 lg:top-24 z-40">
          <button
            disabled={disabled}
            onClick={onClick}
            className={`flex items-center px-10 py-3.5 rounded-full font-jua text-base md:text-lg transition-all ${
              !disabled 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-105' 
              : 'bg-white/5 text-slate-500 border border-white/10'
            }`}
          >
            <span>다음 🚀</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
        </div>

        {/* 모바일 다음 버튼 */}
        <div className="lg:hidden mt-8 pt-6 border-t border-white/10">
          <button
            disabled={disabled}
            onClick={onClick}
            className={`flex items-center justify-center w-full py-5 text-xl font-jua
              ${!disabled
                ? 'btn-neon-purple' 
                : 'btn-neon-disabled'}`}
          >
            <span>다음 🚀</span>
            <ArrowRight className="w-6 h-6 stroke-[3] ml-2" />
          </button>
        </div>
      </>
    )
  }

  return null
}
