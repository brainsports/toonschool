// 학생 UI 전체 페이지를 감싸는 공통 레이아웃 컴포넌트
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Home, Sprout, Map, Trophy } from 'lucide-react'
import { mockStudentProfile } from '../../data/studentMockData'
import StudentSpaceBackground from './StudentSpaceBackground'
import '../../styles/student-ui.css'
import '../../styles/dream-progression.css'
import { useAuth } from '../../../../shared/contexts/AuthContext'
import { supabase } from '../../../../shared/lib/supabase'
import AllWorksModal from '../mypage/AllWorksModal'
import type { MyWork } from '../mypage/WorkCard'
import { getStudentWorks } from '../../services/studentWorkService'
import { getStudentItems } from '../../services/dreamGardenService'
import { getAttendanceRewardItemCount } from '../../services/studentAttendanceService'
import type { StudentItem } from '../../types/dreamGarden'
import { useDreamProgress } from '../dream/useDreamProgress'
import DreamScoreDetailModal from '../dream/DreamScoreDetailModal'
import DreamRankingModal from '../dream/DreamRankingModal'
import LevelUpModal from '../dream/LevelUpModal'

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
  const { user, profile: authProfile, signOut } = useAuth()
  const [studentData, setStudentData] = useState<any>(null)
  const [isAllWorksModalOpen, setIsAllWorksModalOpen] = useState(false)
  const [myWorks, setMyWorks] = useState<MyWork[]>([])
  const [hasLoadedWorks, setHasLoadedWorks] = useState(false)
  const [studentItems, setStudentItems] = useState<StudentItem[]>([])
  const [attendanceRewardCount, setAttendanceRewardCount] = useState(0)
  const [isScoreDetailOpen, setIsScoreDetailOpen] = useState(false)
  const [isRankingOpen, setIsRankingOpen] = useState(false)
  const studentId = authProfile?.role === 'student' ? (authProfile.id ?? user?.id) : user?.id
  const { progress: dream, levelUpLevel, dismissLevelUp } = useDreamProgress(studentId, { showLevelUpModal: true })

  const loadLootItems = useCallback(async () => {
    if (!studentId) {
      setStudentItems([])
      return
    }

    try {
      const items = await getStudentItems(studentId)
      setStudentItems(items)
    } catch (error) {
      console.error('[StudentPageShell] 득템 현황 조회 실패:', error)
    }
  }, [studentId])

  useEffect(() => {
    if (showHUD) {
      void loadLootItems()
    }
  }, [loadLootItems, showHUD])

  useEffect(() => {
    if (user?.id && authProfile?.role === 'student') {
      supabase.from('students').select('*').eq('id', user.id).single().then(({ data, error }) => {
        if (!error && data) {
          setStudentData(data)
        }
      })

      const loadRewardCount = () => {
        getAttendanceRewardItemCount(user.id)
          .then(count => setAttendanceRewardCount(count))
          .catch(err => console.error('[StudentPageShell] 출석보상 개수 조회 실패:', err))
      }
      const handleAttendanceRewardGranted = () => {
        loadRewardCount()
        void loadLootItems()
      }
      const handleLootItemsChanged = () => {
        void loadLootItems()
      }

      loadRewardCount()

      window.addEventListener('attendanceRewardGranted', handleAttendanceRewardGranted)
      window.addEventListener('studentLootItemsChanged', handleLootItemsChanged)
      return () => {
        window.removeEventListener('attendanceRewardGranted', handleAttendanceRewardGranted)
        window.removeEventListener('studentLootItemsChanged', handleLootItemsChanged)
      }
    }
  }, [user?.id, authProfile?.role, loadLootItems])

  const handleOpenAllWorksModal = useCallback(async () => {
    setIsAllWorksModalOpen(true)

    if (hasLoadedWorks || !user?.id) {
      return
    }

    const works = await getStudentWorks({
      profileId: authProfile?.id ?? user.id,
      authUserId: user.id,
      profileName: authProfile?.name,
    })

    setMyWorks(works)
    setHasLoadedWorks(true)
  }, [authProfile?.id, authProfile?.name, hasLoadedWorks, user?.id])

  const handleLogout = useCallback(async () => {
    await signOut()
    navigate('/', { replace: true })
  }, [navigate, signOut])

  const currentProfile = user && authProfile?.role === 'student' ? {
    ...mockStudentProfile,
    name: studentData?.name || authProfile?.name || '학생',
    grade: studentData?.grade ? (studentData.grade.includes('초') ? studentData.grade : `초${studentData.grade.replace(/[^0-9]/g, '')}`) : '초5',
    classNumber: studentData?.grade ? `${studentData.grade} 1반` : '5학년 1반',
  } : mockStudentProfile

  const profile = currentProfile;
  const isRealStudent = user && authProfile?.role === 'student';
  const isFull = maxWidth === 'full';
  const totalLootCount = studentItems.reduce((sum, item) => sum + item.quantity, 0)

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
                  LV.{dream.level}
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
                onClick={() => navigate('/student/mypage')}
                className="flex items-center gap-1 text-[#2d1f35] font-jua text-sm hover:scale-105 transition-transform"
              >
                <Home className="w-4 h-4" />
                <span>나의 페이지</span>
              </button>
              <div className="w-px h-4 bg-white/50 mx-2" />
              <button 
                onClick={handleOpenAllWorksModal}
                className="text-[#2d1f35] font-jua text-sm hover:scale-105 transition-transform"
              >
                🌌 내작품
              </button>
              <div className="w-px h-4 bg-white/50 mx-2" />
              <button 
                onClick={() => navigate('/student/resources')}
                className="text-[#2d1f35] font-jua text-sm hover:scale-105 transition-transform"
              >
                📁 자료실
              </button>
              <div className="w-px h-4 bg-white/50 mx-2" />
              <button
                onClick={() => navigate('/student/dream-garden')}
                className="flex items-center gap-1 text-[#2d1f35] font-jua text-sm hover:scale-105 transition-transform"
              >
                <Sprout className="w-4 h-4" />
                <span>{'\uafc8\uc758 \uc815\uc6d0'}</span>
              </button>
            </div>

            {/* 우측: 꿈점수(P) · 보물지도 · 랭킹 · 로그아웃
                (성장 단계 안내/득템 버튼은 제거. 득템·출석보상 수는 꿈점수 상세 모달에서 확인) */}
            <div className="flex items-center gap-2">
              {/* 보상 포인트(P): 레벨 보너스 포함 총점 = 레벨 기준 점수 */}
              <button
                type="button"
                onClick={() => setIsScoreDetailOpen(true)}
                className="dream-hud-chip dream-hud-chip--score"
                title="내 보상 포인트(P) 상세 보기 — 레벨은 총점 기준"
                aria-label="내 보상 포인트 상세 보기"
              >
                <Trophy className="w-4 h-4" />
                <span><span className="dream-hud-score-num">{dream.dreamScore.toLocaleString()}</span>P</span>
              </button>

              {/* 보물지도 */}
              <button
                type="button"
                onClick={() => navigate('/student/treasure-map')}
                className="dream-hud-chip dream-hud-chip--level"
                title="보물지도 — 열개의 빛과 꿈의 책"
                aria-label="보물지도"
              >
                <Map className="w-4 h-4" /><span className="hidden lg:inline">보물지도</span>
              </button>

              {/* 우리 반 랭킹 */}
              <button
                type="button"
                onClick={() => setIsRankingOpen(true)}
                className="dream-hud-chip dream-hud-chip--plain"
                title="우리 반 성장랭킹"
                aria-label="우리 반 성장랭킹"
              >
                <Trophy className="w-4 h-4" /><span className="hidden lg:inline">랭킹</span>
              </button>

              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
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

      <AllWorksModal
        isOpen={isAllWorksModalOpen}
        onClose={() => setIsAllWorksModalOpen(false)}
        works={myWorks}
      />

      {isScoreDetailOpen && (
        <DreamScoreDetailModal
          progress={dream}
          totalLootCount={totalLootCount}
          attendanceRewardCount={attendanceRewardCount}
          onClose={() => setIsScoreDetailOpen(false)}
        />
      )}

      {isRankingOpen && studentId && (
        <DreamRankingModal
          studentId={studentId}
          progress={dream}
          onClose={() => setIsRankingOpen(false)}
        />
      )}

      {levelUpLevel !== null && (
        <LevelUpModal
          level={levelUpLevel}
          onGoToScene={() => {
            dismissLevelUp()
            navigate('/student/treasure-map')
          }}
          onLater={dismissLevelUp}
        />
      )}
    </div>
  )
}
