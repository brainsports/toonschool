// 학생 나의 메인 페이지 - 우주 본부 로비 (태블릿 최적화 및 복잡도 감소)
import { useNavigate } from 'react-router-dom'
import StudentPageShell from '../components/layout/StudentPageShell'
import TodayLessonCard from '../components/cards/TodayLessonCard'
import WorkCard from '../components/cards/WorkCard'
import { BookOpen } from 'lucide-react'
import { mockStudentProfile, mockAttendanceStatus, mockStudentWorks } from '../data/studentMockData'

export default function StudentMyPage() {
  const navigate = useNavigate()
  const profile = mockStudentProfile

  return (
    <StudentPageShell showHUD={true} maxWidth="lg" className="space-y-6">
      
      {/* 1. 상단 심플 칭호 띠 배너 */}
      <div className="flex items-center justify-between px-6 py-4 bg-purple-50 border-2 border-purple-100 rounded-[2rem] select-none text-sm font-jua text-purple-900 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛸</span>
          <span>우주 칭호: <span className="text-purple-600 text-base">초보 만화가</span></span>
        </div>
        <div className="hidden sm:block text-purple-500">
          다음 등급까지 별 {50 - profile.totalStars}개 남음! 🪐
        </div>
      </div>

      {/* 2. 핵심 행동 중심 그리드 (태블릿 2컬럼) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* 오늘의 학습툰 퀘스트 (좌측 7/12 컬럼) */}
        <div className="col-span-12 md:col-span-8">
          <TodayLessonCard
            grade="초5"
            subject="수학"
            unit="분수의 덧셈과 뺄셈"
            teacherMessage="재미있는 만화를 고치며 분수 연료 계산법을 배워요!"
          />
        </div>

        {/* 미니 제어 위젯 목록 (우측 4/12 컬럼) */}
        <div className="col-span-12 md:col-span-4 flex flex-col justify-between gap-4">
          
          {/* 출석체크 링크 카드 */}
          <div 
            onClick={() => navigate('/student/attendance')}
            className="flex-1 p-5 bg-gradient-to-r from-pink-50 to-pink-100/50 border-4 border-white rounded-[2rem] cursor-pointer hover:border-pink-200 transition-all flex flex-col justify-between min-h-[110px] shadow-sm group"
          >
            <div className="flex justify-between items-center select-none">
              <span className="text-3xl group-hover:scale-110 transition-transform drop-shadow-sm">📅</span>
              <span className="bg-pink-100 border border-pink-200 text-pink-600 text-xs font-jua px-3 py-1 rounded-xl">
                출석부
              </span>
            </div>
            <p className="text-sm font-bold text-pink-800 mt-3">
              오늘 출석 도장 완료! 연속 {mockAttendanceStatus.streakDays}일째 🔥
            </p>
          </div>

          {/* 학습 퀴즈 풀기 카드 */}
          <div 
            onClick={() => navigate('/student/quiz')}
            className="flex-1 p-5 bg-gradient-to-r from-sky-50 to-sky-100/50 border-4 border-white rounded-[2rem] cursor-pointer hover:border-sky-200 transition-all flex flex-col justify-between min-h-[110px] shadow-sm group"
          >
            <div className="flex justify-between items-center select-none">
              <span className="text-3xl group-hover:scale-110 transition-transform drop-shadow-sm">✏️</span>
              <span className="bg-sky-100 border border-sky-200 text-sky-600 text-xs font-jua px-3 py-1 rounded-xl">
                학습 퀴즈
              </span>
            </div>
            <p className="text-sm font-bold text-sky-800 mt-3">
              개념 정리 & 복습 퀴즈 도전 🧩
            </p>
          </div>

        </div>

      </div>

      {/* 3. 하단 섹션: 내 작품 보관함 (최근 2개로 제한하여 간소화) */}
      <div className="space-y-4 pt-6 mt-4">
        <div className="flex items-center justify-between select-none">
          <h2 className="text-xl font-jua text-purple-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600 stroke-[2.5]" />
            <span>최근 내 모험 작품</span>
          </h2>
          <span className="text-sm font-jua text-slate-500 bg-white px-4 py-1.5 rounded-full border-2 border-slate-100 shadow-sm">보관함 보석: {profile.totalStars}개</span>
        </div>

        {/* 기본 2개만 노출하여 카드 피로도 대폭 해소 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockStudentWorks.slice(0, 2).map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </div>

    </StudentPageShell>
  )
}
