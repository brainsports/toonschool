import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../shared/lib/supabase'
import { useAuth } from '../shared/contexts/AuthContext'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
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
        // Fetch profile to redirect based on user role
        const profile = await fetchProfile(data.user.id)
        
        if (profile) {
          switch (profile.role) {
            case 'super_admin':
              navigate('/super-admin')
              break
            case 'center_admin':
              navigate('/center-admin')
              break
            case 'student':
              navigate('/student')
              break
            case 'free_user':
            default:
              navigate('/mypage')
              break
          }
        } else {
          // If profile table doesn't have it yet, go to mypage as default fallback
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
    <div className="flex flex-col items-center justify-center py-10 min-h-[70vh] z-10 relative">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 items-center justify-center shadow-lg shadow-purple-500/20 font-bold text-white text-xl mx-auto mb-2">
            TS
          </div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            툰스쿨 로그인
          </h2>
          <p className="text-xs text-slate-500">
            계정 이메일과 비밀번호를 입력해 주세요.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">이메일</label>
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
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-sm placeholder-slate-600 transition-all text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* Footer actions */}
        <div className="text-center pt-4 border-t border-slate-850 text-xs text-slate-500">
          <span>아직 계정이 없으신가요? </span>
          <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold underline decoration-purple-600/30 underline-offset-4">
            회원가입하기
          </Link>
        </div>
      </div>
    </div>
  )
}
