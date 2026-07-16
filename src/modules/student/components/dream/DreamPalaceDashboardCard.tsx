/**
 * 학생 마이페이지 상단용 꿈의 궁전 요약 카드.
 * 현재 레벨 / 누적 꿈점수 / 다음 레벨까지 / 진행 막대 / 현재 장소 / 꿈의 궁전 바로가기.
 * 초등학생 눈높이에 맞춘 큰 글씨·파스텔 톤.
 */
import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useDreamProgress } from './useDreamProgress'
import { getChapter, MAX_LEVEL, getGardenBackgroundUrl } from '../../config/dreamProgressionConfig'

export default function DreamPalaceDashboardCard({ studentId }: { studentId: string | undefined | null }) {
  const navigate = useNavigate()
  const { progress: dream, isLoading } = useDreamProgress(studentId, { showLevelUpModal: false })

  const chapter = getChapter(dream.level)
  const isMax = dream.level >= MAX_LEVEL
  const pct = Math.round(dream.levelProgressRate * 100)
  const bgUrl = getGardenBackgroundUrl(dream.level)

  return (
    <div
      className="relative overflow-hidden rounded-[1.75rem] border border-purple-100 shadow-sm min-h-[180px] flex flex-col"
      role="region"
      aria-label="꿈의 궁전 현황"
    >
      {/* 배경: 현재 레벨 장면 이미지(은은하게) */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${bgUrl})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/55" aria-hidden="true" />

      <div className="relative z-10 p-5 md:p-6 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              꿈의 궁전
            </span>
            {isLoading && <span className="text-xs text-slate-400">불러오는 중…</span>}
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-500">현재 레벨</div>
            <div className="font-jua text-2xl text-pink-600 leading-none">
              LV.{dream.level}
              {isMax && <span className="text-xs text-amber-500 ml-1">최고 레벨</span>}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold text-slate-400 mb-0.5">지금 있는 곳</div>
            <div className="font-jua text-lg md:text-xl text-slate-800 leading-tight break-keep">
              {chapter.locationName}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[11px] font-bold text-slate-400 mb-0.5">내 꿈점수</div>
            <div className="font-jua text-xl md:text-2xl text-purple-600 leading-none">
              {dream.dreamScore.toLocaleString()}
              <span className="text-sm text-purple-400 ml-0.5">P</span>
            </div>
          </div>
        </div>

        {/* 진행 막대 */}
        <div className="mt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
            {isMax ? (
              <span>🎉 모든 레벨을 다 열었어요!</span>
            ) : (
              <span>다음 레벨까지 {dream.pointsToNextLevel.toLocaleString()}점</span>
            )}
            <span>{isMax ? 'MAX' : `${pct}%`}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-500"
              style={{ width: `${isMax ? 100 : Math.max(4, pct)}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/student/dream-garden')}
          className="mt-1 self-start inline-flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-sm py-2 px-4 rounded-full shadow-md shadow-purple-500/20 transition-all active:scale-95"
        >
          꿈의 궁전으로
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
