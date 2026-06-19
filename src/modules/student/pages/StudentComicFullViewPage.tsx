// 6컷 전체보기 페이지 - 책 페이지 레이아웃
import { useNavigate } from 'react-router-dom'
import StudentCreationLayout from '../components/layout/StudentCreationLayout'
import ComicFullViewGrid from '../components/comic/ComicFullViewGrid'
import ComicFullViewToolbar from '../components/comic/ComicFullViewToolbar'
import { mockComicCuts } from '../data/studentMockData'

export default function StudentComicFullViewPage() {
  const navigate = useNavigate()

  const handleRevise = (cutNumber: number) => {
    navigate(`/student/comic/cut/${cutNumber}`)
  }

  const handleReviseAll = () => {
    navigate('/student/comic/cut/1')
  }

  const handleMoveBubbles = () => {
    alert('말풍선 위치 편집 모드가 로드되었습니다! (시뮬레이션)')
  }

  return (
    <StudentCreationLayout currentStep="full" bgVariant="space" maxWidth="xl">
      <div className="flex flex-col gap-6 animate-fade-in pb-8">
        
        {/* 헤더 영역 */}
        <div className="text-center mb-4">
          <h1 className="text-[2rem] font-jua text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">모아보기</h1>
          <p className="text-base font-bold text-slate-200 mt-2 bg-white/10 border border-white/20 inline-block px-4 py-1.5 rounded-full backdrop-blur-md">
            완성된 6컷 만화를 확인해 보세요!
          </p>
        </div>

        <div className="space-y-8">
          {/* 만화책 도화지 프레임 */}
          <div className="card-glass p-6 md:p-10 shadow-lg bg-white/5 border border-white/10">
            {/* 책 타이틀 및 작성자 정보 */}
            <div className="border-b border-white/10 pb-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left select-none">
                <span className="text-xs font-jua text-purple-200 bg-purple-500/20 border border-purple-500/30 px-3 py-1 rounded-full tracking-wider">
                  나만의 웹툰
                </span>
                <h2 className="text-[2rem] font-jua text-white drop-shadow-sm mt-3 leading-tight">
                  우주 탐사선의 분수 연료 계산
                </h2>
              </div>
              
              <div className="bg-white/10 border border-white/20 px-5 py-2.5 rounded-2xl font-jua text-sm text-slate-200 flex items-center gap-2 shadow-sm backdrop-blur-sm">
                <span className="text-lg">✍️</span>
                <span>작가:</span>
                <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-xl shadow-inner text-white">김민준</span>
              </div>
            </div>

            {/* 6컷 만화 그리드 */}
            <ComicFullViewGrid
              cuts={mockComicCuts}
              onRevise={handleRevise}
            />
          </div>

          {/* 제어 툴바 */}
          <ComicFullViewToolbar
            onReviseAll={handleReviseAll}
            onMoveBubbles={handleMoveBubbles}
          />
        </div>
      </div>
    </StudentCreationLayout>
  )
}
