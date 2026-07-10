import { NavLink, Outlet } from 'react-router-dom'
import { Sparkles, Database, Layout as LayoutIcon, ShieldAlert, Users, Compass, BarChart3, Home, Menu, X, LogIn, LogOut, User, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, profile, signOut } = useAuth()

  const navLinks = [
    { name: '메인 페이지', path: '/', icon: Home },
    { name: '개발용 대시보드', path: '/dashboard', icon: LayoutIcon },
    { name: '슈퍼관리자', path: '/super-admin', icon: ShieldAlert },
    { name: '기관관리자', path: '/center-admin', icon: LayoutIcon },
    { name: '학생 대시보드', path: '/student', icon: Users },
    { name: '툰 제작 에디터', path: '/toon', icon: Compass },
    { name: '평가 분석', path: '/analytics', icon: BarChart3 }
  ]

  const activeStyle = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-600 text-white font-semibold shadow-md shadow-purple-500/20 transition-all scale-[1.02]'
  const inactiveStyle = 'flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-950/20 hover:bg-slate-900/50 text-slate-400 hover:text-slate-200 transition-all font-medium'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Background blur blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Mobile Header */}
      <header className="md:hidden flex justify-between items-center px-6 py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 z-30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
            TS
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 tracking-wider">
            TOONSCHOOL
          </span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 md:w-64 border-r border-slate-900 bg-slate-950/95 md:bg-slate-950/40 backdrop-blur-md p-6 flex flex-col justify-between shrink-0 z-50 md:z-20 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="space-y-6">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between md:hidden mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-sm">
                TS
              </div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 tracking-wider">
                TOONSCHOOL
              </span>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Logo - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 font-bold text-white text-lg">
              TS
            </div>
            <span className="font-extrabold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              TOONSCHOOL
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <NavLink 
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs tracking-wide">{link.name}</span>
                </NavLink>
              )
            })}
          </nav>

          {/* Account status section */}
          {user ? (
            <div className="pt-5 border-t border-slate-900 space-y-2">
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/50 border border-slate-900 flex items-center gap-3 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 text-xs font-bold shrink-0">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-slate-200 font-bold text-[10px] truncate">{user.email}</p>
                  <span className="text-[9px] text-purple-400 font-semibold bg-purple-950/40 px-1 py-0.5 rounded border border-purple-950/50 uppercase">{profile?.role || 'free_user'}</span>
                </div>
              </div>
              <NavLink 
                to="/mypage" 
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
              >
                <User className="h-4 w-4" />
                <span className="text-xs">마이페이지</span>
              </NavLink>
              <button 
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/20 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-900/40 transition-all text-xs font-medium cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            <div className="pt-5 border-t border-slate-900 space-y-1.5">
              <NavLink 
                to="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
              >
                <LogIn className="h-4 w-4" />
                <span className="text-xs">로그인</span>
              </NavLink>
              <NavLink 
                to="/signup" 
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-xs">회원가입</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Sidebar Footer info */}
        <div className="pt-5 border-t border-slate-900 text-slate-650 text-xxs font-semibold space-y-1 bg-slate-950/20 p-3 rounded-xl border border-slate-900/50 mt-4 md:mt-0">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-emerald-500" />
            <span>Supabase Ready</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span>Gemini API Ready</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-8 md:px-10 md:py-10 lg:p-12 overflow-y-auto max-w-6xl mx-auto w-full z-10">
        <Outlet />
      </main>
    </div>
  )
}
