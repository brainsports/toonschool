// 학생 UI 전체 페이지를 감싸는 공통 레이아웃 컴포넌트
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Home, Star, Trophy, Calendar } from 'lucide-react'
import { mockStudentProfile } from '../../data/studentMockData'
import StudentSpaceBackground from './StudentSpaceBackground'
import '../../styles/student-ui.css'
import { useAuth } from '../../../../shared/contexts/AuthContext'
import { supabase } from '../../../../shared/lib/supabase'

interface StudentPageShellProps {
  children: React.ReactNode
  showHUD?: boolean
  bgVariant?: 'default' | 'purple' | 'sky' | 'blue' | 'space' | 'pastel'
  activeTab?: 'lobby' | 'map' | 'backpack' | 'none'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

const maxWidths = {
  sm: 'max-w-md',
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-[1600px]',
  full: 'max-w-full',
}

const bgOverlays = {
  default: 'student-space-bg from-transparent to-transparent',
  purple: 'student-space-bg from-purple-300/10 via-transparent to-purple-300/10',
  sky: 'student-space-bg from-sky-300/10 via-transparent to-sky-300/10',
  blue: 'student-space-bg from-indigo-300/10 via-transparent to-indigo-300/10',
  space: 'student-dark-space-bg from-transparent to-transparent',
  pastel: 'student-pastel-bg from-transparent to-transparent',
}

export default function StudentPageShell({
  children,
  showHUD = true,
  bgVariant = 'default',
  maxWidth = 'lg',
  className = '',
}: StudentPageShellProps) {
  const navigate = useNavigate()
  const { user, profile: authProfile } = useAuth()
  const [studentData, setStudentData] = useState<any>(null)

  useEffect(() => {
    if (user?.id && authProfile?.role === 'student') {
      supabase.from('students').select('*').eq('id', user.id).single().then(({ data, error }) => {
        if (!error && data) {
          setStudentData(data)
        }
      })
    }
  }, [user?.id, authProfile?.role])

  const currentProfile = user && authProfile?.role === 'student' ? {
    ...mockStudentProfile,
    name: studentData?.name || authProfile?.name || '학생',
    grade: studentData?.grade ? (studentData.grade.includes('초') ? studentData.grade : `초${studentData.grade.replace(/[^0-9]/g, '')}`) : '초5',
    classNumber: studentData?.grade ? `${studentData.grade} 1반` : '5학년 1반',
  } : mockStudentProfile

  const profile = currentProfile;
  const isRealStudent = user && authProfile?.role === 'student';
  const isFull = maxWidth === 'full';

  return (
    <div className={`${isFull ? 'h-[100dvh] overflow-hidden' : 'min-h-screen overflow-x-hidden'} flex flex-col ${isFull ? 'pb-0' : 'pb-12'} bg-gradient-to-tr ${bgOverlays[bgVariant as keyof typeof bgOverlays] || bgOverlays.default} relative`}>
      {bgVariant === 'space' && <StudentSpaceBackground />}
      
      {/* 상단 게임 HUD 영역 */}
      {showHUD && (
        <header className={`hud-panel relative z-50 px-4 py-3 ${isFull ? 'mb-0 shrink-0' : 'mb-6 sticky top-0'} !bg-[#f19cdb] border-none`}>
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            
            {/* 좌측: 프로필 & 레벨 */}
            <div className="flex items-center gap-3">
              <div 
                className="avatar-frame cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate('/student/my')}
              >
                <span className="text-3xl select-none">{profile.avatarEmoji}</span>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-amber-950 border-2 border-white font-jua text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                  LV.5
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-jua text-xl text-[#2d1f35] tracking-wide">{profile.name}</span>
                  <span className="bg-white/50 border border-white/60 text-[#2d1f35] text-[11px] font-jua px-2 py-0.5 rounded-full">
                    {profile.grade}
                  </span>
                </div>
                <p className="text-[#5f4059] text-[11px] font-bold mt-0.5">
                  {isRealStudent ? `${profile.classNumber} 소속 대원` : `${profile.classNumber} ${profile.studentNumber}번 대원`}
                </p>
              </div>
            </div>

            {/* 중앙: 툰스쿨 마크 & 숏컷 */}
            <div className="hidden md:flex items-center gap-2 bg-white/40 px-5 py-2 rounded-2xl border border-white/30 shadow-sm">
              <button 
                onClick={() => navigate('/student/my')}
                className="flex items-center gap-1 text-[#2d1f35] font-jua text-sm hover:scale-105 transition-transform"
              >
                <Home className="w-4 h-4" />
                <span>홈</span>
              </button>
              <div className="w-px h-4 bg-white/50 mx-2" />
              <button 
                onClick={() => navigate('/student/my')}
                className="text-[#2d1f35] font-jua text-sm hover:scale-105 transition-transform"
              >
                🌌 내작품
              </button>
            </div>

            {/* 우측: 재화 및 액션 */}
            <div className="flex items-center gap-3">
              {/* 별 개수 */}
              <div className="flex items-center gap-1.5 bg-yellow-50 border-2 border-yellow-200 px-3 py-1.5 rounded-full text-yellow-700 font-jua text-sm shadow-sm">
                <Star className="w-5 h-5 fill-yellow-400 stroke-yellow-500 stroke-2" />
                <span className="tracking-wide mt-0.5">{profile.totalStars}</span>
              </div>

              {/* 배지/트로피 개수 */}
              <div className="flex items-center gap-1.5 bg-pink-50 border-2 border-pink-200 px-3 py-1.5 rounded-full text-pink-700 font-jua text-sm shadow-sm">
                <Trophy className="w-5 h-5 fill-pink-400 stroke-pink-500 stroke-2" />
                <span className="tracking-wide mt-0.5">{profile.totalBadges}</span>
              </div>

              {/* 연속 출석 */}
              <div className="flex items-center gap-1.5 bg-sky-50 border-2 border-sky-200 px-3 py-1.5 rounded-full text-sky-700 font-jua text-sm shadow-sm">
                <Calendar className="w-5 h-5 fill-sky-400 stroke-sky-500 stroke-2" />
                <span className="tracking-wide mt-0.5">{profile.streakDays}일째</span>
              </div>

              {/* 로그아웃 버튼 */}
              <button
                onClick={() => navigate('/student/login')}
                className="w-10 h-10 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm active:translate-y-[2px]"
                title="로그아웃"
              >
                <LogOut className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

          </div>
        </header>
      )}

      {/* 메인 컨텐츠 영역 */}
      <main className={`flex-1 flex flex-col mx-auto ${isFull ? 'px-0 overflow-hidden' : 'px-4'} w-full relative z-10 ${maxWidths[maxWidth]} ${className}`}>
        {children}
      </main>
    </div>
  )
}
