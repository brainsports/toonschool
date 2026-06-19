import type { StudentGrade, StudentSubject } from '../types/studentFlow'
import { mockMajorUnits, mockSubUnits } from '../data/studentMockData'

export const grades: StudentGrade[] = ['초3', '초4', '초5', '초6']
export const subjects: StudentSubject[] = ['국어', '영어', '수학', '사회', '과학']

export function getMajorUnits(grade: StudentGrade, subject: StudentSubject): string[] {
  const key = `${grade}-${subject}`
  return mockMajorUnits[key] || []
}

export function getSubUnits(majorUnit: string): string[] {
  return mockSubUnits[majorUnit] || []
}

export function getNextCutPath(cutNumber: number): string {
  if (cutNumber >= 6) return '/student/comic/full'
  return `/student/comic/cut/${cutNumber + 1}`
}

export function isLastCut(cutNumber: number): boolean {
  return cutNumber === 6
}

export function isHalfwayDone(cutNumber: number): boolean {
  return cutNumber === 3
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function getDifficultyColor(difficulty: '쉬움' | '보통' | '어려움'): string {
  switch (difficulty) {
    case '쉬움': return 'bg-green-100 text-green-700 border-green-300'
    case '보통': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case '어려움': return 'bg-red-100 text-red-700 border-red-300'
    default: return 'bg-gray-100 text-gray-700'
  }
}
