// /student/back-cover 진입 시 '창작' 과목 여부에 따라 분기.
// - '창작': AI 뒷표지 워크스페이스(CreationBackCoverWorkspace)
// - 그 외(기존 5개 교과목): 기존 StudentBackCoverPage를 그대로 렌더(수정 없음).
// 기존 5과목 화면·데이터 흐름은 이 래퍼로 인해 전혀 변경되지 않는다.
import { useLocation, useNavigate } from 'react-router-dom';
import { projectStorage } from '../utils/projectStorage';
import type { StudentUnitSelection } from '../types/studentCurriculum';
import StudentBackCoverPage from '../pages/StudentBackCoverPage';
import CreationBackCoverWorkspace from '../components/cover/CreationBackCoverWorkspace';
import StudentWorkspaceLayout from '../components/layout/StudentWorkspaceLayout';

export default function BackCoverRoute() {
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = location.state as { projectId?: string } | null;
  const projectId =
    locationState?.projectId || localStorage.getItem('currentProjectId') || '';
  const selection = projectId
    ? projectStorage.loadUnit<StudentUnitSelection>(projectId)
    : null;

  if (selection?.subjectName === '창작' && projectId) {
    const goPrev = () =>
      navigate('/student/unit-summary', { state: { projectId } });
    return (
      <StudentWorkspaceLayout
        currentStep="backCover"
        title="뒷표지 만들기"
        subtitle="앞표지와 이어지는 뒷표지를 만들어요"
        onBack={goPrev}
        bgVariant="pastel"
      >
        <CreationBackCoverWorkspace
          selection={selection}
          projectId={projectId}
          onPrev={goPrev}
        />
      </StudentWorkspaceLayout>
    );
  }

  // 기존 5개 교과목 — 페이지를 그대로 렌더한다.
  return <StudentBackCoverPage />;
}
