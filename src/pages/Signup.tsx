import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../shared/lib/supabase'
import { Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
        email,
        password
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (data.user) {
        // 2. Insert profile record with default values
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: 'free_user',       // Default role
            plan_type: 'free',       // Default plan
            monthly_quota: 3         // Default quota
          })

        if (profileError) {
          console.error('Error writing user profile, continuing anyway:', profileError.message)
          // We don't throw here to avoid failing signup if a DB trigger already handles it
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
    <div className="flex flex-col items-center justify-center py-10 min-h-[70vh] z-10 relative">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-pink-900/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 items-center justify-center shadow-lg shadow-purple-500/20 font-bold text-white text-xl mx-auto mb-2">
            TS
          </div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            툰스쿨 회원가입
          </h2>
          <p className="text-xs text-slate-500">
            무료 회원가입으로 나만의 만화를 만들기 시작하세요.
          </p>
        </div>

        {/* Status notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-emerald-450 text-xs flex flex-col gap-1">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>회원가입 완료!</span>
            </div>
            <p className="text-slate-400">3초 후 로그인 페이지로 자동 이동합니다...</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">이메일 주소</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm placeholder-slate-600 transition-all text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="최소 6자리 이상"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm placeholder-slate-600 transition-all text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm placeholder-slate-600 transition-all text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>{isLoading ? '가입 진행 중...' : '회원가입'}</span>
            </button>
          </form>
        )}

        {/* Footer actions */}
        <div className="text-center pt-4 border-t border-slate-850 text-xs text-slate-500">
          <span>이미 계정이 있으신가요? </span>
          <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold underline decoration-purple-600/30 underline-offset-4">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  )
}
