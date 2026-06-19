export const ROUTES = {
  // Public
  home: '/',
  login: '/login',
  signup: '/signup',

  // Student
  studentHome: '/student',
  studentComicList: '/student/comics',
  studentComicNew: '/student/comics/new',
  studentComicEdit: '/student/comics/:id/edit',
  studentComicResult: '/student/comics/:id/result',
  studentEvaluations: '/student/evaluations',
  studentProgress: '/student/progress',

  // Teacher
  teacherHome: '/teacher',
  teacherClasses: '/teacher/classes',
  teacherStudents: '/teacher/students',
  teacherAssignments: '/teacher/assignments',
  teacherComics: '/teacher/comics',
  teacherEvaluations: '/teacher/evaluations',

  // Org Admin (Center Admin)
  adminHome: '/admin',
  adminClasses: '/admin/classes',
  adminTeachers: '/admin/teachers',
  adminStudents: '/admin/students',
  adminComics: '/admin/comics',
  adminEvaluations: '/admin/evaluations',
  adminUsage: '/admin/usage',
  adminSettings: '/admin/settings',

  // Super Admin
  superAdminHome: '/super-admin',
  superAdminOrganizations: '/super-admin/organizations',
  superAdminUsers: '/super-admin/users',
  superAdminCurriculum: '/super-admin/curriculum',
  superAdminComics: '/super-admin/comics',
  superAdminEvaluations: '/super-admin/evaluations',
  superAdminUsage: '/super-admin/usage',
  superAdminSettings: '/super-admin/settings',

  // Share
  shareView: '/share/:shareSlug',

  // Legacy/Temp Editor path
  legacyEditor: '/toon',
} as const;
