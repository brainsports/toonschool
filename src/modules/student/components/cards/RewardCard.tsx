// 보상 카드 컴포넌트 (별, 배지 등)
import type { RewardResult } from '../../types/studentFlow'
import StudentRewardBadge from '../StudentRewardBadge'
import { Star } from 'lucide-react'
import StudentWideCard from '../layout/StudentWideCard'

interface RewardCardProps {
  reward: RewardResult
}

export default function RewardCard({ reward }: RewardCardProps) {
  return (
    <StudentWideCard className="!bg-amber-900/20 !border-amber-500/30 text-white relative overflow-hidden shadow-sm !p-8 md:!p-10">
      {/* 장식용 코너 리본 */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/80 border-l border-b border-white/20 rotate-45 translate-x-10 -translate-y-10 shadow-sm" />
      
      <div className="text-center mb-6">
        <span className="text-5xl select-none animate-bounce-gentle inline-block drop-shadow-sm">✨🎁✨</span>
        <h4 className="text-2xl font-jua text-amber-200 tracking-wide mt-2">미션 완료 보상 보드</h4>
      </div>

      <div className="space-y-6">
        {/* 별 획득 개수 */}
        <div className="bg-white/10 border border-white/20 p-5 rounded-[2rem] flex flex-col sm:flex-row items-center justify-center gap-4 shadow-inner backdrop-blur-md">
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(reward.stars, 5) }).map((_, i) => (
              <Star 
                key={i} 
                className="w-10 h-10 fill-yellow-400 stroke-amber-500 stroke-[2] animate-float drop-shadow-sm" 
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-xl md:text-2xl font-jua text-amber-200 tracking-wider">
            별 +{reward.stars} 획득!
          </p>
        </div>

        {/* AI 메시지 */}
        <div className="bg-white/5 border border-amber-500/30 rounded-[1.5rem] p-5 relative shadow-sm backdrop-blur-sm">
          <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed text-center">
            "{reward.message}"
          </p>
        </div>

        {/* 획득한 배지 목록 */}
        {reward.badges.length > 0 && (
          <div className="pt-2">
            <p className="text-sm font-jua text-amber-300/80 mb-3 tracking-wider text-center">★ 획득한 특별 배지 ★</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {reward.badges.map((badge) => (
                <StudentRewardBadge
                  key={badge.id}
                  emoji={badge.emoji}
                  name={badge.name}
                  size="md"
                />
              ))}
            </div>
          </div>
        )}

        {/* 완성 날짜 */}
        {reward.completionDate && (
          <p className="text-xs font-jua text-slate-400 text-center tracking-wide mt-6">
            탐험 기록일: {reward.completionDate}
          </p>
        )}
      </div>
    </StudentWideCard>
  )
}
