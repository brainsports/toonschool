import React, { useState, useEffect, useRef } from 'react'
import { Users, Plus, Search, Eye, EyeOff, ShieldCheck, ShieldAlert, Key, Download, Upload, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react'
import { useAuth } from '../../../shared/contexts/AuthContext'
import { supabase } from '../../../shared/lib/supabase'
import * as XLSX from 'xlsx'

interface StudentRecord {
  id: string
  name: string
  login_id: string
  temp_password?: string
  status: string
  created_at?: string
  grade?: string
}

interface ExcelRow {
  이름?: string
  학년?: string
  반?: string
  학생코드?: string
  '보호자 연락처'?: string
  _status?: 'ready' | 'error' | 'duplicate'
  _errorMsg?: string
}

export default function StudentManagementPage() {
  const { profile, user } = useAuth()
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [institutionCode, setInstitutionCode] = useState('happy')
  const [studentNumber, setStudentNumber] = useState('005')
  
  // Excel Upload States
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
  const [parsedRows, setParsedRows] = useState<ExcelRow[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    if (profile?.center_id) {
      fetchStudents()
    } else {
      setLoading(false)
    }
  }, [profile])

  const fetchStudents = async () => {
    if (!profile?.center_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('center_id', profile.center_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setStudents(data as StudentRecord[])
    } catch (err) {
      console.error('Error fetching students:', err)
      alert('학생 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === '정상' ? '비활성화' : '정상'
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      setStudents(prev =>
        prev.map(s => (s.id === id ? { ...s, status: newStatus } : s))
      )
    } catch (err) {
      console.error('Status update error:', err)
      alert('상태 변경에 실패했습니다.')
    }
  }

  const generateRandomPassword = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  // ==== 단건 등록 로직 ====
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentName || !studentNumber || !profile?.center_id) return

    const loginId = `${institutionCode}${studentNumber}`
    const tempPw = generateRandomPassword()

    try {
      // 중복 체크
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('login_id', loginId)
        .single()

      if (existing) {
        alert('이미 존재하는 아이디(학생코드)입니다.')
        return
      }

      const { data, error } = await supabase
        .from('students')
        .insert({
          center_id: profile.center_id,
          organization_id: profile.organization_id || null,
          name: studentName,
          login_id: loginId,
          temp_password: tempPw,
          status: '정상'
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setStudents(prev => [data as StudentRecord, ...prev])
      }
      setStudentName('')
      const nextNum = parseInt(studentNumber) + 1
      setStudentNumber(String(nextNum).padStart(3, '0'))
      setIsModalOpen(false)
    } catch (err) {
      console.error('Registration error:', err)
      alert('학생 등록에 실패했습니다.')
    }
  }

  // ==== 엑셀 대량 업로드 로직 ====
  const handleDownloadTemplate = () => {
    const wsData = [
      ['이름', '학년', '반', '학생코드', '보호자 연락처'],
      ['홍길동', '3', '1반', 'happy001', '010-1234-5678'],
      ['이순신', '4', '2반', '', '010-9876-5432']
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '학생등록양식')
    XLSX.writeFile(wb, '학생대량등록양식.xlsx')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<any>(ws)

        if (!data || data.length === 0) {
          alert('데이터가 없습니다.')
          return
        }

        // DB 전체 login_id 확인 (현재 center_id 기준)
        let existingLoginIds = new Set<string>()
        if (profile?.center_id) {
          const { data: dbStudents } = await supabase
            .from('students')
            .select('login_id')
            .eq('center_id', profile.center_id)
          if (dbStudents) {
            existingLoginIds = new Set(dbStudents.map(s => s.login_id))
          }
        }

        const fileLoginIds = new Set<string>()
        const parsed: ExcelRow[] = data.map((row) => {
          const name = (row['이름'] || '').toString().trim()
          const grade = (row['학년'] || '').toString().trim()
          let studentCode = (row['학생코드'] || '').toString().trim()
          const r: ExcelRow = {
            이름: name,
            학년: grade,
            반: (row['반'] || '').toString().trim(),
            학생코드: studentCode,
            '보호자 연락처': (row['보호자 연락처'] || '').toString().trim(),
            _status: 'ready'
          }

          if (!name) {
            r._status = 'error'
            r._errorMsg = '이름 누락'
            return r
          }
          if (!grade) {
            r._status = 'error'
            r._errorMsg = '학년 누락'
            return r
          }
          if (!studentCode) {
            r._status = 'error'
            r._errorMsg = '학생코드 누락'
            return r
          }

          if (fileLoginIds.has(studentCode)) {
            r._status = 'duplicate'
            r._errorMsg = '파일 내 중복'
          } else if (existingLoginIds.has(studentCode)) {
            r._status = 'duplicate'
            r._errorMsg = '기존 아이디 존재'
          } else {
            fileLoginIds.add(studentCode)
          }

          return r
        })

        setParsedRows(parsed)
      } catch (err) {
        console.error(err)
        alert('엑셀 파일을 읽는 중 오류가 발생했습니다.')
      }
    }
    reader.readAsBinaryString(file)
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleBulkUpload = async () => {
    if (!profile?.center_id) {
      alert('소속 기관 정보가 없습니다.')
      return
    }

    const validRows = parsedRows.filter(r => r._status === 'ready')
    if (validRows.length === 0) {
      alert('등록 가능한 데이터가 없습니다.')
      return
    }

    setIsUploading(true)
    let successCount = 0

    const inserts = validRows.map(row => {
      return {
        center_id: profile.center_id,
        organization_id: profile.organization_id || null,
        name: row.이름,
        grade: row.학년,
        login_id: row.학생코드,
        student_code: row.학생코드 || null,
        guardian_phone: row['보호자 연락처'] || null,
        temp_password: generateRandomPassword(),
        status: '정상',
        created_by: user?.id
      }
    })

    try {
      const { data, error } = await supabase
        .from('students')
        .insert(inserts)
        .select()

      if (error) throw error

      successCount = data?.length || 0
      alert(`업로드 완료! 성공: ${successCount}건, 실패/제외: ${parsedRows.length - successCount}건`)
      setIsExcelModalOpen(false)
      setParsedRows([])
      fetchStudents()
    } catch (err: any) {
      console.error('Bulk upload error details:', err?.message, err?.details, err?.hint, err)
      console.error('Failed inserts payload:', inserts)
      alert(`일부 또는 전체 데이터 등록에 실패했습니다.\n사유: ${err?.message || '알 수 없는 오류'}\n상세 내용은 콘솔을 확인해주세요.`)
    } finally {
      setIsUploading(false)
    }
  }

  const filteredStudents = students.filter(
    s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.login_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const readyCount = parsedRows.filter(r => r._status === 'ready').length
  const errorCount = parsedRows.filter(r => r._status === 'error' || r._status === 'duplicate').length

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
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto shrink-0 items-center justify-end">
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
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>학생 엑셀 대량 등록</span>
          </button>
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
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">로딩 중...</div>
        ) : (
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
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">등록된 학생이 없습니다.</td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="text-slate-400 hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 font-bold text-slate-200">{s.name}</td>
                    <td className="py-4 font-mono font-bold text-[10px] text-amber-400 select-all">{s.login_id}</td>
                    <td className="py-4 font-mono text-[10px]">
                      <div className="flex items-center gap-2">
                        <span>{showPasswords[s.id] ? s.temp_password || '설정안됨' : '••••••'}</span>
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
                    <td className="py-4">{s.created_at ? new Date(s.created_at).toLocaleDateString() : '-'}</td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => toggleStatus(s.id, s.status)}
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
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 엑셀 대량 업로드 모달 */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col p-6 rounded-2xl bg-slate-900 border border-slate-850 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-200 text-sm">학생 엑셀 대량 등록</h3>
                <p className="text-[10px] text-slate-500 mt-1">양식에 맞춰 엑셀 파일을 업로드하면 여러 학생을 한 번에 등록할 수 있습니다.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>양식 다운로드</span>
                </button>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>파일 선택</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] border border-slate-850 rounded-xl bg-slate-950 p-4">
              {parsedRows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
                  <FileSpreadsheet className="h-10 w-10 opacity-50" />
                  <p className="text-xs">우측 상단 '파일 선택' 버튼을 눌러 엑셀 파일을 업로드해 주세요.</p>
                  <ul className="text-[10px] list-disc text-left pl-4 space-y-1 mt-4 opacity-80">
                    <li>양식의 컬럼명을 변경하지 마세요.</li>
                    <li>이름, 학년은 필수입니다.</li>
                    <li>학생코드가 없을 경우 시스템이 자동으로 생성합니다.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4 text-xs font-semibold px-2">
                    <span className="text-emerald-400">등록 가능: {readyCount}건</span>
                    <span className="text-rose-400">오류/중복: {errorCount}건</span>
                  </div>
                  <div className="text-[10px] text-amber-500 px-2 flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>주의: 엑셀의 '반' 정보는 참고용으로만 표시되며, DB에 저장되지 않습니다. 추후 반 배정 기능에서 설정해 주세요.</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800 pb-2">
                          <th className="py-2 px-2 font-semibold w-12">No</th>
                          <th className="py-2 px-2 font-semibold">이름</th>
                          <th className="py-2 px-2 font-semibold">학년</th>
                          <th className="py-2 px-2 font-semibold">반 (저장안됨)</th>
                          <th className="py-2 px-2 font-semibold">학생코드</th>
                          <th className="py-2 px-2 font-semibold">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className={`${row._status === 'ready' ? 'text-slate-300' : 'text-rose-400 bg-rose-950/10'}`}>
                            <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-2 font-medium">{row.이름 || '-'}</td>
                            <td className="py-2 px-2">{row.학년 || '-'}</td>
                            <td className="py-2 px-2 text-slate-500">{row.반 || '-'}</td>
                            <td className="py-2 px-2 font-mono text-[10px]">{row.학생코드 || <span className="text-slate-600">자동 발급 예정</span>}</td>
                            <td className="py-2 px-2">
                              {row._status === 'ready' ? (
                                <div className="flex items-center gap-1 text-emerald-400">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>가능</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-rose-400 font-bold">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span>{row._errorMsg}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-slate-850 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsExcelModalOpen(false)
                  setParsedRows([])
                }}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 font-semibold cursor-pointer"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={parsedRows.length === 0 || readyCount === 0 || isUploading}
                onClick={handleBulkUpload}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold cursor-pointer transition-colors flex items-center gap-2"
              >
                {isUploading ? '등록 중...' : `정상 데이터 ${readyCount}건 최종 등록`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개별 Registration Dialog form */}
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
