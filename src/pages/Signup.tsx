import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../shared/lib/supabase'
import { Eye, EyeOff, UserPlus, CheckCircle } from 'lucide-react'

export default function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [centerName, setCenterName] = useState('')
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    if (!termsAgreed || !privacyAgreed) {
      setError('필수 약관에 동의해 주세요.')
      return
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      // 1. Sign up the user via Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!data.user) {
        throw new Error('\uD68C\uC6D0\uAC00\uC785 \uC751\uB2F5\uC5D0\uC11C \uC0AC\uC6A9\uC790 \uC815\uBCF4\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.')
      }

      if (data.user) {
        // 2. Insert profile record with default values
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email ?? cleanEmail,
            name: cleanName,
            role: 'free_user',       // Default role
            plan_type: 'free',       // Default plan
            monthly_quota: 3         // Default quota
          })

        if (profileError) {
          console.error('Error writing user profile:', profileError.message)
          throw new Error('\uD68C\uC6D0\uAC00\uC785\uC740 \uC644\uB8CC\uB410\uC9C0\uB9CC \uD504\uB85C\uD544 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uAD00\uB9AC\uC790\uC5D0\uAC8C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.')
        }

        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError(err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f4f7] flex items-center justify-center overflow-hidden font-sans">
      <div className="w-full max-w-[1376px] md:aspect-video md:max-h-screen flex flex-col md:flex-row relative">
        
        {/* Left Area (Text & Hero Image) */}
        <div className="w-full md:w-[58%] h-auto md:h-full flex flex-col pt-10 md:pt-20 px-6 md:px-16 relative z-10">
          
          {/* Logo and App Name */}
          <Link to="/" className="flex items-center gap-3 mb-6 md:mb-10 w-fit z-30 shrink-0">
            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white text-lg md:text-xl shadow-md">
              TS
            </div>
            <span className="font-extrabold text-xl md:text-2xl tracking-wider text-slate-800">
              툰스쿨
            </span>
          </Link>

          {/* Catchphrase */}
          <h1 className="text-3xl md:text-[42px] lg:text-[48px] font-black text-slate-900 leading-[1.2] tracking-tight mb-3 md:mb-5 z-30 shrink-0 break-keep">
            선생님 계정을 만들고,<br className="hidden md:block" />
            <span className="text-[#ff2778] whitespace-normal md:whitespace-nowrap">승인 후 학습만화를 시작해요.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-base md:text-[19px] lg:text-[21px] text-slate-600 font-medium z-30 shrink-0 mb-4 md:mb-10 lg:mb-12">
            학생 계정은 선생님 페이지에서 쉽게 추가할 수 있어요.
          </p>

          {/* Hero Image */}
          <div className="flex-1 w-full flex items-end justify-center md:justify-start min-h-0 relative z-20 pb-0 md:pb-4 lg:pb-8 hidden md:flex">
            <img 
              src="/images/toonschool/login-hero.png" 
              alt="툰스쿨 로그인 히어로 이미지"
              className="w-[70%] md:w-[85%] lg:w-[90%] max-w-[640px] object-contain mt-4 md:mt-4 lg:mt-8"
            />
          </div>
        </div>

        {/* Right Area (Signup Card) */}
        <div className="w-full md:w-[42%] h-auto md:h-full flex flex-col items-center justify-center px-4 md:pr-10 lg:pr-16 py-8 md:py-8 z-30 relative">
          <div className="w-full max-w-[480px] bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 flex-shrink-0 relative z-10">
            
            <div className="flex flex-col items-center mb-6">
              <span className="inline-block px-3 py-1 mb-3 rounded-full bg-slate-100 text-slate-600 text-xs font-bold tracking-wide">
                가입 후 프리유저로 시작해요
              </span>
              <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
                툰스쿨 회원가입
              </h2>
              <p className="text-sm text-center text-slate-500 font-medium px-4">
                회원가입 후 슈퍼관리자 승인으로 선생님 또는 중간관리자 활동이 가능합니다.
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-500 text-sm flex items-center justify-center gap-2">
                <span>{error}</span>
              </div>
            )}

            {success ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-center flex flex-col items-center gap-3">
                <CheckCircle className="h-10 w-10 shrink-0" />
                <div className="font-bold text-lg">회원가입 완료!</div>
                <p className="text-sm text-emerald-600/80">3초 후 로그인 페이지로 자동 이동합니다...</p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름"
                    className="w-full px-5 py-3.5 rounded-xl bg-[#f8f9fa] border border-transparent focus:border-[#ff2778] focus:bg-white focus:ring-1 focus:ring-[#ff2778] text-slate-800 placeholder-slate-400 outline-none transition-all text-[15px]"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소"
                    className="w-full px-5 py-3.5 rounded-xl bg-[#f8f9fa] border border-transparent focus:border-[#ff2778] focus:bg-white focus:ring-1 focus:ring-[#ff2778] text-slate-800 placeholder-slate-400 outline-none transition-all text-[15px]"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 (최소 6자리 이상)"
                    className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-[#f8f9fa] border border-transparent focus:border-[#ff2778] focus:bg-white focus:ring-1 focus:ring-[#ff2778] text-slate-800 placeholder-slate-400 outline-none transition-all text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 확인"
                    className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-[#f8f9fa] border border-transparent focus:border-[#ff2778] focus:bg-white focus:ring-1 focus:ring-[#ff2778] text-slate-800 placeholder-slate-400 outline-none transition-all text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={centerName}
                    onChange={(e) => setCenterName(e.target.value)}
                    placeholder="기관명 또는 기관 코드 (선택)"
                    className="w-full px-5 py-3.5 rounded-xl bg-[#f8f9fa] border border-transparent focus:border-[#ff2778] focus:bg-white focus:ring-1 focus:ring-[#ff2778] text-slate-800 placeholder-slate-400 outline-none transition-all text-[15px]"
                  />
                </div>

                <div className="space-y-2 mt-4 pb-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="w-5 h-5 rounded-md border-slate-300 text-[#ff2778] focus:ring-[#ff2778] bg-white checked:bg-[#ff2778] accent-[#ff2778] cursor-pointer"
                    />
                    <span className="text-[14px] text-slate-600 group-hover:text-slate-800 font-medium transition-colors">이용약관에 동의합니다. (필수)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      className="w-5 h-5 rounded-md border-slate-300 text-[#ff2778] focus:ring-[#ff2778] bg-white checked:bg-[#ff2778] accent-[#ff2778] cursor-pointer"
                    />
                    <span className="text-[14px] text-slate-600 group-hover:text-slate-800 font-medium transition-colors">개인정보 수집 및 이용에 동의합니다. (필수)</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-4 rounded-xl bg-[#ff2778] hover:bg-[#e01962] text-white font-bold text-lg shadow-lg shadow-[#ff2778]/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>{isLoading ? '가입 진행 중...' : '프리유저로 회원가입'}</span>
                </button>
              </form>
            )}

            <div className="flex items-center justify-center gap-4 mt-8 text-sm text-slate-500 font-medium">
              <span>이미 계정이 있나요?</span>
              <div className="w-px h-3 bg-slate-300"></div>
              <Link to="/login" className="text-[#ff2778] font-bold hover:text-[#e01962] transition-colors">
                로그인
              </Link>
            </div>
            
          </div>
          
          <div className="mt-6 w-full max-w-[480px] text-center z-10">
            <p className="text-sm text-slate-500 font-medium bg-white/50 backdrop-blur-sm py-2 px-4 rounded-full inline-block border border-white/60 shadow-sm">
              ℹ️ 학생 계정은 선생님이 만든 아이디로 로그인합니다.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  )
}
