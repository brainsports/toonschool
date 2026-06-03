import { useState } from 'react'
import { Users, Plus, Search, Eye, EyeOff, ShieldCheck, ShieldAlert, Key } from 'lucide-react'

interface StudentRecord {
  id: string
  name: string
  loginId: string
  tempPw: string
  status: '정상' | '비활성화'
  date: string
}

export default function StudentManagementPage() {
  const [students, setStudents] = useState<StudentRecord[]>([
    { id: '1', name: '김철수', loginId: 'happy001', tempPw: '482091', status: '정상', date: '2026-06-01' },
    { id: '2', name: '이영희', loginId: 'happy002', tempPw: '839102', status: '정상', date: '2026-06-01' },
    { id: '3', name: '박재민', loginId: 'happy003', tempPw: '582910', status: '비활성화', date: '2026-05-28' },
    { id: '4', name: '윤지민', loginId: 'happy004', tempPw: '302918', status: '정상', date: '2026-05-28' }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [institutionCode, setInstitutionCode] = useState('happy')
  const [studentNumber, setStudentNumber] = useState('005')
  
  // States to toggle visibility of temporary passwords
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleStatus = (id: string) => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, status: s.status === '정상' ? '비활성화' : '정상' } : s))
    )
  }

  const generateRandomPassword = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentName || !studentNumber) return

    const loginId = `${institutionCode}${studentNumber}`
    const tempPw = generateRandomPassword()

    const newStudent: StudentRecord = {
      id: String(students.length + 1),
      name: studentName,
      loginId,
      tempPw,
      status: '정상',
      date: new Date().toISOString().split('T')[0]
    }

    setStudents(prev => [...prev, newStudent])
    setStudentName('')
    // Increment student number for next registration convenience
    const nextNum = parseInt(studentNumber) + 1
    setStudentNumber(String(nextNum).padStart(3, '0'))
    setIsModalOpen(false)
  }

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loginId.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header with Search and Register */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-amber-500" />
            <span>수강 학생 명부 및 계정 관리</span>
          </h2>
          <p className="text-[10px] text-slate-500 mt-0.5">클래스에 등록된 소속 학생들의 로그인 아이디와 임시 비밀번호를 관리합니다.</p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto shrink-0">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름/ID 검색..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-850 text-xs text-white placeholder-slate-650 focus:border-amber-600 outline-none"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>학생 개별 등록</span>
          </button>
        </div>
      </div>

      {/* Roster table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-850 overflow-x-auto">
        <table className="w-full text-xs text-left min-w-[650px]">
          <thead>
            <tr className="text-slate-500 border-b border-slate-850 pb-2">
              <th className="py-3 font-semibold">학생명</th>
              <th className="py-3 font-semibold">생성된 로그인 아이디</th>
              <th className="py-3 font-semibold">초기 비밀번호 (6자리)</th>
              <th className="py-3 font-semibold">상태</th>
              <th className="py-3 font-semibold">가입 등록일</th>
              <th className="py-3 font-semibold text-right">관리 작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {filteredStudents.map((s) => (
              <tr key={s.id} className="text-slate-400">
                <td className="py-4 font-bold text-slate-200">{s.name}</td>
                <td className="py-4 font-mono font-bold text-[10px] text-amber-400 select-all">{s.loginId}</td>
                <td className="py-4 font-mono text-[10px]">
                  <div className="flex items-center gap-2">
                    <span>{showPasswords[s.id] ? s.tempPw : '••••••'}</span>
                    <button 
                      onClick={() => togglePasswordVisibility(s.id)}
                      className="text-slate-500 hover:text-slate-350 cursor-pointer"
                    >
                      {showPasswords[s.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === '정상' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30' : 'bg-rose-950/60 text-rose-400 border border-rose-900/30'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="py-4">{s.date}</td>
                <td className="py-4 text-right">
                  <button
                    onClick={() => toggleStatus(s.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xxs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                      s.status === '정상'
                        ? 'bg-rose-950/20 text-rose-455 border-rose-900/40 hover:bg-rose-900/30'
                        : 'bg-emerald-950/20 text-emerald-455 border-emerald-900/40 hover:bg-emerald-900/30'
                    }`}
                  >
                    {s.status === '정상' ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                    <span>{s.status === '정상' ? '비활성화' : '정상화'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Registration Dialog form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <form 
            onSubmit={handleRegister}
            className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-850 space-y-4 shadow-2xl relative"
          >
            <div className="space-y-1.5 border-b border-slate-850 pb-2.5">
              <h3 className="font-bold text-slate-200 text-sm">신규 수강 학생 등록</h3>
              <p className="text-[10px] text-slate-500">지정된 코드 형태 정책에 따라 학생 로그인을 등록합니다.</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400">학생 실명</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="예: 최진혁"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder-slate-650 focus:border-amber-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">기관 연동 코드</label>
                <input
                  type="text"
                  required
                  value={institutionCode}
                  onChange={(e) => setInstitutionCode(e.target.value)}
                  placeholder="예: happy"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder-slate-650 focus:border-amber-600 outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400">학생 번호</label>
                <input
                  type="text"
                  required
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="예: 005"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder-slate-650 focus:border-amber-600 outline-none font-mono"
                />
              </div>
            </div>

            {/* Account ID / Password Policy Announcement */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 space-y-1 text-[10px]">
              <p className="text-slate-400 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-amber-500" />
                <span>계정 정책 안내</span>
              </p>
              <div className="text-slate-500 space-y-0.5">
                <p>• 생성 아이디: <span className="text-amber-400 font-mono font-bold">{institutionCode}{studentNumber}</span></p>
                <p>• 초기 비밀번호: <span className="text-blue-400 font-mono">랜덤 숫자 6자리 자동 대입</span></p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold cursor-pointer"
              >
                등록 및 비번 발급
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
