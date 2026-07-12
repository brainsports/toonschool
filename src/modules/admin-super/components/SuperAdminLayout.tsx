import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../shared/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  Building2,
  Ticket,
  Bell,
  FileText,
  History as HistoryIcon,
  LogOut,
  Menu,
  ShieldCheck,
  UserCog
} from 'lucide-react'

export default function SuperAdminLayout() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const menuItems = [
    { icon: LayoutDashboard, label: '대시보드', path: '/admin/super/dashboard' },
    { icon: UserCog, label: '회원 관리', path: '/admin/super/members' },
    { icon: ShieldCheck, label: '중간관리자 관리', path: '/admin/super/middle-admins' },
    { icon: Building2, label: '기관 관리', path: '/admin/super/organizations' },
    { icon: Users, label: '선생님 관리', path: '/admin/super/teachers' },
    { icon: Ticket, label: '이용권 관리', path: '/admin/super/licenses' },
    { icon: Bell, label: '알림 발송', path: '/admin/super/notifications' },
    { icon: FileText, label: '자료실 관리', path: '/admin/super/resources' },
    { icon: HistoryIcon, label: '운영 로그', path: '/admin/super/audit-logs' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#6B4EFE]">ToonSchool</span>
              <span className="text-xs text-gray-500 font-medium">수퍼관리자</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center px-3 py-2.5 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-[#F4F2FF] text-[#6B4EFE] font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                    title={!isSidebarOpen ? item.label : undefined}
                  >
                    <Icon className={`w-5 h-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-gray-800">
            {/* Contextual Title can be added here or in child components */}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500 mr-2">접속자:</span>
              <span className="font-medium text-gray-900">{profile?.name || user?.email || '수퍼관리자'}</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
