// 뒤표지 만들기 페이지 - 오늘 배운 점, 한 줄 소감, AI 칭찬 메시지
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import BackCoverForm from '../components/forms/BackCoverForm'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { mockStudentProfile } from '../data/studentMockData'

export default function StudentBackCoverPage() {
  const navigate = useNavigate()
  const [learnedPoints, setLearnedPoints] = useState('')
  const [impression, setImpression] = useState('')

  const canProceed = learnedPoints.trim().length > 0 && impression.trim().length > 0

  return (
    <StudentCreationLayout currentStep="backCover" bgVariant="space" maxWidth="lg">
      <div className="flex flex-col gap-6 animate-fade-in pb-8">
        
        {/* 헤더 영역 */}
        <div className="text-center mb-4">
          <h1 className="text-[2rem] font-jua text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">뒤표지</h1>
          <p className="text-base font-bold text-slate-200 mt-2">
            오늘 배운 점과 소감을 적어 책을 완성해 봐요!
          </p>
        </div>

        <div className="space-y-6">
          {/* 뒤표지 양식 폼 */}
          <BackCoverForm
            studentName={mockStudentProfile.name}
            completionDate="2026년 6월 19일"
            learnedPoints={learnedPoints}
            onChangeLearnedPoints={setLearnedPoints}
            impression={impression}
            onChangeImpression={setImpression}
          />
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex gap-4 pt-8 border-t border-white/10 mt-auto">
          <button
            onClick={() => navigate('/student/quiz')}
            className="card-glass card-glass-interactive flex-1 py-5 text-slate-300 font-jua text-lg flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6 stroke-[3] mr-2" />
            <span>이전</span>
          </button>

          <button
            disabled={!canProceed}
            onClick={() => { if (canProceed) navigate('/student/complete') }}
            className={`flex items-center justify-center flex-[2] py-5 text-lg font-jua
              ${canProceed 
                ? 'btn-neon-purple' 
                : 'btn-neon-disabled'}`}
          >
            <span>완성 🏆</span>
            <ArrowRight className="w-6 h-6 stroke-[3] ml-2" />
          </button>
        </div>

      </div>
    </StudentCreationLayout>
  )
}
