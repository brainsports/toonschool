// 출석 페이지 - 출석 도장, 연속 출석일, 보상
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import StudentPageShell from '../components/layout/StudentPageShell'
import AttendanceCard from '../components/cards/AttendanceCard'
import RewardCard from '../components/cards/RewardCard'
import StudentBigButton from '../components/StudentBigButton'
import { mockAttendanceStatus, mockRewardResult } from '../data/studentMockData'

export default function StudentAttendancePage() {
  const navigate = useNavigate()
  const [showPopup, setShowPopup] = useState(true)

  const todayReward = {
    ...mockRewardResult,
    badges: mockRewardResult.badges.slice(0, 1),
    message: '5일 연속 출석 미션 완료! 오늘의 우주 에너지 별을 획득했어요! ⭐',
  }

  return (
    <StudentPageShell bgVariant="sky" maxWidth="lg">
      
      {/* 팝업 오버레이 (출석 보상 획득 축하) */}
      {showPopup && (
        <div className="dialog-overlay animate-fade-in">
          <div className="max-w-md w-full relative transform scale-100 transition-all">
            
            {/* 반짝이 데코 */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 select-none pointer-events-none">
              <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse fill-yellow-400 stroke-black stroke-2" />
              <span className="text-4xl">🎉</span>
              <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse fill-yellow-400 stroke-black stroke-2" />
            </div>

            <RewardCard reward={todayReward} />
            
            <div className="mt-6 text-center">
              <StudentBigButton
                onClick={() => setShowPopup(false)}
                variant="warning"
                size="md"
                className="mx-auto"
              >
                보석상자 확인 완료! 👍
              </StudentBigButton>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="text-center mb-10 pt-8">
        <div className="inline-block px-8 py-3 bg-purple-500 border-4 border-white rounded-[2rem] shadow-sm mb-4 transform -rotate-1">
          <h1 className="text-3xl font-jua text-white flex items-center gap-3 select-none">
            <span className="text-4xl">📅</span> 매일매일 출석체크!
          </h1>
        </div>
        <p className="text-base font-bold text-purple-700">
          매일 출석 도장을 찍고 누적 보상 상자를 열어보세요!
        </p>
      </div>

      {/* 메인 출석 콘텐츠 */}
      <div className="space-y-8">
        <AttendanceCard 
          attendance={mockAttendanceStatus} 
          onClaimReward={() => setShowPopup(true)}
        />

        {/* 안내문구 및 행동 유도 */}
        <div className="flex flex-col sm:flex-row items-center gap-5 bg-white border-4 border-slate-100 p-6 rounded-[2rem] shadow-sm">
          <div className="w-16 h-16 rounded-[1.5rem] bg-yellow-100 flex items-center justify-center text-4xl select-none animate-bounce-gentle shrink-0">
            🦊
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-amber-600 font-jua text-xl">연속 출석 7일을 채워보세요!</h4>
            <p className="text-slate-500 text-sm font-bold mt-1">7일 달성 시, 칭찬 도장과 추가 별 보상을 더 받을 수 있습니다.</p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-center pt-6">
          <StudentBigButton
            onClick={() => navigate('/student/my')}
            variant="primary"
            size="lg"
            emoji="🏠"
            className="w-full max-w-sm shadow-sm py-5 text-xl"
          >
            나의 본부로 이동!
          </StudentBigButton>
        </div>
      </div>

    </StudentPageShell>
  )
}
