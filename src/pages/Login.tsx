import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../shared/lib/supabase'
import { useAuth } from '../shared/contexts/AuthContext'
import { toAuthEmailFromLoginIdentifier } from '../shared/lib/authIdentifiers'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberId, setRememberId] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { fetchProfile } = useAuth()

  useEffect(() => {
    const savedId = localStorage.getItem('toonschool_saved_login_id')
    if (savedId) {
      setLoginIdentifier(savedId)
      setRememberId(true)
    }
  }, [])

  const handleLoginIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLoginIdentifier(value)
    if (rememberId) {
      localStorage.setItem('toonschool_saved_login_id', value)
    }
  }

  const handleRememberIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setRememberId(checked)
    if (checked) {
      localStorage.setItem('toonschool_saved_login_id', loginIdentifier)
    } else {
      localStorage.removeItem('toonschool_saved_login_id')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const authEmail = toAuthEmailFromLoginIdentifier(loginIdentifier)
    if (!authEmail) {
      setError('이메일 또는 학생 아이디를 입력해 주세요.')
      return
    }

    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password
      })

      if (authError) {
        throw new Error('아이디 또는 비밀번호를 확인해 주세요.')
      }

      if (data.user) {
        const profile = await fetchProfile(data.user.id)
        const redirectUrl = searchParams.get('redirect')

        if (profile) {
          // 이용 정지 계정 로그인 차단 (기존 로그인 흐름은 유지, 최소 수정)
          if (profile.status === 'suspended') {
            await supabase.auth.signOut()
            setError('이용이 정지된 계정입니다. 관리자에게 문의해 주세요.')
            return
          }
          if (profile.role === 'student') {
            const isExternalUrl = redirectUrl && (redirectUrl.startsWith('http') || redirectUrl.startsWith('//'))
            
            if (
              redirectUrl && 
              !isExternalUrl && 
              redirectUrl.startsWith('/student/') && 
              redirectUrl !== '/student/select-unit'
            ) {
              navigate(redirectUrl)
            } else {
              if (redirectUrl && redirectUrl.startsWith('/admin/lms')) {
                alert('관리 LMS는 선생님 및 관리자 계정만 사용할 수 있습니다.')
              }
              navigate('/student/mypage')
            }
            return
          }

          const adminLmsRoles = ['teacher', 'org_admin', 'middle_admin', 'super_admin']
          if (adminLmsRoles.includes(profile.role)) {
            if (!redirectUrl || redirectUrl === '/admin/lms' || redirectUrl === '/admin/lms/classes' || redirectUrl === '/mypage' || redirectUrl === '/') {
              if (profile.role === 'org_admin') navigate('/admin/org/dashboard')
              else if (profile.role === 'middle_admin') navigate('/manager/dashboard')
              else if (profile.role === 'super_admin') navigate('/admin/lms/super')
              else navigate('/admin/lms/classes')
            } else if (redirectUrl.startsWith('/student/')) {
              navigate('/admin/lms/classes')
            } else {
              navigate(redirectUrl)
            }
            return
          }

          if (redirectUrl && redirectUrl.startsWith('/admin/lms')) {
            setError('관리 LMS는 선생님 및 관리자 계정만 사용할 수 있습니다.')
            await supabase.auth.signOut()
            return
          }

          if (redirectUrl && !redirectUrl.startsWith('/student/')) {
            navigate(redirectUrl)
            return
          }

          navigate('/mypage')
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
      <div className="w-full max-w-[1376px] md:aspect-video md:max-h-screen flex flex-col md:flex-row relative">
        <div className="w-full md:w-[58%] h-auto md:h-full flex flex-col pt-10 md:pt-20 px-6 md:px-16 relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-6 md:mb-10 w-fit z-30 shrink-0">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-lg md:text-xl shadow-md">
              TS
            </div>
            <span className="font-extrabold text-xl md:text-2xl tracking-wider text-slate-800">
              ToonSchool
            </span>
          </Link>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.3] tracking-tight mb-4 md:mb-6 z-30 shrink-0">
            공부하지 말고,<br className="hidden md:block" />
            <span className="text-[#ff2778]">공부를 만들자</span>
          </h1>

          <p className="text-base md:text-xl lg:text-2xl text-slate-600 font-medium z-30 shrink-0 mb-4 md:mb-8 lg:mb-12">
            선생님과 학생이 함께 만드는 AI 학습만화 플랫폼
          </p>

          <div className="flex-1 w-full flex items-end justify-center md:justify-start min-h-0 relative z-20 pb-0 md:pb-4 lg:pb-8">
            <img
              src="/images/toonschool/login-hero.png"
              alt="ToonSchool 로그인 히어로 이미지"
              className="w-[70%] md:w-[85%] lg:w-[90%] max-w-[680px] object-contain mt-4 md:mt-9 lg:mt-12"
            />
          </div>
        </div>

        <div className="w-full md:w-[42%] h-auto md:h-full flex items-center justify-center px-4 md:pr-10 lg:pr-16 py-8 md:py-0 z-30">
          <div className="w-full max-w-[480px] bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100">
            <h2 className="text-2xl font-bold text-center text-slate-800 mb-8">
              ToonSchool 로그인
            </h2>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-sm flex items-center justify-center gap-2">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  value={loginIdentifier}
                  onChange={handleLoginIdentifierChange}
                  placeholder="이메일 또는 학생 아이디"
                  className="w-full px-5 py-4 rounded-xl bg-[#f8f9fa] border border-transparent focus:border-[#ff2778] focus:bg-white focus:ring-1 focus:ring-[#ff2778] text-slate-800 placeholder-slate-400 outline-none transition-all text-[15px]"
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberId"
                  checked={rememberId}
                  onChange={handleRememberIdChange}
                  className="w-4 h-4 text-[#ff2778] bg-white border-slate-300 rounded focus:ring-[#ff2778] focus:ring-2 accent-[#ff2778] cursor-pointer"
                />
                <label htmlFor="rememberId" className="text-sm text-slate-600 cursor-pointer select-none">
                  아이디 저장
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 mt-2 rounded-xl bg-[#ff2778] hover:bg-[#e01962] text-white font-bold text-lg shadow-lg shadow-[#ff2778]/30 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="flex items-center justify-center gap-4 mt-8 text-sm text-slate-500 font-medium">
              <Link to="/signup" className="hover:text-slate-800 transition-colors">회원가입</Link>
              <div className="w-px h-3 bg-slate-300"></div>
              <button type="button" className="hover:text-slate-800 transition-colors">아이디 찾기</button>
              <div className="w-px h-3 bg-slate-300"></div>
              <button type="button" className="hover:text-slate-800 transition-colors">비밀번호 찾기</button>
            </div>

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
