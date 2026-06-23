// 학생 단원 선택 관련 타입 정의

export interface StudentGradeOption {
  id: string
  label: string
  value: number
}

export interface StudentSemesterOption {
  id: string
  label: string
  value: number
}

export interface StudentSubjectOption {
  id: string
  name: string
  code: string
}

export interface StudentMajorUnitOption {
  id: string
  unitNumber: number
  unitName: string
}

export interface StudentMiddleUnitOption {
  id: string
  subunitNumber: number
  subunitName: string
  subunitSummary: string
}

export interface StudentUnitSelection {
  gradeValue: number | null
  gradeName: string | null
  semesterValue: number | null
  semesterName: string | null
  subjectId: string | null
  subjectName: string | null
  majorUnitId: string | null
  majorUnitName: string | null
  middleUnitId: string | null
  middleUnitName: string | null
}

export type CurriculumLoadState = 'idle' | 'loading' | 'success' | 'error' | 'empty'
