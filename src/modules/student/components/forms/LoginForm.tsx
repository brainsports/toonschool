// 로그인 폼 컴포넌트
import { useState } from 'react'

interface LoginFormProps {
  onLogin: () => void
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onLogin()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 학생 ID 입력 */}
      <div className="space-y-3">
        <label className="text-base font-jua text-purple-600 flex items-center gap-2 select-none">
          <span className="text-2xl">🎒</span> 학생 아이디
        </label>
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="아이디를 적어주세요"
          className="input-game-soft w-full font-bold"
        />
      </div>

      {/* 비밀번호 입력 */}
      <div className="space-y-3">
        <label className="text-base font-jua text-purple-600 flex items-center gap-2 select-none">
          <span className="text-2xl">🔑</span> 비밀번호
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호를 적어주세요"
          className="input-game-soft w-full font-bold"
        />
      </div>

      {/* 로그인 버튼 */}
      <button
        type="submit"
        className="btn-game-3d w-full btn-game-purple py-5 text-xl font-jua"
      >
        <span className="text-2xl animate-bounce-gentle mr-2">🚀</span>
        <span>로그인하기</span>
      </button>

      {/* 초대코드 입력 */}
      <div className="text-center pt-4 border-t-2 border-slate-50">
        <button
          type="button"
          className="text-sm font-jua text-slate-500 hover:text-purple-600 tracking-wide underline decoration-2 transition-colors"
        >
          📩 초대코드로 가입하기
        </button>
      </div>
    </form>
  )
}
