// ──────────────────────────────────────────────
// 샘플 데이터 - 선생님 & 기관 정보
// ──────────────────────────────────────────────
import type { Teacher, OrgInfo } from '../types'

export const MOCK_ORG_INFO: OrgInfo = {
  id: 'org-1',
  name: '행복지역아동센터',
  linkCode: 'Happy26',
  curriculum: 'KR',
}

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: 'tea-1', name: '김지영', loginId: 'teacher_jy',
    joinedAt: '2026.04.01',
    classIds: ['cls-1', 'cls-5'],
    classNames: ['1학년 1반', '3학년 1반'],
  },
  {
    id: 'tea-2', name: '박현수', loginId: 'teacher_hs',
    joinedAt: '2026.04.01',
    classIds: ['cls-2', 'cls-6'],
    classNames: ['1학년 2반', '4학년 1반'],
  },
  {
    id: 'tea-3', name: '이서연', loginId: 'teacher_sy',
    joinedAt: '2026.04.03',
    classIds: ['cls-3', 'cls-7'],
    classNames: ['2학년 1반', '5학년 1반'],
  },
  {
    id: 'tea-4', name: '최민정', loginId: 'teacher_mj',
    joinedAt: '2026.04.05',
    classIds: ['cls-4', 'cls-8'],
    classNames: ['2학년 2반', '6학년 1반'],
  },
]
