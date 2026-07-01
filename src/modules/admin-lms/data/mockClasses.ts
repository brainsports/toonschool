// ──────────────────────────────────────────────
// 샘플 데이터 - 학급
// ──────────────────────────────────────────────
import type { ClassRoom, LicenseInfo, CurriculumUnit } from '../types'

export const MOCK_LICENSE: LicenseInfo = {
  plan: '기관 프리미엄',
  startDate: '2026.04.03',
  endDate: '2026.12.31',
  totalSlots: 60,
  usedSlots: 37,
}

export const MOCK_CLASSES: ClassRoom[] = [
  { id: 'cls-1', grade: 1, name: '1학년 1반', studentCount: 6, teacherName: '김지영', unitSetting: { classId: 'cls-1', grade: 1, semester: null, fromUnit: 1, toUnit: 8, label: '전체 허용' } },
  { id: 'cls-2', grade: 1, name: '1학년 2반', studentCount: 5, teacherName: '박현수' },
  { id: 'cls-3', grade: 2, name: '2학년 1반', studentCount: 7, teacherName: '이서연', unitSetting: { classId: 'cls-3', grade: 2, semester: 1, fromUnit: 1, toUnit: 4, label: '2학년 1학기 1~4단원' } },
  { id: 'cls-4', grade: 2, name: '2학년 2반', studentCount: 6, teacherName: '최민정' },
  { id: 'cls-5', grade: 3, name: '3학년 1반', studentCount: 8, teacherName: '김지영', unitSetting: { classId: 'cls-5', grade: 3, semester: 2, fromUnit: 1, toUnit: 5, label: '3학년 2학기 1~5단원' } },
  { id: 'cls-6', grade: 4, name: '4학년 1반', studentCount: 5, teacherName: '박현수' },
  { id: 'cls-7', grade: 5, name: '5학년 1반', studentCount: 6, teacherName: '이서연', unitSetting: { classId: 'cls-7', grade: 5, semester: 1, fromUnit: 1, toUnit: 3, label: '5학년 1학기 1~3단원' } },
  { id: 'cls-8', grade: 6, name: '6학년 1반', studentCount: 5, teacherName: '최민정' },
]

// 교육과정 단원 데이터 (샘플 - 학년별 1~2학기 단원)
export const CURRICULUM_UNITS: CurriculumUnit[] = [
  // 1학년
  { grade: 1, semester: 1, unitNumber: 1, unitName: '바른 자세로 읽고 쓰기' },
  { grade: 1, semester: 1, unitNumber: 2, unitName: '받침이 없는 글자' },
  { grade: 1, semester: 1, unitNumber: 3, unitName: '다 함께 아야어여' },
  { grade: 1, semester: 1, unitNumber: 4, unitName: '글자를 만들어요' },
  { grade: 1, semester: 2, unitNumber: 1, unitName: '소중한 책을 소개해요' },
  { grade: 1, semester: 2, unitNumber: 2, unitName: '소리와 모양을 흉내 내요' },
  { grade: 1, semester: 2, unitNumber: 3, unitName: '문장으로 표현해요' },
  { grade: 1, semester: 2, unitNumber: 4, unitName: '인물의 말과 행동을 상상해요' },
  // 2학년
  { grade: 2, semester: 1, unitNumber: 1, unitName: '시를 즐겨요' },
  { grade: 2, semester: 1, unitNumber: 2, unitName: '자세하게 소개해요' },
  { grade: 2, semester: 1, unitNumber: 3, unitName: '마음을 나누어요' },
  { grade: 2, semester: 1, unitNumber: 4, unitName: '말놀이를 해요' },
  { grade: 2, semester: 2, unitNumber: 1, unitName: '장면을 상상해요' },
  { grade: 2, semester: 2, unitNumber: 2, unitName: '인상 깊었던 일을 써요' },
  { grade: 2, semester: 2, unitNumber: 3, unitName: '말의 재미를 찾아서' },
  { grade: 2, semester: 2, unitNumber: 4, unitName: '인물의 마음을 짐작해요' },
  // 3학년
  { grade: 3, semester: 1, unitNumber: 1, unitName: '재미가 톡톡톡' },
  { grade: 3, semester: 1, unitNumber: 2, unitName: '문단의 짜임' },
  { grade: 3, semester: 1, unitNumber: 3, unitName: '알맞은 높임 표현' },
  { grade: 3, semester: 1, unitNumber: 4, unitName: '내 마음을 편지에 담아' },
  { grade: 3, semester: 2, unitNumber: 1, unitName: '감동을 나누며 읽어요' },
  { grade: 3, semester: 2, unitNumber: 2, unitName: '중심 생각을 찾아요' },
  { grade: 3, semester: 2, unitNumber: 3, unitName: '자신의 경험을 글로 써요' },
  { grade: 3, semester: 2, unitNumber: 4, unitName: '감사를 표현하기' },
  { grade: 3, semester: 2, unitNumber: 5, unitName: '바르고 공손하게' },
  // 4학년
  { grade: 4, semester: 1, unitNumber: 1, unitName: '생각과 느낌을 나누어요' },
  { grade: 4, semester: 1, unitNumber: 2, unitName: '내용을 간추려요' },
  { grade: 4, semester: 1, unitNumber: 3, unitName: '느낌을 살려 말해요' },
  { grade: 4, semester: 2, unitNumber: 1, unitName: '이야기 속 세상' },
  { grade: 4, semester: 2, unitNumber: 2, unitName: '의견이 드러나게 글을 써요' },
  { grade: 4, semester: 2, unitNumber: 3, unitName: '본받고 싶은 인물을 찾아봐요' },
  // 5학년
  { grade: 5, semester: 1, unitNumber: 1, unitName: '대화와 공감' },
  { grade: 5, semester: 1, unitNumber: 2, unitName: '작품을 감상해요' },
  { grade: 5, semester: 1, unitNumber: 3, unitName: '글쓴이의 주장' },
  { grade: 5, semester: 2, unitNumber: 1, unitName: '마음을 나누며 대화해요' },
  { grade: 5, semester: 2, unitNumber: 2, unitName: '지식이나 경험을 활용해요' },
  // 6학년
  { grade: 6, semester: 1, unitNumber: 1, unitName: '비유하는 표현' },
  { grade: 6, semester: 1, unitNumber: 2, unitName: '이야기를 간추려요' },
  { grade: 6, semester: 2, unitNumber: 1, unitName: '작품 속 인물과 나' },
  { grade: 6, semester: 2, unitNumber: 2, unitName: '정보와 표현 판단하기' },
]
