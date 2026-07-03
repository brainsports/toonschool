import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../shared/lib/supabase'
import { useAuth } from '../shared/contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { fetchProfile } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id)
        
        if (profile) {
          const redirectUrl = searchParams.get('redirect')
          
          // 1. 학생 계정인 경우 무조건 마이페이지로 이동 (redirect 파라미터 무시)
          if (profile.role === 'student') {
            if (redirectUrl && redirectUrl.startsWith('/admin/lms')) {
              alert('관리 LMS는 선생님 및 관리자 계정만 이용할 수 있습니다.')
            }
            navigate('/student/mypage')
            return
          }

          if (redirectUrl && redirectUrl.startsWith('/admin/lms')) {
            const allowedRoles = ['teacher', 'center_admin', 'middle_admin', 'super_admin']
            if (allowedRoles.includes(profile.role)) {
              navigate(redirectUrl)
              return
            } else {
              setError('관리 LMS는 선생님 및 관리자 계정만 이용할 수 있습니다.')
              await supabase.auth.signOut()
              return
            }
          }

          if (redirectUrl) {
            navigate(redirectUrl)
            return
          }

          switch (profile.role) {
            case 'super_admin':
              navigate('/super-admin')
              break
            case 'org_admin':
              navigate('/admin/org/dashboard')
              break
            case 'center_admin':
              navigate('/center-admin')
              break
            case 'free_user':
            default:
              navigate('/mypage')
              break
          }
        } else {
          navigate('/mypage')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f7] flex items-center justify-center overflow-hidden font-sans">
      <div className="w-full max-w-[1376px] aspect-video max-h-screen flex flex-row relative">
        
        {/* Left Area (Text & Hero Image) */}
        <div className="w-[58%] h-full flex flex-col pt-16 md:pt-20 px-10 md:px-16 relative z-10">
          
          {/* Logo and App Name */}
          <Link to="/" className="flex items-center gap-3 mb-10 w-fit z-30 shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-xl shadow-md">
              TS
            </div>
            <span className="font-extrabold text-2xl tracking-wider text-slate-800">
              툰스쿨
            </span>
          </Link>

          {/* Catchphrase */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.3] tracking-tight mb-6 z-30 shrink-0">
            공부하지 말고,<br />
            <span className="text-[#ff2778]">공부를 만들자.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-600 font-medium z-30 shrink-0 mb-8">
            선생님과 학생이 함께 만드는 AI 학습만화 플랫폼
          </p>

          {/* Hero Image */}
          <div className="flex-1 w-full flex items-end justify-start min-h-0 relative z-20 pb-4">
            <img 
              src="/images/toonschool/login-hero.png" 
              alt="툰스쿨 로그인 히어로 이미지"
              style={{ width: '85%', maxWidth: '680px', objectFit: 'contain', marginTop: '36px' }}
            />
          </div>
        </div>

        {/* Right Area (Login Card) */}
        <div className="w-[42%] h-full flex items-center justify-center pr-4 md:pr-16 z-30">
          <div className="w-full max-w-[480px] bg-white rounded-[32px] p-8 md:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100">
            
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">
              툰스쿨 로그인
            </h2>
            
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-sm flex items-center justify-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="아이디 또는 이메일"
                  className="w-full px-5 py-4 rounded-xl bg-[#f8f9fa] border border-transparent focus:border-[#ff2778] focus:bg-white focus:ring-1 focus:ring-[#ff2778] text-slate-800 placeholder-slate-400 outline-none transition-all text-[15px]"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full pl-5 pr-12 py-4 rounded-xl bg-[#f8f9fa] border border-transparent focus:border-[#ff2778] focus:bg-white focus:ring-1 focus:ring-[#ff2778] text-slate-800 placeholder-slate-400 outline-none transition-all text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 rounded-xl bg-[#ff2778] hover:bg-[#e01962] text-white font-bold text-lg shadow-lg shadow-[#ff2778]/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* Links */}
            <div className="flex items-center justify-center gap-4 mt-8 text-sm text-slate-500 font-medium">
              <Link to="/signup" className="hover:text-slate-800 transition-colors">회원가입</Link>
              <div className="w-px h-3 bg-slate-300"></div>
              <button type="button" className="hover:text-slate-800 transition-colors">아이디 찾기</button>
              <div className="w-px h-3 bg-slate-300"></div>
              <button type="button" className="hover:text-slate-800 transition-colors">비밀번호 찾기</button>
            </div>

            {/* Bottom Register Prompt */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium text-[15px]">처음 오셨나요?</span>
              <Link to="/signup" className="text-[#ff2778] font-bold hover:text-[#e01962] transition-colors text-[15px]">
                회원가입하기 &gt;
              </Link>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}
