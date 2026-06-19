export type UserRole = 'super_admin' | 'org_admin' | 'teacher' | 'student' | 'guest';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '슈퍼관리자',
  org_admin: '기관 관리자',
  teacher: '선생님',
  student: '학생',
  guest: '공유 방문자',
};

export const ROLE_DEFAULT_PATHS: Record<UserRole, string> = {
  super_admin: '/super-admin',
  org_admin: '/admin',
  teacher: '/teacher',
  student: '/student',
  guest: '/share',
};
