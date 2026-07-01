// ──────────────────────────────────────────────
// 샘플 데이터 - 학생
// ──────────────────────────────────────────────
import type { Student } from '../types'

export const MOCK_STUDENTS: Student[] = [
  // 1학년 1반 (cls-1)
  { id: 'stu-101', name: '권진원', loginId: 'jw101', password: '1234', classId: 'cls-1', className: '1학년 1반', grade: 1, number: 1, createdAt: '2026.04.05' },
  { id: 'stu-102', name: '김민준', loginId: 'mj102', password: '1234', classId: 'cls-1', className: '1학년 1반', grade: 1, number: 2, createdAt: '2026.04.05' },
  { id: 'stu-103', name: '이예준', loginId: 'yj103', password: '1234', classId: 'cls-1', className: '1학년 1반', grade: 1, number: 3, createdAt: '2026.04.05' },
  { id: 'stu-104', name: '박소윤', loginId: 'sy104', password: '1234', classId: 'cls-1', className: '1학년 1반', grade: 1, number: 4, createdAt: '2026.04.06' },
  { id: 'stu-105', name: '최지호', loginId: 'jh105', password: '1234', classId: 'cls-1', className: '1학년 1반', grade: 1, number: 5, createdAt: '2026.04.06' },
  { id: 'stu-106', name: '정하은', loginId: 'he106', password: '1234', classId: 'cls-1', className: '1학년 1반', grade: 1, number: 6, createdAt: '2026.04.07' },
  // 2학년 1반 (cls-3)
  { id: 'stu-201', name: '오지민', loginId: 'jm201', password: '1234', classId: 'cls-3', className: '2학년 1반', grade: 2, number: 1, createdAt: '2026.04.05' },
  { id: 'stu-202', name: '한서진', loginId: 'sj202', password: '1234', classId: 'cls-3', className: '2학년 1반', grade: 2, number: 2, createdAt: '2026.04.05' },
  { id: 'stu-203', name: '강예원', loginId: 'yw203', password: '1234', classId: 'cls-3', className: '2학년 1반', grade: 2, number: 3, createdAt: '2026.04.06' },
  { id: 'stu-204', name: '윤도현', loginId: 'dh204', password: '1234', classId: 'cls-3', className: '2학년 1반', grade: 2, number: 4, createdAt: '2026.04.06' },
  { id: 'stu-205', name: '장수아', loginId: 'sa205', password: '1234', classId: 'cls-3', className: '2학년 1반', grade: 2, number: 5, createdAt: '2026.04.07' },
  { id: 'stu-206', name: '임채원', loginId: 'cw206', password: '1234', classId: 'cls-3', className: '2학년 1반', grade: 2, number: 6, createdAt: '2026.04.07' },
  { id: 'stu-207', name: '신지우', loginId: 'jw207', password: '1234', classId: 'cls-3', className: '2학년 1반', grade: 2, number: 7, createdAt: '2026.04.08' },
  // 5학년 1반 (cls-7)
  { id: 'stu-501', name: '이도준', loginId: 'dj501', password: '1234', classId: 'cls-7', className: '5학년 1반', grade: 5, number: 1, createdAt: '2026.04.05' },
  { id: 'stu-502', name: '김나연', loginId: 'ny502', password: '1234', classId: 'cls-7', className: '5학년 1반', grade: 5, number: 2, createdAt: '2026.04.05' },
  { id: 'stu-503', name: '박준서', loginId: 'js503', password: '1234', classId: 'cls-7', className: '5학년 1반', grade: 5, number: 3, createdAt: '2026.04.06' },
  { id: 'stu-504', name: '최아린', loginId: 'ar504', password: '1234', classId: 'cls-7', className: '5학년 1반', grade: 5, number: 4, createdAt: '2026.04.06' },
  { id: 'stu-505', name: '정민재', loginId: 'mj505', password: '1234', classId: 'cls-7', className: '5학년 1반', grade: 5, number: 5, createdAt: '2026.04.07' },
  { id: 'stu-506', name: '홍수빈', loginId: 'sb506', password: '1234', classId: 'cls-7', className: '5학년 1반', grade: 5, number: 6, createdAt: '2026.04.07' },
]
