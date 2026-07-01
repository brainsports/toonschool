import { Routes, Route } from 'react-router-dom'
import Layout from '../shared/components/Layout'
import Dashboard from '../pages/Dashboard'
import HomePage from '../pages/HomePage'
import NotFound from '../pages/NotFound'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import MyPage from '../pages/MyPage'
import SuperAdminLayout from '../modules/super-admin/components/SuperAdminLayout'
import SuperAdminDashboard from '../modules/super-admin/pages/SuperAdminDashboard'
import CenterManagementPage from '../modules/super-admin/pages/CenterManagementPage'
import UserManagementPage from '../modules/super-admin/pages/UserManagementPage'
import PlanManagementPage from '../modules/super-admin/pages/PlanManagementPage'
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
        <Route path="super-admin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="centers" element={<CenterManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="plans" element={<PlanManagementPage />} />
        </Route>
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
      <Route path="/book/:slug" element={<SharedComicViewerPage />} />

      {/* 관리 LMS 라우트 */}
      <Route path="/admin/lms" element={<AdminLMSLayout />}>
        <Route index element={<AdminLMSPage />} />
        <Route path="classes" element={<ClassManagementPage />} />
        <Route path="students" element={<AdminStudentManagementPage />} />
        <Route path="assessments" element={<AssessmentPage />} />
        <Route path="teachers" element={<TeacherManagementPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
    </Routes>
  )
}
