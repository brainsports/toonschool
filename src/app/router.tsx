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
import StudentManagementPage from '../modules/center-admin/pages/StudentManagementPage'
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

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="mypage" element={<MyPage />} />
        <Route path="super-admin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="centers" element={<CenterManagementPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="plans" element={<PlanManagementPage />} />
        </Route>
        <Route path="center-admin" element={<CenterAdminLayout />}>
          <Route index element={<CenterAdminDashboard />} />
          <Route path="students" element={<StudentManagementPage />} />
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
    </Routes>
  )
}
