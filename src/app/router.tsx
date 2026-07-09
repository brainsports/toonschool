import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../shared/components/Layout'
import Dashboard from '../pages/Dashboard'
import HomePage from '../pages/HomePage'
import NotFound from '../pages/NotFound'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import MyPage from '../pages/MyPage'
import SuperAdminLayout from '../modules/admin-super/components/SuperAdminLayout'
import SuperDashboard from '../modules/admin-super/pages/SuperDashboard'
import SuperMiddleAdminManagement from '../modules/admin-super/pages/MiddleAdminManagement'
import SuperTeacherManagement from '../modules/admin-super/pages/TeacherManagement'
import SuperOrganizationManagement from '../modules/admin-super/pages/OrganizationManagement'
import SuperLicenseManagement from '../modules/admin-super/pages/LicenseManagement'
import SuperNotificationManagement from '../modules/admin-super/pages/NotificationManagement'
import SuperResourceManagement from '../modules/admin-super/pages/ResourceManagement'
import SuperAuditLogPage from '../modules/admin-super/pages/AuditLogPage'
import CenterAdminLayout from '../modules/center-admin/components/CenterAdminLayout'
import CenterAdminDashboard from '../modules/center-admin/pages/CenterAdminDashboard'
import StudentManagementPageLegacy from '../modules/center-admin/pages/StudentManagementPage'
import ProgressPage from '../modules/center-admin/pages/ProgressPage'
import EvaluationPage from '../modules/center-admin/pages/EvaluationPage'
import StudentDashboard from '../modules/student/pages/StudentDashboard'
import StudentUnitSelectPage from '../modules/student/pages/StudentUnitSelectPage'
import StudentTopicMakerPage from '../modules/student/pages/StudentTopicMakerPage'
import StudentFrontCoverPage from '../modules/student/pages/StudentFrontCoverPage'
import StudentScriptPage from '../modules/student/pages/StudentScriptPage'
import StudentComicFullViewPage from '../modules/student/pages/StudentComicFullViewPage'
import StudentComicCutPage from '../modules/student/pages/StudentComicCutPage'
import ToonEditor from '../modules/toon/pages/ToonEditor'
import ToonViewer from '../modules/toon/pages/ToonViewer'
import QuizPage from '../modules/quiz/pages/QuizPage'
import AnalyticsDashboard from '../modules/analytics/pages/AnalyticsDashboard'

import StudentUnitSummaryPage from '../modules/student/pages/StudentUnitSummaryPage'
import StudentQuizMakerPage from '../modules/student/pages/StudentQuizMakerPage'
import StudentBackCoverPage from '../modules/student/pages/StudentBackCoverPage'
import StudentComicViewerPage from '../modules/student/pages/StudentComicViewerPage'
import SharedComicViewerPage from '../modules/student/pages/SharedComicViewerPage'
import StudentMyPage from '../modules/student/pages/StudentMyPage'
import StudentResourcePage from '../modules/student/pages/StudentResourcePage'
import StudentDreamGardenPage from '../modules/student/pages/StudentDreamGardenPage'

import ResourceInbox from '../modules/resources/pages/ResourceInbox'

import AIContentPage from '../pages/AIContentPage'
import FlippedLearningPage from '../pages/FlippedLearningPage'
import LMSPage from '../pages/LMSPage'
import PWAPage from '../pages/PWAPage'
import PricingPage from '../pages/PricingPage'
import FAQPage from '../pages/FAQPage'

// 관리 LMS
import AdminLMSLayout from '../modules/admin-lms/components/AdminLMSLayout'
import AdminLMSPage from '../modules/admin-lms/pages/AdminLMSPage'
import ClassManagementPage from '../modules/admin-lms/pages/ClassManagementPage'
import AdminStudentManagementPage from '../modules/admin-lms/pages/StudentManagementPage'
import AssessmentPage from '../modules/admin-lms/pages/AssessmentPage'
import TeacherManagementPage from '../modules/admin-lms/pages/TeacherManagementPage'
import AdminProfilePage from '../modules/admin-lms/pages/AdminProfilePage'

// 기관관리자 라우트
import OrgAdminLayout from '../modules/admin-org/components/OrgAdminLayout'
import OrgAdminDashboard from '../modules/admin-org/pages/OrgAdminDashboard'
import OrgTeacherManagement from '../modules/admin-org/pages/OrgTeacherManagement'
import OrgLicenseManagement from '../modules/admin-org/pages/OrgLicenseManagement'
import OrgNotificationSender from '../modules/admin-org/pages/OrgNotificationSender'
import OrgSentNotifications from '../modules/admin-org/pages/OrgSentNotifications'

// 중간관리자 라우트
import MiddleAdminLayout from '../modules/admin-middle/components/MiddleAdminLayout'
import MiddleDashboard from '../modules/admin-middle/pages/MiddleDashboard'
import OrganizationManagement from '../modules/admin-middle/pages/OrganizationManagement'
import OrganizationDetail from '../modules/admin-middle/pages/OrganizationDetail'
import LicenseManagement from '../modules/admin-middle/pages/LicenseManagement'
import ClassManagement from '../modules/admin-middle/pages/ClassManagement'
import TeacherManagement from '../modules/admin-middle/pages/TeacherManagement'
import StudentManagement from '../modules/admin-middle/pages/StudentManagement'
import NotificationSender from '../modules/admin-middle/pages/NotificationSender'
import MiddleSettings from '../modules/admin-middle/pages/MiddleSettings'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/ai-content" element={<AIContentPage />} />
      <Route path="/flipped-learning" element={<FlippedLearningPage />} />
      <Route path="/lms" element={<LMSPage />} />
      <Route path="/pwa" element={<PWAPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<Layout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="mypage" element={<MyPage />} />
        <Route path="super-admin/*" element={<Navigate to="/admin/super/dashboard" replace />} />
        <Route path="center-admin" element={<CenterAdminLayout />}>
          <Route index element={<CenterAdminDashboard />} />
          <Route path="students" element={<StudentManagementPageLegacy />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="evaluation" element={<EvaluationPage />} />
        </Route>
        <Route path="student" element={<StudentDashboard />} />
        <Route path="toon" element={<ToonEditor />} />
        <Route path="p/:slug" element={<ToonViewer />} />
        <Route path="p/:slug/quiz" element={<QuizPage />} />
        <Route path="analytics" element={<AnalyticsDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/student/select-unit" element={<StudentUnitSelectPage />} />
      <Route path="/student/topic" element={<StudentTopicMakerPage />} />
      <Route path="/student/script" element={<StudentScriptPage />} />
      <Route path="/student/front-cover" element={<StudentFrontCoverPage />} />
      <Route path="/student/comic/full" element={<StudentComicFullViewPage />} />
      <Route path="/student/comic/cut/:cutNumber" element={<StudentComicCutPage />} />
      <Route path="/student/unit-summary" element={<StudentUnitSummaryPage />} />
      <Route path="/student/quiz/intro" element={<StudentQuizMakerPage />} />
      <Route path="/student/back-cover" element={<StudentBackCoverPage />} />
      <Route path="/student/comic/read" element={<StudentComicViewerPage />} />
      <Route path="/student/mypage" element={<StudentMyPage />} />
      <Route path="/student/my" element={<Navigate to="/student/mypage" replace />} />
      <Route path="/student/resources" element={<StudentResourcePage />} />
      <Route path="/student/dream-garden" element={<StudentDreamGardenPage />} />
      <Route path="/book/:slug" element={<SharedComicViewerPage />} />

      {/* 관리 LMS 라우트 */}
      <Route path="/admin/lms" element={<AdminLMSLayout />}>
        <Route index element={<AdminLMSPage />} />
        {/* 공통/선생님 */}
        <Route path="classes" element={<ClassManagementPage />} />
        <Route path="students" element={<AdminStudentManagementPage />} />
        <Route path="assessments" element={<AssessmentPage />} />
        <Route path="teachers" element={<TeacherManagementPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="resources" element={<ResourceInbox />} />
        
        {/* 기관관리자 (org_admin) */}
        <Route path="organization" element={<OrgAdminDashboard />} />
        <Route path="org-teachers" element={<OrgTeacherManagement />} />
        <Route path="licenses" element={<OrgLicenseManagement />} />

        {/* 중간관리자 (middle_admin) 이전 임시라우트 (삭제 가능하지만 호환성 위해 남김) */}
        <Route path="manager" element={<Navigate to="/manager/dashboard" replace />} />
        <Route path="centers" element={<Navigate to="/manager/organizations" replace />} />
        <Route path="usage" element={<Navigate to="/manager/licenses" replace />} />
        <Route path="status" element={<Navigate to="/manager/teachers" replace />} />

        {/* 슈퍼관리자 (super_admin) */}
        <Route path="super/*" element={<Navigate to="/admin/super/dashboard" replace />} />
        <Route path="all-centers" element={<Navigate to="/admin/super/organizations" replace />} />
        <Route path="middle-admins" element={<Navigate to="/admin/super/middle-admins" replace />} />
        <Route path="all-licenses" element={<Navigate to="/admin/super/licenses" replace />} />
        <Route path="settings" element={<Navigate to="/admin/super/dashboard" replace />} />
      </Route>

      {/* 기존 기관관리자 라우트 (하위 호환성을 위해 유지) */}
      <Route path="/admin/org" element={<OrgAdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OrgAdminDashboard />} />
        <Route path="teachers" element={<OrgTeacherManagement />} />
        <Route path="licenses" element={<OrgLicenseManagement />} />
        <Route path="notifications/send" element={<OrgNotificationSender />} />
        <Route path="notifications/sent" element={<OrgSentNotifications />} />
        <Route path="resources" element={<ResourceInbox />} />
      </Route>

      {/* 중간관리자 전용 라우트 */}
      <Route path="/manager" element={<MiddleAdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MiddleDashboard />} />
        <Route path="organizations" element={<OrganizationManagement />} />
        <Route path="organizations/:organizationId" element={<OrganizationDetail />} />
        <Route path="licenses" element={<LicenseManagement />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="teachers" element={<TeacherManagement />} />
        <Route path="students" element={<StudentManagement />} />
        <Route path="notifications/send" element={<NotificationSender />} />
        <Route path="resources" element={<ResourceInbox />} />
        <Route path="settings" element={<MiddleSettings />} />
      </Route>

      {/* 수퍼관리자 전용 라우트 */}
      <Route path="/admin/super" element={<SuperAdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SuperDashboard />} />
        <Route path="middle-admins" element={<SuperMiddleAdminManagement />} />
        <Route path="organizations" element={<SuperOrganizationManagement />} />
        <Route path="teachers" element={<SuperTeacherManagement />} />
        <Route path="licenses" element={<SuperLicenseManagement />} />
        <Route path="notifications" element={<SuperNotificationManagement />} />
        <Route path="resources" element={<SuperResourceManagement />} />
        <Route path="audit-logs" element={<SuperAuditLogPage />} />
      </Route>
    </Routes>
  )
}
