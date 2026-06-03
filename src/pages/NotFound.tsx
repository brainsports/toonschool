import { Link } from 'react-router-dom'
import { Home, HelpCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="h-16 w-16 rounded-full bg-rose-950/40 border border-rose-800 flex items-center justify-center text-rose-400">
        <HelpCircle className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-100">페이지를 찾을 수 없습니다</h1>
        <p className="text-slate-400 text-sm max-w-sm">
          이동하시려는 경로가 유효하지 않거나 개발 중에 있습니다. 아래 버튼을 눌러 메인 대시보드로 돌아가세요.
        </p>
      </div>
      <Link 
        to="/" 
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-medium transition-all"
      >
        <Home className="h-4 w-4" />
        <span>대시보드로 돌아가기</span>
      </Link>
    </div>
  )
}
