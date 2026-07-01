// ──────────────────────────────────────────────
// 툰스쿨 관리 LMS - 공통 타입 정의
// ──────────────────────────────────────────────

export type UserRole = 'super_admin' | 'middle_admin' | 'org_admin' | 'teacher' | 'student'

export interface LicenseInfo {
  plan: string
  startDate: string
  endDate: string
  totalSlots: number
  usedSlots: number
}

// ── 학급 ──
export interface ClassRoom {
  id: string
  grade: number        // 1~6
  name: string         // 예: '2학년 1반'
  studentCount: number
  unitSetting?: UnitSetting
  teacherId?: string
  teacherName?: string
}

export interface UnitSetting {
  classId: string
  grade: number
  subjects: string[]       // '전체' 또는 '국어', '수학' 등 복수 선택 가능
  semester: 1 | 2 | null  // null = 전체 허용
  fromUnit: number         // 시작 단원
  toUnit: number           // 끝 단원
  label: string            // 표시 텍스트
}

// ── 단원 ──
export interface CurriculumUnit {
  grade: number
  subject: string
  semester: 1 | 2
  unitNumber: number
  unitName: string
}

// ── 학생 ──
export interface Student {
  id: string
  name: string
  loginId: string
  password: string
  classId: string
  className: string
  grade: number
  number: number   // 반 번호
  createdAt: string
}

// ── 선생님 ──
export interface Teacher {
  id: string
  name: string
  loginId: string
  joinedAt: string
  classIds: string[]
  classNames: string[]
}

// ── 기관 정보 ──
export interface OrgInfo {
  id: string
  name: string
  linkCode: string
  curriculum: string  // 예: 'KR'
  adminPassword?: string
}
