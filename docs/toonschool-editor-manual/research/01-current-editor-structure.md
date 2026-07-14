# 01. 툰스쿨에디터 실제 구조 조사

> 코드 기반 조사 (2026-07-14). 파일 경로는 저장소 루트 기준. 브라우저 확인은 별도 표시.

## 1. 로그인 및 진입 경로

- 로그인 라우트: `/login` (`src/pages/Login.tsx`). 학생 모드는 `?mode=student` 로 진입 (`src/shared/components/PublicLayout.tsx:45`).
- 입력 항목: “이메일 또는 학생 아이디”, “비밀번호”(눈 모양 토글), “아이디 저장” 체크박스. 제출 버튼: `로그인`.
- 로그인 후 이동: 학생은 **`/student/mypage`** 로 이동 (`Login.tsx:131`). (대시보드(`/student`)가 아님.)
- 권한 가드: `RequireStudent`(`src/shared/components/RequireStudent.tsx`)가 학생 여부 검사, 미인증 시 `/login?mode=student&redirect=...`.
- 비고: “아이디 찾기/비밀번호 찾기” 버튼은 핸들러 없음(미구현).

## 2. 실제 제작 단계 순서 (좌측 단계 표시 기준)

좌측 단계 표시 컴포넌트: `src/modules/student/components/layout/StudentFlowSidebar.tsx` (헤더 “작품 제작 흐름”, 8단계). `StudentWorkspaceLayout.tsx:46` 에서 렌더.

| # | 단계명(아이콘) | 라우트 | 페이지 파일 |
|---|---|---|---|
| 1 | 단원 선택 📚 | `/student/select-unit` | `StudentUnitSelectPage.tsx` |
| 2 | 주제 만들기 ✨ | `/student/topic` | `StudentTopicMakerPage.tsx` |
| 3 | 대본 만들기 📝 | `/student/script` | `StudentScriptPage.tsx` → `StudentScriptEditor.tsx` |
| 4 | 표지만들기 📘 | `/student/front-cover` | `StudentFrontCoverPage.tsx` → `StudentCanvasEditor.tsx` |
| 5 | 만화제작 💬 | `/student/comic/full` | `StudentComicFullViewPage.tsx` |
| 6 | 단원 정리 📝 | `/student/unit-summary` | `StudentUnitSummaryPage.tsx` |
| 7 | 뒤표지 꾸미기 🎨 | `/student/back-cover` | `StudentBackCoverPage.tsx` |
| 8 | 만화보기 🖼️ | `/student/comic/read` | `StudentComicViewerPage.tsx` |

- 마이페이지에서 `툰스쿨 에디터 입장` 버튼 → `/student/select-unit`(`StudentMyPage.tsx:196`).
- 단계별 이동은 각 페이지의 다음 버튼이 `navigate(...)` 호출. 완료/현재 단계만 클릭 가능, 미래 단계는 잠금.

## 3. 단계별 핵심 동작과 버튼 문구

### 1) 단원 선택 (`StudentUnitSelectPage.tsx`)
- 2단계 선택. 제목 “어떤 모험을 떠날까요?”.
- 1단계: 학년(`초3~초6`, Supabase `curriculum_units` 동적) + 학기(`1학기/2학기` 고정). 버튼 `다음 단계 🚀`.
- 2단계: 과목(Supabase `subjects`, 국어✏️/영어🌍/수학📐/사회🗺️/과학🔬) + 대단원(`curriculum_units` 드롭다운) + 중단원(`curriculum_subunits`). 버튼 `주제 만들기 ✨`.
- **핵심어(키워드)는 이 페이지에 없음.** 주제 만들기 페이지에 있음.

### 2) 주제 만들기 (`StudentTopicMakerPage.tsx`) — 핵심어 + 주제
- AI 모드 2서브스텝: `keyword` → `topic`.
- 키워드: “이야기 키워드를 골라주세요”, 버튼 `키워드 추천 ✨` / `키워드 2개 더 보기 ✨`. 최대 10개 추천, 최초 2개 노출, **최대 4개 선택**.
- 주제: `이 키워드로 주제 만들기 ✨` → 2개씩 생성(`+2개 더 보기`, 최대 10). `대본 만들기 🚀` 로 이동.
- 수동 모드 링크: “키워드 선택 없이 직접 내용을 입력해서 만들래요”.

### 3) 대본 만들기 (`StudentScriptEditor.tsx`)
- 6컷 구조. 패널 “AI 대본 만들기”, 버튼 `AI 생성하기` / `AI로 다시 만들기`. 2단계 로딩(“1단계: 대본 생성중…”, “2단계: 표지 내용 생성중…”).
- 도구 탭: `AI 생성` / `컷 편집` / `핵심 개념` / `표지 대화`(`ScriptToolbar.tsx`).
- 진행 조건: 대본 + 핵심개념 3개 + 표지대화 3개(하나/도윤/서아). 다음 버튼 `표지만들기`.

### 4) 표지만들기 (`StudentFrontCoverPage.tsx` → `StudentCanvasEditor.tsx`)
- 캔버스 에디터(과목별 표지 배경 자동 선택). 버튼 `표지 만들기`(완성 처리) → `만화 만들기`.
- 텍스트 자동 배치: 학년·학기, 학습 주제, 핵심개념 1/2/3, 표지 대화(하나/도윤/서아).

### 5) 만화제작 6컷 (`StudentComicFullViewPage.tsx`)
- 2×3 그리드 6컷 캔버스(A4 비, 가로 750px). 제목 “만화제작 (6컷)”.
- 세로 도구바: `선택` `캐릭터` `대사` `말풍선` `배경` `레이어`(활성색 `#ff2778`).
- 확대/축소: `StudentZoomControl`(줌인/아웃/화면맞춤, 25~300%, Ctrl+휠).
- 배경 생성: `배경 모두 생성`(1~6컷 순차), `대사 생성`(말풍선 배치). 배경 재생성은 컷당 1회.
- 안내: “만화제작은 최대 15분이 소요될수 있습니다”. 컷 클릭/더블클릭으로 상세 편집.
- 다음: `단원 정리 →`(그림 없는 컷 있으면 확인창).

### 6) 단원 정리 (`StudentUnitSummaryPage.tsx`) — 세상 속 이야기 + OX
- 제목 “단원 정리”, 부제 “세상과 연결하고, 내가 문제를 만들어 봐요!”.
- A. 세상 속 이야기: 탭 `역사 이야기` / `최신 이야기` / `생활 연결`. 버튼 `세상 속 이야기 만들기` / `세상 속 이야기 완료`. **“생활 속 이야기” = `생활 연결` 탭.**
- B. 문제 만들기: “OX 문제 5개 만들기”(뱃지 “수정 가능”). 버튼 `OX 문제 만들기` / `OX 문제 완료`. 문제 텍스트 편집 + O/X 정답 토글.
- 다음: `뒤표지 만들기`.

### 7) 뒤표지 꾸미기 (`StudentBackCoverPage.tsx`)
- 폼 + 미리보기(`SNSBackCoverPreview`). 입력: 지은이/학년·반/과목/단원/주제/만든 날짜. 과목별 배경색 + 투명도 슬라이더.
- 버튼 `정보 생성하기`, `만화 보기 🖼️`(완료 보상 지급 트리거 포함).

### 8) 만화보기 (`StudentComicViewerPage.tsx`) — 플립북
- 진입 시 오버레이 “축하합니다. 이제 해피타임!” + `책 펼치기`.
- 페이지 조립: 표지1 + 만화6 + 세상속이야기(최대3) + OX(최대5) + 뒤표지1.
- 하단 플레이어: 처음/이전/페이지/다음/마지막 + 메뉴(확대/화면맞춤/자동넘김/음악/전체화면).
- 버튼: `PDF 다운로드`, `친구에게 자랑하기`(공유).

## 4. 저장 구조

- **1차 저장 = 브라우저 localStorage(LZString 압축).** `src/modules/student/utils/projectStorage.ts`.
- 키(prefix `toonschool:` + `:${projectId}`): `unit` `topic` `script` `front-cover` `summary` `back-cover`. 컷별: `toonschool:comic:${projectId}:cut:${cutNumber}`(`comicStorage.ts`). 마스터: `comic_project_data_${projectId}`.
- 저장 방식: 동작 시 수동 저장(토스트 “저장되었습니다”) + 만화컷/단원정리/뒤표지는 변경마다 자동 저장.
- Supabase 테이블: `generation_jobs`(배경 생성 작업), `comic_assets`(컷 배경 이미지, Storage `cuts/${projectId}/`), `shared_comic_books`(공유 시), `students`(뒤표지에서 학생 정보 읽기). 보상/성장: `grantComicCompleteReward`, `createGrowthEvaluationForSharedComic`.

## 5. 작품 완성 흐름

- 단일 “완료” 플래그는 없음. 뒤표지 저장(`만화 보기` 버튼)이 완료 보상(`grantComicCompleteReward`) 트리거.
- 만화보기에서 `친구에게 자랑하기` → `shared_comic_books` 행 생성 → 마이페이지에서 `shared`(진행률 100)로 표시.

## 6. 플립북 및 공유 흐름

- 공유 버튼: 만화보기 우상단 `친구에게 자랑하기`(`StudentComicViewerPage.tsx:744`) + 마이페이지 WorkCard 공유 아이콘.
- 공유 생성(`handleShare`): 기존 `shared_comic_books` 중복 확인 → 랜덤 6자리 slug → **html2canvas 로 각 페이지 이미지 베이킹**(scale 1.5, JPEG 0.85) → Storage `shared-comic-books/${slug}/page-NN.jpg` 업로드 → `shared_comic_books` 행 삽입(`slug, project_id, title, subject, student_name, grade, thumbnail_url, pages, is_public`).
- 공유 링크: `${VITE_PUBLIC_SITE_URL 또는 origin}/book/${slug}`. 모달: “친구에게 보여줄 플립북 링크가 만들어졌어요!” + `링크 복사하기` / `새 창에서 보기`.
- 열람: `/book/:slug` → `SharedComicViewerPage.tsx`(공개, `slug.eq.slug AND is_public.eq.true` 조회, 베이킹된 이미지 표시). 오버레이 “친구가 만든 만화책이 도착했어요!” + `책 펼치기`.

## 7. 마이페이지 작품 목록

- `StudentMyPage.tsx` → `getStudentWorks()` 가 `toon_projects`(레거시) + `shared_comic_books`(공유) 조회.
- 상단 `툰스쿨 에디터 입장` 버튼 → `/student/select-unit`.
- WorkCard: 과목 뱃지, 제목, 진행률, 공유 아이콘. 공유 작품 클릭 → `/book/slug`, 미완성 → `/student/select-unit?projectId=...`.

## 8. 미구현/레거시/주의 (별도 보고 대상)

- `/student`(StudentDashboard): 목 데이터, 버튼이 `/toon`(레거시 에디터)로 연결. 로그인 후 도달 안 함.
- `/student/quiz/intro`(마무리 퀴즈): 목 데이터, 메인 흐름 아님.
- `/student/comic/cut/:cutNumber`: 별도 컷 편집기, 메인 흐름에서 도달 안 됨(만화제작은 인페이지 그리드 사용).
- 만화제작 Undo/Redo 버튼: `disabled`(비활성).
- 로그인 “아이디/비밀번호 찾기”: 핸들러 없음.
- 마이페이지에서 미완성 작품 이어하기: `?projectId=` 가 `StudentUnitSelectPage`에서 무시됨(이어하기 미작동).
- 단원선택 1단계 뒤로가기가 `/student/dashboard`(레거시)로 감.

## 9. 코드 근거 파일 경로

- 라우터: `src/app/router.tsx`
- 흐름 사이드바/레이아웃: `src/modules/student/components/layout/StudentFlowSidebar.tsx`, `StudentWorkspaceLayout.tsx`
- 저장: `src/modules/student/utils/projectStorage.ts`, `src/modules/student/components/editor/utils/comicStorage.ts`
- 페이지: `src/modules/student/pages/Student{MyPage,UnitSelectPage,TopicMakerPage,ScriptPage,FrontCoverPage,ComicFullViewPage,UnitSummaryPage,BackCoverPage,ComicViewerPage}.tsx`, `SharedComicViewerPage.tsx`
- 서비스: `src/modules/student/services/{studentCurriculumService,studentWorkService,studentComicService}.ts`
- 로그인: `src/pages/Login.tsx`, `src/shared/components/RequireStudent.tsx`

> 브라우저 확인 상태: **코드만 확인**. 테스트 학생 계정/작품 없어 실제 화면 캡처는 미수행(→ 04, 05 참조).
