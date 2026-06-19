# 툰스쿨 라우팅 설계 문서 (toonschool-routing-plan)

본 문서는 툰스쿨의 URL 경로 구조와 각 라우트별 권한 보호 정책, 레이아웃 적용 매핑을 정의합니다.

---

## 1. 라우트 분류 및 접근 권한

툰스쿨의 모든 라우트는 보안 수준 및 사용자 역할에 따라 4가지 그룹으로 엄격하게 격리합니다.

### 1-1. 공개 라우트 (Public Routes)
*   **비로그인/일반 방문자** 모두 접근할 수 있는 페이지입니다.
*   로그인 상태여도 정상적으로 접근이 가능해야 합니다.
*   **대상 경로**:
    *   `/` : 서비스 홍보 및 소개 메인 페이지
    *   `/login` : 사용자 로그인 화면
    *   `/signup` : 사용자 회원가입 화면 (비로그인 상태 전용)

### 1-2. 공유 라우트 (Share Routes)
*   **외부 게스트(guest)**가 학습툰 공유 링크를 타고 들어왔을 때 열리는 뷰어 화면입니다.
*   로그인이 불필요하며, 특정 만화에 부여된 고유 식별자(`shareSlug`)만 가지고 DB에서 읽기 전용으로 조회합니다.
*   **대상 경로**:
    *   `/share/:shareSlug` : 공개 만화 뷰어 페이지

### 1-3. 학생 전용 라우트 (Student Protected Routes)
*   **student** 권한을 가진 사용자만 진입할 수 있는 라우트입니다.
*   교사나 관리자가 진입 시 적절한 경고와 함께 각자의 대시보드로 리다이렉트되어야 합니다.
*   **대상 경로**:
    *   `/student` : 학생 대시보드 (진행 중인 만화 목록, 과제 확인)
    *   `/student/comics` : 학생이 작성한 만화 목록 전체 조회
    *   `/student/comics/new` : 새로운 학습툰 생성 초기 폼 (주제 입력, 캐릭터 설정 등)
    *   `/student/comics/:id/edit` : 학습툰 만화/대사/퀴즈 에디터 (밝은 테마의 전용 레이아웃)
    *   `/student/comics/:id/result` : 완성된 만화의 요약본 및 AI 진단 평가 결과 리포트 페이지
    *   `/student/evaluations` : AI 진단 이력 및 오답 퀴즈 목록
    *   `/student/progress` : 자율 학습 현황 및 과목별 성장 그래프

### 1-4. 관리자/교사 전용 보호 라우트 (Admin & Teacher Protected Routes)
*   기관 관리자(`org_admin`), 교사(`teacher`), 최고 관리자(`super_admin`) 전용 보호 라우트입니다.
*   각 라우트는 사용자의 `role` 세션 정보가 지정된 그룹에 속하는지 라우팅 가드(Guard)를 통해 2차 검증을 수행합니다.

---

## 2. 권장 라우팅 리스트 및 레이아웃 매핑

| 대분류 | URL 경로 | 대응 컴포넌트 | 접근 가능 역할 | 적용 레이아웃 |
| :--- | :--- | :--- | :--- | :--- |
| **공동** | `/` | `HomePage` | Guest / All | 랜딩/메인 기본 레이아웃 |
| **공동** | `/login` | `LoginPage` | Guest Only | 단독 로그인 레이아웃 |
| **공동** | `/signup` | `SignupPage` | Guest Only | 단독 회원가입 레이아웃 |
| **학생** | `/student` | `StudentDashboard` | `student` | 학생 대시보드 레이아웃 (어두운 사이드바 없음) |
| **학생** | `/student/comics` | `StudentComicList` | `student` | 학생 대시보드 레이아웃 (어두운 사이드바 없음) |
| **학생** | `/student/comics/new` | `StudentComicCreator` | `student` | 학생 에디터 레이아웃 (밝은 테마, 단독 화면) |
| **학생** | `/student/comics/:id/edit`| `ToonEditor` | `student` | 학생 에디터 레이아웃 (밝은 테마, 단독 화면) |
| **학생** | `/student/comics/:id/result`| `StudentComicResult`| `student` | 학생 에디터 레이아웃 (밝은 테마, 단독 화면) |
| **학생** | `/student/evaluations`| `StudentEvaluations` | `student` | 학생 대시보드 레이아웃 (어두운 사이드바 없음) |
| **학생** | `/student/progress` | `StudentProgress` | `student` | 학생 대시보드 레이아웃 (어두운 사이드바 없음) |
| **교사** | `/teacher` | `TeacherDashboard` | `teacher` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **교사** | `/teacher/classes` | `TeacherClassPage` | `teacher` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **교사** | `/teacher/students` | `TeacherStudentPage`| `teacher` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **교사** | `/teacher/assignments` | `TeacherAssignment` | `teacher` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **교사** | `/teacher/comics` | `TeacherComicMonitor`| `teacher` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **교사** | `/teacher/evaluations`| `TeacherEvaluation` | `teacher` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **기관** | `/admin` | `AdminDashboard` | `org_admin` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **기관** | `/admin/classes` | `AdminClassPage` | `org_admin` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **기관** | `/admin/teachers` | `AdminTeacherPage` | `org_admin` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **기관** | `/admin/students` | `AdminStudentPage` | `org_admin` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **기관** | `/admin/comics` | `AdminComicPage` | `org_admin` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **기관** | `/admin/evaluations`| `AdminEvaluation` | `org_admin` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **기관** | `/admin/usage` | `AdminUsagePage` | `org_admin` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **기관** | `/admin/settings` | `AdminSettingsPage` | `org_admin` | 관리자 계열 레이아웃 (좌측 사이드바 + 상단 헤더) |
| **슈퍼** | `/super-admin` | `SuperAdminDash` | `super_admin` | 최고관리자 전용 사이드바 레이아웃 |
| **슈퍼** | `/super-admin/organizations`| `SuperOrgManage` | `super_admin` | 최고관리자 전용 사이드바 레이아웃 |
| **슈퍼** | `/super-admin/users` | `SuperUserManage` | `super_admin` | 최고관리자 전용 사이드바 레이아웃 |
| **슈퍼** | `/super-admin/curriculum` | `SuperCurriculum` | `super_admin` | 최고관리자 전용 사이드바 레이아웃 |
| **슈퍼** | `/super-admin/comics` | `SuperComicManage` | `super_admin` | 최고관리자 전용 사이드바 레이아웃 |
| **슈퍼** | `/super-admin/evaluations`| `SuperEvalManage` | `super_admin` | 최고관리자 전용 사이드바 레이아웃 |
| **슈퍼** | `/super-admin/usage` | `SuperUsageManage` | `super_admin` | 최고관리자 전용 사이드바 레이아웃 |
| **슈퍼** | `/super-admin/settings` | `SuperSysSettings` | `super_admin` | 최고관리자 전용 사이드바 레이아웃 |
| **공유** | `/share/:shareSlug` | `ToonShareViewer` | Guest / All | 공유 전용 헤더 레이아웃 (사이드바 없음) |

---

## 3. 임시 에디터 경로 처리 원칙 (`/toon`)

기존의 테스트용 경로인 `/toon`은 다음과 같이 정리합니다.

1.  **임시 유지**: MVP 테스트 단계 및 내부 레이아웃 작업 검증 시에는 기존 컴포넌트 동작을 보증하기 위해 임시로 `/toon` 경로를 활성화 상태로 유지합니다.
2.  **정식 경로로의 이관**: 차후 학생 전용 에디터 개발이 완성되면 `/toon`으로 접속하는 요청은 자동으로 `/student/comics/:id/edit` 경로로 안전하게 리다이렉트 처리 또는 교체하며, 최종 프로덕션 빌드에서는 해당 임시 라우트를 제거합니다.
