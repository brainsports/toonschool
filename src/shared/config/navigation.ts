import { ROUTES } from './routes';
import type { UserRole } from './roles';

export interface NavigationItem {
  name: string;
  path: string;
  iconName?: string; // Icon identifier for flexible UI rendering
}

export const NAVIGATION_BY_ROLE: Record<UserRole, NavigationItem[]> = {
  super_admin: [
    { name: '슈퍼관리자 대시보드', path: ROUTES.superAdminHome, iconName: 'ShieldAlert' },
    { name: '기관 관리', path: ROUTES.superAdminOrganizations, iconName: 'Building' },
    { name: '사용자 관리', path: ROUTES.superAdminUsers, iconName: 'Users' },
    { name: '중간관리자 관리', path: '/admin/lms/middle-admins', iconName: 'Users' },
    { name: '교과 DB 관리', path: ROUTES.superAdminCurriculum, iconName: 'Database' },
    { name: '작품 관리', path: ROUTES.superAdminComics, iconName: 'Compass' },
    { name: '평가 관리', path: ROUTES.superAdminEvaluations, iconName: 'BarChart3' },
    { name: '사용량 관리', path: ROUTES.superAdminUsage, iconName: 'TrendingUp' },
    { name: '시스템 설정', path: ROUTES.superAdminSettings, iconName: 'Settings' },
  ],
  middle_admin: [
    { name: '중간관리자 대시보드', path: '/manager/dashboard', iconName: 'Layout' },
    { name: '소속기관 관리', path: '/manager/organizations', iconName: 'Building' },
    { name: '이용권 관리', path: '/manager/licenses', iconName: 'CreditCard' },
    { name: '학급 관리', path: '/manager/classes', iconName: 'FolderCanvas' },
    { name: '선생님 관리', path: '/manager/teachers', iconName: 'UserCheck' },
    { name: '학생 관리', path: '/manager/students', iconName: 'Users' },
    { name: '알림 보내기', path: '/manager/notifications/send', iconName: 'Bell' },
  ],
  org_admin: [
    { name: '관리자 대시보드', path: ROUTES.adminHome, iconName: 'Layout' },
    { name: '기관 정보', path: ROUTES.adminSettings, iconName: 'Building' },
    { name: '학급 관리', path: ROUTES.adminClasses, iconName: 'FolderCanvas' },
    { name: '교사 관리', path: ROUTES.adminTeachers, iconName: 'UserCheck' },
    { name: '학생 관리', path: ROUTES.adminStudents, iconName: 'Users' },
    { name: '작품 현황', path: ROUTES.adminComics, iconName: 'Compass' },
    { name: '평가 현황', path: ROUTES.adminEvaluations, iconName: 'BarChart3' },
    { name: '사용량 안내', path: ROUTES.adminUsage, iconName: 'CreditCard' },
  ],
  teacher: [
    { name: '선생님 대시보드', path: ROUTES.teacherHome, iconName: 'Layout' },
    { name: '내 학급', path: ROUTES.teacherClasses, iconName: 'FolderCanvas' },
    { name: '학생 목록', path: ROUTES.teacherStudents, iconName: 'Users' },
    { name: '과제 관리', path: ROUTES.teacherAssignments, iconName: 'BookOpen' },
    { name: '작품 확인', path: ROUTES.teacherComics, iconName: 'Compass' },
    { name: '평가 결과', path: ROUTES.teacherEvaluations, iconName: 'BarChart3' },
  ],
  student: [
    { name: '학생 홈', path: ROUTES.studentHome, iconName: 'Home' },
    { name: '학습툰 만들기', path: ROUTES.studentComicNew, iconName: 'Sparkles' },
    { name: '내 작품', path: ROUTES.studentComicList, iconName: 'FolderHeart' },
    { name: 'AI 진단 평가', path: ROUTES.studentEvaluations, iconName: 'Brain' },
    { name: '내 성장 그래프', path: ROUTES.studentProgress, iconName: 'TrendingUp' },
  ],
  guest: [
    { name: '공개 작품 보기', path: ROUTES.shareView, iconName: 'Eye' },
  ],
};
