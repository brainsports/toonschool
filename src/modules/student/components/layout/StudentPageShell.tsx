// 학생 UI 전체 페이지를 감싸는 공통 레이아웃 컴포넌트
import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Home, Gift, X, Calendar, Sprout } from 'lucide-react'
import { mockStudentProfile } from '../../data/studentMockData'
import StudentSpaceBackground from './StudentSpaceBackground'
import '../../styles/student-ui.css'
import { useAuth } from '../../../../shared/contexts/AuthContext'
import { supabase } from '../../../../shared/lib/supabase'
import AllWorksModal from '../mypage/AllWorksModal'
import type { MyWork } from '../mypage/WorkCard'
import { getStudentWorks } from '../../services/studentWorkService'
import { getStudentItems } from '../../services/dreamGardenService'
import { getAttendanceRewardItemCount } from '../../services/studentAttendanceService'
import type { StudentItem } from '../../types/dreamGarden'

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

function getItemEmoji(item?: StudentItem['item'] | null) {
  if (item?.category === 'animal') return '🐰'
  if (item?.category === 'sky') return '⭐'
  if (item?.category === 'spirit') return '✨'
  if (item?.category === 'decor') return '🎀'
  if (item?.category === 'legend') return '👑'
  return '🌱'
}

function formatAcquiredDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
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
  const [isLootModalOpen, setIsLootModalOpen] = useState(false)
  const [studentItems, setStudentItems] = useState<StudentItem[]>([])
  const [hasLoadedItems, setHasLoadedItems] = useState(false)
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const [attendanceRewardCount, setAttendanceRewardCount] = useState(0)
  const studentId = authProfile?.role === 'student' ? (authProfile.id ?? user?.id) : user?.id

  const loadLootItems = useCallback(async () => {
    if (!studentId) {
      setStudentItems([])
      setHasLoadedItems(true)
      return
    }

    try {
      setIsLoadingItems(true)
      const items = await getStudentItems(studentId)
      setStudentItems(items)
      setHasLoadedItems(true)
    } catch (error) {
      console.error('[StudentPageShell] 득템 현황 조회 실패:', error)
    } finally {
      setIsLoadingItems(false)
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

  const handleOpenLootModal = useCallback(async () => {
    setIsLootModalOpen(true)

    if (hasLoadedItems) {
      return
    }

    await loadLootItems()
  }, [hasLoadedItems, loadLootItems])

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
  const recentLootItems = studentItems.slice(0, 5)

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

            {/* 우측: 재화 및 액션 */}
            <div className="flex items-center gap-3">
              {/* 득템 현황 */}
              <button
                type="button"
                onClick={handleOpenLootModal}
                className="flex items-center gap-1.5 bg-yellow-50 border-2 border-yellow-200 px-4 py-1.5 rounded-full text-yellow-700 font-jua text-sm shadow-sm hover:scale-105 transition-transform"
                title="나의 득템 현황"
                aria-label="나의 득템 현황"
              >
                <Gift className="w-5 h-5 stroke-yellow-600 stroke-2" />
                <span className="tracking-wide mt-0.5">🎁 득템 {totalLootCount}개</span>
              </button>

              {/* 출석 보상 */}
              <div className="flex items-center gap-1.5 bg-sky-50 border-2 border-sky-200 px-3 py-1.5 rounded-full text-sky-700 font-jua text-sm shadow-sm">
                <Calendar className="w-5 h-5 fill-sky-400 stroke-sky-500 stroke-2" />
                <span className="tracking-wide mt-0.5">출석보상 {attendanceRewardCount}개</span>
              </div>

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

      {isLootModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-start justify-between gap-4 p-6 md:px-8 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-800">나의 득템 현황</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">내가 얻은 아이템을 확인해 보세요.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLootModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                aria-label="득템 현황 닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="mb-5 rounded-2xl bg-yellow-50 border-2 border-yellow-100 px-5 py-4 flex items-center justify-between">
                <span className="font-jua text-slate-700">전체 아이템 수</span>
                <span className="font-jua text-2xl text-yellow-700">{totalLootCount}개</span>
              </div>

              {isLoadingItems ? (
                <div className="py-10 text-center text-slate-400 font-bold">득템 현황을 불러오는 중이에요...</div>
              ) : recentLootItems.length === 0 ? (
                <div className="py-10 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-500 font-bold">
                  아직 얻은 아이템이 없어요.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLootItems.map((studentItem) => (
                    <div key={studentItem.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm">
                        {getItemEmoji(studentItem.item)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-jua text-slate-800 truncate">{studentItem.item?.name ?? '아이템'}</p>
                        <p className="text-xs font-bold text-slate-400">{formatAcquiredDate(studentItem.acquired_at)} 획득</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-jua text-slate-600 border border-slate-100">
                        {studentItem.quantity}개
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 md:px-8 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/student/dream-garden')}
                className="rounded-full bg-emerald-500 px-6 py-3 font-jua text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors"
              >
                꿈의 정원 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
