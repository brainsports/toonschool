// 작품 완성 축하 화면 (게임 클리어)
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import RewardCard from '../components/cards/RewardCard'
import { mockRewardResult, mockStudentProfile } from '../data/studentMockData'
import { Sparkles, ArrowRight } from 'lucide-react'
import StudentWideCard from '../components/layout/StudentWideCard'
import StudentPrimaryActionButton from '../components/layout/StudentPrimaryActionButton'

export default function StudentCompletePage() {
  const navigate = useNavigate()

  return (
    <StudentCreationLayout currentStep="complete" bgVariant="space" maxWidth="full">
      <div className="flex flex-col gap-6 animate-fade-in pb-8">
        
        {/* 헤더 영역 */}
        <div className="text-center pt-8 relative select-none">
          {/* 반짝이 이펙트 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-4 text-4xl">
            <Sparkles className="w-10 h-10 fill-yellow-300 stroke-yellow-500 stroke-2 animate-bounce-gentle drop-shadow-sm" />
            <Sparkles className="w-10 h-10 fill-yellow-300 stroke-yellow-500 stroke-2 animate-bounce-gentle drop-shadow-sm delay-100" />
          </div>

          <h1 className="text-4xl md:text-5xl font-jua text-white mt-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
            완성했어요!
          </h1>
          <p className="text-lg font-bold text-purple-200 mt-4">
            멋진 만화책이 완성되었어요!
          </p>
        </div>

        <div className="space-y-8">
          {/* 완성된 책 표지 카드 */}
          <StudentWideCard className="bg-white/5 border border-white/10 shadow-lg text-center backdrop-blur-sm rounded-[2rem]">
            <div className="w-32 h-32 rounded-[2rem] bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-7xl mx-auto mb-8 animate-float shadow-inner">
              🚀
            </div>
            <h2 className="text-2xl md:text-3xl font-jua text-white drop-shadow-sm">
              우주 탐사선의 분수 연료 계산
            </h2>
            <p className="text-sm md:text-base font-bold text-slate-300 mt-3">초등 5학년 · 수학 · 분수의 덧셈과 뺄셈</p>
            
            <div className="mt-8 inline-block bg-white/10 border border-white/20 rounded-full px-6 py-2.5 shadow-sm backdrop-blur-md">
              <p className="text-sm font-jua text-slate-200 flex items-center gap-2">
                <span className="text-lg">✍️</span> 
                <span>작가: {mockStudentProfile.name} · 2026년 6월 19일</span>
              </p>
            </div>
          </StudentWideCard>

          {/* 보상 카드 */}
          <RewardCard reward={mockRewardResult} />

          {/* 선생님에게 제출 */}
          <button
            onClick={() => alert('선생님께 만화책 제출을 완료했습니다! 📤')}
            className="card-glass card-glass-interactive w-full min-h-[72px] text-xl md:text-2xl text-emerald-300 hover:border-emerald-400/50 hover:bg-emerald-500/20 border border-emerald-500/30 bg-emerald-900/20 font-jua flex justify-center items-center rounded-full"
          >
            <span>선생님에게 제출하기 📤</span>
          </button>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex gap-4 pt-8 border-t border-white/10 mt-auto">
          <button
            onClick={() => navigate('/student/my')}
            className="card-glass card-glass-interactive flex-1 min-h-[72px] text-slate-300 bg-white/5 border border-white/10 font-jua text-xl md:text-2xl flex items-center justify-center rounded-full"
          >
            <span>내 작품 보기 📖</span>
          </button>

          <div className="flex-[2] w-full">
            <StudentPrimaryActionButton
              onClick={() => navigate('/student/my')}
            >
              <span>나의 페이지로 가기</span>
              <ArrowRight className="w-6 h-6 stroke-[3] ml-2" />
            </StudentPrimaryActionButton>
          </div>
        </div>

      </div>
    </StudentCreationLayout>
  )
}
