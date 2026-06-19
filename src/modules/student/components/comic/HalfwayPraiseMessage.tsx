// 3번 컷 완료 시 절반 완성 칭찬 메시지 컴포넌트
import { Sparkles, Trophy } from 'lucide-react'

interface HalfwayPraiseMessageProps {
  visible: boolean
}

export default function HalfwayPraiseMessage({ visible }: HalfwayPraiseMessageProps) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="card-game p-6 bg-gradient-to-br from-amber-400 to-yellow-500 border-4 border-black text-black text-center max-w-sm w-full shadow-[0_8px_0_#b45309] animate-bounce-gentle relative">
        {/* 장식 별 */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 text-2xl">
          <Sparkles className="w-8 h-8 fill-yellow-200 stroke-black stroke-2" />
          <span>🎉</span>
          <Sparkles className="w-8 h-8 fill-yellow-200 stroke-black stroke-2" />
        </div>

        <div className="w-16 h-16 rounded-full bg-white border-3 border-black flex items-center justify-center mx-auto mb-3 shadow-[0_3px_0_rgba(0,0,0,0.15)]">
          <Trophy className="w-9 h-9 text-amber-600 fill-amber-300 stroke-[2.5]" />
        </div>

        <h3 className="text-xl font-black tracking-wide text-amber-950">우와! 벌써 절반 완성!</h3>
        <p className="text-xs font-bold text-amber-900 mt-2 leading-relaxed">
          3장면이나 예쁘게 다듬어 완성했어요!<br/>
          탐사 완료까지 앞으로 3장면 더! 화이팅! 🚀
        </p>

        <div className="mt-4 text-[10px] font-black bg-black text-white py-1.5 rounded-lg border border-black/10 animate-pulse">
          자동으로 다음 장면으로 순간 이동 중...
        </div>
      </div>
    </div>
  )
}
