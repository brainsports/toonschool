// ──────────────────────────────────────────────
// 학생관리 페이지
// ──────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { supabase } from '../../../shared/lib/supabase'
import { useAuth } from '../../../shared/contexts/AuthContext'
import type { Student, ClassRoom, LicenseInfo } from '../types'
import { deleteStudents, deleteStudent, createStudent, moveStudentsToClass, fetchStudentsByTeacher } from '../services/studentService'
import { fetchLicenseInfo, fetchClassesByTeacher } from '../services/classService'
import { createTeacherMessage, getMySentTeacherMessages } from '../../student/services/teacherMessageService'
import { createNotification } from '../../student/services/notificationService'
import LicenseCard from '../components/LicenseCard'
import CreateStudentModal from '../components/CreateStudentModal'
import ConfirmModal from '../../../shared/components/ConfirmModal'
import { getOrCreateDefaultClass, isQuotaError, getStudentQuotaStatus, COMIC_QUOTA_ENABLED, type ComicQuotaStatus } from '../../../shared/lib/comicQuota'

interface ExcelRow {
  이름?: string
  '학생명'?: string
  학년?: string
  아이디?: string
  비밀번호?: string
  학급명?: string
  반?: string
  학생코드?: string // 레거시 하위 호환(=아이디)
  '보호자 연락처'?: string
  _status?: 'ready' | 'error' | 'duplicate' | 'default_class'
  _errorMsg?: string
  _gradeNumber?: number
  _resolvedClassId?: string
  _resolvedClassName?: string
}

const GRADES = [1, 2, 3, 4, 5, 6]

export default function StudentManagementPage() {
  const navigate = useNavigate()
  const { profile, user } = useAuth()
  const [license, setLicense] = useState<LicenseInfo | null>(null)
  const [allClasses, setAllClasses] = useState<ClassRoom[]>([])
  const [quotaMap, setQuotaMap] = useState<Record<string, ComicQuotaStatus>>({})
  const [students, setStudents] = useState<Student[]>([])
  const [selectedGrade, setSelectedGrade] = useState(5)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [actualCenterId, setActualCenterId] = useState<string | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [singleDeleteConfirm, setSingleDeleteConfirm] = useState<Student | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveTargetClassId, setMoveTargetClassId] = useState('')
  const [toast, setToast] = useState('')

  const [teacherMsgContent, setTeacherMsgContent] = useState('')
  const [isMsgSaving, setIsMsgSaving] = useState(false)
  const [recentTeacherMsg, setRecentTeacherMsg] = useState<any>(null)

  const [notiTitle, setNotiTitle] = useState('')
  const [notiContent, setNotiContent] = useState('')
  const [notiTargetType, setNotiTargetType] = useState<'all' | 'selected'>('all')
  const [isNotiSaving, setIsNotiSaving] = useState(false)

  const [editPasswordStudentId, setEditPasswordStudentId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
  const [parsedRows, setParsedRows] = useState<ExcelRow[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAndSetLicense = () => {
    if (profile?.id) {
      fetchLicenseInfo(profile.id, actualCenterId || profile.center_id || undefined, profile.role).then(setLicense)
    }
  }

  useEffect(() => {
    fetchAndSetLicense()
  }, [profile?.id, actualCenterId, profile?.center_id])

  // 실제 소유 학급을 로드. 없을 때만 학년 전체 가상 학급으로 폴백(레거시 호환).
  const loadAllClasses = () => {
    if (!profile?.id) return
    fetchClassesByTeacher(profile.id).then(classes => {
      if (classes.length > 0) {
        setAllClasses(classes)
      } else {
        const syntheticClasses = GRADES.map(g => ({
          id: `class-${g}`,
          name: `${g}학년 전체`,
          grade: g,
          studentCount: 0,
          teacherName: profile?.name || '선생님',
        }))
        setAllClasses(syntheticClasses)
      }
      setSelectedClassId('')
    }).catch((err) => console.error('[StudentManagementPage] loadAllClasses failed', err))
  }

  useEffect(() => {
    loadAllClasses()
  }, [profile?.id])

  // 만화 생성 한도 사용량 조회(flag 켜져 있을 때만). 학생 목록이 바뀔 때마다 갱신.
  useEffect(() => {
    if (!COMIC_QUOTA_ENABLED || students.length === 0) { setQuotaMap({}); return }
    let cancelled = false
    ;(async () => {
      const m: Record<string, ComicQuotaStatus> = {}
      await Promise.all(students.map(async s => {
        const q = await getStudentQuotaStatus(s.id)
        if (q) m[s.id] = q
      }))
      if (!cancelled) setQuotaMap(m)
    })()
    return () => { cancelled = true }
  }, [students])

  useEffect(() => {
    // 학년 탭 변경 시 선택 학급 초기화 ('전체' 보기)
    setSelectedClassId('')
  }, [selectedGrade])

  useEffect(() => {
    // center_id 는 라이선스/엑셀 등 보조 용도로만 사용. 학생 목록은 student-by-teacher EF 가
    // 서버에서 선생님별로 격리해 조회하므로 center_id 유무와 무관하게 동작한다.
    setActualCenterId(profile?.center_id ?? null)
  }, [profile])

  useEffect(() => {
    // 선생님별 격리 조회. center_id 가 없어도 기관 전체로 누수되지 않는다.
    fetchStudentsByTeacher(selectedGrade).then(data => {
      if (selectedClassId) {
        setStudents(data.filter(s => s.classId === selectedClassId))
      } else {
        setStudents(data)
      }
    }).catch(err => {
      console.error('[StudentManagementPage] 학생 목록 조회 실패:', err)
      setStudents([])
    })
  }, [selectedGrade, selectedClassId, profile?.id])

  useEffect(() => {
    const targetKey = selectedClassId || 'all-grades'
    // 본인이 보낸 말씀만 표시(teacher_id = 본인).
    getMySentTeacherMessages(user?.id, targetKey).then(msgs => {
      setRecentTeacherMsg(msgs[0] || null)
    }).catch(() => null)
  }, [selectedClassId, user?.id])

  const gradeClasses = allClasses.filter(c => c.grade === selectedGrade)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  const toggleAll = () => {
    setCheckedIds(checkedIds.size === students.length ? new Set() : new Set(students.map(s => s.id)))
  }

  const handleCreate = async (data: Parameters<typeof createStudent>[0]) => {
    try {
      // 학급 미선택(classId 빈 문자열)이면 해당 학년 기본학급에 자동 배정.
      // 기본학급이 없으면 get_or_create_default_class RPC 가 안전하게 생성한다.
      let resolvedClassId = data.classId
      let resolvedClassName = data.className
      if (!resolvedClassId && data.grade && profile?.id) {
        try {
          const r = await getOrCreateDefaultClass({ teacherId: profile.id, grade: data.grade })
          if (!isQuotaError(r)) {
            resolvedClassId = r.classId
            resolvedClassName = `${data.grade}학년 기본학급`
          }
        } catch (e) {
          console.error('[StudentManagementPage] default class assign failed', e)
        }
      }

      const newStudent = await createStudent({ ...data, classId: resolvedClassId, className: resolvedClassName })

      // 목록 새로고침(선생님별 격리 조회)
      const refreshedData = await fetchStudentsByTeacher(selectedGrade)
      setStudents(selectedClassId ? refreshedData.filter(s => s.classId === selectedClassId) : refreshedData)

      fetchAndSetLicense()
      showToast(`${newStudent.name} 학생이 생성되었습니다.`)
    } catch (error) {
      console.error('[StudentManagementPage] 학생 생성 실패:', error)
      throw error
    }
  }

  const handleDelete = async () => {
    await deleteStudents([...checkedIds])
    setStudents(prev => prev.filter(s => !checkedIds.has(s.id)))
    setCheckedIds(new Set())
    fetchAndSetLicense()
    showToast('학생이 삭제되었습니다.')
    setDeleteConfirm(false)
  }

  const handleSingleDelete = async () => {
    if (!singleDeleteConfirm) return
    setIsDeleting(true)
    try {
      await deleteStudent(singleDeleteConfirm.id)

      // 목록 새로고침(선생님별 격리 조회)
      const refreshedData = await fetchStudentsByTeacher(selectedGrade)
      setStudents(selectedClassId ? refreshedData.filter(s => s.classId === selectedClassId) : refreshedData)

      fetchAndSetLicense()
      showToast('학생이 삭제되었습니다.')
      setSingleDeleteConfirm(null)
    } catch (err: any) {
      console.error('[StudentManagementPage] 단일 학생 삭제 오류:', err)
      showToast(err.message || '학생 삭제에 실패했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMove = async () => {
    if (!moveTargetClassId) return
    const targetClass = allClasses.find(c => c.id === moveTargetClassId)
    if (!targetClass) return
    await moveStudentsToClass([...checkedIds], moveTargetClassId, targetClass.name)
    setStudents(prev => prev.filter(s => !checkedIds.has(s.id)))
    setCheckedIds(new Set())
    setShowMoveModal(false)
    showToast(`${targetClass.name}(으)로 이동되었습니다.`)
  }

  const handlePasswordUpdate = async () => {
    if (!editPasswordStudentId || newPassword.length < 4) {
      alert('비밀번호는 최소 4자리 이상이어야 합니다.')
      return
    }
    try {
      const { error } = await supabase
        .from('students')
        .update({ temp_password: newPassword })
        .eq('id', editPasswordStudentId)

      if (error) {
        console.error('[StudentManagementPage] Failed to update password:', error.message, error.details, error.hint, error.code)
        alert('비밀번호 수정에 실패했습니다.')
        return
      }

      showToast('비밀번호가 수정되었습니다.')
      setEditPasswordStudentId(null)
      setNewPassword('')

      // Refresh list(선생님별 격리 조회)
      fetchStudentsByTeacher(selectedGrade).then(data => {
        setStudents(selectedClassId ? data.filter(s => s.classId === selectedClassId) : data)
      })
    } catch (err) {
      console.error('[StudentManagementPage] Unexpected error updating password:', err)
      alert('비밀번호 수정에 실패했습니다.')
    }
  }

  const handleSaveTeacherMessage = async () => {
    if (!teacherMsgContent.trim()) {
      showToast('말씀을 입력해주세요.')
      return
    }
    setIsMsgSaving(true)
    try {
      const newMsg = await createTeacherMessage({
        class_key: selectedClassId || 'all-grades',
        content: teacherMsgContent.trim(),
        message_date: new Date().toISOString().split('T')[0],
        is_published: true,
        teacher_id: user?.id,
        center_id: actualCenterId || profile?.center_id,
        title: '선생님 말씀'
      })
      setRecentTeacherMsg(newMsg)
      setTeacherMsgContent('')
      showToast('선생님 말씀이 저장되었습니다.')
    } catch (err) {
      showToast('저장 중 오류가 발생했습니다.')
    } finally {
      setIsMsgSaving(false)
    }
  }

  const handleSendNotification = async () => {
    if (!notiTitle.trim() || !notiContent.trim()) {
      showToast('제목과 내용을 모두 입력해주세요.')
      return
    }
    if (notiTargetType === 'selected' && checkedIds.size === 0) {
      showToast('받는 학생을 선택해주세요.')
      return
    }

    setIsNotiSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const basePayload = {
        title: notiTitle.trim(),
        content: notiContent.trim(),
        category: 'notice',
        notice_date: today,
        is_published: true,
        sender_id: user?.id,
        sender_role: 'teacher'
      }

      if (notiTargetType === 'all') {
        await createNotification({
          ...basePayload,
          target_key: selectedClassId || 'all-grades',
        })
      } else {
        const promises = Array.from(checkedIds).map(studentId => 
          createNotification({
            ...basePayload,
            target_key: studentId,
          })
        )
        await Promise.all(promises)
      }
      
      setNotiTitle('')
      setNotiContent('')
      setNotiTargetType('all')
      setCheckedIds(new Set())
      showToast('학생 알림이 전송되었습니다.')
    } catch (err) {
      showToast('알림 전송 중 오류가 발생했습니다.')
    } finally {
      setIsNotiSaving(false)
    }
  }

  const handleDownloadTemplate = () => {
    // 필수 열: 학생명·학년·아이디·비밀번호 / 선택 열: 학급명(비우면 해당 학년 기본학급 자동 배정)
    const wsData = [
      ['학생명', '학년', '아이디', '비밀번호', '학급명'],
      ['홍길동', '3', 'happy001', '1234', ''],
      ['이순신', '4', 'happy002', '1234', '4학년 1반'],
      ['김철수', '3', 'happy003', '1234', ''],
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

        let existingLoginIds = new Set<string>()
        if (actualCenterId || profile?.organization_id) {
          let q = supabase.from('students').select('login_id')
          q = actualCenterId ? q.eq('center_id', actualCenterId) : q.eq('organization_id', profile!.organization_id)
          const { data: dbStudents } = await q
          if (dbStudents) {
            existingLoginIds = new Set(dbStudents.map(s => s.login_id))
          }
        }

        const fileLoginIds = new Set<string>()
        const parsed: ExcelRow[] = data.map((row) => {
          // 필수: 학생명/학년/아이디/비밀번호, 선택: 학급명. 레거시 학생코드=아이디 호환.
          const name = (row['학생명'] || row['이름'] || '').toString().trim()
          const grade = (row['학년'] || '').toString().trim()
          const loginId = (row['아이디'] || row['학생코드'] || '').toString().trim()
          const password = (row['비밀번호'] || '').toString().trim()
          const className = (row['학급명'] || row['반'] || '').toString().trim()
          const gradeNumber = Number.parseInt(grade, 10) || 0

          const r: ExcelRow = {
            '학생명': name, 이름: name, 학년: grade, 아이디: loginId, 비밀번호: password, 학급명: className,
            _status: 'ready', _gradeNumber: gradeNumber,
          }

          if (!name) { r._status = 'error'; r._errorMsg = '학생명 누락'; return r }
          if (!grade || gradeNumber < 1 || gradeNumber > 6) { r._status = 'error'; r._errorMsg = '학년(1~6) 누락 또는 오류'; return r }
          if (!loginId) { r._status = 'error'; r._errorMsg = '아이디 누락'; return r }
          if (!password) { r._status = 'error'; r._errorMsg = '비밀번호 누락'; return r }

          if (fileLoginIds.has(loginId)) { r._status = 'duplicate'; r._errorMsg = '파일 내 아이디 중복'; return r }
          if (existingLoginIds.has(loginId)) { r._status = 'duplicate'; r._errorMsg = '기존 아이디 존재'; return r }
          fileLoginIds.add(loginId)

          // 학급명 매칭: 본인 소유 학급(allClasses)만 대상. 다른 교사 학급/오타는 매칭 안 됨 → 오류.
          if (className) {
            const matched = allClasses.find(c => c.name === className)
            if (!matched) {
              r._status = 'error'
              r._errorMsg = `존재하지 않는 학급명(오타 자동 생성 금지): ${className}`
              return r
            }
            if (matched.grade !== gradeNumber) {
              r._status = 'error'
              r._errorMsg = `학년-학급 불일치(${className}은 ${matched.grade}학년)`
              return r
            }
            r._resolvedClassId = matched.id
            r._resolvedClassName = matched.name
          } else {
            // 학급명 빈칸 → 해당 학년 기본학급 자동 배정(업로드 시 생성/배정)
            r._status = 'default_class'
            r._errorMsg = `${gradeNumber}학년 기본학급 자동 배정 예정`
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
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBulkUpload = async () => {
    if (!actualCenterId && !profile?.organization_id) {
      alert('\uC18C\uC18D \uAE30\uAD00 \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.')
      return
    }

    // ready(\uC77C\uBC18 \uD559\uAE09 \uC9C0\uC815) + default_class(\uD559\uAE09\uBA85 \uBE44\uC6C0 \u2192 \uAE30\uBCF8\uD559\uAE09 \uC790\uB3D9 \uBC30\uC815) \uB458 \uB2E4 \uB4F1\uB85D \uB300\uC0C1
    const validRows = parsedRows.filter(r => r._status === 'ready' || r._status === 'default_class')
    if (validRows.length === 0) {
      alert('\uB4F1\uB85D \uAC00\uB2A5\uD55C \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uD544\uC218\uAC12(\uD559\uC0DD\uBA85\u00B7\uD559\uB144\u00B7\uC544\uC774\uB514\u00B7\uBE44\uBC00\uBC88\uD638)\uACFC \uD559\uAE09\uBA85\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694.')
      return
    }

    setIsUploading(true)
    let successCount = 0
    const failures: string[] = []
    const prefix = profile?.organization_id
      ? profile.organization_id.substring(0, 4)
      : ((actualCenterId || 'stu').substring(0, 4) || 'stu')

    let existingLoginIds = new Set<string>()
    let existingQuery = supabase.from('students').select('login_id')
    if (actualCenterId) {
      existingQuery = existingQuery.eq('center_id', actualCenterId)
    } else if (profile?.organization_id) {
      existingQuery = existingQuery.eq('organization_id', profile.organization_id)
    }
    const { data: dbStudents } = await existingQuery
    if (dbStudents) {
      existingLoginIds = new Set(dbStudents.map(s => s.login_id))
    }

    try {
      for (const [index, row] of validRows.entries()) {
        const name = (row['\uD559\uC0DD\uBA85'] || row.\uC774\uB984 || '').toString().trim()
        const gradeNumber = row._gradeNumber || selectedGrade
        const password = (row.\uBE44\uBC00\uBC88\uD638 || '1234').toString()
        let loginId = (row.\uC544\uC774\uB514 || row.\uD559\uC0DD\uCF54\uB4DC || '').toString().trim()

        if (!loginId) {
          do {
            loginId = `${prefix}_${Math.floor(100000 + Math.random() * 900000)}`
          } while (existingLoginIds.has(loginId))
        }

        if (existingLoginIds.has(loginId)) {
          failures.push(`${loginId}: \uC774\uBBF8 \uC0AC\uC6A9 \uC911\uC778 \uC544\uC774\uB514`)
          continue
        }
        existingLoginIds.add(loginId)

        // classId \uACB0\uC815: \uBBF8\uB9AC\uBCF4\uAE30\uC5D0\uC11C \uB9E4\uCE6D\uB41C \uD559\uAE09\uAC12, \uC5C6\uC73C\uBA74 \uD574\uB2F9 \uD559\uB144 \uAE30\uBCF8\uD559\uAE09 \uC790\uB3D9 \uC0DD\uC131/\uBC30\uC815
        let classId = row._resolvedClassId || ''
        let classNameFinal = row._resolvedClassName || ''
        if (!classId && profile?.id) {
          try {
            const dr = await getOrCreateDefaultClass({ teacherId: profile.id, grade: gradeNumber })
            if (!isQuotaError(dr)) {
              classId = dr.classId
              classNameFinal = `${gradeNumber}\uD559\uB144 \uAE30\uBCF8\uD559\uAE09`
            }
          } catch (e) {
            console.error('[StudentManagementPage] default class creation failed', e)
          }
        }

        try {
          await createStudent({
            name,
            loginId,
            password,
            classId,
            className: classNameFinal || `${gradeNumber}\uD559\uB144 \uC804\uCCB4`,
            grade: gradeNumber,
            number: index + 1,
          })
          successCount += 1
        } catch (error) {
          const message = error instanceof Error ? error.message : '\uC54C \uC218 \uC5C6\uB294 \uC624\uB958'
          failures.push(`${loginId}: ${message}`)
        }
      }

      alert(`\uC5C5\uB85C\uB4DC \uC644\uB8CC! \uC131\uACF5: ${successCount}\uAC74, \uC2E4\uD328: ${failures.length}\uAC74${failures.length ? '\n' + failures.slice(0, 5).join('\n') : ''}`)
      setIsExcelModalOpen(false)
      setParsedRows([])

      fetchStudentsByTeacher(selectedGrade).then(data => {
        setStudents(selectedClassId ? data.filter(s => s.classId === selectedClassId) : data)
      })
      // \uD559\uAE09 \uBAA9\uB85D\uC5D0 \uAE30\uBCF8\uD559\uAE09\uC774 \uC0C8\uB85C \uC0DD\uC131\uB418\uC5C8\uC744 \uC218 \uC788\uC73C\uBBC0\uB85C \uAC31\uC2E0
      loadAllClasses()
    } catch (err) {
      console.error(err)
      alert('\uC77C\uAD04 \uB4F1\uB85D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.')
    } finally {
      setIsUploading(false)
    }
  }
  const btnBase: React.CSSProperties = {
    padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none',
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a2e', color: 'white', padding: '12px 24px',
          borderRadius: 99, fontSize: 14, fontWeight: 600, zIndex: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {license && <LicenseCard license={license} />}

      {/* 학년 탭 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20, flexWrap: 'wrap' }}>
        {GRADES.map(g => (
          <button key={g} onClick={() => { setSelectedGrade(g); setCheckedIds(new Set()) }} style={{
            padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            border: '2px solid', transition: 'all 0.2s',
            borderColor: selectedGrade === g ? '#ff2778' : '#e5e7eb',
            background: selectedGrade === g ? '#fff0f6' : 'white',
            color: selectedGrade === g ? '#ff2778' : '#666',
          }}>{g}학년</button>
        ))}
      </div>

      {/* 학급 선택 드롭다운 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, marginBottom: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>학급 선택:</label>
        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} style={{
          padding: '8px 16px', borderRadius: 10, border: '1.5px solid #e5e7eb',
          fontSize: 14, cursor: 'pointer', background: 'white',
        }}>
          <option value="">전체</option>
          {gradeClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{ fontSize: 13, color: '#aaa' }}>총 {students.length}명</span>
      </div>

      {/* 버튼 영역 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <button style={{ ...btnBase, background: 'linear-gradient(90deg,#ff2778,#ff6baf)', color: 'white', boxShadow: '0 4px 12px rgba(255,39,120,0.3)' }}
          onClick={() => setShowCreate(true)}>+ 학생 생성</button>
        <button style={{ ...btnBase, background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe' }}
          onClick={handleDownloadTemplate}>📥 엑셀 양식 다운로드</button>
        <button style={{ ...btnBase, background: 'white', color: '#555', border: '1.5px solid #e5e7eb' }}
          onClick={() => setIsExcelModalOpen(true)}>📁 엑셀 일괄 등록</button>
        {checkedIds.size > 0 && (
          <>
            <button style={{ ...btnBase, background: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe' }}
              onClick={() => setShowMoveModal(true)}>🔀 학급이동 ({checkedIds.size})</button>
            <button style={{ ...btnBase, background: '#fee2e2', color: '#ef4444', border: '1.5px solid #fca5a5' }}
              onClick={() => setDeleteConfirm(true)}>🗑️ 삭제 ({checkedIds.size})</button>
          </>
        )}
      </div>

      <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
        안내: 엑셀 일괄 등록 시 학생의 최초 비밀번호는 <span style={{ fontWeight: 'bold', color: '#ff2778' }}>1234</span>로 설정됩니다.
      </div>

      {/* 선생님 말씀 및 학생 알림 보내기 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* 선생님 말씀 카드 */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f9a8d4' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>💬</span> 선생님 말씀
          </h3>
          <textarea
            value={teacherMsgContent}
            onChange={e => setTeacherMsgContent(e.target.value)}
            placeholder="학생들에게 전할 짧은 안내문을 작성하세요."
            rows={3}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 13, color: '#888', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 10 }}>
              {recentTeacherMsg ? `최근 저장: ${recentTeacherMsg.content}` : '저장된 말씀이 없습니다.'}
            </div>
            <button 
              onClick={handleSaveTeacherMessage} 
              disabled={isMsgSaving}
              style={{ ...btnBase, background: 'linear-gradient(90deg,#ff2778,#ff6baf)', color: 'white', padding: '8px 16px' }}
            >
              {isMsgSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* 학생 알림 보내기 카드 */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #bae6fd' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔔</span> 학생 알림 보내기
          </h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <label style={{ fontSize: 14, color: '#333', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="radio" checked={notiTargetType === 'all'} onChange={() => setNotiTargetType('all')} />
              전체 학생
            </label>
            <label style={{ fontSize: 14, color: '#333', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="radio" checked={notiTargetType === 'selected'} onChange={() => setNotiTargetType('selected')} />
              선택한 학생 ({checkedIds.size}명)
            </label>
          </div>
          <input
            type="text"
            value={notiTitle}
            onChange={e => setNotiTitle(e.target.value)}
            placeholder="알림 제목"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, marginBottom: 10, boxSizing: 'border-box', outline: 'none' }}
          />
          <textarea
            value={notiContent}
            onChange={e => setNotiContent(e.target.value)}
            placeholder="알림 내용을 작성하세요."
            rows={2}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button 
              onClick={handleSendNotification} 
              disabled={isNotiSaving}
              style={{ ...btnBase, background: '#0ea5e9', color: 'white', padding: '8px 16px' }}
            >
              {isNotiSaving ? '전송 중...' : '전송'}
            </button>
          </div>
        </div>
      </div>

      {/* 학생 목록 표 */}
      <div className="table-wrapper" style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ minWidth: '600px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 60px 100px 140px 100px 140px',
            padding: '14px 20px', background: '#fafafa',
            borderBottom: '1.5px solid #f0f0f0', fontSize: 13, fontWeight: 700, color: '#666',
          }}>
            <div><input type="checkbox" checked={students.length > 0 && checkedIds.size === students.length} onChange={toggleAll} style={{ cursor: 'pointer' }} /></div>
            <div>번호</div>
            <div>이름</div>
            <div>아이디</div>
            <div>비밀번호</div>
            <div>관리</div>
          </div>

        {students.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#bbb', fontSize: 15 }}>
            등록된 학생이 없습니다.
            <br />
            <button onClick={() => setShowCreate(true)} style={{
              marginTop: 12, padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(90deg,#ff2778,#ff6baf)', color: 'white',
              fontWeight: 700, cursor: 'pointer', fontSize: 14,
            }}>+ 학생 생성하기</button>
          </div>
        ) : (
          students.sort((a, b) => a.number - b.number).map((stu, idx) => (
            <div key={stu.id} style={{
              display: 'grid', gridTemplateColumns: '40px 60px 100px 140px 100px 140px',
              padding: '13px 20px',
              borderBottom: idx < students.length - 1 ? '1px solid #f9f9f9' : 'none',
              alignItems: 'center',
              background: checkedIds.has(stu.id) ? '#fff0f6' : 'white',
            }}>
              <div><input type="checkbox" checked={checkedIds.has(stu.id)} onChange={() => toggleCheck(stu.id)} style={{ cursor: 'pointer' }} /></div>
              <div style={{ fontSize: 14, color: '#888' }}>{stu.number}</div>
              <button onClick={() => navigate(`/admin/lms/students/${stu.id}`)} style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }} title="학생 상세 보기">{stu.name} <span style={{ fontSize: 11, color: '#ff2778' }}>상세</span></button>
              <div style={{ fontSize: 13, color: '#555', fontFamily: 'monospace' }}>{stu.loginId}</div>
              {COMIC_QUOTA_ENABLED && quotaMap[stu.id] && (
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                  이번 달 완료 {quotaMap[stu.id].completed} · 생성중 {quotaMap[stu.id].reserved} · 남음 {quotaMap[stu.id].remaining}/{quotaMap[stu.id].final_limit}
                </div>
              )}
              <div style={{ fontSize: 13, color: '#aaa', fontFamily: 'monospace' }}>******</div>
              <div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button onClick={() => {
                    setEditPasswordStudentId(stu.id)
                    setNewPassword('')
                  }} style={{
                    minWidth: '56px', whiteSpace: 'nowrap', flexShrink: 0,
                    padding: '6px 12px', fontSize: 12, borderRadius: 6,
                    border: '1px solid #ddd', background: 'white', cursor: 'pointer',
                    fontWeight: 600, color: '#555'
                  }}>수정</button>
                  <button 
                    onClick={() => setSingleDeleteConfirm(stu)} 
                    disabled={isDeleting}
                    style={{
                      minWidth: '56px', whiteSpace: 'nowrap', flexShrink: 0,
                      padding: '6px 12px', fontSize: 12, borderRadius: 6,
                      border: '1px solid #fca5a5', background: isDeleting ? '#f3f4f6' : '#fee2e2', 
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontWeight: 600, color: isDeleting ? '#9ca3af' : '#ef4444'
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      </div>

      {/* 학생 생성 모달 */}
      {showCreate && (
        <CreateStudentModal
          classes={allClasses}
          defaultClassId={selectedClassId}
          defaultGrade={selectedGrade}
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={deleteConfirm}
        title="학생 삭제"
        description={`선택한 ${checkedIds.size}명의 학생을 삭제하시겠습니까?\n삭제된 학생 데이터는 복구할 수 없습니다.`}
        confirmText="삭제"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(false)}
        variant="danger"
      />

      {/* 단일 삭제 확인 모달 */}
      <ConfirmModal
        open={!!singleDeleteConfirm}
        title="학생 삭제"
        description={`'${singleDeleteConfirm?.name}' 학생 (${singleDeleteConfirm?.loginId})을(를) 삭제하시겠습니까?\n학생을 삭제하면 출석, 보상, 만화 프로젝트 등 관련 기록도 함께 삭제될 수 있습니다.`}
        confirmText={isDeleting ? '삭제 중...' : '완전 삭제'}
        onConfirm={handleSingleDelete}
        onCancel={() => !isDeleting && setSingleDeleteConfirm(null)}
        variant="danger"
        loading={isDeleting}
      />

      {/* 학급이동 모달 */}
      {showMoveModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setShowMoveModal(false)}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 400,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>학급이동</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>이동할 학급을 선택해 주세요.</p>
            <select value={moveTargetClassId} onChange={e => setMoveTargetClassId(e.target.value)} style={{
              width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14,
            }}>
              <option value="">학급 선택...</option>
              {allClasses.filter(c => c.id !== selectedClassId).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowMoveModal(false)} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb',
                background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer',
              }}>취소</button>
              <button onClick={handleMove} disabled={!moveTargetClassId} style={{
                flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                background: moveTargetClassId ? 'linear-gradient(90deg,#2563eb,#60a5fa)' : '#e5e7eb',
                color: 'white', fontWeight: 700, cursor: moveTargetClassId ? 'pointer' : 'not-allowed',
              }}>이동하기</button>
            </div>
          </div>
        </div>
      )}

      {/* 학생 엑셀 일괄 업로드 모달 */}
      {isExcelModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20
        }} onClick={() => setIsExcelModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 800, maxHeight: '90vh',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>학생 엑셀 대량 등록</h3>
                <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>양식에 맞춰 엑셀 파일을 업로드하면 여러 학생을 한 번에 등록할 수 있습니다.</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <label style={{
                  padding: '8px 16px', borderRadius: 10, background: '#2563eb', color: 'white',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>
                  파일 선택
                  <input type="file" accept=".xlsx, .csv" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileUpload} />
                </label>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: '#fafafa', borderRadius: 12, padding: 16, border: '1px solid #eee' }}>
              {parsedRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 14 }}>
                  우측 상단 '파일 선택' 버튼을 눌러 엑셀 파일을 업로드해 주세요.<br/>
                  <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: 12, fontSize: 12, color: '#888' }}>
                    <li>양식의 컬럼명을 변경하지 마세요.</li>
                    <li>이름, 학년은 필수입니다.</li>
                    <li>학생코드가 없을 경우 시스템이 자동으로 생성합니다.</li>
                    <li>'반' 정보는 업로드 미리보기에서만 표시되며 DB에는 저장되지 않습니다.</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, fontWeight: 600 }}>
                    <span style={{ color: '#10b981' }}>등록 가능: {parsedRows.filter(r => r._status === 'ready').length}건</span>
                    <span style={{ color: '#ef4444' }}>오류/중복: {parsedRows.filter(r => r._status !== 'ready').length}건</span>
                  </div>
                  <table style={{ width: '100%', fontSize: 13, textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #eee', color: '#666' }}>
                        <th style={{ padding: '8px 4px' }}>No</th>
                        <th style={{ padding: '8px 4px' }}>이름</th>
                        <th style={{ padding: '8px 4px' }}>학년</th>
                        <th style={{ padding: '8px 4px' }}>반 (저장안됨)</th>
                        <th style={{ padding: '8px 4px' }}>학생코드</th>
                        <th style={{ padding: '8px 4px' }}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0', color: row._status === 'ready' ? '#333' : '#ef4444' }}>
                          <td style={{ padding: '8px 4px' }}>{idx + 1}</td>
                          <td style={{ padding: '8px 4px', fontWeight: 600 }}>{row.이름 || '-'}</td>
                          <td style={{ padding: '8px 4px' }}>{row.학년 || '-'}</td>
                          <td style={{ padding: '8px 4px', color: '#888' }}>{row.반 || '-'}</td>
                          <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{row.학생코드 || <span style={{ color: '#aaa' }}>자동 발급</span>}</td>
                          <td style={{ padding: '8px 4px', fontWeight: 600 }}>
                            {row._status === 'ready' ? <span style={{ color: '#10b981' }}>가능</span> : row._errorMsg}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => { setIsExcelModalOpen(false); setParsedRows([]); }} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb',
                background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer'
              }}>닫기</button>
              <button onClick={handleBulkUpload} disabled={parsedRows.length === 0 || parsedRows.filter(r => r._status === 'ready').length === 0 || isUploading} style={{
                flex: 2, padding: '12px', borderRadius: 12, border: 'none',
                background: parsedRows.filter(r => r._status === 'ready').length > 0 ? '#2563eb' : '#e5e7eb',
                color: 'white', fontWeight: 700, cursor: parsedRows.filter(r => r._status === 'ready').length > 0 ? 'pointer' : 'not-allowed'
              }}>{isUploading ? '등록 중...' : '엑셀 데이터 일괄 등록'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 학생 비밀번호 수정 모달 */}
      {editPasswordStudentId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }} onClick={() => setEditPasswordStudentId(null)}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 360,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px' }}>비밀번호 수정</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>새로운 비밀번호를 입력해 주세요. (최소 4자리)</p>
            <input
              type="text"
              placeholder="새 비밀번호 입력"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                fontSize: 14, boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setEditPasswordStudentId(null)} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e5e7eb',
                background: 'white', color: '#555', fontWeight: 600, cursor: 'pointer',
              }}>취소</button>
              <button onClick={handlePasswordUpdate} style={{
                flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(90deg,#ff2778,#ff6baf)',
                color: 'white', fontWeight: 700, cursor: 'pointer',
              }}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
