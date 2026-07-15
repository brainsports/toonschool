# Stage 5A 사전 조사 — 학생 라이브 뷰어(StudentComicViewerPage)

> 2026-07-15. 실제 코드 기준(`StudentComicViewerPage.tsx`, 1053행). 추측 금지.

## 1. 라우트·진입 흐름
- 라우트 `/student/comic/read` (`router.tsx:130`), `<RequireStudent>` 뒤(로그인 필요).
- 작품 식별: `location.state.projectId || location.state.topic?.id || localStorage.currentProjectId` (`:188-190`).
- 새로고침 복구: `localStorage.currentProjectId` 가 남아 있으면 복원. state 없으면 localStorage fallback.
- 빈 작품: `if (!projectData || pages.length === 0)` → 친절한 안내 화면 + "단원 선택으로 가기"(`/student/select-unit`) 버튼 (`:354-369`).
- 뒤로가기: `StudentWorkspaceLayout onBack → navigate('/student/back-cover', {state})` (`:732`).

## 2. 데이터 로드 (`:187-230`)
전량 localStorage(LZString). `loadComicProjectData(projectId)` → ComicProjectData; `projectStorage.loadFrontCover/Summary/BackCover`; `loadComicCutData(id,1..6)`. 실패/빈 값이면 해당 페이지 skip(조건부 push).

## 3. 페이지 조립 (ViewerPage[], `:203-227`)
`[front-cover, comic-cut 1..6(조건부), story-history, story-current(latest), story-life(조건부), ox-quiz 1..5(조건부), back-cover]`. 가변 길이. 페이지 번호 = `pages.indexOf(page)+1`.

## 4. spread 조립 — ★단일 페이지★
- `getSpreads(totalCount)` = 페이지마다 `{pages:[pageIndex, null]}` (`:81-83`). 즉 spread 1개 = 페이지 1장.
- 화면 렌더는 항상 `renderHalf(spreads[i].pages[0], true)` — `pages[0]`만(`:883,889,903,906`). 좌/우 2면 아님.
- 표지·뒤표지도 단독 1페이지(빈 면 없음).
- 페이지 표시: `getPageIndicatorText()` = `${pageIndex+1} / ${pages.length}` (`:507-511`).
- **메모리 `flipbook-architecture`("단일 가로 페이지, CSS 3D rotateY 플립")와 일치. 공유 뷰어만 2면 spread.**

## 5. 확대·축소 (`:234-246`, PageWrapper `:44-68`)
- `currentZoom` = `zoomPercent ?? round(fitScale*100)`. `BASE_WIDTH=1200`, `BASE_HEIGHT=1200/FLIPBOOK_PAGE_RATIO`(A4 ≈848).
- 컨테이너 크기 = `BASE_WIDTH*(zoom/100) × BASE_HEIGHT*(zoom/100)` (`:874-875`). zoom이 컨테이너 크기를 직접 결정.
- `PageWrapper`가 컨테이너 폭 측정 → `scale=clientWidth/FLIPBOOK_PAGE_WIDTH(1400)` 로 1400×990 콘텐츠를 컨테이너에 맞춤. **실질 단일 scale(PageWrapper)**, 입력(컨테이너 폭)을 zoom이 제어. ResizeObserver 1곳(`:56-57`). window resize 리스너(`:173-185`, 50ms 재측정).
- 컨트롤: 하단 바 메뉴(확대/축소/화면맞춤, `:942-944`), 우하 `StudentZoomControl`(`:967-975`). 범위 25~300%.

## 6. 플립 애니메이션 (`:312-351`, `:880-910`, CSS `:771-863`)
- 상태: `currentSpreadIndex`, `isFlipping`, `flipDirection('next'|'prev')`, `targetSpreadIndex`.
- `handleNext/Prev`: 끝/처음 제한, 1100ms 타임아웃 후 인덱스 확정. 입력 잠금(isFlipping).
- 렌더: 단일 페이지 flip — 앞면=현재 페이지, 뒷면=타겟 페이지(`rotateY(180deg)`, backface hidden). CSS `flipNextAnim/flipPrevAnim`(rotateY ∓180), pageCurl 반경/그림자, spine shadow. perspective 2400px.
- 키보드: ←/→ (`:343-351`). 처음/마지막/자동넘김/음악/전체화면 메뉴.
- 외부 플립북 라이브러리 없음(자체 CSS 3D).

## 7. 캡처·PDF·공유 결합 (5A 미수정 영역)
- `renderPdfPage(page)` = `pdfPageBaseStyle(1123×794)` 안 `1400×990 × PDF_SCALE` 박스 → `renderFlipPage` (`:491-497`).
- 숨겨진 캡처 컨테이너 `pdfCaptureRef`가 `pages.map → data-pdf-page` 1123×794 노드들 렌더(`:978-1007`).
- `handleDownloadPdf`(`:512-570`): `[data-pdf-page]` html2canvas(scale 2) → jsPDF A4 landscape [1123,794].
- `handleShare`(`:572-725`): 동일 캡처 → Storage `shared-comic-books/${slug}` → shared_comic_books insert.
- **모두 `renderFlipPage`(구 1400×990)에 의존.** 5A에서 renderFlipPage를 그대로 두면 캡처/PDF/공유는 종래 디자인·A4로 동작(깨지지 않음). 화면만 신규 파스텔로 전환.

## 8. 데이터 구조 → 신규 매퍼 입력 (Stage 1~4 매퍼 재사용)
| 신규 모델 | 원본 입력 | 매퍼 |
|---|---|---|
| FlipbookCoverPage | EditorState(표지) + ComicProjectData + 뒤표지 객체 + firstComicImage | mapCover |
| FlipbookComicPage | ComicCutEditData + scriptCut + ComicProjectData | mapComic |
| FlipbookStoryPage | WorldStory + ComicProjectData | mapStory |
| FlipbookQuizPage | OXQuestion + ComicProjectData | mapQuiz |
| FlipbookBackCoverPage | 뒤표지 객체 + ComicProjectData + firstComicImage | mapBackCover |
매퍼는 `mapViewerPages(ViewerPage[], FlipbookMapContext)` 로 일괄 변환(이미 구축). ctx = {project, backCover, firstComicImageUrl}.

## 9. 단일 scale 통합 방안(화면 전환)
- FlipbookPageFrame 에 `fitMode: 'self'|'fixed'` 추가('fixed'는 현재 captureMode와 동일=1600×900 고정·self-fit 없음). 미리보기는 기존 'self' 유지.
- 화면: PageWrapper 내부 박스를 1400×990 → **1600×900**, scale=`clientWidth/1600` 로 변경. BASE 높이를 16:9(=BASE_WIDTH*9/16)로 조정. FlipbookPageFrame `fitMode='fixed'` 로 1600×900 고정 렌더 → PageWrapper가 단일 scale 적용. 만화 씬 내부 `computeComicScale`은 종래대로 별도(페이지 scale 아님).
- 캡처/PDF/공유는 renderFlipPage(구) 경로 유지 → 5A 미수정.

## 10. ★갈등: 단일 페이지(현행) vs 양면 펼침(요청 §6/7/8/11)
- 현행 학생 뷰어 = **단일 페이지**(코드·메모리 확인).
- 요청 §6/7/8/11 = **양면 펼침**(3200×900, 좌/우, spread 모델) 명시.
- 두 방향은 구조적으로 완전히 다름(getSpreads, 컨테이너 폭, flip 애니메이션 단일→2면 전환, 표지/뒤표지 처리).
- **방향 결정 필요**: (A) 현행 단일 페이지 유지(저위험, 기존 동작 보존 부합) vs (B) 양면 펼침 신규 구축(§6~8 의도, 고위험·플립 애니메이션 대폭 재작성).
